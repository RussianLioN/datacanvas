import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "docs/product/ux/real-uat-one-command-runner.json";

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

const manifest = readJson(manifestPath);
const schema = readJson("schemas/real-uat-one-command-runner.schema.json");
const validate = ajv.compile(schema);
if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("real UAT one-command runner manifest does not match schema");
}

for (const requiredPath of [
  "docs/product/ux/real-uat-one-command-runner.md",
  "scripts/run-real-uat-session.mjs",
  "artifacts/examples/review-runtime-interactive.html",
  "scripts/prepare-real-uat-session.mjs",
]) {
  requireFile(requiredPath);
}

const runnerSource = readText("scripts/run-real-uat-session.mjs");
for (const requiredText of [
  "/uat-export",
  "validate:real-uat-import",
  "prepare:real-uat-session",
  "recorded_real_user",
  "session_kind",
  "--force",
]) {
  if (!runnerSource.includes(requiredText)) {
    fail(`runner source is missing required text: ${requiredText}`);
  }
}

const check = spawnSync("node", ["scripts/run-real-uat-session.mjs", "--check"], {
  cwd: root,
  encoding: "utf8",
});
if (check.status !== 0) {
  process.stderr.write(check.stderr);
  process.stdout.write(check.stdout);
  fail("runner --check failed");
}

for (const command of [
  "npm run validate:real-uat-one-command-runner",
  "npm run validate:real-uat-preflight",
  "npm test",
]) {
  if (!manifest.validation_commands.includes(command)) {
    fail(`one-command runner manifest is missing validation command: ${command}`);
  }
}

const guide = readText("docs/product/ux/real-uat-one-command-runner.md");
for (const requiredText of ["npm run uat:real", "Actor ID", "Stop Rules", "human-review-session-real.json"]) {
  if (!guide.includes(requiredText)) {
    fail(`one-command runner guide is missing required text: ${requiredText}`);
  }
}

console.log("real UAT one-command runner validation passed");
