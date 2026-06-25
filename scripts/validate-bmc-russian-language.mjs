import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const files = {
  questionBank: "docs/product/bmc/bmc-interview-question-bank.json",
  protocol: "docs/product/bmc/interview-runtime-protocol.md",
  routerPolicy: "docs/product/bmc/llm-router-policy.md",
  userGuide: "docs/product/bmc/live-bmc-interview-user-guide.md",
  operatorGuide: "docs/product/bmc/live-bmc-interview-operator-guide.md",
};

const allowedLatinTokens = new Set([
  "A2A",
  "API",
  "BMC",
  "CSM",
  "Codex",
  "DataCanvas",
  "JSON",
  "LLM",
  "MCP",
  "PlantUML",
  "PNG",
  "SVG",
  "UAT",
]);

const forbiddenFragments = [
  "acceptance criteria",
  "approval",
  "backlog/story",
  "buyer",
  "claim",
  "closing",
  "cost baseline",
  "custom answer",
  "domain knowledge",
  "draft",
  "email infrastructure",
  "evidence",
  "evidence requests",
  "export",
  "final",
  "generated bmc artifacts",
  "human-in-the-loop",
  "incomplete",
  "latency baseline",
  "maintenance estimate",
  "missing evidence",
  "owner",
  "review",
  "review estimate",
  "router",
  "skip",
  "source trace",
  "sponsor",
  "standard",
  "story",
  "templates",
  "top hypothesis",
  "unknown",
  "upstream",
  "ux decision",
  "validation planning",
  "validation roadmap",
  "validator",
  "value proposition",
];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    fail(`required Russian language file is missing: ${relativePath}`);
  }
}

function collectUnexpectedLatin(text) {
  const tokens = text.match(/[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*/g) ?? [];
  return tokens.filter((token) => {
    if (/^B[1-9]-Q\d{2}$/.test(token)) {
      return false;
    }
    if (/^B[1-9]$/.test(token)) {
      return false;
    }
    if (allowedLatinTokens.has(token)) {
      return false;
    }
    if (allowedLatinTokens.has(token.toUpperCase())) {
      return false;
    }
    return true;
  });
}

function validateUserText(location, text) {
  const lowerText = text.toLowerCase();
  for (const fragment of forbiddenFragments) {
    if (lowerText.includes(fragment)) {
      fail(`${location} contains forbidden English fragment: ${fragment}`);
    }
  }

  const unexpectedTokens = collectUnexpectedLatin(text);
  if (unexpectedTokens.length > 0) {
    fail(`${location} contains unexpected Latin token(s): ${[...new Set(unexpectedTokens)].join(", ")}`);
  }
}

for (const relativePath of Object.values(files)) {
  requireFile(relativePath);
}

const questionBank = readJson(files.questionBank);
if (questionBank.language !== "ru") {
  fail("BMC question bank language must be ru");
}

for (const [index, mode] of questionBank.default_modes.entries()) {
  validateUserText(`default_modes[${index}].description`, mode.description);
}

for (const question of questionBank.questions) {
  validateUserText(`${question.question_id}.question_text`, question.question_text);
  validateUserText(`${question.question_id}.why_asked`, question.why_asked);
  validateUserText(`${question.question_id}.evidence_prompt`, question.evidence_prompt);
  if (question.follow_up_policy) {
    validateUserText(`${question.question_id}.follow_up_policy`, question.follow_up_policy);
  }
  for (const option of question.answer_options) {
    validateUserText(`${question.question_id}.${option.id}.label`, option.label);
  }
}

const protocol = readText(files.protocol);
const routerPolicy = readText(files.routerPolicy);
const userGuide = readText(files.userGuide);
const operatorGuide = readText(files.operatorGuide);

for (const [label, text] of [
  [files.protocol, protocol],
  [files.routerPolicy, routerPolicy],
]) {
  if (!text.includes("## Русский Язык")) {
    fail(`${label} must contain a Russian language policy section`);
  }
}

if (routerPolicy.includes("короткая просьба evidence")) {
  fail("router policy still exposes evidence in user-facing text");
}

for (const [label, text] of [
  [files.userGuide, userGuide],
  [files.operatorGuide, operatorGuide],
]) {
  if (text.startsWith("# Live")) {
    fail(`${label} title must be in Russian`);
  }
}

for (const forbiddenOperatorHeading of ["## Active State", "## Completed State"]) {
  if (operatorGuide.includes(forbiddenOperatorHeading)) {
    fail(`operator guide contains English heading: ${forbiddenOperatorHeading}`);
  }
}

console.log("BMC Russian language validation passed");
