import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const schemaPath = "schemas/revision-approval-state.schema.json";
const statePath = "docs/product/revisions/co-2026-001-source-revision/revision-approval-state.json";

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    throw new Error(`required file is missing: ${relativePath}`);
  }
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

try {
  requireFile(schemaPath);
  requireFile(statePath);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);

  const validate = ajv.compile(readJson(schemaPath));
  const state = readJson(statePath);
  if (!validate(state)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${statePath} does not match ${schemaPath}`);
  }

  for (const requiredPath of [state.change_set_path, state.log_path, state.ledger_path, state.source_registry_path]) {
    requireFile(requiredPath);
  }

  const changeSet = readJson(state.change_set_path);
  const knownEditIds = new Set(changeSet.proposed_edits.map((edit) => edit.edit_id));
  if (!knownEditIds.has(state.current_edit.edit_id)) {
    throw new Error(`current edit is missing from proposed change set: ${state.current_edit.edit_id}`);
  }

  const statusByEdit = new Map();
  for (const item of state.edit_statuses) {
    if (statusByEdit.has(item.edit_id)) {
      throw new Error(`duplicate edit status: ${item.edit_id}`);
    }
    statusByEdit.set(item.edit_id, item);
    if (!knownEditIds.has(item.edit_id)) {
      throw new Error(`state references unknown edit: ${item.edit_id}`);
    }
  }

  for (const editId of knownEditIds) {
    if (!statusByEdit.has(editId)) {
      throw new Error(`state is missing status for edit: ${editId}`);
    }
  }

  if (state.status === "paused" && !state.paused_at) {
    throw new Error("paused revision must have paused_at");
  }
  if (state.status === "completed" && !state.completed_at) {
    throw new Error("completed revision must have completed_at");
  }

  const currentStatus = statusByEdit.get(state.current_edit.edit_id);
  if (state.current_edit.state === "next" && currentStatus.status !== "pending") {
    throw new Error(`current next edit must be pending: ${state.current_edit.edit_id}`);
  }

  const log = readText(state.log_path);
  if (!log.includes(state.current_edit.edit_id)) {
    throw new Error(`revision log does not mention current edit: ${state.current_edit.edit_id}`);
  }

  console.log("revision approval state validation passed");
} catch (error) {
  fail(error.message);
}
