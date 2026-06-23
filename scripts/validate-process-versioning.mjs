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

function listSprintManifests() {
  return fs
    .readdirSync(path.join(root, "docs/sprints"))
    .map((entry) => path.join("docs/sprints", entry, "sprint-evidence-manifest.json"))
    .filter((relativePath) => fs.existsSync(path.join(root, relativePath)))
    .sort();
}

const processVersionManifest = readJson("docs/process/versions/0.1.0/process-version-manifest.json");
const schema = readJson("schemas/process-version-manifest.schema.json");
const processRegistry = readText(processVersionManifest.current_registry_path);
const processChangelog = readText(processVersionManifest.changelog_path);
const processSnapshot = readText(processVersionManifest.snapshot_path);
const sprintManifests = listSprintManifests().map((manifestPath) => ({
  path: manifestPath,
  manifest: readJson(manifestPath),
}));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateManifest = ajv.compile(schema);
if (!validateManifest(processVersionManifest)) {
  console.error(JSON.stringify(validateManifest.errors, null, 2));
  fail("process version manifest does not match schema");
}

for (const relativePath of [
  processVersionManifest.source_plan,
  processVersionManifest.snapshot_path,
  processVersionManifest.current_registry_path,
  processVersionManifest.changelog_path,
]) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`process version reference does not exist: ${relativePath}`);
  }
}

if (!processRegistry.includes(`Текущая версия: \`${processVersionManifest.version}\``)) {
  fail("process registry does not expose the active process version");
}

if (!processChangelog.includes(`## ${processVersionManifest.version} - ${processVersionManifest.effective_date}`)) {
  fail("process changelog does not include the active process version entry");
}

if (!processSnapshot.includes(`Версия \`${processVersionManifest.version}\``)) {
  fail("process snapshot does not describe the active process version");
}

const appliedSprintIds = new Set(processVersionManifest.applied_sprint_ids);
for (const { path: manifestPath, manifest } of sprintManifests) {
  if (manifest.process_version !== processVersionManifest.version) {
    fail(`${manifestPath} uses unknown process version: ${manifest.process_version}`);
  }

  if (!appliedSprintIds.has(manifest.sprint_id)) {
    fail(`${manifestPath} is missing from process version applied_sprint_ids`);
  }
}

for (const sprintId of appliedSprintIds) {
  if (!sprintManifests.some(({ manifest }) => manifest.sprint_id === sprintId)) {
    fail(`process version manifest references missing sprint evidence: ${sprintId}`);
  }
}

console.log("process versioning validation passed");
