import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function sha256File(relativePath) {
  const content = fs.readFileSync(path.join(root, relativePath));
  return crypto.createHash("sha256").update(content).digest("hex");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const manifestPath = "docs/architecture/schemas/artifact-hash-manifest.json";
const manifest = readJson(manifestPath);
const schema = readJson("schemas/artifact-hash-manifest.schema.json");
const registry = readJson(manifest.source_registry_path);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateManifest = ajv.compile(schema);
if (!validateManifest(manifest)) {
  console.error(JSON.stringify(validateManifest.errors, null, 2));
  fail("artifact hash manifest does not match schema");
}

const excludedPaths = new Set(manifest.exclusions.map((item) => item.path));
const entriesByPath = new Map(manifest.entries.map((entry) => [entry.path, entry]));
const registryByPath = new Map(registry.artifacts.map((artifact) => [artifact.path, artifact]));
const seenEntryIds = new Set();
const seenEntryPaths = new Set();

for (const excludedPath of excludedPaths) {
  if (!registryByPath.has(excludedPath)) {
    fail(`hash manifest exclusion is outside artifact registry: ${excludedPath}`);
  }
}

for (const entry of manifest.entries) {
  if (seenEntryIds.has(entry.artifact_id)) {
    fail(`duplicate hash manifest artifact id: ${entry.artifact_id}`);
  }
  seenEntryIds.add(entry.artifact_id);
  if (seenEntryPaths.has(entry.path)) {
    fail(`duplicate hash manifest path: ${entry.path}`);
  }
  seenEntryPaths.add(entry.path);
  if (excludedPaths.has(entry.path)) {
    fail(`hash manifest entry also appears in exclusions: ${entry.path}`);
  }
  if (!registryByPath.has(entry.path)) {
    fail(`hash manifest has extra path outside artifact registry: ${entry.path}`);
  }
}

const expectedEntryPaths = registry.artifacts.filter((artifact) => !excludedPaths.has(artifact.path)).map((artifact) => artifact.path);
const actualEntryPaths = manifest.entries.map((entry) => entry.path);
if (expectedEntryPaths.length !== actualEntryPaths.length) {
  fail("hash manifest entry count does not match registry minus exclusions");
}
for (let index = 0; index < expectedEntryPaths.length; index += 1) {
  if (expectedEntryPaths[index] !== actualEntryPaths[index]) {
    fail(`hash manifest entries are not in canonical registry order: expected ${expectedEntryPaths[index]}, got ${actualEntryPaths[index]}`);
  }
}

for (const artifact of registry.artifacts) {
  if (excludedPaths.has(artifact.path)) {
    continue;
  }

  const entry = entriesByPath.get(artifact.path);
  if (!entry) {
    fail(`artifact is missing from hash manifest: ${artifact.path}`);
  }

  if (entry.artifact_id !== artifact.id) {
    fail(`hash manifest artifact id mismatch for ${artifact.path}`);
  }

  const actualHash = sha256File(artifact.path);
  if (entry.sha256 !== actualHash) {
    fail(`hash mismatch for ${artifact.path}`);
  }
}

for (const entry of manifest.entries) {
  if (!fs.existsSync(path.join(root, entry.path))) {
    fail(`hash manifest entry path does not exist: ${entry.path}`);
  }
}

console.log("artifact hash manifest validation passed");
