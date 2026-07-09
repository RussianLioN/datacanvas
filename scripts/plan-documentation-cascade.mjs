import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const root = process.cwd();

const defaultPaths = {
  graph: "docs/process/cascading-governance/artifact-dependency-graph.json",
  inventory: "docs/process/universal-documentation-workflow/artifact-inventory.json",
  navigation: "docs/navigation/navigation-source.json",
  generatorContracts: "docs/process/universal-documentation-workflow/generator-contracts.json",
  validationCatalog: "docs/process/universal-documentation-workflow/validation-command-catalog.json",
};

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function normalizeRepoPath(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath) || /^[A-Za-z]:[\\/]/u.test(relativePath) || relativePath.includes("\\")) {
    fail(`unsafe repo path: ${relativePath}`);
  }
  const normalized = path.posix.normalize(relativePath.replaceAll(path.sep, "/"));
  if (normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
    fail(`unsafe repo path: ${relativePath}`);
  }
  return normalized;
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

function addPathCandidate(candidate, result) {
  if (typeof candidate === "string" && !path.isAbsolute(candidate) && !candidate.includes("://") && !candidate.includes("\\")) {
    result.add(path.posix.normalize(candidate));
  }
}

function collectStringPaths(value, result = new Set(), key = "") {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (looksLikePathKey(key)) {
        addPathCandidate(item, result);
      }
      collectStringPaths(item, result, key);
    }
    return result;
  }
  if (!value || typeof value !== "object") {
    return result;
  }
  for (const [key, child] of Object.entries(value)) {
    if (looksLikePathKey(key)) {
      if (Array.isArray(child)) {
        for (const item of child) {
          addPathCandidate(item, result);
        }
      } else {
        addPathCandidate(child, result);
      }
      continue;
    }
    collectStringPaths(child, result, key);
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

function transitiveDownstream(graph, sourcePath) {
  const queue = [sourcePath];
  const downstream = new Set();
  const edges = [];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const edge of graph.dependencies) {
      if (edge.upstream_artifact !== current) {
        continue;
      }
      edges.push(edge);
      if (!downstream.has(edge.downstream_artifact)) {
        downstream.add(edge.downstream_artifact);
        queue.push(edge.downstream_artifact);
      }
    }
  }
  return { downstream: [...downstream], edges };
}

function classifyChange(filePath) {
  if (filePath.endsWith(".provenance.json")) return "provenance";
  if (filePath.endsWith(".xlsx")) return "resource_estimate";
  if (filePath.endsWith("docs/stories.md")) return "navigation_redirect";
  if (filePath.includes("/requirements/")) return "business_meaning";
  if (filePath.includes("/architecture/")) return "architecture_contract";
  if (filePath.includes("/process/")) return "process_rule";
  if (filePath.includes("/navigation/")) return "navigation";
  if (filePath.includes("/security/") || filePath.includes("/evidence/")) return "security_or_evidence";
  if (filePath.endsWith(".json")) return "machine_readable";
  return "documentation";
}

function main() {
  const graph = readJson(argValue("--dependency-graph", defaultPaths.graph));
  const inventory = readJson(defaultPaths.inventory);
  const navigation = readJson(defaultPaths.navigation);
  const generatorContracts = readJson(defaultPaths.generatorContracts);
  const validationCatalog = readJson(defaultPaths.validationCatalog);
  const files = changedFiles();

  const graphPaths = new Set(graph.artifacts.map((artifact) => artifact.path));
  const artifactByPath = new Map(graph.artifacts.map((artifact) => [artifact.path, artifact]));
  const inventoryPaths = new Set(inventory.artifacts.map((artifact) => artifact.path));
  const navigationPaths = collectStringPaths(navigation);
  const generatedOutputs = new Map();
  for (const contract of generatorContracts.contracts) {
    for (const output of contract.outputs) {
      generatedOutputs.set(output, contract);
    }
  }

  const commandIds = new Map(validationCatalog.commands.map((command) => [command.command, command.id]));
  const changedSources = [];
  const downstream = new Set();
  const requiredCommands = new Set();
  const requiredGenerators = new Set();
  const blockers = [];
  const generatedOutputBlockers = new Set();

  for (const filePath of files) {
    const inGraph = graphPaths.has(filePath);
    const inInventory = inventoryPaths.has(filePath);
    const inNavigation = navigationPaths.has(filePath);
    const generator = generatedOutputs.get(filePath);
    const coverage = inGraph ? "graph" : inInventory ? "inventory" : inNavigation ? "navigation" : "uncovered";

    if (generator) {
      requiredGenerators.add(generator.generator_id);
      requiredCommands.add(generator.check_command);
      for (const validator of generator.post_validators) {
        requiredCommands.add(validator);
      }
    }

    if (!generator && inInventory) {
      const inventoryArtifact = inventory.artifacts.find((artifact) => artifact.path === filePath);
      const isGenerated = inventoryArtifact?.lifecycle === "generated" || inventoryArtifact?.generated === true;
      if (isGenerated) {
        const blocker = {
          path: filePath,
          blocker: "generated_output_without_generator_contract",
          detail: "Generated artifact changed but is not covered by generator-contracts.json.",
        };
        blockers.push(blocker);
        generatedOutputBlockers.add(blocker.blocker);
      }
    }

    if (filePath.startsWith("docs/") && coverage === "uncovered") {
      blockers.push({
        path: filePath,
        blocker: "documentation_path_without_cascade_coverage",
        detail: "Add the artifact to dependency graph, inventory, navigation, or explicit ignored/no-cascade rationale.",
      });
    }

    if (inGraph) {
      const artifact = artifactByPath.get(filePath);
      requiredCommands.add(artifact.validation_command);
      const closure = transitiveDownstream(graph, filePath);
      for (const item of closure.downstream) {
        downstream.add(item);
        const downstreamArtifact = artifactByPath.get(item);
        if (downstreamArtifact?.validation_command) {
          requiredCommands.add(downstreamArtifact.validation_command);
        }
      }
      for (const edge of closure.edges) {
        requiredCommands.add(edge.validation_command);
      }
    }

    for (const contract of generatorContracts.contracts) {
      if (contract.inputs.includes(filePath)) {
        requiredGenerators.add(contract.generator_id);
        requiredCommands.add(contract.check_command);
        for (const validator of contract.post_validators) {
          requiredCommands.add(validator);
        }
      }
    }

    if (filePath.endsWith(".md") || filePath.endsWith(".json")) {
      requiredCommands.add("npm run validate:doc-links");
      requiredCommands.add("npm run validate:docs-navigation");
    }

    changedSources.push({
      path: filePath,
      change_class: classifyChange(filePath),
      coverage,
      generated_output: Boolean(generator),
      generated_output_contract: generator?.generator_id ?? null,
    });
  }

  const report = {
    version: "0.1.0",
    mode: hasFlag("--check") ? "check" : "preview",
    changed_from: argValue("--changed-from"),
    changed_source_set: changedSources,
    downstream_artifacts: [...downstream].sort(),
    required_generators: [...requiredGenerators].sort(),
    required_validation_commands: [...requiredCommands]
      .filter(Boolean)
      .sort()
      .map((command) => ({ command, catalog_id: commandIds.get(command) ?? null })),
    blockers,
    completion_claim: {
      ready_to_apply: blockers.length === 0,
      all_changed_docs_covered: !blockers.some((item) => item.blocker === "documentation_path_without_cascade_coverage"),
      generated_outputs_not_manually_changed: generatedOutputBlockers.size === 0,
    },
  };

  console.log(JSON.stringify(report, null, 2));
  if (hasFlag("--check") && blockers.length > 0) {
    fail(`documentation cascade preview has blockers: ${blockers.map((item) => `${item.path}:${item.blocker}`).join(", ")}`);
  }
}

main();
