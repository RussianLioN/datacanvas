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

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const mapPath = "docs/process/audits/external-blocker-closure-map.json";
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const schema = readJson("schemas/external-blocker-closure-map.schema.json");
const closureMap = readJson(mapPath);
const validate = ajv.compile(schema);
if (!validate(closureMap)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("external blocker closure map does not match schema");
}

const completionAudit = readJson(closureMap.source_audit_path);
const auditBlockers = new Set(completionAudit.blocking_external_evidence);
const mappedBlockers = new Set(closureMap.blockers.map((blocker) => blocker.blocking_evidence));

if (closureMap.status === "ready_to_collect_external_evidence") {
  for (const blocker of auditBlockers) {
    if (!mappedBlockers.has(blocker)) {
      fail(`completion audit blocker is missing from closure map: ${blocker}`);
    }
  }
}
if (closureMap.status === "external_evidence_collected" && auditBlockers.size !== 0) {
  fail("collected closure map requires empty completion audit blockers");
}

for (const blocker of closureMap.blockers) {
  if (closureMap.status === "ready_to_collect_external_evidence" && !auditBlockers.has(blocker.blocking_evidence)) {
    fail(`closure map blocker is not present in completion audit: ${blocker.blocking_evidence}`);
  }
  if (closureMap.status === "ready_to_collect_external_evidence" && blocker.status !== "pending_external") {
    fail(`closure map blocker must remain pending_external: ${blocker.blocking_evidence}`);
  }
  if (closureMap.status === "external_evidence_collected" && blocker.status !== "closed") {
    fail(`closure map blocker must be closed after collection: ${blocker.blocking_evidence}`);
  }
  if (closureMap.status === "ready_to_collect_external_evidence" && blocker.blocking_evidence !== "commit-sha-and-pr-evidence" && exists(blocker.blocking_evidence)) {
    fail(`external blocker file exists but closure map still marks it pending: ${blocker.blocking_evidence}`);
  }
  for (const artifact of blocker.supporting_artifacts) {
    if (!exists(artifact)) {
      fail(`supporting artifact does not exist for ${blocker.blocking_evidence}: ${artifact}`);
    }
  }
}

const packageJson = readJson("package.json");
const scripts = packageJson.scripts || {};
for (const command of closureMap.validation_commands) {
  if (command === "npm test") {
    if (!scripts.test) {
      fail("package.json is missing test script");
    }
    continue;
  }
  if (!command.startsWith("npm run ")) {
    fail(`unsupported validation command format: ${command}`);
  }
  const scriptName = command.slice("npm run ".length).split(" ")[0];
  if (!scripts[scriptName]) {
    fail(`package.json is missing script for validation command: ${command}`);
  }
}

const report = readText("docs/process/audits/external-blocker-closure-map.md");
for (const blocker of closureMap.blockers) {
  if (!report.includes(blocker.blocking_evidence) && blocker.blocking_evidence !== "commit-sha-and-pr-evidence") {
    fail(`closure map report is missing evidence: ${blocker.blocking_evidence}`);
  }
}

console.log("external blocker closure map validation passed");
