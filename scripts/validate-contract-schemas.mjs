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

const cases = [
  ["schemas/render-request.schema.json", "tests/contracts/render-request-minimal.json"],
  ["schemas/process-change-request.schema.json", "tests/contracts/process-change-request-minimal.json"],
  ["schemas/tool-allowlist.schema.json", "tests/contracts/tool-allowlist-minimal.json"],
  ["schemas/trace-contract.schema.json", "tests/contracts/trace-contract-minimal.json"],
];

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

for (const [schemaPath, dataPath] of cases) {
  const validate = ajv.compile(readJson(schemaPath));
  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
}

const allowlistYaml = readText("docs/architecture/security/tool-allowlist.yaml");
const toolAllowlist = readJson("tests/contracts/tool-allowlist-minimal.json");
if (!allowlistYaml.includes("default_policy: deny") || toolAllowlist.default_policy !== "deny") {
  fail("tool allowlist contract must preserve deny-by-default");
}

const traceContractDoc = readText("docs/architecture/observability/trace-contract.md");
const traceContract = readJson("tests/contracts/trace-contract-minimal.json");
for (const span of traceContract.required_spans) {
  if (!traceContractDoc.includes(`\`${span}\``)) {
    fail(`trace contract doc is missing span: ${span}`);
  }
}

for (const field of traceContract.required_fields) {
  if (!traceContractDoc.includes(`\`${field}\``)) {
    fail(`trace contract doc is missing field: ${field}`);
  }
}

console.log("contract schema validation passed");
