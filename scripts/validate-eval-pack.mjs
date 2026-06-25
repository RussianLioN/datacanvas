import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const evals = readJson("tests/evals/eval-cases.json");
const inputPackage = readJson("tests/fixtures/input-package-minimal.json");
const normalized = readJson("tests/golden/normalized-data-minimal.json");
const spec = readJson("tests/golden/presentation-spec-minimal.json");
const claimMap = readJson("tests/golden/claim-map-minimal.json");
const unsupportedResult = readJson("tests/fixtures/llm-result-unsupported-claim.json");

const requiredEvalIds = ["EVAL-001", "EVAL-002", "EVAL-003", "EVAL-004", "EVAL-005", "EVAL-006"];
const actualIds = new Set(evals.cases.map((testCase) => testCase.id));

for (const requiredId of requiredEvalIds) {
  if (!actualIds.has(requiredId)) {
    fail(`missing required eval case: ${requiredId}`);
  }
}

const requiredTypes = new Set([
  "happy_path",
  "security",
  "traceability",
  "presentation_quality",
  "hallucination_resistance",
]);
const actualTypes = new Set(evals.cases.map((testCase) => testCase.type));

for (const requiredType of requiredTypes) {
  if (!actualTypes.has(requiredType)) {
    fail(`missing required eval type: ${requiredType}`);
  }
}

if (spec.slides.length < 1 || spec.slides.length > 5) {
  fail(`presentation quality failed: expected 1-5 slides, got ${spec.slides.length}`);
}

for (const slide of spec.slides) {
  if (slide.title.length > 80) {
    fail(`presentation quality failed: slide title is too long: ${slide.slide_id}`);
  }

  if (slide.claims.length < 1 || slide.claims.length > 3) {
    fail(`presentation quality failed: expected 1-3 claims on ${slide.slide_id}`);
  }

  for (const claim of slide.claims) {
    if (claim.text.length > 180) {
      fail(`presentation quality failed: claim text is too long on ${slide.slide_id}`);
    }
  }
}

const knownFacts = new Set(normalized.facts.map((fact) => fact.fact_id));
const knownFactClaims = new Set(normalized.facts.map((fact) => fact.claim));

for (const slide of spec.slides) {
  for (const claim of slide.claims) {
    if (claim.fact_ids.length === 0) {
      fail(`traceability failed: claim has no fact_ids on ${slide.slide_id}`);
    }

    for (const factId of claim.fact_ids) {
      if (!knownFacts.has(factId)) {
        fail(`traceability failed: unknown fact_id ${factId}`);
      }
    }

    if (!knownFactClaims.has(claim.text)) {
      fail(`hallucination resistance failed: claim text is not present in normalized facts: ${claim.text}`);
    }
  }
}

const claimMapKeys = new Set(claimMap.claims.map((claim) => `${claim.slide_id}:${claim.claim_text}`));
for (const slide of spec.slides) {
  for (const claim of slide.claims) {
    if (!claimMapKeys.has(`${slide.slide_id}:${claim.text}`)) {
      fail(`traceability failed: claim missing from claim map on ${slide.slide_id}`);
    }
  }
}

const specText = JSON.stringify(spec).toLowerCase();
for (const instruction of inputPackage.instructions ?? []) {
  if (specText.includes(instruction.toLowerCase())) {
    fail(`prompt-injection guard failed: instruction leaked into PresentationSpec: ${instruction}`);
  }
}

if (normalized.untrusted_instruction_count !== (inputPackage.instructions ?? []).length) {
  fail("prompt-injection guard failed: untrusted instruction count does not match input instructions");
}

const unsupportedFacts = unsupportedResult.presentation_spec.slides.flatMap((slide) =>
  slide.claims.flatMap((claim) => claim.fact_ids.filter((factId) => !knownFacts.has(factId))),
);

if (!unsupportedFacts.includes("FACT-999")) {
  fail("negative hallucination fixture does not contain FACT-999");
}

console.log("eval pack validation passed");
