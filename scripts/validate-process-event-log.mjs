import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const eventLog = readJson("docs/process/current/process-event-log.json");
const eventLogSchema = readJson("schemas/process-event-log.schema.json");
const validate = ajv.compile(eventLogSchema);
if (!validate(eventLog)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("process event log does not match schema");
}

const eventTypeIds = new Set(eventLog.event_types.map((eventType) => eventType.id));
const requiredEventTypes = [
  "EVT-SPRINT-PLANNED",
  "EVT-SPRINT-REVIEWED",
  "EVT-BACKLOG-STARTED",
  "EVT-BACKLOG-ACCEPTED",
  "EVT-BLOCKED",
  "EVT-UNBLOCKED",
  "EVT-PCR-PROPOSED",
  "EVT-PCR-DECIDED",
  "EVT-DECISION-REQUESTED",
  "EVT-DECISION-ACCEPTED"
];

for (const eventTypeId of requiredEventTypes) {
  if (!eventTypeIds.has(eventTypeId)) {
    fail(`process event log is missing event type: ${eventTypeId}`);
  }
}

for (const event of eventLog.events) {
  if (!eventTypeIds.has(event.event_type_id)) {
    fail(`event references unknown event type: ${event.event_id}`);
  }
}

const metricsManifest = readJson("docs/process/current/process-metrics-manifest.json");
const metricById = new Map(metricsManifest.metrics.map((metric) => [metric.id, metric]));
for (const unlock of eventLog.derived_metric_unlocks) {
  if (!metricById.has(unlock.metric_id)) {
    fail(`event log references unknown metric: ${unlock.metric_id}`);
  }
  for (const eventTypeId of unlock.required_event_type_ids) {
    if (!eventTypeIds.has(eventTypeId)) {
      fail(`metric unlock references unknown event type: ${unlock.metric_id}/${eventTypeId}`);
    }
  }
  if (unlock.status === "ready_to_measure") {
    const actualTypes = new Set(eventLog.events.map((event) => event.event_type_id));
    for (const eventTypeId of unlock.required_event_type_ids) {
      if (!actualTypes.has(eventTypeId)) {
        fail(`metric unlock cannot be ready without event: ${unlock.metric_id}/${eventTypeId}`);
      }
    }
  }
}

const liveMetricIds = new Set(["MET-001", "MET-002", "MET-003", "MET-004", "MET-005", "MET-007"]);
if (eventLog.events.length === 0) {
  for (const metricId of liveMetricIds) {
    const metric = metricById.get(metricId);
    if (!metric || metric.measurement_status !== "not_available" || metric.value !== "n/a") {
      fail(`live metric must remain not_available without process events: ${metricId}`);
    }
  }
}

console.log("process event log validation passed");
