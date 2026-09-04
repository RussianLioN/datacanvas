#!/usr/bin/env python3
"""Сформировать CSV действующих историй DataCanvas для импорта в Jira."""

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


def canonical_output_path(contract: dict) -> Path:
    actual = contract.get("output", {}).get("path")
    if actual != CANONICAL_OUTPUT_RELATIVE_PATH:
        fail(
            "договор должен указывать канонический путь CSV "
            f"{CANONICAL_OUTPUT_RELATIVE_PATH!r}, получено {actual!r}"
        )
    return CANONICAL_OUTPUT_PATH


def validate_contract_semantics(contract: dict) -> None:
    if contract.get("contract_id") != "jira-story-import-2026-q4":
        fail("договор должен описывать пакет Jira для 2026-Q4")
    if contract.get("status") != "active":
        fail("договор импорта должен быть действующим")
    if contract.get("columns") != EXPECTED_COLUMNS:
        fail("договор содержит неверный порядок столбцов CSV")
    canonical_output_path(contract)
    output = contract.get("output", {})
    if output.get("encoding") != "utf-8" or output.get("bom") is not False:
        fail("договор должен требовать UTF-8 без BOM")
    if output.get("delimiter") != "," or output.get("line_ending") != "LF" or output.get("quoting") != "all":
        fail("договор содержит неподдерживаемые настройки CSV")
    if contract.get("field_sources") != {"issue_type_value": "Story"}:
        fail("договор содержит неподдерживаемый источник типа задачи")
    if contract.get("comment_template") != EXPECTED_COMMENT:
        fail("договор содержит неверный комментарий о происхождении")
    if contract.get("stories") != EXPECTED_STORY_IDS:
        fail("договор должен содержать только девять действующих историй 2026 года")
    source = contract.get("source", {})
    if source != {
        "scope_path": CANONICAL_SCOPE_RELATIVE_PATH,
        "story_catalog_path": CANONICAL_STORY_CATALOG_RELATIVE_PATH,
    }:
        fail("договор должен использовать только действующую границу 2026 года и каталог историй")
    if "{story_text}" not in contract.get("description_template", ""):
        fail("шаблон Description должен содержать формулировку пользовательской истории")


def validate_scope(scope: dict) -> None:
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
    stories = scope.get("stories", [])
    story_ids = [item.get("story_id") for item in stories if isinstance(item, dict)]
    if story_ids != EXPECTED_STORY_IDS or len(story_ids) != len(stories):
        fail("описания историй в границе не совпадают с действующим набором")
    if any(
        item.get("priority") not in {"P1", "P2"}
        or item.get("target_period") != "2026-Q4"
        or not item.get("summary")
        for item in stories
    ):
        fail("граница содержит неполные данные истории для импорта")


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

    if list(catalog) != EXPECTED_STORY_IDS:
        fail("каноническая таблица должна содержать только девять действующих историй")
    if any(not all(value.values()) for value in catalog.values()):
        fail("каноническая таблица содержит пустые поля")
    return catalog


def validated_sources(contract: dict) -> tuple[list[dict], dict[str, dict[str, str]]]:
    source = contract["source"]
    scope_path = repository_path(source["scope_path"])
    catalog_path = repository_path(source["story_catalog_path"])
    scope = load_json(scope_path)
    validate_scope(scope)
    catalog = parse_story_catalog(catalog_path)
    stories = scope["stories"]
    for story in stories:
        catalog_story = catalog[story["story_id"]]
        if catalog_story["priority"] != story["priority"]:
            fail(f"{story['story_id']}: приоритет каталога расходится с границей 2026 года")
    return stories, catalog


def build_records(contract: dict, stories: list[dict], catalog: dict[str, dict[str, str]]) -> list[list[str]]:
    records = [contract["columns"]]
    for story in stories:
        story_id = story["story_id"]
        catalog_story = catalog[story_id]
        description = contract["description_template"].format(
            story_text=catalog_story["story_text"],
            business_value=catalog_story["business_value"],
            functional_zone=catalog_story["functional_zone"],
            target_period=story["target_period"],
        )
        records.append([
            contract["field_sources"]["issue_type_value"],
            f"{story_id} — {story['summary']}",
            description,
            story["priority"],
            story_id,
            story["target_period"],
            contract["comment_template"],
        ])
    return records


def render_csv(contract_path: Path = DEFAULT_CONTRACT_PATH) -> bytes:
    contract = load_json(Path(contract_path))
    validate_contract_semantics(contract)
    stories, catalog = validated_sources(contract)
    buffer = io.StringIO(newline="")
    csv.writer(
        buffer,
        delimiter=contract["output"]["delimiter"],
        quoting=csv.QUOTE_ALL,
        lineterminator="\n",
    ).writerows(build_records(contract, stories, catalog))
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
        write_or_check(payload, canonical_output_path(contract), check=args.check)
    except (GenerationError, KeyError, OSError, ValueError) as error:
        print(f"ОШИБКА: {error}", file=sys.stderr)
        return 1
    action = "актуален" if args.check else "сформирован"
    print(f"CSV импорта пользовательских историй в Jira {action}: {CANONICAL_OUTPUT_RELATIVE_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
