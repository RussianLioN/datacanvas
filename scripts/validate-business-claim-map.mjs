import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const schemaPath = "schemas/business-claim-map.schema.json";
const claimMapPath = "docs/product/requirements/business-claim-map.json";

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
    throw new Error(`required file is missing: ${relativePath}`);
  }
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function assertUnique(items, selector, label) {
  const seen = new Set();
  for (const item of items) {
    const key = selector(item);
    if (seen.has(key)) {
      throw new Error(`duplicate ${label}: ${key}`);
    }
    seen.add(key);
  }
}

try {
  requireFile(schemaPath);
  requireFile(claimMapPath);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(readJson(schemaPath));
  const claimMap = readJson(claimMapPath);
  if (!validate(claimMap)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    throw new Error(`${claimMapPath} does not match ${schemaPath}`);
  }

  requireFile(claimMap.source_registry_path);
  const sourceRegistry = readJson(claimMap.source_registry_path);
  const sourcesById = new Map(sourceRegistry.sources.map((source) => [source.source_id, source]));
  assertUnique(claimMap.claims, (claim) => claim.claim_id, "business claim");

  for (const requiredClaimId of [
    "BCLM-CO-2026-001-PRIORITY",
    "BCLM-CO-2026-002-P1-MAIN-ROUTE",
    "BCLM-CO-2026-002-EMAIL-RESULT",
    "BCLM-CO-2026-002-P2-LINK-DELIVERY",
  ]) {
    if (!claimMap.claims.some((claim) => claim.claim_id === requiredClaimId)) {
      throw new Error(`business claim map is missing required claim: ${requiredClaimId}`);
    }
  }

  for (const claim of claimMap.claims) {
    const precedenceSource = sourcesById.get(claim.precedence_source_id);
    if (!precedenceSource) {
      throw new Error(`claim references unknown precedence source: ${claim.claim_id}/${claim.precedence_source_id}`);
    }
    if (!["accepted_current", "current"].includes(precedenceSource.trust_level)) {
      throw new Error(`claim precedence source is not current enough: ${claim.claim_id}/${claim.precedence_source_id}`);
    }
    for (const sourceId of claim.supporting_source_ids) {
      if (!sourcesById.has(sourceId)) {
        throw new Error(`claim references unknown supporting source: ${claim.claim_id}/${sourceId}`);
      }
    }
    for (const artifactPath of claim.affected_artifacts) {
      requireFile(artifactPath);
    }
    for (const downstream of claim.expected_downstream_fragments) {
      requireFile(downstream.artifact_path);
      const text = readText(downstream.artifact_path);
      for (const fragment of downstream.fragments) {
        if (!text.includes(fragment)) {
          throw new Error(`claim ${claim.claim_id} is not reflected in ${downstream.artifact_path}: ${fragment}`);
        }
      }
    }
  }

  const co002Claims = claimMap.claims.filter((claim) => claim.precedence_source_id === "SRC-DC-CO-2026-002");
  if (co002Claims.length < 3) {
    throw new Error("CO-2026-002 must have separate claims for main route, email result and link delivery");
  }

  console.log("business claim map validation passed");
} catch (error) {
  fail(error.message);
}
