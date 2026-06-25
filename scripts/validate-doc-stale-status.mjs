import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourcePath = "docs/navigation/navigation-source.json";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function optionalGitRef(ref) {
  try {
    return execFileSync("git", ["rev-parse", ref], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function optionalGitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function isAncestor(ancestor, descendant) {
  return optionalGitOutput(["merge-base", "--is-ancestor", ancestor, descendant]) === "";
}

function changedFiles(baseRef, headRef) {
  const output = optionalGitOutput(["diff", "--name-only", `${baseRef}..${headRef}`]);
  if (output === null) {
    return null;
  }
  if (output === "") {
    return [];
  }
  return output.split("\n").filter(Boolean);
}

const mainPointerRefreshPaths = new Set([
  "docs/architecture/schemas/artifact-hash-manifest.json",
  "docs/navigation/documentation-index.json",
  "docs/navigation/navigation-map.md",
  "docs/navigation/navigation-source.json",
  "docs/navigation/stale-status-report.md",
  "docs/release/commit-pr-evidence.md",
  "scripts/validate-doc-stale-status.mjs",
]);

function isAllowedMainPointerSuccessor(pointerCommit, currentMainCommit) {
  const head = optionalGitRef("HEAD");
  if (!head || head !== currentMainCommit || !isAncestor(pointerCommit, currentMainCommit)) {
    return false;
  }
  const files = changedFiles(pointerCommit, currentMainCommit);
  if (!files) {
    return false;
  }
  return files.every((filePath) => mainPointerRefreshPaths.has(filePath));
}

const source = readJson(sourcePath);
const findings = [];

for (const scanPath of source.stale_status_checks.scan_paths) {
  const absolutePath = path.join(root, scanPath);
  if (!fs.existsSync(absolutePath)) {
    findings.push(`${scanPath}: scan target is missing`);
    continue;
  }
  const text = readText(scanPath);
  for (const rule of source.stale_status_checks.forbidden_patterns) {
    const pattern = new RegExp(rule.pattern, "i");
    if (pattern.test(text)) {
      findings.push(`${scanPath}: ${rule.id} (${rule.reason})`);
    }
  }
}

const currentMain = optionalGitRef("origin/main") || optionalGitRef("main") || optionalGitRef("HEAD");
const recordedMain = source.current_pointers.current_main_commit;
if (
  currentMain &&
  recordedMain !== currentMain &&
  !isAllowedMainPointerSuccessor(recordedMain, currentMain)
) {
  findings.push(`docs/navigation/navigation-source.json: current_main_commit is ${source.current_pointers.current_main_commit}, expected ${currentMain}`);
}

const commitEvidence = readText("docs/release/commit-pr-evidence.md");
if (!commitEvidence.includes(source.current_pointers.current_main_commit)) {
  findings.push("docs/release/commit-pr-evidence.md: missing current main merge commit");
}
if (!commitEvidence.includes("Merge status: `merged`")) {
  findings.push("docs/release/commit-pr-evidence.md: merge status must be `merged`");
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`ERROR: ${finding}`);
  }
  process.exit(1);
}

console.log("document stale status validation passed");
