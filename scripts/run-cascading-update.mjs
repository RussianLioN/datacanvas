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
  if (!relativePath || path.isAbsolute(relativePath) || /^[A-Za-z]:[\\/]/.test(relativePath)) {
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

const rawChangeRequestPath = argValue("--change-request");
const rawOutputDir = argValue("--output-dir");

if (process.argv.includes("--apply")) {
  fail("runner supports dry-run evidence generation only; --apply is not supported");
}

if (!rawChangeRequestPath || !rawOutputDir) {
  fail("usage: node scripts/run-cascading-update.mjs --change-request <path> --output-dir <dir> [--dependency-graph <path>]");
}

const changeRequestPath = normalizeRepoPath(rawChangeRequestPath);
const graphPath = normalizeRepoPath(
  argValue("--dependency-graph", "docs/process/cascading-governance/artifact-dependency-graph.json"),
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
const targetInGraph = graphArtifacts.has(changeRequest.target_artifact);
const edges = targetInGraph ? transitiveDownstreamEdges(graph, changeRequest.target_artifact) : [];
const affected = uniqueDownstream(edges);
const timestamp = new Date().toISOString();
const suffix = changeRequest.change_request_id.replace("DCR-", "");
const impactReportPath = path.posix.join(outputDir, `impact-analysis-report-${suffix}.json`);
const decisionQueuePath = path.posix.join(outputDir, `user-decision-queue-${suffix}.json`);
const runPath = path.posix.join(outputDir, `cascading-update-run-${suffix}.json`);
const semanticOrMissingTarget = changeRequest.semantic_change || !targetInGraph;
const blockingDecisionId = targetInGraph ? "DEC-GENERATED-SEMANTIC-CONFIRMATION" : "DEC-GRAPH-TARGET-MISSING";
const blockedReasons = [];

if (!targetInGraph) {
  blockedReasons.push(`Target artifact is not present in dependency graph: ${changeRequest.target_artifact}`);
}
if (changeRequest.semantic_change) {
  blockedReasons.push("Semantic changes require explicit user confirmation before edits are applied.");
}

const impactReport = {
  version: "0.1.0",
  impact_report_id: `IAR-${suffix}`,
  change_request_id: changeRequest.change_request_id,
  status: semanticOrMissingTarget ? "blocked" : "ready",
  generated_at: timestamp,
  target_artifact: changeRequest.target_artifact,
  affected_artifacts: (targetInGraph ? affected : [changeRequest.target_artifact]).map((artifactPath) => ({
    path: artifactPath,
    impact_types: targetInGraph ? ["semantic"] : ["process"],
    required_edits: targetInGraph
      ? ["Review required by artifact dependency graph."]
      : ["Add target artifact to dependency graph or choose a tracked target."],
    optional_edits: [],
    update_status: semanticOrMissingTarget ? "blocked" : "not_applicable",
    no_change_rationale: null,
  })),
  blocking_user_decisions: semanticOrMissingTarget ? [blockingDecisionId] : [],
  derived_facts: [
    {
      fact: targetInGraph
        ? "Affected artifacts were derived from artifact-dependency-graph.json."
        : "Target artifact was not found in artifact-dependency-graph.json.",
      source_paths: [graphPath],
    },
  ],
  assumptions_forbidden: [
    "Do not apply semantic edits without user confirmation.",
    "Do not invent capacity, priorities, dates, scope, regulations or Jira field mapping.",
    "Do not continue a cascade run when the target artifact is missing from the dependency graph.",
  ],
  proposals: [
    {
      proposal: targetInGraph
        ? "Return decision queue to the user before applying semantic edits."
        : "Register the target in the dependency graph before applying cascade edits.",
      classification: semanticOrMissingTarget ? "blocked_missing_input" : "not_applicable",
    },
  ],
  validation_plan: ["npm run validate:impact-analysis", "npm run validate:decision-queue", "npm run validate:cascading-update"],
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
            ? "Confirm semantic edits before applying cascading documentation updates?"
            : "Add the target artifact to the dependency graph before applying cascade updates?",
          affected_artifacts: affected.length > 0 ? affected : [changeRequest.target_artifact],
          options: [
            {
              option_id: targetInGraph ? "OPT-CONFIRM-EDITS" : "OPT-REGISTER-TARGET",
              label: targetInGraph ? "Confirm edits" : "Register target",
              consequence: targetInGraph
                ? "Runner may apply confirmed semantic edits in a follow-up implementation step."
                : "Future dry-run can calculate downstream impact from the graph.",
              recommended: false,
            },
            {
              option_id: "OPT-DEFER",
              label: "Defer edits",
              consequence: "Cascade run remains blocked and no semantic edits are applied.",
              recommended: true,
            },
          ],
          recommended_option_id: "OPT-DEFER",
          recommendation_rationale: "Generated runner output cannot infer user intent for semantic or graph-scope decisions.",
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
  ],
  validation_results: [
    {
      command: "npm run validate:cascading-governance",
      status: "not_run",
      evidence: "Generated dry-run evidence must be validated after review.",
      ran_at: timestamp
    }
  ],
  evidence_paths: [impactReportPath, decisionQueuePath],
  completion_claim: {
    done_claimed: false,
    decision_queue_status: decisionQueue.status,
    all_affected_artifacts_resolved: false
  }
};

writeJson(impactReportPath, impactReport);
writeJson(decisionQueuePath, decisionQueue);
writeJson(runPath, run);

console.log(`impact report written: ${impactReportPath}`);
console.log(`decision queue written: ${decisionQueuePath}`);
console.log(`cascade run written: ${runPath}`);
if (decisionQueue.status === "blocked") {
  console.log(`cascade runner stopped before semantic edits: ${blockedReasons.join(" ")}`);
}
