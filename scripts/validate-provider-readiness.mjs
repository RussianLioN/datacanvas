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

const proc = readText("docs/process/change-requests/PROC-007-controlled-external-llm-provider.md");
const plan = readText("docs/architecture/llm/provider-integration-plan.md");
const allowlist = readText("docs/architecture/llm/provider-allowlist.yaml");
const structuredAllowlist = readJson("docs/architecture/llm/provider-allowlist.json");
const budget = readJson("docs/architecture/llm/provider-budget.json");
const providerAllowlistSchema = readJson("schemas/provider-allowlist.schema.json");
const providerBudgetSchema = readJson("schemas/provider-budget.schema.json");
const traceManifest = readJson("tests/golden/trace-manifest-minimal.json");
const traceContract = readText("docs/architecture/observability/trace-contract.md");
const packageJson = readJson("package.json");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateAllowlist = ajv.compile(providerAllowlistSchema);
if (!validateAllowlist(structuredAllowlist)) {
  console.error(JSON.stringify(validateAllowlist.errors, null, 2));
  fail("provider allowlist JSON does not match schema");
}

const validateBudget = ajv.compile(providerBudgetSchema);
if (!validateBudget(budget)) {
  console.error(JSON.stringify(validateBudget.errors, null, 2));
  fail("provider budget does not match schema");
}

for (const required of ["accepted_adr", "security_review", "provider_specific_eval_pack", "cost_latency_budget", "trace_evidence"]) {
  if (!allowlist.includes(required)) {
    fail(`provider allowlist is missing activation requirement: ${required}`);
  }
}

for (const forbidden of ["network_access: true", "status: enabled", "api_key", "token:", "secret:"]) {
  if (allowlist.toLowerCase().includes(forbidden)) {
    fail(`provider allowlist contains forbidden active/secret marker: ${forbidden}`);
  }
}

if (!allowlist.includes("status: disabled")) {
  fail("provider allowlist must keep provider disabled");
}

const provider = structuredAllowlist.providers[0];
if (provider.status !== "disabled" || provider.network_access !== false) {
  fail("structured provider allowlist must keep provider disabled and offline");
}

if (provider.fallback !== "scripts/llm-mock-adapter.mjs") {
  fail("structured provider allowlist is missing offline mock fallback");
}

if (!plan.includes("scripts/llm-mock-adapter.mjs")) {
  fail("provider plan is missing offline mock fallback");
}

if (!proc.includes("Статус решения: draft")) {
  fail("PROC-007 must remain draft until team acceptance");
}

if (budget.default_policy !== "disabled_until_proc_007_accepted") {
  fail("provider budget must keep provider disabled until PROC-007 is accepted");
}

const requiredMeasurements = ["cost_estimate", "duration_ms", "model", "provider", "retry_count", "error_class"];
for (const field of requiredMeasurements) {
  if (!budget.measurement_requirements.includes(field)) {
    fail(`provider budget is missing measurement requirement: ${field}`);
  }
}

if (budget.budgets.max_cost_per_run_usd <= 0 || budget.budgets.max_latency_ms_p95 <= 0) {
  fail("provider budget must define positive cost and latency limits");
}

for (const traceField of ["provider", "retry_count", "cost_estimate", "duration_ms", "model", "error_class"]) {
  if (!traceContract.includes(traceField)) {
    fail(`trace contract is missing provider readiness field: ${traceField}`);
  }
}

const modelCallSpan = traceManifest.spans.find((span) => span.name === "model_call");
if (!modelCallSpan) {
  fail("trace manifest is missing model_call span");
}

if (modelCallSpan.status !== "skipped" || modelCallSpan.provider !== "local" || modelCallSpan.model !== "offline_mock_adapter") {
  fail("trace manifest model_call span must show local offline fallback while external provider is disabled");
}

const scripts = Object.values(packageJson.scripts ?? {}).join("\n");
if (/\b(curl|wget|ssh|scp|rsync|http:|https:)\b/.test(scripts)) {
  fail("npm scripts include network-capable commands before provider readiness is accepted");
}

console.log("provider readiness validation passed");
