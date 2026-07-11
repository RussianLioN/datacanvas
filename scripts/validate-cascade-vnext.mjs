import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  assertStateTransition,
  buildActualDiffManifest,
  canClaimDone,
  classifyXlsxChangeSignals,
  resolveSourceIdentities,
  statusLabel,
  verifyAppliedResolution,
} from "./cascade-vnext-core.mjs";
import { publishAtomicPackage } from "./cascade-atomic-publisher.mjs";
import { analyzeSemanticCascade } from "./cascade-semantic-impact.mjs";
import { buildValidationManifest } from "./cascade-validation-manifest.mjs";
import {
  assertValidationManifestIntegrity,
  parseSafeNpmCommand,
} from "./cascade-profile-verifier.mjs";
import {
  assertRuntimeManifestMatches,
  completionCommandSet,
  completionCommandSetHash,
} from "./cascade-completion-core.mjs";

const sourceRegistry = {
  sources: [
    {
      source_id: "SRC-DC-XLSX",
      path: "docs/product/sources/working/backlog.xlsx",
      provenance_manifest: "docs/product/sources/working/backlog.provenance.json",
    },
    {
      source_id: "SRC-DC-VISION",
      path: "docs/product-vision.md",
      provenance_manifest: null,
    },
  ],
};

assert.deepEqual(
  resolveSourceIdentities({
    sourceRegistry,
    triggerPaths: ["docs/product/sources/working/backlog.xlsx"],
  }).map((item) => item.source_id),
  ["SRC-DC-XLSX"],
  "однозначный источник должен определяться из активного реестра",
);
assert.throws(
  () => resolveSourceIdentities({ sourceRegistry, triggerPaths: ["docs/unregistered.xlsx"] }),
  /source identity/u,
  "незарегистрированный XLSX не должен переходить к legacy target fallback",
);
assert.deepEqual(
  resolveSourceIdentities({
    sourceRegistry,
    triggerPaths: ["docs/product/sources/product-source-registry.json"],
    registryDelta: {
      delta_id: "PSR-DELTA-001",
      before_sha256: "a".repeat(64),
      after_sha256: "b".repeat(64),
      source_selectors: [{ source_id: "SRC-DC-XLSX", operation: "rename" }],
    },
  }).map((item) => item.source_id),
  ["SRC-DC-XLSX"],
  "изменение реестра должно иметь явный delta manifest",
);

assert.doesNotThrow(() => assertStateTransition("planned", "awaiting_owner"));
assert.doesNotThrow(() => assertStateTransition("profile_verified", "verified", "cascade:complete"));
assert.throws(() => assertStateTransition("profile_verified", "verified", "cascade:verify"), /cascade:complete/u);
assert.equal(canClaimDone("profile_verified", "cascade:verify"), false);
assert.equal(canClaimDone("verified", "cascade:complete"), true);
assert.equal(statusLabel("profile_verified"), "Профильные проверки пройдены, завершение не подтверждено");

const diffManifest = buildActualDiffManifest({
  baseSha: "1".repeat(40),
  planningHeadSha: "1".repeat(40),
  candidateHeadSha: "2".repeat(40),
  entries: [
    { status: "M", path: "docs/product-vision.md" },
    { status: "A", path: "docs/process/cascading-governance/runs/RUN-NEW/seal.json" },
  ],
  allowedWrites: ["docs/product-vision.md", "docs/process/cascading-governance/runs/RUN-NEW"],
  dirty: false,
});
assert.deepEqual(diffManifest.unexpected_paths, []);
assert.throws(
  () => buildActualDiffManifest({
    baseSha: "1".repeat(40),
    planningHeadSha: "1".repeat(40),
    candidateHeadSha: "2".repeat(40),
    entries: [{ status: "M", path: "docs/unrelated.md" }],
    allowedWrites: ["docs/product-vision.md"],
    dirty: false,
  }),
  /unexpected changed paths/u,
);

assert.doesNotThrow(() => verifyAppliedResolution({
  updateStatus: "applied",
  afterSha256: "c".repeat(64),
  expectedAfterSha256: "c".repeat(64),
}));
assert.throws(
  () => verifyAppliedResolution({
    updateStatus: "applied",
    afterSha256: "c".repeat(64),
    expectedAfterSha256: "d".repeat(64),
  }),
  /expected after hash/u,
);
assert.doesNotThrow(() => verifyAppliedResolution({
  updateStatus: "applied",
  afterSha256: "c".repeat(64),
  patchDigest: "e".repeat(64),
  actualPatchDigest: "e".repeat(64),
}));
assert.throws(
  () => verifyAppliedResolution({
    updateStatus: "applied",
    afterSha256: "c".repeat(64),
    patchDigest: "e".repeat(64),
    actualPatchDigest: "f".repeat(64),
  }),
  /patch digest/u,
);

assert.deepEqual(
  classifyXlsxChangeSignals({ priorityChanged: true, estimateChanged: true, formattingChanged: true }),
  ["estimate_change", "formatting_change", "priority_change"],
);
assert.deepEqual(
  classifyXlsxChangeSignals({ formulaCacheOnly: true }),
  ["formula_cache_only"],
);
assert.deepEqual(classifyXlsxChangeSignals({ noChange: true }), ["no_change"]);

const graph = {
  artifacts: [
    { path: "vision", authority_scope: ["product_meaning"], validation_command: "npm run validate:product-vision" },
    { path: "stories", authority_scope: ["story_meaning"], validation_command: "npm run validate:business-docs" },
    { path: "backlog", authority_scope: [], validation_command: "npm run validate:backlog-registry" },
    { path: "roadmap", authority_scope: [], validation_command: "npm run validate:roadmap" },
  ],
  dependencies: [
    { edge_id: "EDGE-1", upstream_artifact: "vision", downstream_artifact: "stories", relation_type: "semantic", validation_command: "npm run validate:business-docs" },
    { edge_id: "EDGE-2", upstream_artifact: "stories", downstream_artifact: "backlog", relation_type: "semantic", validation_command: "npm run validate:backlog-registry" },
    { edge_id: "EDGE-3", upstream_artifact: "vision", downstream_artifact: "roadmap", relation_type: "semantic", validation_command: "npm run validate:roadmap" },
  ],
};
const semanticReview = analyzeSemanticCascade(graph, [
  { path: "backlog", change_classes: ["priority_change"] },
]);
assert.deepEqual(semanticReview.authoritative_review_paths, ["stories", "vision"]);
assert.equal(semanticReview.write_obligations.includes("roadmap"), false);
assert.equal(semanticReview.diagnostic_closure.includes("roadmap"), true);
const authoritativeExpansion = analyzeSemanticCascade(graph, [
  { path: "vision", change_classes: ["product_meaning"] },
]);
assert.deepEqual(authoritativeExpansion.write_obligations, ["backlog", "roadmap", "stories"]);
const xlsxScopedGraph = {
  artifacts: [
    { path: "xlsx", authority_scope: ["effort_estimate"] },
    { path: "effort", authority_scope: [] },
    { path: "stories", authority_scope: ["story_text_change"] },
  ],
  dependencies: [
    { edge_id: "EDGE-X1", upstream_artifact: "xlsx", downstream_artifact: "effort", relation_type: "resource", applicable_change_classes: ["estimate_change"], validation_command: "npm run validate:capacity-plan" },
    { edge_id: "EDGE-X2", upstream_artifact: "xlsx", downstream_artifact: "stories", relation_type: "semantic", applicable_change_classes: ["story_text_change"], validation_command: "npm run validate:business-docs" },
  ],
};
assert.deepEqual(
  analyzeSemanticCascade(xlsxScopedGraph, [{ path: "xlsx", change_classes: ["estimate_change"] }]).write_obligations,
  ["effort"],
);

const validationCatalog = {
  commands: [
    { id: "business-docs", command: "npm run validate:business-docs", gate: "profile", completion_blocking: true, mutates_files: false, applies_to: ["product_meaning"] },
    { id: "security", command: "npm run scan:secrets", gate: "security", completion_blocking: true, mutates_files: false, applies_to: ["security"] },
    { id: "full", command: "npm test", gate: "full", completion_blocking: true, mutates_files: true, applies_to: ["full"] },
  ],
};
const validationManifest = buildValidationManifest({
  catalog: validationCatalog,
  routeCommands: ["npm run validate:business-docs"],
  scopes: ["product_meaning", "security"],
  includeFull: false,
});
assert.deepEqual(validationManifest.planned_commands.map((item) => item.id), ["business-docs", "security"]);
assert.throws(
  () => buildValidationManifest({
    catalog: validationCatalog,
    routeCommands: ["npm run validate:missing"],
    scopes: ["product_meaning"],
  }),
  /not present in the validation catalog/u,
);
assert.deepEqual(
  parseSafeNpmCommand("npm run validate:product-sources && npm run validate:product-source-consistency"),
  ["validate:product-sources", "validate:product-source-consistency"],
);
assert.throws(
  () => parseSafeNpmCommand(`npm run validate:schemas; ${"rm "}${"-rf /"}`),
  /safe npm run/u,
);
assert.throws(() => parseSafeNpmCommand("node scripts/arbitrary.mjs"), /safe npm run/u);
assert.doesNotThrow(() => assertValidationManifestIntegrity(validationManifest));
assert.throws(
  () => assertValidationManifestIntegrity({ ...validationManifest, verification_level: "completion" }),
  /manifest sha256/u,
);
const runtimeManifest = {
  version: "1.0.0",
  node: "22.20.0",
  npm: "11.8.0",
  python: "3.13.0",
  platform: "darwin",
  arch: "arm64",
  locale: "C.UTF-8",
  timezone: "UTC",
  lockfile_sha256: "a".repeat(64),
  command_map_sha256: "b".repeat(64),
  environment_allowlist: ["CI", "LANG", "LC_ALL", "TZ"],
};
assert.doesNotThrow(() => assertRuntimeManifestMatches(runtimeManifest, { ...runtimeManifest }));
assert.throws(
  () => assertRuntimeManifestMatches(runtimeManifest, { ...runtimeManifest, node: "23.0.0" }),
  /runtime manifest mismatch/u,
);
assert.match(completionCommandSetHash(completionCommandSet()), /^[0-9a-f]{64}$/u);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-cascade-vnext-"));
try {
  const targetDir = path.join(tempRoot, "runs", "RUN-001");
  publishAtomicPackage({
    targetDir,
    attemptId: "ATTEMPT-001",
    files: new Map([
      ["run.json", `${JSON.stringify({ status: "planned" }, null, 2)}\n`],
      ["report.md", "# Проверочный запуск\n"],
    ]),
    validate: (stagingDir) => {
      assert.equal(fs.existsSync(path.join(stagingDir, "run.json")), true);
    },
  });
  assert.equal(fs.existsSync(path.join(targetDir, "run.json")), true);
  assert.throws(
    () => publishAtomicPackage({
      targetDir,
      attemptId: "ATTEMPT-002",
      files: new Map([["run.json", "{}\n"]]),
    }),
    /already exists/u,
  );
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log("cascade vNext validation passed");
