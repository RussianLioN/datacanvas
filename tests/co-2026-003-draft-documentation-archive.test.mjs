import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildCo2026003DraftDocumentationArchive,
  readCo2026003DraftDocumentationArchiveContract,
} from "../scripts/lib/co-2026-003-draft-documentation-archive.mjs";
import { readStoredZip } from "../scripts/lib/documentation-archive.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("архив черновика CO-2026-003 содержит автономный прототип и полный объявленный состав", () => {
  const contract = readCo2026003DraftDocumentationArchiveContract(root);
  const archive = readStoredZip(buildCo2026003DraftDocumentationArchive(root, contract));

  assert.match(contract.archive_id, /^co-2026-003-/u);
  assert.equal(contract.release_kind, "draft_documentation_evidence_only");
  assert.ok(archive.has("index.html"));
  assert.ok(archive.has("README.md"));
  assert.ok(archive.has("manifest.json"));
  assert.ok(archive.has("prototype/index.html"));
  assert.ok(archive.has("prototype/manifest.json"));

  const manifest = JSON.parse(archive.get("manifest.json").toString("utf8"));
  assert.equal(manifest.release_kind, "draft_documentation_evidence_only");
  assert.equal(manifest.final_release_authorized, false);
  assert.equal(manifest.prototype_frame_count, 11);
  assert.match(manifest.draft_snapshot_fingerprint, /^[a-f0-9]{64}$/u);
  assert.ok(manifest.entries.every((entry) => archive.has(entry.archive_path)));

  for (const forbiddenSuffix of [".pdf", "lisa-presentation-user-journey-demo.zip"]) {
    assert.equal([...archive.keys()].some((entry) => entry.endsWith(forbiddenSuffix)), false, `архив не должен содержать ${forbiddenSuffix}`);
  }
});

test("проверка чернового архива обнаруживает подмену байтов члена", () => {
  const contract = readCo2026003DraftDocumentationArchiveContract(root);
  const archive = buildCo2026003DraftDocumentationArchive(root, contract);
  const changed = Buffer.from(archive);
  changed[changed.length - 40] ^= 0x01;
  assert.throws(() => readStoredZip(changed), /повреждена|неканоничный|не совпадает/u);
});
