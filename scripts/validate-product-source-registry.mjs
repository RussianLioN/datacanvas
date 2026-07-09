import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const schemaPath = "schemas/product-source-registry.schema.json";
const registryPath = "docs/product/sources/product-source-registry.json";
const xlsxRecoveryIndexPath = "docs/product/sources/xlsx-opml-jira-recovery-index.json";
const dependencyGraphPath = "docs/process/cascading-governance/artifact-dependency-graph.json";
const consistencyMode = process.argv.includes("--consistency");

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    throw new Error(`required file is missing: ${relativePath}`);
  }
}

function sha256File(relativePath) {
  const content = fs.readFileSync(absolute(relativePath));
  return crypto.createHash("sha256").update(content).digest("hex");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function assertNoSensitivePointers(value, location) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitivePointers(item, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assertNoSensitivePointers(child, `${location}.${key}`);
    }
    return;
  }
  if (typeof value !== "string") {
    return;
  }
  if (value.includes("/Users/") || value.includes("file://") || /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(value) || value.includes("\\")) {
    throw new Error(`sensitive local pointer is forbidden in ${location}`);
  }
}

function assertXlsxRecoveryIndexConsistency(registry) {
  if (!fs.existsSync(absolute(xlsxRecoveryIndexPath))) {
    return;
  }

  const recoveryIndex = readJson(xlsxRecoveryIndexPath);
  for (const item of recoveryIndex.items ?? []) {
    if (!item.path || !item.sha256) {
      continue;
    }

    requireFile(item.path);
    const actual = sha256File(item.path);
    if (actual !== item.sha256) {
      throw new Error(`XLSX/OPML/Jira recovery index sha256 mismatch: ${item.item_id}`);
    }

    if (item.source_id) {
      const source = registry.sources.find((candidate) => candidate.source_id === item.source_id);
      if (!source) {
        throw new Error(`XLSX/OPML/Jira recovery index references unknown source_id: ${item.source_id}`);
      }
      if (source.path !== item.path) {
        throw new Error(`XLSX/OPML/Jira recovery index path mismatch for source_id: ${item.source_id}`);
      }
      if (source.sha256 && source.sha256 !== item.sha256) {
        throw new Error(`XLSX/OPML/Jira recovery index sha256 differs from product source registry: ${item.source_id}`);
      }
    }
  }
}

function transitiveDownstream(graph, sourcePath) {
  const downstream = new Set();
  const queue = [sourcePath];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const dependency of graph.dependencies) {
      if (dependency.upstream_artifact !== current || downstream.has(dependency.downstream_artifact)) {
        continue;
      }
      downstream.add(dependency.downstream_artifact);
      queue.push(dependency.downstream_artifact);
    }
  }
  return downstream;
}

function downstreamClosureFrom(graph, sourcePaths) {
  const closure = new Set();
  for (const sourcePath of sourcePaths) {
    for (const downstreamPath of transitiveDownstream(graph, sourcePath)) {
      closure.add(downstreamPath);
    }
  }
  return closure;
}

function assertXlsxCascadeGraphConsistency(registry) {
  requireFile(dependencyGraphPath);
  const graph = readJson(dependencyGraphPath);
  const artifactPaths = new Set(graph.artifacts.map((artifact) => artifact.path));

  for (const requiredPath of [
    "docs/product/sources/raw/bl-value-rm-data-canvas.xlsx",
    "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx",
    "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json",
  ]) {
    if (!artifactPaths.has(requiredPath)) {
      throw new Error(`dependency graph is missing XLSX artifact: ${requiredPath}`);
    }
    if (!graph.high_impact_sources.includes(requiredPath)) {
      throw new Error(`dependency graph must mark XLSX artifact as high-impact source: ${requiredPath}`);
    }
  }

  const xlsxSources = registry.sources.filter((source) =>
    ["SRC-DC-STORIES-XLSX-RAW", "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08"].includes(source.source_id)
  );
  for (const source of xlsxSources) {
    const startPaths = [source.path];
    if (source.provenance_manifest) {
      startPaths.push(source.provenance_manifest);
    }
    const downstream = downstreamClosureFrom(graph, startPaths);
    for (const artifactPath of source.affected_artifacts) {
      if (!downstream.has(artifactPath)) {
        throw new Error(`XLSX source ${source.source_id} lacks dependency graph downstream coverage for ${artifactPath}`);
      }
    }
  }
}

try {
  requireFile(schemaPath);
  requireFile(registryPath);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);

  const validate = ajv.compile(readJson(schemaPath));
  const registry = readJson(registryPath);
  if (!validate(registry)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${registryPath} does not match ${schemaPath}`);
  }

  assertNoSensitivePointers(registry, registryPath);

  const ids = new Set();
  const paths = new Set();
  for (const source of registry.sources) {
    if (ids.has(source.source_id)) {
      throw new Error(`duplicate source_id: ${source.source_id}`);
    }
    ids.add(source.source_id);
    paths.add(source.path);
    requireFile(source.path);
    if (source.sha256 && sha256File(source.path) !== source.sha256) {
      throw new Error(`source sha256 mismatch: ${source.source_id}`);
    }
    if (source.provenance_manifest) {
      requireFile(source.provenance_manifest);
    }
    for (const artifactPath of source.affected_artifacts) {
      requireFile(artifactPath);
    }
    if (source.trust_level === "needs_revision" && source.lifecycle === "accepted" && !source.upstream_decision) {
      throw new Error(`needs_revision accepted source must reference upstream decision: ${source.source_id}`);
    }
  }

  const requiredSources = [
    "SRC-DC-CO-2026-001",
    "SRC-DC-PRODUCT-VISION-CURRENT",
    "SRC-DC-STORIES-CATALOG",
    "SRC-DC-PRODUCT-BACKLOG",
    "SRC-DC-BACKLOG-AGENT-LAUNCH-CANDIDATES",
    "SRC-DC-ROADMAP-V0-1",
    "SRC-DC-HYPOTHESIS-BOARD",
    "SRC-DC-HYPOTHESIS-VALIDATION",
    "SRC-DC-BMC-CURRENT",
    "SRC-DC-REQUIREMENTS-BUSINESS",
    "SRC-DC-REQUIREMENTS-ACCEPTANCE",
    "SRC-DC-REQUIREMENTS-TRACEABILITY",
    "SRC-DC-ANALYSIS-BA",
    "SRC-DC-SYSTEM-ANALYSIS",
    "SRC-DC-LIFECYCLE-STATE-MODEL",
    "SRC-DC-SRS-V0-1",
    "SRC-DC-SPEC-A2A-LAUNCH",
    "SRC-DC-CASCADE-2026-07-02",
    "SRC-DC-STORIES-XLSX-RAW",
    "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08",
  ];
  for (const sourceId of requiredSources) {
    if (!ids.has(sourceId)) {
      throw new Error(`required product source is missing: ${sourceId}`);
    }
  }

  assertXlsxRecoveryIndexConsistency(registry);

  if (consistencyMode) {
    assertXlsxCascadeGraphConsistency(registry);

    const roleOrder = new Set(registry.precedence_order);
    for (const source of registry.sources) {
      if (!roleOrder.has(source.source_role)) {
        throw new Error(`source_role missing from precedence_order: ${source.source_id}/${source.source_role}`);
      }
    }
    const currentVision = registry.sources.find((source) => source.source_id === "SRC-DC-PRODUCT-VISION-CURRENT");
    if (currentVision?.trust_level !== "current") {
      throw new Error("current Vision must have current trust level");
    }
    const historicalCascade = registry.sources.find((source) => source.source_id === "SRC-DC-CASCADE-2026-07-02");
    if (historicalCascade?.lifecycle !== "historical" || historicalCascade?.trust_level !== "superseded_by_co_acceptance") {
      throw new Error("2026-07-02 cascade run must be marked historical and superseded by CO acceptance");
    }
    for (const requiredPath of [
      "docs/product-vision.md",
      "docs/stories.md",
      "docs/product/change-orders/co-2026-001-a2a-first-priority.md",
      "docs/product/bmc/bmc-v0.2.md",
      "docs/product/requirements/business-requirements.md",
      "docs/product/requirements/acceptance-criteria.md",
      "docs/product/requirements/traceability-matrix.json",
      "docs/product/backlog/product-backlog.md",
      "docs/product/backlog/agent-launch-candidate-stories-2026-q3.md",
      "docs/product/roadmap/roadmap-v0.1.md",
      "docs/product/hypotheses/hypothesis-board.md",
      "docs/product/hypotheses/hypothesis-validation.md",
      "docs/product/analysis/ba/ba-spec.json",
      "docs/architecture/system-analysis/sa-spec.json",
      "docs/architecture/system-analysis/datacanvas-lifecycle-state-model.md",
      "docs/architecture/system-analysis/srs-v0.1.json",
      "docs/product/specs/feature-spec-a2a-launch.json",
      "docs/product/sources/raw/bl-value-rm-data-canvas.xlsx",
      "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx",
    ]) {
      if (!paths.has(requiredPath)) {
        throw new Error(`required path is missing from source registry: ${requiredPath}`);
      }
    }
  }

  console.log(consistencyMode ? "product source consistency validation passed" : "product source registry validation passed");
} catch (error) {
  fail(error.message);
}
