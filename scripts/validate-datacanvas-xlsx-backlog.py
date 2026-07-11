#!/usr/bin/env python3
"""Validate the DataCanvas working PSHE backlog workbook without rewriting it."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import tempfile
from copy import deepcopy
from decimal import Decimal
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"m": MAIN_NS, "rel": REL_NS}
ROLE_COLUMNS = list("IJKLMNOPQRSTU")
FORBIDDEN_PART_MARKERS = (
    "vbaproject",
    "externallinks",
    "connections",
    "querytables",
    "embeddings",
    "activex",
    "oleobject",
)
FORBIDDEN_TARGET_PATTERN = re.compile(r"^(?:file|https?)://", re.IGNORECASE)
LOCAL_POINTER_PATTERN = re.compile(r"(?:/Users/|file://|https?://)[^\"'<>\\s]+")
CELL_REF_PATTERN = re.compile(r"^([A-Z]+)([1-9][0-9]*)$")
XML_START_TAG_PATTERN = re.compile(r"<([A-Za-z_][\w.-]*)(?:\s[^>]*)?>")
XMLNS_PREFIX_PATTERN = re.compile(r"\sxmlns:([A-Za-z_][\w.-]*)=")
IGNORABLE_PATTERN = re.compile(r"\s(?:[A-Za-z_][\w.-]*:)?Ignorable=\"([^\"]+)\"")


class ValidationError(Exception):
    pass


def fail(message: str) -> None:
    raise ValidationError(message)


def relpath(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def open_zip(path: Path) -> ZipFile:
    if not path.exists():
        fail(f"required workbook is missing: {relpath(path)}")
    return ZipFile(path)


def read_xml(zipped: ZipFile, part: str) -> ET.Element:
    return ET.fromstring(zipped.read(part))


def canonical_xml(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return ET.tostring(element, encoding="unicode")


def canonical_row_for_source_compare(
    row: ET.Element,
    *,
    allow_formula_cache_delta: bool,
    allow_shared_formula_ref_delta: bool,
) -> str:
    comparable = deepcopy(row)
    for cell in comparable.findall("m:c", NS):
        formula = cell.find("m:f", NS)
        if formula is None:
            continue
        if allow_formula_cache_delta:
            cached_value = cell.find("m:v", NS)
            if cached_value is not None:
                cell.remove(cached_value)
        if allow_shared_formula_ref_delta and formula.attrib.get("t") == "shared":
            formula.attrib.pop("ref", None)
    return canonical_xml(comparable)


def formula_signature(
    formula: ET.Element | None,
    *,
    allow_formula_semantic_delta: bool,
    allow_shared_formula_ref_delta: bool,
) -> tuple | str | None:
    if formula is None:
        return None
    if allow_formula_semantic_delta:
        return "formula"
    attributes = dict(formula.attrib)
    if allow_shared_formula_ref_delta and attributes.get("t") == "shared":
        attributes.pop("ref", None)
    return (formula.text or "", tuple(sorted(attributes.items())))


def row_semantic_signature(
    row: ET.Element,
    shared_strings: list[str],
    *,
    allow_formula_cache_delta: bool,
    allow_formula_semantic_delta: bool,
    allow_shared_formula_ref_delta: bool,
) -> tuple:
    row_attributes = tuple(sorted(row.attrib.items()))
    cells = []
    for cell in row.findall("m:c", NS):
        formula = cell.find("m:f", NS)
        value = None if formula is not None and allow_formula_cache_delta else cell_value(cell, shared_strings)
        cells.append(
            (
                cell.attrib.get("r"),
                tuple(sorted((key, value_attr) for key, value_attr in cell.attrib.items() if key != "r")),
                value,
                formula_signature(
                    formula,
                    allow_formula_semantic_delta=allow_formula_semantic_delta,
                    allow_shared_formula_ref_delta=allow_shared_formula_ref_delta,
                ),
            )
        )
    return (row_attributes, tuple(cells))


def decimal_text(value: str | None) -> Decimal:
    if value is None or value == "":
        return Decimal("0")
    return Decimal(str(value))


def cell_value(cell: ET.Element | None, shared_strings: list[str]) -> str | None:
    if cell is None:
        return None
    inline = cell.find("m:is", NS)
    if inline is not None:
        return "".join(t.text or "" for t in inline.findall(".//m:t", NS))
    value = cell.find("m:v", NS)
    if value is None:
        return None
    if cell.attrib.get("t") == "s":
        return shared_strings[int(value.text)]
    return value.text


def load_shared_strings(zipped: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zipped.namelist():
        return []
    root = read_xml(zipped, "xl/sharedStrings.xml")
    values: list[str] = []
    for item in root.findall("m:si", NS):
        values.append("".join(t.text or "" for t in item.findall(".//m:t", NS)))
    return values


def row_by_number(sheet: ET.Element, row_number: int) -> ET.Element:
    row = sheet.find(f".//m:row[@r='{row_number}']", NS)
    if row is None:
        fail(f"sheet row is missing: {row_number}")
    return row


def cell_by_ref(sheet: ET.Element, ref: str) -> ET.Element | None:
    return sheet.find(f".//m:c[@r='{ref}']", NS)


def workbook_defined_filter(root: ET.Element) -> str | None:
    for defined_name in root.findall(".//m:definedName", NS):
        if defined_name.attrib.get("name") == "_xlnm._FilterDatabase":
            return defined_name.text
    return None


def comments_by_ref(zipped: ZipFile) -> dict[str, str]:
    if "xl/comments1.xml" not in zipped.namelist():
        return {}
    root = read_xml(zipped, "xl/comments1.xml")
    result: dict[str, str] = {}
    for comment in root.findall(".//m:comment", NS):
        ref = comment.attrib.get("ref")
        if ref:
            result[ref] = "".join(t.text or "" for t in comment.findall(".//m:t", NS))
    return result


def workbook_text_pointers(zipped: ZipFile) -> set[str]:
    pointers: set[str] = set()
    for part in zipped.namelist():
        if not part.endswith((".xml", ".rels")):
            continue
        text = zipped.read(part).decode("utf-8", errors="ignore")
        pointers.update(LOCAL_POINTER_PATTERN.findall(text))
    return pointers


def assert_package_allowlist(zipped: ZipFile, label: str) -> None:
    for part in zipped.namelist():
        lowered = part.lower()
        for marker in FORBIDDEN_PART_MARKERS:
            if marker in lowered:
                fail(f"{label} contains forbidden XLSX part: {part}")
    for part in zipped.namelist():
        if not part.endswith(".rels"):
            continue
        root = ET.fromstring(zipped.read(part))
        for rel in root.findall("rel:Relationship", NS):
            target = rel.attrib.get("Target", "")
            target_mode = rel.attrib.get("TargetMode", "")
            if target_mode.lower() == "external" or FORBIDDEN_TARGET_PATTERN.match(target):
                fail(f"{label} contains forbidden external relationship in {part}: {target}")


def assert_markup_compatibility_prefixes(zipped: ZipFile, label: str) -> None:
    for part in zipped.namelist():
        if not part.endswith(".xml"):
            continue
        text = zipped.read(part).decode("utf-8", errors="ignore")
        for match in XML_START_TAG_PATTERN.finditer(text):
            tag = match.group(0)
            ignorable_values = IGNORABLE_PATTERN.findall(tag)
            if not ignorable_values:
                continue
            declared_prefixes = set(XMLNS_PREFIX_PATTERN.findall(tag))
            referenced_prefixes = {
                prefix
                for value in ignorable_values
                for prefix in value.split()
            }
            missing_prefixes = sorted(referenced_prefixes - declared_prefixes)
            if missing_prefixes:
                fail(
                    f"{label} {part} mc:Ignorable references undeclared prefixes: "
                    + ", ".join(missing_prefixes)
                )


def assert_same_bytes(raw: ZipFile, working: ZipFile, part: str) -> None:
    if raw.read(part) != working.read(part):
        fail(f"workbook invariant part changed: {part}")


def assert_equal(label: str, actual, expected) -> None:
    if actual != expected:
        fail(f"{label}: expected {expected!r}, got {actual!r}")


def column_to_number(column: str) -> int:
    result = 0
    for char in column:
        result = result * 26 + ord(char) - ord("A") + 1
    return result


def number_to_column(number: int) -> str:
    result = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        result = chr(ord("A") + remainder) + result
    return result


def split_cell_ref(ref: str) -> tuple[str, int]:
    match = CELL_REF_PATTERN.match(ref)
    if not match:
        fail(f"invalid cell reference in XLSX formula range: {ref}")
    column, row = match.groups()
    return column, int(row)


def expand_cell_range(ref: str) -> list[str]:
    if ":" not in ref:
        return [ref]
    start, end = ref.split(":", 1)
    start_column, start_row = split_cell_ref(start)
    end_column, end_row = split_cell_ref(end)
    result: list[str] = []
    for column_number in range(column_to_number(start_column), column_to_number(end_column) + 1):
        column = number_to_column(column_number)
        for row in range(start_row, end_row + 1):
            result.append(f"{column}{row}")
    return result


def assert_shared_formula_membership(sheet: ET.Element) -> None:
    formulas_by_ref: dict[str, ET.Element] = {}
    shared_master_ranges: dict[str, tuple[str, set[str]]] = {}

    for cell in sheet.findall(".//m:c", NS):
        ref = cell.attrib.get("r")
        formula = cell.find("m:f", NS)
        if ref and formula is not None:
            formulas_by_ref[ref] = formula

    for ref, formula in formulas_by_ref.items():
        if formula.attrib.get("t") != "shared":
            continue
        si = formula.attrib.get("si")
        if not si:
            fail(f"shared formula has no si at {ref}")
        formula_ref = formula.attrib.get("ref")
        if formula_ref:
            if si in shared_master_ranges:
                previous_ref, _ = shared_master_ranges[si]
                fail(f"duplicate shared formula master for si={si}: {previous_ref} and {ref}")
            shared_master_ranges[si] = (ref, set(expand_cell_range(formula_ref)))

    for ref, formula in formulas_by_ref.items():
        if formula.attrib.get("t") == "shared":
            si = formula.attrib.get("si")
            if si not in shared_master_ranges:
                fail(f"shared formula member {ref} references missing master si={si}")

    for si, (master_ref, expected_refs) in shared_master_ranges.items():
        invalid_members: list[str] = []
        missing_members: list[str] = []
        for ref in sorted(expected_refs, key=lambda cell_ref: (split_cell_ref(cell_ref)[1], split_cell_ref(cell_ref)[0])):
            formula = formulas_by_ref.get(ref)
            if formula is None:
                missing_members.append(ref)
                continue
            if formula.attrib.get("t") != "shared" or formula.attrib.get("si") != si:
                invalid_members.append(ref)
        if missing_members:
            fail(f"shared formula si={si} range from {master_ref} has missing members: {', '.join(missing_members)}")
        if invalid_members:
            fail(f"shared formula si={si} range from {master_ref} has non-member cells: {', '.join(invalid_members)}")


def assert_decimal(label: str, actual: str | None, expected) -> None:
    actual_value = decimal_text(actual)
    expected_value = Decimal(str(expected))
    if actual_value != expected_value:
        fail(f"{label}: expected {expected_value}, got {actual_value}")


def assert_cell_text(sheet: ET.Element, shared: list[str], ref: str, expected: str) -> None:
    actual = cell_value(cell_by_ref(sheet, ref), shared)
    assert_equal(ref, actual, expected)


def assert_cell_decimal(sheet: ET.Element, shared: list[str], ref: str, expected) -> None:
    actual = cell_value(cell_by_ref(sheet, ref), shared)
    assert_decimal(ref, actual, expected)


def parse_markdown_story_catalog(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        fail(f"required story catalog is missing: {relpath(path)}")
    result: dict[str, dict[str, str]] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line.startswith("| DC-ST-"):
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) != 5:
            fail(f"story catalog row must have 5 columns: {line}")
        story_id, functional_zone, priority, story_text, business_value = cells
        if story_id in result:
            fail(f"duplicate story catalog row: {story_id}")
        result[story_id] = {
            "functional_zone": functional_zone,
            "priority": priority,
            "story_text": story_text,
            "business_value": business_value,
        }
    if not result:
        fail(f"story catalog has no DC-ST rows: {relpath(path)}")
    return result


def validate_pair(
    raw_path: Path,
    working_path: Path,
    expectations_path: Path,
    provenance_path: Path,
    story_catalog_path: Path,
    *,
    check_working_hash: bool = True,
) -> None:
    expectations = load_json(expectations_path)
    provenance = load_json(provenance_path)

    assert_equal("raw workbook path", relpath(raw_path), expectations["raw_path"])
    assert_equal("provenance path", relpath(provenance_path), expectations["provenance_path"])
    assert_equal("raw workbook sha256", sha256_file(raw_path), expectations["raw_sha256"])
    if check_working_hash:
        assert_equal("working workbook path", relpath(working_path), expectations["working_path"])
        assert_equal("working workbook sha256", sha256_file(working_path), expectations["working_sha256"])

    if provenance["workbook"]["working_path"] != expectations["working_path"]:
        fail("provenance workbook path does not match expectations")
    if provenance["workbook"]["raw_sha256"] != expectations["raw_sha256"]:
        fail("provenance raw hash does not match expectations")
    if check_working_hash and provenance["workbook"]["working_sha256"] != expectations["working_sha256"]:
        fail("provenance working hash does not match expectations")

    with open_zip(raw_path) as raw, open_zip(working_path) as working:
        raw_parts = set(raw.namelist())
        working_parts = set(working.namelist())
        assert_equal("XLSX package parts", sorted(working_parts), sorted(raw_parts))
        assert_package_allowlist(raw, "raw workbook")
        assert_package_allowlist(working, "working workbook")
        assert_markup_compatibility_prefixes(raw, "raw workbook")
        assert_markup_compatibility_prefixes(working, "working workbook")

        new_pointers = workbook_text_pointers(working) - workbook_text_pointers(raw)
        if new_pointers:
            fail(f"working workbook contains new local or external pointers: {sorted(new_pointers)}")

        for part in expectations["invariant_parts"]:
            assert_same_bytes(raw, working, part)
        for part, expected_hash in expectations.get("accepted_working_part_sha256", {}).items():
            if part not in working_parts:
                fail(f"expected accepted working workbook part is missing: {part}")
            actual_hash = hashlib.sha256(working.read(part)).hexdigest()
            assert_equal(f"accepted working part sha256 {part}", actual_hash, expected_hash)

        raw_sheet = read_xml(raw, "xl/worksheets/sheet1.xml")
        working_sheet = read_xml(working, "xl/worksheets/sheet1.xml")
        raw_workbook = read_xml(raw, "xl/workbook.xml")
        working_workbook = read_xml(working, "xl/workbook.xml")
        raw_shared = load_shared_strings(raw)
        working_shared = load_shared_strings(working)
        story_catalog_rows = parse_markdown_story_catalog(story_catalog_path)

        assert_shared_formula_membership(raw_sheet)
        assert_shared_formula_membership(working_sheet)

        assert_equal("raw dimension", raw_sheet.find("m:dimension", NS).attrib["ref"], expectations["raw_dimension"])
        assert_equal("working dimension", working_sheet.find("m:dimension", NS).attrib["ref"], expectations["working_dimension"])
        assert_equal(
            "raw autofilter",
            raw_sheet.find("m:autoFilter", NS).attrib["ref"],
            expectations["raw_filter_ref"],
        )
        assert_equal(
            "working autofilter",
            working_sheet.find("m:autoFilter", NS).attrib["ref"],
            expectations["working_filter_ref"],
        )
        assert_equal(
            "raw defined filter",
            workbook_defined_filter(raw_workbook),
            expectations["raw_defined_filter_ref"],
        )
        assert_equal(
            "working defined filter",
            workbook_defined_filter(working_workbook),
            expectations["working_defined_filter_ref"],
        )
        raw_h5_formula = cell_by_ref(raw_sheet, "H5").find("m:f", NS)
        working_h5_formula = cell_by_ref(working_sheet, "H5").find("m:f", NS)
        assert_equal("raw shared formula ref", raw_h5_formula.attrib.get("ref"), expectations["raw_shared_formula_ref"])
        assert_equal(
            "working shared formula ref",
            working_h5_formula.attrib.get("ref"),
            expectations["working_shared_formula_ref"],
        )
        expected_working_sheet_views = expectations.get("working_sheet_views")
        if expected_working_sheet_views:
            assert_equal(
                "working sheetViews",
                canonical_xml(working_sheet.find("m:sheetViews", NS)),
                expected_working_sheet_views,
            )
        else:
            assert_equal(
                "sheetViews",
                canonical_xml(working_sheet.find("m:sheetViews", NS)),
                canonical_xml(raw_sheet.find("m:sheetViews", NS)),
            )

        raw_rows = raw_sheet.findall(".//m:row", NS)
        working_rows = working_sheet.findall(".//m:row", NS)
        assert_equal("raw row count", len(raw_rows), expectations["raw_row_count"])
        assert_equal("working row count", len(working_rows), expectations["working_row_count"])
        accepted_original_rows = expectations.get("accepted_original_rows")
        if accepted_original_rows:
            for row_number_text, expected_row_xml in accepted_original_rows.items():
                assert_equal(
                    f"accepted working original row {row_number_text}",
                    canonical_xml(row_by_number(working_sheet, int(row_number_text))),
                    canonical_xml(ET.fromstring(expected_row_xml)),
                )
        else:
            for row_number in range(1, expectations["original_rows_unchanged_through"] + 1):
                allow_formula_cache_delta = row_number in {1, 2}
                allow_formula_semantic_delta = row_number in {1, 2}
                allow_shared_formula_ref_delta = row_number == 5
                assert_equal(
                    f"original row {row_number}",
                    row_semantic_signature(
                        row_by_number(working_sheet, row_number),
                        working_shared,
                        allow_formula_cache_delta=allow_formula_cache_delta,
                        allow_formula_semantic_delta=allow_formula_semantic_delta,
                        allow_shared_formula_ref_delta=allow_shared_formula_ref_delta,
                    ),
                    row_semantic_signature(
                        row_by_number(raw_sheet, row_number),
                        raw_shared,
                        allow_formula_cache_delta=allow_formula_cache_delta,
                        allow_formula_semantic_delta=allow_formula_semantic_delta,
                        allow_shared_formula_ref_delta=allow_shared_formula_ref_delta,
                    ),
                )

        for row_number in expectations["hidden_rows"]:
            if row_by_number(working_sheet, row_number).attrib.get("hidden") != "1":
                fail(f"expected hidden source row is visible: {row_number}")
        for row_number in expectations["visible_added_rows"]:
            if row_by_number(working_sheet, row_number).attrib.get("hidden") == "1":
                fail(f"expected visible added row is hidden: {row_number}")

        comments = comments_by_ref(working)
        for ref in expectations["required_comment_refs"]:
            if ref not in comments:
                fail(f"expected workbook comment is missing: {ref}")
        for ref in expectations.get("forbidden_comment_refs", []):
            if ref in comments:
                fail(f"forbidden stale workbook comment is present: {ref}")

        for ref, expected in expectations["cached_totals"].items():
            assert_cell_decimal(working_sheet, working_shared, ref, expected)

        multiplier = decimal_text(cell_value(cell_by_ref(working_sheet, "C1"), working_shared))
        if multiplier == 0:
            fail("C1 multiplier is missing or zero")

        provenance_rows = {item["story_id"]: item for item in provenance["rows"]}
        for expected_source_row in expectations.get("source_rows", []):
            story_id = expected_source_row["story_id"]
            row_number = expected_source_row["row"]
            expected_priority = expected_source_row["priority"]
            assert_cell_text(working_sheet, working_shared, f"F{row_number}", expected_priority)
            if story_id not in story_catalog_rows:
                fail(f"story catalog row is missing: {story_id}")
            assert_equal(
                f"{story_id} story catalog priority",
                story_catalog_rows[story_id]["priority"],
                expected_priority,
            )

        for expected_row in expectations["new_rows"]:
            row_number = expected_row["row"]
            story_id = expected_row["story_id"]
            if story_id not in provenance_rows:
                fail(f"provenance row is missing: {story_id}")
            if story_id not in story_catalog_rows:
                fail(f"story catalog row is missing: {story_id}")
            assert_equal(
                f"{story_id} approval status",
                provenance_rows[story_id]["approval_status"],
                expected_row.get("approval_status", "draft_unapproved"),
            )
            if "team_validation_status" in expected_row:
                assert_equal(
                    f"{story_id} team validation status",
                    provenance_rows[story_id]["team_validation_status"],
                    expected_row["team_validation_status"],
                )
            assert_equal(f"{story_id} workbook row", provenance_rows[story_id]["workbook_row"], row_number)
            assert_equal(
                f"{story_id} analog rows",
                provenance_rows[story_id]["analog_rows"],
                expected_row["analog_rows"],
            )
            assert_equal(
                f"{story_id} selected profile row",
                provenance_rows[story_id]["selected_profile_row"],
                expected_row["selected_profile_row"],
            )
            assert_decimal(f"{story_id} draft minimum", str(provenance_rows[story_id]["draft_min"]), expected_row["draft_min"])
            assert_decimal(f"{story_id} draft maximum", str(provenance_rows[story_id]["draft_max"]), expected_row["draft_max"])
            selected_value = Decimal(str(provenance_rows[story_id]["selected_value"]))
            draft_min = Decimal(str(provenance_rows[story_id]["draft_min"]))
            draft_max = Decimal(str(provenance_rows[story_id]["draft_max"]))
            expected_h_value = Decimal(str(expected_row["h_value"]))
            if selected_value != expected_h_value:
                fail(f"{story_id} selected provenance value does not match H{row_number}: expected {expected_h_value}, got {selected_value}")
            if selected_value < draft_min or selected_value > draft_max:
                fail(f"{story_id} selected provenance value is outside draft range: {selected_value} not in [{draft_min}, {draft_max}]")

            assert_cell_text(working_sheet, working_shared, f"F{row_number}", expected_row.get("priority", "P1"))
            assert_cell_text(working_sheet, working_shared, f"G{row_number}", expected_row.get("period", "2026-Q3"))
            if "functional_zone" in expected_row:
                assert_cell_text(working_sheet, working_shared, f"D{row_number}", expected_row["functional_zone"])
            if "story_text" in expected_row:
                assert_cell_text(working_sheet, working_shared, f"C{row_number}", expected_row["story_text"])
            if "business_value" in expected_row:
                assert_cell_text(working_sheet, working_shared, f"E{row_number}", expected_row["business_value"])
            story_catalog_row = story_catalog_rows[story_id]
            for field, expected_key in (
                ("functional_zone", "functional_zone"),
                ("priority", "priority"),
                ("story_text", "story_text"),
                ("business_value", "business_value"),
            ):
                if expected_key in expected_row:
                    assert_equal(
                        f"{story_id} story catalog {field}",
                        story_catalog_row[field],
                        str(expected_row[expected_key]),
                    )
            expected_comments_text = expected_row.get("comments_contains")
            if expected_comments_text:
                comments_text = cell_value(cell_by_ref(working_sheet, f"D{row_number}"), working_shared) or ""
                if expected_comments_text not in comments_text:
                    fail(f"{story_id} row does not carry expected marker in Comments column")

            assert_cell_decimal(working_sheet, working_shared, f"H{row_number}", expected_row["h_value"])
            actual_comment = comments.get(f"H{row_number}", "")
            if expected_row.get("comment_text") and expected_row["comment_text"] not in actual_comment:
                fail(f"{story_id} H comment does not include expected provenance text")

            actual_role_sum = sum(
                decimal_text(cell_value(cell_by_ref(working_sheet, f"{column}{row_number}"), working_shared))
                for column in ROLE_COLUMNS
            )
            expected_role_values = {key: Decimal(str(value)) for key, value in expected_row["role_values"].items()}
            for column in ROLE_COLUMNS:
                actual = decimal_text(cell_value(cell_by_ref(working_sheet, f"{column}{row_number}"), working_shared))
                expected = expected_role_values.get(column, Decimal("0"))
                if actual != expected:
                    fail(f"{story_id} role value {column}{row_number}: expected {expected}, got {actual}")
            if actual_role_sum * multiplier != Decimal(str(expected_row["h_value"])):
                fail(f"{story_id} role values do not sum to H{row_number} through C1 multiplier")

        calc_chain = working.read("xl/calcChain.xml").decode("utf-8")
        for ref in [f'H{item["row"]}' for item in expectations["new_rows"]]:
            if f'r="{ref}"' not in calc_chain:
                fail(f"calcChain does not include added row total: {ref}")
        for error_token in ("#REF!", "#VALUE!", "#DIV/0!", "#NAME?", "#N/A"):
            for part in ("xl/worksheets/sheet1.xml", "xl/calcChain.xml", "xl/sharedStrings.xml"):
                if error_token in working.read(part).decode("utf-8", errors="ignore"):
                    fail(f"formula error token found in {part}: {error_token}")


def rewrite_zip(source: Path, target: Path, replacements: dict[str, tuple[str, str]]) -> None:
    with ZipFile(source) as src, ZipFile(target, "w", ZIP_DEFLATED) as dst:
        for part in src.namelist():
            data = src.read(part)
            if part in replacements:
                old, new = replacements[part]
                text = data.decode("utf-8")
                if old not in text:
                    fail(f"self-test mutation target is missing in {part}: {old}")
                data = text.replace(old, new, 1).encode("utf-8")
            dst.writestr(part, data)


def run_self_tests(raw_path: Path, working_path: Path, expectations_path: Path, provenance_path: Path) -> None:
    scenarios = {
        "broken-pane": {"xl/worksheets/sheet1.xml": ('topLeftCell="C12"', 'topLeftCell="C11"')},
        "broken-filter": {"xl/worksheets/sheet1.xml": ('ref="B3:U36"', 'ref="B3:U35"')},
        "broken-shared-formula-range": {"xl/worksheets/sheet1.xml": ('ref="H5:H36"', 'ref="H5:H35"')},
        "broken-shared-formula-member": {
            "xl/worksheets/sheet1.xml": (
                'r="H30" s="11"><f t="shared" si="2"/><v>26</v>',
                'r="H30" s="11"><f>SUM(I30:U30)*$C$1</f><v>26</v>',
            )
        },
        "broken-ignorable-prefix": {
            "xl/worksheets/sheet1.xml": (
                'xmlns:xr="http://schemas.microsoft.com/office/spreadsheetml/2014/revision"',
                'xmlns:ns2="http://schemas.microsoft.com/office/spreadsheetml/2014/revision"',
            )
        },
        "stale-comment-restored": {"xl/comments1.xml": ("</commentList>", '<comment ref="H26" authorId="1" shapeId="0"><text><r><t>stale</t></r></text></comment></commentList>')},
        "broken-estimate": {
            "xl/worksheets/sheet1.xml": (
                'r="H26" s="11"><f t="shared" si="2"/><v>22</v>',
                'r="H26" s="11"><f t="shared" si="2"/><v>9</v>',
            )
        },
    }
    with tempfile.TemporaryDirectory(prefix="datacanvas-xlsx-validator-") as tmp:
        tmp_path = Path(tmp)
        for scenario_id, replacements in scenarios.items():
            mutant = tmp_path / f"{scenario_id}.xlsx"
            rewrite_zip(working_path, mutant, replacements)
            try:
                validate_pair(raw_path, mutant, expectations_path, provenance_path, ROOT / "docs/product/requirements/user-stories.md", check_working_hash=False)
            except ValidationError:
                continue
            fail(f"self-test scenario did not fail as expected: {scenario_id}")

        broken_provenance = load_json(provenance_path)
        broken_provenance["rows"][0]["selected_value"] = 1
        broken_provenance_path = tmp_path / "broken-selected-value.provenance.json"
        broken_provenance_path.write_text(json.dumps(broken_provenance, ensure_ascii=False, indent=2), encoding="utf-8")
        try:
            validate_pair(raw_path, working_path, expectations_path, broken_provenance_path, ROOT / "docs/product/requirements/user-stories.md")
        except ValidationError:
            pass
        else:
            fail("self-test scenario did not fail as expected: broken-selected-provenance-value")

        broken_story_catalog = (ROOT / "docs/product/requirements/user-stories.md").read_text(encoding="utf-8").replace(
            "| DC-ST-27 | Статусы обработки | P1 |",
            "| DC-ST-27 | Статусы обработки | P1 | Искаженная формулировка. ",
            1,
        )
        broken_story_catalog_path = tmp_path / "broken-user-stories.md"
        broken_story_catalog_path.write_text(broken_story_catalog, encoding="utf-8")
        try:
            validate_pair(raw_path, working_path, expectations_path, provenance_path, broken_story_catalog_path)
        except ValidationError:
            pass
        else:
            fail("self-test scenario did not fail as expected: broken-story-catalog")

        broken_expectations = load_json(expectations_path)
        broken_expectations["new_rows"][4]["story_text"] = "Искаженная формулировка."
        broken_expectations_path = tmp_path / "broken-expectations.json"
        broken_expectations_path.write_text(json.dumps(broken_expectations, ensure_ascii=False, indent=2), encoding="utf-8")
        try:
            validate_pair(raw_path, working_path, broken_expectations_path, provenance_path, ROOT / "docs/product/requirements/user-stories.md", check_working_hash=False)
        except ValidationError:
            return
        fail("self-test scenario did not fail as expected: broken-story-catalog")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the DataCanvas draft XLSX backlog workbook.")
    parser.add_argument("--raw", default="docs/product/sources/raw/bl-value-rm-data-canvas.xlsx")
    parser.add_argument("--working", default="docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx")
    parser.add_argument("--expectations", default="tests/golden/xlsx-backlog-draft-pshe-2026-07-08.json")
    parser.add_argument("--provenance", default="docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json")
    parser.add_argument("--story-catalog", default="docs/product/requirements/user-stories.md")
    parser.add_argument("--self-test", action="store_true", help="Run negative mutation checks in a temporary directory.")
    args = parser.parse_args()

    raw_path = ROOT / args.raw
    working_path = ROOT / args.working
    expectations_path = ROOT / args.expectations
    provenance_path = ROOT / args.provenance
    story_catalog_path = ROOT / args.story_catalog

    try:
        validate_pair(raw_path, working_path, expectations_path, provenance_path, story_catalog_path)
        if args.self_test:
            run_self_tests(raw_path, working_path, expectations_path, provenance_path)
    except ValidationError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("DataCanvas XLSX backlog validation passed")
    if args.self_test:
        print("DataCanvas XLSX backlog negative self-tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
