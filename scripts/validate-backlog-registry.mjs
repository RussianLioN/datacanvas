import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const requiredContours = ["product", "requirements", "technical", "eval", "process", "sprint"];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const registry = readJson("docs/product/backlog/backlog-registry.json");
const schema = readJson("schemas/backlog-registry.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateRegistry = ajv.compile(schema);
if (!validateRegistry(registry)) {
  console.error(JSON.stringify(validateRegistry.errors, null, 2));
  fail("backlog registry does not match schema");
}

const contourIds = new Set(registry.contours.map((contour) => contour.id));
for (const contourId of requiredContours) {
  if (!contourIds.has(contourId)) {
    fail(`backlog registry is missing contour: ${contourId}`);
  }
}

for (const contour of registry.contours) {
  const absolutePath = path.join(root, contour.source_path);
  if (!fs.existsSync(absolutePath)) {
    fail(`backlog contour source path does not exist: ${contour.source_path}`);
  }

  if (contour.required_for_sprint_planning !== true) {
    fail(`backlog contour must be required for sprint planning: ${contour.id}`);
  }
}

const sprintRoot = path.join(root, "docs/sprints");
const sprintFolders = fs.readdirSync(sprintRoot).filter((entry) =>
  fs.existsSync(path.join(sprintRoot, entry, "sprint-evidence-manifest.json")),
);

for (const sprintFolder of sprintFolders) {
  const backlogPath = path.join(sprintRoot, sprintFolder, "sprint-backlog.md");
  if (!fs.existsSync(backlogPath)) {
    fail(`sprint evidence folder is missing sprint-backlog.md: ${sprintFolder}`);
  }
}

console.log("backlog registry validation passed");
