import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function requireFile(relativePath) {
  if (!fileExists(relativePath)) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const schema = readJson("schemas/pilot-execution-handoff.schema.json");
const handoff = readJson("docs/release/pilot-execution-handoff.json");
const validate = ajv.compile(schema);

if (!validate(handoff)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("pilot execution handoff does not match schema");
}

if (handoff.status !== "ready_for_pilot_run_after_real_uat") {
  fail("pilot execution handoff must remain a handoff, not pilot acceptance");
}

requireFile("docs/release/pilot-execution-handoff.md");

const entryById = new Map(handoff.entry_criteria.map((item) => [item.id, item]));
for (const requiredId of [
  "PILOT-HANDOFF-ENTRY-001",
  "PILOT-HANDOFF-ENTRY-002",
  "PILOT-HANDOFF-ENTRY-003",
  "PILOT-HANDOFF-ENTRY-004",
  "PILOT-HANDOFF-ENTRY-005",
  "PILOT-HANDOFF-ENTRY-006",
]) {
  if (!entryById.has(requiredId)) {
    fail(`pilot execution handoff is missing entry criterion: ${requiredId}`);
  }
}

for (const item of handoff.entry_criteria) {
  if (!item.blocking) {
    fail(`entry criterion must be blocking before pilot: ${item.id}`);
  }
  requireFile(item.evidence_path);
}

const outputPaths = new Set(handoff.required_outputs.map((item) => item.path));
for (const requiredOutput of [
  "docs/release/commit-pr-evidence.md",
  "docs/release/pilot-report.md",
  "docs/release/pilot-process-portability-notes.md",
  "docs/process/audits/plan-completion-audit.json",
  "docs/process/current/process-changelog.md",
]) {
  if (!outputPaths.has(requiredOutput)) {
    fail(`pilot execution handoff is missing required output: ${requiredOutput}`);
  }
}

const requiredCommands = [
  "npm run validate:pilot-execution-handoff",
  "npm run validate:pilot-evidence-recorder",
  "npm run validate:pilot-report-templates",
  "npm run validate:commit-pr-evidence-template",
  "npm run validate:pilot-gate",
  "npm run validate:process-portability",
  "npm run validate:plan-completion-audit",
  "npm test",
];
for (const command of requiredCommands) {
  if (!handoff.validation_commands.includes(command)) {
    fail(`pilot execution handoff is missing validation command: ${command}`);
  }
}

const guide = readText("docs/release/pilot-execution-handoff.md");
for (const requiredText of ["Entry Criteria", "Pilot Steps", "Required Outputs", "Templates", "Stop Conditions", "validate:pilot-gate", "validate:pilot-evidence-recorder", "npm run pilot:record", "docs/release/commit-pr-evidence.md", "docs/release/templates/pilot-report-template.md", "docs/release/templates/pilot-process-portability-notes-template.md", "docs/release/templates/commit-pr-evidence-template.md"]) {
  if (!guide.includes(requiredText)) {
    fail(`pilot execution guide is missing required text: ${requiredText}`);
  }
}

const completionAudit = readJson("docs/process/audits/plan-completion-audit.json");
if (!["blocked_pending_external", "complete"].includes(completionAudit.status)) {
  fail("completion audit must be blocked before pilot or complete after pilot evidence exists");
}
if (completionAudit.status === "blocked_pending_external" && !completionAudit.blocking_external_evidence.includes("docs/release/pilot-report.md")) {
  fail("blocked completion audit must keep pilot report as blocking external evidence");
}
if (completionAudit.status === "complete") {
  for (const outputPath of ["docs/release/pilot-report.md", "docs/release/pilot-process-portability-notes.md", "docs/release/commit-pr-evidence.md"]) {
    requireFile(outputPath);
  }
}

console.log("pilot execution handoff validation passed");
