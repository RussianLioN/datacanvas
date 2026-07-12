import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const packageRoot = "docs/product/analysis/agent-launch-requirements-analysis";
const requiredStories = [
  "DC-ST-23",
  "DC-ST-24",
  "DC-ST-25",
  "DC-ST-26",
  "DC-ST-27",
  "DC-ST-28",
  "DC-ST-29",
  "DC-ST-30",
  "DC-ST-31",
  "DC-ST-32",
  "DC-ST-33",
];
const requiredFiles = [
  "README.md",
  "analysis-state.json",
  "analysis-log.md",
  "artifact-review-ledger.md",
  "story-requirement-decision-ledger.md",
  "requirements-impact-map.json",
  "question-bank.json",
  "open-decisions.md",
  "evidence-requests.md",
].map((fileName) => `${packageRoot}/${fileName}`);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

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
    fail(`required file does not exist: ${relativePath}`);
  }
}

function validateWithSchema(schemaPath, dataPath, label) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(readJson(schemaPath));
  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${label} does not match schema`);
  }
  return data;
}

for (const filePath of requiredFiles) {
  requireFile(filePath);
}

const statePath = `${packageRoot}/analysis-state.json`;
const impactMapPath = `${packageRoot}/requirements-impact-map.json`;
const state = validateWithSchema(
  "schemas/agent-launch-requirements-analysis-state.schema.json",
  statePath,
  "analysis state",
);
const impactMap = validateWithSchema(
  "schemas/agent-launch-requirements-impact-map.schema.json",
  impactMapPath,
  "requirements impact map",
);

if (state.analysis_id !== impactMap.analysis_id) {
  fail("analysis_id mismatch between state and impact map");
}

if (state.log_path !== `${packageRoot}/analysis-log.md`) {
  fail("analysis-state log_path does not point to package analysis-log.md");
}

if (state.requirements_impact_map_path !== impactMapPath) {
  fail("analysis-state requirements_impact_map_path does not point to package impact map");
}

if (state.status !== "completed" || impactMap.status !== "completed") {
  fail("analysis package must be completed before final handoff");
}

if (impactMap.source_change_order !== "CO-2026-002") {
  fail("analysis package must use CO-2026-002 as current source change order");
}

if (state.last_open_checkpoint !== null) {
  fail("completed analysis must not have an open checkpoint");
}

if (state.deferred_decisions.length > 0 || impactMap.summary.deferred_decisions.length > 0) {
  fail("completed analysis must not have deferred decisions");
}

if (impactMap.summary.evidence_requests.length > 0) {
  fail("completed analysis must not have open evidence requests");
}

const completedStories = new Set(state.completed_decisions.map((decision) => decision.story_id));
const impactStories = new Set(impactMap.stories.map((story) => story.story_id));
for (const storyId of requiredStories) {
  if (!completedStories.has(storyId)) {
    fail(`analysis state is missing completed decision for ${storyId}`);
  }
  if (!impactStories.has(storyId)) {
    fail(`impact map is missing story ${storyId}`);
  }
}

if (completedStories.size !== requiredStories.length || impactStories.size !== requiredStories.length) {
  fail("analysis package must cover exactly DC-ST-23..DC-ST-33");
}

const businessRequirements = readText("docs/product/requirements/business-requirements.md");
const traceabilityMatrix = readText("docs/product/requirements/traceability-matrix.json");
for (const story of impactMap.stories) {
  if (story.blockers.length > 0) {
    fail(`story has unresolved blockers: ${story.story_id}`);
  }
  for (const requirementId of story.affected_requirements) {
    if (!businessRequirements.includes(requirementId)) {
      fail(`affected requirement is missing from business-requirements.md: ${requirementId}`);
    }
    if (!traceabilityMatrix.includes(requirementId)) {
      fail(`affected requirement is missing from traceability-matrix.json: ${requirementId}`);
    }
  }
  for (const sourcePath of story.source_paths) {
    requireFile(sourcePath);
  }
}

const log = readText(`${packageRoot}/analysis-log.md`);
const decisionLedger = readText(`${packageRoot}/story-requirement-decision-ledger.md`);
for (const storyId of requiredStories) {
  if (!log.includes(storyId)) {
    fail(`analysis log does not mention ${storyId}`);
  }
  if (!decisionLedger.includes(storyId)) {
    fail(`decision ledger does not mention ${storyId}`);
  }
}

const readme = readText(`${packageRoot}/README.md`);
if (!readme.includes("не является `PBI-*`")) {
  fail("package README must state that the work is not a product backlog PBI");
}

const openDecisions = readText(`${packageRoot}/open-decisions.md`);
if (!openDecisions.includes("Открытых решений нет")) {
  fail("open-decisions.md must state that there are no open decisions");
}

const evidenceRequests = readText(`${packageRoot}/evidence-requests.md`);
if (!evidenceRequests.includes("Открытых запросов доказательств нет")) {
  fail("evidence-requests.md must state that there are no open evidence requests");
}

const questionBank = readJson(`${packageRoot}/question-bank.json`);
const questionStories = new Set(questionBank.questions.map((question) => question.story_id));
for (const storyId of requiredStories) {
  if (!questionStories.has(storyId)) {
    fail(`question bank is missing ${storyId}`);
  }
}

const expectedNewRequirements = new Set(["BT-019", "BT-020", "BT-021"]);
const actualNewRequirements = new Set(impactMap.requirements_baseline.new_requirement_ids_assigned);
if (actualNewRequirements.size !== expectedNewRequirements.size) {
  fail("analysis package must assign exactly BT-019..BT-021 for the P2 extension");
}
for (const requirementId of expectedNewRequirements) {
  if (!actualNewRequirements.has(requirementId)) {
    fail(`analysis package is missing new requirement assignment: ${requirementId}`);
  }
}

console.log("agent launch requirements analysis validation passed");
