import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const auditPath = "docs/process/audits/plan-completion-audit.json";
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const schema = readJson("schemas/plan-completion-audit.schema.json");
const audit = readJson(auditPath);
const validate = ajv.compile(schema);

if (!validate(audit)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("plan completion audit does not match schema");
}

for (const requirement of audit.completion_requirements) {
  for (const evidencePath of requirement.evidence_paths) {
    if (!exists(evidencePath)) {
      fail(`${requirement.id} evidence path does not exist: ${evidencePath}`);
    }
  }

  if (requirement.status === "met" && requirement.missing_evidence.length > 0) {
    fail(`${requirement.id} is met but still lists missing evidence`);
  }

  if (requirement.status !== "met" && requirement.missing_evidence.length === 0) {
    fail(`${requirement.id} is not met but has no missing evidence`);
  }
}

const blockedRequirements = audit.completion_requirements.filter((item) => item.status !== "met");
const requirementById = new Map(audit.completion_requirements.map((item) => [item.id, item]));
const pilotRequirement = requirementById.get("DOD-010");
if (!pilotRequirement) {
  fail("completion audit must include DOD-010 pilot/process portability requirement");
}
if (!pilotRequirement.evidence_paths.includes("docs/release/pilot-execution-handoff.json")) {
  fail("DOD-010 must include pilot execution handoff as readiness evidence");
}

if (audit.status === "complete") {
  if (blockedRequirements.length > 0) {
    fail("completion audit cannot be complete while requirements are blocked or missing");
  }
  if (audit.blocking_external_evidence.length > 0) {
    fail("completion audit cannot be complete while blocking_external_evidence is not empty");
  }
}

if (audit.status === "blocked_pending_external") {
  if (blockedRequirements.length === 0) {
    fail("blocked audit must list at least one blocked requirement");
  }
  for (const evidencePath of audit.blocking_external_evidence) {
    if (evidencePath !== "commit-sha-and-pr-evidence" && exists(evidencePath)) {
      fail(`blocking external evidence exists but audit still marks it blocking: ${evidencePath}`);
    }
  }
}

console.log("plan completion audit validation passed");
