#!/usr/bin/env python3
"""Sanitize DataCanvas XLSX sources and reject unsafe workbook history."""

from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
import re
import subprocess
import sys
from urllib.parse import unquote
from pathlib import Path
from zipfile import BadZipFile, ZipFile


ROOT = Path(__file__).resolve().parents[1]
WORKBOOK_PART = "xl/workbook.xml"
FORBIDDEN_RAW_PATH = "docs/product/sources/raw/bl-value-rm-data-canvas.xlsx"
ABS_PATH_ELEMENT = re.compile(
    rb"<(?:[A-Za-z_][\w.-]*:)?absPath\b[^>]*?(?:/>|>.*?</(?:[A-Za-z_][\w.-]*:)?absPath\s*>)",
    re.DOTALL,
)
LOCAL_POINTER = re.compile(rb"(?:/Users/|file://)", re.IGNORECASE)
LOCAL_POINTER_TEXT = re.compile(r"(?:/Users/|file://|[A-Za-z]:\\|\\\\[^\\\s/]+\\[^\\\s/]+)", re.IGNORECASE)
EXTERNAL_RELATIONSHIP = re.compile(
    rb"(?:TargetMode\s*=\s*[\"']External[\"']|Target\s*=\s*[\"'](?:file|https?)://)",
    re.IGNORECASE,
)


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
    if LOCAL_POINTER.search(sanitized):
        raise SourceSecurityError("sanitized workbook.xml still contains a local pointer")
    return sanitized, removed


def sanitize_xlsx(source: Path, target: Path) -> dict:
    target.parent.mkdir(parents=True, exist_ok=True)
    original_parts: dict[str, str] = {}
    sanitized_parts: dict[str, str] = {}
    changed_parts: list[str] = []
    removed_elements = 0

    with ZipFile(source, "r") as original, ZipFile(target, "w") as sanitized:
        if WORKBOOK_PART not in original.namelist():
            raise SourceSecurityError(f"XLSX is missing {WORKBOOK_PART}")
        for info in original.infolist():
            original_data = original.read(info.filename)
            sanitized_data = original_data
            if info.filename == WORKBOOK_PART:
                sanitized_data, removed_elements = sanitize_workbook_xml(original_data)
            original_parts[info.filename] = sha256_bytes(original_data)
            sanitized_parts[info.filename] = sha256_bytes(sanitized_data)
            if sanitized_data != original_data:
                changed_parts.append(info.filename)
            sanitized.writestr(info, sanitized_data)

    if changed_parts != [WORKBOOK_PART]:
        raise SourceSecurityError(f"unexpected sanitized XLSX parts changed: {changed_parts}")

    return {
        "version": "1.0.0",
        "transformation": "remove_namespace_independent_absPath_from_xl_workbook_xml",
        "original_sha256": sha256_file(source),
        "sanitized_sha256": sha256_file(target),
        "removed_abs_path_elements": removed_elements,
        "changed_parts": changed_parts,
        "original_part_sha256": original_parts,
        "sanitized_part_sha256": sanitized_parts,
    }


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
                normalized_text = unquote(html.unescape(part_data.decode("utf-8", errors="ignore")))
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


def scan_git_history(repo: Path, base: str, head: str) -> list[dict[str, str]]:
    commits_text = _git(repo, "rev-list", "--reverse", f"{base}..{head}")
    assert isinstance(commits_text, str)
    findings: list[dict[str, str]] = []
    for commit in filter(None, commits_text.splitlines()):
        paths_text = _git(repo, "ls-tree", "-r", "--name-only", commit)
        assert isinstance(paths_text, str)
        for tracked_path in filter(None, paths_text.splitlines()):
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
            data = _git(repo, "show", f"{commit}:{tracked_path}", binary=True)
            assert isinstance(data, bytes)
            findings.extend(_xlsx_findings(data, commit, tracked_path))
    return findings


def validate_reference(reference: Path, manifest_path: Path) -> None:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
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
    if changed != manifest["changed_parts"] or changed != [WORKBOOK_PART]:
        raise SourceSecurityError(f"sanitized XLSX has unexpected changed parts: {changed}")
    findings = _xlsx_findings(reference.read_bytes(), "HEAD", reference.as_posix())
    if findings:
        raise SourceSecurityError(f"sanitized XLSX contains forbidden content: {findings}")


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

    validate = subparsers.add_parser("validate-reference")
    validate.add_argument("--reference", required=True, type=Path)
    validate.add_argument("--manifest", required=True, type=Path)

    history = subparsers.add_parser("scan-history")
    history.add_argument("--base", default="origin/main")
    history.add_argument("--head", default="HEAD")
    history.add_argument("--repo", default=ROOT, type=Path)

    args = parser.parse_args()
    try:
        if args.command == "sanitize":
            manifest = sanitize_xlsx(args.source, args.target)
            manifest["original_source"] = "external_product_owner_source"
            manifest["sanitized_path"] = args.target.as_posix()
            write_json(args.manifest, manifest)
            print(f"sanitized XLSX written: {args.target}")
        elif args.command == "validate-reference":
            validate_reference(args.reference, args.manifest)
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
