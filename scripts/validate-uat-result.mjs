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

const resultPath = "docs/product/ux/uat-result-minimal.json";
const result = readJson(resultPath);
const manifest = readJson(result.manifest_path);
const schema = readJson("schemas/uat-result.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateResult = ajv.compile(schema);
if (!validateResult(result)) {
  console.error(JSON.stringify(validateResult.errors, null, 2));
  fail("UAT result does not match schema");
}

for (const evidencePath of result.evidence_paths) {
  requireFile(evidencePath);
}

const expectedScenarios = new Set(manifest.scenario_ids);
const actualScenarios = new Set(result.scenario_results.map((scenario) => scenario.scenario_id));
for (const scenarioId of expectedScenarios) {
  if (!actualScenarios.has(scenarioId)) {
    fail(`UAT result is missing scenario: ${scenarioId}`);
  }
}

if (result.scenario_results.some((scenario) => scenario.status !== "passed")) {
  fail("UAT result contains non-passed scenarios");
}

if (result.metrics.critical_failures !== manifest.acceptance_thresholds.critical_failures) {
  fail("UAT result critical failures do not match threshold");
}

if (result.metrics.unsupported_claims !== manifest.acceptance_thresholds.unsupported_claims) {
  fail("UAT result unsupported claims do not match threshold");
}

if (result.metrics.export_blockers !== manifest.acceptance_thresholds.export_blockers) {
  fail("UAT result export blockers do not match threshold");
}

if (manifest.acceptance_thresholds.review_completion === "required" && !result.metrics.review_completion) {
  fail("UAT result must complete review");
}

if (result.review_state !== "approved" || result.decision !== "accepted") {
  fail("UAT result must be approved and accepted");
}

console.log("UAT result validation passed");
