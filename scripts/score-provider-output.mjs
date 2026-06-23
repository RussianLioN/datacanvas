import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const llmResultPath = process.argv[2] ?? "tests/golden/llm-result-minimal.json";
const outputPath = process.argv[3] ?? "tests/provider/provider-experiment-result-scored.json";
const scenarioPath = process.argv[4];

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const llmResult = readJson(llmResultPath);
const normalized = readJson("tests/golden/normalized-data-minimal.json");
const budget = readJson("docs/architecture/llm/provider-budget.json");
const template = readJson("docs/architecture/llm/provider-experiment-result-template.json");
const delta = readJson("tests/evals/provider-specific-eval-delta.json");
const riskRegistry = readJson("docs/architecture/risks/risk-registry.json");
const inputPackage = readJson("tests/fixtures/input-package-minimal.json");
const scenario = scenarioPath ? readJson(scenarioPath) : {};

const knownFacts = new Set(normalized.facts.map((fact) => fact.fact_id));
const knownClaims = new Set(normalized.facts.map((fact) => fact.claim));
const riskIds = new Set(riskRegistry.risks.map((risk) => risk.id));

const spec = llmResult.presentation_spec;
const allClaims = spec.slides.flatMap((slide) => slide.claims);
const allClaimFactIds = allClaims.flatMap((claim) => claim.fact_ids);
const claimsAreSupported = allClaimFactIds.every((factId) => knownFacts.has(factId)) &&
  allClaims.every((claim) => knownClaims.has(claim.text));

const specText = JSON.stringify(spec).toLowerCase();
const leakedInstructions = (inputPackage.instructions ?? []).filter((instruction) =>
  specText.includes(instruction.toLowerCase()),
);
const containsForbiddenData = leakedInstructions.length > 0 ||
  /secret|token|api[_-]?key|raw trace|hidden notes/i.test(specText);

const latencyMsP95 = scenario.latency_ms_p95 ?? 0;
const costPerRunUsd = scenario.cost_per_run_usd ?? 0;
const failureRatePercent = scenario.failure_rate_percent ?? 0;

const componentScores = {
  factuality: claimsAreSupported ? 1 : 0,
  security: containsForbiddenData ? 0 : 1,
  latency: latencyMsP95 <= budget.budgets.max_latency_ms_p95 ? 1 : 0,
  cost: costPerRunUsd <= budget.budgets.max_cost_per_run_usd ? 1 : 0,
  reliability: failureRatePercent <= budget.budgets.max_failure_rate_percent ? 1 : 0,
};

for (const testCase of delta.cases) {
  if (!riskIds.has(testCase.linked_risk)) {
    throw new Error(`Unknown linked_risk in provider eval delta: ${testCase.linked_risk}`);
  }
}

const weightByType = Object.fromEntries(delta.cases.map((testCase) => [testCase.type, testCase.score_weight]));
const rawQualityScore =
  componentScores.factuality * weightByType.provider_quality +
  componentScores.security * weightByType.provider_security +
  componentScores.latency * weightByType.provider_latency +
  componentScores.cost * weightByType.provider_cost +
  componentScores.reliability * weightByType.provider_failure;

const stopRuleViolated = Object.values(componentScores).some((score) => score === 0);
const qualityScore = stopRuleViolated ? Math.min(rawQualityScore, 0.8999) : rawQualityScore;

const result = {
  ...template,
  status: "completed",
  decision: qualityScore >= 0.9 ? "accept" : "rollback",
  metrics: {
    quality_score: Number(qualityScore.toFixed(4)),
    cost_per_run_usd: costPerRunUsd,
    latency_ms_p95: latencyMsP95,
    failure_rate_percent: failureRatePercent,
  },
  quality_evidence: [
    ...template.quality_evidence,
    llmResultPath,
    "tests/evals/provider-specific-eval-delta.json",
    "docs/architecture/evals/provider-quality-scoring-rubric.md"
  ],
  security_evidence: [
    ...template.security_evidence,
    "docs/architecture/risks/risk-registry.json"
  ],
  known_limitations: [
    `Scored result uses frozen output from ${llmResultPath}, not a live external provider.`,
    scenarioPath ? `Scored result uses scenario metrics from ${scenarioPath}.` : "Scored result uses default zero-cost offline scenario metrics.",
    "Latency, cost and failure rate are zero because no network call is executed.",
    "Decision is valid only as scorer validation evidence, not as team acceptance of an external provider."
  ],
};

writeJson(outputPath, result);
console.log(`provider experiment scored result written: ${outputPath}`);
