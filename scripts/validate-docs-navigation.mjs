import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const sourcePath = "docs/navigation/navigation-source.json";
const indexPath = "docs/navigation/documentation-index.json";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

function duplicateIds(items) {
  const seen = new Set();
  const duplicates = [];
  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates.push(item.id);
    }
    seen.add(item.id);
  }
  return duplicates;
}

function hasBreadcrumb(relativePath) {
  const firstLines = readText(relativePath).split("\n").slice(0, 8).join("\n");
  return /^Навигация:\s+/m.test(firstLines);
}

const source = readJson(sourcePath);
const index = readJson(indexPath);
const sourceSchema = readJson("schemas/docs-navigation-source.schema.json");
const indexSchema = readJson("schemas/docs-navigation-index.schema.json");
const registry = readJson("docs/architecture/schemas/artifact-registry.json");
const registryByPath = new Map(registry.artifacts.map((artifact) => [artifact.path, artifact]));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

for (const [schema, data, label] of [
  [sourceSchema, source, "docs navigation source"],
  [indexSchema, index, "docs navigation index"],
]) {
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${label} does not match schema`);
  }
}

execFileSync("node", ["scripts/generate-docs-navigation.mjs", "--check"], {
  cwd: root,
  stdio: "inherit",
});

const indexByPath = new Map(index.entries.map((entry) => [entry.path, entry]));
for (const required of source.required_entrypoints) {
  requireFile(required.path);
  if (!indexByPath.has(required.path)) {
    fail(`required entrypoint is missing from generated index: ${required.path}`);
  }
}

for (const sectionReadme of [
  "docs/product/README.md",
  "docs/process/README.md",
  "docs/architecture/README.md",
  "docs/release/README.md",
  "docs/sprints/README.md",
  "docs/plans/README.md",
  "docs/knowledge/README.md",
]) {
  requireFile(sectionReadme);
}

const routeDuplicates = [
  ...duplicateIds(source.role_routes),
  ...duplicateIds(source.task_routes),
];
if (routeDuplicates.length > 0) {
  fail(`duplicate route ids: ${routeDuplicates.join(", ")}`);
}

for (const entry of index.entries) {
  if (!entry.owner_role || !entry.lifecycle || !entry.data_class || !entry.visibility) {
    fail(`navigation entry is missing required metadata: ${entry.path}`);
  }

  if (["confidential", "sensitive"].includes(entry.data_class)) {
    if (entry.visibility === "public" || entry.searchable || entry.navigable) {
      fail(`sensitive/confidential path is exposed in public navigation: ${entry.path}`);
    }
  }

  if (entry.generated && !entry.canonical_source) {
    fail(`generated entry is missing canonical_source: ${entry.path}`);
  }

  if (entry.visibility === "public" && ["active", "accepted"].includes(entry.lifecycle)) {
    if (!entry.navigable || !entry.searchable) {
      fail(`public active entry must be navigable and searchable: ${entry.path}`);
    }
    if (!entry.reachable_from_root || entry.click_depth === null || entry.click_depth > 3) {
      fail(`public active entry is not reachable from root within 3 clicks: ${entry.path}`);
    }
  }
}

for (const sourceEntry of source.managed_entries) {
  const generatedEntry = indexByPath.get(sourceEntry.path);
  if (!generatedEntry) {
    fail(`managed entry is missing from generated index: ${sourceEntry.path}`);
  }
  if (sourceEntry.critical) {
    for (const key of ["owner_role", "lifecycle", "visibility"]) {
      if (!generatedEntry[key]) {
        fail(`critical entry is missing ${key}: ${sourceEntry.path}`);
      }
    }
  }
  if (sourceEntry.breadcrumb_required && sourceEntry.path.endsWith(".md") && !generatedEntry.generated) {
    if (!hasBreadcrumb(sourceEntry.path)) {
      fail(`manual markdown entry is missing breadcrumb: ${sourceEntry.path}`);
    }
  }
  if (sourceEntry.artifact_registry_required) {
    const artifact = registryByPath.get(sourceEntry.path);
    if (!artifact) {
      fail(`critical navigation artifact is missing from artifact registry: ${sourceEntry.path}`);
    }
    if (generatedEntry.artifact_registry_id !== artifact.id) {
      fail(`navigation index has wrong artifact registry id for ${sourceEntry.path}`);
    }
  }
}

for (const blocked of index.blocked_sensitive_paths) {
  const entry = indexByPath.get(blocked.path);
  if (!entry) {
    fail(`blocked sensitive path is missing from entries: ${blocked.path}`);
  }
  if (entry.visibility === "public" || entry.searchable || entry.navigable) {
    fail(`blocked sensitive path is exposed: ${blocked.path}`);
  }
}

const criticalWithoutRegistry = index.entries.filter(
  (entry) => entry.visibility === "public" && ["active", "accepted"].includes(entry.lifecycle) && !entry.artifact_registry_id,
);
if (criticalWithoutRegistry.length > 0) {
  fail(`public active entries missing artifact registry ids: ${criticalWithoutRegistry.map((entry) => entry.path).join(", ")}`);
}

console.log("docs navigation validation passed");
