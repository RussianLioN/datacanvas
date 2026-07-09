import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const mode = process.argv[2] ?? "all";
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(JSON.parse(fs.readFileSync(path.join(root, "schemas/common-defs.schema.json"), "utf8")));
const validators = new Map();
const co2026001RunRoot = "docs/process/cascading-governance/runs/2026-07-02-co-2026-001-q3-priority-impact";

const schemaCases = {
  "documentation-change-request": [
    ["schemas/documentation-change-request.schema.json", "docs/process/cascading-governance/documentation-change-request.json"],
    ["schemas/documentation-change-request.schema.json", "tests/fixtures/cascading-governance/vision-change-request.json"],
    [
      "schemas/documentation-change-request.schema.json",
      `${co2026001RunRoot}/documentation-change-request-2026-07-02-002.json`,
    ],
  ],
  "artifact-dependency-graph": [
    ["schemas/artifact-dependency-graph.schema.json", "docs/process/cascading-governance/artifact-dependency-graph.json"],
  ],
  "impact-analysis": [
    ["schemas/impact-analysis-report.schema.json", "docs/process/cascading-governance/impact-analysis-report.json"],
    ["schemas/impact-analysis-report.schema.json", "tests/fixtures/cascading-governance/vision-impact-analysis-report.json"],
    ["schemas/impact-analysis-report.schema.json", `${co2026001RunRoot}/impact-analysis-report-2026-07-02-002.json`],
    [
      "schemas/impact-analysis-report.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/impact-complete-pending-artifacts.json",
      { expect: "fail", phase: "invariant", reason: "complete impact with pending artifact" },
    ],
  ],
  "decision-queue": [
    ["schemas/user-decision-queue.schema.json", "docs/process/cascading-governance/user-decision-queue.json"],
    ["schemas/user-decision-queue.schema.json", `${co2026001RunRoot}/user-decision-queue-2026-07-02-002.json`],
    [
      "schemas/user-decision-queue.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/decision-queue-closed-with-pending.json",
      { expect: "fail", phase: "invariant", reason: "closed queue with pending decision" },
    ],
  ],
  "capacity-plan": [
    ["schemas/capacity-plan.schema.json", "docs/process/cascading-governance/capacity-plan-2026-q3.json"],
    [
      "schemas/capacity-plan.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/capacity-active-null.json",
      { expect: "fail", phase: "invariant", reason: "active capacity with null values" },
    ],
  ],
  "reprioritization-impact": [
    ["schemas/reprioritization-impact-report.schema.json", "docs/process/cascading-governance/reprioritization-impact-report.json"],
    [
      "schemas/reprioritization-impact-report.schema.json",
      `${co2026001RunRoot}/reprioritization-impact-report-2026-07-02-002.json`,
    ],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/backlog-reprioritization-over-capacity.json"],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/backlog-reprioritization-enough-capacity.json"],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/backlog-reprioritization-missing-capacity.json"],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/user-rejects-story-move.json"],
    ["schemas/reprioritization-impact-report.schema.json", "tests/fixtures/cascading-governance/user-confirms-story-move-q4.json"],
    [
      "schemas/reprioritization-impact-report.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/reprioritization-over-capacity-ready.json",
      { expect: "fail", phase: "invariant", reason: "over capacity without confirmed trade-off" },
    ],
  ],
  "cascading-update": [
    ["schemas/cascading-update-run.schema.json", "docs/process/cascading-governance/runs/2026-07-02-cascade-contract/cascading-update-run.json"],
    ["schemas/cascading-update-run.schema.json", `${co2026001RunRoot}/cascading-update-run-2026-07-02-002.json`],
    [
      "schemas/cascading-update-run.schema.json",
      "tests/fixtures/cascading-governance/cascading-update-blocked-done-claim.json",
      { expect: "fail", phase: "invariant", reason: "Done claimed with blocked decisions" },
    ],
    [
      "schemas/cascading-update-run.schema.json",
      "tests/fixtures/cascading-governance/negative/schema/cascading-update-path-traversal.json",
      { expect: "fail", phase: "schema", reason: "path traversal" },
    ],
  ],
  "jira-field-mapping": [
    ["schemas/jira-field-mapping-request.schema.json", "docs/process/cascading-governance/jira-field-mapping-request.json"],
    ["schemas/jira-import-package-manifest.schema.json", "docs/process/cascading-governance/jira-import-package-manifest.json"],
    ["schemas/jira-field-mapping-request.schema.json", "tests/fixtures/cascading-governance/jira-field-mapping-unresolved.json"],
    [
      "schemas/jira-import-package-manifest.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-import-ready-without-mapping.json",
      { expect: "fail", phase: "invariant", reason: "ready package without approved mapping request" },
    ],
  ],
  "xlsx-cascade": [
    ["schemas/xlsx-change-analysis.schema.json", "tests/fixtures/cascading-governance/xlsx-change-analysis-valid.json"],
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

function expectedPhase(expectation) {
  if (expectation === "negative") {
    return "invariant";
  }
  return expectation?.phase ?? null;
}

function isExpectedFailure(expectation) {
  return expectation === "negative" || expectation?.expect === "fail";
}

function validateWithSchema(schemaPath, dataPath, expectation) {
  let validate = validators.get(schemaPath);
  if (!validate) {
    validate = ajv.compile(readJson(schemaPath));
    validators.set(schemaPath, validate);
  }
  const data = readJson(dataPath);
  if (!validate(data)) {
    if (isExpectedFailure(expectation) && expectedPhase(expectation) === "schema") {
      console.log(`negative schema fixture rejected as expected: ${dataPath}`);
      return { data: null, schemaRejected: true };
    }
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
  return { data, schemaRejected: false };
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

function downstreamClosureFrom(graph, sourcePaths) {
  const closure = new Set();
  for (const sourcePath of sourcePaths) {
    for (const downstreamPath of transitiveDownstream(graph, sourcePath)) {
      closure.add(downstreamPath);
    }
  }
  return closure;
}

function assertAffectedArtifacts(report, requiredPaths, label) {
  const affected = new Set(report.affected_artifacts.map((artifact) => artifact.path));
  for (const requiredPath of requiredPaths) {
    if (!affected.has(requiredPath)) {
      throw new Error(`${label} impact report is missing affected artifact: ${requiredPath}`);
    }
  }
}

function assertNoBlockingQueueDone(queue) {
  const openBlocking = queue.decisions.filter((decision) =>
    decision.blocking && ["pending", "deferred"].includes(decision.status),
  );
  const openDecisions = queue.decisions.filter((decision) => ["pending", "deferred"].includes(decision.status));

  if (queue.status === "closed" && openDecisions.length > 0) {
    throw new Error(`closed decision queue has open decisions: ${openDecisions.map((item) => item.decision_id).join(", ")}`);
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
    "analysis source",
    "working backlog",
    "provenance manifest",
    "source registry",
    "evidence index",
    "resource estimation",
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

  for (const highImpactSource of [
    "docs/product-vision.md",
    "docs/product/sources/raw/bl-value-rm-data-canvas.xlsx",
    "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx",
    "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json",
  ]) {
    if (!graph.high_impact_sources.includes(highImpactSource)) {
      throw new Error(`dependency graph must mark ${highImpactSource} as high-impact source`);
    }
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

  const storyToBacklog = graph.dependencies.find((dependency) =>
    dependency.upstream_artifact === "docs/stories.md" &&
    dependency.downstream_artifact === "docs/product/backlog/product-backlog.md"
  );
  if (!storyToBacklog || /estimate/i.test(storyToBacklog.update_rule)) {
    throw new Error("story catalog dependency must not treat estimates as story-catalog content");
  }

  const productSourceRegistry = readJson("docs/product/sources/product-source-registry.json");
  const xlsxSources = productSourceRegistry.sources.filter((source) =>
    ["SRC-DC-STORIES-XLSX-RAW", "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08"].includes(source.source_id)
  );
  for (const source of xlsxSources) {
    const startPaths = [source.path];
    if (source.provenance_manifest) {
      startPaths.push(source.provenance_manifest);
    }
    const downstream = downstreamClosureFrom(graph, startPaths);
    for (const requiredPath of source.affected_artifacts) {
      if (!downstream.has(requiredPath)) {
        throw new Error(`XLSX source ${source.source_id} is missing downstream graph coverage for: ${requiredPath}`);
      }
    }
  }

  for (const dependency of graph.dependencies) {
    if (
      [
        "docs/product/sources/raw/bl-value-rm-data-canvas.xlsx",
        "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx",
        "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json",
      ].includes(dependency.upstream_artifact) &&
      dependency.resolution_required !== "changed_or_no_change_rationale"
    ) {
      throw new Error(`XLSX dependency must require update/no-change resolution: ${dependency.upstream_artifact} -> ${dependency.downstream_artifact}`);
    }
  }
}

function assertImpactReport(report) {
  requirePath(report.target_artifact);
  if (report.target_artifact === "docs/product-vision.md") {
    assertAffectedArtifacts(report, [
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
    ], "Vision");
  }

  if (report.target_artifact === "docs/product/change-orders/co-2026-001-a2a-first-priority.json") {
    assertAffectedArtifacts(report, [
      "docs/product/change-orders/co-2026-001-a2a-first-priority.json",
      "docs/product/change-orders/change-impact-assessment.json",
      "docs/product/change-orders/product-change-order-ledger.json",
      "docs/product/analysis/ba/ba-spec.json",
      "docs/product/bmc/bmc-v0.2.md",
      "docs/stories.md",
      "docs/product/requirements/business-requirements.md",
      "docs/product/requirements/non-functional-requirements.md",
      "docs/product/requirements/acceptance-criteria.md",
      "docs/product/backlog/product-backlog.md",
      "docs/product/roadmap/roadmap-v0.1.md",
      "docs/product/requirements/traceability-matrix.json",
      "docs/process/cascading-governance/capacity-plan-2026-q3.json",
      `${co2026001RunRoot}/reprioritization-impact-report-2026-07-02-002.json`,
      "docs/architecture/system-analysis/datacanvas-interface-control.md",
      "docs/architecture/system-analysis/datacanvas-lifecycle-state-model.md",
      "docs/architecture/system-analysis/error-taxonomy.md",
      "docs/architecture/security/integration-boundary-matrix.md",
      "docs/process/change-requests/PROC-038-cascading-documentation-governance.md",
    ], "CO-2026-001");
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

  if (["ready", "applied"].includes(report.status) && report.blocking_user_decisions.length > 0) {
    throw new Error(`${report.impact_report_id} is ${report.status} with blocking decisions`);
  }

  if (report.completion_status === "complete") {
    if (report.blocking_user_decisions.length > 0) {
      throw new Error(`${report.impact_report_id} claims complete with blocking decisions`);
    }
    const unresolved = report.affected_artifacts.filter((artifact) =>
      ["pending", "blocked"].includes(artifact.update_status),
    );
    if (unresolved.length > 0) {
      throw new Error(
        `${report.impact_report_id} claims complete with unresolved artifacts: ${unresolved
          .map((item) => item.path)
          .join(", ")}`,
      );
    }
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

  if (report.change_request_id === "DCR-2026-07-02-002") {
    const committedIds = new Set(report.committed_items.map((item) => item.item_id));
    for (const storyId of [
      "DC-ST-01",
      "DC-ST-02",
      "DC-ST-03",
      "DC-ST-04",
      "DC-ST-05",
      "DC-ST-06",
      "DC-ST-07",
      "DC-ST-08",
      "DC-ST-09",
    ]) {
      if (!committedIds.has(storyId)) {
        throw new Error(`${report.report_id} is missing current Q3 committed story: ${storyId}`);
      }
    }

    for (const decisionId of [
      "DEC-CO-2026-001-ACCEPTANCE",
      "DEC-Q3-CAPACITY-SOURCE",
      "DEC-Q3-STORY-MOVE-LIST",
      "DEC-Q3-DISPLACEMENT-RULE",
      "DEC-Q3-RESULT-CHANNEL",
      "DEC-A2A-ROLLBACK-REHEARSAL",
    ]) {
      if (!report.blocking_decisions.includes(decisionId)) {
        throw new Error(`${report.report_id} is missing blocking decision: ${decisionId}`);
      }
    }

    const unconfirmedMove = report.proposed_changes.find((change) => change.user_confirmation_status === "confirmed");
    if (unconfirmedMove) {
      throw new Error(`${report.report_id} must not confirm story moves while CO-2026-001 is deferred`);
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
    "changed_source_set_path",
    "xlsx_change_analysis_path",
  ]) {
    if (run[key] != null) {
      requirePath(run[key]);
    }
  }

  for (const artifact of [...run.changed_artifacts, ...run.generated_artifacts, ...run.skipped_artifacts]) {
    requirePath(artifact.path);
  }

  const changeRequest = readJson(run.change_request_path);
  const impactReport = readJson(run.impact_report_path);
  const decisionQueue = readJson(run.decision_queue_path);

  if (impactReport.change_request_id !== changeRequest.change_request_id) {
    throw new Error(`${run.run_id} links impact report to a different change request`);
  }
  if (decisionQueue.change_request_id !== changeRequest.change_request_id) {
    throw new Error(`${run.run_id} links decision queue to a different change request`);
  }

  const decisionIds = new Set(decisionQueue.decisions.map((decision) => decision.decision_id));
  for (const decisionId of impactReport.blocking_user_decisions) {
    if (!decisionIds.has(decisionId)) {
      throw new Error(`${run.run_id} impact report references unknown blocking decision: ${decisionId}`);
    }
  }

  if (run.completion_claim.decision_queue_status !== decisionQueue.status) {
    throw new Error(`${run.run_id} completion claim does not match linked decision queue status`);
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
    if (typeof artifact.no_change_rationale === "object") {
      requirePath(artifact.no_change_rationale.impact_report_path);
      requirePath(artifact.no_change_rationale.impact_artifact_ref);
    }
  }

  if (run.status === "complete" || run.completion_claim.done_claimed) {
    if (decisionQueue.status !== "closed") {
      throw new Error(`${run.run_id} claims Done while decision queue is not closed`);
    }
    if (!run.completion_claim.all_affected_artifacts_resolved) {
      throw new Error(`${run.run_id} claims Done while affected artifacts are unresolved`);
    }
    const unresolvedImpactArtifacts = impactReport.affected_artifacts.filter((artifact) =>
      ["pending", "blocked"].includes(artifact.update_status),
    );
    if (unresolvedImpactArtifacts.length > 0 || impactReport.blocking_user_decisions.length > 0) {
      throw new Error(`${run.run_id} claims Done while linked impact report is unresolved`);
    }
    const nonPassed = run.validation_results.filter((result) => result.status !== "passed");
    if (nonPassed.length > 0) {
      throw new Error(`${run.run_id} claims Done before all validation results passed`);
    }
  } else if (run.status === "blocked") {
    if (decisionQueue.status !== "blocked" || impactReport.completion_status !== "blocked") {
      throw new Error(`${run.run_id} is blocked but linked impact/decision artifacts are not blocked`);
    }
    const openBlocking = decisionQueue.decisions.filter((decision) =>
      decision.blocking && ["pending", "deferred"].includes(decision.status),
    );
    if (openBlocking.length === 0) {
      throw new Error(`${run.run_id} is blocked without linked open blocking decisions`);
    }
  }
}

function assertXlsxCascade(analysis) {
  const graph = readJson("docs/process/cascading-governance/artifact-dependency-graph.json");
  assertDependencyGraph(graph);

  const registry = readJson("docs/product/sources/product-source-registry.json");
  const source = registry.sources.find((candidate) => candidate.source_id === analysis.source_id);
  if (!source) {
    throw new Error(`XLSX change analysis references unknown source_id: ${analysis.source_id}`);
  }

  for (const changedSource of analysis.changed_source_set) {
    requirePath(changedSource.path);
  }

  for (const downstreamPath of analysis.downstream_seed_paths) {
    requirePath(downstreamPath);
  }

  if (analysis.downstream_resolution_policy.canonical_no_change_location !== "impact_analysis_report") {
    throw new Error("XLSX no-change rationale must be canonical in impact analysis, not business docs or registry");
  }
  if (analysis.downstream_resolution_policy.business_artifact_policy !== "no_service_rationale_in_business_docs") {
    throw new Error("XLSX cascade must keep service rationale out of business artifacts");
  }

  const downstream = downstreamClosureFrom(graph, [source.path, source.provenance_manifest].filter(Boolean));
  for (const requiredPath of source.affected_artifacts) {
    if (!downstream.has(requiredPath)) {
      throw new Error(`XLSX change analysis lacks graph coverage for registry affected artifact: ${requiredPath}`);
    }
  }

  const seedPaths = new Set(analysis.downstream_seed_paths);
  for (const requiredPath of source.affected_artifacts) {
    if (!seedPaths.has(requiredPath)) {
      throw new Error(`XLSX change analysis lacks downstream seed path from registry: ${requiredPath}`);
    }
  }

  if (source.approval_status === "draft_unapproved" && !analysis.team_approval_required) {
    throw new Error("draft XLSX source must require team approval before sprint/Jira downstream use");
  }

  for (const requiredCommand of [
    "npm run validate:xlsx-backlog",
    "npm run validate:xlsx-cascade",
    "npm run validate:product-source-consistency",
  ]) {
    if (!analysis.validation_commands.includes(requiredCommand)) {
      throw new Error(`XLSX change analysis is missing validation command: ${requiredCommand}`);
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
    const mappingRequest = readJson(data.mapping_request_path);
    if (data.status === "ready" && data.field_mapping_status !== "approved") {
      throw new Error(`${dataPath} is ready without approved field mapping`);
    }
    if (["ready", "imported"].includes(data.status)) {
      if (mappingRequest.status !== "approved" || mappingRequest.import_readiness_status !== "ready") {
        throw new Error(`${dataPath} is ready/imported but linked mapping request is not approved`);
      }
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
  "xlsx-cascade": assertXlsxCascade,
};

for (const selectedMode of selectedModes) {
  const cases = schemaCases[selectedMode];
  if (!cases) {
    fail(`unknown cascading governance validation mode: ${selectedMode}`);
  }

  for (const [schemaPath, dataPath, expectation] of cases) {
    const { data, schemaRejected } = validateWithSchema(schemaPath, dataPath, expectation);
    if (schemaRejected) {
      continue;
    }
    const assertInvariant = invariants[selectedMode];
    if (!assertInvariant) {
      continue;
    }

    try {
      assertInvariant(data, dataPath);
      if (isExpectedFailure(expectation)) {
        fail(`negative fixture unexpectedly passed invariants: ${dataPath}`);
      }
    } catch (error) {
      if (isExpectedFailure(expectation) && expectedPhase(expectation) === "invariant") {
        console.log(`negative invariant fixture rejected as expected: ${dataPath} (${expectation.reason ?? error.message})`);
        continue;
      }
      throw error;
    }
  }

  console.log(`cascading governance validation passed: ${selectedMode}`);
}
