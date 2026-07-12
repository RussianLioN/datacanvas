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

            manifest = MODULE.sanitize_xlsx(source, target)

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
            manifest = MODULE.sanitize_xlsx(source, target)
            manifest["original_part_sha256"].pop("xl/worksheets/sheet1.xml")
            manifest["sanitized_part_sha256"].pop("xl/worksheets/sheet1.xml")
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

            with self.assertRaisesRegex(MODULE.SourceSecurityError, "part sets"):
                MODULE.validate_reference(target, manifest_path)


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
                MODULE.sanitize_xlsx(source, target)

            self.assertFalse(target.exists())


if __name__ == "__main__":
    unittest.main()
