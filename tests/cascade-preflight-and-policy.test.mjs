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
  return spawnSync(process.execPath, args, {
    cwd: root,
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
  return { repo, head: git(["rev-parse", "HEAD"]) };
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
