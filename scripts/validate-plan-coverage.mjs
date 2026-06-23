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

const audit = readJson("docs/process/audits/datacanvas-plan-coverage-audit.json");
const schema = readJson("schemas/plan-coverage-audit.schema.json");
const report = readText("docs/process/audits/datacanvas-plan-coverage-report.md");
const plan = readText(audit.source_plan);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateAudit = ajv.compile(schema);
if (!validateAudit(audit)) {
  console.error(JSON.stringify(validateAudit.errors, null, 2));
  fail("plan coverage audit does not match schema");
}

const sectionNumbers = new Set();
for (const section of audit.sections) {
  if (sectionNumbers.has(section.number)) {
    fail(`duplicate plan section in audit: ${section.number}`);
  }

  sectionNumbers.add(section.number);

  if (!plan.includes(`## ${section.number}. ${section.title}`)) {
    fail(`plan source does not contain audited section: ${section.number}. ${section.title}`);
  }

  if (!report.includes(`| ${section.number} | ${section.title} | ${section.status} |`)) {
    fail(`human-readable report is missing section row: ${section.number}`);
  }

  for (const evidencePath of section.evidence_paths) {
    if (!fs.existsSync(path.join(root, evidencePath))) {
      fail(`plan coverage evidence path does not exist: ${evidencePath}`);
    }
  }
}

for (let sectionNumber = 1; sectionNumber <= 17; sectionNumber += 1) {
  if (!sectionNumbers.has(sectionNumber)) {
    fail(`plan coverage audit is missing section: ${sectionNumber}`);
  }
}

if (!audit.sections.some((section) => section.status === "partial")) {
  fail("plan coverage audit must expose remaining gaps while objective is active");
}

console.log("plan coverage validation passed");
