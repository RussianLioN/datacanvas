import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const mode = process.argv[2] ?? "all";
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validators = new Map();

const schemaCases = {
  "documentation-change-request": [
    ["schemas/documentation-change-request.schema.json", "docs/process/cascading-governance/documentation-change-request.json"],
    ["schemas/documentation-change-request.schema.json", "tests/fixtures/cascading-governance/vision-change-request.json"],
  ],
  "artifact-dependency-graph": [
    ["schemas/artifact-dependency-graph.schema.json", "docs/process/cascading-governance/artifact-dependency-graph.json"],
  ],
  "impact-analysis": [
    ["schemas/impact-analysis-report.schema.json", "docs/process/cascading-governance/impact-analysis-report.json"],
    ["schemas/impact-analysis-report.schema.json", "tests/fixtures/cascading-governance/vision-impact-analysis-report.json"],
  ],
  "decision-queue": [
    ["schemas/user-decision-queue.schema.json", "docs/process/cascading-governance/user-decision-queue.json"],
  ],
  "capacity-plan": [
    ["schemas/capacity-plan.schema.json", "docs/process/cascading-governance/capacity-plan-2026-q3.json"],
  ],
  "reprioritization-impact": [
    ["schemas/reprioritization-impact-report.schema.json", "docs/process/cascading-governance/reprioritization-impact-report.json"],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/backlog-reprioritization-over-capacity.json"],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/backlog-reprioritization-enough-capacity.json"],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/backlog-reprioritization-missing-capacity.json"],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/user-rejects-story-move.json"],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/user-confirms-story-move-q4.json"],
  ],
  "cascading-update": [
    ["schemas/cascading-update-run.schema.json", "docs/process/cascading-governance/runs/2026-07-02-cascade-contract/cascading-update-run.json"],
    ["schemas/cascading-update-run.schema.json", "tests/fixtures/cascading-governance/cascading-update-blocked-done-claim.json", "negative"],
  ],
  "jira-field-mapping": [
    ["schemas/jira-field-mapping-request.schema.json", "docs/process/cascading-governance/jira-field-mapping-request.json"],
    ["schemas/jira-import-package-manifest.schema.json", "docs/process/cascading-governance/jira-import-package-manifest.json"],
    ["schemas/jira-field-mapping-request.schema.json", "tests/fixtures/cascading-governance/jira-field-mapping-unresolved.json"],
  ],
};

const allModes = Object.keys(schemaCases);
const selectedModes = mode === "all" ? allModes : [mode];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

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

function requirePath(relativePath) {
  if (!exists(relativePath)) {
    fail(`required path does not exist: ${relativePath}`);
  }
}

function validateWithSchema(schemaPath, dataPath) {
  let validate = validators.get(schemaPath);
  if (!validate) {
    validate = ajv.compile(readJson(schemaPath));
    validators.set(schemaPath, validate);
  }
  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
  return data;
}

function approxEqual(left, right) {
  return Math.abs(left - right) < 0.000001;
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

function assertNoBlockingQueueDone(queue) {
  const openBlocking = queue.decisions.filter((decision) =>
    decision.blocking && ["pending", "deferred"].includes(decision.status),
  );

  if (queue.status === "closed" && openBlocking.length > 0) {
    throw new Error(`closed decision queue has blocking decisions: ${openBlocking.map((item) => item.decision_id).join(", ")}`);
  }

  if (queue.status !== "closed" && openBlocking.length === 0) {
    throw new Error("open/blocked decision queue must contain a blocking pending or deferred decision");
  }
}

function assertDocumentationChangeRequest(data) {
  requirePath(data.target_artifact);
  if (data.status === "completed" && data.semantic_change && data.user_confirmation_status !== "confirmed") {
    throw new Error(`${data.change_request_id} is completed semantic change without confirmed user status`);
  }
}

function assertDependencyGraph(graph) {
  const requiredLayers = new Set([
    "Vision",
    "BMC",
    "Product Goal",
    "hypotheses",
    "stories",
    "business requirements",
    "NFR",
    "acceptance criteria",
    "product backlog",
    "technical/eval/process backlog",
    "roadmap",
    "capacity plan",
    "sprint artifacts",
    "release evidence",
    "Jira import package",
  ]);
  const layers = new Set(graph.artifacts.map((artifact) => artifact.layer));
  for (const layer of requiredLayers) {
    if (!layers.has(layer)) {
      throw new Error(`dependency graph is missing layer: ${layer}`);
    }
  }

  const artifactPaths = new Set();
  for (const artifact of graph.artifacts) {
    if (artifactPaths.has(artifact.path)) {
      throw new Error(`duplicate graph artifact path: ${artifact.path}`);
    }
    artifactPaths.add(artifact.path);
    requirePath(artifact.path);
  }

  if (!graph.high_impact_sources.includes("docs/product-vision.md")) {
    throw new Error("dependency graph must mark docs/product-vision.md as high-impact source");
  }

  const visionDownstream = transitiveDownstream(graph, "docs/product-vision.md");
  for (const requiredPath of [
    "docs/product/bmc/bmc-v0.2.md",
    "docs/stories.md",
    "docs/product/requirements/business-requirements.md",
    "docs/product/requirements/non-functional-requirements.md",
    "docs/product/requirements/acceptance-criteria.md",
    "docs/product/backlog/product-backlog.md",
    "docs/product/roadmap/roadmap-v0.1.md",
    "docs/product/requirements/traceability-matrix.json",
    "docs/process/cascading-governance/capacity-plan-2026-q3.json",
    "docs/process/cascading-governance/jira-import-package-manifest.json",
    "docs/release/mvp-release-evidence-pack.json",
    "docs/sprints",
  ]) {
    if (!visionDownstream.has(requiredPath)) {
      throw new Error(`Vision downstream impact is missing: ${requiredPath}`);
    }
  }
}

function assertImpactReport(report) {
  requirePath(report.target_artifact);
  const affected = new Set(report.affected_artifacts.map((artifact) => artifact.path));
  if (report.target_artifact === "docs/product-vision.md") {
    for (const requiredPath of [
      "docs/product/bmc/bmc-v0.2.md",
      "docs/stories.md",
      "docs/product/requirements/business-requirements.md",
      "docs/product/requirements/non-functional-requirements.md",
      "docs/product/requirements/acceptance-criteria.md",
      "docs/product/backlog/product-backlog.md",
      "docs/product/roadmap/roadmap-v0.1.md",
      "docs/product/requirements/traceability-matrix.json",
      "docs/process/cascading-governance/capacity-plan-2026-q3.json",
      "docs/process/cascading-governance/jira-import-package-manifest.json",
      "docs/release/mvp-release-evidence-pack.json",
      "docs/sprints",
    ]) {
      if (!affected.has(requiredPath)) {
        throw new Error(`Vision impact report is missing affected artifact: ${requiredPath}`);
      }
    }
  }

  for (const artifact of report.affected_artifacts) {
    requirePath(artifact.path);
    if (artifact.update_status === "no_change_confirmed" && artifact.no_change_rationale === null) {
      throw new Error(`no-change artifact lacks rationale: ${artifact.path}`);
    }
    if (artifact.update_status !== "no_change_confirmed" && artifact.no_change_rationale !== null) {
      throw new Error(`changed artifact should not carry no-change rationale: ${artifact.path}`);
    }
  }

  if (report.completion_status === "complete" && report.blocking_user_decisions.length > 0) {
    throw new Error(`${report.impact_report_id} claims complete with blocking decisions`);
  }
}

function assertCapacityPlan(plan) {
  if (plan.status === "active") {
    if (plan.team_capacity_pse === null || plan.reserved_buffer_pse === null) {
      throw new Error(`${plan.capacity_plan_id} is active without confirmed capacity and buffer`);
    }
    if (plan.data_source.confirmation_status !== "confirmed") {
      throw new Error(`${plan.capacity_plan_id} is active without confirmed data source`);
    }
  }

  if (plan.status === "pending_external" && plan.data_source.source_type !== "pending_external") {
    throw new Error(`${plan.capacity_plan_id} pending_external status must use pending_external data source`);
  }
}

function assertReprioritizationReport(report) {
  const total = report.committed_items.reduce((sum, item) => sum + item.estimate_pse, 0);
  if (!approxEqual(total, report.total_committed_pse)) {
    throw new Error(`${report.report_id} total_committed_pse does not match committed_items sum`);
  }

  if (report.capacity_status === "available") {
    const expectedDelta = report.available_capacity_pse - report.reserved_buffer_pse - report.total_committed_pse;
    if (!approxEqual(expectedDelta, report.capacity_delta_pse)) {
      throw new Error(`${report.report_id} capacity_delta_pse is inconsistent`);
    }
    if (report.capacity_overrun !== (expectedDelta < 0)) {
      throw new Error(`${report.report_id} capacity_overrun flag is inconsistent`);
    }
  }

  if (["missing", "pending_external"].includes(report.capacity_status)) {
    if (report.status !== "blocked" && report.status !== "not_applicable") {
      throw new Error(`${report.report_id} missing capacity must block reprioritization or be not_applicable`);
    }
    if (report.status === "blocked" && report.blocking_decisions.length === 0) {
      throw new Error(`${report.report_id} missing capacity has no blocking decision`);
    }
  }

  const confirmedTradeoff = report.trade_off_options.some((option) => option.status === "confirmed");
  if (report.capacity_overrun && !confirmedTradeoff) {
    if (report.status !== "blocked" || report.blocking_decisions.length === 0) {
      throw new Error(`${report.report_id} over capacity without confirmed trade-off must be blocked`);
    }
  }

  if (["ready", "confirmed"].includes(report.status) && report.blocking_decisions.length > 0) {
    throw new Error(`${report.report_id} ready/confirmed report cannot keep blocking decisions`);
  }

  if (report.status === "confirmed") {
    const pendingChange = report.proposed_changes.find((change) => change.user_confirmation_status !== "confirmed");
    if (pendingChange) {
      throw new Error(`${report.report_id} confirmed report has unconfirmed proposed change: ${pendingChange.item_id}`);
    }
  }
}

function assertCascadingUpdateRun(run) {
  for (const key of [
    "change_request_path",
    "dependency_graph_path",
    "impact_report_path",
    "decision_queue_path",
    "capacity_plan_path",
    "reprioritization_report_path",
    "jira_mapping_request_path",
  ]) {
    if (run[key] !== null) {
      requirePath(run[key]);
    }
  }

  for (const artifact of [...run.changed_artifacts, ...run.generated_artifacts, ...run.skipped_artifacts]) {
    requirePath(artifact.path);
  }

  for (const artifact of run.changed_artifacts) {
    if (artifact.change_type === "semantic" && artifact.confirmation_status !== "confirmed") {
      throw new Error(`${run.run_id} has semantic update without confirmation: ${artifact.path}`);
    }
  }

  for (const artifact of run.skipped_artifacts) {
    if (artifact.confirmation_status !== "confirmed") {
      throw new Error(`${run.run_id} skipped artifact lacks confirmed no-change rationale: ${artifact.path}`);
    }
  }

  if (run.status === "complete" || run.completion_claim.done_claimed) {
    if (run.completion_claim.decision_queue_status !== "closed") {
      throw new Error(`${run.run_id} claims Done while decision queue is not closed`);
    }
    if (!run.completion_claim.all_affected_artifacts_resolved) {
      throw new Error(`${run.run_id} claims Done while affected artifacts are unresolved`);
    }
    const nonPassed = run.validation_results.filter((result) => result.status !== "passed");
    if (nonPassed.length > 0) {
      throw new Error(`${run.run_id} claims Done before all validation results passed`);
    }
  }
}

function assertJiraMapping(data, dataPath) {
  if ("mapping_request_id" in data) {
    const hasUnresolvedMapping = data.jira_field_mapping.some((entry) => entry.status !== "mapped");
    if ((data.unresolved_fields.length > 0 || hasUnresolvedMapping) && data.import_readiness_status === "ready") {
      throw new Error(`${dataPath} marks import ready with unresolved Jira fields`);
    }
    if (data.status === "approved" && data.approving_stakeholder === null) {
      throw new Error(`${dataPath} is approved without approving stakeholder`);
    }
  }

  if ("package_id" in data) {
    requirePath(data.mapping_request_path);
    if (data.status === "ready" && data.field_mapping_status !== "approved") {
      throw new Error(`${dataPath} is ready without approved field mapping`);
    }
    if (data.status === "imported" && data.import_completion_claim !== "imported_by_external_agent") {
      throw new Error(`${dataPath} claims imported without external import completion claim`);
    }
  }
}

const invariants = {
  "documentation-change-request": assertDocumentationChangeRequest,
  "artifact-dependency-graph": assertDependencyGraph,
  "impact-analysis": assertImpactReport,
  "decision-queue": assertNoBlockingQueueDone,
  "capacity-plan": assertCapacityPlan,
  "reprioritization-impact": assertReprioritizationReport,
  "cascading-update": assertCascadingUpdateRun,
  "jira-field-mapping": assertJiraMapping,
};

for (const selectedMode of selectedModes) {
  const cases = schemaCases[selectedMode];
  if (!cases) {
    fail(`unknown cascading governance validation mode: ${selectedMode}`);
  }

  for (const [schemaPath, dataPath, expectation] of cases) {
    const data = validateWithSchema(schemaPath, dataPath);
    const assertInvariant = invariants[selectedMode];
    if (!assertInvariant) {
      continue;
    }

    try {
      assertInvariant(data, dataPath);
      if (expectation === "negative") {
        fail(`negative fixture unexpectedly passed invariants: ${dataPath}`);
      }
    } catch (error) {
      if (expectation === "negative") {
        console.log(`negative fixture rejected as expected: ${dataPath}`);
        continue;
      }
      throw error;
    }
  }

  console.log(`cascading governance validation passed: ${selectedMode}`);
}
