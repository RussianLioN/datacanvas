import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  analyzeImpactCone,
  buildDependencyIndex,
  validateDeclaredCycles,
} from "./documentation-impact-graph.mjs";
import {
  acceptedOwnerDecisionRecord,
  trustedAcceptanceRecordPaths,
} from "./cascade-acceptance-records.mjs";
import { absoluteRepoPath, hashRepoPath } from "./cascade-evidence-utils.mjs";
import {
  allowedCascadeValidationCommands,
  safeValidationScriptNames,
} from "./cascade-validation-command-policy.mjs";

const root = process.cwd();
const mode = process.argv[2] ?? "all";
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(JSON.parse(fs.readFileSync(path.join(root, "schemas/common-defs.schema.json"), "utf8")));
ajv.addSchema(JSON.parse(fs.readFileSync(path.join(root, "schemas/cascade-impact-cone.schema.json"), "utf8")));
ajv.addSchema(JSON.parse(fs.readFileSync(path.join(root, "schemas/impact-analysis-report.schema.json"), "utf8")));
const validators = new Map();
const co2026001RunRoot = "docs/process/cascading-governance/runs/2026-07-02-co-2026-001-q3-priority-impact";
const cascadingRunsRoot = "docs/process/cascading-governance/runs";

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
      {
        expect: "fail",
        phase: "invariant",
        reason: "complete impact with pending artifact",
        errorIncludes: "claims complete with unresolved artifacts",
      },
    ],
  ],
  "decision-queue": [
    ["schemas/user-decision-queue.schema.json", "docs/process/cascading-governance/user-decision-queue.json"],
    ["schemas/user-decision-queue.schema.json", `${co2026001RunRoot}/user-decision-queue-2026-07-02-002.json`],
    [
      "schemas/user-decision-queue.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/decision-queue-closed-with-pending.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "closed queue with pending decision",
        errorIncludes: "closed decision queue has open decisions",
      },
    ],
  ],
  "capacity-plan": [
    ["schemas/capacity-plan.schema.json", "docs/process/cascading-governance/capacity-plan-2026-q3.json"],
    [
      "schemas/capacity-plan.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/capacity-active-null.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "active capacity with null values",
        errorIncludes: "is active without confirmed capacity and buffer",
      },
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
      {
        expect: "fail",
        phase: "invariant",
        reason: "over capacity without confirmed trade-off",
        errorIncludes: "over capacity without confirmed trade-off must be blocked",
      },
    ],
  ],
  "cascading-update": [
    ["schemas/cascading-update-run.schema.json", "docs/process/cascading-governance/runs/2026-07-02-cascade-contract/cascading-update-run.json"],
    ["schemas/cascading-update-run.schema.json", `${co2026001RunRoot}/cascading-update-run-2026-07-02-002.json`],
    [
      "schemas/cascading-update-run.schema.json",
      "tests/fixtures/cascading-governance/cascading-update-blocked-done-claim.json",
      { expect: "fail", phase: "schema", reason: "dry-run record cannot claim Done" },
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
    ["schemas/jira-field-mapping-request.schema.json", "tests/fixtures/cascading-governance/jira-field-mapping-ignored-by-design.json"],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/schema/jira-field-mapping-ignored-missing-fallback.json",
      { expect: "fail", phase: "schema", reason: "ignored Jira field without fallback field" },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/schema/jira-field-mapping-ignored-blank-fallback.json",
      { expect: "fail", phase: "schema", reason: "ignored Jira field with blank fallback field" },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/schema/jira-field-mapping-mapped-without-field.json",
      { expect: "fail", phase: "schema", reason: "mapped Jira column without Jira field" },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-field-mapping-ignored-fallback-not-mapped.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ignored Jira field fallback is not mapped",
        errorIncludes: "ignored Jira field lacks a mapped fallback",
      },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-field-mapping-duplicate-column.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "duplicate Jira mapping column",
        errorIncludes: "must map every CSV column exactly once",
      },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-field-mapping-unresolved-list-mismatch.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "unresolved Jira field list mismatch",
        errorIncludes: "unresolved_fields does not match unresolved Jira mappings",
      },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-field-mapping-ready-with-unresolved.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready Jira mapping has unresolved field",
        errorIncludes: "marks import ready with unresolved Jira fields",
      },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-field-mapping-contract-missing-column.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready Jira mapping misses contract column",
        errorIncludes: "columns differ from the Jira story import contract",
      },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-field-mapping-contract-column-order.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready Jira mapping differs from contract column order",
        errorIncludes: "columns differ from the Jira story import contract",
      },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-field-mapping-ready-without-approval.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready Jira mapping without approved status",
        errorIncludes: "is ready without approved mapping status",
      },
    ],
    [
      "schemas/jira-field-mapping-request.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-field-mapping-ready-with-blank-approver.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready Jira mapping with blank approver",
        errorIncludes: "is approved without approving stakeholder",
      },
    ],
    [
      "schemas/jira-import-package-manifest.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-import-ready-without-mapping.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready package without approved mapping request",
        errorIncludes: "is ready/imported but linked mapping request is not approved",
      },
    ],
    [
      "schemas/jira-import-package-manifest.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-import-ready-missing-csv.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready Jira package without CSV",
        errorIncludes: "is ready but CSV is not a regular file",
      },
    ],
    [
      "schemas/jira-import-package-manifest.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-import-ready-target-mismatch.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready Jira package target mismatch",
        errorIncludes: "target project differs from linked mapping request",
      },
    ],
    [
      "schemas/jira-import-package-manifest.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-import-ready-without-prepared-claim.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready Jira package without prepared claim",
        errorIncludes: "is ready without prepared import completion claim",
      },
    ],
    [
      "schemas/jira-import-package-manifest.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-import-ready-csv-is-directory.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "ready Jira package CSV is not a regular file",
        errorIncludes: "is ready but CSV is not a regular file",
      },
    ],
    [
      "schemas/jira-import-package-manifest.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-import-imported-missing-csv.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "imported Jira package without CSV",
        errorIncludes: "is imported but CSV is not a regular file",
      },
    ],
    [
      "schemas/jira-import-package-manifest.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-import-imported-target-mismatch.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "imported Jira package target mismatch",
        errorIncludes: "imported target project differs from linked mapping request",
      },
    ],
    [
      "schemas/jira-import-package-manifest.schema.json",
      "tests/fixtures/cascading-governance/negative/invariants/jira-import-imported-without-approved-status.json",
      {
        expect: "fail",
        phase: "invariant",
        reason: "imported Jira package without approved mapping status",
        errorIncludes: "is ready/imported without approved field mapping",
      },
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

function runNode(args, options = {}) {
  return execFileSync("node", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function expectNodeFailure(args, expectedMessage) {
  try {
    runNode(args);
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    if (!output.includes(expectedMessage)) {
      throw new Error(`expected failure containing "${expectedMessage}", got: ${output.trim()}`);
    }
    return;
  }
  throw new Error(`expected command to fail: node ${args.join(" ")}`);
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
    const schema = readJson(schemaPath);
    validate = (schema.$id && ajv.getSchema(schema.$id)) || ajv.compile(schema);
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

function downstreamClosureFrom(graph, sourcePaths) {
  const cone = analyzeImpactCone(
    buildDependencyIndex(graph),
    sourcePaths.map((sourcePath) => ({ path: sourcePath, change_class: "documentation" })),
  );
  return new Set(
    cone.impacted_artifacts
      .filter((artifact) => artifact.impact_directions.includes("downstream"))
      .map((artifact) => artifact.path),
  );
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
  const graphIndex = buildDependencyIndex(graph);
  validateDeclaredCycles(graphIndex, graph.declared_cycle_groups);
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

  for (const dependency of graph.dependencies) {
    if (!artifactPaths.has(dependency.upstream_artifact)) {
      throw new Error(`dependency upstream is not declared as graph artifact: ${dependency.upstream_artifact}`);
    }
    if (!artifactPaths.has(dependency.downstream_artifact)) {
      throw new Error(`dependency downstream is not declared as graph artifact: ${dependency.downstream_artifact}`);
    }
    if (dependency.resolution_required !== "changed_or_no_change_rationale") {
      throw new Error(`active dependency must require update/no-change resolution: ${dependency.upstream_artifact} -> ${dependency.downstream_artifact}`);
    }
  }

  for (const highImpactSource of [
    "docs/product-vision.md",
    "docs/knowledge/glossary.md",
    "docs/product/requirements/user-stories.md",
    "docs/product/change-orders/co-2026-002-agent-launch-delivery-scope.json",
    "docs/product/sources/reference/datacanvas-backlog-source-sanitization.json",
    "docs/product/sources/reference/datacanvas-backlog-source-sanitized.xlsx",
    "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx",
    "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json",
  ]) {
    if (!graph.high_impact_sources.includes(highImpactSource)) {
      throw new Error(`dependency graph must mark ${highImpactSource} as high-impact source`);
    }
  }

  const visionDownstream = downstreamClosureFrom(graph, ["docs/product-vision.md"]);
  for (const requiredPath of [
    "docs/product/bmc/bmc-v0.2.md",
    "docs/product/requirements/user-stories.md",
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

  const glossaryArtifact = graph.artifacts.find((artifact) => artifact.path === "docs/knowledge/glossary.md");
  if (!glossaryArtifact) {
    throw new Error("dependency graph is missing Vision glossary artifact: docs/knowledge/glossary.md");
  }
  if (!glossaryArtifact.authority_scope.includes("product_meaning")) {
    throw new Error("Vision glossary artifact must carry product_meaning authority scope");
  }

  const glossaryDownstream = downstreamClosureFrom(graph, ["docs/knowledge/glossary.md"]);
  for (const requiredPath of ["docs/product-vision.md", "docs/product/vision/manifest.json"]) {
    if (!glossaryDownstream.has(requiredPath)) {
      throw new Error(`glossary downstream impact is missing: ${requiredPath}`);
    }
  }

  const storyToBacklog = graph.dependencies.find((dependency) =>
    dependency.upstream_artifact === "docs/product/requirements/user-stories.md" &&
    dependency.downstream_artifact === "docs/product/backlog/product-backlog.md"
  );
  if (!storyToBacklog || /estimate/i.test(storyToBacklog.update_rule)) {
    throw new Error("story catalog dependency must not treat estimates as story-catalog content");
  }

  const productSourceRegistry = readJson("docs/product/sources/product-source-registry.json");
  const xlsxSources = productSourceRegistry.sources.filter((source) =>
    ["SRC-DC-STORIES-XLSX-ORIGIN-METADATA", "SRC-DC-STORIES-XLSX-SANITIZED", "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08"].includes(source.source_id)
  );
  for (const source of xlsxSources) {
    const startPaths = [source.path];
    if (source.provenance_manifest) {
      startPaths.push(source.provenance_manifest);
    }
    const changedRoots = new Set(startPaths);
    const downstream = downstreamClosureFrom(graph, startPaths);
    for (const requiredPath of source.affected_artifacts) {
      if (!changedRoots.has(requiredPath) && !downstream.has(requiredPath)) {
        throw new Error(`XLSX source ${source.source_id} is missing downstream graph coverage for: ${requiredPath}`);
      }
    }
  }

  for (const dependency of graph.dependencies) {
    if (
      [
        "docs/product/sources/reference/datacanvas-backlog-source-sanitization.json",
        "docs/product/sources/reference/datacanvas-backlog-source-sanitized.xlsx",
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
  const conePaths = new Set(report.impact_cone.impacted_artifacts.map((artifact) => artifact.path));
  const resolutionPaths = new Set(report.affected_artifacts.map((artifact) => artifact.path));
  if (conePaths.size !== resolutionPaths.size || [...conePaths].some((artifactPath) => !resolutionPaths.has(artifactPath))) {
    throw new Error(`${report.impact_report_id} resolution paths must exactly match the computed impact cone`);
  }
  if (resolutionPaths.has(report.target_artifact)) {
    throw new Error(`${report.impact_report_id} must not include the changed root as an affected artifact`);
  }
  for (const artifact of report.affected_artifacts) {
    if (["no_change_confirmed", "not_applicable"].includes(artifact.update_status) && !artifact.no_change_rationale) {
      throw new Error(`${report.impact_report_id} ${artifact.update_status} lacks no-change rationale: ${artifact.path}`);
    }
  }
  for (const artifact of report.affected_artifacts) {
    requirePath(artifact.path);
    if (artifact.update_status === "no_change_confirmed" && artifact.no_change_rationale === null) {
      throw new Error(`no-change artifact lacks rationale: ${artifact.path}`);
    }
    if (artifact.update_status === "no_change_confirmed" && artifact.no_change_rationale !== null) {
      for (const requiredField of [
        "source_artifact",
        "change_class",
        "covered_requirements",
        "acceptance_impact",
        "traceability_impact",
        "residual_risk",
        "owner_role",
        "reconsider_when",
      ]) {
        if (!(requiredField in artifact.no_change_rationale)) {
          throw new Error(`no-change rationale lacks ${requiredField}: ${artifact.path}`);
        }
      }
      if (artifact.no_change_rationale.covered_requirements.length === 0) {
        throw new Error(`no-change rationale must list covered requirements or decisions: ${artifact.path}`);
      }
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
  if (run.run_mode !== "dry_run_evidence") {
    throw new Error(`${run.run_id} must declare dry_run_evidence mode`);
  }
  if (run.apply_supported !== false) {
    throw new Error(`${run.run_id} must not imply automated apply support`);
  }
  if (run.completion_claim.ready_to_apply !== false) {
    throw new Error(`${run.run_id} must not claim ready_to_apply while runner is dry-run only`);
  }

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
    "resolution_input_path",
    "resolution_report_path",
  ]) {
    if (run[key] != null) {
      requirePath(run[key]);
    }
  }

  for (const artifact of [...run.changed_artifacts, ...run.generated_artifacts, ...run.skipped_artifacts]) {
    requirePath(artifact.path);
  }
  for (const evidenceHash of [
    ...(run.dry_run_evidence_hashes ?? []),
    ...(run.finalized_evidence_hashes ?? []),
  ]) {
    requirePath(evidenceHash.path);
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

function assertCascadingRunnerCli() {
  const changeRequestPath = "tests/fixtures/cascading-governance/vision-change-request.json";
  const malformedChangeRequestPath = `artifacts/manual/.tmp-cascade-cli-malformed-change-request-${process.pid}-${Date.now()}.json`;
  const malformedRunnerDir = `${cascadingRunsRoot}/.tmp-cascade-cli-malformed-runner-${process.pid}-${Date.now()}`;
  const alternateGraphPath = `artifacts/manual/.tmp-cascade-cli-alternate-graph-${process.pid}-${Date.now()}.json`;
  const alternateRegistryPath = `artifacts/manual/.tmp-cascade-cli-alternate-source-registry-${process.pid}-${Date.now()}.json`;
  const alternateGraphRunDir = `${cascadingRunsRoot}/.tmp-cascade-cli-alternate-graph-${process.pid}-${Date.now()}`;
  const alternateRegistryRunDir = `${cascadingRunsRoot}/.tmp-cascade-cli-alternate-registry-${process.pid}-${Date.now()}`;
  const validChangeRequest = readJson(changeRequestPath);
  fs.writeFileSync(
    absolute(malformedChangeRequestPath),
    `${JSON.stringify({ ...validChangeRequest, semantic_change: "yes" }, null, 2)}\n`,
  );
  fs.copyFileSync(
    absolute("docs/process/cascading-governance/artifact-dependency-graph.json"),
    absolute(alternateGraphPath),
  );
  fs.copyFileSync(
    absolute("docs/product/sources/product-source-registry.json"),
    absolute(alternateRegistryPath),
  );
  try {
    expectNodeFailure(
      [
        "scripts/run-cascading-update.mjs",
        "--change-request",
        malformedChangeRequestPath,
        "--output-dir",
        malformedRunnerDir,
      ],
      "documentation change request does not match schema",
    );
    expectNodeFailure(
      [
        "scripts/run-cascading-update.mjs",
        "--change-request",
        changeRequestPath,
        "--dependency-graph",
        alternateGraphPath,
        "--output-dir",
        alternateGraphRunDir,
      ],
      "dependency graph must use the canonical DataCanvas path",
    );
    expectNodeFailure(
      [
        "scripts/run-cascading-update.mjs",
        "--change-request",
        changeRequestPath,
        "--product-source-registry",
        alternateRegistryPath,
        "--output-dir",
        alternateRegistryRunDir,
      ],
      "product source registry must use the canonical DataCanvas path",
    );
  } finally {
    fs.rmSync(absolute(malformedRunnerDir), { recursive: true, force: true });
    fs.rmSync(absolute(alternateGraphRunDir), { recursive: true, force: true });
    fs.rmSync(absolute(alternateRegistryRunDir), { recursive: true, force: true });
    fs.rmSync(absolute(malformedChangeRequestPath), { force: true });
    fs.rmSync(absolute(alternateGraphPath), { force: true });
    fs.rmSync(absolute(alternateRegistryPath), { force: true });
  }
  expectNodeFailure(
    [
      "scripts/run-cascading-update.mjs",
      "--change-request",
      changeRequestPath,
      "--output-dir",
      cascadingRunsRoot,
    ],
    `output dir must be a new direct child of ${cascadingRunsRoot}`,
  );

  const collisionDir = `${cascadingRunsRoot}/.tmp-cascade-cli-collision-${process.pid}-${Date.now()}`;
  fs.mkdirSync(absolute(collisionDir), { recursive: true });
  try {
    expectNodeFailure(
      [
        "scripts/run-cascading-update.mjs",
        "--change-request",
        changeRequestPath,
        "--output-dir",
        collisionDir,
      ],
      "output dir already exists",
    );
  } finally {
    fs.rmSync(absolute(collisionDir), { recursive: true, force: true });
  }

  const successDir = `${cascadingRunsRoot}/.tmp-cascade-cli-success-${process.pid}-${Date.now()}`;
  const xlsxRunDir = `${cascadingRunsRoot}/.tmp-cascade-cli-xlsx-${process.pid}-${Date.now()}`;
  const untrustedFinalizationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-untrusted-finalization-${process.pid}-${Date.now()}`;
  const malformedFinalizationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-malformed-finalization-${process.pid}-${Date.now()}`;
  const missingOwnerFinalizationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-missing-owner-finalization-${process.pid}-${Date.now()}`;
  const noDecisionRunDir = `${cascadingRunsRoot}/.tmp-cascade-cli-no-decision-${process.pid}-${Date.now()}`;
  const noDecisionFinalizationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-no-decision-finalization-${process.pid}-${Date.now()}`;
  const narrowedValidationFinalizationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-narrowed-validation-finalization-${process.pid}-${Date.now()}`;
  const tamperedDryRunBaselineFinalizationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-tampered-dry-run-baseline-finalization-${process.pid}-${Date.now()}`;
  const narrowedDryRunEvidenceFinalizationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-narrowed-dry-run-evidence-finalization-${process.pid}-${Date.now()}`;
  const validVerificationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-valid-verification-${process.pid}-${Date.now()}`;
  const narrowedValidationVerificationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-narrowed-validation-verification-${process.pid}-${Date.now()}`;
  const narrowConeVerificationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-narrow-cone-verification-${process.pid}-${Date.now()}`;
  const malformedVerificationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-malformed-verification-${process.pid}-${Date.now()}`;
  const tamperedBaselineVerificationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-tampered-baseline-verification-${process.pid}-${Date.now()}`;
  const tamperedVerificationDir = `${cascadingRunsRoot}/.tmp-cascade-cli-tampered-verification-${process.pid}-${Date.now()}`;
  const tamperedVerificationRunDir = `${cascadingRunsRoot}/.tmp-cascade-cli-tampered-run-${process.pid}-${Date.now()}`;
  const narrowedValidationRunDir = `${cascadingRunsRoot}/.tmp-cascade-cli-narrowed-validation-run-${process.pid}-${Date.now()}`;
  const narrowConeRunDir = `${cascadingRunsRoot}/.tmp-cascade-cli-narrow-cone-run-${process.pid}-${Date.now()}`;
  const acceptancePath = `artifacts/manual/.tmp-cascade-cli-acceptance-${process.pid}-${Date.now()}.json`;
  const resolutionPath = `artifacts/manual/.tmp-cascade-cli-resolution-${process.pid}-${Date.now()}.json`;
  const malformedRunPath = `artifacts/manual/.tmp-cascade-cli-malformed-run-${process.pid}-${Date.now()}.json`;
  const malformedResolutionPath = `artifacts/manual/.tmp-cascade-cli-malformed-resolution-${process.pid}-${Date.now()}.json`;
  const missingOwnerResolutionPath = `artifacts/manual/.tmp-cascade-cli-missing-owner-resolution-${process.pid}-${Date.now()}.json`;
  const noDecisionChangeRequestPath = `artifacts/manual/.tmp-cascade-cli-change-request-${process.pid}-${Date.now()}.json`;
  const noDecisionResolutionPath = `artifacts/manual/.tmp-cascade-cli-no-decision-resolution-${process.pid}-${Date.now()}.json`;
  const malformedVerificationRunPath = `artifacts/manual/.tmp-cascade-cli-malformed-verification-run-${process.pid}-${Date.now()}.json`;
  const tamperedVerificationRunPath = `${tamperedVerificationRunDir}/cascading-update-run-resolved-2026-07-10-102.json`;
  const narrowedValidationRunPath = `${narrowedValidationRunDir}/cascading-update-run-resolved-2026-07-10-102.json`;
  const narrowConeRunPath = `${narrowConeRunDir}/cascading-update-run-resolved-2026-07-10-102.json`;
  try {
    const changeRequest = readJson(changeRequestPath);
    const suffix = changeRequest.change_request_id.replace("DCR-", "");
    const output = runNode([
      "scripts/run-cascading-update.mjs",
      "--change-request",
      changeRequestPath,
      "--output-dir",
      successDir,
    ]);
    if (!output.includes("cascade run written")) {
      throw new Error(`runner did not report generated dry-run evidence: ${output.trim()}`);
    }
    for (const requiredName of [
      `impact-analysis-report-${suffix}.json`,
      `user-decision-queue-${suffix}.json`,
      `cascade-baseline-manifest-${suffix}.json`,
      `impact-analysis-report-${suffix}.md`,
      `cascading-update-run-${suffix}.json`,
    ]) {
      if (!exists(`${successDir}/${requiredName}`)) {
        throw new Error(`runner did not create expected output: ${successDir}/${requiredName}`);
      }
    }
    const generatedRunPath = `${successDir}/cascading-update-run-${suffix}.json`;
    const generatedRun = readJson(generatedRunPath);
    assertCascadingUpdateRun(generatedRun);
    validateWithSchema(
      "schemas/cascade-baseline-manifest.schema.json",
      `${successDir}/cascade-baseline-manifest-${suffix}.json`,
    );
    if (!readText(`${successDir}/impact-analysis-report-${suffix}.md`).includes("# Отчет о каскадном влиянии")) {
      throw new Error("runner human impact report lacks the expected heading");
    }

    runNode([
      "scripts/run-cascading-update.mjs",
      "--change-request",
      changeRequestPath,
      "--source-id",
      "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08",
      "--output-dir",
      xlsxRunDir,
    ]);
    const generatedXlsxAnalysis = readJson(`${xlsxRunDir}/xlsx-change-analysis-${suffix}.json`);
    const generatedXlsxImpact = readJson(`${xlsxRunDir}/impact-analysis-report-${suffix}.json`);
    const expectedXlsxSources = generatedXlsxAnalysis.changed_source_set.map((sourceArtifact) => ({
      path: sourceArtifact.path,
      change_class: sourceArtifact.change_classes[0],
    })).sort((left, right) => left.path.localeCompare(right.path));
    if (!isDeepStrictEqual(generatedXlsxImpact.impact_cone.changed_source_set, expectedXlsxSources)) {
      throw new Error("XLSX runner did not preserve the changed source set used by impact recalculation");
    }

    const generatedImpact = readJson(`${successDir}/impact-analysis-report-${suffix}.json`);
    const generatedQueue = readJson(`${successDir}/user-decision-queue-${suffix}.json`);
    if (
      generatedQueue.decisions.length === 0 ||
      generatedQueue.decisions.some(
        (decision) => !decision.decision_id.startsWith(`DEC-${suffix}-`) || !decision.owner_role,
      ) ||
      new Set(generatedQueue.decisions.map((decision) => decision.decision_id)).size !== generatedQueue.decisions.length
    ) {
      throw new Error("runner decisions must be unique to the cascade run and assigned to explicit owners");
    }
    const resolvedAt = "2026-07-10T12:00:00.000Z";
    const acceptanceRecords = generatedQueue.decisions.map((decision) => ({
      acceptance_record_id: `TEST-ACC-${decision.decision_id}`,
      status: "accepted",
      linked_decision_ids: [decision.decision_id],
    }));
    fs.writeFileSync(absolute(acceptancePath), `${JSON.stringify({ records: acceptanceRecords }, null, 2)}\n`);
    const resolutionInput = {
      version: "0.2.0",
      resolution_id: "CRI-2026-07-10-998",
      source_run_path: `${successDir}/cascading-update-run-${suffix}.json`,
      resolved_at: resolvedAt,
      source_resolutions: generatedImpact.impact_cone.changed_source_set.map((sourceArtifact) => ({
        path: sourceArtifact.path,
        update_status: "no_change_confirmed",
        no_change_rationale: {
          rationale: "Автоматический тест подтверждает отсутствие содержательной правки источника.",
          confirmed_by: "Process test",
          confirmed_at: resolvedAt,
          source_artifact: sourceArtifact.path,
          change_class: "semantic_product_change",
          covered_requirements: [generatedImpact.change_request_id],
          acceptance_impact: "Критерии приемки в тесте не меняются.",
          traceability_impact: "Связи трассируемости в тесте не меняются.",
          residual_risk: "Временное test evidence удаляется после проверки.",
          owner_role: "Process Owner",
          reconsider_when: "При фактическом изменении исходного артефакта.",
        },
      })),
      artifact_resolutions: generatedImpact.affected_artifacts.map((artifact) => ({
        path: artifact.path,
        update_status: "no_change_confirmed",
        no_change_rationale: {
          rationale: "Автоматический тест подтверждает отсутствие содержательной правки.",
          confirmed_by: "Process test",
          confirmed_at: resolvedAt,
          source_artifact: generatedImpact.target_artifact,
          change_class: "semantic_product_change",
          covered_requirements: [generatedImpact.change_request_id],
          acceptance_impact: "Критерии приемки в тесте не меняются.",
          traceability_impact: "Связи трассируемости в тесте не меняются.",
          residual_risk: "Временное test evidence удаляется после проверки.",
          owner_role: "Process Owner",
          reconsider_when: "При фактическом изменении артефакта.",
        },
      })),
      decision_resolutions: generatedQueue.decisions.map((decision) => ({
        decision_id: decision.decision_id,
        selected_option_id: decision.options.find((option) => option.option_id !== "OPT-DEFER").option_id,
        acceptance_record_path: acceptancePath,
        acceptance_record_id: `TEST-ACC-${decision.decision_id}`,
        resolved_at: resolvedAt,
      })),
    };
    fs.writeFileSync(absolute(resolutionPath), `${JSON.stringify(resolutionInput, null, 2)}\n`);
    validateWithSchema("schemas/cascade-resolution-input.schema.json", resolutionPath);
    fs.writeFileSync(
      absolute(malformedRunPath),
      `${JSON.stringify({ ...generatedRun, apply_supported: true }, null, 2)}\n`,
    );
    fs.writeFileSync(
      absolute(malformedResolutionPath),
      `${JSON.stringify({ ...resolutionInput, source_run_path: malformedRunPath }, null, 2)}\n`,
    );
    expectNodeFailure(
      [
        "scripts/finalize-documentation-cascade.mjs",
        "--run",
        malformedRunPath,
        "--resolution-input",
        malformedResolutionPath,
        "--output-dir",
        malformedFinalizationDir,
      ],
      "cascade run does not match schema",
    );
    const generatedQueuePath = `${successDir}/user-decision-queue-${suffix}.json`;
    const originalGeneratedQueueText = readText(generatedQueuePath);
    const originalGeneratedRunText = readText(generatedRunPath);
    try {
      fs.writeFileSync(
        absolute(generatedQueuePath),
        `${JSON.stringify({ ...generatedQueue, status: "closed", decisions: [] }, null, 2)}\n`,
      );
      const queueTamperedRun = JSON.parse(originalGeneratedRunText);
      const queueSeal = queueTamperedRun.dry_run_evidence_hashes.find(
        (entry) => entry.path === generatedQueuePath,
      );
      queueSeal.sha256 = hashRepoPath(root, generatedQueuePath);
      fs.writeFileSync(
        absolute(generatedRunPath),
        `${JSON.stringify(queueTamperedRun, null, 2)}\n`,
      );
      fs.writeFileSync(
        absolute(missingOwnerResolutionPath),
        `${JSON.stringify({ ...resolutionInput, decision_resolutions: [] }, null, 2)}\n`,
      );
      expectNodeFailure(
        [
          "scripts/finalize-documentation-cascade.mjs",
          "--run",
          generatedRunPath,
          "--resolution-input",
          missingOwnerResolutionPath,
          "--output-dir",
          missingOwnerFinalizationDir,
        ],
        "owner decision queue does not match recalculated gates",
      );
    } finally {
      fs.writeFileSync(absolute(generatedQueuePath), originalGeneratedQueueText);
      fs.writeFileSync(absolute(generatedRunPath), originalGeneratedRunText);
    }
    expectNodeFailure(
      [
        "scripts/finalize-documentation-cascade.mjs",
        "--run",
        generatedRunPath,
        "--resolution-input",
        resolutionPath,
        "--output-dir",
        untrustedFinalizationDir,
      ],
      "acceptance record path is not trusted",
    );

    const noDecisionChangeRequest = {
      version: "0.1.0",
      change_request_id: "DCR-2026-07-10-102",
      status: "ready",
      initiator: {
        actor_role: "Process test",
        source: "fixture: non-semantic cascade finalization",
      },
      target_artifact: "docs/release/mvp-release-evidence-pack.json",
      desired_change: "Проверить техническое обновление evidence без изменения продуктового смысла.",
      change_source: "technical_maintenance",
      impact_level: "low",
      affected_period: null,
      affected_backlog_story_ids: [],
      known_constraints: ["Изменение не должно закрывать решения владельца без записи согласования."],
      user_confirmation_status: "not_required",
      semantic_change: false,
      requested_at: resolvedAt,
    };
    fs.writeFileSync(
      absolute(noDecisionChangeRequestPath),
      `${JSON.stringify(noDecisionChangeRequest, null, 2)}\n`,
    );
    validateWithSchema("schemas/documentation-change-request.schema.json", noDecisionChangeRequestPath);
    runNode([
      "scripts/run-cascading-update.mjs",
      "--change-request",
      noDecisionChangeRequestPath,
      "--output-dir",
      noDecisionRunDir,
    ]);
    const noDecisionSuffix = noDecisionChangeRequest.change_request_id.replace("DCR-", "");
    const noDecisionRunPath = `${noDecisionRunDir}/cascading-update-run-${noDecisionSuffix}.json`;
    const noDecisionImpact = readJson(`${noDecisionRunDir}/impact-analysis-report-${noDecisionSuffix}.json`);
    const noDecisionQueue = readJson(`${noDecisionRunDir}/user-decision-queue-${noDecisionSuffix}.json`);
    if (noDecisionQueue.decisions.length !== 0) {
      throw new Error("non-semantic cascade unexpectedly requires an owner decision");
    }
    const noDecisionResolution = {
      version: "0.2.0",
      resolution_id: "CRI-2026-07-10-997",
      source_run_path: noDecisionRunPath,
      resolved_at: resolvedAt,
      source_resolutions: noDecisionImpact.impact_cone.changed_source_set.map((sourceArtifact) => ({
        path: sourceArtifact.path,
        update_status: "no_change_confirmed",
        no_change_rationale: {
          rationale: "Автоматический тест подтверждает отсутствие содержательной правки источника.",
          confirmed_by: "Process test",
          confirmed_at: resolvedAt,
          source_artifact: sourceArtifact.path,
          change_class: "generated_refresh",
          covered_requirements: [noDecisionImpact.change_request_id],
          acceptance_impact: "Критерии приемки в тесте не меняются.",
          traceability_impact: "Связи трассируемости в тесте не меняются.",
          residual_risk: "Временное test evidence удаляется после проверки.",
          owner_role: "Process Owner",
          reconsider_when: "При фактическом изменении исходного артефакта.",
        },
      })),
      artifact_resolutions: noDecisionImpact.affected_artifacts.map((artifact) => ({
        path: artifact.path,
        update_status: "no_change_confirmed",
        no_change_rationale: {
          rationale: "Автоматический тест подтверждает отсутствие содержательной правки.",
          confirmed_by: "Process test",
          confirmed_at: resolvedAt,
          source_artifact: noDecisionImpact.target_artifact,
          change_class: "generated_refresh",
          covered_requirements: [noDecisionImpact.change_request_id],
          acceptance_impact: "Критерии приемки в тесте не меняются.",
          traceability_impact: "Связи трассируемости в тесте не меняются.",
          residual_risk: "Временное test evidence удаляется после проверки.",
          owner_role: "Process Owner",
          reconsider_when: "При фактическом изменении артефакта.",
        },
      })),
      decision_resolutions: [],
    };
    fs.writeFileSync(
      absolute(noDecisionResolutionPath),
      `${JSON.stringify(noDecisionResolution, null, 2)}\n`,
    );
    validateWithSchema("schemas/cascade-resolution-input.schema.json", noDecisionResolutionPath);
    const noDecisionImpactPath = `${noDecisionRunDir}/impact-analysis-report-${noDecisionSuffix}.json`;
    const originalNoDecisionImpactText = readText(noDecisionImpactPath);
    const originalNoDecisionRunText = readText(noDecisionRunPath);
    try {
      const narrowedValidationImpact = JSON.parse(originalNoDecisionImpactText);
      narrowedValidationImpact.validation_plan = ["npm run validate:cascade-impact"];
      fs.writeFileSync(
        absolute(noDecisionImpactPath),
        `${JSON.stringify(narrowedValidationImpact, null, 2)}\n`,
      );
      const narrowedValidationRun = JSON.parse(originalNoDecisionRunText);
      const impactSeal = narrowedValidationRun.dry_run_evidence_hashes.find(
        (entry) => entry.path === noDecisionImpactPath,
      );
      impactSeal.sha256 = hashRepoPath(root, noDecisionImpactPath);
      fs.writeFileSync(
        absolute(noDecisionRunPath),
        `${JSON.stringify(narrowedValidationRun, null, 2)}\n`,
      );
      expectNodeFailure(
        [
          "scripts/finalize-documentation-cascade.mjs",
          "--run",
          noDecisionRunPath,
          "--resolution-input",
          noDecisionResolutionPath,
          "--output-dir",
          narrowedValidationFinalizationDir,
        ],
        "validation plan does not match required cascade checks",
      );
    } finally {
      fs.writeFileSync(absolute(noDecisionImpactPath), originalNoDecisionImpactText);
      fs.writeFileSync(absolute(noDecisionRunPath), originalNoDecisionRunText);
    }

    const noDecisionBaselinePath = `${noDecisionRunDir}/cascade-baseline-manifest-${noDecisionSuffix}.json`;
    const originalNoDecisionBaselineText = readText(noDecisionBaselinePath);
    try {
      const tamperedDryRunBaseline = JSON.parse(originalNoDecisionBaselineText);
      tamperedDryRunBaseline.captured_at = "2026-07-10T12:00:01.000Z";
      fs.writeFileSync(
        absolute(noDecisionBaselinePath),
        `${JSON.stringify(tamperedDryRunBaseline, null, 2)}\n`,
      );
      expectNodeFailure(
        [
          "scripts/finalize-documentation-cascade.mjs",
          "--run",
          noDecisionRunPath,
          "--resolution-input",
          noDecisionResolutionPath,
          "--output-dir",
          tamperedDryRunBaselineFinalizationDir,
        ],
        "dry-run evidence hash mismatch",
      );
    } finally {
      fs.writeFileSync(absolute(noDecisionBaselinePath), originalNoDecisionBaselineText);
    }
    try {
      const tamperedDryRunBaseline = JSON.parse(originalNoDecisionBaselineText);
      tamperedDryRunBaseline.captured_at = "2026-07-10T12:00:01.000Z";
      fs.writeFileSync(
        absolute(noDecisionBaselinePath),
        `${JSON.stringify(tamperedDryRunBaseline, null, 2)}\n`,
      );
      const narrowedDryRunEvidence = JSON.parse(originalNoDecisionRunText);
      narrowedDryRunEvidence.evidence_paths = narrowedDryRunEvidence.evidence_paths.filter(
        (evidencePath) => evidencePath !== noDecisionBaselinePath,
      );
      narrowedDryRunEvidence.dry_run_evidence_hashes = narrowedDryRunEvidence.dry_run_evidence_hashes.filter(
        (entry) => entry.path !== noDecisionBaselinePath,
      );
      fs.writeFileSync(
        absolute(noDecisionRunPath),
        `${JSON.stringify(narrowedDryRunEvidence, null, 2)}\n`,
      );
      expectNodeFailure(
        [
          "scripts/finalize-documentation-cascade.mjs",
          "--run",
          noDecisionRunPath,
          "--resolution-input",
          noDecisionResolutionPath,
          "--output-dir",
          narrowedDryRunEvidenceFinalizationDir,
        ],
        "dry-run evidence paths do not match",
      );
    } finally {
      fs.writeFileSync(absolute(noDecisionBaselinePath), originalNoDecisionBaselineText);
      fs.writeFileSync(absolute(noDecisionRunPath), originalNoDecisionRunText);
    }

    const finalizationOutput = runNode([
      "scripts/finalize-documentation-cascade.mjs",
      "--run",
      noDecisionRunPath,
      "--resolution-input",
      noDecisionResolutionPath,
      "--output-dir",
      noDecisionFinalizationDir,
    ]);
    if (!finalizationOutput.includes("finalized cascade run written")) {
      throw new Error(`finalizer did not report generated evidence: ${finalizationOutput.trim()}`);
    }
    const finalizedRunPath = `${noDecisionFinalizationDir}/cascading-update-run-resolved-${noDecisionSuffix}.json`;
    const finalizedRun = readJson(finalizedRunPath);
    assertCascadingUpdateRun(finalizedRun);
    if (
      finalizedRun.completion_claim.done_claimed ||
      !finalizedRun.completion_claim.all_affected_artifacts_resolved ||
      finalizedRun.completion_claim.decision_queue_status !== "closed"
    ) {
      throw new Error("finalizer produced an invalid completion claim");
    }
    fs.writeFileSync(
      absolute(malformedVerificationRunPath),
      `${JSON.stringify({ ...finalizedRun, apply_supported: true }, null, 2)}\n`,
    );
    expectNodeFailure(
      [
        "scripts/verify-documentation-cascade.mjs",
        "--run",
        malformedVerificationRunPath,
        "--output-dir",
        malformedVerificationDir,
      ],
      "cascade run does not match schema",
    );
    const validVerificationOutput = runNode([
      "scripts/verify-documentation-cascade.mjs",
      "--run",
      finalizedRunPath,
      "--output-dir",
      validVerificationDir,
    ]);
    if (!validVerificationOutput.includes("cascade verification evidence written")) {
      throw new Error(`verifier did not report generated evidence: ${validVerificationOutput.trim()}`);
    }
    const validVerificationEvidence = readJson(
      `${validVerificationDir}/cascade-verification-evidence-${noDecisionSuffix}.json`,
    );
    if (validVerificationEvidence.status !== "verified") {
      throw new Error(`valid cascade did not verify: ${validVerificationEvidence.blocking_reasons.join(" ")}`);
    }
    const originalImpactText = readText(finalizedRun.impact_report_path);
    const originalResolutionText = readText(finalizedRun.resolution_input_path);
    try {
      const narrowedValidationImpact = JSON.parse(originalImpactText);
      narrowedValidationImpact.validation_plan = ["npm run validate:cascade-impact"];
      fs.writeFileSync(
        absolute(finalizedRun.impact_report_path),
        `${JSON.stringify(narrowedValidationImpact, null, 2)}\n`,
      );
      const narrowedValidationRun = structuredClone(finalizedRun);
      const narrowedValidationHash = narrowedValidationRun.finalized_evidence_hashes.find(
        (entry) => entry.path === finalizedRun.impact_report_path,
      );
      narrowedValidationHash.sha256 = hashRepoPath(root, finalizedRun.impact_report_path);
      fs.mkdirSync(absolute(narrowedValidationRunDir), { recursive: true });
      fs.writeFileSync(
        absolute(narrowedValidationRunPath),
        `${JSON.stringify(narrowedValidationRun, null, 2)}\n`,
      );
      expectNodeFailure(
        [
          "scripts/verify-documentation-cascade.mjs",
          "--run",
          narrowedValidationRunPath,
          "--output-dir",
          narrowedValidationVerificationDir,
        ],
        "cascade verification evidence written",
      );
      const narrowedValidationEvidence = readJson(
        `${narrowedValidationVerificationDir}/cascade-verification-evidence-${noDecisionSuffix}.json`,
      );
      if (!narrowedValidationEvidence.blocking_reasons.some((reason) => reason.includes("Validation plan"))) {
        throw new Error("verifier did not explain the narrowed validation plan");
      }
    } finally {
      fs.writeFileSync(absolute(finalizedRun.impact_report_path), originalImpactText);
    }
    try {
      const narrowedImpact = JSON.parse(originalImpactText);
      const narrowedResolution = JSON.parse(originalResolutionText);
      const removedArtifact = narrowedImpact.affected_artifacts.pop();
      narrowedImpact.impact_cone.impacted_artifacts = narrowedImpact.impact_cone.impacted_artifacts.filter(
        (artifact) => artifact.path !== removedArtifact.path,
      );
      narrowedResolution.artifact_resolutions = narrowedResolution.artifact_resolutions.filter(
        (artifact) => artifact.path !== removedArtifact.path,
      );
      fs.writeFileSync(
        absolute(finalizedRun.impact_report_path),
        `${JSON.stringify(narrowedImpact, null, 2)}\n`,
      );
      fs.writeFileSync(
        absolute(finalizedRun.resolution_input_path),
        `${JSON.stringify(narrowedResolution, null, 2)}\n`,
      );
      const narrowConeRun = structuredClone(finalizedRun);
      for (const evidenceHash of narrowConeRun.finalized_evidence_hashes) {
        if ([finalizedRun.impact_report_path, finalizedRun.resolution_input_path].includes(evidenceHash.path)) {
          evidenceHash.sha256 = hashRepoPath(root, evidenceHash.path);
        }
      }
      fs.mkdirSync(absolute(narrowConeRunDir), { recursive: true });
      fs.writeFileSync(
        absolute(narrowConeRunPath),
        `${JSON.stringify(narrowConeRun, null, 2)}\n`,
      );
      expectNodeFailure(
        [
          "scripts/verify-documentation-cascade.mjs",
          "--run",
          narrowConeRunPath,
          "--output-dir",
          narrowConeVerificationDir,
        ],
        "cascade verification evidence written",
      );
      const narrowConeEvidence = readJson(
        `${narrowConeVerificationDir}/cascade-verification-evidence-${noDecisionSuffix}.json`,
      );
      if (!narrowConeEvidence.blocking_reasons.some((reason) => reason.includes("fresh"))) {
        throw new Error("verifier did not explain the narrowed impact cone");
      }
    } finally {
      fs.writeFileSync(absolute(finalizedRun.impact_report_path), originalImpactText);
      fs.writeFileSync(absolute(finalizedRun.resolution_input_path), originalResolutionText);
    }
    const originalBaselineText = readText(finalizedRun.baseline_manifest_path);
    try {
      const tamperedBaseline = JSON.parse(originalBaselineText);
      tamperedBaseline.captured_at = "2026-07-10T12:00:01.000Z";
      fs.writeFileSync(
        absolute(finalizedRun.baseline_manifest_path),
        `${JSON.stringify(tamperedBaseline, null, 2)}\n`,
      );
      expectNodeFailure(
        [
          "scripts/verify-documentation-cascade.mjs",
          "--run",
          finalizedRunPath,
          "--output-dir",
          tamperedBaselineVerificationDir,
        ],
        "cascade verification evidence written",
      );
      const tamperedBaselineEvidence = readJson(
        `${tamperedBaselineVerificationDir}/cascade-verification-evidence-${noDecisionSuffix}.json`,
      );
      if (!tamperedBaselineEvidence.blocking_reasons.some((reason) => reason.includes("baseline"))) {
        throw new Error("verifier did not explain the tampered baseline");
      }
    } finally {
      fs.writeFileSync(absolute(finalizedRun.baseline_manifest_path), originalBaselineText);
    }
    const tamperedImpact = readJson(finalizedRun.impact_report_path);
    tamperedImpact.affected_artifacts[0].no_change_rationale.rationale =
      "Подмененное обоснование, которого нет во входе разрешений.";
    fs.writeFileSync(
      absolute(finalizedRun.impact_report_path),
      `${JSON.stringify(tamperedImpact, null, 2)}\n`,
    );
    const tamperedRun = structuredClone(finalizedRun);
    const impactHash = tamperedRun.finalized_evidence_hashes.find(
      (entry) => entry.path === finalizedRun.impact_report_path,
    );
    impactHash.sha256 = hashRepoPath(root, finalizedRun.impact_report_path);
    fs.mkdirSync(absolute(tamperedVerificationRunDir), { recursive: true });
    fs.writeFileSync(
      absolute(tamperedVerificationRunPath),
      `${JSON.stringify(tamperedRun, null, 2)}\n`,
    );
    expectNodeFailure(
      [
        "scripts/verify-documentation-cascade.mjs",
        "--run",
        tamperedVerificationRunPath,
        "--output-dir",
        tamperedVerificationDir,
      ],
      "cascade verification evidence written",
    );
    const tamperedEvidence = readJson(
      `${tamperedVerificationDir}/cascade-verification-evidence-${noDecisionSuffix}.json`,
    );
    if (!tamperedEvidence.blocking_reasons.some((reason) => reason.includes("differs from resolution input"))) {
      throw new Error("verifier did not explain the tampered impact resolution");
    }
  } finally {
    fs.rmSync(absolute(successDir), { recursive: true, force: true });
    fs.rmSync(absolute(xlsxRunDir), { recursive: true, force: true });
    fs.rmSync(absolute(untrustedFinalizationDir), { recursive: true, force: true });
    fs.rmSync(absolute(malformedFinalizationDir), { recursive: true, force: true });
    fs.rmSync(absolute(missingOwnerFinalizationDir), { recursive: true, force: true });
    fs.rmSync(absolute(noDecisionRunDir), { recursive: true, force: true });
    fs.rmSync(absolute(noDecisionFinalizationDir), { recursive: true, force: true });
    fs.rmSync(absolute(narrowedValidationFinalizationDir), { recursive: true, force: true });
    fs.rmSync(absolute(tamperedDryRunBaselineFinalizationDir), { recursive: true, force: true });
    fs.rmSync(absolute(narrowedDryRunEvidenceFinalizationDir), { recursive: true, force: true });
    fs.rmSync(absolute(validVerificationDir), { recursive: true, force: true });
    fs.rmSync(absolute(narrowedValidationVerificationDir), { recursive: true, force: true });
    fs.rmSync(absolute(narrowConeVerificationDir), { recursive: true, force: true });
    fs.rmSync(absolute(malformedVerificationDir), { recursive: true, force: true });
    fs.rmSync(absolute(tamperedBaselineVerificationDir), { recursive: true, force: true });
    fs.rmSync(absolute(tamperedVerificationDir), { recursive: true, force: true });
    fs.rmSync(absolute(tamperedVerificationRunDir), { recursive: true, force: true });
    fs.rmSync(absolute(narrowedValidationRunDir), { recursive: true, force: true });
    fs.rmSync(absolute(narrowConeRunDir), { recursive: true, force: true });
    fs.rmSync(absolute(acceptancePath), { force: true });
    fs.rmSync(absolute(resolutionPath), { force: true });
    fs.rmSync(absolute(malformedRunPath), { force: true });
    fs.rmSync(absolute(malformedResolutionPath), { force: true });
    fs.rmSync(absolute(missingOwnerResolutionPath), { force: true });
    fs.rmSync(absolute(noDecisionChangeRequestPath), { force: true });
    fs.rmSync(absolute(noDecisionResolutionPath), { force: true });
    fs.rmSync(absolute(malformedVerificationRunPath), { force: true });
  }
}

function assertAcceptanceRecordPolicy() {
  const registry = readJson("docs/architecture/schemas/artifact-registry.json");
  const trustedPaths = trustedAcceptanceRecordPaths(registry);
  const canonicalLedgerPath = "docs/process/universal-documentation-workflow/acceptance-records.json";
  if (!trustedPaths.has(canonicalLedgerPath) || trustedPaths.has("artifacts/manual/untrusted-acceptance.json")) {
    throw new Error("trusted acceptance path policy does not follow the active artifact registry");
  }

  const ledger = {
    status: "active",
    records: [
      {
        acceptance_record_id: "TEST-ACC-DEC-TEST",
        acceptance_type: "owner_decision_acceptance",
        status: "accepted",
        selected_option_id: "OPT-APPLY",
        owner_role: "Product Owner",
        linked_decision_ids: ["DEC-TEST"],
        linked_run_ids: ["CUR-2026-07-10-102"],
        linked_run_paths: ["docs/process/cascading-governance/runs/test/cascading-update-run-2026-07-10-102.json"],
        linked_change_request_ids: ["DCR-2026-07-10-102"],
      },
    ],
  };
  const acceptanceContext = {
    run_id: "CUR-2026-07-10-102",
    run_path: "docs/process/cascading-governance/runs/test/cascading-update-run-2026-07-10-102.json",
    change_request_id: "DCR-2026-07-10-102",
    owner_role: "Product Owner",
  };
  acceptedOwnerDecisionRecord(
    ledger,
    "TEST-ACC-DEC-TEST",
    "DEC-TEST",
    "OPT-APPLY",
    acceptanceContext,
  );
  function expectAcceptanceFailure(candidateLedger, selectedOptionId, context, expectedMessage) {
    try {
      acceptedOwnerDecisionRecord(
        candidateLedger,
        "TEST-ACC-DEC-TEST",
        "DEC-TEST",
        selectedOptionId,
        context,
      );
    } catch (error) {
      if (error.message.includes(expectedMessage)) return;
      throw error;
    }
    throw new Error(`owner acceptance policy did not reject: ${expectedMessage}`);
  }
  expectAcceptanceFailure(ledger, "OPT-OTHER", acceptanceContext, "selected option");
  expectAcceptanceFailure(
    ledger,
    "OPT-APPLY",
    { ...acceptanceContext, run_id: "CUR-2026-07-10-103" },
    "cascade run",
  );
  expectAcceptanceFailure(
    ledger,
    "OPT-APPLY",
    { ...acceptanceContext, run_path: "docs/process/cascading-governance/runs/retry/cascading-update-run-2026-07-10-102.json" },
    "run path",
  );
  expectAcceptanceFailure(
    { ...ledger, status: "archived" },
    "OPT-APPLY",
    acceptanceContext,
    "not active",
  );
  expectAcceptanceFailure(
    ledger,
    "OPT-APPLY",
    { ...acceptanceContext, owner_role: "Process Owner" },
    "owner role",
  );
}

function assertCascadePathPolicy() {
  const fixtureRoot = absolute(`artifacts/manual/.tmp-cascade-path-policy-${process.pid}-${Date.now()}`);
  fs.mkdirSync(path.join(fixtureRoot, "safe"), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, "outside"), { recursive: true });
  fs.symlinkSync("../outside", path.join(fixtureRoot, "safe", "link"));
  try {
    try {
      absoluteRepoPath(fixtureRoot, "safe/link/evidence.json");
    } catch (error) {
      if (error.message.includes("symbolic link")) return;
      throw error;
    }
    throw new Error("cascade paths must reject symbolic-link ancestors");
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function assertCascadeValidationCommandPolicy() {
  if (safeValidationScriptNames("npm run fake:pass") !== null) {
    throw new Error("cascade validation command policy accepted an unregistered script");
  }
  const expectedCommands = new Set([
    "npm run validate:cascade-impact",
    "npm run scan:secrets && npm run validate:data-leakage",
  ]);
  const allowedCommands = new Set(allowedCascadeValidationCommands());
  const catalogCommands = new Set(
    readJson("docs/process/universal-documentation-workflow/validation-command-catalog.json")
      .commands
      .map((entry) => entry.command),
  );
  for (const command of expectedCommands) {
    if (
      !allowedCommands.has(command) ||
      !catalogCommands.has(command) ||
      safeValidationScriptNames(command)?.length === 0
    ) {
      throw new Error(`cascade validation command policy lacks required command: ${command}`);
    }
  }
}

function assertXlsxJiraExportAuthority({ provenance, source, decisionQueue, decisionLedger, acceptanceRecords }) {
  const policy = provenance.downstream_policy;
  if (policy.may_export_to_jira !== true) {
    throw new Error("working XLSX Jira export must be enabled by the accepted owner decision");
  }
  if (source.approval_status === "draft_unapproved" || provenance.workbook.approval_status === "draft_unapproved") {
    throw new Error("draft_unapproved XLSX source must never permit Jira export");
  }
  if (source.approval_status !== provenance.workbook.approval_status) {
    throw new Error("XLSX source registry and provenance approval_status must match");
  }
  if (provenance.workbook.approval_status !== "owner_approved") {
    throw new Error("owner-authorized Jira export requires approval_status=owner_approved");
  }
  if (source.team_validation_status !== provenance.workbook.team_validation_status) {
    throw new Error("XLSX source registry and provenance team_validation_status must match");
  }
  if (provenance.workbook.team_validation_status !== "approved") {
    throw new Error("owner-authorized Jira export requires workbook team_validation_status=approved");
  }
  if (provenance.rows.some((row) => row.approval_status !== "owner_approved")) {
    throw new Error("owner-authorized Jira export requires approval_status=owner_approved for every workbook row");
  }
  if (provenance.rows.some((row) => row.team_validation_status !== "approved")) {
    throw new Error("owner-authorized Jira export requires team_validation_status=approved for every workbook row");
  }
  if (policy.may_update_sprint_backlog !== false) {
    throw new Error("owner-authorized Jira export must keep sprint backlog updates forbidden");
  }
  if (policy.requires_team_approval_record !== false) {
    throw new Error("owner-authorized Jira export must set requires_team_approval_record=false");
  }
  if (policy.jira_export_authority !== "process_owner_and_product_owner") {
    throw new Error("owner-authorized Jira export requires jira_export_authority=process_owner_and_product_owner");
  }
  if (policy.jira_export_decision_id !== "UDW-DEC-019") {
    throw new Error("owner-authorized Jira export requires jira_export_decision_id=UDW-DEC-019");
  }

  const queueDecision = decisionQueue.decisions.find((entry) => entry.decision_id === policy.jira_export_decision_id);
  if (!queueDecision) {
    throw new Error(`Jira export authority decision is missing from decision queue: ${policy.jira_export_decision_id}`);
  }
  if (
    queueDecision.decision_type !== "owner_decision_acceptance"
    || queueDecision.authority !== "evidence"
    || queueDecision.status !== "accepted"
    || queueDecision.blocking !== false
    || queueDecision.owner_role !== "Product Owner / Process Owner"
    || queueDecision.acceptance_record_id !== "UDW-ACC-026"
  ) {
    throw new Error("Jira export authority decision queue entry has inconsistent type, role, status or acceptance link");
  }

  const ledgerDecision = decisionLedger.records.find((entry) => entry.decision_id === policy.jira_export_decision_id);
  if (!ledgerDecision) {
    throw new Error(`Jira export authority decision is missing from decision ledger: ${policy.jira_export_decision_id}`);
  }
  if (
    ledgerDecision.decision_type !== queueDecision.decision_type
    || ledgerDecision.accepted_status !== "accepted"
    || ledgerDecision.owner_role !== queueDecision.owner_role
    || ledgerDecision.acceptance_record_id !== queueDecision.acceptance_record_id
  ) {
    throw new Error("Jira export authority decision ledger entry does not match the decision queue");
  }

  const acceptanceRecord = acceptanceRecords.records.find(
    (entry) => entry.acceptance_record_id === queueDecision.acceptance_record_id,
  );
  if (!acceptanceRecord) {
    throw new Error(`Jira export authority acceptance record is missing: ${queueDecision.acceptance_record_id}`);
  }
  if (
    acceptanceRecord.acceptance_type !== queueDecision.decision_type
    || acceptanceRecord.status !== "accepted"
    || acceptanceRecord.owner_role !== queueDecision.owner_role
    || !acceptanceRecord.linked_decision_ids.includes(queueDecision.decision_id)
    || !acceptanceRecord.linked_artifacts.includes(source.provenance_manifest)
  ) {
    throw new Error("Jira export authority acceptance record does not match the decision and provenance manifest");
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

  const changedRoots = new Set([source.path, source.provenance_manifest].filter(Boolean));
  const downstream = downstreamClosureFrom(graph, [...changedRoots]);
  for (const requiredPath of source.affected_artifacts) {
    if (!changedRoots.has(requiredPath) && !downstream.has(requiredPath)) {
      throw new Error(`XLSX change analysis lacks graph coverage for registry affected artifact: ${requiredPath}`);
    }
  }

  const seedPaths = new Set(analysis.downstream_seed_paths);
  for (const requiredPath of source.affected_artifacts) {
    if (!changedRoots.has(requiredPath) && !seedPaths.has(requiredPath)) {
      throw new Error(`XLSX change analysis lacks downstream seed path from registry: ${requiredPath}`);
    }
  }

  if (source.approval_status === "draft_unapproved" && !analysis.team_approval_required) {
    throw new Error("draft XLSX source must require team approval before sprint/Jira downstream use");
  }

  const jiraAuthorityContext = {
    provenance: readJson(source.provenance_manifest),
    source,
    decisionQueue: readJson("docs/process/universal-documentation-workflow/decision-queue.json"),
    decisionLedger: readJson("docs/process/universal-documentation-workflow/decision-ledger.json"),
    acceptanceRecords: readJson("docs/process/universal-documentation-workflow/acceptance-records.json"),
  };
  assertXlsxJiraExportAuthority(jiraAuthorityContext);

  function expectJiraAuthorityFailure(mutate, expectedMessage) {
    const candidateContext = structuredClone(jiraAuthorityContext);
    mutate(candidateContext);
    try {
      assertXlsxJiraExportAuthority(candidateContext);
    } catch (error) {
      if (error.message.includes(expectedMessage)) return;
      throw error;
    }
    throw new Error(`XLSX Jira export authority self-test did not reject: ${expectedMessage}`);
  }
  expectJiraAuthorityFailure(
    (context) => {
      context.provenance.workbook.approval_status = "draft_unapproved";
    },
    "draft_unapproved",
  );
  expectJiraAuthorityFailure(
    (context) => {
      delete context.provenance.downstream_policy.jira_export_authority;
    },
    "jira_export_authority",
  );
  expectJiraAuthorityFailure(
    (context) => {
      context.provenance.downstream_policy.may_update_sprint_backlog = true;
    },
    "sprint backlog",
  );
  expectJiraAuthorityFailure(
    (context) => {
      context.decisionQueue.decisions = context.decisionQueue.decisions.filter(
        (entry) => entry.decision_id !== "UDW-DEC-019",
      );
    },
    "decision queue",
  );

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
    const csvColumns = data.csv_columns;
    const mappingColumns = data.jira_field_mapping.map((entry) => entry.csv_column);
    const csvColumnSet = new Set(csvColumns);
    const mappingColumnSet = new Set(mappingColumns);
    const hasExactColumnCoverage =
      csvColumnSet.size === csvColumns.length
      && mappingColumnSet.size === mappingColumns.length
      && csvColumns.length === mappingColumns.length
      && csvColumns.every((column) => mappingColumnSet.has(column));
    if (!hasExactColumnCoverage) {
      throw new Error(`${dataPath} must map every CSV column exactly once`);
    }

    const mappedJiraFields = new Set(
      data.jira_field_mapping
        .filter((entry) => entry.status === "mapped" && typeof entry.jira_field === "string" && entry.jira_field.length > 0)
        .map((entry) => entry.jira_field),
    );
    for (const entry of data.jira_field_mapping.filter((candidate) => candidate.status === "ignored_by_design")) {
      if (entry.jira_field !== null || !mappedJiraFields.has(entry.fallback_jira_field)) {
        throw new Error(`${dataPath} ignored Jira field lacks a mapped fallback: ${entry.csv_column}`);
      }
    }

    const expectedUnresolvedFields = data.jira_field_mapping
      .filter((entry) => ["unresolved", "pending_external"].includes(entry.status))
      .map((entry) => entry.csv_column);
    const expectedUnresolvedSet = new Set(expectedUnresolvedFields);
    const actualUnresolvedSet = new Set(data.unresolved_fields);
    const unresolvedListsMatch =
      expectedUnresolvedSet.size === expectedUnresolvedFields.length
      && actualUnresolvedSet.size === data.unresolved_fields.length
      && expectedUnresolvedFields.length === data.unresolved_fields.length
      && expectedUnresolvedFields.every((column) => actualUnresolvedSet.has(column));
    if (!unresolvedListsMatch) {
      throw new Error(`${dataPath} unresolved_fields does not match unresolved Jira mappings`);
    }

    if (expectedUnresolvedFields.length > 0 && data.import_readiness_status === "ready") {
      throw new Error(`${dataPath} marks import ready with unresolved Jira fields`);
    }
    if (
      data.status === "approved"
      && (typeof data.approving_stakeholder !== "string" || data.approving_stakeholder.trim().length === 0)
    ) {
      throw new Error(`${dataPath} is approved without approving stakeholder`);
    }
    if (data.import_readiness_status === "ready") {
      if (data.status !== "approved") {
        throw new Error(`${dataPath} is ready without approved mapping status`);
      }
      const contractColumns = readJson(
        "docs/process/cascading-governance/jira-story-import-contract.json",
      ).columns;
      if (!isDeepStrictEqual(csvColumns, contractColumns) || !isDeepStrictEqual(mappingColumns, contractColumns)) {
        throw new Error(`${dataPath} columns differ from the Jira story import contract`);
      }
    }
  }

  if ("package_id" in data) {
    requirePath(data.mapping_request_path);
    const mappingRequest = readJson(data.mapping_request_path);
    if (["ready", "imported"].includes(data.status) && data.field_mapping_status !== "approved") {
      throw new Error(`${dataPath} is ready/imported without approved field mapping`);
    }
    if (["ready", "imported"].includes(data.status)) {
      if (mappingRequest.status !== "approved" || mappingRequest.import_readiness_status !== "ready") {
        throw new Error(`${dataPath} is ready/imported but linked mapping request is not approved`);
      }
    }
    if (data.status === "ready") {
      if (!exists(data.csv_path) || !fs.statSync(absolute(data.csv_path)).isFile()) {
        throw new Error(`${dataPath} is ready but CSV is not a regular file: ${data.csv_path}`);
      }
      if (data.target_project !== mappingRequest.target_project) {
        throw new Error(`${dataPath} target project differs from linked mapping request`);
      }
      if (data.import_completion_claim !== "prepared") {
        throw new Error(`${dataPath} is ready without prepared import completion claim`);
      }
    }
    if (
      data.status === "imported"
      && (!exists(data.csv_path) || !fs.statSync(absolute(data.csv_path)).isFile())
    ) {
      throw new Error(`${dataPath} is imported but CSV is not a regular file: ${data.csv_path}`);
    }
    if (data.status === "imported" && data.target_project !== mappingRequest.target_project) {
      throw new Error(`${dataPath} imported target project differs from linked mapping request`);
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
        if (
          typeof expectation.errorIncludes !== "string"
          || expectation.errorIncludes.length === 0
          || !error.message.includes(expectation.errorIncludes)
        ) {
          fail(
            `negative invariant fixture failed for the wrong reason: ${dataPath}; `
            + `expected error containing ${JSON.stringify(expectation.errorIncludes)}, `
            + `received ${JSON.stringify(error.message)}`,
          );
        }
        console.log(`negative invariant fixture rejected as expected: ${dataPath} (${expectation.reason ?? error.message})`);
        continue;
      }
      throw error;
    }
  }

  if (selectedMode === "cascading-update") {
    assertAcceptanceRecordPolicy();
    assertCascadePathPolicy();
    assertCascadeValidationCommandPolicy();
    assertCascadingRunnerCli();
  }

  console.log(`cascading governance validation passed: ${selectedMode}`);
}
