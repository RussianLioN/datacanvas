import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { absoluteRepoPath } from "./cascade-evidence-utils.mjs";
import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

export function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(absoluteRepoPath(root, relativePath), "utf8"));
}

export function validateDocument(root, data, schemaPath) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(readJson(root, "schemas/common-defs.schema.json"));
  ajv.addSchema(readJson(root, "schemas/impact-analysis-report.schema.json"));
  const validate = ajv.compile(readJson(root, schemaPath));
  if (!validate(data)) throw new Error(`${schemaPath} validation failed: ${JSON.stringify(validate.errors, null, 2)}`);
}

export function git(root, args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    timeout: options.timeout ?? 30_000,
    maxBuffer: options.maxBuffer ?? 4 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: process.env.LANG ?? "C.UTF-8", TZ: process.env.TZ ?? "UTC" },
  });
}

export function assertGitCommit(root, value, label) {
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(value ?? "")) throw new Error(`${label} must be an immutable Git SHA`);
  git(root, ["cat-file", "-e", `${value}^{commit}`]);
  return value;
}

export function assertAncestor(root, baseSha, candidateSha) {
  git(root, ["merge-base", "--is-ancestor", baseSha, candidateSha]);
}

export function parseGitNameStatus(output) {
  const tokens = output.split("\0").filter(Boolean);
  const entries = [];
  for (let index = 0; index < tokens.length;) {
    const status = tokens[index++];
    if (/^[RC]/u.test(status)) {
      const oldPath = normalizeRepoPath(tokens[index++]);
      const newPath = normalizeRepoPath(tokens[index++]);
      entries.push({ status, path: newPath, old_path: oldPath });
    } else {
      entries.push({ status, path: normalizeRepoPath(tokens[index++]), old_path: null });
    }
  }
  return entries;
}

export function hashGitPath(root, candidateSha, relativePath) {
  const result = spawnSync("git", ["show", `${candidateSha}:${relativePath}`], {
    cwd: root,
    encoding: null,
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME },
  });
  if (result.status !== 0) return null;
  return sha256(result.stdout);
}

export function hashGitPatch(root, baseSha, candidateSha, relativePath) {
  const result = spawnSync("git", ["diff", "--binary", "--no-ext-diff", baseSha + ".." + candidateSha, "--", relativePath], {
    cwd: root,
    encoding: null,
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME },
  });
  if (result.status !== 0) throw new Error("cannot calculate Git patch digest for " + relativePath);
  return sha256(result.stdout);
}

export function assertFreshRunDir(relativePath, runsRoot = "docs/process/cascading-governance/runs") {
  const normalized = normalizeRepoPath(relativePath);
  if (!normalized.startsWith(`${runsRoot}/`) || normalized.slice(runsRoot.length + 1).includes("/")) {
    throw new Error(`output dir must be a fresh direct child of ${runsRoot}`);
  }
  return normalized;
}

export function sanitizeOutput(value, root) {
  const rootPattern = root.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return String(value)
    .replace(new RegExp(rootPattern, "gu"), "<repo>")
    .replace(/(token|secret|password|api[_-]?key)\s*[:=]\s*\S+/giu, "$1=<redacted>")
    .slice(0, 4000);
}
