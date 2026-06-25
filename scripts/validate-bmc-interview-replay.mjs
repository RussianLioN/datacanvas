import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const statePath = "docs/product/bmc/interviews/2026-W26-bmc-interview-runtime-state.json";

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

function validateWithSchema(schemaPath, dataPath) {
  const validate = ajv.compile(readJson(schemaPath));
  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
  return data;
}

const state = validateWithSchema("schemas/bmc-interview-runtime-state.schema.json", statePath);
if (state.status !== "completed") {
  fail("replay fixture must use a completed runtime state");
}

const routeDecisions = validateWithSchema("schemas/bmc-route-decisions.schema.json", state.route_decisions_path);
const transcript = readText(state.transcript_path);

if (routeDecisions.decisions.length !== Math.max(0, state.answers.length - 1)) {
  fail("route decision count must match answer count minus initial question");
}

for (const answer of state.answers) {
  if (!transcript.includes(`Question ID: \`${answer.question_id}\``)) {
    fail(`transcript is missing question marker: ${answer.question_id}`);
  }
  if (!transcript.includes(`Answer ID: \`${answer.answer_id}\``)) {
    fail(`transcript is missing answer marker: ${answer.answer_id}`);
  }
}

const askedQuestions = new Set(state.asked_question_ids);
for (const decision of routeDecisions.decisions) {
  if (!askedQuestions.has(decision.previous_question_id)) {
    fail(`route decision previous question was not asked: ${decision.route_decision_id}`);
  }
  if (!askedQuestions.has(decision.selected_next_question_id)) {
    fail(`route decision selected next question was not asked: ${decision.route_decision_id}`);
  }
  for (const check of ["one_question_only", "cover_all_blocks"]) {
    if (!decision.llm_policy_checks.includes(check)) {
      fail(`route decision is missing policy check ${check}: ${decision.route_decision_id}`);
    }
  }
}

for (const notice of state.missing_evidence_notices) {
  for (const answerId of notice.linked_answer_ids) {
    if (!state.answers.some((answer) => answer.answer_id === answerId)) {
      fail(`missing evidence notice references unknown answer: ${notice.notice_id}`);
    }
  }
}

console.log("BMC interview replay validation passed");
