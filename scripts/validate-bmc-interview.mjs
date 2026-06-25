import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

const files = {
  questionBank: "docs/product/bmc/bmc-interview-question-bank.json",
  answers: "docs/product/bmc/interviews/2026-W26-interview-answers.json",
  userEvidence: "docs/product/bmc/interviews/2026-W26-user-evidence.json",
  results: "docs/product/bmc/interviews/2026-W26-bmc-interview-results.json",
};

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    fail(`required BMC interview file is missing: ${relativePath}`);
  }
}

for (const filePath of Object.values(files)) {
  requireFile(filePath);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const schemaCases = [
  ["schemas/bmc-question-bank.schema.json", files.questionBank],
  ["schemas/bmc-interview-answers.schema.json", files.answers],
  ["schemas/bmc-user-evidence.schema.json", files.userEvidence],
  ["schemas/bmc-interview-results.schema.json", files.results],
];

for (const [schemaPath, dataPath] of schemaCases) {
  const validate = ajv.compile(readJson(schemaPath));
  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
}

const questionBank = readJson(files.questionBank);
const answers = readJson(files.answers);
const userEvidence = readJson(files.userEvidence);
const results = readJson(files.results);
const expectedBlocks = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9"];

const questionsById = new Map(questionBank.questions.map((question) => [question.question_id, question]));
const questionBlocks = new Set(questionBank.questions.map((question) => question.bmc_block));
for (const block of expectedBlocks) {
  if (!questionBlocks.has(block)) {
    fail(`question bank does not cover BMC block: ${block}`);
  }
}

for (const question of questionBank.questions) {
  const optionKinds = new Set(question.answer_options.map((option) => option.kind));
  const presetCount = question.answer_options.filter((option) => option.kind === "preset").length;
  if (presetCount < 3) {
    fail(`question has fewer than 3 project-specific preset answers: ${question.question_id}`);
  }
  for (const requiredKind of ["custom", "unknown", "skip"]) {
    if (!optionKinds.has(requiredKind)) {
      fail(`question is missing ${requiredKind} option: ${question.question_id}`);
    }
  }
  if (!question.custom_answer_allowed) {
    fail(`question must allow a custom answer: ${question.question_id}`);
  }
}

for (const answer of answers.answers) {
  const question = questionsById.get(answer.question_id);
  if (!question) {
    fail(`answer references unknown question: ${answer.answer_id}`);
  }
  if (question.bmc_block !== answer.bmc_block) {
    fail(`answer block mismatch for ${answer.answer_id}`);
  }
  const validOptionIds = new Set(question.answer_options.map((option) => option.id));
  for (const optionId of answer.selected_option_ids) {
    if (!validOptionIds.has(optionId)) {
      fail(`answer references unknown option ${optionId}: ${answer.answer_id}`);
    }
  }
  if (!answer.evidence_requested && question.question_type !== "closing_confirmation") {
    fail(`answer must request evidence: ${answer.answer_id}`);
  }
  if (answer.evidence_ids.length === 0 && !["unconfirmed", "assumption", "confirmed"].includes(answer.confirmation_status)) {
    fail(`answer without evidence has invalid status: ${answer.answer_id}`);
  }
}

const answerBlocks = new Set(answers.answers.map((answer) => answer.bmc_block));
for (const block of expectedBlocks) {
  if (!answerBlocks.has(block)) {
    fail(`answers do not cover BMC block: ${block}`);
  }
  if (!results.covered_bmc_blocks.includes(block)) {
    fail(`results do not cover BMC block: ${block}`);
  }
}

if (results.unconfirmed_claim_ids.length === 0) {
  fail("results must expose unconfirmed claims");
}

if (results.evidence_requests.length === 0) {
  fail("results must include evidence requests");
}

if (userEvidence.evidence_items.length === 0 && userEvidence.missing_evidence_notices.length === 0) {
  fail("missing user evidence must be explicitly recorded");
}

console.log("BMC interview validation passed");
