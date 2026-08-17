#!/usr/bin/env python3
"""Sanitize DataCanvas XLSX sources and reject unsafe workbook history."""

from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
import tempfile
import re
import subprocess
import sys
from urllib.parse import unquote
from pathlib import Path
from zipfile import BadZipFile, ZipFile
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
WORKBOOK_PART = "xl/workbook.xml"
SHARED_STRINGS_PART = "xl/sharedStrings.xml"
COMMENTS_PART = "xl/comments1.xml"
CORE_PROPS_PART = "docProps/core.xml"
FORBIDDEN_RAW_PATH = "docs/product/sources/raw/bl-value-rm-data-canvas.xlsx"
SOURCE_REFERENCE_PROFILE = "source-reference"
BACKLOG_2026_08_17_WORKING_PROFILE = "backlog-2026-08-17-working"
BACKLOG_2026_08_17_OLD_PUSH_TEXT = "3. Добавляем PUSH уведомление - отображение готовности во всплывающем сообщении"
BACKLOG_2026_08_17_STATUS_TEXT = "Сообщения о статусе заказа в том же чате Лисы"
REDACTED_OWNER = "Product Owner"
COMMENT_AUTHOR_ELEMENT = re.compile(
    rb"<(?:[A-Za-z_][\w.-]*:)?author\b[^>]*>(.*?)</(?:[A-Za-z_][\w.-]*:)?author\s*>",
    re.DOTALL,
)
COMMENT_TEXT_ELEMENT = re.compile(
    rb"<((?:[A-Za-z_][\w.-]*:)?text)\b[^>]*>.*?</\1\s*>",
    re.DOTALL,
)
ABS_PATH_ELEMENT = re.compile(
    rb"<(?:[A-Za-z_][\w.-]*:)?absPath\b[^>]*?(?:/>|>.*?</(?:[A-Za-z_][\w.-]*:)?absPath\s*>)",
    re.DOTALL,
)
LOCAL_POINTER = re.compile(rb"(?:/Users/|file://)", re.IGNORECASE)
LOCAL_POINTER_TEXT = re.compile(
    r"(?:/Users/|file://|(?<![A-Za-z])[A-Za-z]:[\\/]|\\\\[^\\\s/]+\\[^\\\s/]+)",
    re.IGNORECASE,
)
EXTERNAL_RELATIONSHIP = re.compile(
    rb"(?:TargetMode\s*=\s*[\"']External[\"']|Target\s*=\s*[\"'](?:file|https?)://)",
    re.IGNORECASE,
)
NORMALIZATION_LIMIT = 5
SHA256_HEX = re.compile(r"^[0-9a-f]{64}$")


class SourceSecurityError(Exception):
    pass


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def sanitize_workbook_xml(source: bytes) -> tuple[bytes, int]:
    sanitized, removed = ABS_PATH_ELEMENT.subn(b"", source)
    if removed == 0:
        raise SourceSecurityError("source workbook does not contain an absPath element")
    if LOCAL_POINTER.search(sanitized) or LOCAL_POINTER_TEXT.search(normalize_pointer_text(sanitized)):
        raise SourceSecurityError("sanitized workbook.xml still contains a local pointer")
    return sanitized, removed


def sanitize_core_properties(source: bytes) -> tuple[bytes, int]:
    sanitized = source
    replacements = 0
    for tag in (b"dc:creator", b"cp:lastModifiedBy"):
        pattern = re.compile(rb"<" + tag + rb">.*?</" + tag + rb">", re.DOTALL)
        sanitized, count = pattern.subn(
            b"<" + tag + b">" + REDACTED_OWNER.encode("utf-8") + b"</" + tag + b">",
            sanitized,
        )
        replacements += count
    return sanitized, replacements


def sanitize_comments(source: bytes) -> tuple[bytes, int, int]:
    sanitized = source
    author_replacements = 0
    for author in set(COMMENT_AUTHOR_ELEMENT.findall(source)):
        if not author:
            raise SourceSecurityError("XLSX comment author must not be empty")
        count = sanitized.count(author)
        sanitized = sanitized.replace(author, REDACTED_OWNER.encode("utf-8"))
        author_replacements += count
    sanitized, cleared_comment_texts = COMMENT_TEXT_ELEMENT.subn(rb"<\1/>", sanitized)
    return sanitized, author_replacements, cleared_comment_texts


def rewrite_backlog_status_label(source: bytes) -> tuple[bytes, int]:
    old = BACKLOG_2026_08_17_OLD_PUSH_TEXT.encode("utf-8")
    new = BACKLOG_2026_08_17_STATUS_TEXT.encode("utf-8")
    sanitized, replacements = source.replace(old, new), source.count(old)
    if replacements != 1:
        raise SourceSecurityError(
            "2026-08-17 workbook must contain exactly one accepted stale PUSH status label"
        )
    return sanitized, replacements


def normalize_pointer_text(data: bytes | str) -> str:
    if isinstance(data, bytes):
        text = data.decode("utf-8", errors="ignore")
    else:
        text = data
    for _ in range(NORMALIZATION_LIMIT):
        normalized = unquote(html.unescape(text))
        if normalized == text:
            break
        text = normalized
    return text


def verify_expected_original_sha256(source: Path, expected_original_sha256: str) -> str:
    if not SHA256_HEX.fullmatch(expected_original_sha256):
        raise SourceSecurityError("independent expected hash must be a lowercase SHA-256 value")
    actual_original_sha256 = sha256_file(source)
    if actual_original_sha256 != expected_original_sha256:
        raise SourceSecurityError(
            "source workbook does not match the independent expected hash"
        )
    return actual_original_sha256


def sanitize_xlsx(
    source: Path,
    target: Path,
    expected_original_sha256: str,
    *,
    profile: str = SOURCE_REFERENCE_PROFILE,
) -> dict:
    original_sha256 = verify_expected_original_sha256(source, expected_original_sha256)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None
    original_parts: dict[str, str] = {}
    sanitized_parts: dict[str, str] = {}
    changed_parts: list[str] = []
    removed_elements = 0
    redacted_core_properties = 0
    redacted_comment_markers = 0
    cleared_comment_texts = 0
    renamed_status_labels = 0

    try:
        with tempfile.NamedTemporaryFile(
            prefix=f".{target.name}.",
            suffix=".tmp",
            dir=target.parent,
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)

        with ZipFile(source, "r") as original, ZipFile(temporary_path, "w") as sanitized:
            if WORKBOOK_PART not in original.namelist():
                raise SourceSecurityError(f"XLSX is missing {WORKBOOK_PART}")
            for info in original.infolist():
                original_data = original.read(info.filename)
                sanitized_data = original_data
                if info.filename == WORKBOOK_PART:
                    sanitized_data, removed_elements = sanitize_workbook_xml(original_data)
                if profile == BACKLOG_2026_08_17_WORKING_PROFILE and info.filename == CORE_PROPS_PART:
                    sanitized_data, redacted_core_properties = sanitize_core_properties(sanitized_data)
                if profile == BACKLOG_2026_08_17_WORKING_PROFILE and info.filename == COMMENTS_PART:
                    sanitized_data, redacted_comment_markers, cleared_comment_texts = sanitize_comments(sanitized_data)
                if profile == BACKLOG_2026_08_17_WORKING_PROFILE and info.filename == SHARED_STRINGS_PART:
                    sanitized_data, renamed_status_labels = rewrite_backlog_status_label(sanitized_data)
                original_parts[info.filename] = sha256_bytes(original_data)
                sanitized_parts[info.filename] = sha256_bytes(sanitized_data)
                if sanitized_data != original_data:
                    changed_parts.append(info.filename)
                sanitized.writestr(info, sanitized_data)

        expected_changed_parts = [WORKBOOK_PART]
        if profile == BACKLOG_2026_08_17_WORKING_PROFILE:
            expected_changed_parts = [WORKBOOK_PART, SHARED_STRINGS_PART, COMMENTS_PART, CORE_PROPS_PART]
        if set(changed_parts) != set(expected_changed_parts):
            raise SourceSecurityError(f"unexpected sanitized XLSX parts changed: {changed_parts}")

        findings = _xlsx_findings(temporary_path.read_bytes(), "SANITIZED", target.as_posix())
        if findings:
            raise SourceSecurityError(f"sanitized XLSX contains forbidden content: {findings}")
        if profile == BACKLOG_2026_08_17_WORKING_PROFILE:
            personal_findings = _xlsx_personal_metadata_findings(
                temporary_path.read_bytes(),
                "SANITIZED",
                target.as_posix(),
            )
            if personal_findings:
                raise SourceSecurityError(
                    f"sanitized XLSX contains personal owner metadata: {personal_findings}"
                )

        temporary_path.replace(target)
        temporary_path = None

        return {
            "version": "1.0.0",
            "profile": profile,
            "transformation": (
                "remove_absPath_redact_owner_comment_metadata_and_apply_accepted_status_label"
                if profile == BACKLOG_2026_08_17_WORKING_PROFILE
                else "remove_namespace_independent_absPath_from_xl_workbook_xml"
            ),
            "original_sha256": original_sha256,
            "sanitized_sha256": sha256_file(target),
            "removed_abs_path_elements": removed_elements,
            "redacted_core_properties": redacted_core_properties,
            "redacted_comment_markers": redacted_comment_markers,
            "cleared_comment_texts": cleared_comment_texts,
            "renamed_status_labels": renamed_status_labels,
            "changed_parts": changed_parts,
            "original_part_sha256": original_parts,
            "sanitized_part_sha256": sanitized_parts,
            "owner_decisions": (
                {
                    "sheet_count": 3,
                    "preserve_formulas_and_structure": True,
                    "planned_role_values": "Лист1!J1:V1 use C1 multiplier; Лист1!J2:V2 are raw subtotals",
                    "resource_total_source": "Итоговые ресурсы!B4",
                    "resource_total": 304.4,
                    "resource_total_displayed": 304.4,
                    "resource_total_value_semantics": "Числовое значение Excel; XML-кэш формулы может хранить эквивалентное значение с двоичной погрешностью",
                    "partial_total_not_full_source": "Итоговые ресурсы!B8",
                    "renamed_third_sheet_status_label": BACKLOG_2026_08_17_STATUS_TEXT,
                    "system_push_excluded": True,
                }
                if profile == BACKLOG_2026_08_17_WORKING_PROFILE
                else None
            ),
        }
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def _git(repo: Path, *args: str, binary: bool = False) -> bytes | str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=not binary,
    )
    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace") if binary else result.stderr
        raise SourceSecurityError(f"git {' '.join(args)} failed: {stderr.strip()}")
    return result.stdout


def _xlsx_findings(data: bytes, commit: str, workbook_path: str) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    try:
        with ZipFile(io.BytesIO(data)) as workbook:
            for part in workbook.namelist():
                if not part.lower().endswith((".xml", ".rels", ".txt", ".vml")):
                    continue
                part_data = workbook.read(part)
                normalized_text = normalize_pointer_text(part_data)
                finding = None
                if ABS_PATH_ELEMENT.search(part_data) or LOCAL_POINTER_TEXT.search(normalized_text):
                    finding = "xlsx_local_pointer"
                elif part.lower().endswith(".rels") and EXTERNAL_RELATIONSHIP.search(part_data):
                    finding = "xlsx_external_relationship"
                if finding:
                    findings.append(
                        {
                            "commit": commit,
                            "path": workbook_path,
                            "part": part,
                            "finding": finding,
                        }
                    )
    except BadZipFile:
        findings.append(
            {
                "commit": commit,
                "path": workbook_path,
                "part": "<package>",
                "finding": "invalid_xlsx_package",
            }
        )
    return findings


def _xlsx_personal_metadata_findings(data: bytes, commit: str, workbook_path: str) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    try:
        with ZipFile(io.BytesIO(data)) as workbook:
            for part, local_names in (
                (COMMENTS_PART, {"author"}),
                (CORE_PROPS_PART, {"creator", "lastModifiedBy"}),
            ):
                if part not in workbook.namelist():
                    continue
                root = ET.fromstring(workbook.read(part))
                values = [
                    (element.text or "").strip()
                    for element in root.iter()
                    if element.tag.rsplit("}", 1)[-1] in local_names
                ]
                if any(value != REDACTED_OWNER for value in values):
                    findings.append(
                        {
                            "commit": commit,
                            "path": workbook_path,
                            "part": part,
                            "finding": "xlsx_personal_owner_metadata",
                        }
                    )
            if part == COMMENTS_PART:
                comment_texts = [
                    "".join(comment_text.itertext()).strip()
                    for comment_text in root.findall(".//{*}comment/{*}text")
                ]
                if any(comment_texts):
                    findings.append(
                        {
                            "commit": commit,
                            "path": workbook_path,
                            "part": part,
                            "finding": "xlsx_comment_text_not_cleared",
                        }
                    )
    except (BadZipFile, ET.ParseError):
        findings.append(
            {
                "commit": commit,
                "path": workbook_path,
                "part": "<package>",
                "finding": "invalid_xlsx_package",
            }
        )
    return findings


def scan_git_history(repo: Path, base: str, head: str) -> list[dict[str, str]]:
    commits_text = _git(repo, "rev-list", "--reverse", f"{base}..{head}")
    assert isinstance(commits_text, str)
    findings: list[dict[str, str]] = []
    xlsx_findings_by_blob: dict[str, list[dict[str, str]]] = {}
    for commit in filter(None, commits_text.splitlines()):
        tree_text = _git(repo, "ls-tree", "-r", "-z", commit)
        assert isinstance(tree_text, str)
        for entry in filter(None, tree_text.split("\0")):
            try:
                metadata, tracked_path = entry.split("\t", 1)
                _mode, object_type, blob_sha = metadata.split()
            except ValueError as error:
                raise SourceSecurityError(f"cannot parse git tree entry for {commit}: {entry!r}") from error
            if tracked_path == FORBIDDEN_RAW_PATH:
                findings.append(
                    {
                        "commit": commit,
                        "path": tracked_path,
                        "part": "<path>",
                        "finding": "forbidden_raw_xlsx_path",
                    }
                )
                continue
            if not tracked_path.lower().endswith(".xlsx"):
                continue
            if object_type != "blob":
                continue
            if blob_sha not in xlsx_findings_by_blob:
                data = _git(repo, "show", f"{commit}:{tracked_path}", binary=True)
                assert isinstance(data, bytes)
                xlsx_findings_by_blob[blob_sha] = _xlsx_findings(data, "<commit>", "<path>")
            findings.extend(
                {
                    **finding,
                    "commit": commit,
                    "path": tracked_path,
                }
                for finding in xlsx_findings_by_blob[blob_sha]
            )
    return findings


def validate_reference(
    reference: Path,
    manifest_path: Path,
    expected_original_sha256: str,
    *,
    profile: str = SOURCE_REFERENCE_PROFILE,
) -> None:
    if not SHA256_HEX.fullmatch(expected_original_sha256):
        raise SourceSecurityError("independent expected hash must be a lowercase SHA-256 value")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("original_sha256") != expected_original_sha256:
        raise SourceSecurityError("sanitization manifest does not match the independent expected hash")
    if sha256_file(reference) != manifest["sanitized_sha256"]:
        raise SourceSecurityError("sanitized XLSX hash does not match its manifest")
    with ZipFile(reference) as workbook:
        actual_parts = {name: sha256_bytes(workbook.read(name)) for name in workbook.namelist()}
    actual_part_set = set(actual_parts)
    original_part_set = set(manifest["original_part_sha256"])
    sanitized_part_set = set(manifest["sanitized_part_sha256"])
    if actual_part_set != original_part_set or actual_part_set != sanitized_part_set:
        raise SourceSecurityError("original, sanitized, and actual XLSX part sets do not match")
    if actual_parts != manifest["sanitized_part_sha256"]:
        raise SourceSecurityError("sanitized XLSX parts do not match their manifest")
    changed = [
        name
        for name, original_hash in manifest["original_part_sha256"].items()
        if actual_parts.get(name) != original_hash
    ]
    expected_changed_parts = [WORKBOOK_PART]
    if profile == BACKLOG_2026_08_17_WORKING_PROFILE:
        expected_changed_parts = [WORKBOOK_PART, SHARED_STRINGS_PART, COMMENTS_PART, CORE_PROPS_PART]
    if set(changed) != set(manifest["changed_parts"]) or set(changed) != set(expected_changed_parts):
        raise SourceSecurityError(f"sanitized XLSX has unexpected changed parts: {changed}")
    findings = _xlsx_findings(reference.read_bytes(), "HEAD", reference.as_posix())
    if findings:
        raise SourceSecurityError(f"sanitized XLSX contains forbidden content: {findings}")
    if profile == BACKLOG_2026_08_17_WORKING_PROFILE:
        if manifest.get("profile") != BACKLOG_2026_08_17_WORKING_PROFILE:
            raise SourceSecurityError("2026-08-17 sanitized manifest has an unexpected profile")
        if manifest.get("renamed_status_labels") != 1:
            raise SourceSecurityError("2026-08-17 sanitized manifest must record exactly one status-label rename")
        personal_findings = _xlsx_personal_metadata_findings(reference.read_bytes(), "HEAD", reference.as_posix())
        if personal_findings:
            raise SourceSecurityError(f"sanitized XLSX contains personal owner metadata: {personal_findings}")


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    sanitize = subparsers.add_parser("sanitize")
    sanitize.add_argument("--source", required=True, type=Path)
    sanitize.add_argument("--target", required=True, type=Path)
    sanitize.add_argument("--manifest", required=True, type=Path)
    sanitize.add_argument("--expected-original-sha256", required=True)
    sanitize.add_argument("--profile", default=SOURCE_REFERENCE_PROFILE, choices=[SOURCE_REFERENCE_PROFILE, BACKLOG_2026_08_17_WORKING_PROFILE])

    validate = subparsers.add_parser("validate-reference")
    validate.add_argument("--reference", required=True, type=Path)
    validate.add_argument("--manifest", required=True, type=Path)
    validate.add_argument("--expected-original-sha256", required=True)
    validate.add_argument("--profile", default=SOURCE_REFERENCE_PROFILE, choices=[SOURCE_REFERENCE_PROFILE, BACKLOG_2026_08_17_WORKING_PROFILE])

    history = subparsers.add_parser("scan-history")
    history.add_argument("--base", default="origin/main")
    history.add_argument("--head", default="HEAD")
    history.add_argument("--repo", default=ROOT, type=Path)

    args = parser.parse_args()
    try:
        if args.command == "sanitize":
            manifest = sanitize_xlsx(args.source, args.target, args.expected_original_sha256, profile=args.profile)
            manifest["original_source"] = "external_product_owner_source"
            manifest["sanitized_path"] = args.target.as_posix()
            write_json(args.manifest, manifest)
            print(f"sanitized XLSX written: {args.target}")
        elif args.command == "validate-reference":
            validate_reference(args.reference, args.manifest, args.expected_original_sha256, profile=args.profile)
            print("sanitized XLSX reference validation passed")
        else:
            findings = scan_git_history(args.repo, args.base, args.head)
            if findings:
                print(json.dumps({"status": "failed", "findings": findings}, indent=2), file=sys.stderr)
                return 1
            print(f"Git history hygiene passed: {args.base}..{args.head}")
    except (SourceSecurityError, OSError, KeyError, BadZipFile) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
