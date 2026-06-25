import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const riskRegistry = readJson("docs/architecture/risks/risk-registry.json");
const riskEvidenceMap = readJson("docs/architecture/risks/risk-evidence-map.json");
const riskTraceability = readJson("docs/architecture/risks/risk-traceability.json");
const riskEvidenceMapSchema = readJson("schemas/risk-evidence-map.schema.json");
const riskTraceabilitySchema = readJson("schemas/risk-traceability.schema.json");
const traceabilityMatrix = readJson("docs/product/requirements/traceability-matrix.json");
const report = readText("docs/architecture/risks/risk-matrix.md");

const validateRiskEvidenceMap = ajv.compile(riskEvidenceMapSchema);
if (!validateRiskEvidenceMap(riskEvidenceMap)) {
  console.error(JSON.stringify(validateRiskEvidenceMap.errors, null, 2));
  fail("risk evidence map does not match schema");
}

const validateRiskTraceability = ajv.compile(riskTraceabilitySchema);
if (!validateRiskTraceability(riskTraceability)) {
  console.error(JSON.stringify(validateRiskTraceability.errors, null, 2));
  fail("risk traceability does not match schema");
}

const registryIds = new Set(riskRegistry.risks.map((risk) => risk.id));
const traceabilityIds = new Set(riskTraceability.links.map((link) => link.risk_id));
const traceByRequirement = new Map(traceabilityMatrix.links.map((link) => [link.requirement_id, link]));

for (const riskId of registryIds) {
  if (!traceabilityIds.has(riskId)) {
    fail(`risk registry item is missing from risk traceability: ${riskId}`);
  }

  if (!report.includes(`\`${riskId}\``)) {
    fail(`risk matrix report is missing risk: ${riskId}`);
  }
}

for (const link of riskTraceability.links) {
  if (!registryIds.has(link.risk_id)) {
    fail(`risk traceability references unknown risk: ${link.risk_id}`);
  }

  for (const requirementId of link.traceability_requirement_ids) {
    const traceabilityLink = traceByRequirement.get(requirementId);
    if (!traceabilityLink) {
      fail(`risk traceability references missing requirement: ${requirementId}`);
    }

    if (!traceabilityLink.risks?.includes(link.risk_id)) {
      fail(`traceability matrix does not link ${requirementId} to ${link.risk_id}`);
    }
  }

  for (const nfrId of link.nfr_ids) {
    if (!report.includes(`\`${nfrId}\``)) {
      fail(`risk matrix report is missing NFR: ${nfrId}`);
    }
  }

  for (const evidencePath of link.evidence_paths) {
    if (!fs.existsSync(path.join(root, evidencePath))) {
      fail(`risk traceability evidence path does not exist: ${evidencePath}`);
    }

    if (!report.includes(`\`${evidencePath}\``)) {
      fail(`risk matrix report is missing evidence path: ${evidencePath}`);
    }
  }
}

console.log("risk matrix validation passed");
