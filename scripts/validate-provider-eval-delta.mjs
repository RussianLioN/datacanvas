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

const schema = readJson("schemas/provider-specific-eval-delta.schema.json");
const delta = readJson("tests/evals/provider-specific-eval-delta.json");
const experimentResult = readJson("docs/architecture/llm/provider-experiment-result-template.json");
const allowlist = readJson("docs/architecture/llm/provider-allowlist.json");
const rubric = readText("docs/architecture/evals/provider-quality-scoring-rubric.md");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validate = ajv.compile(schema);
if (!validate(delta)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("provider-specific eval delta does not match schema");
}

const provider = allowlist.providers.find((candidate) => candidate.id === delta.provider_id);
if (!provider) {
  fail(`provider-specific eval delta references unknown provider_id: ${delta.provider_id}`);
}

if (delta.linked_experiment_id !== experimentResult.experiment_id) {
  fail("provider-specific eval delta is not linked to provider experiment result template");
}

const requiredTypes = new Set([
  "provider_quality",
  "provider_latency",
  "provider_cost",
  "provider_failure",
  "provider_security",
]);
const actualTypes = new Set(delta.cases.map((testCase) => testCase.type));

for (const type of requiredTypes) {
  if (!actualTypes.has(type)) {
    fail(`provider-specific eval delta is missing case type: ${type}`);
  }
}

const totalWeight = delta.cases.reduce((sum, testCase) => sum + testCase.score_weight, 0);
if (Math.abs(totalWeight - 1) > 0.000001) {
  fail(`provider-specific eval delta score weights must sum to 1, got ${totalWeight}`);
}

for (const rubricTerm of ["factuality: 0.40", "security: 0.30", "latency: 0.15", "cost: 0.10", "reliability: 0.05", "quality_score >= 0.90"]) {
  if (!rubric.includes(rubricTerm)) {
    fail(`quality scoring rubric is missing term: ${rubricTerm}`);
  }
}

if (!experimentResult.quality_evidence.includes("tests/evals/eval-cases.json")) {
  fail("provider experiment result template must retain base eval pack evidence");
}

console.log("provider eval delta validation passed");
