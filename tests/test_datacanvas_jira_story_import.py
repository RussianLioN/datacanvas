#!/usr/bin/env python3
"""Проверки подготовленного CSV девяти историй DataCanvas для Jira."""

from __future__ import annotations

import csv
import importlib.util
import io
import json
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "docs/process/cascading-governance/jira-story-import-contract.json"
SCHEMA_PATH = ROOT / "schemas/jira-story-import-contract.schema.json"
SCOPE_PATH = ROOT / "docs/product/sources/co-2026-003-current-2026-scope.json"
STORY_CATALOG_PATH = ROOT / "docs/product/requirements/user-stories.md"
GENERATOR_PATH = ROOT / "scripts/generate-datacanvas-jira-stories.py"
VALIDATOR_PATH = ROOT / "scripts/validate-datacanvas-jira-story-import.py"
OUTPUT_PATH = ROOT / "artifacts/generated/jira/datacanvas-stories-2026-q4.csv"

EXPECTED_COLUMNS = [
    "Issue Type", "Summary", "Description", "Priority", "Story ID", "Target quarter", "Comment"
]
EXPECTED_IDS = [
    "DC-ST-09", "DC-ST-23", "DC-ST-24", "DC-ST-25", "DC-ST-26",
    "DC-ST-27", "DC-ST-28", "DC-ST-29", "DC-ST-30",
]
EXPECTED_COMMENT = (
    "Источник: утверждённая граница реализации 2026 года. Ресурсные данные не используются."
)


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_script(path: Path, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    spec.loader.exec_module(module)
    return module


def parse_csv(payload: bytes) -> list[list[str]]:
    return list(csv.reader(io.StringIO(payload.decode("utf-8"), newline=""), strict=True))


def serialize_csv(rows: list[list[str]]) -> bytes:
    buffer = io.StringIO(newline="")
    csv.writer(buffer, quoting=csv.QUOTE_ALL, lineterminator="\n").writerows(rows)
    return buffer.getvalue().encode("utf-8")


class JiraStoryImportContractTest(unittest.TestCase):
    def generator(self):
        return load_script(GENERATOR_PATH, "datacanvas_jira_story_generator_contract")

    def test_contract_binds_to_current_2026_sources_and_exact_nine_ids(self) -> None:
        contract = load_json(CONTRACT_PATH)
        self.assertEqual(contract["contract_id"], "jira-story-import-2026-q4")
        self.assertEqual(contract["source"], {
            "scope_path": SCOPE_PATH.relative_to(ROOT).as_posix(),
            "story_catalog_path": STORY_CATALOG_PATH.relative_to(ROOT).as_posix(),
        })
        self.assertEqual(contract["stories"], EXPECTED_IDS)
        self.assertEqual(contract["columns"], EXPECTED_COLUMNS)
        self.assertEqual(contract["output"], {
            "path": OUTPUT_PATH.relative_to(ROOT).as_posix(),
            "encoding": "utf-8", "bom": False, "delimiter": ",", "line_ending": "LF", "quoting": "all",
        })
        self.assertEqual(contract["comment_template"], EXPECTED_COMMENT)
        self.assertNotIn("resource", json.dumps(contract, ensure_ascii=False).lower())
        self.assertNotIn("xlsx", json.dumps(contract, ensure_ascii=False).lower())

    def test_schema_and_generator_reject_legacy_path_and_story_set(self) -> None:
        contract = load_json(CONTRACT_PATH)
        generator = self.generator()
        for changed in [
            {**contract, "output": {**contract["output"], "path": "artifacts/generated/jira/datacanvas-stories-dc-st-23-dc-st-33.csv"}},
            {**contract, "stories": [*EXPECTED_IDS, "DC-ST-31"]},
        ]:
            with self.subTest(changed=changed):
                with self.assertRaises(generator.GenerationError):
                    generator.validate_contract_semantics(changed)

        schema = load_json(SCHEMA_PATH)
        self.assertEqual(
            schema["properties"]["output"]["properties"]["path"],
            {"const": OUTPUT_PATH.relative_to(ROOT).as_posix()},
        )
        self.assertEqual(schema["properties"]["stories"]["minItems"], 9)
        self.assertEqual(schema["properties"]["stories"]["maxItems"], 9)


class JiraStoryCsvGenerationTest(unittest.TestCase):
    def generator(self):
        return load_script(GENERATOR_PATH, "datacanvas_jira_story_generator_generation")

    def test_rendered_csv_contains_exact_current_scope_without_resource_data(self) -> None:
        payload = self.generator().render_csv(CONTRACT_PATH)
        self.assertFalse(payload.startswith(b"\xef\xbb\xbf"))
        self.assertNotIn(b"\r", payload)
        self.assertTrue(payload.endswith(b"\n"))
        rows = parse_csv(payload)
        self.assertEqual(rows[0], EXPECTED_COLUMNS)
        self.assertEqual(len(rows), 10)
        self.assertEqual([row[4] for row in rows[1:]], EXPECTED_IDS)
        self.assertEqual([row[3] for row in rows[1:]], ["P2", "P1", "P1", "P1", "P1", "P1", "P1", "P1", "P2"])
        self.assertTrue(all(row[0] == "Story" for row in rows[1:]))
        self.assertTrue(all(row[5] == "2026-Q4" for row in rows[1:]))
        self.assertTrue(all(row[6] == EXPECTED_COMMENT for row in rows[1:]))
        rendered = payload.decode("utf-8").lower()
        self.assertNotIn("трудозатрат", rendered)
        self.assertNotIn("коэффициент", rendered)
        self.assertNotIn("ресурсная оценка", rendered)
        self.assertEqual(payload, serialize_csv(rows))

    def test_check_mode_rejects_missing_and_stale_output_without_writing(self) -> None:
        generator = self.generator()
        payload = generator.render_csv(CONTRACT_PATH)
        with tempfile.TemporaryDirectory() as temporary_directory:
            output = Path(temporary_directory) / "stories.csv"
            with self.assertRaisesRegex(generator.GenerationError, "отсутствует"):
                generator.write_or_check(payload, output, check=True)
            output.write_bytes(b"stale\n")
            with self.assertRaisesRegex(generator.GenerationError, "устарел"):
                generator.write_or_check(payload, output, check=True)
            self.assertEqual(output.read_bytes(), b"stale\n")
            generator.write_or_check(payload, output, check=False)
            generator.write_or_check(payload, output, check=True)

    def test_generation_rejects_scope_with_resource_data_or_excluded_story(self) -> None:
        generator = self.generator()
        scope = load_json(SCOPE_PATH)
        with self.assertRaises(generator.GenerationError):
            generator.validate_scope({**scope, "resource_data_used": True})
        with self.assertRaises(generator.GenerationError):
            generator.validate_scope({**scope, "active_story_ids": [*EXPECTED_IDS[:-1], "DC-ST-31"]})


class JiraStoryCsvValidationTest(unittest.TestCase):
    def modules_and_payload(self):
        generator = load_script(GENERATOR_PATH, "datacanvas_jira_story_generator_validation")
        validator = load_script(VALIDATOR_PATH, "datacanvas_jira_story_validator")
        return generator, validator, generator.render_csv(CONTRACT_PATH)

    def assert_rejected(self, payload: bytes) -> None:
        _generator, validator, _payload = self.modules_and_payload()
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "stories.csv"
            path.write_bytes(payload)
            with self.assertRaises(validator.ValidationError):
                validator.validate_csv(path, CONTRACT_PATH, require_generator_check=False)

    def test_independent_validator_accepts_exact_generated_csv(self) -> None:
        _generator, validator, payload = self.modules_and_payload()
        source = VALIDATOR_PATH.read_text(encoding="utf-8")
        self.assertNotIn("generate-datacanvas-jira-stories", source)
        self.assertNotIn("render_csv", source)
        self.assertNotIn("validate-datacanvas-xlsx", source)
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "stories.csv"
            path.write_bytes(payload)
            validator.validate_csv(path, CONTRACT_PATH, require_generator_check=False)

    def test_validator_rejects_old_shape_and_resource_comment(self) -> None:
        _generator, _validator, payload = self.modules_and_payload()
        rows = parse_csv(payload)
        cases: list[bytes] = []
        cases.append(serialize_csv([*rows, deepcopy(rows[-1])]))
        changed = deepcopy(rows); changed[1][4] = "DC-ST-31"; cases.append(serialize_csv(changed))
        changed = deepcopy(rows); changed[1][6] = "Ресурсная оценка реализации"; cases.append(serialize_csv(changed))
        changed = deepcopy(rows); changed[1][3] = "P9"; cases.append(serialize_csv(changed))
        changed = deepcopy(rows); changed[1], changed[2] = changed[2], changed[1]; cases.append(serialize_csv(changed))
        for case in cases:
            with self.subTest(size=len(case)):
                self.assert_rejected(case)

    def test_validator_rejects_byte_and_freshness_violations(self) -> None:
        _generator, validator, payload = self.modules_and_payload()
        for changed in [b"\xef\xbb\xbf" + payload, payload.replace(b"\n", b"\r\n"), payload[:-1]]:
            with self.subTest(prefix=changed[:12]):
                self.assert_rejected(changed)
        with tempfile.TemporaryDirectory() as temporary_directory:
            alternate = Path(temporary_directory) / "stories.csv"
            alternate.write_bytes(payload)
            with self.assertRaisesRegex(validator.ValidationError, "канонический CSV"):
                validator.validate_csv(alternate, CONTRACT_PATH, require_generator_check=True)


class JiraStoryImportRegistrationTest(unittest.TestCase):
    def test_active_package_chain_uses_only_current_scope_and_csv(self) -> None:
        old_csv = "artifacts/generated/jira/datacanvas-stories-dc-st-23-dc-st-33.csv"
        new_csv = OUTPUT_PATH.relative_to(ROOT).as_posix()
        scope_path = SCOPE_PATH.relative_to(ROOT).as_posix()
        catalog_path = STORY_CATALOG_PATH.relative_to(ROOT).as_posix()

        manifest = load_json(ROOT / "docs/process/cascading-governance/jira-import-package-manifest.json")
        self.assertEqual(manifest["csv_path"], new_csv)
        self.assertEqual(manifest["status"], "ready")
        self.assertEqual(manifest["import_completion_claim"], "prepared")

        generator_contracts = load_json(
            ROOT / "docs/process/universal-documentation-workflow/generator-contracts.json"
        )
        generator_contract = next(
            item for item in generator_contracts["contracts"] if item["generator_id"] == "datacanvas-jira-stories"
        )
        self.assertEqual(generator_contract["outputs"], [new_csv])
        self.assertEqual(generator_contract["allowed_writes"], [new_csv])
        self.assertIn(scope_path, generator_contract["inputs"])
        self.assertIn(catalog_path, generator_contract["inputs"])
        self.assertNotIn("xlsx", json.dumps(generator_contract, ensure_ascii=False).lower())
        self.assertNotIn("decimal", json.dumps(generator_contract, ensure_ascii=False).lower())

        inventory = load_json(ROOT / "docs/process/universal-documentation-workflow/artifact-inventory.json")
        inventory_by_path = {item["path"]: item for item in inventory["artifacts"]}
        self.assertIn(new_csv, inventory_by_path)
        self.assertEqual(inventory_by_path[new_csv]["inputs"], [
            "docs/process/cascading-governance/jira-story-import-contract.json",
            scope_path,
            catalog_path,
        ])

        registry = load_json(ROOT / "docs/architecture/schemas/artifact-registry.json")
        registry_by_id = {item["id"]: item for item in registry["artifacts"]}
        self.assertEqual(registry_by_id["ART-828"]["canonical_source"], scope_path)
        self.assertEqual(
            registry_by_id["ART-834"]["canonical_source"],
            "docs/process/cascading-governance/jira-story-import-contract.json",
        )
        self.assertEqual(registry_by_id["ART-833"]["path"], new_csv)

        leakage = load_json(ROOT / "docs/architecture/security/data-leakage-manifest.json")
        self.assertTrue(any(item["path"] == new_csv for item in leakage["scan_targets"]))

        archive_contract = load_json(
            ROOT / "docs/process/universal-documentation-workflow/documentation-archive-contract.json"
        )
        self.assertTrue(any(item["path"] == new_csv for item in archive_contract["additional_artifacts"]))

        for relative_path in [
            "README.md",
            "docs/README.md",
            "docs/process/guides/datacanvas-jira-story-bulk-import.md",
            "docs/navigation/navigation-source.json",
            "docs/process/cascading-governance/jira-import-package-manifest.json",
            "docs/process/universal-documentation-workflow/generator-contracts.json",
            "docs/process/universal-documentation-workflow/artifact-inventory.json",
            "docs/process/universal-documentation-workflow/mutation-guard-policy.json",
            "docs/process/universal-documentation-workflow/documentation-archive-contract.json",
            "docs/architecture/security/data-leakage-manifest.json",
            "docs/architecture/schemas/artifact-registry.json",
        ]:
            with self.subTest(path=relative_path):
                self.assertNotIn(old_csv, (ROOT / relative_path).read_text(encoding="utf-8"))

        self.assertFalse((ROOT / old_csv).exists())


if __name__ == "__main__":
    unittest.main()
