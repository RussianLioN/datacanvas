import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const snapshotPath = "docs/process/current/process-metrics-snapshot.json";
const snapshotReportPath = "docs/process/current/process-metrics-snapshot.md";

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

function listSprintFolders() {
  return fs
    .readdirSync(path.join(root, "docs/sprints"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join("docs/sprints", entry.name))
    .sort();
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const schema = readJson("schemas/process-metrics-snapshot.schema.json");
const snapshot = readJson(snapshotPath);
const validate = ajv.compile(schema);

if (!validate(snapshot)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("process metrics snapshot does not match schema");
}

requireFile(snapshotReportPath);
for (const sourcePath of snapshot.source_paths) {
  requireFile(sourcePath);
}
for (const metric of snapshot.derived_metrics) {
  for (const evidencePath of metric.evidence_paths) {
    requireFile(evidencePath);
  }
}

const metricsManifest = readJson("docs/process/current/process-metrics-manifest.json");
const processEventLog = readJson("docs/process/current/process-event-log.json");
const artifactRegistry = readJson("docs/architecture/schemas/artifact-registry.json");
const processChangeLedger = readJson("docs/process/current/process-change-ledger.json");
const sprintFolders = listSprintFolders();
const sprintEvidenceManifestPaths = sprintFolders
  .map((folder) => path.join(folder, "sprint-evidence-manifest.json"))
  .filter((relativePath) => fs.existsSync(path.join(root, relativePath)));
const sprintEvidenceManifests = sprintEvidenceManifestPaths.map(readJson);
const allChecks = sprintEvidenceManifests.flatMap((manifest) => manifest.checks ?? []);

const expected = {
  sprint_folders: sprintFolders.length,
  sprint_evidence_manifests: sprintEvidenceManifestPaths.length,
  artifact_registry_entries: artifactRegistry.artifacts.length,
  accepted_process_changes: processChangeLedger.entries.filter((entry) => entry.status === "accepted").length,
  passed_evidence_checks: allChecks.filter((check) => check.status === "passed").length,
  pending_evidence_checks: allChecks.filter((check) => check.status !== "passed").length,
  quality_gates_passed: metricsManifest.quality_gates.filter((gate) => gate.status === "passed").length,
  quality_gates_pending_external: metricsManifest.quality_gates.filter((gate) => gate.status === "pending_external").length,
  process_events: processEventLog.events.length
};

for (const [key, value] of Object.entries(expected)) {
  if (snapshot.counts[key] !== value) {
    fail(`snapshot count is stale for ${key}: expected ${value}, got ${snapshot.counts[key]}`);
  }
}

const metricValues = new Map(snapshot.derived_metrics.map((metric) => [metric.id, metric.value]));
if (metricValues.get("DPM-001") !== `${expected.sprint_evidence_manifests}/${expected.sprint_folders}`) {
  fail("DPM-001 sprint evidence coverage is stale");
}
if (metricValues.get("DPM-004") !== `${expected.passed_evidence_checks}/${allChecks.length}`) {
  fail("DPM-004 evidence check pass ratio is stale");
}
if (metricValues.get("DPM-006") !== String(expected.process_events)) {
  fail("DPM-006 process event count is stale");
}
if (!snapshot.known_limitations.some((item) => item.includes("командных timestamps"))) {
  fail("snapshot must keep live delivery timestamp limitation explicit");
}

const report = readText(snapshotReportPath);
for (const metric of snapshot.derived_metrics) {
  if (!report.includes(metric.name) || !report.includes(metric.value)) {
    fail(`snapshot report is missing metric: ${metric.id}`);
  }
}

console.log("process metrics snapshot validation passed");
