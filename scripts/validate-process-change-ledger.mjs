import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

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

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

const ledgerPath = "docs/process/current/process-change-ledger.json";
const ledger = readJson(ledgerPath);
const schema = readJson("schemas/process-change-ledger.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

if (!validate(ledger)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("process change ledger does not match schema");
}

requireFile(ledger.source_plan);
requireFile(ledger.changelog_path);

const changelog = readText(ledger.changelog_path);
const packageJson = readJson("package.json");
const availableScripts = packageJson.scripts ?? {};
const seen = new Set();

for (const entry of ledger.entries) {
  if (seen.has(entry.process_change_id)) {
    fail(`duplicate process change ledger entry: ${entry.process_change_id}`);
  }
  seen.add(entry.process_change_id);
  requireFile(entry.pcr_path);
  for (const artifactPath of entry.affected_artifacts) {
    requireFile(artifactPath);
  }
  if (!changelog.includes(entry.changelog_anchor)) {
    fail(`process changelog is missing anchor: ${entry.changelog_anchor}`);
  }

  const pcrText = readText(entry.pcr_path);
  if (!pcrText.includes(`ID: \`${entry.process_change_id}\``) && !pcrText.includes(`# ${entry.process_change_id}`)) {
    fail(`PCR markdown does not include id: ${entry.process_change_id}`);
  }
  if (entry.status === "accepted" && !pcrText.includes("accepted")) {
    fail(`accepted PCR markdown must include accepted status: ${entry.process_change_id}`);
  }
  if (entry.decision === "accept" && !pcrText.includes("Статус решения: accepted")) {
    fail(`accepted PCR markdown must include accepted decision: ${entry.process_change_id}`);
  }

  for (const command of entry.validation_commands) {
    if (!command.startsWith("npm run ") && command !== "npm test") {
      fail(`unsupported validation command format: ${command}`);
    }
    if (command.startsWith("npm run ")) {
      const scriptName = command.slice("npm run ".length);
      if (!(scriptName in availableScripts)) {
        fail(`validation command references missing npm script: ${command}`);
      }
    }
  }
}

if (!ledger.entries.some((entry) => entry.process_change_id === "PROC-035" && entry.status === "accepted")) {
  fail("ledger must include accepted PROC-035 managed improvement");
}

console.log("process change ledger validation passed");
