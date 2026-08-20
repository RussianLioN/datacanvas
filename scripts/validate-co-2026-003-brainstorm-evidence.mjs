import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

const journeyRoot = "docs/product/analysis/presentation-link-lisa-user-journey";
const candidateEvidenceRoot = `${journeyRoot}/candidate-evidence`;
const registryPath = `${candidateEvidenceRoot}/candidate-evidence-registry.json`;
const registrySchemaPath = `${journeyRoot}/source/schemas/candidate-evidence-registry.schema.json`;
const topicSchemaPath = `${journeyRoot}/source/schemas/brainstorming-topic-result.schema.json`;
const brainstormingContractPath = `${journeyRoot}/source/brainstorming-contract.json`;
const activeContractsPath = `${journeyRoot}/source/active-contracts.json`;
const prototypeCandidatePath = `${journeyRoot}/source/prototype-revision-candidate.json`;
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
  return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function assertSequentialIds(items, key, expectedCount, message) {
  const ids = items.map((item) => item[key]);
  const expected = Array.from({ length: expectedCount }, (_, index) => index + 1);
  if (!sameArray(ids, expected)) throw new Error(message);
}

function validateJsonAgainstSchema(root, schemaFile, dataFile) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(readJson(root, schemaFile));
  const data = readJson(root, dataFile);
  if (!validate(data)) throw new Error(`${dataFile} does not match ${schemaFile}: ${formatAjvErrors(validate.errors)}`);
  return data;
}

function validateRegistry(root) {
  const registry = validateJsonAgainstSchema(root, registrySchemaPath, registryPath);
  const brainstormingContract = readJson(root, brainstormingContractPath);
  const topicsById = new Map(brainstormingContract.topics.map((topic) => [topic.topic_id, topic]));
  if (registry.topic_ids.length !== registry.package_paths.length) {
    throw new Error("candidate evidence registry must pair every topic with exactly one package path");
  }
  return registry.topic_ids.map((topicId, index) => {
    const topic = topicsById.get(topicId);
    if (!topic) throw new Error(`candidate evidence registry contains an unknown topic: ${topicId}`);
    const relativePackagePath = registry.package_paths[index];
    if (!relativePackagePath.startsWith("candidate-evidence/") || relativePackagePath.includes("..")) {
      throw new Error("candidate evidence registry contains an unsafe package path");
    }
    return {
      topic,
      relativePackagePath,
      packagePath: `${journeyRoot}/${relativePackagePath}`,
    };
  });
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
  if (participantIds.size !== 19) throw new Error("phase_1 participant ids must be unique");
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
  if (reviewerIds.size !== 19) throw new Error("phase_2 anonymous reviewer ids must be unique");
  for (const ranking of phase2.rankings) {
    if (ranking.ranked_candidate_ids.length !== 5) throw new Error("phase_2 rankings must contain exactly five candidates each");
    if (new Set(ranking.ranked_candidate_ids).size !== 5) throw new Error("phase_2 rankings must not repeat candidates inside one ranking");
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
  const expectedFinalCandidateIds = expectedTotals.slice(0, 5).map((total) => total.candidate_id);
  if (!sameArray(state.final_candidates.map((candidate) => candidate.source_candidate_id), expectedFinalCandidateIds)) {
    throw new Error("final candidates must be the five highest reproducible scores in descending order");
  }
  const consolidatedById = new Map(state.phase_1.consolidation.candidates.map((candidate) => [candidate.candidate_id, candidate.text]));
  for (let index = 0; index < state.final_candidates.length; index += 1) {
    const candidate = state.final_candidates[index];
    if (candidate.rank !== index + 1) throw new Error("final candidate ranks must be 1..5");
    const expectedScore = expectedTotals.find((total) => total.candidate_id === candidate.source_candidate_id)?.points;
    if (candidate.points !== expectedScore || candidate.text !== consolidatedById.get(candidate.source_candidate_id)) {
      throw new Error("final candidate text and points must match consolidation and scoring totals");
    }
  }
}

function validateOptionalIntegrity(state) {
  if (!state.integrity) return;
  const variants = state.phase_1.participants.flatMap((participant) => participant.variants);
  if (new Set(variants).size !== variants.length) {
    throw new Error("integrity declares exact raw variant uniqueness but duplicates remain");
  }
}

function validateInactiveBoundary(root, state, registryEntries) {
  if (state.selected_text !== null) throw new Error("selected_text must remain null");
  if (state.boundaries.render_allowed !== false || state.boundaries.archive_allowed !== false || state.boundaries.generator_input_allowed !== false) {
    throw new Error("render, archive and generator input must stay blocked");
  }
  for (const relativePath of [activeContractsPath, prototypeCandidatePath]) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) continue;
    const text = fs.readFileSync(absolutePath, "utf8");
    if (registryEntries.some((entry) => text.includes(entry.relativePackagePath))) {
      throw new Error("candidate evidence must not be wired into active contracts or generator inputs");
    }
  }
}

function validatePackage(root, entry, registryEntries) {
  const statePath = `${entry.packagePath}/brainstorming-topic-result.json`;
  const ledgerPath = `${entry.packagePath}/brainstorming-topic-result.md`;
  const rawLedgerPath = `${entry.packagePath}/raw-variants-ledger.md`;
  const state = validateJsonAgainstSchema(root, topicSchemaPath, statePath);
  const ledger = readText(root, ledgerPath);
  const rawLedger = readText(root, rawLedgerPath);
  if (state.topic_id !== entry.topic.topic_id || state.topic_title !== entry.topic.title) {
    throw new Error("candidate evidence topic must match the registered canonical topic");
  }
  assertNoForbiddenText(state);
  assertNoForbiddenText(ledger);
  assertNoForbiddenText(rawLedger);
  validatePhase1(state.phase_1);
  validatePhase2(state.phase_2);
  validateScoring(state);
  validateOptionalIntegrity(state);
  validateInactiveBoundary(root, state, registryEntries);
  if (!ledger.includes("Статус: `pending_owner_selection`") || !rawLedger.includes("Всего сырых вариантов: 380")) {
    throw new Error("Markdown ledgers must expose pending status and raw variant count");
  }
}

try {
  const { root } = parseArguments(process.argv.slice(2));
  const registryEntries = validateRegistry(root);
  for (const entry of registryEntries) validatePackage(root, entry, registryEntries);
  process.stdout.write("Проверка неактивных результатов брейншторма CO-2026-003 пройдена.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка не выполнена"}\n`);
  process.exitCode = 1;
}
