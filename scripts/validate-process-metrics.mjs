import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

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

const manifestPath = "docs/process/current/process-metrics-manifest.json";
const manifest = readJson(manifestPath);
const schema = readJson("schemas/process-metrics-manifest.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("process metrics manifest does not match schema");
}

requireFile(manifest.dashboard_path);
for (const metric of manifest.metrics) {
  if (metric.measurement_status === "not_available" && metric.value !== "n/a") {
    fail(`not_available metric must have value n/a: ${metric.id}`);
  }
  if (metric.measurement_status !== "not_available" && metric.value === "n/a") {
    fail(`available metric must not have value n/a: ${metric.id}`);
  }
  for (const evidencePath of metric.evidence_paths) {
    requireFile(evidencePath);
  }
}

const requiredMetricIds = new Set(["MET-001", "MET-002", "MET-003", "MET-004", "MET-005", "MET-006", "MET-007", "MET-008"]);
const actualMetricIds = new Set(manifest.metrics.map((metric) => metric.id));
for (const metricId of requiredMetricIds) {
  if (!actualMetricIds.has(metricId)) {
    fail(`process metrics manifest is missing metric: ${metricId}`);
  }
}

const requiredCommands = new Set([
  "npm test",
  "npm run validate:bootstrap",
  "npm run validate:schemas",
  "npm run validate:artifact-registry",
  "npm run validate:artifact-hashes",
]);
const actualCommands = new Set(manifest.quality_gates.map((gate) => gate.command));
for (const command of requiredCommands) {
  if (!actualCommands.has(command)) {
    fail(`process metrics manifest is missing quality gate: ${command}`);
  }
}

const realUatGate = manifest.quality_gates.find((gate) => gate.command === "real user UAT session");
if (!realUatGate || realUatGate.status !== "pending_external") {
  fail("real user UAT session must remain pending_external until real evidence exists");
}

requireFile("docs/process/current/process-event-log.json");
const eventLog = readJson("docs/process/current/process-event-log.json");
const liveMetricIds = new Set(["MET-001", "MET-002", "MET-003", "MET-004", "MET-005", "MET-007"]);
if (eventLog.events.length === 0) {
  for (const metric of manifest.metrics) {
    if (liveMetricIds.has(metric.id) && (metric.measurement_status !== "not_available" || metric.value !== "n/a")) {
      fail(`live delivery metric must remain n/a without process events: ${metric.id}`);
    }
  }
}

const dashboard = readText(manifest.dashboard_path);
for (const metric of manifest.metrics) {
  if (!dashboard.includes(metric.name)) {
    fail(`dashboard markdown is missing metric name: ${metric.name}`);
  }
}

console.log("process metrics validation passed");
