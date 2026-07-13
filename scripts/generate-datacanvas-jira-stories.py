#!/usr/bin/env python3
"""Сформировать точный CSV импорта историй DataCanvas в Jira."""

from __future__ import annotations

import argparse
import csv
import importlib.util
import io
import json
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONTRACT_PATH = ROOT / "docs/process/cascading-governance/jira-story-import-contract.json"
XLSX_VALIDATOR_PATH = ROOT / "scripts/validate-datacanvas-xlsx-backlog.py"
CANONICAL_OUTPUT_RELATIVE_PATH = "artifacts/generated/jira/datacanvas-stories-dc-st-23-dc-st-33.csv"
CANONICAL_OUTPUT_PATH = ROOT / CANONICAL_OUTPUT_RELATIVE_PATH
EXPECTED_COLUMNS = [
    "Issue Type", "Summary", "Description", "Priority", "Story ID", "Target quarter", "Comment"
]
EXPECTED_ROLE_COLUMNS = list("IJKLMNOPQRSTU")


class GenerationError(Exception):
    """Нарушение договора формирования CSV."""


def fail(message: str) -> None:
    raise GenerationError(message)


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        fail(f"не удалось прочитать JSON {path}: {error}")


def repository_path(value: str) -> Path:
    candidate = Path(value)
    if candidate.is_absolute() or ".." in candidate.parts:
        fail(f"путь должен быть относительным и оставаться в репозитории: {value}")
    resolved = (ROOT / candidate).resolve()
    try:
        resolved.relative_to(ROOT.resolve())
    except ValueError:
        fail(f"путь выходит за пределы репозитория: {value}")
    return resolved


def load_xlsx_validator():
    spec = importlib.util.spec_from_file_location("datacanvas_xlsx_backlog_for_jira_generation", XLSX_VALIDATOR_PATH)
    if spec is None or spec.loader is None:
        fail("не удалось загрузить штатный валидатор XLSX")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def canonical_output_path(contract: dict) -> Path:
    actual = contract.get("output", {}).get("path")
    if actual != CANONICAL_OUTPUT_RELATIVE_PATH:
        fail(
            "договор должен указывать канонический путь CSV "
            f"{CANONICAL_OUTPUT_RELATIVE_PATH!r}, получено {actual!r}"
        )
    return CANONICAL_OUTPUT_PATH


def validate_contract_semantics(contract: dict) -> None:
    if contract.get("columns") != EXPECTED_COLUMNS:
        fail("договор содержит неверный порядок столбцов CSV")
    output = contract.get("output", {})
    canonical_output_path(contract)
    if output.get("encoding") != "utf-8" or output.get("bom") is not False:
        fail("договор должен требовать UTF-8 без BOM")
    if output.get("delimiter") != "," or output.get("line_ending") != "LF" or output.get("quoting") != "all":
        fail("договор содержит неподдерживаемые настройки CSV")
    formatting = contract.get("formatting", {})
    if formatting != {
        "empty_resource_value": "0",
        "decimal_separator": ",",
        "forbidden_comment_character": ";",
    }:
        fail("договор содержит неподдерживаемые правила форматирования")
    roles = contract.get("roles", [])
    if [item.get("column") for item in roles] != EXPECTED_ROLE_COLUMNS:
        fail("договор содержит неверный порядок ресурсных ролей I–U")
    stories = contract.get("stories", [])
    expected_pairs = [(f"DC-ST-{number}", number + 3) for number in range(23, 34)]
    actual_pairs = [(item.get("story_id"), item.get("workbook_row")) for item in stories]
    if actual_pairs != expected_pairs:
        fail("договор содержит неверный порядок историй или строк 26–36")
    source = contract.get("source", {})
    fields = contract.get("field_sources", {})
    if source.get("multiplier_cell") != fields.get("multiplier_cell"):
        fail("ячейка коэффициента расходится между разделами договора")


def validate_export_authority(contract: dict, provenance: dict) -> None:
    expected = contract["export_authority"]
    workbook = provenance.get("workbook", {})
    policy = provenance.get("downstream_policy", {})
    rows = provenance.get("rows", [])
    checks = [
        ("approval_status книги", workbook.get("approval_status"), expected["workbook_approval_status"]),
        ("team_validation_status книги", workbook.get("team_validation_status"), expected["team_validation_status"]),
        ("разрешение экспорта", policy.get("may_export_to_jira"), expected["may_export_to_jira"]),
        ("полномочие экспорта", policy.get("jira_export_authority"), expected["jira_export_authority"]),
        ("решение владельцев", policy.get("jira_export_decision_id"), expected["decision_id"]),
    ]
    for label, actual, required in checks:
        if actual != required:
            fail(f"{label} не разрешает формирование CSV: ожидалось {required!r}, получено {actual!r}")
    if policy.get("may_update_sprint_backlog") is not False:
        fail("разрешение Jira не должно разрешать изменение sprint backlog")
    expected_ids = [item["story_id"] for item in contract["stories"]]
    rows_by_id = {item.get("story_id"): item for item in rows}
    if list(rows_by_id) != expected_ids or len(rows_by_id) != len(rows):
        fail("происхождение содержит неверный порядок или дубликаты историй")
    for story_id in expected_ids:
        row = rows_by_id[story_id]
        if row.get("approval_status") != expected["workbook_approval_status"]:
            fail(f"{story_id}: approval_status строки не разрешает экспорт")
        if row.get("team_validation_status") != expected["team_validation_status"]:
            fail(f"{story_id}: team_validation_status строки не разрешает экспорт")


def format_decimal(value: str | None, *, empty_value: str, decimal_separator: str) -> str:
    source = empty_value if value is None or value == "" else str(value)
    try:
        number = Decimal(source)
    except InvalidOperation:
        fail(f"ресурсное значение не является десятичным числом: {source!r}")
    rendered = format(number.normalize(), "f")
    if rendered == "-0":
        rendered = "0"
    return rendered.replace(".", decimal_separator)


def workbook_text(xlsx, sheet, shared_strings: list[str], ref: str, *, required: bool = True) -> str:
    value = xlsx.cell_value(xlsx.cell_by_ref(sheet, ref), shared_strings)
    if required and (value is None or value == ""):
        fail(f"обязательная ячейка XLSX пуста: {ref}")
    return "" if value is None else str(value)


def validated_sources(contract: dict):
    source = contract["source"]
    working_path = repository_path(source["workbook_path"])
    expectations_path = repository_path(source["expectations_path"])
    provenance_path = repository_path(source["provenance_path"])
    story_catalog_path = repository_path(source["story_catalog_path"])
    expectations = load_json(expectations_path)
    provenance = load_json(provenance_path)
    source_path = repository_path(expectations["source_path"])
    source_manifest_path = repository_path(expectations["source_sanitization_manifest"])
    xlsx = load_xlsx_validator()
    try:
        xlsx.validate_pair(
            source_path,
            working_path,
            expectations_path,
            provenance_path,
            source_manifest_path,
            story_catalog_path,
        )
    except (xlsx.ValidationError, KeyError, OSError, ValueError) as error:
        fail(f"штатная проверка XLSX не пройдена: {error}")
    validate_export_authority(contract, provenance)
    contract_pairs = [(item["story_id"], item["workbook_row"]) for item in contract["stories"]]
    expectation_pairs = [(item["story_id"], item["row"]) for item in expectations.get("new_rows", [])]
    provenance_pairs = [(item["story_id"], item["workbook_row"]) for item in provenance.get("rows", [])]
    if contract_pairs != expectation_pairs or contract_pairs != provenance_pairs:
        fail("сопоставление историй и строк расходится между договором, эталоном и происхождением")
    return xlsx, working_path


def build_records(contract: dict, xlsx, working_path: Path) -> list[list[str]]:
    source = contract["source"]
    fields = contract["field_sources"]
    formatting = contract["formatting"]
    with xlsx.open_zip(working_path) as workbook:
        sheet = xlsx.read_xml(workbook, source["worksheet_part"])
        shared_strings = xlsx.load_shared_strings(workbook)
        multiplier = format_decimal(
            workbook_text(xlsx, sheet, shared_strings, source["multiplier_cell"]),
            empty_value=formatting["empty_resource_value"],
            decimal_separator=formatting["decimal_separator"],
        )
        records = [contract["columns"]]
        for story in contract["stories"]:
            row_number = story["workbook_row"]
            values = {
                "story_text": workbook_text(xlsx, sheet, shared_strings, f"{fields['story_text_column']}{row_number}"),
                "functional_zone": workbook_text(xlsx, sheet, shared_strings, f"{fields['functional_zone_column']}{row_number}"),
                "business_value": workbook_text(xlsx, sheet, shared_strings, f"{fields['business_value_column']}{row_number}"),
                "priority": workbook_text(xlsx, sheet, shared_strings, f"{fields['priority_column']}{row_number}"),
                "target_quarter": workbook_text(xlsx, sheet, shared_strings, f"{fields['target_quarter_column']}{row_number}"),
            }
            total_effort = format_decimal(
                workbook_text(xlsx, sheet, shared_strings, f"{fields['total_effort_column']}{row_number}"),
                empty_value=formatting["empty_resource_value"],
                decimal_separator=formatting["decimal_separator"],
            )
            description = contract["description_template"].format(**values)
            header_lines = [
                line.format(multiplier=multiplier, total_effort=total_effort)
                for line in contract["comment_header_lines"]
            ]
            role_lines = []
            for role in contract["roles"]:
                role_value = format_decimal(
                    workbook_text(xlsx, sheet, shared_strings, f"{role['column']}{row_number}", required=False),
                    empty_value=formatting["empty_resource_value"],
                    decimal_separator=formatting["decimal_separator"],
                )
                role_lines.append(contract["role_line_template"].format(label=role["label"], value=role_value))
            comment = "\n".join([*header_lines, *role_lines])
            if formatting["forbidden_comment_character"] in comment:
                fail(f"{story['story_id']}: Comment содержит запрещённый символ")
            records.append([
                fields["issue_type_value"],
                f"{story['story_id']} — {story['summary_goal']}",
                description,
                values["priority"],
                story["story_id"],
                values["target_quarter"],
                comment,
            ])
    return records


def render_csv(contract_path: Path = DEFAULT_CONTRACT_PATH) -> bytes:
    contract = load_json(Path(contract_path))
    validate_contract_semantics(contract)
    xlsx, working_path = validated_sources(contract)
    records = build_records(contract, xlsx, working_path)
    buffer = io.StringIO(newline="")
    writer = csv.writer(
        buffer,
        delimiter=contract["output"]["delimiter"],
        quoting=csv.QUOTE_ALL,
        lineterminator="\n",
    )
    writer.writerows(records)
    payload = buffer.getvalue().encode("utf-8")
    if payload.startswith(b"\xef\xbb\xbf") or b"\r" in payload or not payload.endswith(b"\n"):
        fail("генератор нарушил байтовый договор CSV")
    return payload


def write_or_check(payload: bytes, output_path: Path, *, check: bool) -> None:
    if check:
        if not output_path.exists():
            fail(f"CSV отсутствует: {output_path}")
        if output_path.read_bytes() != payload:
            fail(f"CSV устарел: {output_path}")
        return
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(payload)


def main() -> int:
    parser = argparse.ArgumentParser(description="Сформировать CSV пользовательских историй DataCanvas для Jira.")
    parser.add_argument("--check", action="store_true", help="Проверить актуальность CSV без записи.")
    parser.add_argument("--contract", default=DEFAULT_CONTRACT_PATH.relative_to(ROOT).as_posix())
    args = parser.parse_args()
    try:
        contract_path = repository_path(args.contract)
        contract = load_json(contract_path)
        payload = render_csv(contract_path)
        output_path = canonical_output_path(contract)
        write_or_check(payload, output_path, check=args.check)
    except (GenerationError, KeyError, OSError, ValueError) as error:
        print(f"ОШИБКА: {error}", file=sys.stderr)
        return 1
    action = "актуален" if args.check else "сформирован"
    print(f"CSV импорта пользовательских историй в Jira {action}: {output_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
