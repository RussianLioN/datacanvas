import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const normalizedPath = process.argv[2] ?? "tests/golden/normalized-data-minimal.json";
const requestPath = process.argv[3] ?? "tests/fixtures/llm-request-minimal.json";
const resultPath = process.argv[4] ?? "tests/golden/llm-result-minimal.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const normalized = readJson(normalizedPath);
const request = readJson(requestPath);
const firstFact = normalized.facts[0];

if (request.output_schema !== "PresentationSpec") {
  throw new Error(`Unsupported output_schema: ${request.output_schema}`);
}

const result = {
  result_id: request.request_id.replace(/^LLMREQ-/, "LLMRES-"),
  schema_version: "0.1.0",
  status: "passed",
  presentation_spec: {
    spec_id: normalized.source_package_id.replace(/^PKG-/, "SPEC-"),
    schema_version: "0.1.0",
    source_package_id: normalized.source_package_id,
    title: "DataCanvas Demo",
    slides: [
      {
        slide_id: "SLIDE-001",
        title: "DataCanvas",
        claims: [
          {
            text: firstFact.claim,
            fact_ids: [firstFact.fact_id],
          },
        ],
      },
    ],
  },
};

writeJson(resultPath, result);
console.log(`llm mock result written: ${resultPath}`);
