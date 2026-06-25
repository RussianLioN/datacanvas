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

const manifest = readJson("docs/architecture/security/security-foundation-manifest.json");
const schema = readJson("schemas/security-foundation-manifest.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateManifest = ajv.compile(schema);
if (!validateManifest(manifest)) {
  console.error(JSON.stringify(validateManifest.errors, null, 2));
  fail("security foundation manifest does not match schema");
}

for (const artifact of manifest.required_artifacts) {
  if (!fs.existsSync(path.join(root, artifact.path))) {
    fail(`missing security artifact: ${artifact.path}`);
  }
}

const dataClassification = readText("docs/architecture/security/data-classification-policy.md");
for (const dataClass of ["public", "internal", "confidential", "pii", "secret"]) {
  if (!dataClassification.includes(dataClass)) {
    fail(`data classification policy is missing class: ${dataClass}`);
  }
}

const threatModel = readText("docs/architecture/security/threat-model.md");
for (const requiredRisk of ["Prompt injection", "Sensitive information disclosure", "Excessive agency"]) {
  if (!threatModel.includes(requiredRisk)) {
    fail(`threat model is missing required risk: ${requiredRisk}`);
  }
}

const delta = readText("docs/sprints/2026-W26-security-foundation-pack/threat-model-delta.md");
if (!delta.includes("SPRINT-2026-W26-S21") || !delta.includes("secret scan gate")) {
  fail("threat model delta does not link S21 to secret scan gate");
}

const exportChecklist = readText("docs/architecture/security/export-sanitization-checklist.md");
for (const item of ["Нет secrets", "Нет PII", "Нет raw traces", "Нет internal prompts"]) {
  if (!exportChecklist.includes(item)) {
    fail(`export sanitization checklist is missing item: ${item}`);
  }
}

const incidentResponse = readText("docs/architecture/security/incident-response.md");
for (const item of ["Остановить приемку", "Зафиксировать evidence", "Создать security defect", "Обновить threat model delta"]) {
  if (!incidentResponse.includes(item)) {
    fail(`incident response is missing action: ${item}`);
  }
}

const allowlist = readText("docs/architecture/security/tool-allowlist.yaml");
if (!allowlist.includes("default_policy: deny")) {
  fail("tool allowlist must remain deny-by-default");
}

for (const gate of manifest.required_gates) {
  const command = gate.replace("npm run ", "");
  const packageJson = readJson("package.json");
  if (!packageJson.scripts[command]) {
    fail(`security foundation gate is missing package script: ${gate}`);
  }
}

console.log("security foundation validation passed");
