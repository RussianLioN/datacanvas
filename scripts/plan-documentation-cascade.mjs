import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

import {
  analyzeImpactCone,
  buildDependencyIndex,
  buildGeneratedOutputLookup,
  classifyImpactObligations,
  normalizeRepoPath,
} from "./documentation-impact-graph.mjs";

const root = process.cwd();
const defaultPaths = {
  graph: "docs/process/cascading-governance/artifact-dependency-graph.json",
  lifecycle: "docs/process/universal-documentation-workflow/main-artifact-lifecycle-chain.json",
  inventory: "docs/process/universal-documentation-workflow/artifact-inventory.json",
  navigation: "docs/navigation/navigation-source.json",
  artifactRegistry: "docs/architecture/schemas/artifact-registry.json",
  generatorContracts: "docs/process/universal-documentation-workflow/generator-contracts.json",
  validationCatalog: "docs/process/universal-documentation-workflow/validation-command-catalog.json",
  sourceRegistry: "docs/product/sources/product-source-registry.json",
  businessClaimMap: "docs/product/requirements/business-claim-map.json",
};

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function absolute(relativePath) {
  return path.join(root, normalizeRepoPath(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function looksLikePathKey(key) {
  return /(^|_)(path|paths|start_path|source_path|target_path)$/u.test(key);
}

function collectStringPaths(value, result = new Set(), key = "") {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (looksLikePathKey(key) && typeof item === "string" && !item.includes("://") && !item.includes("\\")) {
        result.add(path.posix.normalize(item));
      }
      collectStringPaths(item, result, key);
    }
    return result;
  }
  if (!value || typeof value !== "object") {
    return result;
  }
  for (const [childKey, child] of Object.entries(value)) {
    if (looksLikePathKey(childKey) && typeof child === "string" && !child.includes("://") && !child.includes("\\")) {
      result.add(path.posix.normalize(child));
    }
    collectStringPaths(child, result, childKey);
  }
  return result;
}

function runGit(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function changedFiles() {
  const explicit = argValue("--files");
  if (explicit) {
    return explicit.split(",").map((item) => normalizeRepoPath(item.trim())).filter(Boolean);
  }
  const changedFrom = argValue("--changed-from");
  const committed = changedFrom ? runGit(["diff", "--name-only", `${changedFrom}...HEAD`]) : [];
  const unstaged = runGit(["diff", "--name-only"]);
  const staged = runGit(["diff", "--name-only", "--cached"]);
  const untracked = runGit(["ls-files", "--others", "--exclude-standard"]);
  return [...new Set([...committed, ...unstaged, ...staged, ...untracked].map(normalizeRepoPath))];
}

function classifyChange(filePath) {
  if (filePath.endsWith(".provenance.json")) return "source_provenance_change";
  if (filePath.endsWith(".xlsx")) return "estimate_evidence";
  if (filePath.endsWith("docs/stories.md")) return "navigation";
  if (filePath.includes("/requirements/") || filePath === "docs/product-vision.md") return "business_meaning";
  if (filePath.includes("/architecture/")) return "architecture_contract";
  if (filePath.includes("/process/")) return "process_structure_change";
  if (filePath.includes("/navigation/")) return "navigation";
  if (filePath.includes("/security/")) return "security_boundary";
  if (filePath.includes("/evidence/")) return "evidence";
  if (filePath.endsWith(".json")) return "machine_readable";
  return "documentation";
}

function renderText(cone) {
  const upstream = cone.impacted_artifacts.filter((item) => item.impact_directions.includes("upstream")).length;
  const downstream = cone.impacted_artifacts.filter((item) => item.impact_directions.includes("downstream")).length;
  const ownerDecisions = cone.impacted_artifacts.filter((item) => item.owner_gate_required).length;
  const lines = [
    "Предпросмотр каскадного влияния",
    `Изменено источников: ${cone.changed_source_set.length}`,
    `Затронуто артефактов: ${cone.impacted_artifacts.length}`,
    `Требуют проверки выше по цепочке: ${upstream}`,
    `Требуют проверки ниже по цепочке: ${downstream}`,
    `Требуют решения владельца: ${ownerDecisions}`,
    `Обнаружено заявленных циклов: ${cone.observed_cycle_ids.length}`,
  ];
  if (cone.uncovered_changed_paths.length > 0) {
    lines.push("Не покрыты каскадным контрактом:");
    lines.push(...cone.uncovered_changed_paths.map((item) => `- ${item}`));
  }
  return lines.join("\n");
}

function main() {
  const graph = readJson(argValue("--dependency-graph", defaultPaths.graph));
  const lifecycle = readJson(defaultPaths.lifecycle);
  const inventory = readJson(defaultPaths.inventory);
  const navigation = readJson(defaultPaths.navigation);
  const artifactRegistry = readJson(defaultPaths.artifactRegistry);
  const generatorContracts = readJson(defaultPaths.generatorContracts);
  const validationCatalog = readJson(defaultPaths.validationCatalog);
  const sourceRegistry = readJson(defaultPaths.sourceRegistry);
  const businessClaimMap = readJson(defaultPaths.businessClaimMap);
  const files = changedFiles();
  if (files.length === 0) {
    fail("no changed files were provided or detected");
  }

  const inventoryPaths = new Set(inventory.artifacts.map((artifact) => artifact.path));
  const inventoryOutputPaths = new Set(inventory.artifacts.flatMap((artifact) => artifact.outputs ?? []));
  const artifactRegistryPaths = new Set(artifactRegistry.artifacts.map((artifact) => artifact.path));
  const navigationPaths = collectStringPaths(navigation);
  const generatedOutputs = buildGeneratedOutputLookup(generatorContracts);
  const coveredPaths = new Set([
    ...graph.artifacts.map((artifact) => artifact.path),
    ...inventoryPaths,
    ...inventoryOutputPaths,
    ...artifactRegistryPaths,
    ...navigationPaths,
    ...generatedOutputs.keys(),
  ]);

  const changedSourceSet = files.map((filePath) => ({ path: filePath, change_class: classifyChange(filePath) }));
  const index = buildDependencyIndex(graph);
  let cone = analyzeImpactCone(index, changedSourceSet);
  const changeClass = changedSourceSet.some((source) => source.change_class === "business_meaning")
    ? "business_meaning"
    : changedSourceSet[0].change_class;
  cone = classifyImpactObligations(cone, {
    inventory,
    generatorContracts,
    lifecycle,
    sourceRegistry,
    businessClaimMap,
    artifactByPath: index.artifactsByPath,
    generatedOutputs,
    coveredPaths,
    changeClass,
    validationCatalog,
  });

  const generatedWithoutContract = files.filter((filePath) => {
    const artifact = inventory.artifacts.find((item) => item.path === filePath);
    return artifact?.generated === true && !generatedOutputs.has(filePath);
  });
  if (generatedWithoutContract.length > 0) {
    fail(`generated outputs lack generator contracts: ${generatedWithoutContract.join(", ")}`);
  }

  const format = argValue("--format", "json");
  if (!['json', 'text'].includes(format)) {
    fail(`unsupported output format: ${format}`);
  }
  console.log(format === "text" ? renderText(cone) : JSON.stringify(cone, null, 2));

  if ((hasFlag("--check") || cone.uncovered_changed_paths.length > 0) && cone.uncovered_changed_paths.length > 0) {
    fail(`documentation paths lack cascade coverage: ${cone.uncovered_changed_paths.join(", ")}`);
  }
}

try {
  main();
} catch (error) {
  fail(error.message);
}
