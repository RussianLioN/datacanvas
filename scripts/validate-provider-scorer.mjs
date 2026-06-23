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

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const riskSchema = readJson("schemas/risk-registry.schema.json");
const riskRegistry = readJson("docs/architecture/risks/risk-registry.json");
const resultSchema = readJson("schemas/provider-experiment-result.schema.json");
const scoredResult = readJson("tests/provider/provider-experiment-result-scored.json");
const rollbackResult = readJson("tests/provider/provider-experiment-result-rollback.json");
const securityRollbackResult = readJson("tests/provider/provider-experiment-result-security-rollback.json");
const costRollbackResult = readJson("tests/provider/provider-experiment-result-cost-rollback.json");
const latencyRollbackResult = readJson("tests/provider/provider-experiment-result-latency-rollback.json");
const failureRollbackResult = readJson("tests/provider/provider-experiment-result-failure-rollback.json");
const delta = readJson("tests/evals/provider-specific-eval-delta.json");
const traceability = readJson("docs/product/requirements/traceability-matrix.json");
const riskTraceability = readJson("docs/architecture/risks/risk-traceability.json");
const nfrText = readText("docs/product/requirements/non-functional-requirements.md");

const validateRiskRegistry = ajv.compile(riskSchema);
if (!validateRiskRegistry(riskRegistry)) {
  console.error(JSON.stringify(validateRiskRegistry.errors, null, 2));
  fail("risk registry does not match schema");
}

const validateResult = ajv.compile(resultSchema);
if (!validateResult(scoredResult)) {
  console.error(JSON.stringify(validateResult.errors, null, 2));
  fail("scored provider experiment result does not match schema");
}

if (!validateResult(rollbackResult)) {
  console.error(JSON.stringify(validateResult.errors, null, 2));
  fail("rollback provider experiment result does not match schema");
}

for (const [label, result] of [
  ["security", securityRollbackResult],
  ["cost", costRollbackResult],
  ["latency", latencyRollbackResult],
  ["failure", failureRollbackResult],
]) {
  if (!validateResult(result)) {
    console.error(JSON.stringify(validateResult.errors, null, 2));
    fail(`${label} rollback provider experiment result does not match schema`);
  }
}

const riskIds = new Set(riskRegistry.risks.map((risk) => risk.id));
for (const testCase of delta.cases) {
  if (!riskIds.has(testCase.linked_risk)) {
    fail(`provider eval case references unknown risk: ${testCase.linked_risk}`);
  }
}

if (scoredResult.status !== "completed") {
  fail("scored provider result must be completed");
}

if (scoredResult.metrics.quality_score < 0.9) {
  fail("scored provider result does not meet quality threshold");
}

if (scoredResult.decision !== "accept") {
  fail("offline scorer fixture should accept the frozen mock output");
}

if (!scoredResult.known_limitations.some((item) => item.includes("frozen output"))) {
  fail("scored result must state that it is based on offline mock output");
}

if (rollbackResult.decision !== "rollback") {
  fail("negative scorer fixture should produce rollback decision");
}

if (rollbackResult.metrics.quality_score >= 0.9) {
  fail("negative scorer fixture must stay below quality threshold");
}

for (const [label, result] of [
  ["security", securityRollbackResult],
  ["cost", costRollbackResult],
  ["latency", latencyRollbackResult],
  ["failure", failureRollbackResult],
]) {
  if (result.decision !== "rollback" || result.metrics.quality_score >= 0.9) {
    fail(`${label} scorer fixture should produce rollback decision below threshold`);
  }
}

const traceText = JSON.stringify(traceability);
for (const risk of riskRegistry.risks) {
  if (!traceText.includes(risk.id)) {
    fail(`risk registry item is missing from traceability matrix: ${risk.id}`);
  }
}

for (const nfrId of ["NFR-001", "NFR-003", "NFR-004"]) {
  if (!nfrText.includes(nfrId)) {
    fail(`NFR document is missing required risk-linked NFR: ${nfrId}`);
  }
}

const riskTraceabilityIds = new Set(riskTraceability.links.map((link) => link.risk_id));
const traceabilityByRequirement = new Map(traceability.links.map((link) => [link.requirement_id, link]));
for (const risk of riskRegistry.risks) {
  if (!riskTraceabilityIds.has(risk.id)) {
    fail(`risk registry item is missing from typed risk traceability: ${risk.id}`);
  }
}

for (const link of riskTraceability.links) {
  for (const requirementId of link.traceability_requirement_ids) {
    const traceabilityLink = traceabilityByRequirement.get(requirementId);
    if (!traceabilityLink) {
      fail(`risk traceability references missing traceability requirement: ${requirementId}`);
    }

    if (!traceabilityLink.risks?.includes(link.risk_id)) {
      fail(`traceability matrix does not link ${requirementId} to risk ${link.risk_id}`);
    }
  }

  for (const evidencePath of link.evidence_paths) {
    if (!fs.existsSync(path.join(root, evidencePath))) {
      fail(`risk traceability evidence path does not exist: ${evidencePath}`);
    }
  }
}

console.log("provider scorer validation passed");
