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

const schema = readJson("schemas/provider-experiment-result.schema.json");
const result = readJson("docs/architecture/llm/provider-experiment-result-template.json");
const allowlist = readJson("docs/architecture/llm/provider-allowlist.json");
const budget = readJson("docs/architecture/llm/provider-budget.json");
const experiment = readText("docs/process/experiments/EXP-001-controlled-llm-provider.md");
const proc = readText("docs/process/change-requests/PROC-007-controlled-external-llm-provider.md");
const packageJson = readJson("package.json");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validate = ajv.compile(schema);
if (!validate(result)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("provider experiment result template does not match schema");
}

const provider = allowlist.providers.find((candidate) => candidate.id === result.provider_id);
if (!provider) {
  fail(`provider experiment references unknown provider_id: ${result.provider_id}`);
}

if (provider.status !== "disabled" || provider.network_access !== false) {
  fail("provider experiment must not activate network access before PROC-007 is accepted");
}

if (result.linked_proc_id !== "PROC-007") {
  fail("provider experiment must be linked to PROC-007");
}

if (result.status !== "planned" || result.decision !== "not_started") {
  fail("provider experiment template must remain planned/not_started before team acceptance");
}

if (!result.rollback.available || result.rollback.fallback_command !== budget.fallback.command) {
  fail("provider experiment rollback must be available and match provider budget fallback");
}

for (const requiredMetric of ["quality_score", "cost_per_run_usd", "latency_ms_p95", "failure_rate_percent"]) {
  if (!(requiredMetric in result.metrics)) {
    fail(`provider experiment result is missing metric: ${requiredMetric}`);
  }
}

for (const evidencePath of [...result.quality_evidence, ...result.security_evidence]) {
  if (!fs.existsSync(path.join(root, evidencePath))) {
    fail(`provider experiment evidence path does not exist: ${evidencePath}`);
  }
}

if (!experiment.includes("До принятия `PROC-007` эксперимент не запускается")) {
  fail("provider experiment template must explicitly block execution before PROC-007 acceptance");
}

if (!proc.includes("Статус решения: draft")) {
  fail("PROC-007 must remain draft while provider experiment is only planned");
}

const scripts = Object.values(packageJson.scripts ?? {}).join("\n");
if (/\b(curl|wget|ssh|scp|rsync|http:|https:)\b/.test(scripts)) {
  fail("npm scripts include network-capable commands before provider experiment approval");
}

console.log("provider experiment validation passed");
