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

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const schema = readJson("schemas/process-portability-pack.schema.json");
const pack = readJson("docs/process/portability/process-portability-pack.json");
const validate = ajv.compile(schema);

if (!validate(pack)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("process portability pack does not match schema");
}

requireFile(pack.source_process_version);
requireFile(pack.migration_notes_template_path);

for (const template of pack.reusable_templates) {
  requireFile(template.path);
}

if (pack.pilot_dependency.status !== "pending_external") {
  fail("process portability pack must keep pilot dependency pending before pilot report exists");
}

if (fs.existsSync(path.join(root, pack.pilot_dependency.pilot_report_path))) {
  fail("pilot report exists while portability pack still marks pilot dependency pending");
}

for (const command of ["npm run validate:process-portability", "npm run validate:bootstrap", "npm test"]) {
  if (!pack.validation_commands.includes(command)) {
    fail(`process portability pack is missing validation command: ${command}`);
  }
}

const migrationTemplate = readText(pack.migration_notes_template_path);
for (const requiredHeading of ["## Что Переносится Без Изменений", "## Что Требует Адаптации", "## Pilot Feedback", "## Решение"]) {
  if (!migrationTemplate.includes(requiredHeading)) {
    fail(`migration notes template is missing heading: ${requiredHeading}`);
  }
}

console.log("process portability validation passed");
