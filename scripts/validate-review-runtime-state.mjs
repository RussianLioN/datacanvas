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

const statePath = "docs/product/ux/review-runtime-state-fixture.json";
const schema = readJson("schemas/review-runtime-state.schema.json");
const state = readJson(statePath);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(state)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("review runtime state does not match schema");
}

requireFile(state.review_flow_path);
requireFile(state.review_ui_fixture_path);
requireFile(state.session_artifact_path);
for (const evidencePath of state.evidence_paths) {
  requireFile(evidencePath);
}

const flow = readJson(state.review_flow_path);
const session = readJson(state.session_artifact_path);
const allowedTransitions = new Map();
for (const transition of flow.transitions) {
  const key = `${transition.from}:${transition.action}:${transition.to}`;
  allowedTransitions.set(key, new Set(transition.allowed_roles));
}

const eventIds = new Set();
for (const event of state.transition_history) {
  if (eventIds.has(event.event_id)) {
    fail(`duplicate transition event id: ${event.event_id}`);
  }
  eventIds.add(event.event_id);

  const key = `${event.from}:${event.action}:${event.to}`;
  const allowedRoles = allowedTransitions.get(key);
  if (!allowedRoles) {
    fail(`transition is not defined in human review flow: ${key}`);
  }
  if (!allowedRoles.has(event.role)) {
    fail(`role ${event.role} is not allowed for transition: ${key}`);
  }
  if (event.action === "export" && event.from !== "approved") {
    fail("export transition must start from approved state");
  }
}

const lastEvent = state.transition_history[state.transition_history.length - 1];
if (state.current_state !== lastEvent.to) {
  fail("current_state must match the target state of the last transition");
}

if (state.export_allowed !== (state.current_state === "approved")) {
  fail("export_allowed must be true only when current_state is approved");
}

if (session.review_state !== state.current_state) {
  fail("runtime state current_state must match human review session review_state");
}

const requiredPersistedFields = ["state_id", "current_state", "export_allowed", "transition_history", "actor_id", "role", "timestamp", "reason"];
for (const field of requiredPersistedFields) {
  if (!state.persisted_fields.includes(field)) {
    fail(`review runtime state is missing persisted field: ${field}`);
  }
}

console.log("review runtime state validation passed");
