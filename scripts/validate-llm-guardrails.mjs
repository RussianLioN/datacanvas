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

const llmResultSchema = readJson("schemas/llm-result.schema.json");
const presentationSpecSchema = readJson("schemas/presentation-spec.schema.json");
const validateLlmResult = ajv.compile(llmResultSchema);
const validatePresentationSpec = ajv.compile(presentationSpecSchema);

const request = readJson("tests/fixtures/llm-request-minimal.json");
const normalized = readJson("tests/golden/normalized-data-minimal.json");
const result = readJson("tests/golden/llm-result-minimal.json");
const unsupportedResult = readJson("tests/fixtures/llm-result-unsupported-claim.json");
const toolAllowlist = readText("docs/architecture/security/tool-allowlist.yaml");
const packageJson = readJson("package.json");

for (const forbidden of ["upstream instructions", "raw traces", "secrets"]) {
  if (!request.forbidden_inputs?.includes(forbidden)) {
    fail(`LLM request does not block forbidden input: ${forbidden}`);
  }
}

function validateResultShape(candidate, label) {
  if (!validateLlmResult(candidate)) {
    console.error(JSON.stringify(validateLlmResult.errors, null, 2));
    fail(`${label} does not match LLMResult schema`);
  }

  if (candidate.status === "passed") {
    if (!validatePresentationSpec(candidate.presentation_spec)) {
      console.error(JSON.stringify(validatePresentationSpec.errors, null, 2));
      fail(`${label} contains an invalid PresentationSpec`);
    }
  }
}

function assertSupportedClaims(candidate, label) {
  const factIds = new Set(normalized.facts.map((fact) => fact.fact_id));
  const missing = candidate.presentation_spec.slides.flatMap((slide) =>
    slide.claims.flatMap((claim) => claim.fact_ids.filter((factId) => !factIds.has(factId))),
  );

  if (missing.length > 0) {
    fail(`${label} references unsupported facts: ${missing.join(", ")}`);
  }
}

function hasUnsupportedClaims(candidate) {
  const factIds = new Set(normalized.facts.map((fact) => fact.fact_id));
  return candidate.presentation_spec.slides.some((slide) =>
    slide.claims.some((claim) => claim.fact_ids.some((factId) => !factIds.has(factId))),
  );
}

validateResultShape(result, "tests/golden/llm-result-minimal.json");
assertSupportedClaims(result, "tests/golden/llm-result-minimal.json");

validateResultShape(unsupportedResult, "tests/fixtures/llm-result-unsupported-claim.json");
if (!hasUnsupportedClaims(unsupportedResult)) {
  fail("negative unsupported-claim fixture is not actually negative");
}

if (!toolAllowlist.includes("default_policy: deny")) {
  fail("tool allowlist does not declare default deny policy");
}

const networkAllowedLines = toolAllowlist
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line === "network_access: true");

if (networkAllowedLines.length > 0) {
  fail("tool allowlist enables network access by default");
}

const scriptText = Object.values(packageJson.scripts ?? {}).join("\n");
if (/\b(curl|wget|ssh|scp|rsync|http:|https:)\b/.test(scriptText)) {
  fail("package scripts include network-capable commands without an explicit process change");
}

console.log("llm guardrail validation passed");
