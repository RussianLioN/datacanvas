import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { publishAtomicPackage } from "./cascade-atomic-publisher.mjs";
import { assertValidationEvidenceComplete } from "./cascade-validation-manifest.mjs";
import { assertCascadePreflight } from "./cascade-preflight.mjs";
import {
  assertCatalogBinding,
  executeProfileCommands,
  installProfileDependencies,
} from "./cascade-profile-verifier.mjs";
import { assertRuntimeManifestMatches } from "./cascade-completion-core.mjs";
import {
  assertCandidateFingerprintBinding,
  assertStateTransition,
  buildRunLedgerEntry,
} from "./cascade-vnext-core.mjs";
import {
  assertCascadeReplayEvidence,
  assertActualDiffManifestMatchesGit,
  assertFreshRunDir,
  assertGitCommit,
  assertImmutableGitPackage,
  buildRuntimeManifest,
  createIsolatedNpmEnvironment,
  expectedFinalizedCandidateComposition,
  finalizedPackagePaths,
  git,
  parseGitNameStatus,
  planningPackagePaths,
  readJson,
  validateDocument,
} from "./cascade-vnext-runtime.mjs";
import { absoluteRepoPath, hashRepoPath } from "./cascade-evidence-utils.mjs";
import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

const root = process.cwd();
const catalogPath = "docs/process/universal-documentation-workflow/validation-command-catalog.json";

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function candidateWorktree(candidateSha, callback) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-cascade-profile-"));
  const worktree = path.join(tempRoot, "candidate");
  let added = false;
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (added) {
      try {
        git(root, ["worktree", "remove", "--force", worktree], { timeout: 120_000 });
      } catch {
        // Exact temporary directory cleanup still runs below.
      }
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
  };
  const signalHandlers = new Map(["SIGINT", "SIGTERM", "SIGHUP"].map((signal) => [
    signal,
    () => {
      cleanup();
      process.exit(signal === "SIGINT" ? 130 : 143);
    },
  ]));
  for (const [signal, handler] of signalHandlers) process.once(signal, handler);
  try {
    git(root, ["worktree", "add", "--detach", worktree, candidateSha], { timeout: 120_000 });
    added = true;
    return callback(worktree, createIsolatedNpmEnvironment(tempRoot));
  } finally {
    for (const [signal, handler] of signalHandlers) process.off(signal, handler);
    cleanup();
  }
}

async function main() {
  assertCascadePreflight({ root });
  const sourceRunPath = normalizeRepoPath(argValue("--run") ?? "");
  const outputDir = assertFreshRunDir(argValue("--output-dir") ?? "");
  if (!sourceRunPath) {
    throw new Error("usage: npm run cascade:verify -- --run <finalized-vnext-run> --output-dir <fresh-dir>");
  }
  if (fs.existsSync(absoluteRepoPath(root, outputDir))) {
    throw new Error("output dir already exists: " + outputDir);
  }

  const sourceRun = readJson(root, sourceRunPath);
  validateDocument(root, sourceRun, "schemas/cascade-vnext-run.schema.json");
  assertCascadeReplayEvidence(root, sourceRun);
  validateDocument(root, readJson(root, sourceRun.acceptance_authority_path), "schemas/cascade-acceptance-authority.schema.json");
  if (sourceRun.state !== "finalized") {
    throw new Error("profile verification requires finalized state, got " + sourceRun.state);
  }
  const candidateSha = assertGitCommit(root, sourceRun.candidate_head_sha, "candidate_head_sha");
  const resolutionReport = readJson(root, sourceRun.resolution_report_path);
  validateDocument(root, resolutionReport, "schemas/cascade-resolution-report.schema.json");
  const planningRun = readJson(root, resolutionReport.source_run_path);
  validateDocument(root, planningRun, "schemas/cascade-vnext-run.schema.json");
  assertImmutableGitPackage({
    root,
    runPath: resolutionReport.source_run_path,
    packagePaths: planningPackagePaths(resolutionReport.source_run_path, planningRun),
    anchorSha: planningRun.planning_head_sha,
    mustPrecedeSha: candidateSha,
    label: "planning",
  });
  assertImmutableGitPackage({
    root,
    runPath: sourceRunPath,
    packagePaths: finalizedPackagePaths(sourceRunPath, sourceRun),
    anchorSha: candidateSha,
    label: "finalization",
  });
  const actualDiff = readJson(root, sourceRun.diff_manifest_path);
  validateDocument(root, actualDiff, "schemas/cascade-actual-diff-manifest.schema.json");
  const sourceIdentity = readJson(root, sourceRun.source_identity_manifest_path);
  validateDocument(root, sourceIdentity, "schemas/cascade-source-identity.schema.json");
  const resolutionInput = readJson(root, sourceRun.resolution_input_path);
  validateDocument(root, resolutionInput, "schemas/cascade-resolution-input.schema.json");
  const diffEntries = parseGitNameStatus(git(root, ["diff", "--name-status", "-z", `${sourceRun.base_sha}..${candidateSha}`]));
  assertActualDiffManifestMatchesGit(root, actualDiff, expectedFinalizedCandidateComposition({
    finalizedRunPath: sourceRunPath,
    finalizedRun: sourceRun,
    planningRunPath: resolutionReport.source_run_path,
    planningRun,
    sourceIdentity,
    resolutionInput,
    diffEntries,
  }));
  assertCandidateFingerprintBinding({
    expected: actualDiff.candidate_fingerprint_sha256,
    actual: sourceRun.candidate_fingerprint_sha256,
    label: "finalized run",
  });
  const manifest = readJson(root, sourceRun.validation_manifest_path);
  validateDocument(root, manifest, "schemas/cascade-validation-manifest.schema.json");
  const expectedRuntime = readJson(root, sourceRun.runtime_manifest_path);
  validateDocument(root, expectedRuntime, "schemas/cascade-runtime-manifest.schema.json");

  const executedCommands = candidateWorktree(candidateSha, (worktree, environment) => {
    assertRuntimeManifestMatches(expectedRuntime, buildRuntimeManifest(worktree, environment));
    assertCatalogBinding(
      manifest,
      readJson(worktree, catalogPath),
      readJson(worktree, "package.json"),
    );
    installProfileDependencies(worktree, environment);
    return executeProfileCommands({
      manifest,
      executionRoot: worktree,
      reportRoot: worktree,
      environment,
    });
  });
  const blockingReasons = executedCommands
    .filter((entry) => entry.status !== "passed")
    .map((entry) => "Не пройдена проверка " + entry.id + ".");
  const status = blockingReasons.length === 0 ? "profile_verified" : "blocked";
  if (status === "profile_verified") {
    assertValidationEvidenceComplete(manifest, { executed_commands: executedCommands });
  }
  assertStateTransition(sourceRun.state, status);

  const attemptId = argValue("--attempt-id") ?? sourceRun.attempt_id + "-PROFILE";
  const evidencePath = outputDir + "/profile-evidence.json";
  const runPath = outputDir + "/cascade-vnext-run.json";
  const runLedgerEntry = buildRunLedgerEntry({
    command: "cascade:verify",
    status: status === "profile_verified" ? "passed" : "failed",
    exitCode: status === "profile_verified" ? 0 : 1,
    summary: blockingReasons.length > 0
      ? blockingReasons.join(" ")
      : "Профильные проверки кандидата завершены успешно.",
    evidencePath,
    candidateFingerprintSha256: sourceRun.candidate_fingerprint_sha256,
  });
  const evidence = {
    $schema: "https://datacanvas.local/schemas/v1/cascade-profile-evidence.schema.json",
    version: "1.0.0",
    evidence_id: "CPE-" + attemptId.replace(/^ATTEMPT-/u, ""),
    status,
    source_run_path: sourceRunPath,
    candidate_head_sha: candidateSha,
    candidate_fingerprint_sha256: sourceRun.candidate_fingerprint_sha256,
    execution_mode: "detached_candidate_worktree",
    validation_manifest_path: sourceRun.validation_manifest_path,
    validation_manifest_sha256: hashRepoPath(root, sourceRun.validation_manifest_path),
    executed_commands: executedCommands,
    blocking_reasons: blockingReasons,
    run_ledger_entry: runLedgerEntry,
    generated_at: new Date().toISOString(),
  };
  const verifiedRun = {
    ...sourceRun,
    attempt_id: attemptId,
    state: status,
    candidate_fingerprint_sha256: sourceRun.candidate_fingerprint_sha256,
    profile_evidence_path: evidencePath,
    completion_evidence_path: null,
    completion_seal_path: null,
    completion_claim: { done_claimed: false },
    run_ledger: [...(sourceRun.run_ledger ?? []), runLedgerEntry],
  };
  validateDocument(root, evidence, "schemas/cascade-profile-evidence.schema.json");
  validateDocument(root, verifiedRun, "schemas/cascade-vnext-run.schema.json");
  if (status === "blocked") {
    console.error(JSON.stringify(runLedgerEntry, null, 2));
    throw new Error("profile verification failed; no cascade evidence package was published");
  }
  publishAtomicPackage({
    targetDir: absoluteRepoPath(root, outputDir),
    attemptId,
    files: new Map([
      [path.posix.basename(runPath), JSON.stringify(verifiedRun, null, 2) + "\n"],
      [path.posix.basename(evidencePath), JSON.stringify(evidence, null, 2) + "\n"],
    ]),
  });
  console.log("cascade vNext profile verification: " + status);
  if (status === "blocked") process.exitCode = 1;
}

main().catch((error) => {
  console.error("ERROR: " + error.message);
  process.exit(1);
});
