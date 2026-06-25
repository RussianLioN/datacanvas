import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const inputPath = process.argv[2] ?? "tests/fixtures/input-package-minimal.json";
const normalizedPath = process.argv[3] ?? "tests/golden/normalized-data-minimal.json";
const tracePath = process.argv[4] ?? "tests/golden/trace-manifest-minimal.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), stableJson(value));
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function sha256File(relativePath) {
  const text = fs.readFileSync(path.join(root, relativePath), "utf8");
  return sha256Text(text);
}

function normalize(input) {
  return {
    normalized_id: input.package_id.replace(/^PKG-/, "NORM-"),
    schema_version: "0.1.0",
    source_package_id: input.package_id,
    data_class: input.data_class,
    sources: input.sources.map((source) => ({
      source_id: source.source_id,
      title: source.title,
      trust_level: source.trust_level,
    })),
    facts: input.facts.map((fact) => ({
      fact_id: fact.fact_id,
      source_id: fact.source_id,
      claim: fact.claim,
      confidence: fact.confidence,
      claim_length: fact.claim.length,
    })),
    untrusted_instruction_count: Array.isArray(input.instructions) ? input.instructions.length : 0,
  };
}

const input = readJson(inputPath);
const normalized = normalize(input);

writeJson(normalizedPath, normalized);

const trace = {
  run_id: input.package_id.replace(/^PKG-/, "RUN-"),
  sprint_id: "SPRINT-2026-W26-S2",
  process_version: "0.1.0",
  input_package: {
    path: inputPath,
    sha256: sha256File(inputPath),
  },
  outputs: [
    {
      artifact_id: `ART-normalized-${input.package_id.replace(/^PKG-/, "")}`,
      path: normalizedPath,
      sha256: sha256File(normalizedPath),
    },
  ],
  spans: [
    {
      name: "input_validation",
      status: "passed",
      schema_version: input.schema_version,
    },
    {
      name: "normalization",
      status: "passed",
      schema_version: normalized.schema_version,
    },
    {
      name: "model_call",
      status: "skipped",
      duration_ms: 0,
      cost_estimate: 0,
      model: "offline_mock_adapter",
      provider: "local",
      retry_count: 0,
      schema_version: "0.1.0",
    },
  ],
};

writeJson(tracePath, trace);

console.log(`normalized data written: ${normalizedPath}`);
console.log(`trace manifest written: ${tracePath}`);
