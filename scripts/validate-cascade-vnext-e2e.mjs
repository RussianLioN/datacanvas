import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFileSync, spawnSync } from "node:child_process";

import { createIsolatedNpmEnvironment } from "./cascade-vnext-runtime.mjs";
import { NESTED_CASCADE_E2E_SUCCESS_MARKER } from "./cascade-completion-core.mjs";

const root = process.cwd();
const nestedValidation = process.env.DATACANVAS_CASCADE_NESTED_VALIDATION === "1";
const nestedRunSuffix = nestedValidation ? "-nested" : "";

function runOutputDir(name) {
  return `docs/process/cascading-governance/runs/${name}${nestedRunSuffix}`;
}

function exec(command, args, cwd = root, environment = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: environment.HOME ?? process.env.HOME,
      LANG: process.env.LANG ?? "C.UTF-8",
      TZ: process.env.TZ ?? "UTC",
      ...environment,
    },
  }).trim();
}

function commitTestChange(worktree, message) {
  return exec(
    "git",
    [
      "-c", "user.name=DataCanvas Cascade Test",
      "-c", "user.email=cascade-test@datacanvas.local",
      "-c", "core.hooksPath=/dev/null",
      "commit", "-m", message,
    ],
    worktree,
  );
}

function runPlanner(worktree, args, environment = {}) {
  return runNodeScript(worktree, "scripts/run-cascade-vnext.mjs", args, 30 * 60 * 1000, environment);
}

function runNodeScript(worktree, script, args, timeout = 30 * 60 * 1000, environment = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: worktree,
    encoding: "utf8",
    timeout,
    maxBuffer: 64 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: process.env.LANG ?? "C.UTF-8",
      TZ: process.env.TZ ?? "UTC",
      ...environment,
    },
  });
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function output(result) {
  return String(result.stdout ?? "") + String(result.stderr ?? "") + String(result.error?.message ?? "");
}

function assertFailedWithoutOutput(result, worktree, outputDir, pattern) {
  assert.notEqual(result.status, 0, "негативный сценарий не должен завершаться успешно");
  assert.match(output(result), pattern);
  assert.equal(
    fs.existsSync(path.join(worktree, outputDir)),
    false,
    "ошибка preflight не должна оставлять частичный пакет запуска",
  );
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-cascade-e2e-"));
const worktree = path.join(tempRoot, "candidate");
let worktreeAdded = false;
let cleanupStarted = false;

function cleanupWorktree() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  if (worktreeAdded) {
    try {
      exec("git", ["worktree", "remove", "--force", worktree]);
    } catch {
      fs.rmSync(worktree, { recursive: true, force: true });
      try {
        exec("git", ["worktree", "prune"]);
      } catch {
        // Exact temporary path cleanup remains authoritative.
      }
    }
  }
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function handleTermination(signal) {
  cleanupWorktree();
  process.exit(signal === "SIGINT" ? 130 : 143);
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.once(signal, () => handleTermination(signal));
}
process.once("exit", cleanupWorktree);

try {
  exec("git", ["worktree", "add", "--detach", worktree, "HEAD"]);
  worktreeAdded = true;
  const npmEnvironment = createIsolatedNpmEnvironment(tempRoot);
  exec("npm", ["ci", "--ignore-scripts"], worktree, npmEnvironment);
  const baseSha = exec("git", ["rev-parse", "HEAD"], worktree);

  fs.appendFileSync(
    path.join(worktree, "docs/product-vision.md"),
    "\n<!-- временное изменение сквозного теста каскада -->\n",
    "utf8",
  );
  const changeRequestPath = "tests/fixtures/cascading-governance/vnext/e2e-change-request.json";
  const changeRequest = {
    version: "0.1.0",
    change_request_id: "DCR-2026-07-11-902",
    status: "confirmed",
    initiator: { actor_role: "Process Owner", source: "Сквозная проверка каскада vNext." },
    target_artifact: "docs/product-vision.md",
    desired_change: "Проверить двунаправленный каскад для изменения Vision.",
    change_source: "process_decision",
    impact_level: "high",
    affected_period: null,
    affected_backlog_story_ids: [],
    known_constraints: ["Тестовая рабочая копия удаляется после проверки."],
    user_confirmation_status: "confirmed",
    semantic_change: true,
    requested_at: "2026-07-11T00:00:00Z",
  };
  fs.writeFileSync(
    path.join(worktree, changeRequestPath),
    JSON.stringify(changeRequest, null, 2) + "\n",
    "utf8",
  );
  exec("git", ["add", "docs/product-vision.md", changeRequestPath], worktree);
  commitTestChange(worktree, "test: create cascade e2e delta");
  const planningHeadSha = exec("git", ["rev-parse", "HEAD"], worktree);
  const preflightStatus = exec("git", ["status", "--porcelain=v1", "--untracked-files=all"], worktree);
  assert.equal(preflightStatus, "", "сквозной тест должен запускать planner из чистой рабочей копии: " + preflightStatus);

  const dirtyMarkerPath = path.join(worktree, ".cascade-e2e-dirty");
  fs.writeFileSync(dirtyMarkerPath, "dirty\n", "utf8");
  const dirtyBypassOutput = runOutputDir("2026-07-11-vnext-e2e-dirty-bypass");
  const dirtyBypass = runPlanner(worktree, [
    "--change-request", changeRequestPath,
    "--output-dir", dirtyBypassOutput,
    "--base-sha", baseSha,
    "--allow-dirty",
  ], {
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "status.showUntrackedFiles",
    GIT_CONFIG_VALUE_0: "no",
  });
  assertFailedWithoutOutput(dirtyBypass, worktree, dirtyBypassOutput, /requires a clean worktree/u);
  fs.rmSync(dirtyMarkerPath);

  const outputA = runOutputDir("2026-07-11-vnext-e2e-a");
  const first = runPlanner(worktree, [
    "--change-request", changeRequestPath,
    "--output-dir", outputA,
    "--base-sha", baseSha,
  ]);
  assert.equal(first.status, 0, output(first));
  const firstRun = JSON.parse(fs.readFileSync(path.join(worktree, outputA, "cascade-vnext-run.json"), "utf8"));
  const firstImpact = JSON.parse(fs.readFileSync(path.join(worktree, outputA, "semantic-impact-report.json"), "utf8"));
  assert.equal(firstRun.state, "awaiting_owner");
  assert.equal(firstRun.change_request_id, changeRequest.change_request_id);
  assert.match(firstRun.replay_key, /^[0-9a-f]{64}$/u);
  assert.equal(firstImpact.changed_sources[0].path, "docs/product-vision.md");
  assert.ok(firstImpact.write_obligations.length > 0, "изменение Vision должно дать нижестоящие обязательства");
  fs.rmSync(path.join(worktree, outputA), { recursive: true, force: true });

  const outputB = runOutputDir("2026-07-11-vnext-e2e-b");
  const second = runPlanner(worktree, [
    "--change-request", changeRequestPath,
    "--output-dir", outputB,
    "--base-sha", baseSha,
  ]);
  assert.equal(second.status, 0, output(second));
  const secondRun = JSON.parse(fs.readFileSync(path.join(worktree, outputB, "cascade-vnext-run.json"), "utf8"));
  assert.equal(secondRun.replay_key, firstRun.replay_key, "одинаковые входы должны давать один replay key");
  fs.rmSync(path.join(worktree, outputB), { recursive: true, force: true });

  const noDeltaOutput = runOutputDir("2026-07-11-vnext-e2e-no-delta");
  const noDelta = runPlanner(worktree, [
    "--change-request", changeRequestPath,
    "--output-dir", noDeltaOutput,
    "--base-sha", planningHeadSha,
  ]);
  assertFailedWithoutOutput(noDelta, worktree, noDeltaOutput, /no Git delta/u);

  const unknownXlsxOutput = runOutputDir("2026-07-11-vnext-e2e-unknown-xlsx");
  const unknownXlsx = runPlanner(worktree, [
    "--change-request", changeRequestPath,
    "--output-dir", unknownXlsxOutput,
    "--base-sha", baseSha,
    "--trigger-path", "docs/product/sources/working/unregistered.xlsx",
  ]);
  assertFailedWithoutOutput(unknownXlsx, worktree, unknownXlsxOutput, /source identity/u);

  assert.equal(exec("git", ["status", "--porcelain=v1"], worktree), "");
  const archiveRefresh = runNodeScript(worktree, "scripts/generate-documentation-archive.mjs", []);
  assert.equal(archiveRefresh.status, 0, output(archiveRefresh));
  const hashRefresh = runNodeScript(worktree, "scripts/generate-artifact-hash-manifest.mjs", []);
  assert.equal(hashRefresh.status, 0, output(hashRefresh));
  const hashRefreshStatus = exec("git", ["status", "--porcelain=v1"], worktree);
  assert.equal(
    hashRefreshStatus,
    [
      "M artifacts/documentation-archive/datacanvas-main-documentation.zip",
      " M docs/architecture/schemas/artifact-hash-manifest.json",
    ].join("\n"),
    "подготовительная правка Vision должна обновлять архив документации и манифест хэшей",
  );
  exec("git", [
    "add",
    "artifacts/documentation-archive/datacanvas-main-documentation.zip",
    "docs/architecture/schemas/artifact-hash-manifest.json",
  ], worktree);
  commitTestChange(worktree, "test: refresh generated artifacts after planner delta");

  const lifecycleBaseSha = exec("git", ["rev-parse", "HEAD"], worktree);
  const lifecycleSourcePath = "docs/process/current/process-backlog.md";
  fs.appendFileSync(
    path.join(worktree, lifecycleSourcePath),
    "\n<!-- проверка полного жизненного цикла каскада vNext -->\n",
    "utf8",
  );
  const lifecycleRequestPath = runOutputDir("2026-07-11-vnext-e2e-lifecycle-request") + "/documentation-change-request.json";
  const lifecycleRequest = {
    version: "0.1.0",
    change_request_id: "DCR-2026-07-11-903",
    status: "confirmed",
    initiator: { actor_role: "Process Owner", source: "Сквозная проверка полного жизненного цикла каскада vNext." },
    target_artifact: lifecycleSourcePath,
    desired_change: "Проверить неизменяемость evidence-пакетов и полное завершение каскада.",
    change_source: "process_decision",
    impact_level: "low",
    affected_period: null,
    affected_backlog_story_ids: [],
    known_constraints: ["Проверка не меняет продуктовый смысл DataCanvas."],
    user_confirmation_status: "confirmed",
    semantic_change: false,
    requested_at: "2026-07-11T00:00:00Z",
  };
  fs.mkdirSync(path.dirname(path.join(worktree, lifecycleRequestPath)), { recursive: true });
  fs.writeFileSync(
    path.join(worktree, lifecycleRequestPath),
    JSON.stringify(lifecycleRequest, null, 2) + "\n",
    "utf8",
  );
  exec("git", ["add", lifecycleSourcePath, lifecycleRequestPath], worktree);
  commitTestChange(worktree, "test: create full cascade lifecycle delta");

  const lifecyclePlanDir = runOutputDir("2026-07-11-vnext-e2e-lifecycle-plan");
  const lifecyclePlanResult = runPlanner(worktree, [
    "--change-request", lifecycleRequestPath,
    "--output-dir", lifecyclePlanDir,
    "--base-sha", lifecycleBaseSha,
  ]);
  assert.equal(lifecyclePlanResult.status, 0, output(lifecyclePlanResult));
  const lifecycleRunPath = lifecyclePlanDir + "/cascade-vnext-run.json";
  const lifecycleRun = JSON.parse(fs.readFileSync(path.join(worktree, lifecycleRunPath), "utf8"));
  const lifecycleImpact = JSON.parse(fs.readFileSync(path.join(worktree, lifecycleRun.impact_report_path), "utf8"));
  assert.equal(lifecycleRun.state, "planned");
  assert.equal(lifecycleRun.owner_question_packet_path, null);
  exec("git", ["add", lifecyclePlanDir], worktree);
  commitTestChange(worktree, "test: persist immutable cascade planning package");

  const rationale = (artifactPath) => ({
    rationale: "Проверочный процессный комментарий не меняет содержание зависимого артефакта.",
    confirmed_by: "DataCanvas Cascade Test",
    confirmed_at: "2026-07-11T00:05:00Z",
    source_artifact: lifecycleSourcePath,
    change_class: "process_structure_change",
    covered_requirements: ["Сквозная проверка неизменяемости evidence-пакетов."],
    acceptance_impact: "Критерии приемки продукта не меняются.",
    traceability_impact: "Связи продуктовых требований не меняются.",
    residual_risk: "Остается только риск ошибки самого сквозного теста.",
    owner_role: "Process Owner",
    reconsider_when: "Пересмотреть при изменении содержания " + artifactPath + ".",
  });
  const lifecycleResolutionPath = runOutputDir("2026-07-11-vnext-e2e-lifecycle-input") + "/resolution-input.json";
  const lifecycleResolution = {
    version: "1.0.0",
    resolution_id: "CRI-2026-07-11-903",
    source_run_path: lifecycleRunPath,
    resolved_at: "2026-07-11T00:05:00Z",
    source_resolutions: [{
      path: lifecycleSourcePath,
      update_status: "applied",
      no_change_rationale: null,
      expected_after_sha256: sha256File(path.join(worktree, lifecycleSourcePath)),
      approved_patch_digest: null,
    }],
    artifact_resolutions: lifecycleImpact.diagnostic_classifications
      .filter((entry) => entry.classification !== "changed_source")
      .map((entry) => ({
        path: entry.path,
        update_status: "no_change_confirmed",
        no_change_rationale: rationale(entry.path),
        expected_after_sha256: null,
        approved_patch_digest: null,
      })),
    decision_resolutions: [],
  };
  fs.mkdirSync(path.dirname(path.join(worktree, lifecycleResolutionPath)), { recursive: true });
  fs.writeFileSync(
    path.join(worktree, lifecycleResolutionPath),
    JSON.stringify(lifecycleResolution, null, 2) + "\n",
    "utf8",
  );
  exec("git", ["add", lifecycleResolutionPath], worktree);
  commitTestChange(worktree, "test: add cascade lifecycle resolution");
  const lifecycleCandidateSha = exec("git", ["rev-parse", "HEAD"], worktree);

  const lifecycleFinalDir = runOutputDir("2026-07-11-vnext-e2e-lifecycle-final");
  const finalizeResult = runNodeScript(worktree, "scripts/finalize-cascade-vnext.mjs", [
    "--run", lifecycleRunPath,
    "--resolution-input", lifecycleResolutionPath,
    "--candidate-head-sha", lifecycleCandidateSha,
    "--output-dir", lifecycleFinalDir,
  ]);
  assert.equal(finalizeResult.status, 0, output(finalizeResult));
  const finalizedRunPath = lifecycleFinalDir + "/cascade-vnext-run.json";
  exec("git", ["add", lifecycleFinalDir], worktree);
  commitTestChange(worktree, "test: persist immutable cascade finalization package");
  const finalizationPackageCommitSha = exec("git", ["rev-parse", "HEAD"], worktree);

  if (nestedValidation) {
    console.log(NESTED_CASCADE_E2E_SUCCESS_MARKER);
  } else {
    const finalizedRunAbsolute = path.join(worktree, finalizedRunPath);
    const finalizedRunOriginal = fs.readFileSync(finalizedRunAbsolute, "utf8");
    const finalizedRunTampered = JSON.parse(finalizedRunOriginal);
    finalizedRunTampered.candidate_head_sha = finalizationPackageCommitSha;
    fs.writeFileSync(finalizedRunAbsolute, JSON.stringify(finalizedRunTampered, null, 2) + "\n", "utf8");
    const tamperedProfileDir = runOutputDir("2026-07-11-vnext-e2e-lifecycle-tampered-profile");
    const tamperedProfileResult = runNodeScript(worktree, "scripts/verify-cascade-profile-vnext.mjs", [
      "--run", finalizedRunPath,
      "--output-dir", tamperedProfileDir,
    ]);
    assertFailedWithoutOutput(tamperedProfileResult, worktree, tamperedProfileDir, /not immutable/u);
    fs.writeFileSync(finalizedRunAbsolute, finalizedRunOriginal, "utf8");
    assert.equal(exec("git", ["status", "--porcelain=v1"], worktree), "");

    const lifecycleProfileDir = runOutputDir("2026-07-11-vnext-e2e-lifecycle-profile");
    const profileResult = runNodeScript(worktree, "scripts/verify-cascade-profile-vnext.mjs", [
      "--run", finalizedRunPath,
      "--output-dir", lifecycleProfileDir,
    ]);
    const profileEvidencePath = path.join(worktree, lifecycleProfileDir, "profile-evidence.json");
    const profileDiagnostics = fs.existsSync(profileEvidencePath)
      ? "\n" + fs.readFileSync(profileEvidencePath, "utf8")
      : "";
    assert.equal(profileResult.status, 0, output(profileResult) + profileDiagnostics);
    const profileRunPath = lifecycleProfileDir + "/cascade-vnext-run.json";
    const profileRun = JSON.parse(fs.readFileSync(path.join(worktree, profileRunPath), "utf8"));
    assert.equal(profileRun.state, "profile_verified");
    exec("git", ["add", lifecycleProfileDir], worktree);
    commitTestChange(worktree, "test: persist immutable cascade profile package");

    const lifecycleCompleteDir = runOutputDir("2026-07-11-vnext-e2e-lifecycle-complete");
    const completionResult = runNodeScript(worktree, "scripts/complete-cascade-vnext.mjs", [
      "--run", profileRunPath,
      "--output-dir", lifecycleCompleteDir,
    ], 45 * 60 * 1000);
    const completionEvidencePath = path.join(worktree, lifecycleCompleteDir, "completion-evidence.json");
    const completionDiagnostics = fs.existsSync(completionEvidencePath)
      ? "\n" + fs.readFileSync(completionEvidencePath, "utf8")
      : "";
    assert.equal(completionResult.status, 0, output(completionResult) + completionDiagnostics);
    const completedRun = JSON.parse(fs.readFileSync(path.join(worktree, lifecycleCompleteDir, "cascade-vnext-run.json"), "utf8"));
    const completionEvidence = JSON.parse(fs.readFileSync(completionEvidencePath, "utf8"));
    const completionFullGate = completionEvidence.command_results.find((entry) => entry.id === "full-gate");
    assert.doesNotMatch(completionFullGate.summary, /nested end-to-end validation skipped/iu);
    assert.ok(completionFullGate.summary.includes(NESTED_CASCADE_E2E_SUCCESS_MARKER));
    assert.equal(completedRun.state, "verified");
    assert.equal(completedRun.completion_claim.done_claimed, true);
    assert.equal(fs.existsSync(path.join(worktree, lifecycleCompleteDir, "completion-seal.json")), true);
    console.log("cascade vNext end-to-end validation passed");
  }
} finally {
  cleanupWorktree();
}
