#!/usr/bin/env python3
"""Проверки контракта и CSV для импорта пользовательских историй в Jira."""

from __future__ import annotations

import csv
import importlib.util
import io
import json
import tempfile
import unittest
from copy import deepcopy
from decimal import Decimal
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "docs/process/cascading-governance/jira-story-import-contract.json"
SCHEMA_PATH = ROOT / "schemas/jira-story-import-contract.schema.json"
GENERATOR_PATH = ROOT / "scripts/generate-datacanvas-jira-stories.py"
VALIDATOR_PATH = ROOT / "scripts/validate-datacanvas-jira-story-import.py"
OUTPUT_PATH = ROOT / "artifacts/generated/jira/datacanvas-stories-dc-st-23-dc-st-33.csv"
EXPECTATIONS_PATH = ROOT / "tests/golden/xlsx-backlog-draft-pshe-2026-07-08.json"
PROVENANCE_PATH = ROOT / "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json"
HISTORICAL_STORY_CATALOG_PATH = ROOT / "tests/fixtures/xlsx-backlog-draft-pshe-2026-07-08-story-catalog.md"

EXPECTED_COLUMNS = [
    "Issue Type", "Summary", "Description", "Priority", "Story ID", "Target quarter", "Comment"
]
EXPECTED_GOALS = [
    ("DC-ST-23", 26, "Передача запроса от другого агента"),
    ("DC-ST-24", 27, "Запуск в общем агентском сценарии"),
    ("DC-ST-25", 28, "Передача входного пакета"),
    ("DC-ST-26", 29, "Проверка входного пакета"),
    ("DC-ST-27", 30, "Передача статусов обработки"),
    ("DC-ST-28", 31, "Проверяемость маршрута"),
    ("DC-ST-29", 32, "Формирование PPTX и PDF"),
    ("DC-ST-30", 33, "Расширенная доставка файлов"),
    ("DC-ST-31", 34, "Защищённое хранение PDF"),
    ("DC-ST-32", 35, "Передача ссылки на PDF"),
    ("DC-ST-33", 36, "Уведомление и ссылка в Лисе"),
]
EXPECTED_ROLES = [
    ("I", "БА"), ("J", "СА ЕФС"), ("K", "PL ЕФС"), ("L", "Дизайн"),
    ("M", "ВН ЕФС"), ("N", "Смежный сервис"), ("O", "СА Оркестратор"),
    ("P", "DEV Оркестратор"), ("Q", "СА AEF Containers"),
    ("R", "DEV AEF Containers"), ("S", "QA"), ("T", "AQA"), ("U", "НТ"),
]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_script(path: Path, module_name: str):
    if not path.exists():
        raise AssertionError(f"ожидаемый исполняемый файл отсутствует: {path.relative_to(ROOT)}")
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def parse_csv(payload: bytes) -> list[list[str]]:
    return list(csv.reader(io.StringIO(payload.decode("utf-8"), newline=""), strict=True))


def serialize_csv(rows: list[list[str]]) -> bytes:
    buffer = io.StringIO(newline="")
    csv.writer(buffer, quoting=csv.QUOTE_ALL, lineterminator="\n").writerows(rows)
    return buffer.getvalue().encode("utf-8")


def format_decimal(value: object) -> str:
    rendered = format(Decimal(str(value)).normalize(), "f")
    return ("0" if rendered == "-0" else rendered).replace(".", ",")


class JiraStoryImportContractTest(unittest.TestCase):
    def test_contract_captures_exact_columns_stories_roles_and_formatting(self) -> None:
        self.assertTrue(CONTRACT_PATH.exists(), "машинный контракт импорта в Jira ещё не создан")
        self.assertTrue(SCHEMA_PATH.exists(), "схема машинного контракта импорта в Jira ещё не создана")
        contract = load_json(CONTRACT_PATH)
        self.assertEqual(contract["columns"], EXPECTED_COLUMNS)
        self.assertEqual(
            [(item["story_id"], item["workbook_row"], item["summary_goal"]) for item in contract["stories"]],
            EXPECTED_GOALS,
        )
        self.assertEqual([(item["column"], item["label"]) for item in contract["roles"]], EXPECTED_ROLES)
        self.assertEqual(
            contract["output"],
            {
                "path": OUTPUT_PATH.relative_to(ROOT).as_posix(),
                "encoding": "utf-8", "bom": False, "delimiter": ",",
                "line_ending": "LF", "quoting": "all",
            },
        )
        self.assertEqual(
            contract["formatting"],
            {"empty_resource_value": "0", "decimal_separator": ",", "forbidden_comment_character": ";"},
        )
        self.assertEqual(
            contract["source"]["story_catalog_path"],
            HISTORICAL_STORY_CATALOG_PATH.relative_to(ROOT).as_posix(),
        )
        self.assertTrue(HISTORICAL_STORY_CATALOG_PATH.exists())

    def test_contract_requires_the_exact_owner_export_decision(self) -> None:
        self.assertTrue(CONTRACT_PATH.exists(), "машинный контракт импорта в Jira ещё не создан")
        authority = load_json(CONTRACT_PATH)["export_authority"]
        self.assertEqual(
            authority,
            {
                "workbook_approval_status": "owner_approved",
                "team_validation_status": "approved",
                "may_export_to_jira": True,
                "jira_export_authority": "process_owner_and_product_owner",
                "decision_id": "UDW-DEC-019",
            },
        )

    def test_contract_rejects_a_noncanonical_output_path(self) -> None:
        generator = load_script(GENERATOR_PATH, "datacanvas_jira_story_generator_output_path_test")
        contract = load_json(CONTRACT_PATH)
        contract["output"]["path"] = "artifacts/generated/jira/unexpected.csv"
        with self.assertRaisesRegex(generator.GenerationError, "канонический путь"):
            generator.validate_contract_semantics(contract)

        schema = load_json(SCHEMA_PATH)
        self.assertEqual(
            schema["properties"]["output"]["properties"]["path"],
            {"const": OUTPUT_PATH.relative_to(ROOT).as_posix()},
        )


class JiraStoryCsvGenerationTest(unittest.TestCase):
    def generator(self):
        return load_script(GENERATOR_PATH, "datacanvas_jira_story_generator_test")

    def test_rendered_csv_has_exact_bytes_and_all_expected_fields(self) -> None:
        payload = self.generator().render_csv(CONTRACT_PATH)
        self.assertFalse(payload.startswith(b"\xef\xbb\xbf"))
        self.assertNotIn(b"\r", payload)
        self.assertTrue(payload.endswith(b"\n"))
        rows = parse_csv(payload)
        self.assertEqual(rows[0], EXPECTED_COLUMNS)
        self.assertEqual(len(rows), 12)
        self.assertEqual([row[4] for row in rows[1:]], [item[0] for item in EXPECTED_GOALS])

        expected_by_story = {item["story_id"]: item for item in load_json(EXPECTATIONS_PATH)["new_rows"]}
        goals = {story_id: goal for story_id, _row, goal in EXPECTED_GOALS}
        for row in rows[1:]:
            story_id = row[4]
            expected = expected_by_story[story_id]
            description = (
                f"Пользовательская история:\n{expected['story_text']}\n\n"
                f"Бизнес-ценность:\n{expected['business_value']}\n\n"
                f"Функциональная зона: {expected['functional_zone']}\nПлановый период: {expected['period']}"
            )
            role_lines = [
                f"{label}: {format_decimal(expected['role_values'].get(column, 0))}"
                for column, label in EXPECTED_ROLES
            ]
            comment = "\n".join([
                "Ресурсная оценка реализации",
                "Статус: текущая оценка принята владельцем процесса и Product Owner для экспорта в Jira.",
                "Итоговая ПШЕ — трудозатраты в человеко-днях "
                f"с коэффициентом 2: {format_decimal(expected['h_value'])}.",
                "Роли, базовая оценка в человеко-днях: обозначения сохранены из Excel.",
                *role_lines,
            ])
            self.assertEqual(row, [
                "Story", f"{story_id} — {goals[story_id]}", description, expected["priority"],
                story_id, expected["period"], comment,
            ])
            self.assertNotIn(";", row[6])
        self.assertEqual(payload, serialize_csv(rows), "каждое поле CSV должно быть заключено в кавычки")

    def test_check_mode_rejects_missing_and_stale_output_without_writing(self) -> None:
        generator = self.generator()
        payload = generator.render_csv(CONTRACT_PATH)
        with tempfile.TemporaryDirectory() as temporary_directory:
            output = Path(temporary_directory) / "stories.csv"
            with self.assertRaisesRegex(generator.GenerationError, "отсутствует"):
                generator.write_or_check(payload, output, check=True)
            self.assertFalse(output.exists())
            output.write_bytes(b"stale\n")
            with self.assertRaisesRegex(generator.GenerationError, "устарел"):
                generator.write_or_check(payload, output, check=True)
            self.assertEqual(output.read_bytes(), b"stale\n")
            generator.write_or_check(payload, output, check=False)
            generator.write_or_check(payload, output, check=True)

    def test_generation_rejects_export_without_exact_owner_authority(self) -> None:
        generator = self.generator()
        contract = load_json(CONTRACT_PATH)
        provenance = load_json(PROVENANCE_PATH)
        cases = []
        changed = deepcopy(provenance)
        changed["downstream_policy"]["may_export_to_jira"] = False
        cases.append(changed)
        changed = deepcopy(provenance)
        changed["downstream_policy"]["jira_export_decision_id"] = "UDW-DEC-999"
        cases.append(changed)
        changed = deepcopy(provenance)
        changed["workbook"]["team_validation_status"] = "pending_team_review"
        cases.append(changed)
        changed = deepcopy(provenance)
        changed["rows"][0]["team_validation_status"] = "pending_team_review"
        cases.append(changed)
        for changed in cases:
            with self.subTest(policy=changed["downstream_policy"]):
                with self.assertRaises(generator.GenerationError):
                    generator.validate_export_authority(contract, changed)


class JiraStoryCsvValidationTest(unittest.TestCase):
    def modules_and_payload(self):
        generator = load_script(GENERATOR_PATH, "datacanvas_jira_story_generator_validator_test")
        validator = load_script(VALIDATOR_PATH, "datacanvas_jira_story_validator_test")
        return generator, validator, generator.render_csv(CONTRACT_PATH)

    def assert_rejected(self, payload: bytes) -> None:
        _generator, validator, _valid_payload = self.modules_and_payload()
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "stories.csv"
            path.write_bytes(payload)
            with self.assertRaises(validator.ValidationError):
                validator.validate_csv(path, CONTRACT_PATH, require_generator_check=False)

    def test_independent_validator_accepts_the_exact_generated_csv(self) -> None:
        _generator, validator, payload = self.modules_and_payload()
        source = VALIDATOR_PATH.read_text(encoding="utf-8")
        self.assertNotIn("generate-datacanvas-jira-stories", source)
        self.assertNotIn("render_csv", source)
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "stories.csv"
            path.write_bytes(payload)
            validator.validate_csv(path, CONTRACT_PATH, require_generator_check=False)

    def test_freshness_check_rejects_noncanonical_contract_and_csv_paths(self) -> None:
        _generator, validator, payload = self.modules_and_payload()
        with tempfile.TemporaryDirectory() as temporary_directory:
            temporary_root = Path(temporary_directory)
            alternate_csv = temporary_root / "stories.csv"
            alternate_csv.write_bytes(payload)
            with self.assertRaisesRegex(validator.ValidationError, "канонический CSV"):
                validator.validate_csv(alternate_csv, CONTRACT_PATH, require_generator_check=True)

            alternate_contract = temporary_root / "contract.json"
            alternate_contract.write_text(CONTRACT_PATH.read_text(encoding="utf-8"), encoding="utf-8")
            with self.assertRaisesRegex(validator.ValidationError, "канонический договор"):
                validator.validate_csv(OUTPUT_PATH, alternate_contract, require_generator_check=True)

    def test_validator_rejects_byte_level_corruption(self) -> None:
        _generator, _validator, payload = self.modules_and_payload()
        cases = [
            b"\xef\xbb\xbf" + payload,
            payload.replace(b"\n", b"\r\n"),
            payload[:-1] + b"\xff\n",
            payload[:-1],
        ]
        for changed in cases:
            with self.subTest(prefix=changed[:12]):
                self.assert_rejected(changed)

    def test_validator_rejects_structure_order_and_value_mutations(self) -> None:
        _generator, _validator, payload = self.modules_and_payload()
        rows = parse_csv(payload)
        cases: list[bytes] = []
        changed = deepcopy(rows); changed[0][3] = "Capacity contour"; cases.append(serialize_csv(changed))
        cases.extend([serialize_csv(rows[:-1]), serialize_csv([*rows, deepcopy(rows[-1])])])
        changed = deepcopy(rows); changed[2] = deepcopy(changed[1]); cases.append(serialize_csv(changed))
        changed = deepcopy(rows); changed[1], changed[2] = changed[2], changed[1]; cases.append(serialize_csv(changed))
        mutations = {
            2: "Искажённая история", 3: "P9", 5: "2099-Q4",
            6: rows[1][6].replace("коэффициентом 2: 22.", "коэффициентом 2: 23."),
        }
        for column, replacement in mutations.items():
            changed = deepcopy(rows); changed[1][column] = replacement; cases.append(serialize_csv(changed))
        for old, new in [
            ("БА: 2", "БА: 3"), ("Дизайн: 0", "Дизайн: "),
            ("СА ЕФС: 0,5", "СА ЕФС: 0.5"), (rows[1][6], rows[1][6] + ";"),
        ]:
            changed = deepcopy(rows); changed[1][6] = changed[1][6].replace(old, new); cases.append(serialize_csv(changed))
        marker = '"Пользовательская история:\n'.encode("utf-8")
        self.assertIn(marker, payload)
        cases.append(payload.replace(marker, "Пользовательская история:\n".encode("utf-8"), 1))
        for changed in cases:
            with self.subTest(size=len(changed)):
                self.assert_rejected(changed)


class JiraStoryImportRegistrationTest(unittest.TestCase):
    def test_package_and_generator_governance_are_registered(self) -> None:
        scripts = load_json(ROOT / "package.json")["scripts"]
        self.assertEqual(scripts.get("generate:jira-stories"), "python3 -B scripts/generate-datacanvas-jira-stories.py")
        self.assertEqual(scripts.get("test:jira-story-import"), "python3 -B tests/test_datacanvas_jira_story_import.py")
        self.assertEqual(
            scripts.get("validate:jira-story-import-csv"),
            "python3 -B scripts/validate-datacanvas-jira-story-import.py",
        )
        self.assertEqual(
            scripts.get("validate:jira-story-import"),
            "npm run test:jira-story-import && python3 -B scripts/validate-datacanvas-jira-story-import.py && npm run generate:jira-stories -- --check",
        )
        self.assertIn("npm run validate:jira-story-import", scripts["test"])
        self.assertLess(
            scripts["generate:golden"].index("npm run generate:jira-stories"),
            scripts["generate:golden"].index("node scripts/generate-artifact-hash-manifest.mjs"),
        )
        contracts = load_json(ROOT / "docs/process/universal-documentation-workflow/generator-contracts.json")
        item = next(entry for entry in contracts["contracts"] if entry["generator_id"] == "datacanvas-jira-stories")
        self.assertEqual(item["outputs"], [OUTPUT_PATH.relative_to(ROOT).as_posix()])
        self.assertEqual(item["allowed_writes"], item["outputs"])
        self.assertIn("npm run validate:jira-story-import", item["post_validators"])
        guard = load_json(ROOT / "docs/process/universal-documentation-workflow/mutation-guard-policy.json")
        write_set = next(entry for entry in guard["allowed_write_sets"] if entry["generator_id"] == "datacanvas-jira-stories")
        self.assertEqual(write_set["allowed_writes"], item["outputs"])
        catalog = load_json(ROOT / "docs/process/universal-documentation-workflow/validation-command-catalog.json")
        commands = {entry["command"]: entry for entry in catalog["commands"]}
        for command in [
            "npm run test:jira-story-import", "npm run validate:jira-story-import-csv",
            "npm run generate:jira-stories -- --check", "npm run validate:jira-story-import",
        ]:
            self.assertIn(command, commands)
            self.assertIs(commands[command]["mutates_files"], False)

    def test_all_six_artifacts_and_csv_leakage_target_are_registered(self) -> None:
        paths = {
            CONTRACT_PATH.relative_to(ROOT).as_posix(), SCHEMA_PATH.relative_to(ROOT).as_posix(),
            GENERATOR_PATH.relative_to(ROOT).as_posix(), VALIDATOR_PATH.relative_to(ROOT).as_posix(),
            Path(__file__).resolve().relative_to(ROOT).as_posix(), OUTPUT_PATH.relative_to(ROOT).as_posix(),
        }
        registry = load_json(ROOT / "docs/architecture/schemas/artifact-registry.json")
        inventory = load_json(ROOT / "docs/process/universal-documentation-workflow/artifact-inventory.json")
        registry_by_path = {entry["path"]: entry for entry in registry["artifacts"]}
        inventory_paths = {entry["path"] for entry in inventory["artifacts"]}
        self.assertTrue(paths.issubset(registry_by_path))
        self.assertTrue(paths.issubset(inventory_paths))
        contract_relative_path = CONTRACT_PATH.relative_to(ROOT).as_posix()
        navigation = load_json(ROOT / "docs/navigation/navigation-source.json")
        navigation_by_path = {entry["path"]: entry for entry in navigation["managed_entries"]}
        self.assertIs(registry_by_path[contract_relative_path]["searchable"], False)
        self.assertIs(navigation_by_path[contract_relative_path]["searchable"], False)
        csv_entry = registry_by_path[OUTPUT_PATH.relative_to(ROOT).as_posix()]
        self.assertEqual(
            {key: csv_entry[key] for key in ["status", "data_class", "visibility", "searchable", "navigable"]},
            {"status": "generated", "data_class": "internal", "visibility": "restricted", "searchable": False, "navigable": False},
        )
        leakage = load_json(ROOT / "docs/architecture/security/data-leakage-manifest.json")
        leak_entry = next(entry for entry in leakage["scan_targets"] if entry["path"] == OUTPUT_PATH.relative_to(ROOT).as_posix())
        self.assertEqual((leak_entry["sink"], leak_entry["data_class"]), ("export", "internal"))


if __name__ == "__main__":
    unittest.main()
