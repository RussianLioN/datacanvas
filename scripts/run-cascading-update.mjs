import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const runsRoot = "docs/process/cascading-governance/runs";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function normalizeRepoPath(relativePath) {
  if (
    !relativePath ||
    path.isAbsolute(relativePath) ||
    /^[A-Za-z]:[\\/]/.test(relativePath) ||
    /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(relativePath) ||
    relativePath.includes("\\")
  ) {
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

function requireExisting(relativePath) {
  const absolutePath = absolute(relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`required path does not exist: ${relativePath}`);
  }
}

function writeJson(relativePath, data) {
  const normalized = normalizeRepoPath(relativePath);
  const absolutePath = absolute(normalized);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`, { flag: "wx" });
}

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function transitiveDownstreamEdges(graph, sourcePath) {
  const edges = [];
  const seenArtifacts = new Set();
  const queue = [sourcePath];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const dependency of graph.dependencies) {
      if (dependency.upstream_artifact !== current) {
        continue;
      }
      edges.push(dependency);
      if (!seenArtifacts.has(dependency.downstream_artifact)) {
        seenArtifacts.add(dependency.downstream_artifact);
        queue.push(dependency.downstream_artifact);
      }
    }
  }
  return edges;
}

function uniqueDownstream(edges) {
  return [...new Set(edges.map((edge) => edge.downstream_artifact))];
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

function changeClassesForPath(relativePath) {
  if (relativePath.endsWith(".provenance.json")) {
    return ["source_provenance_change", "provenance_only"];
  }
  if (relativePath.endsWith("product-source-registry.json")) {
    return ["registry_consistency_change"];
  }
  if (relativePath.endsWith("xlsx-opml-jira-recovery-index.json")) {
    return ["source_provenance_change"];
  }
  if (relativePath.endsWith(".xlsx")) {
    return ["estimate_evidence"];
  }
  return ["mixed_or_ambiguous"];
}

function affectedImpactTypes(edges, artifactPath) {
  const relationTypes = edges
    .filter((edge) => edge.downstream_artifact === artifactPath)
    .map((edge) => edge.relation_type);
  if (relationTypes.length === 0) {
    return ["process"];
  }
  return unique(
    relationTypes.map((relationType) => {
      if (relationType === "source_provenance") return "provenance";
      if (relationType === "estimate_evidence") return "resource";
      if (relationType === "registry_consistency") return "registry";
      if (relationType === "xlsx_recovery") return "evidence";
      if (relationType === "approval") return "resource";
      return relationType;
    }),
  );
}

function edgesFromSources(graph, sourcePaths) {
  return sourcePaths.flatMap((sourcePath) => transitiveDownstreamEdges(graph, sourcePath));
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
  argValue("--dependency-graph", "docs/process/cascading-governance/artifact-dependency-graph.json"),
);
const productSourceRegistryPath = normalizeRepoPath(
  argValue("--product-source-registry", "docs/product/sources/product-source-registry.json"),
);
const outputDir = normalizeRepoPath(rawOutputDir);

if (outputDir !== runsRoot && !outputDir.startsWith(`${runsRoot}/`)) {
  fail(`output dir must be inside ${runsRoot}`);
}

requireExisting(changeRequestPath);
requireExisting(graphPath);

const changeRequest = readJson(changeRequestPath);
const graph = readJson(graphPath);
const graphArtifacts = new Set(graph.artifacts.map((artifact) => artifact.path));
const productSourceRegistry = rawSourceId ? readJson(productSourceRegistryPath) : null;
const source = rawSourceId
  ? productSourceRegistry.sources.find((candidate) => candidate.source_id === rawSourceId)
  : null;
if (rawSourceId && !source) {
  fail(`unknown product source id: ${rawSourceId}`);
}
const sourceStartPaths = source ? [source.path, source.provenance_manifest].filter(Boolean) : [];
for (const sourcePath of sourceStartPaths) {
  requireExisting(sourcePath);
}
const targetArtifact = source ? source.path : changeRequest.target_artifact;
const targetInGraph = source ? graphArtifacts.has(source.path) : graphArtifacts.has(changeRequest.target_artifact);
const edges = source ? edgesFromSources(graph, sourceStartPaths) : targetInGraph ? transitiveDownstreamEdges(graph, targetArtifact) : [];
const affected = source ? unique([...uniqueDownstream(edges), ...source.affected_artifacts]) : uniqueDownstream(edges);
const timestamp = new Date().toISOString();
const suffix = changeRequest.change_request_id.replace("DCR-", "");
const impactReportPath = path.posix.join(outputDir, `impact-analysis-report-${suffix}.json`);
const decisionQueuePath = path.posix.join(outputDir, `user-decision-queue-${suffix}.json`);
const runPath = path.posix.join(outputDir, `cascading-update-run-${suffix}.json`);
const xlsxChangeAnalysisPath = source ? path.posix.join(outputDir, `xlsx-change-analysis-${suffix}.json`) : null;
const sourceRequiresTeamApproval = source?.approval_status === "draft_unapproved" || source?.team_validation_status === "pending_team_review";
const sourceRequiresDownstreamResolution = Boolean(source);
const semanticOrMissingTarget = changeRequest.semantic_change || !targetInGraph || sourceRequiresTeamApproval || sourceRequiresDownstreamResolution;
const blockingDecisionId = !targetInGraph
  ? "DEC-GRAPH-TARGET-MISSING"
  : sourceRequiresTeamApproval
    ? "DEC-XLSX-TEAM-APPROVAL"
    : sourceRequiresDownstreamResolution
      ? "DEC-XLSX-DOWNSTREAM-RESOLUTION"
      : "DEC-GENERATED-SEMANTIC-CONFIRMATION";
const blockedReasons = [];

if (!targetInGraph) {
  blockedReasons.push(`Target artifact is not present in dependency graph: ${changeRequest.target_artifact}`);
}
if (changeRequest.semantic_change) {
  blockedReasons.push("Semantic changes require explicit user confirmation before edits are applied.");
}
if (sourceRequiresTeamApproval) {
  blockedReasons.push("XLSX source is draft/unapproved; team approval is required before sprint or Jira downstream use.");
}
if (source) {
  blockedReasons.push("XLSX downstream artifacts must be updated or closed with no-change rationale in impact analysis.");
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
        change_classes: changeClassesForPath(sourcePath),
      })),
      change_classes: unique(sourceStartPaths.flatMap((sourcePath) => changeClassesForPath(sourcePath))),
      downstream_seed_paths: affected,
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
  version: "0.1.0",
  impact_report_id: `IAR-${suffix}`,
  change_request_id: changeRequest.change_request_id,
  status: semanticOrMissingTarget ? "blocked" : "ready",
  generated_at: timestamp,
  target_artifact: targetArtifact,
  affected_artifacts: (targetInGraph ? affected : [targetArtifact]).map((artifactPath) => ({
    path: artifactPath,
    impact_types: source ? affectedImpactTypes(edges, artifactPath) : targetInGraph ? ["semantic"] : ["process"],
    required_edits: targetInGraph
      ? source
        ? ["Resolve XLSX/provenance impact by updating the artifact or recording no-change rationale in this impact analysis."]
        : ["Review required by artifact dependency graph."]
      : ["Add target artifact to dependency graph or choose a tracked target."],
    optional_edits: [],
    update_status: semanticOrMissingTarget ? "blocked" : "not_applicable",
    no_change_rationale: null,
  })),
  blocking_user_decisions: semanticOrMissingTarget ? [blockingDecisionId] : [],
  derived_facts: [
    {
      fact: targetInGraph
        ? source
          ? "Affected artifacts were derived from artifact-dependency-graph.json and product-source-registry.json."
          : "Affected artifacts were derived from artifact-dependency-graph.json."
        : "Target artifact was not found in artifact-dependency-graph.json.",
      source_paths: source ? [graphPath, productSourceRegistryPath] : [graphPath],
    },
  ],
  assumptions_forbidden: [
    "Do not apply semantic edits without user confirmation.",
    "Do not invent capacity, priorities, dates, scope, regulations or Jira field mapping.",
    "Do not continue a cascade run when the target artifact is missing from the dependency graph.",
    "Do not write XLSX source/provenance rationale into business Markdown artifacts.",
  ],
  proposals: [
    {
      proposal: targetInGraph
        ? source
          ? "Resolve every XLSX downstream artifact by update or no-change rationale before claiming completion."
          : "Return decision queue to the user before applying semantic edits."
        : "Register the target in the dependency graph before applying cascade edits.",
      classification: source ? "estimate_evidence" : semanticOrMissingTarget ? "blocked_missing_input" : "not_applicable",
    },
  ],
  validation_plan: source
    ? [
        "npm run validate:xlsx-backlog",
        "npm run validate:xlsx-cascade",
        "npm run validate:impact-analysis",
        "npm run validate:decision-queue",
        "npm run validate:cascading-update",
      ]
    : ["npm run validate:impact-analysis", "npm run validate:decision-queue", "npm run validate:cascading-update"],
  blocked_reasons: blockedReasons,
  edge_decisions: edges.map((edge) => ({
    upstream_artifact: edge.upstream_artifact,
    downstream_artifact: edge.downstream_artifact,
    relation_type: edge.relation_type,
    requires_user_confirmation: edge.user_confirmation_required !== "never",
    blocking_decision_id: edge.user_confirmation_required !== "never" && changeRequest.semantic_change ? blockingDecisionId : null,
  })),
  completion_status: semanticOrMissingTarget ? "blocked" : "pending",
};

const decisionQueue = {
  version: "0.1.0",
  queue_id: `UDQ-${suffix}`,
  change_request_id: changeRequest.change_request_id,
  status: semanticOrMissingTarget ? "blocked" : "closed",
  requested_at: timestamp,
  decisions: semanticOrMissingTarget
    ? [
        {
          decision_id: blockingDecisionId,
          question: targetInGraph
            ? sourceRequiresTeamApproval
              ? "Подтвердить командную оценку XLSX перед переносом ПШЕ в sprint backlog или Jira import?"
              : sourceRequiresDownstreamResolution
                ? "Закрыть downstream-влияние XLSX обновлениями или no-change rationale перед завершением?"
                : "Confirm semantic edits before applying cascading documentation updates?"
            : "Add the target artifact to the dependency graph before applying cascade updates?",
          affected_artifacts: affected.length > 0 ? affected : [targetArtifact],
          options: [
            {
              option_id: targetInGraph
                ? sourceRequiresTeamApproval
                  ? "OPT-TEAM-APPROVED"
                  : sourceRequiresDownstreamResolution
                    ? "OPT-RESOLVE-DOWNSTREAM"
                    : "OPT-CONFIRM-EDITS"
                : "OPT-REGISTER-TARGET",
              label: targetInGraph
                ? sourceRequiresTeamApproval
                  ? "Оценка команды подтверждена"
                  : sourceRequiresDownstreamResolution
                    ? "Закрыть downstream"
                    : "Подтвердить правки"
                : "Зарегистрировать артефакт",
              consequence: targetInGraph
                ? sourceRequiresTeamApproval
                  ? "Downstream-артефакты sprint и Jira смогут использовать ПШЕ после закрытия каскадного влияния."
                  : sourceRequiresDownstreamResolution
                    ? "Каждый затронутый артефакт нужно обновить или закрыть no-change rationale в impact analysis."
                    : "Runner сможет применить подтвержденные смысловые правки отдельным шагом реализации."
                : "Следующий сухой запуск сможет посчитать downstream-влияние по графу.",
              recommended: false,
            },
            {
              option_id: "OPT-DEFER",
              label: "Отложить правки",
              consequence: "Каскадный запуск остается заблокированным, смысловые правки не применяются.",
              recommended: true,
            },
          ],
          recommended_option_id: "OPT-DEFER",
          recommendation_rationale: "Runner не может сам принять смысловое решение, командное подтверждение или решение о границах графа.",
          status: "pending",
          blocking: true,
          requested_at: timestamp,
          resolved_at: null,
          selected_option_id: null,
          source: changeRequestPath,
        },
      ]
    : [],
};

const run = {
  version: "0.1.0",
  run_id: `CUR-${suffix}`,
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
	  changed_artifacts: [],
  skipped_artifacts: [],
  generated_artifacts: [
    {
      path: impactReportPath,
      generator_command: "node scripts/run-cascading-update.mjs"
    },
	    {
	      path: decisionQueuePath,
	      generator_command: "node scripts/run-cascading-update.mjs"
	    }
	  ].concat(
	    xlsxChangeAnalysisPath
	      ? [
	          {
	            path: xlsxChangeAnalysisPath,
	            generator_command: "node scripts/run-cascading-update.mjs"
	          }
	        ]
	      : [],
	  ),
	  validation_results: [
	    {
	      command: source ? "npm run validate:xlsx-cascade" : "npm run validate:cascading-governance",
	      status: "not_run",
	      evidence: "Generated dry-run evidence must be validated after review.",
	      ran_at: timestamp
	    }
	  ],
	  evidence_paths: [impactReportPath, decisionQueuePath].concat(xlsxChangeAnalysisPath ? [xlsxChangeAnalysisPath] : []),
  completion_claim: {
    done_claimed: false,
    decision_queue_status: decisionQueue.status,
    all_affected_artifacts_resolved: false
  }
};

writeJson(impactReportPath, impactReport);
writeJson(decisionQueuePath, decisionQueue);
if (xlsxChangeAnalysisPath) {
  writeJson(xlsxChangeAnalysisPath, xlsxChangeAnalysis);
}
writeJson(runPath, run);

console.log(`impact report written: ${impactReportPath}`);
console.log(`decision queue written: ${decisionQueuePath}`);
if (xlsxChangeAnalysisPath) {
  console.log(`xlsx change analysis written: ${xlsxChangeAnalysisPath}`);
}
console.log(`cascade run written: ${runPath}`);
if (decisionQueue.status === "blocked") {
  console.log(`cascade runner stopped before semantic edits: ${blockedReasons.join(" ")}`);
}
