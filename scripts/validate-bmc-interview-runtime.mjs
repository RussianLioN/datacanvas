import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const expectedBlocks = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9"];
const files = {
  questionBank: "docs/product/bmc/bmc-interview-question-bank.json",
  activeState: "docs/product/bmc/interviews/active-bmc-interview-runtime-state.json",
  fixtureState: "docs/product/bmc/interviews/2026-W26-bmc-interview-runtime-state.json",
  routeDecisions: "docs/product/bmc/interviews/2026-W26-bmc-route-decisions.json",
  protocol: "docs/product/bmc/interview-runtime-protocol.md",
  routerPolicy: "docs/product/bmc/llm-router-policy.md",
  userGuide: "docs/product/bmc/live-bmc-interview-user-guide.md",
  operatorGuide: "docs/product/bmc/live-bmc-interview-operator-guide.md",
};

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

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    fail(`required BMC runtime file is missing: ${relativePath}`);
  }
}

for (const relativePath of Object.values(files)) {
  requireFile(relativePath);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validators = new Map();

function validateWithSchema(schemaPath, dataPath) {
  let validate = validators.get(schemaPath);
  if (!validate) {
    validate = ajv.compile(readJson(schemaPath));
    validators.set(schemaPath, validate);
  }
  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
  return data;
}

const questionBank = validateWithSchema("schemas/bmc-question-bank.schema.json", files.questionBank);
const activeState = validateWithSchema("schemas/bmc-interview-runtime-state.schema.json", files.activeState);
const fixtureState = validateWithSchema("schemas/bmc-interview-runtime-state.schema.json", files.fixtureState);
const routeDecisions = validateWithSchema("schemas/bmc-route-decisions.schema.json", files.routeDecisions);

const questionsById = new Map(questionBank.questions.map((question) => [question.question_id, question]));
const questionTypes = new Set(questionBank.questions.map((question) => question.question_type ?? "base"));
for (const requiredType of [
  "base",
  "follow_up",
  "evidence_request",
  "clarification",
  "contradiction_resolution",
  "hypothesis_prioritization",
  "validation_planning",
  "closing_confirmation",
]) {
  if (!questionTypes.has(requiredType)) {
    fail(`question bank is missing runtime question_type: ${requiredType}`);
  }
}

for (const block of expectedBlocks) {
  if (!questionBank.questions.some((question) => question.bmc_block === block)) {
    fail(`question bank is missing BMC block: ${block}`);
  }
}

function validateState(state, label) {
  const covered = new Set(state.covered_bmc_blocks);
  const remaining = new Set(state.remaining_bmc_blocks);
  for (const block of covered) {
    if (remaining.has(block)) {
      fail(`${label} has block in both covered and remaining: ${block}`);
    }
  }

  if (state.current_question_id && !questionsById.has(state.current_question_id)) {
    fail(`${label} current_question_id does not exist in question bank: ${state.current_question_id}`);
  }

  const answerIds = new Set();
  const answersWithoutEvidence = [];
  for (const answer of state.answers) {
    if (answerIds.has(answer.answer_id)) {
      fail(`${label} has duplicate answer_id: ${answer.answer_id}`);
    }
    answerIds.add(answer.answer_id);

    const question = questionsById.get(answer.question_id);
    if (!question) {
      fail(`${label} answer references unknown question: ${answer.question_id}`);
    }
    if (question.bmc_block !== answer.bmc_block) {
      fail(`${label} answer block mismatch: ${answer.answer_id}`);
    }

    const validOptions = new Set(question.answer_options.map((option) => option.id));
    for (const optionId of answer.selected_option_ids) {
      if (!validOptions.has(optionId)) {
        fail(`${label} answer references unknown option ${optionId}: ${answer.answer_id}`);
      }
    }

    if (answer.evidence_requested && answer.evidence_ids.length === 0) {
      answersWithoutEvidence.push(answer.answer_id);
    }
  }

  const missingNoticeAnswerIds = new Set(
    state.missing_evidence_notices.flatMap((notice) => notice.linked_answer_ids),
  );
  for (const answerId of answersWithoutEvidence) {
    if (!missingNoticeAnswerIds.has(answerId)) {
      fail(`${label} answer without evidence has no missing evidence notice: ${answerId}`);
    }
  }

  const evidenceIds = new Set(state.evidence_items.map((item) => item.evidence_id));
  for (const claim of state.claims_snapshot) {
    if (claim.status === "confirmed" && claim.evidence_ids.length === 0) {
      fail(`${label} confirmed claim has no evidence: ${claim.claim_id}`);
    }
    for (const evidenceId of claim.evidence_ids) {
      if (!evidenceIds.has(evidenceId)) {
        fail(`${label} claim references missing evidence ${evidenceId}: ${claim.claim_id}`);
      }
    }
  }

  if (["ready_for_confirmation", "completed"].includes(state.status)) {
    for (const block of expectedBlocks) {
      if (!covered.has(block)) {
        fail(`${label} final state does not cover BMC block: ${block}`);
      }
    }
    if (state.remaining_bmc_blocks.length !== 0) {
      fail(`${label} final state must not have remaining BMC blocks`);
    }
    if (!state.transcript_path || !fs.existsSync(absolute(state.transcript_path))) {
      fail(`${label} final state transcript is missing`);
    }
    if (!state.route_decisions_path || !fs.existsSync(absolute(state.route_decisions_path))) {
      fail(`${label} final state route decisions file is missing`);
    }
    if (state.route_decisions.length < Math.max(0, state.answers.length - 1)) {
      fail(`${label} final state does not have route decisions after each non-initial answer`);
    }
  }
}

validateState(activeState, "active runtime state");
validateState(fixtureState, "fixture runtime state");

if (routeDecisions.session_id !== fixtureState.session_id || routeDecisions.interview_id !== fixtureState.interview_id) {
  fail("route decisions identity does not match fixture runtime state");
}

const routeDecisionIds = new Set(routeDecisions.decisions.map((decision) => decision.route_decision_id));
for (const routeDecisionId of fixtureState.route_decisions) {
  if (!routeDecisionIds.has(routeDecisionId)) {
    fail(`fixture state references missing route decision: ${routeDecisionId}`);
  }
}

const protocol = readText(files.protocol);
for (const phrase of ["одному вопросу", "Подтверждения", "Завершение"]) {
  if (!protocol.includes(phrase)) {
    fail(`runtime protocol is missing required phrase: ${phrase}`);
  }
}

const routerPolicy = readText(files.routerPolicy);
for (const phrase of ["одного вопроса", "confirmed", "Политика Подтверждений"]) {
  if (!routerPolicy.includes(phrase)) {
    fail(`LLM router policy is missing required phrase: ${phrase}`);
  }
}

console.log("BMC interview runtime validation passed");
