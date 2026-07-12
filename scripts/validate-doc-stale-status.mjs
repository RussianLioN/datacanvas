import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { isAllowedMainPointerSuccessor } from "./lib/doc-stale-status.mjs";

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

const mainPointerRefreshPaths = new Set([
  ".github/workflows/docs-check.yml",
  "README.md",
  "docs/README.md",
  "docs/architecture/schemas/artifact-hash-manifest.json",
  "docs/navigation/documentation-index.json",
  "docs/navigation/navigation-map.md",
  "docs/navigation/navigation-source.json",
  "docs/navigation/stale-status-report.md",
  "docs/process/current/process-metrics-snapshot.json",
  "docs/process/current/process-metrics-snapshot.md",
  "docs/process/methodology/README.md",
  "docs/process/methodology/ai-enabled-software-development-process-research.md",
  "docs/process/audits/plan-completion-audit.json",
  "docs/process/audits/plan-completion-audit.md",
  "docs/product/backlog/product-backlog.md",
  "docs/release/commit-pr-evidence.md",
  "docs/release/mvp-release-evidence-pack.json",
  "docs/release/mvp-release-evidence-pack.md",
  "docs/sprints/2026-W27-backlog-closure/evidence-index.md",
  "docs/sprints/2026-W27-backlog-closure/planning.md",
  "docs/sprints/2026-W27-backlog-closure/review.md",
  "docs/sprints/2026-W27-backlog-closure/sprint-backlog.md",
  "docs/sprints/2026-W27-backlog-closure/sprint-evidence-manifest.json",
  "docs/sprints/2026-W27-backlog-closure/sprint-goal.md",
  "docs/sprints/2026-W27-backlog-closure/sprint-summary.md",
  "scripts/generate-docs-navigation.mjs",
  "scripts/validate-doc-stale-status.mjs",
]);

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
const head = optionalGitRef("HEAD");
const recordedMain = source.current_pointers.current_main_commit;
if (
  currentMain &&
  recordedMain !== currentMain &&
  !isAllowedMainPointerSuccessor({
    root,
    pointerCommit: recordedMain,
    currentMainCommit: currentMain,
    headCommit: head,
    allowedPaths: mainPointerRefreshPaths,
  })
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
