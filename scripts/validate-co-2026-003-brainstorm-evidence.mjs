import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/delivery-success-message";
const statePath = `${packagePath}/brainstorming-topic-result.json`;
const ledgerPath = `${packagePath}/brainstorming-topic-result.md`;
const rawLedgerPath = `${packagePath}/raw-variants-ledger.md`;
const schemaPath = "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-topic-result.schema.json";
const activeContractsPath = "docs/product/analysis/presentation-link-lisa-user-journey/source/active-contracts.json";
const prototypeCandidatePath = "docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json";
const expectedFinalCandidateIds = Object.freeze([1, 2, 9, 6, 14]);
const forbiddenTextPattern = /\/Users\/|\/private\/tmp|file:|\.docx\b|[A-Za-z]:\\|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\b[a-f0-9]{64}\b/iu;

function parseArguments(args) {
  if (args.length === 0) return { root: process.cwd() };
  if (args.length === 2 && args[0] === "--root") return { root: path.resolve(args[1]) };
  throw new Error("использование: node scripts/validate-co-2026-003-brainstorm-evidence.mjs [--root <path>]");
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"}: ${error.message}`).join("; ");
}

function assertNoForbiddenText(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (forbiddenTextPattern.test(text)) {
    throw new Error("must not contain local paths, file references, DOCX names, hashes, email addresses or personal data traces");
  }
}

function sameArray(actual, expected) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function assertSequentialIds(items, key, expectedCount, message) {
  const ids = items.map((item) => item[key]);
  const expected = Array.from({ length: expectedCount }, (_, index) => index + 1);
  if (!sameArray(ids, expected)) throw new Error(message);
}

function validateSchema(root) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const schema = readJson(root, schemaPath);
  const state = readJson(root, statePath);
  const validate = ajv.compile(schema);
  if (!validate(state)) {
    throw new Error(`${statePath} does not match ${schemaPath}: ${formatAjvErrors(validate.errors)}`);
  }
  return state;
}

function validatePhase1(phase1) {
  if (phase1.participant_count !== 19 || phase1.participants.length !== 19) {
    throw new Error("phase_1 must contain exactly 19 participants");
  }
  const rawVariantCount = phase1.participants.reduce((sum, participant) => sum + participant.variants.length, 0);
  if (phase1.raw_variant_count !== 380 || rawVariantCount !== 380) {
    throw new Error("phase_1 must contain exactly 380 raw variants");
  }
  if (phase1.participants.some((participant) => participant.variants.length < 20)) {
    throw new Error("phase_1 participants must contain at least 20 variants each");
  }
  const participantIds = new Set(phase1.participants.map((participant) => participant.participant_id));
  if (participantIds.size !== 19) {
    throw new Error("phase_1 participant ids must be unique");
  }
  if (phase1.consolidation.candidate_count !== 30 || phase1.consolidation.candidates.length !== 30) {
    throw new Error("phase_1 consolidation must contain exactly 30 candidates");
  }
  assertSequentialIds(phase1.consolidation.candidates, "candidate_id", 30, "phase_1 consolidation candidate ids must be 1..30");
}

function validatePhase2(phase2) {
  if (phase2.participant_count !== 19 || phase2.rankings.length !== 19) {
    throw new Error("phase_2 must contain exactly 19 rankings");
  }
  if (phase2.evaluation_mode !== "anonymous" || phase2.reviewer_group !== "independent_anonymous") {
    throw new Error("phase_2 must remain an independent anonymous evaluation");
  }
  const reviewerIds = new Set(phase2.rankings.map((ranking) => ranking.anonymous_reviewer_id));
  if (reviewerIds.size !== 19) {
    throw new Error("phase_2 anonymous reviewer ids must be unique");
  }
  for (const ranking of phase2.rankings) {
    if (ranking.ranked_candidate_ids.length !== 5) {
      throw new Error("phase_2 rankings must contain exactly five candidates each");
    }
    if (new Set(ranking.ranked_candidate_ids).size !== 5) {
      throw new Error("phase_2 rankings must not repeat candidates inside one ranking");
    }
  }
}

function validateScoring(state) {
  const positionPoints = state.scoring.position_points;
  const totals = new Map(Array.from({ length: 30 }, (_, index) => [index + 1, 0]));
  for (const ranking of state.phase_2.rankings) {
    ranking.ranked_candidate_ids.forEach((candidateId, index) => {
      totals.set(candidateId, totals.get(candidateId) + positionPoints[String(index + 1)]);
    });
  }
  const expectedTotals = [...totals.entries()]
    .sort((left, right) => right[1] - left[1] || left[0] - right[0])
    .map(([candidate_id, points]) => ({ candidate_id, points }));
  if (JSON.stringify(state.scoring.totals) !== JSON.stringify(expectedTotals)) {
    throw new Error("scoring totals must match the reproducible 5..1 rule");
  }
  if (!sameArray(state.final_candidates.map((candidate) => candidate.source_candidate_id), expectedFinalCandidateIds)) {
    throw new Error("final candidates must be variants 1, 2, 9, 6, 14 in descending score order");
  }
  const consolidatedById = new Map(state.phase_1.consolidation.candidates.map((candidate) => [candidate.candidate_id, candidate.text]));
  for (let index = 0; index < state.final_candidates.length; index += 1) {
    const candidate = state.final_candidates[index];
    if (candidate.rank !== index + 1) {
      throw new Error("final candidate ranks must be 1..5");
    }
    const expectedScore = expectedTotals.find((total) => total.candidate_id === candidate.source_candidate_id)?.points;
    if (candidate.points !== expectedScore || candidate.text !== consolidatedById.get(candidate.source_candidate_id)) {
      throw new Error("final candidate text and points must match consolidation and scoring totals");
    }
  }
}

function validateInactiveBoundary(root, state) {
  if (state.selected_text !== null) {
    throw new Error("selected_text must remain null");
  }
  if (
    state.boundaries.render_allowed !== false ||
    state.boundaries.archive_allowed !== false ||
    state.boundaries.generator_input_allowed !== false
  ) {
    throw new Error("render, archive and generator input must stay blocked");
  }
  for (const relativePath of [activeContractsPath, prototypeCandidatePath]) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) continue;
    const text = fs.readFileSync(absolutePath, "utf8");
    if (text.includes("candidate-evidence/delivery-success-message")) {
      throw new Error("candidate evidence must not be wired into active contracts or generator inputs");
    }
  }
}

try {
  const { root } = parseArguments(process.argv.slice(2));
  const state = validateSchema(root);
  const ledger = readText(root, ledgerPath);
  const rawLedger = readText(root, rawLedgerPath);

  assertNoForbiddenText(state);
  assertNoForbiddenText(ledger);
  assertNoForbiddenText(rawLedger);
  validatePhase1(state.phase_1);
  validatePhase2(state.phase_2);
  validateScoring(state);
  validateInactiveBoundary(root, state);
  if (!ledger.includes("Статус: `pending_owner_selection`") || !rawLedger.includes("Всего сырых вариантов: 380")) {
    throw new Error("Markdown ledgers must expose pending status and raw variant count");
  }

  process.stdout.write("Проверка неактивного результата брейншторма CO-2026-003 пройдена.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка не выполнена"}\n`);
  process.exitCode = 1;
}
