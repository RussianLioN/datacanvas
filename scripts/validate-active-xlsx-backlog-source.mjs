import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJsonPath = "package.json";
const registryPath = "docs/product/sources/product-source-registry.json";
const currentSourceId = "SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-19";
const legacySourceId = "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08";
const historicalSourceId = "SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-17";
const currentValidationScript = "validate:xlsx-backlog-2026-08-19";
const legacyValidationScript = "validate:xlsx-backlog-2026-07-08";
const historicalValidationScript = "validate:xlsx-backlog-2026-08-17";
const currentDownstreamUses = new Set([
  "business_requirements_accepted",
  "cascade_synchronization",
  "current_2026_scope",
  "draft_effort_estimation",
  "owner_approved_priority_source",
  "q4_resource_planning_input",
  "sprint_planning_input",
  "system_requirements_candidate",
  "team_refinement_input",
  "user_stories_candidate",
]);

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
const commonValidationScript = scripts["validate:xlsx-backlog"] ?? "";
const current = registry.sources?.find((source) => source.source_id === currentSourceId);
const legacy = registry.sources?.find((source) => source.source_id === legacySourceId);
const historical = registry.sources?.find((source) => source.source_id === historicalSourceId);

function assertHistoricalSource(source, { sourceId, expectedLifecycle, expectedTrustLevel, expectedVerifierCommand }) {
  if (!source) {
    fail(`historical XLSX source is missing from registry: ${sourceId}`);
  }
  if (source.lifecycle !== expectedLifecycle || source.trust_level !== expectedTrustLevel) {
    fail(`${source.effective_date} XLSX source must remain historical: ${sourceId}`);
  }
  if (source.verifier_command !== expectedVerifierCommand) {
    fail(`${source.effective_date} XLSX source must keep its dedicated historical verifier`);
  }
  if (source.verifier_command === "npm run validate:xlsx-backlog") {
    fail(`${source.effective_date} XLSX source must not use the current validate:xlsx-backlog entry`);
  }
  const forbiddenUses = (source.allowed_downstream_use ?? []).filter((downstreamUse) =>
    currentDownstreamUses.has(downstreamUse)
  );
  if (forbiddenUses.length > 0) {
    fail(`${source.effective_date} XLSX source must not allow current downstream use: ${forbiddenUses.join(", ")}`);
  }
}

if (!commonValidationScript.includes(`npm run ${currentValidationScript}`)) {
  fail(`validate:xlsx-backlog must call ${currentValidationScript}`);
}

if (commonValidationScript.includes(`npm run ${historicalValidationScript}`)) {
  fail(`validate:xlsx-backlog must not call historical ${historicalValidationScript}`);
}

if (/2026-08-17/u.test(commonValidationScript)) {
  fail("validate:xlsx-backlog must not reference historical 2026-08-17");
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

assertHistoricalSource(legacy, {
  sourceId: legacySourceId,
  expectedLifecycle: "historical",
  expectedTrustLevel: "historical",
  expectedVerifierCommand: `npm run ${legacyValidationScript}`,
});
assertHistoricalSource(historical, {
  sourceId: historicalSourceId,
  expectedLifecycle: "superseded",
  expectedTrustLevel: "superseded_by_co_acceptance",
  expectedVerifierCommand: `npm run ${historicalValidationScript}`,
});

console.log("Active XLSX backlog source validation passed");
