import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const schemaPath = "schemas/product-change-questionnaire-state.schema.json";
const defaultStatePath = "docs/product/change-orders/co-2026-001-acceptance-questionnaire-state.json";
const statePath = process.argv[2] ?? defaultStatePath;

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
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

function collectStringValues(value) {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStringValues);
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStringValues);
  }
  return [];
}

function validateSafeInterviewData(state) {
  if (state.mode !== "product_owner_interview") {
    return;
  }

  const log = fs.readFileSync(absolute(state.artifact_paths.log_path), "utf8");
  for (const [location, values] of [
    ["interview log", [log]],
    ["interview state", collectStringValues(state)],
  ]) {
    for (const value of values) {
      if (value.includes("@")) {
        fail(`${location} must not contain email addresses`);
      }
      if (/\b(?:payload|session_id|user_id)\s*[:=]\s*\S/i.test(value)) {
        fail(`${location} must not contain raw request or identity values`);
      }
    }
  }
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

  for (const artifactPath of Object.values(state.artifact_paths)) {
    requireFile(artifactPath);
  }
  validateSafeInterviewData(state);

  const answered = new Set(state.answered_questions.map((question) => question.question_id));
  if (answered.has(state.current_question.question_id)) {
    fail(`current question is already answered: ${state.current_question.question_id}`);
  }

  if (state.status === "paused" && !state.paused_at) {
    fail("paused questionnaire must have paused_at");
  }

  if (state.status === "completed" && !state.completed_at) {
    fail("completed questionnaire must have completed_at");
  }
  if (state.status === "completed") {
    const latestAnswer = Math.max(...state.answered_questions.map((question) => Date.parse(question.answered_at)));
    if (!Number.isFinite(latestAnswer) || Date.parse(state.completed_at) < latestAnswer) {
      fail("completed questionnaire must not precede its latest answer");
    }
  }

  const expectedNextStop = state.periodic_stop.last_stop_after_answer_count + state.save_policy.pause_every_answers;
  if (state.periodic_stop.next_stop_after_answer_count !== expectedNextStop) {
    fail("next periodic stop does not match save policy");
  }

  console.log("product change questionnaire state validation passed");
} catch (error) {
  fail(error.message);
}
