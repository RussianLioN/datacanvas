import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { assertCascadePreflight } from "../scripts/cascade-preflight.mjs";

const root = path.resolve(new URL("../", import.meta.url).pathname);
const approvalLedgerPath = "docs/product/change-orders/co-2026-003-release-approval-ledger.md";
const protectedDerivedPaths = [
  "docs/architecture/schemas/artifact-hash-manifest.json",
  "docs/navigation/documentation-index.json",
  "docs/navigation/orphan-docs-report.md",
];

function runNode(args) {
  return runNodeInCwd(args, root);
}

function runNodeInCwd(args, cwd) {
  return spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
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

function sha256(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return fs.existsSync(absolutePath)
    ? crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex")
    : null;
}

function gitStatus() {
  const result = spawnSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: process.env.LANG ?? "C.UTF-8",
      TZ: process.env.TZ ?? "UTC",
    },
  });
  assert.equal(result.status, 0, output(result));
  return result.stdout;
}

function tempGitRepo(t) {
  const repo = fs.mkdtempSync(path.join(path.dirname(root), ".cascade-preflight-test-"));
  const git = (args) => {
    const result = spawnSync("git", args, {
      cwd: repo,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        LANG: process.env.LANG ?? "C.UTF-8",
        TZ: process.env.TZ ?? "UTC",
      },
    });
    assert.equal(result.status, 0, output(result));
    return result.stdout.trim();
  };
  git(["init", "-q"]);
  git(["config", "user.name", "Cascade Preflight Test"]);
  git(["config", "user.email", "cascade-preflight@datacanvas.local"]);
  fs.writeFileSync(path.join(repo, "package.json"), "{\"name\":\"datacanvas\",\"scripts\":{}}\n", "utf8");
  fs.mkdirSync(path.join(repo, "docs/process/cascading-governance"), { recursive: true });
  fs.writeFileSync(path.join(repo, "docs/process/cascading-governance/artifact-dependency-graph.json"), "{}\n", "utf8");
  git(["add", "."]);
  git(["commit", "-q", "-m", "Initial cascade preflight fixture"]);
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  return { repo, head: git(["rev-parse", "HEAD"]), git };
}

function lifecycleArgs(script, head) {
  if (path.basename(script) === "finalize-cascade-vnext.mjs") {
    return [
      script,
      "--run",
      "missing-run.json",
      "--resolution-input",
      "missing-resolution.json",
      "--candidate-head-sha",
      head,
      "--output-dir",
      "docs/process/cascading-governance/runs/missing-finalized",
    ];
  }
  return [
    script,
    "--run",
    "missing-run.json",
    "--output-dir",
    "docs/process/cascading-governance/runs/missing-output",
  ];
}

test("cascade preflight rejects a dirty target worktree before any action", (t) => {
  const { repo, head } = tempGitRepo(t);
  fs.writeFileSync(path.join(repo, "dirty-marker.txt"), "dirty\n", "utf8");
  let actionStarted = false;

  assert.throws(() => {
    assertCascadePreflight({ root: repo, baseSha: head });
    actionStarted = true;
  }, /clean worktree/u);
  assert.equal(actionStarted, false);
});

test("cascade preflight rejects a wrong launch path or exact revision before any action", (t) => {
  const { repo, head } = tempGitRepo(t);
  const subdir = path.join(repo, "docs");
  let actionStarted = false;

  assert.throws(() => {
    assertCascadePreflight({ root: subdir, baseSha: head });
    actionStarted = true;
  }, /repository root/u);
  assert.equal(actionStarted, false);

  assert.throws(() => {
    assertCascadePreflight({ root: repo, expectedHeadSha: "f".repeat(40), baseSha: head });
    actionStarted = true;
  }, /expected HEAD/u);
  assert.equal(actionStarted, false);
});

test("cascade preflight rejects missing and non-ancestor base SHA values", (t) => {
  const { repo, head, git } = tempGitRepo(t);

  assert.throws(() => {
    assertCascadePreflight({ root: repo, baseSha: "0".repeat(40) });
  }, /base_sha.*does not exist/u);

  const primaryBranch = git(["branch", "--show-current"]);
  git(["checkout", "-q", "--orphan", "unrelated-base"]);
  fs.writeFileSync(path.join(repo, "orphan-marker.txt"), "orphan\n", "utf8");
  git(["add", "."]);
  git(["commit", "-q", "-m", "Unrelated base"]);
  const unrelatedSha = git(["rev-parse", "HEAD"]);
  git(["checkout", "-q", primaryBranch]);

  assert.throws(() => {
    assertCascadePreflight({ root: repo, baseSha: unrelatedSha });
  }, /base_sha.*ancestor/u);
  assert.equal(assertCascadePreflight({ root: repo, baseSha: head }).base_sha, head);
});

test("cascade lifecycle commands run preflight before reading invalid input packages", (t) => {
  const { repo, head } = tempGitRepo(t);
  fs.writeFileSync(path.join(repo, "dirty-marker.txt"), "dirty\n", "utf8");

  for (const script of [
    "scripts/finalize-cascade-vnext.mjs",
    "scripts/verify-cascade-profile-vnext.mjs",
    "scripts/complete-cascade-vnext.mjs",
  ]) {
    const result = runNodeInCwd(lifecycleArgs(path.join(root, script), head), repo);
    assert.notEqual(result.status, 0, script);
    assert.match(output(result), /clean worktree/u, script);
    assert.doesNotMatch(output(result), /ENOENT|no such file|schema|requires .*state/iu, script);
  }
});

test("cascade lifecycle commands reject a wrong launch path before reading invalid input packages", (t) => {
  const { repo, head } = tempGitRepo(t);
  const subdir = path.join(repo, "docs");

  for (const script of [
    "scripts/finalize-cascade-vnext.mjs",
    "scripts/verify-cascade-profile-vnext.mjs",
    "scripts/complete-cascade-vnext.mjs",
  ]) {
    const result = runNodeInCwd(lifecycleArgs(path.join(root, script), head), subdir);
    assert.notEqual(result.status, 0, script);
    assert.match(output(result), /repository root/u, script);
    assert.doesNotMatch(output(result), /ENOENT|no such file|schema|requires .*state/iu, script);
  }
});

test("preview for the CO-2026-003 approval ledger reports a non-empty meaningful impact cone", () => {
  const result = runNode([
    "scripts/plan-documentation-cascade.mjs",
    "--files",
    approvalLedgerPath,
    "--format",
    "json",
  ]);

  assert.equal(result.status, 0, output(result));
  const cone = JSON.parse(result.stdout);
  assert.deepEqual(cone.changed_source_set, [{
    path: approvalLedgerPath,
    change_class: "semantic_change",
  }]);
  const impactedPaths = new Set(cone.impacted_artifacts.map((artifact) => artifact.path));
  for (const expectedPath of [
    "docs/product/change-orders/co-2026-003-release-approval-ledger.json",
    "docs/product/requirements/user-stories.md",
    "docs/product/requirements/business-requirements.md",
    "docs/product/requirements/acceptance-criteria.md",
    "docs/architecture/system-analysis/sa-spec.json",
    "docs/navigation/navigation-source.json",
    "docs/release/co-2026-003-prototype-delivery-archive-contract.json",
    "docs/release/co-2026-003-q4-lisa-profile-validation-evidence.md",
    "artifacts/documentation-archive/datacanvas-main-documentation.zip",
  ]) {
    assert.ok(impactedPaths.has(expectedPath), `missing impact path: ${expectedPath}`);
  }
  const approvalLedgerJson = cone.impacted_artifacts.find((artifact) =>
    artifact.path === "docs/product/change-orders/co-2026-003-release-approval-ledger.json"
  );
  assert.equal(approvalLedgerJson.owner_gate_required, true);
  assert.equal(approvalLedgerJson.review_obligation, "owner_decision");
});

test("cascade preview check mode does not create, overwrite, or publish derived artifacts", () => {
  const beforeStatus = gitStatus();
  const beforeHashes = Object.fromEntries(protectedDerivedPaths.map((relativePath) => [relativePath, sha256(relativePath)]));
  const result = runNode([
    "scripts/plan-documentation-cascade.mjs",
    "--check",
    "--files",
    approvalLedgerPath,
    "--format",
    "text",
  ]);

  assert.equal(result.status, 0, output(result));
  assert.equal(gitStatus(), beforeStatus);
  assert.deepEqual(
    Object.fromEntries(protectedDerivedPaths.map((relativePath) => [relativePath, sha256(relativePath)])),
    beforeHashes,
  );
  assert.doesNotMatch(output(result), /published|created|updated|записан|создан|обновлен/iu);
});
