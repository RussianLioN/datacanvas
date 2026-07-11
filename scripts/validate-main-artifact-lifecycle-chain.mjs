import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { buildDependencyIndex, validateDeclaredCycles } from "./documentation-impact-graph.mjs";

const root = process.cwd();
const chainPath = "docs/process/universal-documentation-workflow/main-artifact-lifecycle-chain.json";
const schemaPath = "schemas/main-artifact-lifecycle-chain.schema.json";
const packagePath = "package.json";

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requirePath(relativePath) {
  if (!exists(relativePath)) {
    fail(`required lifecycle artifact is missing: ${relativePath}`);
  }
}

function scriptNameFor(command) {
  const match = /^npm run ([^ ]+)/u.exec(command);
  return match?.[1] ?? null;
}

function assertCommandExists(command, scripts) {
  const scriptName = scriptNameFor(command);
  if (!scriptName) {
    return;
  }
  if (!scripts[scriptName]) {
    fail(`lifecycle command is not defined in package.json: ${command}`);
  }
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      fail(`duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }
}

function h2Order(text) {
  return [...text.matchAll(/^##\s+(.+?)\s*$/gmu)].map((match) => match[1].trim());
}

function orderedProductIndexLinks(text) {
  const start = text.indexOf("## Порядок Чтения");
  if (start === -1) {
    fail("docs/product/README.md must keep ## Порядок Чтения");
  }
  const rest = text.slice(start);
  const nextSection = rest.slice(1).search(/\n##\s+/u);
  const section = nextSection === -1 ? rest : rest.slice(0, nextSection + 1);
  return [...section.matchAll(/^\d+\.\s+\[[^\]]+\]\(([^)]+)\)/gmu)].map((match) => match[1]);
}

function normalizeProductIndexLink(link) {
  if (link.startsWith("../")) {
    return `docs/${link.slice(3)}`;
  }
  return `docs/product/${link}`.replaceAll("/./", "/");
}

function sourceByPath(registry, artifactPath) {
  return registry.sources.filter((source) => source.path === artifactPath);
}

function dependencyExists(index, upstreamPath, downstreamPath) {
  return (index.outboundByPath.get(upstreamPath) ?? []).some(
    (dependency) => dependency.downstream_artifact === downstreamPath,
  );
}

function assertChainSchema(chain) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(readJson("schemas/common-defs.schema.json"));
  const validate = ajv.compile(readJson(schemaPath));
  if (!validate(chain)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${chainPath} does not match ${schemaPath}`);
  }
}

function assertBusinessContractCoverage(chain, contentContract, generationContract) {
  const contentPaths = new Set(contentContract.documents.map((document) => document.path));
  const generationPaths = new Set(generationContract.documents.map((document) => document.path));
  const allowedExceptions = new Set([
    "docs/product/change-orders/co-2026-001-a2a-first-priority.md",
    "docs/product/change-orders/co-2026-002-agent-launch-delivery-scope.md",
    "docs/product-vision.md",
    "docs/product/bmc/bmc-v0.2.md",
    "docs/product/README.md",
  ]);

  for (const stage of chain.stages) {
    if (!stage.business_surface) {
      continue;
    }
    for (const artifactPath of stage.primary_artifacts) {
      if (allowedExceptions.has(artifactPath)) {
        continue;
      }
      if (!contentPaths.has(artifactPath)) {
        fail(`business lifecycle artifact is missing content contract coverage: ${artifactPath}`);
      }
      if (!generationPaths.has(artifactPath)) {
        fail(`business lifecycle artifact is missing generation contract coverage: ${artifactPath}`);
      }
    }
  }
}

function assertProductIndexOrder(chain) {
  const expectedTopPaths = [
    "docs/product-vision.md",
    "docs/product/change-orders/README.md",
    "docs/product/bmc/README.md",
    "docs/product/requirements/user-stories.md",
  ];
  const indexPaths = orderedProductIndexLinks(readText(chain.canonical_product_index_path)).map(normalizeProductIndexLink);
  for (let index = 0; index < expectedTopPaths.length; index += 1) {
    const expectedPath = expectedTopPaths[index];
    const actualPath = indexPaths[index];
    if (actualPath !== expectedPath) {
      fail(`product README order mismatch at position ${index + 1}: expected ${expectedPath}, got ${actualPath}`);
    }
  }
}

function assertRequirementsIndexOrder() {
  const requiredOrder = [
    "Бизнес-требования",
    "Пользовательские истории",
    "Нефункциональные требования",
    "Критерии приемки",
    "Traceability matrix",
  ];
  const text = readText("docs/product/requirements/README.md");
  const positions = requiredOrder.map((label) => text.indexOf(label));
  positions.forEach((position, index) => {
    if (position === -1) {
      fail(`requirements README is missing ${requiredOrder[index]}`);
    }
    if (index > 0 && position <= positions[index - 1]) {
      fail("requirements README order must be business requirements -> stories -> NFR -> acceptance -> traceability");
    }
  });
}

function assertCrossFileCoverage(chain) {
  const scripts = readJson(packagePath).scripts;
  const registry = readJson(chain.supporting_contracts.product_source_registry);
  const graph = readJson(chain.supporting_contracts.artifact_dependency_graph);
  const graphIndex = buildDependencyIndex(graph);
  validateDeclaredCycles(graphIndex, graph.declared_cycle_groups);
  const validationCatalog = readJson(chain.supporting_contracts.validation_command_catalog);
  const inventory = readJson("docs/process/universal-documentation-workflow/artifact-inventory.json");
  const navigationSourceText = readText(chain.supporting_contracts.navigation_source);
  const graphArtifacts = new Set(graph.artifacts.map((artifact) => artifact.path));
  const highImpactSources = new Set(graph.high_impact_sources ?? []);
  const inventoryPaths = new Set(inventory.artifacts.map((artifact) => artifact.path));
  const validationCommands = new Set(validationCatalog.commands.map((command) => command.command));

  if (chain.global_policies.no_change_rationale_location !== chain.supporting_contracts.impact_analysis_report) {
    fail("no-change rationale canonical location must be impact analysis report");
  }
  if (!/вверх/u.test(chain.global_policies.impact_cone_policy) || !/вниз/u.test(chain.global_policies.impact_cone_policy)) {
    fail("main artifact lifecycle must require a full upstream and downstream impact cone");
  }
  if (!/решен/u.test(chain.global_policies.upstream_review_policy)) {
    fail("upstream review policy must preserve the owner decision gate for meaning changes");
  }
  if (!/один раз/u.test(chain.global_policies.cycle_resolution_policy)) {
    fail("cycle resolution policy must resolve every cycle member exactly once");
  }

  for (const contractPath of Object.values(chain.supporting_contracts)) {
    requirePath(contractPath);
  }

  const stageIds = chain.stages.map((stage) => stage.stage_id);
  const stageIdSet = new Set(stageIds);
  assertUnique(stageIds, "lifecycle stage_id");
  assertUnique(chain.stages.map((stage) => stage.order), "lifecycle order");

  chain.stages.forEach((stage, index) => {
    if (stage.order !== index + 1) {
      fail(`lifecycle stage order must be contiguous from 1: ${stage.stage_id}`);
    }
    for (const artifactPath of [...stage.primary_artifacts, ...stage.supporting_artifacts]) {
      requirePath(artifactPath);
    }
    for (const downstreamStageId of stage.downstream_stage_ids) {
      if (!stageIdSet.has(downstreamStageId)) {
        fail(`lifecycle stage references unknown downstream stage: ${stage.stage_id} -> ${downstreamStageId}`);
      }
    }
    for (const command of stage.validation_commands) {
      assertCommandExists(command, scripts);
    }
    if (stage.business_surface && !stage.validation_commands.some((command) =>
      ["npm run validate:business-docs", "npm run validate:product-vision", "npm run validate:bmc", "npm run validate:product-change-orders"].includes(command)
    )) {
      fail(`business lifecycle stage must include a business validation gate: ${stage.stage_id}`);
    }
    if (stage.generation_policy === "generated_only") {
      fail(`main lifecycle stage cannot be generated-only source: ${stage.stage_id}`);
    }
    if (stage.cascade_policy.requires_dependency_graph_entry) {
      for (const primaryArtifact of stage.primary_artifacts) {
        if (!graphArtifacts.has(primaryArtifact)) {
          fail(`dependency graph is missing lifecycle primary artifact: ${primaryArtifact}`);
        }
      }
    }
    for (const sourceRole of stage.source_roles) {
      if (!registry.precedence_order.includes(sourceRole)) {
        fail(`lifecycle source_role is not in product source precedence_order: ${sourceRole}`);
      }
    }
    for (const primaryArtifact of stage.primary_artifacts) {
      const sources = sourceByPath(registry, primaryArtifact);
      if (sources.length === 0 && stage.artifact_role !== "evidence" && stage.artifact_role !== "export_package") {
        fail(`product source registry is missing lifecycle primary artifact: ${primaryArtifact}`);
      }
      if (!navigationSourceText.includes(`"path": "${primaryArtifact}"`) && primaryArtifact.endsWith(".md")) {
        fail(`navigation source is missing lifecycle Markdown artifact: ${primaryArtifact}`);
      }
    }
    if (stage.artifact_role === "resource_estimation") {
      for (const primaryArtifact of stage.primary_artifacts) {
        if (!highImpactSources.has(primaryArtifact)) {
          fail(`resource estimation artifact must be high-impact source: ${primaryArtifact}`);
        }
      }
    }
    if (stage.artifact_role === "technical_downstream" && stage.business_surface) {
      fail(`technical downstream stage cannot be a business surface: ${stage.stage_id}`);
    }
    if (stage.artifact_role === "export_package" && stage.business_surface) {
      fail("Confluence/export package must stay downstream, not business source");
    }
  });

  const lifecycleCommand = validationCatalog.commands.find((command) => command.id === "main-artifact-lifecycle");
  if (!lifecycleCommand || lifecycleCommand.command !== "npm run validate:main-artifact-lifecycle") {
    fail("validation command catalog must include main artifact lifecycle gate");
  }
  if (!validationCommands.has("npm run validate:business-docs")) {
    fail("validation catalog must include business-docs command");
  }
  if (!inventoryPaths.has(chainPath) || !inventoryPaths.has(schemaPath) || !inventoryPaths.has("scripts/validate-main-artifact-lifecycle-chain.mjs")) {
    fail("artifact inventory must include lifecycle chain, schema and validator");
  }
}

function assertLifecycleEdges(chain) {
  const graph = readJson(chain.supporting_contracts.artifact_dependency_graph);
  const graphIndex = buildDependencyIndex(graph);
  const byId = new Map(chain.stages.map((stage) => [stage.stage_id, stage]));
  for (const stage of chain.stages) {
    if (!stage.cascade_policy.requires_dependency_graph_entry) {
      continue;
    }
    for (const downstreamStageId of stage.downstream_stage_ids) {
      const downstreamStage = byId.get(downstreamStageId);
      if (!downstreamStage?.cascade_policy.requires_dependency_graph_entry) {
        continue;
      }
      const hasAnyEdge = stage.primary_artifacts.some((upstreamPath) =>
        downstreamStage.primary_artifacts.some((downstreamPath) =>
          upstreamPath !== downstreamPath && dependencyExists(graphIndex, upstreamPath, downstreamPath)
        )
      );
      if (!hasAnyEdge && !["accepted-product-decision", "hypotheses", "system-analysis", "sprint-candidate-planning"].includes(stage.stage_id)) {
        fail(`dependency graph lacks lifecycle edge from ${stage.stage_id} to ${downstreamStageId}`);
      }
    }
  }
}

try {
  requirePath(chainPath);
  requirePath(schemaPath);
  const chain = readJson(chainPath);
  assertChainSchema(chain);
  assertProductIndexOrder(chain);
  assertRequirementsIndexOrder();
  assertBusinessContractCoverage(
    chain,
    readJson(chain.supporting_contracts.business_content_contract),
    readJson(chain.supporting_contracts.business_generation_contract),
  );
  assertCrossFileCoverage(chain);
  assertLifecycleEdges(chain);
  console.log("main artifact lifecycle chain validation passed");
} catch (error) {
  fail(error.message);
}
