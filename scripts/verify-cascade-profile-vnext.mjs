import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { publishAtomicPackage } from "./cascade-atomic-publisher.mjs";
import { assertValidationEvidenceComplete } from "./cascade-validation-manifest.mjs";
import {
  assertCatalogBinding,
  executeProfileCommands,
  linkNodeModules,
} from "./cascade-profile-verifier.mjs";
import { assertStateTransition } from "./cascade-vnext-core.mjs";
import {
  assertCascadeReplayEvidence,
  assertFreshRunDir,
  assertGitCommit,
  git,
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
  try {
    git(root, ["worktree", "add", "--detach", worktree, candidateSha], { timeout: 120_000 });
    added = true;
    linkNodeModules(root, worktree);
    return callback(worktree);
  } finally {
    if (added) {
      try {
        git(root, ["worktree", "remove", "--force", worktree], { timeout: 120_000 });
      } catch {
        // The temporary directory cleanup below is still required.
      }
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function main() {
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
  const manifest = readJson(root, sourceRun.validation_manifest_path);
  validateDocument(root, manifest, "schemas/cascade-validation-manifest.schema.json");
  const catalog = readJson(root, catalogPath);
  const packageJson = readJson(root, "package.json");
  assertCatalogBinding(manifest, catalog, packageJson);

  const executedCommands = candidateWorktree(candidateSha, (worktree) => executeProfileCommands({
    manifest,
    executionRoot: worktree,
    reportRoot: worktree,
  }));
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
  const evidence = {
    $schema: "https://datacanvas.local/schemas/v1/cascade-profile-evidence.schema.json",
    version: "1.0.0",
    evidence_id: "CPE-" + attemptId.replace(/^ATTEMPT-/u, ""),
    status,
    source_run_path: sourceRunPath,
    candidate_head_sha: candidateSha,
    execution_mode: "detached_candidate_worktree",
    validation_manifest_path: sourceRun.validation_manifest_path,
    validation_manifest_sha256: hashRepoPath(root, sourceRun.validation_manifest_path),
    executed_commands: executedCommands,
    blocking_reasons: blockingReasons,
    generated_at: new Date().toISOString(),
  };
  const verifiedRun = {
    ...sourceRun,
    attempt_id: attemptId,
    state: status,
    profile_evidence_path: evidencePath,
    completion_evidence_path: null,
    completion_seal_path: null,
    completion_claim: { done_claimed: false },
  };
  validateDocument(root, evidence, "schemas/cascade-profile-evidence.schema.json");
  validateDocument(root, verifiedRun, "schemas/cascade-vnext-run.schema.json");
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
