import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { publishAtomicPackage } from "./cascade-atomic-publisher.mjs";
import { validateOwnerAcceptanceSet } from "./cascade-owner-acceptance.mjs";
import { assertStateTransition, verifyAppliedResolution } from "./cascade-vnext-core.mjs";
import {
  assertAncestor,
  assertImmutableGitPackage,
  assertCascadeReplayEvidence,
  assertFreshRunDir,
  assertGitCommit,
  assertRepoPathMatchesGit,
  buildActualDiffManifestFromGit,
  git,
  hashGitPatch,
  hashGitPath,
  parseGitNameStatus,
  planningPackagePaths,
  readJson,
  verifyAcceptanceConfirmationEvidence,
  validateDocument,
} from "./cascade-vnext-runtime.mjs";
import { absoluteRepoPath, hashRepoPath } from "./cascade-evidence-utils.mjs";
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

function validateResolutionSet(requiredPaths, entries, label, baseSha, candidateSha, diffByPath) {
  const byPath = resolutionMap(entries);
  const missing = requiredPaths.filter((candidate) => !byPath.has(candidate));
  const extra = [...byPath.keys()].filter((candidate) => !requiredPaths.includes(candidate));
  if (missing.length || extra.length) throw new Error(`${label} coverage mismatch: missing=${missing.join(",")} extra=${extra.join(",")}`);
  for (const [relativePath, entry] of byPath) {
    if (entry.update_status === "applied") {
      const diffEntry = diffByPath.get(relativePath);
      if (!diffEntry) throw new Error(`applied resolution has no Git delta: ${relativePath}`);
      const resultPath = diffEntry.status.startsWith("R") ? diffEntry.path : relativePath;
      verifyAppliedResolution({
        updateStatus: entry.update_status,
        changeStatus: diffEntry.status,
        afterSha256: hashGitPath(root, candidateSha, resultPath),
        expectedAfterSha256: entry.expected_after_sha256,
        patchDigest: entry.approved_patch_digest,
        actualPatchDigest: entry.approved_patch_digest
          ? hashGitPatch(root, baseSha, candidateSha, resultPath)
          : null,
      });
    } else if (!structuredRationale(entry)) {
      throw new Error(`no-change resolution requires a structured rationale: ${relativePath}`);
    }
  }
}

function validateOwnerAcceptance(sourceRun, resolutionInput, candidateSha) {
  if (!sourceRun.owner_question_packet_path) {
    if (resolutionInput.decision_resolutions.length > 0) throw new Error("unexpected owner decision resolution");
    return [];
  }
  const packet = readJson(root, sourceRun.owner_question_packet_path);
  validateDocument(root, packet, "schemas/cascade-owner-question-packet.schema.json");
  const authority = readJson(root, packet.authority_manifest_path);
  validateDocument(root, authority, "schemas/cascade-acceptance-authority.schema.json");
  const authorityHash = hashRepoPath(root, packet.authority_manifest_path);
  const acceptanceByPath = new Map();
  for (const resolution of resolutionInput.decision_resolutions) {
    const acceptancePath = normalizeRepoPath(resolution.acceptance_record_path);
    assertRepoPathMatchesGit(root, candidateSha, acceptancePath, "acceptance record");
    const acceptance = readJson(root, acceptancePath);
    validateDocument(root, acceptance, "schemas/cascade-acceptance-vnext.schema.json");
    acceptanceByPath.set(acceptancePath, acceptance);
  }
  return validateOwnerAcceptanceSet({
    sourceRun,
    resolutionInput,
    packet,
    authority,
    authorityHash,
    acceptanceByPath,
    verifyConfirmationEvidence: (acceptance) => verifyAcceptanceConfirmationEvidence(root, acceptance, candidateSha),
  });
}

async function main() {
  const sourceRunPath = normalizeRepoPath(argValue("--run") ?? "");
  const resolutionInputPath = normalizeRepoPath(argValue("--resolution-input") ?? "");
  const outputDir = assertFreshRunDir(argValue("--output-dir") ?? "");
  const candidateHeadSha = assertGitCommit(root, argValue("--candidate-head-sha"), "candidate_head_sha");
  if (!sourceRunPath || !resolutionInputPath) throw new Error("usage: npm run cascade:finalize -- --run <vnext-run> --resolution-input <path> --candidate-head-sha <sha> --output-dir <fresh-dir>");
  if (fs.existsSync(absoluteRepoPath(root, outputDir))) throw new Error(`output dir already exists: ${outputDir}`);
  const currentHeadSha = assertGitCommit(root, git(root, ["rev-parse", "HEAD"]).trim(), "current HEAD");
  if (currentHeadSha !== candidateHeadSha) throw new Error("candidate_head_sha must equal current HEAD during finalization");
  const worktreeStatus = git(root, ["status", "--porcelain=v1", "--untracked-files=all"]).trim();
  if (worktreeStatus) throw new Error("cascade finalization requires a clean worktree");

  const sourceRun = readJson(root, sourceRunPath);
  validateDocument(root, sourceRun, "schemas/cascade-vnext-run.schema.json");
  assertCascadeReplayEvidence(root, sourceRun);
  validateDocument(
    root,
    readJson(root, sourceRun.acceptance_authority_path),
    "schemas/cascade-acceptance-authority.schema.json",
  );
  if (!["planned", "awaiting_owner"].includes(sourceRun.state)) throw new Error(`run cannot be finalized from state ${sourceRun.state}`);
  assertAncestor(root, sourceRun.base_sha, candidateHeadSha);
  assertImmutableGitPackage({
    root,
    runPath: sourceRunPath,
    packagePaths: planningPackagePaths(sourceRunPath, sourceRun),
    anchorSha: sourceRun.planning_head_sha,
    mustPrecedeSha: candidateHeadSha,
    label: "planning",
  });
  assertRepoPathMatchesGit(root, candidateHeadSha, resolutionInputPath, "resolution input");
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
  const diffEntries = parseGitNameStatus(git(root, ["diff", "--name-status", "-z", `${sourceRun.base_sha}..${candidateHeadSha}`]));
  const diffByPath = new Map();
  for (const entry of diffEntries) {
    diffByPath.set(entry.path, entry);
    if (entry.old_path) diffByPath.set(entry.old_path, entry);
  }
  validateResolutionSet(requiredSources, resolutionInput.source_resolutions, "source resolution", sourceRun.base_sha, candidateHeadSha, diffByPath);
  validateResolutionSet(requiredArtifacts, resolutionInput.artifact_resolutions, "artifact resolution", sourceRun.base_sha, candidateHeadSha, diffByPath);
  const acceptancePaths = validateOwnerAcceptance(sourceRun, resolutionInput, candidateHeadSha);
  assertStateTransition(sourceRun.state, "finalized");

  const appliedArtifactPaths = resolutionInput.artifact_resolutions
    .filter((entry) => entry.update_status === "applied")
    .map((entry) => normalizeRepoPath(entry.path));
  const controlPaths = [
    sourceRun.change_request_path,
    ...planningPackagePaths(sourceRunPath, sourceRun),
    resolutionInputPath,
    ...acceptancePaths,
  ];
  const allowedWrites = [...new Set([...requiredSources, ...appliedArtifactPaths, ...controlPaths])];
  const diffManifest = buildActualDiffManifestFromGit(root, {
    baseSha: sourceRun.base_sha,
    planningHeadSha: sourceRun.planning_head_sha,
    candidateHeadSha,
    allowedWrites,
  });
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
