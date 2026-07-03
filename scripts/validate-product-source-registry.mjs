import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const schemaPath = "schemas/product-source-registry.schema.json";
const registryPath = "docs/product/sources/product-source-registry.json";
const consistencyMode = process.argv.includes("--consistency");

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

function assertNoSensitivePointers(value, location) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitivePointers(item, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assertNoSensitivePointers(child, `${location}.${key}`);
    }
    return;
  }
  if (typeof value !== "string") {
    return;
  }
  if (value.includes("/Users/") || value.includes("file://")) {
    throw new Error(`sensitive local pointer is forbidden in ${location}`);
  }
}

try {
  requireFile(schemaPath);
  requireFile(registryPath);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);

  const validate = ajv.compile(readJson(schemaPath));
  const registry = readJson(registryPath);
  if (!validate(registry)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${registryPath} does not match ${schemaPath}`);
  }

  assertNoSensitivePointers(registry, registryPath);

  const ids = new Set();
  const paths = new Set();
  for (const source of registry.sources) {
    if (ids.has(source.source_id)) {
      throw new Error(`duplicate source_id: ${source.source_id}`);
    }
    ids.add(source.source_id);
    paths.add(source.path);
    requireFile(source.path);
    for (const artifactPath of source.affected_artifacts) {
      requireFile(artifactPath);
    }
    if (source.trust_level === "needs_revision" && source.lifecycle === "accepted" && !source.upstream_decision) {
      throw new Error(`needs_revision accepted source must reference upstream decision: ${source.source_id}`);
    }
  }

  const requiredSources = [
    "SRC-DC-CO-2026-001",
    "SRC-DC-PRODUCT-VISION-CURRENT",
    "SRC-DC-STORIES-CATALOG",
    "SRC-DC-BMC-CURRENT",
    "SRC-DC-REQUIREMENTS-BUSINESS",
    "SRC-DC-ANALYSIS-BA",
    "SRC-DC-SYSTEM-ANALYSIS",
    "SRC-DC-CASCADE-2026-07-02",
  ];
  for (const sourceId of requiredSources) {
    if (!ids.has(sourceId)) {
      throw new Error(`required product source is missing: ${sourceId}`);
    }
  }

  if (consistencyMode) {
    const roleOrder = new Set(registry.precedence_order);
    for (const source of registry.sources) {
      if (!roleOrder.has(source.source_role)) {
        throw new Error(`source_role missing from precedence_order: ${source.source_id}/${source.source_role}`);
      }
    }
    const currentVision = registry.sources.find((source) => source.source_id === "SRC-DC-PRODUCT-VISION-CURRENT");
    if (currentVision?.trust_level !== "current") {
      throw new Error("current Vision must have current trust level");
    }
    const historicalCascade = registry.sources.find((source) => source.source_id === "SRC-DC-CASCADE-2026-07-02");
    if (historicalCascade?.lifecycle !== "historical" || historicalCascade?.trust_level !== "superseded_by_co_acceptance") {
      throw new Error("2026-07-02 cascade run must be marked historical and superseded by CO acceptance");
    }
    for (const requiredPath of [
      "docs/product-vision.md",
      "docs/stories.md",
      "docs/product/change-orders/co-2026-001-a2a-first-priority.md",
      "docs/product/bmc/bmc-v0.2.md",
      "docs/product/requirements/business-requirements.md",
      "docs/product/analysis/ba/ba-spec.json",
      "docs/architecture/system-analysis/sa-spec.json",
    ]) {
      if (!paths.has(requiredPath)) {
        throw new Error(`required path is missing from source registry: ${requiredPath}`);
      }
    }
  }

  console.log(consistencyMode ? "product source consistency validation passed" : "product source registry validation passed");
} catch (error) {
  fail(error.message);
}
