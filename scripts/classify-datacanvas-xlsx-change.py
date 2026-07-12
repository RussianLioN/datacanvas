#!/usr/bin/env python3
"""Classify DataCanvas XLSX changes from OOXML without rewriting workbooks."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import tempfile
from copy import deepcopy
from html import escape
from pathlib import Path
from zipfile import BadZipFile, ZIP_DEFLATED, ZipFile, ZipInfo
from xml.etree import ElementTree as ET


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS = {"m": MAIN_NS}
CELL_REF = re.compile(r"^([A-Z]+)([1-9][0-9]*)$")
WORKSHEET_PART = re.compile(r"^xl/worksheets/sheet[0-9]+\.xml$")
MAX_ENTRIES = 512
MAX_MEMBER_BYTES = 32 * 1024 * 1024
MAX_TOTAL_BYTES = 128 * 1024 * 1024
MAX_COMPRESSION_RATIO = 200
SAMPLE_LIMIT = 50


class ClassificationError(Exception):
    pass


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def safe_members(archive: ZipFile) -> list[ZipInfo]:
    members = archive.infolist()
    if len(members) > MAX_ENTRIES:
        raise ClassificationError("XLSX has too many ZIP entries")
    total = 0
    for member in members:
        name = member.filename
        if name.startswith("/") or ".." in Path(name).parts or "\\" in name:
            raise ClassificationError("XLSX contains an unsafe ZIP path")
        if member.file_size > MAX_MEMBER_BYTES:
            raise ClassificationError("XLSX ZIP member is too large")
        total += member.file_size
        if total > MAX_TOTAL_BYTES:
            raise ClassificationError("XLSX uncompressed size exceeds the budget")
        if member.compress_size == 0 and member.file_size > 0:
            raise ClassificationError("XLSX ZIP member has an invalid compression ratio")
        if member.compress_size and member.file_size / member.compress_size > MAX_COMPRESSION_RATIO:
            raise ClassificationError("XLSX ZIP member exceeds the compression ratio budget")
    return members


def parse_xml(raw: bytes) -> ET.Element:
    upper = raw.upper()
    if b"<!DOCTYPE" in upper or b"<!ENTITY" in upper:
        raise ClassificationError("XLSX XML declarations with entities are not allowed")
    return ET.fromstring(raw)


def shared_strings(archive: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = parse_xml(archive.read("xl/sharedStrings.xml"))
    return ["".join(item.text or "" for item in node.findall(".//m:t", NS)) for node in root.findall("m:si", NS)]


def cell_value(cell: ET.Element, strings: list[str]) -> str | None:
    inline = cell.find("m:is", NS)
    if inline is not None:
        return "".join(item.text or "" for item in inline.findall(".//m:t", NS))
    value = cell.find("m:v", NS)
    if value is None:
        return None
    if cell.attrib.get("t") == "s":
        index = int(value.text or "0")
        if index < 0 or index >= len(strings):
            raise ClassificationError("XLSX shared string index is out of range")
        return strings[index]
    return value.text


def worksheet_snapshot(raw: bytes, strings: list[str]) -> dict:
    root = parse_xml(raw)
    cells: dict[str, dict] = {}
    rows: dict[int, tuple] = {}
    for row in root.findall(".//m:row", NS):
        row_number = int(row.attrib.get("r", "0"))
        rows[row_number] = tuple(sorted((key, value) for key, value in row.attrib.items() if key != "r"))
        for cell in row.findall("m:c", NS):
            ref = cell.attrib.get("r")
            if not ref or not CELL_REF.match(ref):
                continue
            formula = cell.find("m:f", NS)
            cells[ref] = {
                "value": cell_value(cell, strings),
                "formula": None if formula is None else (formula.text or ""),
                "formula_attributes": () if formula is None else tuple(sorted(formula.attrib.items())),
                "style": cell.attrib.get("s"),
                "type": cell.attrib.get("t"),
            }
    structural = deepcopy(root)
    sheet_data = structural.find("m:sheetData", NS)
    if sheet_data is not None:
        structural.remove(sheet_data)
    return {
        "cells": cells,
        "rows": rows,
        "structural": ET.tostring(structural, encoding="utf-8"),
    }


def comments_snapshot(archive: ZipFile) -> dict[str, str]:
    comments: dict[str, str] = {}
    for part in sorted(name for name in archive.namelist() if re.match(r"^xl/comments[0-9]+\.xml$", name)):
        root = parse_xml(archive.read(part))
        for comment in root.findall(".//m:comment", NS):
            ref = comment.attrib.get("ref")
            if ref:
                comments[part + ":" + ref] = "".join(item.text or "" for item in comment.findall(".//m:t", NS))
    return comments


def package_snapshot(path: Path) -> dict:
    raw_file = path.read_bytes()
    with ZipFile(path) as archive:
        members = safe_members(archive)
        names = {member.filename for member in members}
        strings = shared_strings(archive)
        sheets = {
            name: worksheet_snapshot(archive.read(name), strings)
            for name in sorted(names)
            if WORKSHEET_PART.match(name)
        }
        excluded = set(sheets) | {"xl/sharedStrings.xml", "xl/calcChain.xml"}
        excluded.update(name for name in names if re.match(r"^xl/comments[0-9]+\.xml$", name))
        package_parts = {
            name: sha256_bytes(archive.read(name))
            for name in sorted(names - excluded)
            if not name.endswith("/")
        }
        return {
            "sha256": sha256_bytes(raw_file),
            "sheets": sheets,
            "comments": comments_snapshot(archive),
            "package_parts": package_parts,
            "part_names": sorted(names),
        }


def column_and_row(ref: str) -> tuple[str, int]:
    match = CELL_REF.match(ref)
    if not match:
        raise ClassificationError("invalid cell reference")
    return match.group(1), int(match.group(2))


def semantic_signal(ref: str, signals: dict) -> None:
    column, row = column_and_row(ref)
    if row < 4:
        if column in {"H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"}:
            signals["estimateChanged"] = True
        else:
            signals["formattingChanged"] = True
        return
    if column in {"B", "C", "D", "E"}:
        signals["storyTextChanged"] = True
    elif column == "F":
        signals["priorityChanged"] = True
    elif column == "G":
        signals["scopeChanged"] = True
    elif column in {"H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"}:
        signals["estimateChanged"] = True
    else:
        signals["scopeChanged"] = True


def append_sample(samples: list[dict], sheet: str, cell: str, kind: str) -> None:
    if len(samples) < SAMPLE_LIMIT:
        samples.append({"sheet": sheet, "cell": cell, "kind": kind})


def classify(before: Path, after: Path) -> dict:
    left = package_snapshot(before)
    right = package_snapshot(after)
    signals = {
        "noChange": left["sha256"] == right["sha256"],
        "formattingChanged": False,
        "formulaCacheOnly": False,
        "estimateChanged": False,
        "priorityChanged": False,
        "storyTextChanged": False,
        "rowAddedOrRemoved": False,
        "scopeChanged": False,
    }
    samples: list[dict] = []
    structural_changes: list[str] = []
    cache_changes = 0
    changed_cells = 0
    if signals["noChange"]:
        return {
            "analyzer_version": "1.0.0",
            "signals": signals,
            "changed_cell_count": 0,
            "changed_cell_samples": [],
            "structural_changes": [],
        }

    sheet_names = sorted(set(left["sheets"]) | set(right["sheets"]))
    if set(left["sheets"]) != set(right["sheets"]):
        signals["rowAddedOrRemoved"] = True
        signals["scopeChanged"] = True
        structural_changes.append("worksheet_set")

    for sheet_name in sheet_names:
        left_sheet = left["sheets"].get(sheet_name, {"cells": {}, "rows": {}, "structural": b""})
        right_sheet = right["sheets"].get(sheet_name, {"cells": {}, "rows": {}, "structural": b""})
        if set(left_sheet["rows"]) != set(right_sheet["rows"]):
            changed_rows = set(left_sheet["rows"]) ^ set(right_sheet["rows"])
            if any(row >= 4 for row in changed_rows):
                signals["rowAddedOrRemoved"] = True
                signals["scopeChanged"] = True
        for row in set(left_sheet["rows"]) & set(right_sheet["rows"]):
            if left_sheet["rows"][row] != right_sheet["rows"][row]:
                signals["formattingChanged"] = True
                structural_changes.append(sheet_name + ":row_attributes")
                break
        if left_sheet["structural"] != right_sheet["structural"]:
            signals["formattingChanged"] = True
            structural_changes.append(sheet_name + ":worksheet_structure")

        refs = sorted(set(left_sheet["cells"]) | set(right_sheet["cells"]))
        for ref in refs:
            old = left_sheet["cells"].get(ref)
            new = right_sheet["cells"].get(ref)
            if old == new:
                continue
            changed_cells += 1
            if old is None or new is None:
                semantic_signal(ref, signals)
                append_sample(samples, sheet_name, ref, "cell_add_remove")
                continue
            same_formula = old["formula"] is not None and old["formula"] == new["formula"] and old["formula_attributes"] == new["formula_attributes"]
            only_cache = same_formula and old["value"] != new["value"] and old["style"] == new["style"] and old["type"] == new["type"]
            if only_cache:
                cache_changes += 1
                append_sample(samples, sheet_name, ref, "formula_cache")
                continue
            if old["style"] != new["style"] or old["type"] != new["type"]:
                signals["formattingChanged"] = True
            if old["value"] != new["value"] or old["formula"] != new["formula"] or old["formula_attributes"] != new["formula_attributes"]:
                semantic_signal(ref, signals)
            append_sample(samples, sheet_name, ref, "cell_change")

    comment_keys = set(left["comments"]) | set(right["comments"])
    for key in sorted(comment_keys):
        if left["comments"].get(key) == right["comments"].get(key):
            continue
        ref = key.rsplit(":", 1)[-1]
        semantic_signal(ref, signals)
        append_sample(samples, "comments", ref, "comment_change")

    if left["package_parts"] != right["package_parts"] or left["part_names"] != right["part_names"]:
        signals["formattingChanged"] = True
        structural_changes.append("ooxml_package_structure")

    substantive = any(signals[key] for key in (
        "estimateChanged",
        "priorityChanged",
        "storyTextChanged",
        "rowAddedOrRemoved",
        "scopeChanged",
    ))
    signals["formulaCacheOnly"] = cache_changes > 0 and not substantive and not signals["formattingChanged"]
    if not substantive and not signals["formattingChanged"] and cache_changes == 0:
        signals["formattingChanged"] = True
        structural_changes.append("unclassified_binary_delta")
    return {
        "analyzer_version": "1.0.0",
        "signals": signals,
        "changed_cell_count": changed_cells,
        "changed_cell_samples": samples,
        "structural_changes": sorted(set(structural_changes)),
    }


def inline_cell(ref: str, value: str, style: str | None = None) -> str:
    style_attr = "" if style is None else " s=\"" + escape(style) + "\""
    return "<c r=\"" + ref + "\" t=\"inlineStr\"" + style_attr + "><is><t>" + escape(value) + "</t></is></c>"


def numeric_cell(ref: str, value: str, formula: str | None = None) -> str:
    formula_xml = "" if formula is None else "<f>" + escape(formula) + "</f>"
    return "<c r=\"" + ref + "\">" + formula_xml + "<v>" + escape(value) + "</v></c>"


def write_test_workbook(path: Path, rows: dict[int, list[str]]) -> None:
    sheet_rows = "".join("<row r=\"" + str(number) + "\">" + "".join(cells) + "</row>" for number, cells in sorted(rows.items()))
    sheet = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><worksheet xmlns=\"" + MAIN_NS + "\"><sheetData>" + sheet_rows + "</sheetData></worksheet>"
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("xl/worksheets/sheet1.xml", sheet)


def self_test() -> None:
    with tempfile.TemporaryDirectory(prefix="datacanvas-xlsx-classifier-") as temp:
        root = Path(temp)
        before = root / "before.xlsx"
        after = root / "after.xlsx"
        write_test_workbook(before, {4: [inline_cell("C4", "old"), inline_cell("F4", "P2"), numeric_cell("H4", "5", "SUM(I4:U4)"), numeric_cell("I4", "1")]})
        write_test_workbook(after, {4: [inline_cell("C4", "new"), inline_cell("F4", "P1"), numeric_cell("H4", "6", "SUM(I4:U4)"), numeric_cell("I4", "2")], 5: [inline_cell("C5", "added")]})
        changed = classify(before, after)["signals"]
        assert changed["storyTextChanged"] and changed["priorityChanged"] and changed["estimateChanged"]
        assert changed["rowAddedOrRemoved"] and changed["scopeChanged"]

        cache_before = root / "cache-before.xlsx"
        cache_after = root / "cache-after.xlsx"
        write_test_workbook(cache_before, {4: [numeric_cell("H4", "5", "SUM(I4:U4)")]})
        write_test_workbook(cache_after, {4: [numeric_cell("H4", "6", "SUM(I4:U4)")]})
        cache = classify(cache_before, cache_after)["signals"]
        assert cache["formulaCacheOnly"] and not cache["estimateChanged"]

        style_before = root / "style-before.xlsx"
        style_after = root / "style-after.xlsx"
        write_test_workbook(style_before, {4: [inline_cell("C4", "same", "1")]})
        write_test_workbook(style_after, {4: [inline_cell("C4", "same", "2")]})
        style = classify(style_before, style_after)["signals"]
        assert style["formattingChanged"] and not style["storyTextChanged"]

        unsafe_path = root / "unsafe-path.xlsx"
        with ZipFile(unsafe_path, "w", ZIP_DEFLATED) as archive:
            archive.writestr("../outside.xml", b"unsafe")
        try:
            package_snapshot(unsafe_path)
            raise AssertionError("unsafe ZIP path was accepted")
        except ClassificationError as error:
            assert "unsafe ZIP path" in str(error)

        compression_bomb = root / "compression-bomb.xlsx"
        with ZipFile(compression_bomb, "w", ZIP_DEFLATED) as archive:
            archive.writestr("xl/worksheets/sheet1.xml", b"A" * (1024 * 1024))
        try:
            package_snapshot(compression_bomb)
            raise AssertionError("excessive ZIP compression ratio was accepted")
        except ClassificationError as error:
            assert "compression ratio" in str(error)

        entity_workbook = root / "entity.xlsx"
        entity_xml = (
            b'<?xml version="1.0"?><!DOCTYPE worksheet [<!ENTITY x "unsafe">]>'
            + b'<worksheet xmlns="' + MAIN_NS.encode("utf-8") + b'"><sheetData/></worksheet>'
        )
        with ZipFile(entity_workbook, "w", ZIP_DEFLATED) as archive:
            archive.writestr("xl/worksheets/sheet1.xml", entity_xml)
        try:
            package_snapshot(entity_workbook)
            raise AssertionError("XML entity declaration was accepted")
        except ClassificationError as error:
            assert "entities are not allowed" in str(error)

        negative_shared_string = root / "negative-shared-string.xlsx"
        shared_strings_xml = (
            '<?xml version="1.0"?><sst xmlns="' + MAIN_NS + '"><si><t>value</t></si></sst>'
        )
        negative_index_sheet = (
            '<?xml version="1.0"?><worksheet xmlns="' + MAIN_NS
            + '"><sheetData><row r="4"><c r="C4" t="s"><v>-1</v></c></row></sheetData></worksheet>'
        )
        with ZipFile(negative_shared_string, "w", ZIP_DEFLATED) as archive:
            archive.writestr("xl/sharedStrings.xml", shared_strings_xml)
            archive.writestr("xl/worksheets/sheet1.xml", negative_index_sheet)
        try:
            package_snapshot(negative_shared_string)
            raise AssertionError("negative shared string index was accepted")
        except ClassificationError as error:
            assert "shared string index is out of range" in str(error)
    print("DataCanvas XLSX change classifier self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--before", type=Path)
    parser.add_argument("--after", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.before or not args.after:
        raise SystemExit("--before and --after are required")
    try:
        print(json.dumps(classify(args.before, args.after), ensure_ascii=False, sort_keys=True))
    except (BadZipFile, ClassificationError, OSError, ET.ParseError, ValueError) as error:
        raise SystemExit("XLSX classification failed: " + str(error)) from error


if __name__ == "__main__":
    main()
