import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function buildTraceability(riskRegistry, traceabilityMatrix, providerEvalDelta, evidenceMap) {
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

  return {
    version: riskRegistry.version,
    links: riskRegistry.risks.map((risk) => {
      const traceabilityRequirementIds = traceLinksByRisk.get(risk.id) ?? [];
      const nfrIds = traceabilityRequirementIds.filter((requirementId) => requirementId.startsWith("NFR-"));
      const evalCaseIds = evalCasesByRisk.get(risk.id) ?? [];
      const evidencePaths = evidenceByRisk.get(risk.id) ?? [];

      if (traceabilityRequirementIds.length === 0) {
        fail(`risk is missing from traceability matrix: ${risk.id}`);
      }

      if (nfrIds.length === 0) {
        fail(`risk is not linked to an NFR requirement: ${risk.id}`);
      }

      if (evalCaseIds.length === 0) {
        fail(`risk is missing provider eval case: ${risk.id}`);
      }

      if (evidencePaths.length === 0) {
        fail(`risk is missing evidence paths: ${risk.id}`);
      }

      for (const evidencePath of evidencePaths) {
        if (!fs.existsSync(path.join(root, evidencePath))) {
          fail(`risk evidence path does not exist: ${evidencePath}`);
        }
      }

      return {
        risk_id: risk.id,
        nfr_ids: [...new Set(nfrIds)].sort(),
        traceability_requirement_ids: [...new Set(traceabilityRequirementIds)].sort(),
        eval_case_ids: [...new Set(evalCaseIds)].sort(),
        evidence_paths: evidencePaths,
      };
    }),
  };
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const riskRegistry = readJson("docs/architecture/risks/risk-registry.json");
const traceabilityMatrix = readJson("docs/product/requirements/traceability-matrix.json");
const providerEvalDelta = readJson("tests/evals/provider-specific-eval-delta.json");
const evidenceMap = readJson("docs/architecture/risks/risk-evidence-map.json");
const riskTraceability = readJson("docs/architecture/risks/risk-traceability.json");
const evidenceMapSchema = readJson("schemas/risk-evidence-map.schema.json");
const riskTraceabilitySchema = readJson("schemas/risk-traceability.schema.json");

const validateEvidenceMap = ajv.compile(evidenceMapSchema);
if (!validateEvidenceMap(evidenceMap)) {
  console.error(JSON.stringify(validateEvidenceMap.errors, null, 2));
  fail("risk evidence map does not match schema");
}

const validateRiskTraceability = ajv.compile(riskTraceabilitySchema);
if (!validateRiskTraceability(riskTraceability)) {
  console.error(JSON.stringify(validateRiskTraceability.errors, null, 2));
  fail("risk traceability does not match schema");
}

const expectedTraceability = buildTraceability(riskRegistry, traceabilityMatrix, providerEvalDelta, evidenceMap);
if (JSON.stringify(riskTraceability) !== JSON.stringify(expectedTraceability)) {
  fail("risk-traceability.json is not generated from current source artifacts");
}

console.log("risk traceability source validation passed");
