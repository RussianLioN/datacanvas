import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const packageRoot = "docs/process/prompt-only-artifact-review";
const catalogPath = `${packageRoot}/artifact-link-catalog.json`;
const statePath = `${packageRoot}/artifact-review-session-state.json`;
const runbookPath = `${packageRoot}/prompt-only-runbook.md`;
const ledgerPath = `${packageRoot}/artifact-edit-decision-ledger.md`;
const readmePath = `${packageRoot}/README.md`;

const requiredFiles = [
  readmePath,
  runbookPath,
  catalogPath,
  statePath,
  ledgerPath,
  "schemas/prompt-only-artifact-link-catalog.schema.json",
  "schemas/prompt-only-artifact-review-session-state.schema.json",
  "scripts/validate-prompt-only-artifact-review.mjs",
];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

function validateWithSchema(schemaPath, dataPath, label) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(readJson(schemaPath));
  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${label} does not match schema`);
  }
  return data;
}

function allArtifacts(group) {
  return [
    ...group.source_artifacts,
    ...group.derived_artifacts,
    ...group.evidence_artifacts,
    ...group.navigation_artifacts,
  ];
}

function walk(value, visitor, key = "") {
  if (Array.isArray(value)) {
    for (const item of value) {
      walk(item, visitor, key);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      walk(childValue, visitor, childKey);
    }
    return;
  }
  visitor(key, value);
}

function requireNoAbsolutePersistedPaths(label, data) {
  walk(data, (key, value) => {
    if (typeof value !== "string") {
      return;
    }
    const isPathKey = /(^|_)(path|paths)$/.test(key) || key === "$schema";
    if (isPathKey && (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value) || value.includes("file://"))) {
      fail(`${label} contains absolute persisted path: ${value}`);
    }
  });
}

function requireTextDoesNotContainForbiddenProductRules(relativePath) {
  const text = readText(relativePath).toLowerCase();
  const forbiddenTokenSets = [
    [
      "отправке",
      "презентац",
    ],
    [
      "отправку",
      "презентац",
    ],
    [
      "подготовке",
      "отправке",
    ],
    [
      "режим",
      "лисы",
    ],
    [
      "режиме",
      "лисы",
    ],
    [
      "запуск",
      "другим",
      "агентом",
    ],
  ];
  for (const tokens of forbiddenTokenSets) {
    if (tokens.every((token) => text.includes(token))) {
      fail(`${relativePath} contains product-specific workflow rule tokens: ${tokens.join(" + ")}`);
    }
  }
}

for (const filePath of requiredFiles) {
  requireFile(filePath);
}

const catalog = validateWithSchema(
  "schemas/prompt-only-artifact-link-catalog.schema.json",
  catalogPath,
  "prompt-only artifact link catalog",
);
const state = validateWithSchema(
  "schemas/prompt-only-artifact-review-session-state.schema.json",
  statePath,
  "prompt-only artifact review session state",
);

requireNoAbsolutePersistedPaths("catalog", catalog);
requireNoAbsolutePersistedPaths("state", state);

if (catalog.workflow_id !== state.workflow_id) {
  fail("workflow_id mismatch between catalog and session state");
}

if (state.scope.catalog_path !== catalogPath || state.scope.runbook_path !== runbookPath || state.scope.ledger_path !== ledgerPath) {
  fail("session state scope does not point to the prompt-only package files");
}

const packageTexts = [readmePath, runbookPath, ledgerPath];
for (const filePath of packageTexts) {
  requireTextDoesNotContainForbiddenProductRules(filePath);
}

const runbook = readText(runbookPath);
const requiredRunbookFragments = [
  "Запусти prompt-only процесс согласования",
  "Агент не принимает продуктовые решения",
  "Generated artifacts",
  "В сохраняемых файлах используются только относительные пути",
];
for (const fragment of requiredRunbookFragments) {
  if (!runbook.includes(fragment)) {
    fail(`runbook is missing required fragment: ${fragment}`);
  }
}

const readme = readText(readmePath);
if (!readme.includes("Workflow не принимает продуктовые решения")) {
  fail("README must state the product-decision boundary");
}
if (!readme.includes("npm run validate:prompt-only-artifact-review")) {
  fail("README must expose the profile validation command");
}

const ledger = readText(ledgerPath);
if (!ledger.includes("Открытых правок нет")) {
  fail("decision ledger must state there are no open edits in the initial state");
}

const groupIds = new Set(catalog.artifact_groups.map((group) => group.group_id));
for (const groupId of catalog.review_sequence) {
  if (!groupIds.has(groupId)) {
    fail(`review_sequence points to missing group: ${groupId}`);
  }
}

const knownCatalogPaths = new Set();
for (const group of catalog.artifact_groups) {
  for (const artifact of allArtifacts(group)) {
    requireFile(artifact.path);
    knownCatalogPaths.add(artifact.path);
    if (artifact.edit_policy === "generated_readonly") {
      if (!artifact.source_path || !artifact.generator_command) {
        fail(`generated artifact must have source_path and generator_command: ${artifact.path}`);
      }
      requireFile(artifact.source_path);
    }
  }
}

for (const linkSet of state.displayed_link_sets) {
  if (!groupIds.has(linkSet.group_id)) {
    fail(`state displayed link set points to missing group: ${linkSet.group_id}`);
  }
  for (const artifactPath of linkSet.artifact_paths) {
    if (!knownCatalogPaths.has(artifactPath)) {
      fail(`state displayed link set path is missing from catalog: ${artifactPath}`);
    }
  }
}

const bmcGroup = catalog.artifact_groups.find((group) => group.group_id === "business-model-canvas");
if (!bmcGroup) {
  fail("catalog must include business-model-canvas group");
}

const requiredBmcDerived = new Set([
  "docs/product/bmc/source/derived/datacanvas-bmc.puml",
  "docs/product/bmc/source/derived/datacanvas-bmc.svg",
  "docs/product/bmc/source/derived/datacanvas-bmc.png",
  "docs/product/bmc/source/derived/datacanvas-bmc.pdf",
]);
const bmcDerivedPaths = new Set(bmcGroup.derived_artifacts.map((artifact) => artifact.path));
for (const requiredPath of requiredBmcDerived) {
  if (!bmcDerivedPaths.has(requiredPath)) {
    fail(`BMC derived artifact is missing from catalog: ${requiredPath}`);
  }
}

for (const artifact of bmcGroup.derived_artifacts) {
  if (artifact.edit_policy !== "generated_readonly") {
    fail(`BMC derived artifact must be generated_readonly: ${artifact.path}`);
  }
}

const packageJson = readJson("package.json");
if (packageJson.scripts["validate:prompt-only-artifact-review"] !== "node scripts/validate-prompt-only-artifact-review.mjs") {
  fail("package.json is missing validate:prompt-only-artifact-review script");
}
if (!packageJson.scripts.test.includes("npm run validate:prompt-only-artifact-review")) {
  fail("npm test must include validate:prompt-only-artifact-review");
}

const navigationSource = readJson("docs/navigation/navigation-source.json");
const managedPaths = new Set(navigationSource.managed_entries.map((entry) => entry.path));
for (const filePath of [readmePath, runbookPath, catalogPath, statePath, ledgerPath]) {
  if (!managedPaths.has(filePath)) {
    fail(`navigation source managed_entries is missing prompt-only path: ${filePath}`);
  }
}

const registry = readJson("docs/architecture/schemas/artifact-registry.json");
const registryPaths = new Set(registry.artifacts.map((artifact) => artifact.path));
for (const filePath of requiredFiles) {
  if (!registryPaths.has(filePath)) {
    fail(`artifact registry is missing prompt-only artifact: ${filePath}`);
  }
}

console.log("prompt-only artifact review validation passed");
