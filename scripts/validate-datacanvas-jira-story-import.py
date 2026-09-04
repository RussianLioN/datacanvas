#!/usr/bin/env python3
"""Независимо проверить CSV действующих пользовательских историй для Jira."""

from __future__ import annotations

import argparse
import csv
import io
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONTRACT_PATH = ROOT / "docs/process/cascading-governance/jira-story-import-contract.json"
CANONICAL_OUTPUT_RELATIVE_PATH = "artifacts/generated/jira/datacanvas-stories-2026-q4.csv"
CANONICAL_OUTPUT_PATH = ROOT / CANONICAL_OUTPUT_RELATIVE_PATH
CANONICAL_SCOPE_RELATIVE_PATH = "docs/product/sources/co-2026-003-current-2026-scope.json"
CANONICAL_STORY_CATALOG_RELATIVE_PATH = "docs/product/requirements/user-stories.md"
EXPECTED_COLUMNS = [
    "Issue Type", "Summary", "Description", "Priority", "Story ID", "Target quarter", "Comment"
]
EXPECTED_STORY_IDS = [
    "DC-ST-09", "DC-ST-23", "DC-ST-24", "DC-ST-25", "DC-ST-26",
    "DC-ST-27", "DC-ST-28", "DC-ST-29", "DC-ST-30",
]
EXPECTED_COMMENT = (
    "Источник: утверждённая граница реализации 2026 года. Ресурсные данные не используются."
)
EXPECTED_DESCRIPTION_TEMPLATE = (
    "Пользовательская история:\n{story_text}\n\nБизнес-ценность:\n{business_value}"
    "\n\nФункциональная зона: {functional_zone}\nПлановый период: {target_period}"
)


class ValidationError(Exception):
    """Нарушение договора готового CSV или его канонических источников."""


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


def validate_contract(contract: dict) -> None:
    if contract.get("contract_id") != "jira-story-import-2026-q4":
        fail("договор должен описывать пакет Jira для 2026-Q4")
    if contract.get("status") != "active":
        fail("договор импорта должен быть действующим")
    if contract.get("columns") != EXPECTED_COLUMNS:
        fail("договор содержит неверный порядок столбцов CSV")
    if contract.get("stories") != EXPECTED_STORY_IDS:
        fail("договор должен содержать только девять действующих историй 2026 года")
    if contract.get("source") != {
        "scope_path": CANONICAL_SCOPE_RELATIVE_PATH,
        "story_catalog_path": CANONICAL_STORY_CATALOG_RELATIVE_PATH,
    }:
        fail("договор должен использовать текущую границу 2026 года и каталог историй")
    if contract.get("output") != {
        "path": CANONICAL_OUTPUT_RELATIVE_PATH,
        "encoding": "utf-8",
        "bom": False,
        "delimiter": ",",
        "line_ending": "LF",
        "quoting": "all",
    }:
        fail("договор содержит неверный байтовый формат или путь CSV")
    if contract.get("field_sources") != {"issue_type_value": "Story"}:
        fail("договор содержит неподдерживаемый источник типа задачи")
    if contract.get("description_template") != EXPECTED_DESCRIPTION_TEMPLATE:
        fail("договор содержит неверный шаблон Description")
    if contract.get("comment_template") != EXPECTED_COMMENT:
        fail("договор содержит неверный комментарий о происхождении")


def validate_scope(scope: dict) -> list[dict]:
    if scope.get("change_order_id") != "CO-2026-003" or scope.get("scope_period") != "2026-Q4":
        fail("граница должна относиться к CO-2026-003 и 2026-Q4")
    if scope.get("approval_status") != "owner_approved":
        fail("граница 2026 года не принята владельцем продукта")
    if scope.get("resource_data_used") is not False:
        fail("ресурсные данные не могут использоваться для пакета Jira")
    if scope.get("active_story_ids") != EXPECTED_STORY_IDS:
        fail("граница должна содержать точный порядок девяти действующих историй")
    if scope.get("excluded_story_ids") != ["DC-ST-31", "DC-ST-32", "DC-ST-33"]:
        fail("граница должна явно исключать будущие истории")
    stories = scope.get("stories")
    if not isinstance(stories, list):
        fail("граница не содержит список историй")
    if [item.get("story_id") for item in stories if isinstance(item, dict)] != EXPECTED_STORY_IDS:
        fail("описания историй в границе не совпадают с действующим набором")
    if len(stories) != len(EXPECTED_STORY_IDS) or any(
        not isinstance(item, dict)
        or item.get("priority") not in {"P1", "P2"}
        or item.get("target_period") != "2026-Q4"
        or not item.get("summary")
        for item in stories
    ):
        fail("граница содержит неполные данные истории для импорта")
    return stories


def parse_story_catalog(path: Path) -> dict[str, dict[str, str]]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError) as error:
        fail(f"не удалось прочитать каталог историй {path}: {error}")

    header = "| ID | Функциональная зона | Приоритет | Пользовательская формулировка | Бизнес-ценность |"
    try:
        start = lines.index(header) + 2
    except ValueError:
        fail("в каталоге историй отсутствует каноническая таблица")

    catalog: dict[str, dict[str, str]] = {}
    for line in lines[start:]:
        if not line.startswith("|"):
            break
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) != 5 or not cells[0].startswith("DC-ST-"):
            fail("каноническая таблица историй содержит неверную строку")
        story_id, functional_zone, priority, story_text, business_value = cells
        if story_id in catalog:
            fail(f"каноническая таблица содержит дубликат {story_id}")
        catalog[story_id] = {
            "functional_zone": functional_zone,
            "priority": priority,
            "story_text": story_text,
            "business_value": business_value,
        }

    if list(catalog) != EXPECTED_STORY_IDS or any(not all(item.values()) for item in catalog.values()):
        fail("каноническая таблица должна содержать только девять непустых действующих историй")
    return catalog


def expected_records(contract: dict) -> list[list[str]]:
    scope = load_json(repository_path(contract["source"]["scope_path"]))
    stories = validate_scope(scope)
    catalog = parse_story_catalog(repository_path(contract["source"]["story_catalog_path"]))
    records = [EXPECTED_COLUMNS]
    for story in stories:
        story_id = story["story_id"]
        catalog_story = catalog[story_id]
        if catalog_story["priority"] != story["priority"]:
            fail(f"{story_id}: приоритет каталога расходится с границей 2026 года")
        records.append([
            "Story",
            f"{story_id} — {story['summary']}",
            EXPECTED_DESCRIPTION_TEMPLATE.format(
                story_text=catalog_story["story_text"],
                business_value=catalog_story["business_value"],
                functional_zone=catalog_story["functional_zone"],
                target_period=story["target_period"],
            ),
            story["priority"],
            story_id,
            story["target_period"],
            EXPECTED_COMMENT,
        ])
    return records


def parse_payload(csv_path: Path) -> list[list[str]]:
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
        records = list(csv.reader(io.StringIO(text, newline=""), delimiter=",", strict=True))
    except csv.Error as error:
        fail(f"CSV имеет неверное экранирование: {error}")
    rendered = io.StringIO(newline="")
    csv.writer(rendered, delimiter=",", quoting=csv.QUOTE_ALL, lineterminator="\n").writerows(records)
    if rendered.getvalue().encode("utf-8") != payload:
        fail("CSV должен использовать точное экранирование QUOTE_ALL и LF")
    return records


def validate_csv(
    csv_path: Path,
    contract_path: Path = DEFAULT_CONTRACT_PATH,
    *,
    require_generator_check: bool = True,
) -> None:
    resolved_contract = Path(contract_path).resolve()
    resolved_csv = Path(csv_path).resolve()
    contract = load_json(resolved_contract)
    validate_contract(contract)
    if require_generator_check:
        if resolved_contract != DEFAULT_CONTRACT_PATH.resolve():
            fail(f"проверка свежести принимает только канонический договор: {DEFAULT_CONTRACT_PATH}")
        if resolved_csv != CANONICAL_OUTPUT_PATH.resolve():
            fail(f"проверка свежести принимает только канонический CSV: {CANONICAL_OUTPUT_PATH}")
    records = parse_payload(resolved_csv)
    expected = expected_records(contract)
    if records != expected:
        if len(records) != len(expected):
            fail(f"CSV должен содержать заголовок и ровно девять записей, получено {len(records) - 1}")
        for index, (actual, required) in enumerate(zip(records, expected)):
            if actual != required:
                fail(f"CSV расходится с утверждёнными источниками в логической записи {index}")
        fail("CSV содержит неверные данные")


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
