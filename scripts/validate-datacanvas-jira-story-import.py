#!/usr/bin/env python3
"""Независимо проверить готовый CSV импорта историй DataCanvas в Jira."""

from __future__ import annotations

import argparse
import csv
import importlib.util
import io
import json
import subprocess
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONTRACT_PATH = ROOT / "docs/process/cascading-governance/jira-story-import-contract.json"
XLSX_VALIDATOR_PATH = ROOT / "scripts/validate-datacanvas-xlsx-backlog.py"
CANONICAL_OUTPUT_PATH = ROOT / "artifacts/generated/jira/datacanvas-stories-dc-st-23-dc-st-33.csv"
EXPECTED_COLUMNS = [
    "Issue Type", "Summary", "Description", "Priority", "Story ID", "Target quarter", "Comment"
]
EXPECTED_ROLE_COLUMNS = list("IJKLMNOPQRSTU")


class ValidationError(Exception):
    """Нарушение готового CSV или его источников."""


def fail(message: str) -> None:
    raise ValidationError(message)


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
    spec = importlib.util.spec_from_file_location("datacanvas_xlsx_backlog_for_jira_validation", XLSX_VALIDATOR_PATH)
    if spec is None or spec.loader is None:
        fail("не удалось загрузить штатный валидатор XLSX")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


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


def validate_contract_and_sources(contract: dict):
    if contract.get("columns") != EXPECTED_COLUMNS:
        fail("договор содержит неверный порядок столбцов")
    output = contract.get("output", {})
    if output.get("encoding") != "utf-8" or output.get("bom") is not False:
        fail("договор должен требовать UTF-8 без BOM")
    if output.get("delimiter") != "," or output.get("line_ending") != "LF" or output.get("quoting") != "all":
        fail("договор содержит неподдерживаемые настройки CSV")
    roles = contract.get("roles", [])
    if [item.get("column") for item in roles] != EXPECTED_ROLE_COLUMNS:
        fail("договор содержит неверный порядок ролей I–U")
    expected_pairs = [(f"DC-ST-{number}", number + 3) for number in range(23, 34)]
    contract_pairs = [(item.get("story_id"), item.get("workbook_row")) for item in contract.get("stories", [])]
    if contract_pairs != expected_pairs:
        fail("договор содержит неверный порядок историй или строк 26–36")

    source = contract["source"]
    working_path = repository_path(source["workbook_path"])
    expectations_path = repository_path(source["expectations_path"])
    provenance_path = repository_path(source["provenance_path"])
    story_catalog_path = repository_path(source["story_catalog_path"])
    expectations = load_json(expectations_path)
    provenance = load_json(provenance_path)
    xlsx = load_xlsx_validator()
    try:
        xlsx.validate_pair(
            repository_path(expectations["source_path"]),
            working_path,
            expectations_path,
            provenance_path,
            repository_path(expectations["source_sanitization_manifest"]),
            story_catalog_path,
        )
    except (xlsx.ValidationError, KeyError, OSError, ValueError) as error:
        fail(f"штатная проверка XLSX не пройдена: {error}")

    authority = contract["export_authority"]
    workbook = provenance.get("workbook", {})
    policy = provenance.get("downstream_policy", {})
    checks = [
        (workbook.get("approval_status"), authority["workbook_approval_status"]),
        (workbook.get("team_validation_status"), authority["team_validation_status"]),
        (policy.get("may_export_to_jira"), authority["may_export_to_jira"]),
        (policy.get("jira_export_authority"), authority["jira_export_authority"]),
        (policy.get("jira_export_decision_id"), authority["decision_id"]),
    ]
    if any(actual != required for actual, required in checks):
        fail("происхождение не содержит точного полномочия владельцев на экспорт в Jira")
    if policy.get("may_update_sprint_backlog") is not False:
        fail("разрешение Jira не должно разрешать изменение sprint backlog")
    provenance_rows = provenance.get("rows", [])
    provenance_pairs = [(item.get("story_id"), item.get("workbook_row")) for item in provenance_rows]
    expectation_pairs = [(item.get("story_id"), item.get("row")) for item in expectations.get("new_rows", [])]
    if contract_pairs != provenance_pairs or contract_pairs != expectation_pairs:
        fail("сопоставление историй и строк расходится между источниками")
    if any(
        item.get("approval_status") != authority["workbook_approval_status"]
        or item.get("team_validation_status") != authority["team_validation_status"]
        for item in provenance_rows
    ):
        fail("не все строки имеют требуемый статус для экспорта")
    return xlsx, working_path


def expected_records(contract: dict, xlsx, working_path: Path) -> list[list[str]]:
    source = contract["source"]
    fields = contract["field_sources"]
    formatting = contract["formatting"]
    if formatting != {
        "empty_resource_value": "0", "decimal_separator": ",", "forbidden_comment_character": ";"
    }:
        fail("договор содержит неподдерживаемые правила форматирования")
    with xlsx.open_zip(working_path) as workbook:
        sheet = xlsx.read_xml(workbook, source["worksheet_part"])
        shared = xlsx.load_shared_strings(workbook)
        multiplier = format_decimal(
            workbook_text(xlsx, sheet, shared, source["multiplier_cell"]),
            empty_value=formatting["empty_resource_value"],
            decimal_separator=formatting["decimal_separator"],
        )
        records = [contract["columns"]]
        for story in contract["stories"]:
            row_number = story["workbook_row"]
            values = {
                "story_text": workbook_text(xlsx, sheet, shared, f"{fields['story_text_column']}{row_number}"),
                "functional_zone": workbook_text(xlsx, sheet, shared, f"{fields['functional_zone_column']}{row_number}"),
                "business_value": workbook_text(xlsx, sheet, shared, f"{fields['business_value_column']}{row_number}"),
                "priority": workbook_text(xlsx, sheet, shared, f"{fields['priority_column']}{row_number}"),
                "target_quarter": workbook_text(xlsx, sheet, shared, f"{fields['target_quarter_column']}{row_number}"),
            }
            total = format_decimal(
                workbook_text(xlsx, sheet, shared, f"{fields['total_effort_column']}{row_number}"),
                empty_value=formatting["empty_resource_value"],
                decimal_separator=formatting["decimal_separator"],
            )
            description = contract["description_template"].format(**values)
            comment_lines = [
                line.format(multiplier=multiplier, total_effort=total)
                for line in contract["comment_header_lines"]
            ]
            for role in contract["roles"]:
                value = format_decimal(
                    workbook_text(xlsx, sheet, shared, f"{role['column']}{row_number}", required=False),
                    empty_value=formatting["empty_resource_value"],
                    decimal_separator=formatting["decimal_separator"],
                )
                comment_lines.append(contract["role_line_template"].format(label=role["label"], value=value))
            comment = "\n".join(comment_lines)
            if formatting["forbidden_comment_character"] in comment:
                fail(f"{story['story_id']}: Comment содержит запрещённый символ")
            records.append([
                fields["issue_type_value"], f"{story['story_id']} — {story['summary_goal']}",
                description, values["priority"], story["story_id"], values["target_quarter"], comment,
            ])
    return records


def parse_payload(csv_path: Path, contract: dict) -> tuple[bytes, list[list[str]]]:
    if not csv_path.exists():
        fail(f"готовый CSV отсутствует: {csv_path}")
    payload = csv_path.read_bytes()
    if payload.startswith(b"\xef\xbb\xbf"):
        fail("CSV содержит запрещённый BOM")
    if b"\r" in payload:
        fail("CSV содержит запрещённый CR или CRLF")
    if not payload.endswith(b"\n"):
        fail("CSV должен завершаться LF")
    try:
        text = payload.decode("utf-8")
    except UnicodeDecodeError as error:
        fail(f"CSV не является корректным UTF-8: {error}")
    try:
        records = list(
            csv.reader(
                io.StringIO(text, newline=""),
                delimiter=contract["output"]["delimiter"],
                strict=True,
            )
        )
    except csv.Error as error:
        fail(f"CSV имеет неверное экранирование: {error}")
    buffer = io.StringIO(newline="")
    csv.writer(buffer, delimiter=",", quoting=csv.QUOTE_ALL, lineterminator="\n").writerows(records)
    if buffer.getvalue().encode("utf-8") != payload:
        fail("CSV должен использовать точное экранирование QUOTE_ALL и LF")
    return payload, records


def run_generation_freshness_check(contract_path: Path, csv_path: Path) -> None:
    resolved_contract = Path(contract_path).resolve()
    resolved_csv = Path(csv_path).resolve()
    if resolved_contract != DEFAULT_CONTRACT_PATH.resolve():
        fail(f"проверка свежести принимает только канонический договор: {DEFAULT_CONTRACT_PATH}")
    if resolved_csv != CANONICAL_OUTPUT_PATH.resolve():
        fail(f"проверка свежести принимает только канонический CSV: {CANONICAL_OUTPUT_PATH}")
    contract_argument = resolved_contract.relative_to(ROOT.resolve()).as_posix()
    result = subprocess.run(
        ["npm", "run", "generate:jira-stories", "--", "--check", "--contract", contract_argument],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        fail(f"проверка воспроизводимости CSV не пройдена: {detail}")


def validate_csv(
    csv_path: Path,
    contract_path: Path = DEFAULT_CONTRACT_PATH,
    *,
    require_generator_check: bool = True,
) -> None:
    contract = load_json(Path(contract_path))
    xlsx, working_path = validate_contract_and_sources(contract)
    _payload, records = parse_payload(Path(csv_path), contract)
    if not records or records[0] != EXPECTED_COLUMNS:
        fail("CSV содержит неверный заголовок")
    if len(records) != 12:
        fail(f"CSV должен содержать заголовок и ровно 11 записей, получено {len(records) - 1}")
    if any(len(record) != len(EXPECTED_COLUMNS) for record in records):
        fail("CSV содержит запись с неверным количеством полей")
    story_ids = [record[4] for record in records[1:]]
    required_ids = [item["story_id"] for item in contract["stories"]]
    if story_ids != required_ids or len(set(story_ids)) != len(story_ids):
        fail("CSV содержит неверный порядок или дубликаты историй")
    expected = expected_records(contract, xlsx, working_path)
    if records != expected:
        for index, (actual, required) in enumerate(zip(records, expected)):
            if actual != required:
                fail(f"CSV расходится с XLSX и договором в логической записи {index}")
        fail("CSV содержит лишние или отсутствующие логические записи")
    forbidden = contract["formatting"]["forbidden_comment_character"]
    if any(forbidden in record[6] for record in records[1:]):
        fail("Comment содержит запрещённый символ")
    if require_generator_check:
        run_generation_freshness_check(Path(contract_path), Path(csv_path))


def main() -> int:
    parser = argparse.ArgumentParser(description="Проверить готовый CSV пользовательских историй DataCanvas для Jira.")
    parser.add_argument("--contract", default=DEFAULT_CONTRACT_PATH.relative_to(ROOT).as_posix())
    parser.add_argument("--csv")
    args = parser.parse_args()
    try:
        contract_path = repository_path(args.contract)
        contract = load_json(contract_path)
        csv_path = repository_path(args.csv or contract["output"]["path"])
        validate_csv(csv_path, contract_path)
    except (ValidationError, KeyError, OSError, ValueError) as error:
        print(f"ОШИБКА: {error}", file=sys.stderr)
        return 1
    print(f"CSV импорта пользовательских историй в Jira проверен: {csv_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
