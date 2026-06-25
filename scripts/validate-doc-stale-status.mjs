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

const currentMain = optionalGitRef("origin/main") || optionalGitRef("main");
if (currentMain && source.current_pointers.current_main_commit !== currentMain) {
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
