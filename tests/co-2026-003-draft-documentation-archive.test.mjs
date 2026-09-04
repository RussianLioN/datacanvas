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
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const primaryXlsxPath = "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx";

test("архив черновика CO-2026-003 содержит автономный прототип и полный объявленный состав", () => {
  const contract = readCo2026003DraftDocumentationArchiveContract(root);
  const archive = readStoredZip(buildCo2026003DraftDocumentationArchive(root, contract));

  assert.match(contract.archive_id, /^co-2026-003-/u);
  assert.equal(contract.release_kind, "draft_documentation_evidence_only");
  assert.equal(contract.release_approval_ledger_path, undefined);
  assert.deepEqual(contract.historical_snapshot, {
    amendment_id: "CO3-AMND-002",
    decision_register_path: "docs/product/change-orders/co-2026-003-authoritative-interview-decision-register.json",
    prototype_manifest_path: "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/prototype-draft/manifest.json",
    prototype_status: "draft_prototype_accepted_for_documentation_cascade",
    accepted_scope: "isolated_draft_only",
    active_release_switch_allowed: false,
    high_resolution_render_allowed: false,
    delivery_archive_allowed: false,
  });
  assert.deepEqual(contract.exclude_primary_artifacts, [primaryXlsxPath]);
  assert.ok(contract.forbidden_extensions.includes(".xlsx"));
  assert.ok(archive.has("index.html"));
  assert.ok(archive.has("README.md"));
  assert.ok(archive.has("manifest.json"));
  assert.ok(archive.has("repository/docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/prototype-draft/index.html"));
  assert.ok(archive.has("repository/docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/prototype-draft/manifest.json"));
  for (const currentArtifact of [
    "docs/product/requirements/README.md",
    "docs/product/sources/co-2026-003-current-2026-scope.md",
    "docs/product/sources/co-2026-003-current-2026-scope.json",
    "docs/product/requirements/business-requirements.md",
    "docs/product/requirements/user-stories.md",
    "docs/product/sources/story-catalog-content-lock.json",
    "docs/product/backlog/product-backlog.md",
    "docs/product/requirements/traceability-matrix.json",
  ]) {
    assert.ok(archive.has(`repository/${currentArtifact}`), `архив включает актуальный артефакт: ${currentArtifact}`);
  }

  const specificationManifest = readJson("docs/product/specs/generated-spec-package-manifest.json");
  for (const specification of specificationManifest.outputs) {
    assert.ok(archive.has(`repository/${specification.path}`), `архив включает спецификацию текущего пакета: ${specification.path}`);
  }

  const manifest = JSON.parse(archive.get("manifest.json").toString("utf8"));
  assert.equal(manifest.release_kind, "draft_documentation_evidence_only");
  assert.equal(manifest.final_release_authorized, false);
  assert.equal(manifest.prototype_frame_count, 11);
  assert.match(manifest.draft_snapshot_fingerprint, /^[a-f0-9]{64}$/u);
  assert.ok(manifest.entries.every((entry) => archive.has(entry.archive_path)));

  for (const forbiddenSuffix of [".pdf", ".xlsx", "lisa-presentation-user-journey-demo.zip"]) {
    assert.equal([...archive.keys()].some((entry) => entry.endsWith(forbiddenSuffix)), false, `архив не должен содержать ${forbiddenSuffix}`);
  }
});

test("исторический архив собирается при финальном текущем выпуске", () => {
  const contract = readCo2026003DraftDocumentationArchiveContract(root);
  const currentLedger = readJson("docs/product/change-orders/co-2026-003-release-approval-ledger.json");

  assert.equal(currentLedger.final_release.status, "owner_final_approved");
  assert.doesNotThrow(() => buildCo2026003DraftDocumentationArchive(root, contract));
});

test("подмена каждого запрета замороженного снимка блокирует сборку исторического архива", () => {
  const contract = readCo2026003DraftDocumentationArchiveContract(root);
  for (const [flag, expectedError] of [
    ["active_release_switch_allowed", /замороженн.*сним.*переключение/u],
    ["high_resolution_render_allowed", /замороженн.*сним.*высокоразреш/u],
    ["delivery_archive_allowed", /замороженн.*сним.*архив поставки/u],
  ]) {
    const tamperedContract = structuredClone(contract);
    tamperedContract.historical_snapshot[flag] = true;
    assert.throws(
      () => buildCo2026003DraftDocumentationArchive(root, tamperedContract),
      expectedError,
      `подмена ${flag} должна блокировать сборку`,
    );
  }
});

test("проверка чернового архива обнаруживает подмену байтов члена", () => {
  const contract = readCo2026003DraftDocumentationArchiveContract(root);
  const archive = buildCo2026003DraftDocumentationArchive(root, contract);
  const changed = Buffer.from(archive);
  changed[changed.length - 40] ^= 0x01;
  assert.throws(() => readStoredZip(changed), /повреждена|неканоничный|не совпадает/u);
});
