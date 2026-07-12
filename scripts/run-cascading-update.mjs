import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  absoluteRepoPath,
  hashJsonDocument,
  hashRepoPath,
  hashTextDocument,
  renderImpactMarkdown,
  writeJsonExclusive,
  writeTextExclusive,
} from "./cascade-evidence-utils.mjs";
import {
  analyzeImpactCone,
  buildDependencyIndex,
  buildGeneratedOutputLookup,
  classifyImpactObligations,
  changedSourceSetFromProductSourceRegistry,
  normalizeRepoPath,
  ownerConfirmationRequired,
  sourceChangeClassesForPath,
} from "./documentation-impact-graph.mjs";
import { requiredCascadeValidationCommands } from "./cascade-validation-command-policy.mjs";
import { buildCascadeOwnerDecisions } from "./cascade-owner-decision-policy.mjs";

const root = process.cwd();
const runsRoot = "docs/process/cascading-governance/runs";
const canonicalGraphPath = "docs/process/cascading-governance/artifact-dependency-graph.json";
const canonicalProductSourceRegistryPath = "docs/product/sources/product-source-registry.json";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function absolute(relativePath) {
  return absoluteRepoPath(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function validateJsonDocument(data, schemaPath, label, dependencyPaths = []) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const dependencyPath of dependencyPaths) {
    ajv.addSchema(readJson(dependencyPath));
  }
  const validate = ajv.compile(readJson(schemaPath));
  if (!validate(data)) {
    fail(`${label} does not match schema: ${JSON.stringify(validate.errors, null, 2)}`);
  }
}

function requireExisting(relativePath) {
  const absolutePath = absolute(relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`required path does not exist: ${relativePath}`);
  }
}

function writeJson(relativePath, data) {
  writeJsonExclusive(root, relativePath, data);
}

function writeText(relativePath, data) {
  writeTextExclusive(root, relativePath, data);
}

function gitHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
}

function assertFreshRunOutputDir(relativePath) {
  if (relativePath === runsRoot || !relativePath.startsWith(`${runsRoot}/`)) {
    fail(`output dir must be a new direct child of ${runsRoot}`);
  }

  const suffix = relativePath.slice(`${runsRoot}/`.length);
  if (!suffix || suffix.includes("/")) {
    fail(`output dir must be a new direct child of ${runsRoot}`);
  }

  if (fs.existsSync(absolute(relativePath))) {
    fail(`output dir already exists: ${relativePath}`);
  }
}

function assertOutputPathsAvailable(relativePaths) {
  for (const relativePath of relativePaths) {
    if (fs.existsSync(absolute(relativePath))) {
      fail(`output path already exists: ${relativePath}`);
    }
  }
}

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function unique(values) {
  return [...new Set(values)];
}

function artifactRoleForPath(relativePath) {
  if (relativePath.endsWith(".provenance.json")) {
    return "provenance_manifest";
  }
  if (relativePath.endsWith("product-source-registry.json")) {
    return "product_source_registry";
  }
  if (relativePath.endsWith("xlsx-opml-jira-recovery-index.json")) {
    return "recovery_index";
  }
  if (relativePath.includes("/raw/") && relativePath.endsWith(".xlsx")) {
    return "raw_xlsx";
  }
  return "working_xlsx";
}

const rawChangeRequestPath = argValue("--change-request");
const rawOutputDir = argValue("--output-dir");
const rawSourceId = argValue("--source-id");

if (process.argv.includes("--apply")) {
  fail("runner supports dry-run evidence generation only; --apply is not supported");
}

if (!rawChangeRequestPath || !rawOutputDir) {
  fail("usage: node scripts/run-cascading-update.mjs --change-request <path> --output-dir <dir> [--dependency-graph <path>] [--source-id <product-source-id>]");
}

const changeRequestPath = normalizeRepoPath(rawChangeRequestPath);
const graphPath = normalizeRepoPath(
  argValue("--dependency-graph", canonicalGraphPath),
);
const productSourceRegistryPath = normalizeRepoPath(
  argValue("--product-source-registry", canonicalProductSourceRegistryPath),
);
const outputDir = normalizeRepoPath(rawOutputDir);

if (graphPath !== canonicalGraphPath) {
  fail(`dependency graph must use the canonical DataCanvas path: ${canonicalGraphPath}`);
}
if (productSourceRegistryPath !== canonicalProductSourceRegistryPath) {
  fail(`product source registry must use the canonical DataCanvas path: ${canonicalProductSourceRegistryPath}`);
}

assertFreshRunOutputDir(outputDir);

requireExisting(changeRequestPath);
requireExisting(graphPath);

const changeRequest = readJson(changeRequestPath);
const graph = readJson(graphPath);
validateJsonDocument(
  changeRequest,
  "schemas/documentation-change-request.schema.json",
  "documentation change request",
  ["schemas/common-defs.schema.json"],
);
validateJsonDocument(
  graph,
  "schemas/artifact-dependency-graph.schema.json",
  "artifact dependency graph",
  ["schemas/common-defs.schema.json"],
);
if (graph.status !== "active") {
  fail(`canonical dependency graph is not active: ${graph.status}`);
}
const graphIndex = buildDependencyIndex(graph);
const graphArtifacts = new Set(graph.artifacts.map((artifact) => artifact.path));
const productSourceRegistry = readJson(productSourceRegistryPath);
const inventoryPath = "docs/process/universal-documentation-workflow/artifact-inventory.json";
const generatorContractsPath = "docs/process/universal-documentation-workflow/generator-contracts.json";
const lifecyclePath = "docs/process/universal-documentation-workflow/main-artifact-lifecycle-chain.json";
const validationCatalogPath = "docs/process/universal-documentation-workflow/validation-command-catalog.json";
const artifactRegistryPath = "docs/architecture/schemas/artifact-registry.json";
const claimMapPath = "docs/product/requirements/business-claim-map.json";
const inventory = readJson(inventoryPath);
const generatorContracts = readJson(generatorContractsPath);
const lifecycle = readJson(lifecyclePath);
const validationCatalog = readJson(validationCatalogPath);
const artifactRegistry = readJson(artifactRegistryPath);
const businessClaimMap = readJson(claimMapPath);
validateJsonDocument(
  validationCatalog,
  "schemas/validation-command-catalog.schema.json",
  "validation command catalog",
);
validateJsonDocument(
  artifactRegistry,
  "schemas/artifact-registry.schema.json",
  "artifact registry",
);
validateJsonDocument(
  productSourceRegistry,
  "schemas/product-source-registry.schema.json",
  "product source registry",
);
if (productSourceRegistry.status !== "active") {
  fail(`canonical product source registry is not active: ${productSourceRegistry.status}`);
}
validateJsonDocument(
  generatorContracts,
  "schemas/generator-contracts.schema.json",
  "generator contracts",
);
const generatedOutputs = buildGeneratedOutputLookup(generatorContracts);
let source = null;
if (rawSourceId) {
  try {
    source = changedSourceSetFromProductSourceRegistry(productSourceRegistry, rawSourceId).source;
  } catch (error) {
    fail(error.message);
  }
}
const sourceStartPaths = source ? [source.path, source.provenance_manifest].filter(Boolean) : [];
for (const sourcePath of sourceStartPaths) {
  requireExisting(sourcePath);
}
const targetArtifact = source ? source.path : changeRequest.target_artifact;
const targetInGraph = source ? graphArtifacts.has(source.path) : graphArtifacts.has(changeRequest.target_artifact);
const changedSourcePaths = source ? sourceStartPaths : [targetArtifact];
const changedSourceSet = changedSourcePaths.map((sourcePath) => ({
  path: sourcePath,
  change_class: source ? sourceChangeClassesForPath(sourcePath)[0] : changeRequest.semantic_change ? "business_meaning" : "documentation",
}));
let impactCone = analyzeImpactCone(graphIndex, changedSourceSet);
impactCone = classifyImpactObligations(impactCone, {
  inventory,
  generatorContracts,
  lifecycle,
  sourceRegistry: productSourceRegistry,
  businessClaimMap,
  validationCatalog,
  artifactRegistry,
  generatedOutputs,
  changeClass: changeRequest.semantic_change ? "business_meaning" : changedSourceSet[0].change_class,
});
const affected = impactCone.impacted_artifacts.map((artifact) => artifact.path);
const downstreamAffected = impactCone.impacted_artifacts
  .filter((artifact) => artifact.impact_directions.includes("downstream"))
  .map((artifact) => artifact.path);
const validationPlan = requiredCascadeValidationCommands({
  changedSourcePaths,
  impactedArtifactPaths: affected,
  hasXlsxSource: Boolean(source),
});
const affectedSet = new Set([...changedSourcePaths, ...affected]);
const edges = graph.dependencies.filter(
  (edge) => affectedSet.has(edge.upstream_artifact) && affectedSet.has(edge.downstream_artifact),
);
const timestamp = new Date().toISOString();
const suffix = changeRequest.change_request_id.replace("DCR-", "");
const impactReportPath = path.posix.join(outputDir, `impact-analysis-report-${suffix}.json`);
const decisionQueuePath = path.posix.join(outputDir, `user-decision-queue-${suffix}.json`);
const runPath = path.posix.join(outputDir, `cascading-update-run-${suffix}.json`);
const baselineManifestPath = path.posix.join(outputDir, `cascade-baseline-manifest-${suffix}.json`);
const humanReportPath = path.posix.join(outputDir, `impact-analysis-report-${suffix}.md`);
const xlsxChangeAnalysisPath = source ? path.posix.join(outputDir, `xlsx-change-analysis-${suffix}.json`) : null;
assertOutputPathsAvailable(
  [impactReportPath, decisionQueuePath, runPath, baselineManifestPath, humanReportPath].concat(
    xlsxChangeAnalysisPath ? [xlsxChangeAnalysisPath] : [],
  ),
);
const sourceRequiresTeamApproval = source?.approval_status === "draft_unapproved" || source?.team_validation_status === "pending_team_review";
const sourceRequiresDownstreamResolution = Boolean(source);
const { decisions: blockingDecisions, decisionIdByArtifact } = buildCascadeOwnerDecisions({
  suffix,
  changeRequest,
  changeRequestPath,
  targetArtifact,
  targetInGraph,
  sourceRequiresTeamApproval,
  sourceRequiresDownstreamResolution,
  impactCone,
  graphIndex,
  affectedArtifacts: affected,
  requestedAt: timestamp,
});
const semanticOrMissingTarget = blockingDecisions.length > 0;
const blockedReasons = [];

if (!targetInGraph) {
  blockedReasons.push(`Целевой артефакт отсутствует в графе зависимостей: ${changeRequest.target_artifact}`);
}
if (changeRequest.semantic_change) {
  blockedReasons.push("Смысловые изменения требуют явного подтверждения владельца до применения правок.");
}
if (sourceRequiresTeamApproval) {
  blockedReasons.push("Оценки в XLSX еще не утверждены командой реализации и не могут использоваться для sprint backlog или Jira.");
}
if (source) {
  blockedReasons.push("Для XLSX нужно закрыть весь конус влияния изменениями или no-change rationale в impact analysis.");
}

const xlsxChangeAnalysis = source
  ? {
      $schema: "../../../schemas/xlsx-change-analysis.schema.json",
      version: "0.1.0",
      analysis_id: `XLSX-CHANGE-${suffix}`,
      status: sourceRequiresTeamApproval || !targetInGraph ? "blocked" : "ready",
      generated_at: timestamp,
      source_id: source.source_id,
      changed_source_set: sourceStartPaths.map((sourcePath) => ({
        path: sourcePath,
        artifact_role: artifactRoleForPath(sourcePath),
        change_kind: "unknown",
        change_classes: sourceChangeClassesForPath(sourcePath),
      })),
      change_classes: unique(sourceStartPaths.flatMap((sourcePath) => sourceChangeClassesForPath(sourcePath))),
      downstream_seed_paths: downstreamAffected,
      downstream_resolution_policy: {
        resolution_required: "update_or_no_change_rationale_per_downstream",
        canonical_no_change_location: "impact_analysis_report",
        business_artifact_policy: "no_service_rationale_in_business_docs",
        source_registry_policy: "dependency_metadata_only",
        dependency_graph_policy: "stable_dependency_edges_only",
      },
      owner_decisions_required: sourceRequiresTeamApproval
        ? [
            "Требуется подтверждение команды реализации перед переносом ПШЕ в sprint backlog или Jira import.",
            "Product Owner принимает смысловые изменения только если XLSX меняет истории, приоритеты или состав backlog.",
          ]
        : [
            "Product Owner принимает смысловые изменения только если XLSX меняет истории, приоритеты или состав backlog.",
          ],
      team_approval_required: Boolean(sourceRequiresTeamApproval),
      validation_commands: [
        "npm run validate:xlsx-backlog",
        "npm run validate:xlsx-cascade",
        "npm run validate:product-source-consistency",
      ],
    }
  : null;

const impactReport = {
  version: "0.2.0",
  impact_report_id: `IAR-${suffix}`,
  change_request_id: changeRequest.change_request_id,
  status: semanticOrMissingTarget ? "blocked" : "ready",
  generated_at: timestamp,
  target_artifact: targetArtifact,
  impact_cone: impactCone,
  affected_artifacts: impactCone.impacted_artifacts.map((artifact) => ({
    path: artifact.path,
    required_edits: [
      artifact.review_obligation === "regenerate"
        ? "Обновить артефакт только зарегистрированным генератором или зафиксировать no-change rationale."
        : artifact.review_obligation === "owner_decision"
          ? "Проверить смысловую согласованность и получить решение владельца до изменения смысла."
          : "Обновить артефакт или зафиксировать no-change rationale в этом impact analysis.",
    ],
    optional_edits: [],
    update_status: semanticOrMissingTarget || artifact.owner_gate_required ? "blocked" : "pending",
    no_change_rationale: null,
  })),
  blocking_user_decisions: blockingDecisions.map((decision) => decision.decision_id),
  derived_facts: [
    {
      fact: targetInGraph
        ? source
          ? "Полный конус влияния рассчитан по artifact-dependency-graph.json и product-source-registry.json."
          : "Полный конус влияния рассчитан по artifact-dependency-graph.json."
        : "Целевой артефакт не найден в artifact-dependency-graph.json.",
      source_paths: source ? [graphPath, productSourceRegistryPath] : [graphPath],
    },
  ],
  assumptions_forbidden: [
    "Не применять смысловые правки без подтверждения владельца.",
    "Не придумывать емкость, приоритеты, даты, границы работ, нормы или Jira field mapping.",
    "Не продолжать каскад, если целевой артефакт отсутствует в графе зависимостей.",
    "Не переносить служебные сведения XLSX и provenance в бизнесовые Markdown-артефакты.",
  ],
  proposals: [
    {
      proposal: targetInGraph
        ? source
          ? "До завершения закрыть каждый элемент полного конуса XLSX изменением или no-change rationale."
          : "Показать владельцу очередь решений до применения смысловых правок."
        : "Зарегистрировать целевой артефакт в графе зависимостей до каскадных правок.",
      classification: source ? "estimate_evidence" : semanticOrMissingTarget ? "blocked_missing_input" : "not_applicable",
    },
  ],
  validation_plan: validationPlan,
  blocked_reasons: blockedReasons,
  edge_decisions: edges.map((edge) => ({
    upstream_artifact: edge.upstream_artifact,
    downstream_artifact: edge.downstream_artifact,
    relation_type: edge.relation_type,
    requires_user_confirmation: changedSourceSet.some((changedSource) =>
      ownerConfirmationRequired(edge.user_confirmation_required, changedSource.change_class),
    ),
    blocking_decision_id: changedSourceSet.some((changedSource) =>
      ownerConfirmationRequired(edge.user_confirmation_required, changedSource.change_class),
    )
      ? decisionIdByArtifact.get(edge.downstream_artifact) ??
        decisionIdByArtifact.get(edge.upstream_artifact) ??
        blockingDecisions[0]?.decision_id ??
        null
      : null,
  })),
  completion_status: semanticOrMissingTarget ? "blocked" : "pending",
};

const decisionQueue = {
  version: "0.1.0",
  queue_id: `UDQ-${suffix}`,
  change_request_id: changeRequest.change_request_id,
  status: semanticOrMissingTarget ? "blocked" : "closed",
  requested_at: timestamp,
  decisions: blockingDecisions,
};

const controlInputPaths = [
  "package.json",
  graphPath,
  lifecyclePath,
  claimMapPath,
  inventoryPath,
  productSourceRegistryPath,
  generatorContractsPath,
  validationCatalogPath,
  artifactRegistryPath,
  "scripts/run-cascading-update.mjs",
  "scripts/finalize-documentation-cascade.mjs",
  "scripts/verify-documentation-cascade.mjs",
  "scripts/cascade-evidence-utils.mjs",
  "scripts/cascade-acceptance-records.mjs",
  "scripts/cascade-validation-command-policy.mjs",
  "scripts/cascade-owner-decision-policy.mjs",
  "scripts/documentation-impact-graph.mjs",
  "schemas/artifact-dependency-graph.schema.json",
  "schemas/main-artifact-lifecycle-chain.schema.json",
  "schemas/cascade-impact-cone.schema.json",
  "schemas/impact-analysis-report.schema.json",
  "schemas/cascading-update-run.schema.json",
  "schemas/user-decision-queue.schema.json",
  "schemas/cascade-baseline-manifest.schema.json",
  "schemas/cascade-verification-evidence.schema.json",
  "schemas/cascade-resolution-input.schema.json",
  "schemas/acceptance-records.schema.json",
  "schemas/artifact-registry.schema.json",
  "schemas/validation-command-catalog.schema.json",
  "schemas/product-source-registry.schema.json",
  "schemas/documentation-change-request.schema.json",
  "tests/fixtures/cascading-governance",
];
for (const controlPath of controlInputPaths) {
  requireExisting(controlPath);
}
const baselineScopes = new Map(
  [...changedSourcePaths, ...affected].map((artifactPath) => [artifactPath, "impact_cone"]),
);
for (const controlPath of controlInputPaths) {
  baselineScopes.set(controlPath, "control_input");
}
const baselineManifest = {
  version: "0.2.0",
  baseline_id: `CBM-${suffix}`,
  captured_at: timestamp,
  head_sha: gitHead(),
  source_run_path: runPath,
  files: [...baselineScopes]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([artifactPath, scope]) => ({
      path: artifactPath,
      scope,
      exists: fs.existsSync(absolute(artifactPath)),
      sha256: hashRepoPath(root, artifactPath),
    })),
};
const humanReport = renderImpactMarkdown(impactReport, outputDir);
const dryRunEvidencePaths = [
  impactReportPath,
  decisionQueuePath,
  baselineManifestPath,
  humanReportPath,
].concat(xlsxChangeAnalysisPath ? [xlsxChangeAnalysisPath] : []);
const dryRunEvidenceHashes = [
  { path: changeRequestPath, sha256: hashRepoPath(root, changeRequestPath) },
  { path: impactReportPath, sha256: hashJsonDocument(impactReport) },
  { path: decisionQueuePath, sha256: hashJsonDocument(decisionQueue) },
  { path: baselineManifestPath, sha256: hashJsonDocument(baselineManifest) },
  { path: humanReportPath, sha256: hashTextDocument(humanReport) },
].concat(
  xlsxChangeAnalysisPath
    ? [{ path: xlsxChangeAnalysisPath, sha256: hashJsonDocument(xlsxChangeAnalysis) }]
    : [],
);

const run = {
  version: "0.2.0",
  run_id: `CUR-${suffix}`,
  run_mode: "dry_run_evidence",
  apply_supported: false,
  status: semanticOrMissingTarget ? "blocked" : "planned",
  change_request_path: changeRequestPath,
  dependency_graph_path: graphPath,
  impact_report_path: impactReportPath,
  decision_queue_path: decisionQueuePath,
  capacity_plan_path: null,
  reprioritization_report_path: null,
  jira_mapping_request_path: null,
  changed_source_set_path: null,
  xlsx_change_analysis_path: xlsxChangeAnalysisPath,
  baseline_manifest_path: baselineManifestPath,
  human_report_path: humanReportPath,
  resolution_input_path: null,
  resolution_report_path: null,
  dry_run_evidence_hashes: dryRunEvidenceHashes,
  finalized_evidence_hashes: [],
  changed_artifacts: [],
  skipped_artifacts: [],
  generated_artifacts: [
    {
      path: impactReportPath,
      generator_command: "node scripts/run-cascading-update.mjs",
    },
    {
      path: decisionQueuePath,
      generator_command: "node scripts/run-cascading-update.mjs",
    },
    {
      path: baselineManifestPath,
      generator_command: "node scripts/run-cascading-update.mjs",
    },
    {
      path: humanReportPath,
      generator_command: "node scripts/run-cascading-update.mjs",
    },
  ].concat(
    xlsxChangeAnalysisPath
      ? [
          {
            path: xlsxChangeAnalysisPath,
            generator_command: "node scripts/run-cascading-update.mjs",
          },
        ]
      : [],
  ),
  validation_results: [
    {
      command: source ? "npm run validate:xlsx-cascade" : "npm run validate:cascading-governance",
      status: "not_run",
      evidence: "Generated dry-run evidence must be validated after review.",
      ran_at: timestamp,
    },
  ],
  evidence_paths: dryRunEvidencePaths,
  completion_claim: {
    done_claimed: false,
    decision_queue_status: decisionQueue.status,
    all_affected_artifacts_resolved: false,
    ready_to_apply: false,
    ready_for_dry_run_evidence: true,
  },
};

validateJsonDocument(
  impactReport,
  "schemas/impact-analysis-report.schema.json",
  "generated impact report",
  ["schemas/common-defs.schema.json", "schemas/cascade-impact-cone.schema.json"],
);
validateJsonDocument(
  decisionQueue,
  "schemas/user-decision-queue.schema.json",
  "generated decision queue",
  ["schemas/common-defs.schema.json"],
);
validateJsonDocument(
  baselineManifest,
  "schemas/cascade-baseline-manifest.schema.json",
  "generated cascade baseline",
  ["schemas/common-defs.schema.json"],
);
validateJsonDocument(
  run,
  "schemas/cascading-update-run.schema.json",
  "generated cascade run",
  ["schemas/common-defs.schema.json"],
);
if (xlsxChangeAnalysis) {
  validateJsonDocument(
    xlsxChangeAnalysis,
    "schemas/xlsx-change-analysis.schema.json",
    "generated XLSX change analysis",
    ["schemas/common-defs.schema.json"],
  );
}

writeJson(impactReportPath, impactReport);
writeJson(decisionQueuePath, decisionQueue);
writeJson(baselineManifestPath, baselineManifest);
writeText(humanReportPath, humanReport);
if (xlsxChangeAnalysisPath) {
  writeJson(xlsxChangeAnalysisPath, xlsxChangeAnalysis);
}
writeJson(runPath, run);

console.log(`impact report written: ${impactReportPath}`);
console.log(`decision queue written: ${decisionQueuePath}`);
console.log(`baseline manifest written: ${baselineManifestPath}`);
console.log(`human impact report written: ${humanReportPath}`);
if (xlsxChangeAnalysisPath) {
  console.log(`xlsx change analysis written: ${xlsxChangeAnalysisPath}`);
}
console.log(`cascade run written: ${runPath}`);
if (decisionQueue.status === "blocked") {
  console.log(`cascade runner stopped before semantic edits: ${blockedReasons.join(" ")}`);
}
