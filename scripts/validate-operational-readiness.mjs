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

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

const manifestPath = "docs/architecture/observability/operational-readiness-manifest.json";
const manifest = readJson(manifestPath);
const schema = readJson("schemas/operational-readiness-manifest.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateManifest = ajv.compile(schema);
if (!validateManifest(manifest)) {
  console.error(JSON.stringify(validateManifest.errors, null, 2));
  fail("operational readiness manifest does not match schema");
}

for (const relativePath of [
  manifest.checklist_path,
  manifest.runbook_path,
  manifest.trace_contract_path,
  manifest.rollback_path.evidence_path,
  manifest.incident_to_backlog.evidence_path,
]) {
  requireFile(relativePath);
}

for (const condition of manifest.required_conditions) {
  requireFile(condition.evidence_path);
}

const requiredConditionIds = new Set([
  "trace-spans",
  "quality-cost-latency-metrics",
  "failure-modes",
  "rollback-disable-path",
  "cost-latency-impact",
  "smoke-synthetic-check",
  "incident-to-backlog-loop",
]);
const actualConditionIds = new Set(manifest.required_conditions.map((condition) => condition.id));
for (const conditionId of requiredConditionIds) {
  if (!actualConditionIds.has(conditionId)) {
    fail(`missing operational readiness condition: ${conditionId}`);
  }
}

const checklist = readText(manifest.checklist_path);
for (const phrase of [
  "Trace spans",
  "Метрики качества",
  "Failure modes",
  "Rollback/disable path",
  "Cost/latency impact",
  "Smoke/synthetic check",
  "Incident-to-backlog loop",
]) {
  if (!checklist.includes(phrase)) {
    fail(`checklist is missing phrase: ${phrase}`);
  }
}

const runbook = readText(manifest.runbook_path);
for (const phrase of [
  "Smoke Check",
  "Failure Modes",
  "Rollback/Disable Path",
  "Incident-To-Backlog Loop",
  "Escalation",
]) {
  if (!runbook.includes(phrase)) {
    fail(`runbook is missing section: ${phrase}`);
  }
}

if (manifest.smoke_check.command !== "npm test") {
  fail("operational readiness smoke check must be npm test");
}

console.log("operational readiness validation passed");
