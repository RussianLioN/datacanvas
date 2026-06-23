import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const templatePath = "docs/release/templates/commit-pr-evidence-template.md";
if (!exists(templatePath)) {
  fail(`template does not exist: ${templatePath}`);
}

const text = readText(templatePath);
for (const requiredText of [
  "Статус: template only",
  "Commit Evidence",
  "Pull Request Evidence",
  "Required Verification",
  "git rev-parse HEAD",
  "git status --short --branch",
  "npm test",
  "TO_BE_FILLED_AFTER_COMMIT",
]) {
  if (!text.includes(requiredText)) {
    fail(`commit/PR evidence template is missing required text: ${requiredText}`);
  }
}

if (/status:\s*(accepted|complete|met|captured)/i.test(text)) {
  fail("commit/PR evidence template must not claim accepted/complete/met/captured status");
}

const releasePack = JSON.parse(readText("docs/release/mvp-release-evidence-pack.json"));
const commitEvidencePath = "docs/release/commit-pr-evidence.md";
if (exists(commitEvidencePath)) {
  const evidenceText = readText(commitEvidencePath);
  for (const requiredText of ["Статус: recorded release evidence", "Commit SHA:", "PR URL or identifier:", "CI status: `passed`", "npm test: passed"]) {
    if (!evidenceText.includes(requiredText)) {
      fail(`commit/PR evidence is missing required text: ${requiredText}`);
    }
  }
  if (releasePack.commit_sha.status !== "captured") {
    fail("release evidence pack must capture commit SHA after commit evidence exists");
  }
} else if (releasePack.commit_sha.status !== "pending_until_commit") {
  fail("release evidence pack must keep commit SHA pending until real commit evidence exists");
}

const pilotHandoff = readText("docs/release/pilot-execution-handoff.md");
if (!pilotHandoff.includes(templatePath)) {
  fail("pilot execution handoff must reference commit/PR evidence template");
}

const completionAudit = JSON.parse(readText("docs/process/audits/plan-completion-audit.json"));
if (exists(commitEvidencePath)) {
  if (completionAudit.blocking_external_evidence.includes("commit-sha-and-pr-evidence")) {
    fail("completion audit must not keep commit-sha-and-pr-evidence blocking after evidence exists");
  }
} else if (!completionAudit.blocking_external_evidence.includes("commit-sha-and-pr-evidence")) {
  fail("completion audit must keep commit-sha-and-pr-evidence as blocking external evidence");
}

console.log("commit/PR evidence template validation passed");
