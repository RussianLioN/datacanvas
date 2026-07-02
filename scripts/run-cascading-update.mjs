import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  fs.mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
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
  return [...downstream];
}

const changeRequestPath = argValue("--change-request");
const graphPath = argValue("--dependency-graph", "docs/process/cascading-governance/artifact-dependency-graph.json");
const outputDir = argValue("--output-dir");

if (!changeRequestPath || !outputDir) {
  fail("usage: node scripts/run-cascading-update.mjs --change-request <path> --output-dir <dir> [--dependency-graph <path>]");
}

const changeRequest = readJson(changeRequestPath);
const graph = readJson(graphPath);
const affected = transitiveDownstream(graph, changeRequest.target_artifact);
const timestamp = new Date().toISOString();
const suffix = changeRequest.change_request_id.replace("DCR-", "");
const impactReportPath = path.posix.join(outputDir, `impact-analysis-report-${suffix}.json`);
const decisionQueuePath = path.posix.join(outputDir, `user-decision-queue-${suffix}.json`);

const impactReport = {
  version: "0.1.0",
  impact_report_id: `IAR-${suffix}`,
  change_request_id: changeRequest.change_request_id,
  status: affected.length > 0 && changeRequest.semantic_change ? "blocked" : "ready",
  generated_at: timestamp,
  target_artifact: changeRequest.target_artifact,
  affected_artifacts: affected.map((artifactPath) => ({
    path: artifactPath,
    impact_types: ["semantic"],
    required_edits: ["Review required by artifact dependency graph."],
    optional_edits: [],
    update_status: changeRequest.semantic_change ? "pending" : "not_applicable",
    no_change_rationale: null,
  })),
  blocking_user_decisions: changeRequest.semantic_change ? ["DEC-GENERATED-SEMANTIC-CONFIRMATION"] : [],
  derived_facts: [
    {
      fact: "Affected artifacts were derived from artifact-dependency-graph.json.",
      source_paths: [graphPath],
    },
  ],
  assumptions_forbidden: [
    "Do not apply semantic edits without user confirmation.",
    "Do not invent capacity, priorities, dates, scope, regulations or Jira field mapping.",
  ],
  proposals: [
    {
      proposal: "Return decision queue to the user before applying semantic edits.",
      classification: changeRequest.semantic_change ? "requires_user_confirmation" : "not_applicable",
    },
  ],
  validation_plan: ["npm run validate:impact-analysis", "npm run validate:decision-queue"],
  completion_status: changeRequest.semantic_change ? "blocked" : "pending",
};

const decisionQueue = {
  version: "0.1.0",
  queue_id: `UDQ-${suffix}`,
  change_request_id: changeRequest.change_request_id,
  status: changeRequest.semantic_change ? "blocked" : "closed",
  requested_at: timestamp,
  decisions: changeRequest.semantic_change
    ? [
        {
          decision_id: "DEC-GENERATED-SEMANTIC-CONFIRMATION",
          question: "Confirm semantic edits before applying cascading documentation updates?",
          affected_artifacts: affected.length > 0 ? affected : [changeRequest.target_artifact],
          options: [
            {
              option_id: "OPT-CONFIRM-EDITS",
              label: "Confirm edits",
              consequence: "Runner may apply confirmed semantic edits in a follow-up implementation step.",
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
          recommendation_rationale: "Generated runner output cannot infer user intent for semantic decisions.",
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

writeJson(impactReportPath, impactReport);
writeJson(decisionQueuePath, decisionQueue);

console.log(`impact report written: ${impactReportPath}`);
console.log(`decision queue written: ${decisionQueuePath}`);
if (decisionQueue.status === "blocked") {
  console.log("cascade runner stopped before semantic edits because blocking decisions exist");
}
