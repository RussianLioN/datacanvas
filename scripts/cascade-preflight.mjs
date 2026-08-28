import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const gitShaPattern = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: process.env.LANG ?? "C.UTF-8",
      TZ: process.env.TZ ?? "UTC",
    },
  }).trim();
}

function assertGitSha(value, label) {
  if (value == null) return null;
  if (!gitShaPattern.test(value)) {
    throw new Error(`${label} must be an immutable Git SHA`);
  }
  return value;
}

function assertExistingCommit(root, sha, label) {
  try {
    git(root, ["cat-file", "-e", `${sha}^{commit}`]);
  } catch {
    throw new Error(`${label} commit does not exist: ${sha}`);
  }
}

function assertAncestorCommit(root, ancestorSha, descendantSha, label) {
  try {
    git(root, ["merge-base", "--is-ancestor", ancestorSha, descendantSha]);
  } catch {
    throw new Error(`${label} must be an ancestor of current HEAD: ${ancestorSha}`);
  }
}

function assertDatacanvasCascadeRoot(root) {
  const absoluteRoot = path.resolve(root);
  const gitRoot = path.resolve(git(absoluteRoot, ["rev-parse", "--show-toplevel"]));
  if (gitRoot !== absoluteRoot) {
    throw new Error(`cascade must be launched from the repository root: ${gitRoot}`);
  }
  for (const requiredPath of [
    "package.json",
    "docs/process/cascading-governance/artifact-dependency-graph.json",
  ]) {
    if (!fs.existsSync(path.join(absoluteRoot, requiredPath))) {
      throw new Error(`cascade target is not the expected DataCanvas worktree: missing ${requiredPath}`);
    }
  }
  return absoluteRoot;
}

export function assertCascadePreflight({
  root = process.cwd(),
  baseSha = null,
  expectedHeadSha = process.env.DATACANVAS_CASCADE_EXPECTED_HEAD || null,
} = {}) {
  const absoluteRoot = assertDatacanvasCascadeRoot(root);
  const currentHeadSha = git(absoluteRoot, ["rev-parse", "HEAD"]);
  const expectedHead = assertGitSha(expectedHeadSha, "expected HEAD");
  if (expectedHead && currentHeadSha !== expectedHead) {
    throw new Error(`cascade target is not at expected HEAD: expected ${expectedHead}, actual ${currentHeadSha}`);
  }

  const baseline = assertGitSha(baseSha, "base_sha");
  if (baseline) {
    assertExistingCommit(absoluteRoot, baseline, "base_sha");
    assertAncestorCommit(absoluteRoot, baseline, currentHeadSha, "base_sha");
  }

  const dirtyStatus = git(absoluteRoot, ["status", "--porcelain=v1", "--untracked-files=all"]);
  if (dirtyStatus) {
    throw new Error("cascade target is not immutable: persisted cascade planning requires a clean worktree");
  }

  return { root: absoluteRoot, head_sha: currentHeadSha, base_sha: baseline };
}
