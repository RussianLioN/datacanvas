import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { isAllowedMainPointerSuccessor } from "../scripts/lib/doc-stale-status.mjs";

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function writeCommit(root, relativePath, content, message) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  git(root, ["add", relativePath]);
  git(root, ["commit", "-m", message]);
  return git(root, ["rev-parse", "HEAD"]);
}

function createRepository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-stale-status-"));
  git(root, ["init", "--initial-branch=main"]);
  git(root, ["config", "user.name", "DataCanvas Test"]);
  git(root, ["config", "user.email", "datacanvas-test@example.invalid"]);
  return root;
}

const allowedPaths = new Set(["docs/navigation/navigation-source.json"]);

test("allows a candidate commit descended from a pointer-only main successor", (t) => {
  const root = createRepository();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const pointerCommit = writeCommit(
    root,
    "docs/navigation/navigation-source.json",
    "pointer: old\n",
    "record old main pointer",
  );
  const currentMainCommit = writeCommit(
    root,
    "docs/navigation/navigation-source.json",
    "pointer: current\n",
    "refresh main pointer",
  );
  const candidateCommit = writeCommit(
    root,
    "tests/candidate.txt",
    "candidate\n",
    "create detached cascade candidate",
  );

  assert.equal(
    isAllowedMainPointerSuccessor({
      root,
      pointerCommit,
      currentMainCommit,
      headCommit: candidateCommit,
      allowedPaths,
    }),
    true,
  );
});

test("rejects a current main successor with a non-pointer change", (t) => {
  const root = createRepository();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const pointerCommit = writeCommit(
    root,
    "docs/navigation/navigation-source.json",
    "pointer: old\n",
    "record old main pointer",
  );
  const currentMainCommit = writeCommit(
    root,
    "docs/product-vision.md",
    "changed product meaning\n",
    "change product document",
  );

  assert.equal(
    isAllowedMainPointerSuccessor({
      root,
      pointerCommit,
      currentMainCommit,
      headCommit: currentMainCommit,
      allowedPaths,
    }),
    false,
  );
});

test("rejects a candidate that does not descend from current main", (t) => {
  const root = createRepository();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const pointerCommit = writeCommit(
    root,
    "docs/navigation/navigation-source.json",
    "pointer: old\n",
    "record old main pointer",
  );
  git(root, ["switch", "-c", "candidate", pointerCommit]);
  const candidateCommit = writeCommit(
    root,
    "tests/candidate.txt",
    "candidate\n",
    "create stale candidate",
  );
  git(root, ["switch", "main"]);
  const currentMainCommit = writeCommit(
    root,
    "docs/navigation/navigation-source.json",
    "pointer: current\n",
    "refresh main pointer",
  );

  assert.equal(
    isAllowedMainPointerSuccessor({
      root,
      pointerCommit,
      currentMainCommit,
      headCommit: candidateCommit,
      allowedPaths,
    }),
    false,
  );
});
