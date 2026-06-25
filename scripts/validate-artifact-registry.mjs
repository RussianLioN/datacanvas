import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function listSprintManifestPaths() {
  const sprintsRoot = path.join(root, "docs/sprints");
  return fs
    .readdirSync(sprintsRoot)
    .map((entry) => path.join("docs/sprints", entry, "sprint-evidence-manifest.json"))
    .filter((relativePath) => fs.existsSync(path.join(root, relativePath)));
}

const registry = readJson("docs/architecture/schemas/artifact-registry.json");
const registrySchema = readJson("schemas/artifact-registry.schema.json");
const hashManifest = readJson(registry.hash_manifest_path);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateRegistry = ajv.compile(registrySchema);
if (!validateRegistry(registry)) {
  console.error(JSON.stringify(validateRegistry.errors, null, 2));
  fail("artifact registry does not match schema");
}

const ids = new Set();
const paths = new Set();
for (const artifact of registry.artifacts) {
  if (!/^ART-\d{3}$/.test(artifact.id)) {
    fail(`artifact id does not match ART-###: ${artifact.id}`);
  }

  if (ids.has(artifact.id)) {
    fail(`duplicate artifact id: ${artifact.id}`);
  }

  ids.add(artifact.id);

  if (paths.has(artifact.path)) {
    fail(`duplicate artifact path: ${artifact.path}`);
  }

  paths.add(artifact.path);

  if (!fs.existsSync(path.join(root, artifact.path))) {
    fail(`artifact registry path does not exist: ${artifact.path}`);
  }
}

const sortedIds = [...ids].sort();
for (let index = 0; index < sortedIds.length; index += 1) {
  const expectedId = `ART-${String(index + 1).padStart(3, "0")}`;
  if (sortedIds[index] !== expectedId) {
    fail(`artifact id sequence gap: expected ${expectedId}, got ${sortedIds[index]}`);
  }
}

const sprintIds = new Set(registry.artifacts.map((artifact) => artifact.sprint_id));
const evidenceSprintIds = new Set(
  listSprintManifestPaths().map((manifestPath) => readJson(manifestPath).sprint_id),
);

for (const sprintId of sprintIds) {
  if (!evidenceSprintIds.has(sprintId)) {
    fail(`artifact registry sprint_id has no evidence manifest: ${sprintId}`);
  }
}

if (registry.hash_algorithm !== hashManifest.algorithm) {
  fail("artifact registry hash_algorithm must match artifact hash manifest algorithm");
}

if (hashManifest.source_registry_path !== "docs/architecture/schemas/artifact-registry.json") {
  fail("artifact hash manifest must point back to artifact registry");
}

if (registry.snapshot_policy.refresh_command !== "node scripts/generate-artifact-hash-manifest.mjs") {
  fail("artifact registry snapshot_policy refresh command is invalid");
}

if (registry.snapshot_policy.validation_command !== "npm run validate:artifact-hashes") {
  fail("artifact registry snapshot_policy validation command is invalid");
}

const hashEntryPaths = new Set(hashManifest.entries.map((entry) => entry.path));
const hashExclusions = new Set(hashManifest.exclusions.map((entry) => entry.path));
for (const artifact of registry.artifacts) {
  if (!hashEntryPaths.has(artifact.path) && !hashExclusions.has(artifact.path)) {
    fail(`artifact registry entry has no hash manifest coverage: ${artifact.path}`);
  }
}

console.log("artifact registry validation passed");
