import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFileSync, spawnSync } from "node:child_process";

const root = process.cwd();

function exec(command, args, cwd = root) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: process.env.LANG ?? "C.UTF-8",
      TZ: process.env.TZ ?? "UTC",
    },
  }).trim();
}

function runPlanner(worktree, args) {
  return spawnSync(process.execPath, ["scripts/run-cascade-vnext.mjs", ...args], {
    cwd: worktree,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: process.env.LANG ?? "C.UTF-8",
      TZ: process.env.TZ ?? "UTC",
    },
  });
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
try {
  exec("git", ["worktree", "add", "--detach", worktree, "HEAD"]);
  worktreeAdded = true;
  const sourceModules = path.join(root, "node_modules");
  const targetModules = path.join(worktree, "node_modules");
  fs.mkdirSync(targetModules);
  for (const entry of fs.readdirSync(sourceModules, { withFileTypes: true })) {
    fs.symlinkSync(
      path.join(sourceModules, entry.name),
      path.join(targetModules, entry.name),
      entry.isDirectory() ? "dir" : "file",
    );
  }
  exec("git", ["config", "user.name", "DataCanvas Cascade Test"], worktree);
  exec("git", ["config", "user.email", "cascade-test@datacanvas.local"], worktree);
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
  exec("git", ["-c", "core.hooksPath=/dev/null", "commit", "-m", "test: create cascade e2e delta"], worktree);
  const planningHeadSha = exec("git", ["rev-parse", "HEAD"], worktree);
  const preflightStatus = exec("git", ["status", "--porcelain=v1"], worktree);
  assert.equal(preflightStatus, "", "сквозной тест должен запускать planner из чистой рабочей копии: " + preflightStatus);

  const outputA = "docs/process/cascading-governance/runs/2026-07-11-vnext-e2e-a";
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

  const outputB = "docs/process/cascading-governance/runs/2026-07-11-vnext-e2e-b";
  const second = runPlanner(worktree, [
    "--change-request", changeRequestPath,
    "--output-dir", outputB,
    "--base-sha", baseSha,
  ]);
  assert.equal(second.status, 0, output(second));
  const secondRun = JSON.parse(fs.readFileSync(path.join(worktree, outputB, "cascade-vnext-run.json"), "utf8"));
  assert.equal(secondRun.replay_key, firstRun.replay_key, "одинаковые входы должны давать один replay key");
  fs.rmSync(path.join(worktree, outputB), { recursive: true, force: true });

  const noDeltaOutput = "docs/process/cascading-governance/runs/2026-07-11-vnext-e2e-no-delta";
  const noDelta = runPlanner(worktree, [
    "--change-request", changeRequestPath,
    "--output-dir", noDeltaOutput,
    "--base-sha", planningHeadSha,
  ]);
  assertFailedWithoutOutput(noDelta, worktree, noDeltaOutput, /no Git delta/u);

  const unknownXlsxOutput = "docs/process/cascading-governance/runs/2026-07-11-vnext-e2e-unknown-xlsx";
  const unknownXlsx = runPlanner(worktree, [
    "--change-request", changeRequestPath,
    "--output-dir", unknownXlsxOutput,
    "--base-sha", baseSha,
    "--trigger-path", "docs/product/sources/working/unregistered.xlsx",
  ]);
  assertFailedWithoutOutput(unknownXlsx, worktree, unknownXlsxOutput, /source identity/u);

  assert.equal(exec("git", ["status", "--porcelain=v1"], worktree), "");
  console.log("cascade vNext end-to-end validation passed");
} finally {
  if (worktreeAdded) {
    try {
      exec("git", ["worktree", "remove", "--force", worktree]);
    } catch {
      fs.rmSync(worktree, { recursive: true, force: true });
      try {
        exec("git", ["worktree", "prune"]);
      } catch {
        // The temporary directory cleanup below remains authoritative.
      }
    }
  }
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
