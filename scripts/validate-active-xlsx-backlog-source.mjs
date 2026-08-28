import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJsonPath = "package.json";
const registryPath = "docs/product/sources/product-source-registry.json";
const currentSourceId = "SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-19";
const historicalSourceId = "SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-17";
const currentValidationScript = "validate:xlsx-backlog-2026-08-19";
const historicalValidationScript = "validate:xlsx-backlog-2026-08-17";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const packageJson = readJson(packageJsonPath);
const scripts = packageJson.scripts ?? {};
const registry = readJson(registryPath);
const current = registry.sources?.find((source) => source.source_id === currentSourceId);
const historical = registry.sources?.find((source) => source.source_id === historicalSourceId);

if (!scripts["validate:xlsx-backlog"]?.includes(`npm run ${currentValidationScript}`)) {
  fail(`validate:xlsx-backlog must call ${currentValidationScript}`);
}

if (scripts["validate:xlsx-backlog"]?.includes(`npm run ${historicalValidationScript}`)) {
  fail(`validate:xlsx-backlog must not call historical ${historicalValidationScript}`);
}

if (!current) {
  fail(`active XLSX source is missing from registry: ${currentSourceId}`);
}

if (current.lifecycle !== "active" || current.trust_level !== "accepted_current") {
  fail(`active XLSX source must be active and accepted_current: ${currentSourceId}`);
}

if (current.effective_date !== "2026-08-19") {
  fail(`active XLSX source must use effective_date 2026-08-19: ${currentSourceId}`);
}

if (current.verifier_command !== `npm run ${currentValidationScript}`) {
  fail(`active XLSX source must use verifier_command npm run ${currentValidationScript}`);
}

if (!current.path?.endsWith("datacanvas-backlog-draft-pshe-2026-08-19.xlsx")) {
  fail(`active XLSX source path must point to the 2026-08-19 working workbook: ${currentSourceId}`);
}

if (!historical) {
  fail(`historical XLSX source is missing from registry: ${historicalSourceId}`);
}

if (historical.lifecycle !== "superseded" || historical.trust_level !== "superseded_by_co_acceptance") {
  fail(`2026-08-17 XLSX source must remain superseded historical material: ${historicalSourceId}`);
}

if (historical.verifier_command !== `npm run ${historicalValidationScript}`) {
  fail(`2026-08-17 XLSX source must keep its dedicated historical verifier`);
}

console.log("Active XLSX backlog source validation passed");
