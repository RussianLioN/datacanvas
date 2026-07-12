import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  assertCascadeReplayInputs,
  assertCascadeReplayKey,
  assertStateTransition,
  assertRegistryDeltaIntegrity,
  buildCascadeReplayKey,
  buildActualDiffManifest,
  canClaimDone,
  classifyXlsxChangeSignals,
  deriveRegistryDeltaSelectors,
  expandAllowedWritesForRenames,
  resolveActualTriggerPaths,
  resolveSourceIdentities,
  statusLabel,
  verifyAppliedResolution,
} from "./cascade-vnext-core.mjs";
import { publishAtomicPackage } from "./cascade-atomic-publisher.mjs";
import { analyzeSemanticCascade } from "./cascade-semantic-impact.mjs";
import { assertValidationEvidenceComplete, buildValidationManifest } from "./cascade-validation-manifest.mjs";
import {
  assertValidationManifestIntegrity,
  parseSafeNpmCommand,
} from "./cascade-profile-verifier.mjs";
import {
  assertRuntimeManifestMatches,
  commandResultPassed,
  completionCommandSet,
  completionCommandSetHash,
} from "./cascade-completion-core.mjs";
import {
  interactiveAcceptanceEvidenceHash,
  requiredOwnerRoles,
  validateOwnerAcceptanceSet,
} from "./cascade-owner-acceptance.mjs";
import { hashJsonDocument } from "./cascade-evidence-utils.mjs";
import {
  buildRuntimeManifest,
  createIsolatedNpmEnvironment,
  sanitizeOutput,
  validateDocument,
  verifyAcceptanceConfirmationEvidence,
} from "./cascade-vnext-runtime.mjs";

const longValidationOutput = `head-marker\n${"x".repeat(5000)}\ntail-marker`;
const summarizedValidationOutput = sanitizeOutput(longValidationOutput, process.cwd());
assert.match(summarizedValidationOutput, /head-marker/u);
assert.match(summarizedValidationOutput, /tail-marker/u);
assert.ok(summarizedValidationOutput.length <= 4000);

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

assert.throws(() => validateDocument(process.cwd(), {
  version: "1.0.0",
  resolution_id: "CRI-2026-07-12-001",
  source_run_path: "docs/process/cascading-governance/runs/example/cascade-vnext-run.json",
  resolved_at: "2026-07-12T00:00:00Z",
  source_resolutions: [{
    path: "docs/product-vision.md",
    update_status: "no_change_confirmed",
    no_change_rationale: {
      rationale: "Проверочный артефакт не требует изменения.",
      confirmed_by: "DataCanvas Cascade Test",
      confirmed_at: "2026-07-12T00:00:00Z",
      source_artifact: "docs/product-vision.md",
      change_class: "process_structure_change",
      covered_requirements: ["Проверка запрета переименования без примененной правки."],
      acceptance_impact: "Критерии приемки не меняются.",
      traceability_impact: "Связи не меняются.",
      residual_risk: "Остаточного риска нет.",
      owner_role: "Process Owner",
      reconsider_when: "Пересмотреть при изменении источника.",
    },
    rename_from_path: "docs/product-vision-old.md",
    rename_to_path: "docs/product-vision.md",
  }],
  artifact_resolutions: [],
  decision_resolutions: [],
}, "schemas/cascade-resolution-input.schema.json"), /validation failed/u);

assert.deepEqual(
  resolveSourceIdentities({
    sourceRegistry,
    triggerPaths: ["docs/product/sources/working/backlog.xlsx"],
  }).map((item) => item.source_id),
  ["SRC-DC-XLSX"],
  "однозначный источник должен определяться из активного реестра",
);
const registryBefore = {
  sources: [{ source_id: "SRC-DC-XLSX", path: "docs/product/sources/working/backlog-old.xlsx" }],
};
const registryAfter = {
  sources: [{ source_id: "SRC-DC-XLSX", path: "docs/product/sources/working/backlog.xlsx" }],
};
assert.deepEqual(deriveRegistryDeltaSelectors({
  sources: [
    { source_id: "SRC-A", path: "docs/a.md" },
    { source_id: "SRC-B", path: "docs/b.md", owner_role: "Old Owner" },
    { source_id: "SRC-C", path: "docs/c-old.md" },
  ],
}, {
  sources: [
    { source_id: "SRC-B", path: "docs/b.md", owner_role: "New Owner" },
    { source_id: "SRC-C", path: "docs/c-new.md" },
    { source_id: "SRC-D", path: "docs/d.md" },
  ],
}), [
  { source_id: "SRC-A", operation: "remove" },
  { source_id: "SRC-B", operation: "update" },
  { source_id: "SRC-C", operation: "rename" },
  { source_id: "SRC-D", operation: "add" },
]);
assert.doesNotThrow(() => assertRegistryDeltaIntegrity({
  before_sha256: "a".repeat(64),
  after_sha256: "b".repeat(64),
  source_selectors: [{ source_id: "SRC-DC-XLSX", operation: "rename" }],
}, {
  beforeSha256: "a".repeat(64),
  afterSha256: "b".repeat(64),
  registryChanged: true,
  beforeRegistry: registryBefore,
  afterRegistry: registryAfter,
}));
assert.throws(
  () => assertRegistryDeltaIntegrity({
    before_sha256: "0".repeat(64),
    after_sha256: "1".repeat(64),
    source_selectors: [{ source_id: "SRC-DC-XLSX", operation: "rename" }],
  }, {
    beforeSha256: "a".repeat(64),
    afterSha256: "b".repeat(64),
    registryChanged: true,
    beforeRegistry: registryBefore,
    afterRegistry: registryAfter,
  }),
  /registry delta hash mismatch/u,
);
assert.throws(
  () => assertRegistryDeltaIntegrity({
    before_sha256: "a".repeat(64),
    after_sha256: "b".repeat(64),
    source_selectors: [{ source_id: "SRC-DC-VISION", operation: "update" }],
  }, {
    beforeSha256: "a".repeat(64),
    afterSha256: "b".repeat(64),
    registryChanged: true,
    beforeRegistry: registryBefore,
    afterRegistry: registryAfter,
  }),
  /registry delta selectors mismatch/u,
);
const cleanlinessCommand = completionCommandSet().find((command) => command.id === "worktree-cleanliness");
assert.equal(commandResultPassed(cleanlinessCommand, { status: 0, stdout: "" }), true);
assert.equal(commandResultPassed(cleanlinessCommand, { status: 0, stdout: "?? generated.tmp\n" }), false);

assert.deepEqual(
  resolveActualTriggerPaths({
    initialTriggers: ["docs/product-vision.md"],
    identities: [],
    explicitSourceSelection: false,
    changedPaths: ["docs/product-vision.md", "docs/README.md"],
  }),
  ["docs/product-vision.md"],
  "обычный запуск должен опираться на реально измененный Git-путь",
);
assert.throws(
  () => resolveActualTriggerPaths({
    initialTriggers: ["docs/product-vision.md"],
    identities: [],
    explicitSourceSelection: false,
    changedPaths: ["docs/README.md"],
  }),
  /no Git delta/u,
  "фиктивный trigger без изменения в Git должен блокироваться до публикации пакета",
);
assert.deepEqual(
  resolveActualTriggerPaths({
    initialTriggers: [],
    identities: [{
      source_path: "docs/product/sources/working/backlog.xlsx",
      provenance_path: "docs/product/sources/working/backlog.provenance.json",
    }],
    explicitSourceSelection: true,
    changedPaths: ["docs/product/sources/working/backlog.provenance.json"],
  }),
  ["docs/product/sources/working/backlog.provenance.json"],
  "явно выбранный источник должен запускать каскад только от реально измененной части пары source/provenance",
);

const replayInputs = {
  runner_version: "1.0.0",
  change_request_sha256: "1".repeat(64),
  graph_sha256: "2".repeat(64),
  source_registry_sha256: "3".repeat(64),
  acceptance_authority_sha256: "4".repeat(64),
  source_identity_sha256: "5".repeat(64),
  source_change_analysis_sha256: null,
  semantic_impact_sha256: "6".repeat(64),
  validation_manifest_sha256: "7".repeat(64),
  runtime_contract_sha256: "8".repeat(64),
  owner_question_packet_sha256: null,
};
const replayRun = {
  change_request_id: "DCR-2026-07-11-901",
  base_sha: "a".repeat(40),
  planning_head_sha: "b".repeat(40),
  replay_inputs: replayInputs,
};
const replayKey = buildCascadeReplayKey(replayRun);
assert.match(replayKey, /^[0-9a-f]{64}$/u);
assert.equal(buildCascadeReplayKey({ ...replayRun }), replayKey, "одинаковые входы должны давать один replay key");
assert.doesNotThrow(() => assertCascadeReplayKey({ ...replayRun, replay_key: replayKey }));
assert.throws(
  () => assertCascadeReplayKey({
    ...replayRun,
    replay_inputs: { ...replayInputs, graph_sha256: "9".repeat(64) },
    replay_key: replayKey,
  }),
  /replay key mismatch/u,
  "подмена любого входа должна разрушать повторяемость запуска",
);
assert.throws(
  () => assertCascadeReplayInputs(
    { ...replayRun, replay_key: replayKey },
    { ...replayInputs, owner_question_packet_sha256: "9".repeat(64) },
  ),
  /owner_question_packet_sha256/u,
  "подмена пакета вопроса владельцу должна блокировать повтор запуска",
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
const renameAllowedWrites = expandAllowedWritesForRenames(
  ["docs/new.md"],
  [{ status: "R100", path: "docs/new.md", old_path: "docs/old.md" }],
  [{ rename_from_path: "docs/old.md", rename_to_path: "docs/new.md" }],
);
assert.deepEqual(renameAllowedWrites, ["docs/new.md", "docs/old.md"]);
assert.throws(
  () => expandAllowedWritesForRenames(
    ["docs/old.md"],
    [{ status: "R100", path: "docs/new.md", old_path: "docs/old.md" }],
    [],
  ),
  /explicit rename authorization/u,
);
assert.throws(
  () => expandAllowedWritesForRenames(
    ["docs/old.md"],
    [{ status: "R100", path: "docs/new.md", old_path: "docs/old.md" }],
    [{ rename_from_path: "docs/old.md", rename_to_path: ".github/workflows/pwn.yml" }],
  ),
  /rename authorization does not match Git delta/u,
);
assert.doesNotThrow(() => buildActualDiffManifest({
  baseSha: "1".repeat(40),
  planningHeadSha: "1".repeat(40),
  candidateHeadSha: "2".repeat(40),
  entries: [{ status: "R100", path: "docs/new.md", old_path: "docs/old.md", sha256: "a".repeat(64) }],
  allowedWrites: renameAllowedWrites,
  dirty: false,
}));

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
assert.doesNotThrow(() => verifyAppliedResolution({
  updateStatus: "applied",
  changeStatus: "D",
  afterSha256: null,
  patchDigest: "e".repeat(64),
  actualPatchDigest: "e".repeat(64),
}));
assert.throws(
  () => verifyAppliedResolution({
    updateStatus: "applied",
    changeStatus: "D",
    afterSha256: null,
    patchDigest: null,
    actualPatchDigest: null,
  }),
  /deletion requires an approved patch digest/u,
);
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
    { path: "stories", authority_scope: ["story_text_change"], validation_command: "npm run validate:business-docs" },
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
const middleExpansion = analyzeSemanticCascade(graph, [
  { path: "stories", change_classes: ["story_text_change"] },
]);
assert.deepEqual(middleExpansion.authoritative_review_paths, ["vision"]);
assert.deepEqual(middleExpansion.write_obligations, ["backlog"]);
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
const isolatedMixedImpact = analyzeSemanticCascade(xlsxScopedGraph, [
  { path: "xlsx", source_kind: "xlsx", change_classes: ["estimate_change"] },
  { path: "stories", source_kind: "product_document", change_classes: ["story_text_change"] },
]);
assert.equal(
  isolatedMixedImpact.write_obligations.includes("stories"),
  false,
  "класс изменения одного источника не должен расширять маршрут другого источника",
);
assert.deepEqual(
  isolatedMixedImpact.route_evidence
    .filter((entry) => entry.source_path === "xlsx")
    .map((entry) => entry.to),
  ["effort"],
  "доказательство маршрута должно сохранять источник и его собственный класс изменения",
);

const validationCatalog = {
  commands: [
    { id: "business-docs", command: "npm run validate:business-docs", gate: "profile", completion_blocking: true, mutates_files: false, applies_to: ["product_meaning"] },
    { id: "generator", command: "npm run generate:docs", gate: "generated", completion_blocking: true, mutates_files: true, applies_to: ["product_meaning"] },
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
    routeCommands: ["npm run generate:docs"],
    scopes: ["product_meaning"],
  }),
  /mutating route command/u,
);
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
assert.deepEqual(
  parseSafeNpmCommand("npm run cascade:preview -- --changed-from HEAD"),
  ["cascade:preview"],
);
assert.throws(
  () => parseSafeNpmCommand("npm run cascade:preview -- --changed-from HEAD~1"),
  /safe npm run/u,
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
const completeProfileEvidence = {
  executed_commands: validationManifest.planned_commands.map((planned) => ({
    id: planned.id,
    command_sha256: planned.command_sha256,
    status: "passed",
  })),
};
assert.doesNotThrow(() => assertValidationEvidenceComplete(validationManifest, completeProfileEvidence));
assert.throws(
  () => assertValidationEvidenceComplete(validationManifest, { executed_commands: completeProfileEvidence.executed_commands.slice(1) }),
  /validation evidence mismatch/u,
);
assert.throws(
  () => assertValidationEvidenceComplete(validationManifest, {
    executed_commands: completeProfileEvidence.executed_commands.map((entry, index) => (
      index === 0 ? { ...entry, command_sha256: "0".repeat(64) } : entry
    )),
  }),
  /command_hash/u,
);
assert.throws(
  () => assertValidationEvidenceComplete(validationManifest, {
    executed_commands: [
      ...completeProfileEvidence.executed_commands,
      completeProfileEvidence.executed_commands[0],
    ],
  }),
  /duplicate=/u,
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
assert.deepEqual(
  completionCommandSet().find((command) => command.id === "worktree-cleanliness")?.args,
  ["status", "--porcelain=v1", "--untracked-files=all"],
  "завершение должно находить и незарегистрированные файлы",
);

assert.deepEqual(requiredOwnerRoles(["product_meaning"]), ["Product Owner"]);
assert.deepEqual(requiredOwnerRoles(["capacity"]), ["Product Owner", "Команда реализации"]);
assert.deepEqual(requiredOwnerRoles(["estimate_change"]), ["Команда реализации"]);
const authorityHash = "c".repeat(64);
const packet = {
  packet_sha256: null,
  decision_id: "DEC-CASCADE-2026-07-11-901",
  required_owner_roles: ["Product Owner"],
  change_classes: ["product_meaning"],
  authority_manifest_path: "docs/process/cascading-governance/acceptance-authority.json",
  authority_manifest_sha256: authorityHash,
  options: [{ option_id: "OPT-ACCEPT", effect: "authorize_apply" }],
};
packet.packet_sha256 = hashJsonDocument({ ...packet, packet_sha256: null });
const acceptancePath = "docs/process/cascading-governance/runs/acceptance.json";
const sourceRunPath = "docs/process/cascading-governance/runs/source/cascade-vnext-run.json";
const sourceRun = {
  run_id: "CUR-2026-07-11-901",
  change_request_id: "DCR-2026-07-11-901",
  acceptance_authority_path: packet.authority_manifest_path,
  owner_question_packet_path: "docs/process/cascading-governance/runs/source/owner-question-packet.json",
};
const authority = {
  bindings: [{
    binding_id: "AUTH-PRODUCT-OWNER",
    owner_role: "Product Owner",
    allowed_change_classes: ["product_meaning"],
    confirmation_channels: ["interactive_session"],
  }],
};
const acceptance = {
  acceptance_id: "ACC-CASCADE-2026-07-11-901",
  owner_role: "Product Owner",
  authority_manifest_path: packet.authority_manifest_path,
  authority_manifest_sha256: authorityHash,
  authority_binding_id: "AUTH-PRODUCT-OWNER",
  confirmation_channel: "interactive_session",
  confirmation_evidence: {
    evidence_type: "interactive_turn",
    reference: "codex-thread:019f31c4-d917-7c93-9758-9c997800641d",
    sha256: null,
  },
  accepted_change_classes: ["product_meaning"],
  question_packet_path: sourceRun.owner_question_packet_path,
  question_packet_sha256: packet.packet_sha256,
  run_id: sourceRun.run_id,
  run_path: sourceRunPath,
  change_request_id: sourceRun.change_request_id,
  decision_id: packet.decision_id,
  selected_option_id: "OPT-ACCEPT",
};
acceptance.confirmation_evidence.sha256 = interactiveAcceptanceEvidenceHash(acceptance);
const acceptanceThreadId = "019f31c4-d917-7c93-9758-9c997800641d";
assert.doesNotThrow(() => verifyAcceptanceConfirmationEvidence(
  process.cwd(),
  acceptance,
  "a".repeat(40),
  { activeThreadId: acceptanceThreadId },
));
assert.throws(
  () => verifyAcceptanceConfirmationEvidence(
    process.cwd(),
    acceptance,
    "a".repeat(40),
    { activeThreadId: "019f31c4-d917-7c93-9758-9c997800641e" },
  ),
  /thread binding mismatch/u,
);
assert.throws(
  () => verifyAcceptanceConfirmationEvidence(process.cwd(), {
    ...acceptance,
    confirmation_evidence: { ...acceptance.confirmation_evidence, sha256: "0".repeat(64) },
  }, "a".repeat(40), { activeThreadId: acceptanceThreadId }),
  /evidence hash mismatch/u,
);
const resolutionInput = {
  source_run_path: sourceRunPath,
  decision_resolutions: [{
    decision_id: packet.decision_id,
    selected_option_id: "OPT-ACCEPT",
    acceptance_record_id: acceptance.acceptance_id,
    acceptance_record_path: acceptancePath,
  }],
};
assert.deepEqual(validateOwnerAcceptanceSet({
  sourceRun,
  resolutionInput,
  packet,
  authority,
  authorityHash,
  acceptanceByPath: new Map([[acceptancePath, acceptance]]),
  verifyConfirmationEvidence: (candidate) => {
    assert.equal(candidate.confirmation_evidence.sha256, interactiveAcceptanceEvidenceHash(candidate));
  },
}), [acceptancePath]);
const rejectingPacket = {
  ...packet,
  packet_sha256: null,
  options: [{ option_id: "OPT-ACCEPT", effect: "reject_change" }],
};
rejectingPacket.packet_sha256 = hashJsonDocument({ ...rejectingPacket, packet_sha256: null });
assert.throws(
  () => validateOwnerAcceptanceSet({
    sourceRun,
    resolutionInput,
    packet: rejectingPacket,
    authority,
    authorityHash,
    acceptanceByPath: new Map([[acceptancePath, {
      ...acceptance,
      question_packet_sha256: rejectingPacket.packet_sha256,
    }]]),
    verifyConfirmationEvidence: (candidate) => {
      assert.equal(candidate.confirmation_evidence.sha256, interactiveAcceptanceEvidenceHash(candidate));
    },
  }),
  /does not authorize/u,
);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-cascade-vnext-"));
try {
  const isolatedNpmEnvironment = createIsolatedNpmEnvironment(tempRoot);
  assert.equal(isolatedNpmEnvironment.HOME.startsWith(tempRoot + path.sep), true);
  assert.equal(isolatedNpmEnvironment.NPM_CONFIG_CACHE.startsWith(tempRoot + path.sep), true);
  assert.equal(fs.readFileSync(isolatedNpmEnvironment.NPM_CONFIG_USERCONFIG, "utf8"), "");
  const fakeBin = path.join(tempRoot, "fake-bin");
  const fakeNpm = path.join(fakeBin, "npm");
  fs.mkdirSync(fakeBin);
  fs.writeFileSync(fakeNpm, [
    "#!/usr/bin/env node",
    `if (process.env.HOME !== ${JSON.stringify(isolatedNpmEnvironment.HOME)}) process.exit(42);`,
    `if (process.env.NPM_CONFIG_USERCONFIG !== ${JSON.stringify(isolatedNpmEnvironment.NPM_CONFIG_USERCONFIG)}) process.exit(43);`,
    "console.log('11.8.0');",
    "",
  ].join("\n"), { mode: 0o755 });
  const originalPath = process.env.PATH;
  process.env.PATH = `${fakeBin}${path.delimiter}${originalPath}`;
  try {
    assert.equal(buildRuntimeManifest(process.cwd(), isolatedNpmEnvironment).npm, "11.8.0");
  } finally {
    process.env.PATH = originalPath;
  }
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
  const failedTarget = path.join(tempRoot, "runs", "RUN-FAILED");
  assert.throws(
    () => publishAtomicPackage({
      targetDir: failedTarget,
      attemptId: "ATTEMPT-FAILED",
      files: new Map([["run.json", "{}\n"]]),
      validate: () => { throw new Error("expected validation failure"); },
    }),
    /expected validation failure/u,
  );
  assert.equal(fs.existsSync(failedTarget), false, "неуспешная публикация не должна оставлять частичный пакет");
  assert.equal(fs.existsSync(path.join(tempRoot, "runs", ".cascade-staging")), false);

  const attackRoot = path.join(tempRoot, "attack-target");
  const outsideRoot = path.join(tempRoot, "outside");
  fs.mkdirSync(attackRoot, { recursive: true });
  fs.mkdirSync(outsideRoot, { recursive: true });
  fs.symlinkSync(outsideRoot, path.join(attackRoot, ".cascade-staging"), "dir");
  assert.throws(
    () => publishAtomicPackage({
      targetDir: path.join(attackRoot, "RUN-ATTACK"),
      attemptId: "ATTEMPT-ATTACK",
      files: new Map([["run.json", "{}\n"]]),
    }),
    /symbolic link/u,
  );
  assert.deepEqual(fs.readdirSync(outsideRoot), [], "публикация не должна следовать по подмененной ссылке");

  const raceParent = path.join(tempRoot, "race-parent");
  const raceOutside = path.join(tempRoot, "race-outside");
  const raceBackup = path.join(tempRoot, "race-staging-backup");
  fs.mkdirSync(raceParent, { recursive: true });
  fs.mkdirSync(raceOutside, { recursive: true });
  assert.throws(
    () => publishAtomicPackage({
      targetDir: path.join(raceParent, "RUN-RACE"),
      attemptId: "ATTEMPT-RACE",
      files: new Map([["run.json", "{}\n"]]),
      validate: () => {
        const stagingRoot = path.join(raceParent, ".cascade-staging");
        fs.renameSync(stagingRoot, raceBackup);
        fs.symlinkSync(raceOutside, stagingRoot, "dir");
      },
    }),
    /symbolic link|identity changed/u,
  );
  assert.equal(fs.existsSync(path.join(raceParent, "RUN-RACE")), false);
  assert.deepEqual(fs.readdirSync(raceOutside), [], "подмена staging-корня не должна публиковать файлы наружу");

  const approvalRepo = path.join(tempRoot, "approval-repo");
  fs.mkdirSync(approvalRepo);
  const approvalGit = (args) => execFileSync("git", args, { cwd: approvalRepo, encoding: "utf8" });
  approvalGit(["init", "-q"]);
  approvalGit(["config", "user.name", "Implementation Team"]);
  approvalGit(["config", "user.email", "implementation-team@datacanvas.local"]);
  fs.writeFileSync(path.join(approvalRepo, "approval.txt"), "approved\n", "utf8");
  approvalGit(["add", "approval.txt"]);
  approvalGit(["commit", "-q", "-m", "Approve estimate"]);
  const approvalCommit = approvalGit(["rev-parse", "HEAD"]).trim();
  const approvalCommitBody = approvalGit(["cat-file", "commit", approvalCommit]);
  const repositoryAcceptance = {
    ...acceptance,
    owner_identity: "implementation-team@datacanvas.local",
    owner_role: "Команда реализации",
    confirmation_channel: "repository_approval",
    confirmation_evidence: {
      evidence_type: "repository_commit",
      reference: approvalCommit,
      sha256: crypto.createHash("sha256").update(approvalCommitBody).digest("hex"),
    },
  };
  assert.doesNotThrow(() => verifyAcceptanceConfirmationEvidence(approvalRepo, repositoryAcceptance, approvalCommit));
  assert.throws(
    () => verifyAcceptanceConfirmationEvidence(approvalRepo, {
      ...repositoryAcceptance,
      owner_identity: "another-owner@datacanvas.local",
    }, approvalCommit),
    /owner identity/u,
  );
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log("cascade vNext validation passed");
