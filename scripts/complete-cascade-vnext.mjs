import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

import { publishAtomicPackage } from "./cascade-atomic-publisher.mjs";
import {
  assertRuntimeManifestMatches,
  completionCommandSet,
  completionCommandSetHash,
} from "./cascade-completion-core.mjs";
import { assertStateTransition, canClaimDone } from "./cascade-vnext-core.mjs";
import {
  assertFreshRunDir,
  assertGitCommit,
  buildRuntimeManifest,
  git,
  readJson,
  sanitizeOutput,
  validateDocument,
} from "./cascade-vnext-runtime.mjs";
import { absoluteRepoPath, hashJsonDocument, hashRepoPath } from "./cascade-evidence-utils.mjs";
import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

const root = process.cwd();

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function assertProfileLineage(profileRun, profileEvidence, finalizedRun) {
  if (profileEvidence.status !== "profile_verified") throw new Error("profile evidence is not verified");
  if (profileEvidence.candidate_head_sha !== profileRun.candidate_head_sha) {
    throw new Error("profile evidence candidate SHA mismatch");
  }
  const immutableKeys = [
    "run_id",
    "change_request_path",
    "base_sha",
    "planning_head_sha",
    "candidate_head_sha",
    "source_identity_manifest_path",
    "source_change_analysis_path",
    "impact_report_path",
    "diff_manifest_path",
    "validation_manifest_path",
    "runtime_manifest_path",
    "owner_question_packet_path",
    "resolution_input_path",
    "resolution_report_path",
  ];
  for (const key of immutableKeys) {
    if (profileRun[key] !== finalizedRun[key]) throw new Error("profile run lineage mismatch: " + key);
  }
}

function skippedResult(command, reason) {
  const timestamp = new Date().toISOString();
  return {
    id: command.id,
    executable: command.executable,
    args: command.args,
    status: "skipped",
    exit_code: null,
    started_at: timestamp,
    finished_at: timestamp,
    duration_ms: 0,
    output_sha256: digest(""),
    summary: reason,
  };
}

function executeCompletionCommands(worktree, commands) {
  const results = [];
  let previousFailed = false;
  for (const command of commands) {
    if (previousFailed) {
      results.push(skippedResult(command, "Команда пропущена после предыдущей ошибки."));
      continue;
    }
    const startedAt = new Date();
    const result = spawnSync(command.executable, command.args, {
      cwd: worktree,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: command.timeout_ms,
      maxBuffer: 64 * 1024 * 1024,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        CI: "1",
        LANG: process.env.LANG ?? "C.UTF-8",
        LC_ALL: process.env.LC_ALL ?? "C.UTF-8",
        TZ: process.env.TZ ?? "UTC",
      },
    });
    const finishedAt = new Date();
    const rawOutput = String(result.stdout ?? "") + String(result.stderr ?? "") + String(result.error?.message ?? "");
    const exitCode = Number.isInteger(result.status) ? result.status : 1;
    const status = exitCode === 0 && !result.error ? "passed" : "failed";
    results.push({
      id: command.id,
      executable: command.executable,
      args: command.args,
      status,
      exit_code: exitCode,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
      output_sha256: digest(rawOutput),
      summary: sanitizeOutput(rawOutput || "exit 0", worktree) || "Команда завершилась без вывода.",
    });
    previousFailed = status === "failed";
  }
  return results;
}

function candidateWorktree(candidateSha, callback) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-cascade-complete-"));
  const worktree = path.join(tempRoot, "candidate");
  let added = false;
  try {
    git(root, ["worktree", "add", "--detach", worktree, candidateSha], { timeout: 120_000 });
    added = true;
    return callback(worktree);
  } finally {
    if (added) {
      try {
        git(root, ["worktree", "remove", "--force", worktree], { timeout: 120_000 });
      } catch {
        // Temporary filesystem cleanup still runs below.
      }
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function main() {
  const sourceRunPath = normalizeRepoPath(argValue("--run") ?? "");
  const outputDir = assertFreshRunDir(argValue("--output-dir") ?? "");
  if (!sourceRunPath) {
    throw new Error("usage: npm run cascade:complete -- --run <profile-verified-run> --output-dir <fresh-dir>");
  }
  if (fs.existsSync(absoluteRepoPath(root, outputDir))) throw new Error("output dir already exists: " + outputDir);

  const sourceRun = readJson(root, sourceRunPath);
  validateDocument(root, sourceRun, "schemas/cascade-vnext-run.schema.json");
  if (sourceRun.state !== "profile_verified") {
    throw new Error("cascade:complete requires profile_verified state, got " + sourceRun.state);
  }
  const candidateSha = assertGitCommit(root, sourceRun.candidate_head_sha, "candidate_head_sha");
  const profileEvidence = readJson(root, sourceRun.profile_evidence_path);
  validateDocument(root, profileEvidence, "schemas/cascade-profile-evidence.schema.json");
  const finalizedRun = readJson(root, profileEvidence.source_run_path);
  validateDocument(root, finalizedRun, "schemas/cascade-vnext-run.schema.json");
  if (finalizedRun.state !== "finalized") throw new Error("profile evidence does not refer to a finalized run");
  assertProfileLineage(sourceRun, profileEvidence, finalizedRun);

  const expectedRuntime = readJson(root, sourceRun.runtime_manifest_path);
  validateDocument(root, expectedRuntime, "schemas/cascade-runtime-manifest.schema.json");
  const actualDiff = readJson(root, sourceRun.diff_manifest_path);
  validateDocument(root, actualDiff, "schemas/cascade-actual-diff-manifest.schema.json");
  if (actualDiff.candidate_head_sha !== candidateSha) throw new Error("actual diff candidate SHA mismatch");

  const commands = completionCommandSet();
  let runtimeMatch = true;
  let runtimeFailure = null;
  let commandResults;
  candidateWorktree(candidateSha, (worktree) => {
    try {
      assertRuntimeManifestMatches(expectedRuntime, buildRuntimeManifest(worktree));
    } catch (error) {
      runtimeMatch = false;
      runtimeFailure = sanitizeOutput(error.message, worktree);
    }
    commandResults = runtimeMatch
      ? executeCompletionCommands(worktree, commands)
      : commands.map((command) => skippedResult(command, "Команда пропущена из-за несовпадения среды выполнения."));
  });

  const blockingReasons = [];
  if (!runtimeMatch) blockingReasons.push(runtimeFailure || "Среда выполнения не совпадает с исходным манифестом.");
  for (const result of commandResults.filter((entry) => entry.status !== "passed")) {
    if (result.status === "failed") blockingReasons.push("Не пройдена команда " + result.id + ".");
  }
  const passed = runtimeMatch && commandResults.every((entry) => entry.status === "passed");
  const nextState = passed ? "verified" : "blocked";
  assertStateTransition(sourceRun.state, nextState, "cascade:complete");

  const attemptId = argValue("--attempt-id") ?? sourceRun.attempt_id + "-COMPLETE";
  const evidencePath = outputDir + "/completion-evidence.json";
  const sealPath = passed ? outputDir + "/completion-seal.json" : null;
  const runPath = outputDir + "/cascade-vnext-run.json";
  const evidence = {
    $schema: "https://datacanvas.local/schemas/v1/cascade-completion-evidence.schema.json",
    version: "1.0.0",
    evidence_id: "CCE-" + attemptId.replace(/^ATTEMPT-/u, ""),
    status: passed ? "passed" : "blocked",
    source_run_path: sourceRunPath,
    candidate_head_sha: candidateSha,
    execution_mode: "detached_candidate_worktree",
    runtime_manifest_path: sourceRun.runtime_manifest_path,
    runtime_manifest_sha256: hashRepoPath(root, sourceRun.runtime_manifest_path),
    runtime_match: runtimeMatch,
    command_set_sha256: completionCommandSetHash(commands),
    command_results: commandResults,
    blocking_reasons: blockingReasons,
    generated_at: new Date().toISOString(),
  };
  const completionClaim = { done_claimed: canClaimDone(nextState, "cascade:complete") };
  const completedRun = {
    ...sourceRun,
    attempt_id: attemptId,
    state: nextState,
    completion_evidence_path: evidencePath,
    completion_seal_path: sealPath,
    completion_claim: completionClaim,
  };
  const seal = passed ? {
    $schema: "https://datacanvas.local/schemas/v1/cascade-completion-seal.schema.json",
    version: "1.0.0",
    seal_id: "CCS-" + attemptId.replace(/^ATTEMPT-/u, ""),
    status: "verified",
    run_id: sourceRun.run_id,
    source_run_path: sourceRunPath,
    candidate_head_sha: candidateSha,
    completed_at: evidence.generated_at,
    run_sha256: hashRepoPath(root, sourceRunPath),
    profile_evidence_sha256: hashRepoPath(root, sourceRun.profile_evidence_path),
    completion_evidence_sha256: hashJsonDocument(evidence),
    validation_manifest_sha256: hashRepoPath(root, sourceRun.validation_manifest_path),
    runtime_manifest_sha256: hashRepoPath(root, sourceRun.runtime_manifest_path),
    actual_diff_sha256: hashRepoPath(root, sourceRun.diff_manifest_path),
    completion_command_set_sha256: evidence.command_set_sha256,
    done_claimed: true,
  } : null;

  validateDocument(root, evidence, "schemas/cascade-completion-evidence.schema.json");
  validateDocument(root, completedRun, "schemas/cascade-vnext-run.schema.json");
  if (seal) validateDocument(root, seal, "schemas/cascade-completion-seal.schema.json");
  const files = new Map([
    [path.posix.basename(runPath), JSON.stringify(completedRun, null, 2) + "\n"],
    [path.posix.basename(evidencePath), JSON.stringify(evidence, null, 2) + "\n"],
  ]);
  if (seal) files.set(path.posix.basename(sealPath), JSON.stringify(seal, null, 2) + "\n");
  publishAtomicPackage({ targetDir: absoluteRepoPath(root, outputDir), attemptId, files });
  console.log("cascade vNext completion: " + nextState);
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error("ERROR: " + error.message);
  process.exit(1);
});
