import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const policyPath = "docs/process/methodology/documentation-methodology-policy.json";
const schemaPath = "schemas/documentation-methodology-policy.schema.json";

const expectedLifecycle = [
  "idea",
  "discovery",
  "business_analysis",
  "system_analysis",
  "architecture",
  "backlog",
  "delivery",
  "testing",
  "release",
  "operations",
  "change_management",
];

const expectedTraceability = [
  "business_need",
  "business_requirement",
  "stakeholder_requirement",
  "system_requirement",
  "backlog_item",
  "acceptance_criterion",
  "test_case",
  "release_evidence",
  "telemetry_signal",
];

const requiredArtifactTypes = new Set([
  "business_requirements",
  "system_analysis",
  "backlog_mapping",
  "acceptance_and_tests",
  "release_and_operations",
  "ai_agent_governance",
]);

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    fail(`required file is missing: ${relativePath}`);
  }
}

function assertSameArray(actual, expected, label) {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(`${label} mismatch: expected ${expected.join(" -> ")}, got ${actual.join(" -> ")}`);
  }
}

requireFile(policyPath);
requireFile(schemaPath);

const policy = readJson(policyPath);
const schema = readJson(schemaPath);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(policy)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail(`${policyPath} does not match ${schemaPath}`);
}

for (const linkedPath of [policy.source_methodology.summary_path, policy.source_methodology.policy_path]) {
  requireFile(linkedPath);
}

assertSameArray(policy.lifecycle_policy, expectedLifecycle, "lifecycle policy");
assertSameArray(policy.traceability_policy.chain, expectedTraceability, "traceability chain");

const artifactTypes = new Set(policy.artifact_policy.map((item) => item.artifact_type));
for (const requiredType of requiredArtifactTypes) {
  if (!artifactTypes.has(requiredType)) {
    fail(`artifact policy is missing required type: ${requiredType}`);
  }
}

for (const gate of ["business_analysis", "system_analysis", "ai_agent", "delivery_release", "operations"]) {
  if (!Array.isArray(policy.quality_gate_policy[gate]) || policy.quality_gate_policy[gate].length < 3) {
    fail(`quality gate is too weak: ${gate}`);
  }
}

if (!policy.agent_governance.requires_human_confirmation.includes("change_product_backlog_priority")) {
  fail("backlog priority changes must require human confirmation");
}

if (policy.agent_governance.allowed_without_confirmation.includes("change_product_backlog_priority")) {
  fail("backlog priority changes cannot be allowed without confirmation");
}

const methodologyText = readText(policy.source_methodology.policy_path);
for (const requiredText of [
  "Backlog не подменяет анализ",
  "business need",
  "AI-Агентные Решения",
  "Возобновление Остановленного Интервью",
]) {
  if (!methodologyText.includes(requiredText)) {
    fail(`methodology document is missing required text: ${requiredText}`);
  }
}

const processBacklog = readText("docs/process/current/process-backlog.md");
if (!processBacklog.includes("PROC-039") || !processBacklog.includes("npm run validate:documentation-methodology")) {
  fail("process backlog must track PROC-039 with methodology validation");
}

console.log("documentation methodology validation passed");
