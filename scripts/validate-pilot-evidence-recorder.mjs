import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const recorderPath = "scripts/record-pilot-evidence.mjs";
if (!exists(recorderPath)) {
  fail(`pilot evidence recorder is missing: ${recorderPath}`);
}

const recorder = readText(recorderPath);
for (const requiredText of [
  "--pilot-owner",
  "--release-owner",
  "--reviewer",
  "--target-reuse-context",
  "--release-record",
  "--follow-up",
  "--dry-run",
  "docs/release/pilot-report.md",
  "docs/release/pilot-process-portability-notes.md",
  "docs/release/commit-pr-evidence.md",
  "npm test",
  "validate:pilot-gate",
  "validate:process-portability",
  "validate:plan-completion-audit",
  "recorded_real_user",
  "fixture|template|sample|placeholder",
  "refusing to overwrite existing pilot evidence",
]) {
  if (!recorder.includes(requiredText)) {
    fail(`pilot evidence recorder is missing required text: ${requiredText}`);
  }
}

const packageJson = readJson("package.json");
if (packageJson.scripts["pilot:record"] !== "node scripts/record-pilot-evidence.mjs") {
  fail("package.json is missing pilot:record script");
}
if (packageJson.scripts["validate:pilot-evidence-recorder"] !== "node scripts/validate-pilot-evidence-recorder.mjs") {
  fail("package.json is missing validate:pilot-evidence-recorder script");
}
if (!packageJson.scripts.test.includes("npm run validate:pilot-evidence-recorder")) {
  fail("npm test must include validate:pilot-evidence-recorder");
}

const handoffJson = readJson("docs/release/pilot-execution-handoff.json");
if (!handoffJson.validation_commands.includes("npm run validate:pilot-evidence-recorder")) {
  fail("pilot execution handoff must include recorder validation command");
}
if (!handoffJson.pilot_steps.some((step) => step.action.includes("npm run pilot:record"))) {
  fail("pilot execution handoff must include pilot:record step");
}
if (!handoffJson.required_outputs.some((output) => output.path === "docs/release/commit-pr-evidence.md")) {
  fail("pilot execution handoff must include commit/PR evidence output path");
}

const handoffMd = readText("docs/release/pilot-execution-handoff.md");
for (const requiredText of [
  "npm run pilot:record",
  "docs/release/commit-pr-evidence.md",
  "validate:pilot-evidence-recorder",
]) {
  if (!handoffMd.includes(requiredText)) {
    fail(`pilot execution handoff md is missing required text: ${requiredText}`);
  }
}

const readiness = readJson("docs/process/audits/external-evidence-readiness.json");
for (const blocker of readiness.blockers) {
  if (!blocker.supporting_artifacts.includes(recorderPath)) {
    fail(`external evidence blocker must reference recorder support: ${blocker.blocking_evidence}`);
  }
  if (!blocker.dry_run_commands.some((command) => command.includes("npm run pilot:record -- --dry-run"))) {
    fail(`external evidence blocker must include recorder dry-run command: ${blocker.blocking_evidence}`);
  }
  if (!blocker.write_commands.some((command) => command.includes("npm run pilot:record --"))) {
    fail(`external evidence blocker must include recorder write command: ${blocker.blocking_evidence}`);
  }
}

const readinessMd = readText("docs/process/audits/external-evidence-readiness.md");
for (const requiredText of [
  "npm run pilot:record",
  "docs/release/commit-pr-evidence.md",
  "dry-run",
]) {
  if (!readinessMd.includes(requiredText)) {
    fail(`external evidence readiness dashboard is missing required text: ${requiredText}`);
  }
}

for (const forbiddenOutput of [
  "docs/release/pilot-report.md",
  "docs/release/pilot-process-portability-notes.md",
  "docs/release/commit-pr-evidence.md",
]) {
  if (exists(forbiddenOutput)) {
    fail(`pilot evidence output exists before pilot acceptance: ${forbiddenOutput}`);
  }
}

console.log("pilot evidence recorder validation passed");
