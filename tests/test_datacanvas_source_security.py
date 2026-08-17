#!/usr/bin/env python3
"""Regression tests for DataCanvas XLSX sanitization and Git-history hygiene."""

from __future__ import annotations

import importlib.util
import io
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "datacanvas_source_security.py"
SPEC = importlib.util.spec_from_file_location("datacanvas_source_security", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def write_xlsx(path: Path, workbook_xml: bytes) -> None:
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", b"<Types/>")
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/worksheets/sheet1.xml", b"<worksheet><value>42</value></worksheet>")


def write_august_profile_fixture(path: Path) -> None:
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr(
            "xl/comments1.xml",
            (
                '<comments xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                '<authors><author>Личный автор</author></authors>'
                '<commentList><comment ref="A1" authorId="0"><text><r><t>Личная запись</t></r></text></comment></commentList>'
                "</comments>"
            ).encode("utf-8"),
        )
        archive.writestr("xl/workbook.xml", b'<workbook><x:absPath url="/Users/private/source" xmlns:x="urn:abs"/></workbook>')
        archive.writestr(
            "xl/sharedStrings.xml",
            (
                '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                '<si><t>3. Добавляем PUSH уведомление - отображение готовности во всплывающем сообщении</t></si>'
                "</sst>"
            ).encode("utf-8"),
        )
        archive.writestr(
            "docProps/core.xml",
            (
                '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
                'xmlns:dc="http://purl.org/dc/elements/1.1/">'
                "<dc:creator>Личный автор</dc:creator>"
                "<cp:lastModifiedBy>Личный автор</cp:lastModifiedBy>"
                "</cp:coreProperties>"
            ).encode("utf-8"),
        )
        archive.writestr("xl/worksheets/sheet3.xml", b"<worksheet><f>SUM(G4:G6)</f></worksheet>")
        archive.writestr("[Content_Types].xml", b"<Types/>")


def git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result.stdout.strip()


class SourceSanitizerTest(unittest.TestCase):
    def test_repository_commands_pin_the_independent_owner_source_hash(self) -> None:
        expected_hash = "202e17b20408fc496e3bed3094bb8bf3b5a5cf73004fce7e446a17faec11afd9"
        august_expected_hash = "722a604831b2b589ac9aea99dd8cccd80090d9e166a2adc40b284d0bdb147bf1"
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        contracts = json.loads(
            (ROOT / "docs/process/universal-documentation-workflow/generator-contracts.json").read_text(
                encoding="utf-8"
            )
        )
        contract = next(
            item
            for item in contracts["contracts"]
            if item["generator_id"] == "datacanvas-xlsx-sanitized-reference"
        )

        self.assertIn(expected_hash, package["scripts"]["validate:xlsx-source-security"])
        self.assertIn(expected_hash, contract["generate_command"])
        self.assertIn(august_expected_hash, package["scripts"]["validate:xlsx-backlog-2026-08-17-source-security"])
        august_contract = next(
            item
            for item in contracts["contracts"]
            if item["generator_id"] == "datacanvas-xlsx-backlog-2026-08-17-working"
        )
        self.assertIn(august_expected_hash, august_contract["generate_command"])

    def test_removes_abs_path_with_any_namespace_without_rewriting_other_xml(self) -> None:
        source = (
            b'<workbook xmlns:mc="urn:mc" mc:Ignorable="ns2">'
            b'<fileVersion appName="xl"/>'
            b'<ns2:absPath url="/Users/private/source" xmlns:ns2="urn:abs"/>'
            b'<bookViews><workbookView/></bookViews></workbook>'
        )
        expected = (
            b'<workbook xmlns:mc="urn:mc" mc:Ignorable="ns2">'
            b'<fileVersion appName="xl"/>'
            b'<bookViews><workbookView/></bookViews></workbook>'
        )

        sanitized, removed = MODULE.sanitize_workbook_xml(source)

        self.assertEqual(sanitized, expected)
        self.assertEqual(removed, 1)

    def test_sanitized_package_preserves_every_other_part_byte_for_byte(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            source = root / "source.xlsx"
            target = root / "sanitized.xlsx"
            write_xlsx(
                source,
                b'<workbook><x15ac:absPath url="file:///private/source" '
                b'xmlns:x15ac="urn:abs"/><value>unchanged</value></workbook>',
            )

            manifest = MODULE.sanitize_xlsx(source, target, MODULE.sha256_file(source))

            with ZipFile(source) as original, ZipFile(target) as sanitized:
                self.assertEqual(original.namelist(), sanitized.namelist())
                self.assertEqual(
                    original.read("xl/worksheets/sheet1.xml"),
                    sanitized.read("xl/worksheets/sheet1.xml"),
                )
                self.assertNotIn(b"absPath", sanitized.read("xl/workbook.xml"))
            self.assertEqual(manifest["removed_abs_path_elements"], 1)
            self.assertEqual(manifest["changed_parts"], ["xl/workbook.xml"])

    def test_rejects_manifest_that_omits_an_ooxml_part(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            source = root / "source.xlsx"
            target = root / "sanitized.xlsx"
            manifest_path = root / "manifest.json"
            write_xlsx(
                source,
                b'<workbook><x:absPath url="/Users/private/source" '
                b'xmlns:x="urn:abs"/></workbook>',
            )
            expected_original_sha256 = MODULE.sha256_file(source)
            manifest = MODULE.sanitize_xlsx(source, target, expected_original_sha256)
            manifest["original_part_sha256"].pop("xl/worksheets/sheet1.xml")
            manifest["sanitized_part_sha256"].pop("xl/worksheets/sheet1.xml")
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

            with self.assertRaisesRegex(MODULE.SourceSecurityError, "part sets"):
                MODULE.validate_reference(target, manifest_path, expected_original_sha256)

    def test_rejects_source_that_does_not_match_independent_original_hash(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            source = root / "source.xlsx"
            target = root / "sanitized.xlsx"
            write_xlsx(
                source,
                b'<workbook><x:absPath url="/Users/private/source" '
                b'xmlns:x="urn:abs"/></workbook>',
            )

            with self.assertRaisesRegex(MODULE.SourceSecurityError, "independent expected hash"):
                MODULE.sanitize_xlsx(source, target, "0" * 64)

            self.assertFalse(target.exists())

    def test_august_profile_redacts_owner_metadata_renames_status_and_preserves_formulas(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            source = root / "source.xlsx"
            target = root / "sanitized.xlsx"
            write_august_profile_fixture(source)

            manifest = MODULE.sanitize_xlsx(
                source,
                target,
                MODULE.sha256_file(source),
                profile=MODULE.BACKLOG_2026_08_17_WORKING_PROFILE,
            )

            self.assertEqual(set(manifest["changed_parts"]), {
                "xl/workbook.xml",
                "xl/sharedStrings.xml",
                "xl/comments1.xml",
                "docProps/core.xml",
            })
            self.assertEqual(manifest["cleared_comment_texts"], 1)
            with ZipFile(target) as workbook:
                package_text = "\n".join(
                    workbook.read(part).decode("utf-8", errors="ignore")
                    for part in workbook.namelist()
                    if part.endswith((".xml", ".vml", ".txt"))
                )
                self.assertNotIn("/Users/private", package_text)
                self.assertNotIn("Личный автор", package_text)
                self.assertNotIn("Личная запись", package_text)
                self.assertNotIn(MODULE.BACKLOG_2026_08_17_OLD_PUSH_TEXT, package_text)
                self.assertIn(MODULE.BACKLOG_2026_08_17_STATUS_TEXT, package_text)
                self.assertEqual(workbook.read("xl/worksheets/sheet3.xml"), b"<worksheet><f>SUM(G4:G6)</f></worksheet>")
                self.assertIn(b"<text/>", workbook.read("xl/comments1.xml"))

    def test_generated_august_working_copy_has_no_local_or_personal_owner_metadata_and_keeps_formulas(self) -> None:
        workbook_path = ROOT / "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-08-17.xlsx"
        provenance_path = ROOT / "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-08-17.provenance.json"
        self.assertTrue(workbook_path.exists(), "2026-08-17 controlled working XLSX must be generated")
        self.assertTrue(provenance_path.exists(), "2026-08-17 provenance manifest must be generated")

        provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
        self.assertEqual(provenance["original_sha256"], "722a604831b2b589ac9aea99dd8cccd80090d9e166a2adc40b284d0bdb147bf1")
        self.assertEqual(provenance["sanitized_sha256"], MODULE.sha256_file(workbook_path))
        self.assertEqual(provenance["profile"], MODULE.BACKLOG_2026_08_17_WORKING_PROFILE)
        self.assertEqual(provenance["renamed_status_labels"], 1)

        with ZipFile(workbook_path) as workbook:
            self.assertEqual(MODULE._xlsx_findings(workbook_path.read_bytes(), "HEAD", workbook_path.as_posix()), [])
            self.assertEqual(MODULE._xlsx_personal_metadata_findings(workbook_path.read_bytes(), "HEAD", workbook_path.as_posix()), [])
            shared_text = workbook.read("xl/sharedStrings.xml").decode("utf-8")
            self.assertIn(MODULE.BACKLOG_2026_08_17_STATUS_TEXT, shared_text)
            self.assertNotIn("PUSH", shared_text)
            sheet1 = workbook.read("xl/worksheets/sheet1.xml").decode("utf-8")
            sheet2 = workbook.read("xl/worksheets/sheet2.xml").decode("utf-8")
            sheet3 = workbook.read("xl/worksheets/sheet3.xml").decode("utf-8")
            self.assertIn("<f t=\"shared\" ref=\"J1:V1\" si=\"0\">J2*$C$1</f>", sheet1)
            self.assertIn("<f>SUBTOTAL(9,J$4:J$496)</f>", sheet1)
            self.assertIn("<f>SUM(C4:H4)</f><v>304.39999999999998</v>", sheet2)
            self.assertIn("<f>SUM(C8:H8)</f><v>219.4</v>", sheet2)
            self.assertIn("<f>SUM(G4:G6)</f>", sheet3)


class HistoryHygieneTest(unittest.TestCase):
    def test_reports_redacted_xlsx_finding_from_commit_history(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo = Path(temporary_directory)
            git(repo, "init", "-b", "main")
            git(repo, "config", "user.name", "Test")
            git(repo, "config", "user.email", "test@example.invalid")
            (repo / "README.md").write_text("clean\n", encoding="utf-8")
            git(repo, "add", "README.md")
            git(repo, "commit", "-m", "base")
            base = git(repo, "rev-parse", "HEAD")
            bad = repo / "docs" / "product" / "sources" / "working" / "bad.xlsx"
            bad.parent.mkdir(parents=True)
            write_xlsx(
                bad,
                b'<workbook><x:absPath url="/Users/private/source" '
                b'xmlns:x="urn:abs"/></workbook>',
            )
            git(repo, "add", ".")
            git(repo, "commit", "-m", "bad xlsx")

            findings = MODULE.scan_git_history(repo, base, "HEAD")

            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0]["finding"], "xlsx_local_pointer")
            self.assertEqual(findings[0]["part"], "xl/workbook.xml")
            self.assertNotIn("/Users/private", str(findings))

    def test_accepts_clean_sanitized_xlsx_history(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo = Path(temporary_directory)
            git(repo, "init", "-b", "main")
            git(repo, "config", "user.name", "Test")
            git(repo, "config", "user.email", "test@example.invalid")
            (repo / "README.md").write_text("clean\n", encoding="utf-8")
            git(repo, "add", "README.md")
            git(repo, "commit", "-m", "base")
            base = git(repo, "rev-parse", "HEAD")
            clean = repo / "docs" / "product" / "sources" / "reference" / "source.xlsx"
            clean.parent.mkdir(parents=True)
            write_xlsx(clean, b"<workbook><value>clean</value></workbook>")
            git(repo, "add", ".")
            git(repo, "commit", "-m", "clean xlsx")

            findings = MODULE.scan_git_history(repo, base, "HEAD")

            self.assertEqual(findings, [])

    def test_detects_windows_unc_and_encoded_file_pointers_in_vml(self) -> None:
        samples = [
            b"C:\\Users\\private\\source.xlsx",
            b"D:/private/source.xlsx",
            b"D%3A%2Fprivate%2Fsource.xlsx",
            b"\\\\server\\private\\source.xlsx",
            b"file%3A%2F%2Fprivate%2Fsource.xlsx",
            b"file%253A%252F%252Fprivate%252Fsource.xlsx",
            b"file&#58;//private/source.xlsx",
        ]
        for index, sample in enumerate(samples):
            with self.subTest(index=index):
                buffer = io.BytesIO()
                with ZipFile(buffer, "w", ZIP_DEFLATED) as archive:
                    archive.writestr("xl/workbook.xml", b"<workbook/>")
                    archive.writestr("xl/drawings/vmlDrawing1.vml", sample)
                findings = MODULE._xlsx_findings(buffer.getvalue(), "commit", "sample.xlsx")
                self.assertEqual(findings[0]["finding"], "xlsx_local_pointer")

    def test_accepts_standard_ooxml_http_namespaces_without_drive_path_false_positive(self) -> None:
        buffer = io.BytesIO()
        with ZipFile(buffer, "w", ZIP_DEFLATED) as archive:
            archive.writestr("xl/workbook.xml", b'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"/>')
            archive.writestr(
                "_rels/.rels",
                b'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
            )

        findings = MODULE._xlsx_findings(buffer.getvalue(), "commit", "sample.xlsx")

        self.assertEqual(findings, [])

    def test_rejects_sanitized_package_with_unsafe_non_workbook_part_without_publishing_target(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            source = root / "source.xlsx"
            target = root / "sanitized.xlsx"
            with ZipFile(source, "w", ZIP_DEFLATED) as archive:
                archive.writestr("[Content_Types].xml", b"<Types/>")
                archive.writestr(
                    "xl/workbook.xml",
                    b'<workbook><x:absPath url="/Users/private/source" xmlns:x="urn:abs"/></workbook>',
                )
                archive.writestr("xl/drawings/vmlDrawing1.vml", b"D:/private/source.xlsx")

            with self.assertRaisesRegex(MODULE.SourceSecurityError, "forbidden content"):
                MODULE.sanitize_xlsx(source, target, MODULE.sha256_file(source))

            self.assertFalse(target.exists())


if __name__ == "__main__":
    unittest.main()
