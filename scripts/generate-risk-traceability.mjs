import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const riskRegistry = readJson("docs/architecture/risks/risk-registry.json");
const traceabilityMatrix = readJson("docs/product/requirements/traceability-matrix.json");
const providerEvalDelta = readJson("tests/evals/provider-specific-eval-delta.json");
const evidenceMap = readJson("docs/architecture/risks/risk-evidence-map.json");

const risks = riskRegistry.risks.map((risk) => risk.id);
const traceLinksByRisk = new Map();
const evalCasesByRisk = new Map();
const evidenceByRisk = new Map();

for (const link of traceabilityMatrix.links) {
  for (const riskId of link.risks ?? []) {
    if (!traceLinksByRisk.has(riskId)) {
      traceLinksByRisk.set(riskId, []);
    }

    traceLinksByRisk.get(riskId).push(link.requirement_id);
  }
}

for (const testCase of providerEvalDelta.cases) {
  if (!evalCasesByRisk.has(testCase.linked_risk)) {
    evalCasesByRisk.set(testCase.linked_risk, []);
  }

  evalCasesByRisk.get(testCase.linked_risk).push(testCase.id);
}

for (const item of evidenceMap.items) {
  if (evidenceByRisk.has(item.risk_id)) {
    fail(`duplicate risk in evidence map: ${item.risk_id}`);
  }

  evidenceByRisk.set(item.risk_id, item.evidence_paths);
}

const links = risks.map((riskId) => {
  const traceabilityRequirementIds = traceLinksByRisk.get(riskId) ?? [];
  const nfrIds = traceabilityRequirementIds.filter((requirementId) => requirementId.startsWith("NFR-"));
  const evalCaseIds = evalCasesByRisk.get(riskId) ?? [];
  const evidencePaths = evidenceByRisk.get(riskId) ?? [];

  if (traceabilityRequirementIds.length === 0) {
    fail(`risk is missing from traceability matrix: ${riskId}`);
  }

  if (nfrIds.length === 0) {
    fail(`risk is not linked to an NFR requirement: ${riskId}`);
  }

  if (evalCaseIds.length === 0) {
    fail(`risk is missing provider eval case: ${riskId}`);
  }

  if (evidencePaths.length === 0) {
    fail(`risk is missing evidence paths: ${riskId}`);
  }

  return {
    risk_id: riskId,
    nfr_ids: [...new Set(nfrIds)].sort(),
    traceability_requirement_ids: [...new Set(traceabilityRequirementIds)].sort(),
    eval_case_ids: [...new Set(evalCaseIds)].sort(),
    evidence_paths: evidencePaths,
  };
});

const traceability = {
  version: riskRegistry.version,
  links,
};

writeJson("docs/architecture/risks/risk-traceability.json", traceability);
console.log("generated docs/architecture/risks/risk-traceability.json");
