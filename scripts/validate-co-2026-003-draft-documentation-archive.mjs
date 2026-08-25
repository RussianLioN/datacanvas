import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  DRAFT_CONTRACT_PATH,
  buildCo2026003DraftDocumentationArchive,
  readCo2026003DraftDocumentationArchiveContract,
} from "./lib/co-2026-003-draft-documentation-archive.mjs";
import { readStoredZip } from "./lib/documentation-archive.mjs";

function fail(message) {
  throw new Error(message);
}

function validate() {
  const root = process.cwd();
  const contract = readCo2026003DraftDocumentationArchiveContract(root);
  const outputPath = path.resolve(root, contract.output_path);
  if (!fs.existsSync(outputPath)) fail("архивный снимок черновика отсутствует");
  const expected = buildCo2026003DraftDocumentationArchive(root, contract);
  const actual = fs.readFileSync(outputPath);
  if (!actual.equals(expected)) fail("архивный снимок черновика не совпадает с текущими источниками");

  const archive = readStoredZip(actual);
  for (const required of ["index.html", "README.md", "manifest.json", "prototype/index.html", "prototype/manifest.json"]) {
    if (!archive.has(required)) fail(`архивный снимок черновика не содержит ${required}`);
  }
  const manifest = JSON.parse(archive.get("manifest.json").toString("utf8"));
  if (
    manifest.archive_id !== contract.archive_id ||
    manifest.release_kind !== "draft_documentation_evidence_only" ||
    manifest.final_release_authorized !== false ||
    manifest.prototype_frame_count !== contract.required_prototype_frame_count ||
    !/^[a-f0-9]{64}$/u.test(manifest.draft_snapshot_fingerprint) ||
    !Array.isArray(manifest.entries)
  ) fail("манифест архивного снимка не подтверждает границу черновика");
  for (const entry of manifest.entries) {
    if (!archive.has(entry.archive_path) || archive.get(entry.archive_path).length !== entry.size) fail(`манифест архивного снимка не соответствует члену ${entry.archive_path}`);
  }
  for (const name of archive.keys()) {
    if (/\.pdf$/iu.test(name) || name.includes("lisa-presentation-user-journey-demo.zip") || /\/(?:demo|derived|evidence)\//u.test(`/${name}`)) {
      fail(`архивный снимок содержит запрещённый материал: ${name}`);
    }
  }
  for (const name of ["index.html", "README.md"]) {
    const content = archive.get(name).toString("utf8");
    if (/(?:\/Users\/|file:\/\/|\.pdf\b|lisa-presentation-user-journey-demo\.zip)/iu.test(content)) fail(`${name}: содержит непереносимую или историческую ссылку`);
  }
  console.log(`архивный снимок черновика подтверждён: ${DRAFT_CONTRACT_PATH}`);
}

try {
  validate();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "архивный снимок не прошёл проверку"}\n`);
  process.exitCode = 1;
}
