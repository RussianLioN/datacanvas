import crypto from "node:crypto";
import process from "node:process";
import { execFileSync } from "node:child_process";

import { hashRepoPath } from "./cascade-evidence-utils.mjs";
import { git, readJson, validateDocument } from "./cascade-vnext-runtime.mjs";

const root = process.cwd();
const authorityPath = "docs/process/cascading-governance/acceptance-authority.json";
const ledgerPath = "docs/process/cascading-governance/supersession-ledger.json";

function hashGitFile(commitSha, relativePath) {
  const content = execFileSync("git", ["show", commitSha + ":" + relativePath], {
    cwd: root,
    encoding: null,
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME },
  });
  return crypto.createHash("sha256").update(content).digest("hex");
}

const authority = readJson(root, authorityPath);
validateDocument(root, authority, "schemas/cascade-acceptance-authority.schema.json");
const bindingIds = new Set();
const ownerRoles = new Set();
for (const binding of authority.bindings) {
  if (bindingIds.has(binding.binding_id)) throw new Error("duplicate authority binding id: " + binding.binding_id);
  if (ownerRoles.has(binding.owner_role)) throw new Error("duplicate active authority role: " + binding.owner_role);
  bindingIds.add(binding.binding_id);
  ownerRoles.add(binding.owner_role);
}

const ledger = readJson(root, ledgerPath);
validateDocument(root, ledger, "schemas/cascade-supersession-ledger.schema.json");
const legacyPaths = new Set();
for (const entry of ledger.entries) {
  if (legacyPaths.has(entry.legacy_path)) throw new Error("duplicate supersession path: " + entry.legacy_path);
  legacyPaths.add(entry.legacy_path);
  if (hashRepoPath(root, entry.legacy_path) !== entry.observed_sha256) {
    throw new Error("supersession observed hash mismatch: " + entry.legacy_path);
  }
  if (hashGitFile(entry.original_commit_sha, entry.legacy_path) !== entry.original_sha256) {
    throw new Error("supersession original hash mismatch: " + entry.legacy_path);
  }
  const lastModified = git(root, ["log", "-1", "--format=%H", "--", entry.legacy_path]).trim();
  if (lastModified !== entry.last_modified_commit_sha) {
    throw new Error("supersession last modified commit mismatch: " + entry.legacy_path);
  }
  if (entry.owner_status === "accepted" && !entry.replacement_path) {
    throw new Error("accepted supersession entry requires a replacement: " + entry.legacy_path);
  }
}

console.log("cascade trust validation passed");
