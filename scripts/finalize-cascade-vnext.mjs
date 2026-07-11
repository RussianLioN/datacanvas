import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { publishAtomicPackage } from "./cascade-atomic-publisher.mjs";
import { assertStateTransition, buildActualDiffManifest, verifyAppliedResolution } from "./cascade-vnext-core.mjs";
import {
  assertAncestor,
  assertFreshRunDir,
  assertGitCommit,
  git,
  hashGitPatch,
  hashGitPath,
  parseGitNameStatus,
  readJson,
  validateDocument,
} from "./cascade-vnext-runtime.mjs";
import { absoluteRepoPath, hashJsonDocument, hashRepoPath } from "./cascade-evidence-utils.mjs";
import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

const root = process.cwd();

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function resolutionMap(entries) {
  return new Map(entries.map((entry) => [normalizeRepoPath(entry.path), entry]));
}

function structuredRationale(entry) {
  return entry.no_change_rationale && typeof entry.no_change_rationale === "object";
}

function validateResolutionSet(requiredPaths, entries, label, baseSha, candidateSha) {
  const byPath = resolutionMap(entries);
  const missing = requiredPaths.filter((candidate) => !byPath.has(candidate));
  const extra = [...byPath.keys()].filter((candidate) => !requiredPaths.includes(candidate));
  if (missing.length || extra.length) throw new Error(`${label} coverage mismatch: missing=${missing.join(",")} extra=${extra.join(",")}`);
  for (const [relativePath, entry] of byPath) {
    if (entry.update_status === "applied") {
      verifyAppliedResolution({
        updateStatus: entry.update_status,
        afterSha256: hashGitPath(root, candidateSha, relativePath),
        expectedAfterSha256: entry.expected_after_sha256,
        patchDigest: entry.approved_patch_digest,
        actualPatchDigest: entry.approved_patch_digest
          ? hashGitPatch(root, baseSha, candidateSha, relativePath)
          : null,
      });
    } else if (!structuredRationale(entry)) {
      throw new Error(`no-change resolution requires a structured rationale: ${relativePath}`);
    }
  }
}

function validateOwnerAcceptance(sourceRun, resolutionInput) {
  if (!sourceRun.owner_question_packet_path) {
    if (resolutionInput.decision_resolutions.length > 0) throw new Error("unexpected owner decision resolution");
    return [];
  }
  const packet = readJson(root, sourceRun.owner_question_packet_path);
  validateDocument(root, packet, "schemas/cascade-owner-question-packet.schema.json");
  if (packet.packet_sha256 !== hashJsonDocument({ ...packet, packet_sha256: null })) {
    throw new Error("owner question packet self-hash mismatch");
  }
  if (sourceRun.acceptance_authority_path !== packet.authority_manifest_path) {
    throw new Error("owner question packet authority path mismatch");
  }
  const authority = readJson(root, packet.authority_manifest_path);
  validateDocument(root, authority, "schemas/cascade-acceptance-authority.schema.json");
  const authorityHash = hashRepoPath(root, packet.authority_manifest_path);
  if (packet.authority_manifest_sha256 !== authorityHash) throw new Error("owner question packet authority hash mismatch");
  if (resolutionInput.decision_resolutions.length !== packet.required_owner_roles.length) {
    throw new Error("owner-gated vNext run requires one acceptance for every required owner role");
  }

  const requiredRoles = new Set(packet.required_owner_roles);
  const acceptedRoles = new Set();
  const acceptedClasses = new Set();
  const acceptancePaths = [];
  for (const resolution of resolutionInput.decision_resolutions) {
    const acceptancePath = normalizeRepoPath(resolution.acceptance_record_path);
    const acceptance = readJson(root, acceptancePath);
    validateDocument(root, acceptance, "schemas/cascade-acceptance-vnext.schema.json");
    if (acceptance.acceptance_id !== resolution.acceptance_record_id) throw new Error("acceptance record id mismatch");
    if (!requiredRoles.has(acceptance.owner_role) || acceptedRoles.has(acceptance.owner_role)) {
      throw new Error("acceptance owner role is missing, duplicated, or not required: " + acceptance.owner_role);
    }
    acceptedRoles.add(acceptance.owner_role);
    if (acceptance.authority_manifest_path !== packet.authority_manifest_path
      || acceptance.authority_manifest_sha256 !== authorityHash) {
      throw new Error("acceptance authority binding mismatch");
    }
    const binding = authority.bindings.find((candidate) => candidate.binding_id === acceptance.authority_binding_id);
    if (!binding || binding.owner_role !== acceptance.owner_role) throw new Error("acceptance authority role is not active");
    if (!binding.confirmation_channels.includes(acceptance.confirmation_channel)) {
      throw new Error("acceptance confirmation channel is not allowed for the owner role");
    }
    for (const changeClass of acceptance.accepted_change_classes) {
      if (!packet.change_classes.includes(changeClass) || !binding.allowed_change_classes.includes(changeClass)) {
        throw new Error("acceptance contains an unauthorized change class: " + changeClass);
      }
      acceptedClasses.add(changeClass);
    }
    if (acceptance.question_packet_path !== sourceRun.owner_question_packet_path
      || acceptance.question_packet_sha256 !== packet.packet_sha256) {
      throw new Error("acceptance question packet binding mismatch");
    }
    if (acceptance.run_id !== sourceRun.run_id || acceptance.run_path !== resolutionInput.source_run_path) {
      throw new Error("acceptance run binding mismatch");
    }
    const expectedChangeRequestId = sourceRun.run_id.replace(/^CUR-/u, "DCR-");
    if (acceptance.change_request_id !== expectedChangeRequestId) throw new Error("acceptance change request binding mismatch");
    if (acceptance.decision_id !== packet.decision_id
      || acceptance.decision_id !== resolution.decision_id
      || acceptance.selected_option_id !== resolution.selected_option_id) {
      throw new Error("acceptance decision binding mismatch");
    }
    const option = packet.options.find((candidate) => candidate.option_id === acceptance.selected_option_id);
    if (!option) throw new Error("selected option is absent from the owner question packet");
    if (option.effect !== "authorize_apply") throw new Error("selected owner option does not authorize cascade finalization");
    acceptancePaths.push(acceptancePath);
  }
  if (acceptedRoles.size !== requiredRoles.size) throw new Error("not all required owner roles accepted the packet");
  const nonGoverned = new Set([
    "documentation",
    "estimate_change",
    "formatting_change",
    "formatting_only",
    "formula_cache_only",
    "no_change",
    "provenance_only",
  ]);
  const missingClasses = packet.change_classes.filter((value) => !nonGoverned.has(value) && !acceptedClasses.has(value));
  if (missingClasses.length > 0) throw new Error("owner acceptance does not cover governed change classes: " + missingClasses.join(","));
  return acceptancePaths.sort();
}

async function main() {
  const sourceRunPath = normalizeRepoPath(argValue("--run") ?? "");
  const resolutionInputPath = normalizeRepoPath(argValue("--resolution-input") ?? "");
  const outputDir = assertFreshRunDir(argValue("--output-dir") ?? "");
  const candidateHeadSha = assertGitCommit(root, argValue("--candidate-head-sha"), "candidate_head_sha");
  if (!sourceRunPath || !resolutionInputPath) throw new Error("usage: npm run cascade:finalize -- --run <vnext-run> --resolution-input <path> --candidate-head-sha <sha> --output-dir <fresh-dir>");
  if (fs.existsSync(absoluteRepoPath(root, outputDir))) throw new Error(`output dir already exists: ${outputDir}`);

  const sourceRun = readJson(root, sourceRunPath);
  validateDocument(root, sourceRun, "schemas/cascade-vnext-run.schema.json");
  validateDocument(
    root,
    readJson(root, sourceRun.acceptance_authority_path),
    "schemas/cascade-acceptance-authority.schema.json",
  );
  if (!["planned", "awaiting_owner"].includes(sourceRun.state)) throw new Error(`run cannot be finalized from state ${sourceRun.state}`);
  assertAncestor(root, sourceRun.base_sha, candidateHeadSha);
  const resolutionInput = readJson(root, resolutionInputPath);
  validateDocument(root, resolutionInput, "schemas/cascade-resolution-input.schema.json");
  if (resolutionInput.version !== "1.0.0") throw new Error("vNext finalization requires resolution input version 1.0.0");
  if (resolutionInput.source_run_path !== sourceRunPath) throw new Error("resolution input source run path mismatch");
  const semanticImpact = readJson(root, sourceRun.impact_report_path);
  const sourceIdentity = readJson(root, sourceRun.source_identity_manifest_path);
  validateDocument(root, semanticImpact, "schemas/cascade-semantic-impact-report.schema.json");
  validateDocument(root, sourceIdentity, "schemas/cascade-source-identity.schema.json");
  if (sourceRun.source_change_analysis_path) {
    validateDocument(
      root,
      readJson(root, sourceRun.source_change_analysis_path),
      "schemas/cascade-source-change-analysis.schema.json",
    );
  }
  const requiredSources = sourceIdentity.trigger_sources.map((item) => item.trigger_path).sort();
  const requiredArtifacts = semanticImpact.diagnostic_classifications
    .filter((item) => item.classification !== "changed_source")
    .map((item) => item.path)
    .sort();
  validateResolutionSet(requiredSources, resolutionInput.source_resolutions, "source resolution", sourceRun.base_sha, candidateHeadSha);
  validateResolutionSet(requiredArtifacts, resolutionInput.artifact_resolutions, "artifact resolution", sourceRun.base_sha, candidateHeadSha);
  const acceptancePaths = validateOwnerAcceptance(sourceRun, resolutionInput);
  assertStateTransition(sourceRun.state, "finalized");

  const diffEntries = parseGitNameStatus(git(root, ["diff", "--name-status", "-z", `${sourceRun.base_sha}..${candidateHeadSha}`]));
  const appliedArtifactPaths = resolutionInput.artifact_resolutions
    .filter((entry) => entry.update_status === "applied")
    .map((entry) => normalizeRepoPath(entry.path));
  const appliedSourcePaths = resolutionInput.source_resolutions
    .filter((entry) => entry.update_status === "applied")
    .map((entry) => normalizeRepoPath(entry.path));
  const allowedWrites = [...new Set([...appliedSourcePaths, ...appliedArtifactPaths])];
  const hashedEntries = diffEntries.map((entry) => ({ ...entry, sha256: hashGitPath(root, candidateHeadSha, entry.path) }));
  const diffManifest = buildActualDiffManifest({
    baseSha: sourceRun.base_sha,
    planningHeadSha: sourceRun.planning_head_sha,
    candidateHeadSha,
    entries: hashedEntries,
    allowedWrites,
    dirty: false,
  });
  diffManifest.$schema = "https://datacanvas.local/schemas/v1/cascade-actual-diff-manifest.schema.json";
  const resolutionReport = {
    $schema: "https://datacanvas.local/schemas/v1/cascade-resolution-report.schema.json",
    version: "1.0.0",
    resolution_id: resolutionInput.resolution_id,
    source_run_path: sourceRunPath,
    candidate_head_sha: candidateHeadSha,
    source_resolutions: resolutionInput.source_resolutions,
    artifact_resolutions: resolutionInput.artifact_resolutions,
    acceptance_paths: acceptancePaths,
    resolved_at: resolutionInput.resolved_at,
    resolution_sha256: hashRepoPath(root, resolutionInputPath),
  };
  const attemptId = argValue("--attempt-id") ?? `${sourceRun.attempt_id}-FINAL`;
  const finalizedRunPath = `${outputDir}/cascade-vnext-run.json`;
  const diffManifestPath = `${outputDir}/actual-diff-manifest.json`;
  const resolutionReportPath = `${outputDir}/resolution-report.json`;
  const finalizedRun = {
    ...sourceRun,
    attempt_id: attemptId,
    state: "finalized",
    candidate_head_sha: candidateHeadSha,
    diff_manifest_path: diffManifestPath,
    resolution_input_path: resolutionInputPath,
    resolution_report_path: resolutionReportPath,
    acceptance_paths: acceptancePaths,
    profile_evidence_path: null,
    completion_evidence_path: null,
    completion_seal_path: null,
    completion_claim: { done_claimed: false },
  };
  validateDocument(root, diffManifest, "schemas/cascade-actual-diff-manifest.schema.json");
  validateDocument(root, resolutionReport, "schemas/cascade-resolution-report.schema.json");
  validateDocument(root, finalizedRun, "schemas/cascade-vnext-run.schema.json");
  const files = new Map([
    [path.posix.basename(finalizedRunPath), `${JSON.stringify(finalizedRun, null, 2)}\n`],
    [path.posix.basename(diffManifestPath), `${JSON.stringify(diffManifest, null, 2)}\n`],
    [path.posix.basename(resolutionReportPath), `${JSON.stringify(resolutionReport, null, 2)}\n`],
  ]);
  publishAtomicPackage({ targetDir: absoluteRepoPath(root, outputDir), attemptId, files });
  console.log(`cascade vNext finalized: ${outputDir}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
