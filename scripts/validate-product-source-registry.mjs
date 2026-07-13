import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  acceptedBmcSegmentDecisionProblems,
  approvalConsistencyProblems,
  bmcAcceptanceStatusProblems,
  decisionApprovalConsistencyProblems,
  ownerDecisionStatusProblems,
  openDecisionConsistencyProblems,
  pendingTeamDownstreamUseProblems,
  roadmapTimingProblems,
  sprintCandidatePlanProblems,
  storySlicePlanningProblems,
  traceabilityVisionAuthorityProblems,
} from "./lib/product-document-consistency.mjs";

const root = process.cwd();
const schemaPath = "schemas/product-source-registry.schema.json";
const registryPath = "docs/product/sources/product-source-registry.json";
const xlsxRecoveryIndexPath = "docs/product/sources/xlsx-opml-jira-recovery-index.json";
const dependencyGraphPath = "docs/process/cascading-governance/artifact-dependency-graph.json";
const traceabilityPath = "docs/product/requirements/traceability-matrix.json";
const decisionLedgerPath = "docs/process/universal-documentation-workflow/decision-ledger.json";
const decisionQueuePath = "docs/process/universal-documentation-workflow/decision-queue.json";
const acceptanceRecordsPath = "docs/process/universal-documentation-workflow/acceptance-records.json";
const consistencyMatrixPath = "docs/product/analysis/documentation-consistency-audit/consistency-matrix.md";
const ownerDecisionQueuePath = "docs/product/analysis/documentation-consistency-audit/owner-decision-queue.md";
const sprintCandidatePlanPath = "docs/product/analysis/documentation-consistency-audit/sprint-candidate-plan.md";
const productBacklogPath = "docs/product/backlog/product-backlog.md";
const roadmapPath = "docs/product/roadmap/roadmap-v0.1.md";
const storySlicePath = "docs/product/backlog/agent-launch-candidate-stories-2026-q3.md";
const storySliceCsvPath = "docs/product/backlog/agent-launch-candidate-stories-2026-q3.csv";
const workingXlsxProvenancePath = "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json";
const bmcManifestPath = "docs/product/bmc/manifest.json";
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
      const downstreamProblems = pendingTeamDownstreamUseProblems({
        teamValidationStatus: source.team_validation_status,
        downstreamUse: item.downstream_use ?? [],
        downstreamPolicy: source.provenance_manifest
          ? readJson(source.provenance_manifest).downstream_policy
          : null,
      });
      if (downstreamProblems.length > 0) {
        throw new Error(`XLSX/OPML/Jira recovery index approval policy violation: ${downstreamProblems[0]}`);
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
    "docs/product/sources/reference/datacanvas-backlog-source-sanitization.json",
    "docs/product/sources/reference/datacanvas-backlog-source-sanitized.xlsx",
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
    ["SRC-DC-STORIES-XLSX-ORIGIN-METADATA", "SRC-DC-STORIES-XLSX-SANITIZED", "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08"].includes(source.source_id)
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

function assertRoadmapSourceConsistency(registry) {
  const co002 = registry.sources.find((source) => source.source_id === "SRC-DC-CO-2026-002");
  const roadmap = registry.sources.find((source) => source.source_id === "SRC-DC-ROADMAP-V0-1");
  if (!co002 || !roadmap) {
    return;
  }

  const roadmapText = readText(roadmap.path);
  const roadmapContainsAcceptedSplit = [
    /приоритет `P1`/iu,
    /приоритет `P2`/iu,
    /по электронной почте/iu,
    /ссылка возвращается вызывающему агенту/iu,
    /уведомление и ссылку в Лисе/iu,
  ].every((pattern) => pattern.test(roadmapText));

  if (!roadmapContainsAcceptedSplit) {
    throw new Error("roadmap-v0.1.md must reflect the accepted CO-2026-002 P1/P2 delivery split");
  }

  if (roadmap.upstream_decision !== co002.upstream_decision) {
    throw new Error("roadmap source registry entry must use CO-2026-002 as controlling upstream decision");
  }
  if (roadmap.effective_date !== co002.effective_date) {
    throw new Error("roadmap source registry entry must use the accepted CO-2026-002 effective date");
  }
  if (!co002.affected_artifacts.includes(roadmap.path)) {
    throw new Error("CO-2026-002 source registry entry must list roadmap-v0.1.md as an affected artifact");
  }
}

function assertXlsxApprovalConsistency(registry) {
  const source = registry.sources.find((candidate) => candidate.source_id === "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08");
  if (!source?.provenance_manifest) {
    throw new Error("working XLSX source must reference its provenance manifest");
  }

  const provenance = readJson(source.provenance_manifest);
  if (
    source.approval_status !== provenance.workbook.approval_status ||
    source.team_validation_status !== provenance.workbook.team_validation_status
  ) {
    throw new Error("working XLSX source registry and provenance approval statuses must match");
  }

  const problems = approvalConsistencyProblems({
    approvalStatus: provenance.workbook.approval_status,
    teamValidationStatus: provenance.workbook.team_validation_status,
    rowApprovalStatuses: provenance.rows.map((row) => row.approval_status),
    rowTeamValidationStatuses: provenance.rows.map((row) => row.team_validation_status),
    downstreamPolicy: provenance.downstream_policy,
  });
  if (problems.length > 0) {
    throw new Error(`working XLSX approval policy violation: ${problems[0]}`);
  }

  const downstreamProblems = pendingTeamDownstreamUseProblems({
    teamValidationStatus: source.team_validation_status,
    downstreamUse: source.allowed_downstream_use ?? [],
    downstreamPolicy: provenance.downstream_policy,
  });
  if (downstreamProblems.length > 0) {
    throw new Error("working XLSX source downstream-use violation: " + downstreamProblems[0]);
  }
}

function assertXlsxDownstreamUseNegativeMutations(registry) {
  const source = registry.sources.find(
    (candidate) => candidate.source_id === "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08",
  );
  const recoveryItem = readJson(xlsxRecoveryIndexPath).items.find(
    (item) => item.source_id === source?.source_id,
  );
  if (!source?.provenance_manifest || !recoveryItem) {
    throw new Error("working XLSX source and recovery item are required for downstream-use self-tests");
  }

  const provenance = readJson(source.provenance_manifest);
  const sourceMutation = structuredClone(source);
  sourceMutation.allowed_downstream_use.push("sprint_planning_input");
  const recoveryMutation = structuredClone(recoveryItem);
  recoveryMutation.downstream_use.push("sprint_planning_input");

  for (const [label, downstreamUse] of [
    ["source registry", sourceMutation.allowed_downstream_use],
    ["recovery index", recoveryMutation.downstream_use],
  ]) {
    const problems = pendingTeamDownstreamUseProblems({
      teamValidationStatus: source.team_validation_status,
      downstreamUse,
      downstreamPolicy: provenance.downstream_policy,
    });
    if (!problems.some((problem) => problem.includes("sprint_planning_input"))) {
      throw new Error(`${label} negative mutation did not reject sprint_planning_input`);
    }
  }
}

function assertTraceabilityVisionAuthority(registry) {
  const currentVision = registry.sources.find((source) => source.source_id === "SRC-DC-PRODUCT-VISION-CURRENT");
  const historicalVision = registry.sources.find((source) => source.source_id === "SRC-DC-PRODUCT-VISION-SNAPSHOT-V0-1");
  if (!currentVision || !historicalVision) {
    throw new Error("current and historical Vision sources must be registered separately");
  }

  const problems = traceabilityVisionAuthorityProblems({
    links: readJson(traceabilityPath).links,
    currentVisionPath: currentVision.path,
    historicalVisionPath: historicalVision.path,
  });
  if (problems.length > 0) {
    throw new Error(`traceability Vision authority violation: ${problems[0]}`);
  }
}

function assertBmcAcceptanceStatus(registry) {
  const decision = readJson(decisionLedgerPath).records.find((candidate) => candidate.decision_id === "UDW-DEC-009");
  const bmcSource = registry.sources.find((source) => source.source_id === "SRC-DC-BMC-CURRENT");
  const bmcRow = readText(consistencyMatrixPath)
    .split(/\r?\n/)
    .find((line) => line.startsWith("| BMC —"));
  const cells = bmcRow?.split("|").map((cell) => cell.trim()) ?? [];
  const problems = bmcAcceptanceStatusProblems({
    decisionStatus: decision?.accepted_status,
    sourceLifecycle: bmcSource?.lifecycle,
    consistencyStatus: cells[3]?.replaceAll("`", ""),
    packageStatus: readJson(bmcManifestPath).status,
  });
  if (problems.length > 0) {
    throw new Error(`BMC acceptance status violation: ${problems[0]}`);
  }
}

function humanDecisionStatus(markdown, decisionId) {
  const row = markdown
    .split(/\r?\n/)
    .find((line) => line.startsWith(`| \`${decisionId}\``));
  const cells = row?.split("|").map((cell) => cell.trim()) ?? [];
  return cells[4] ?? null;
}

function assertOwnerAndTeamApprovalSeparation() {
  const queueDecision = readJson(decisionQueuePath).decisions.find((item) => item.decision_id === "UDW-DEC-017");
  const ledgerDecision = readJson(decisionLedgerPath).records.find((item) => item.decision_id === "UDW-DEC-017");
  const acceptanceRecord = readJson(acceptanceRecordsPath).records.find((item) =>
    item.linked_decision_ids.includes("UDW-DEC-017")
  );
  const provenance = readJson(workingXlsxProvenancePath);
  const problems = decisionApprovalConsistencyProblems({
    queueDecisionType: queueDecision?.decision_type,
    ledgerDecisionType: ledgerDecision?.decision_type,
    acceptanceType: acceptanceRecord?.acceptance_type,
    ownerRole: acceptanceRecord?.owner_role,
    teamValidationStatus: provenance.workbook.team_validation_status,
  });
  if (problems.length > 0) {
    throw new Error(`XLSX decision approval violation: ${problems[0]}`);
  }
}

function assertPlanningDocumentStatusConsistency() {
  const provenance = readJson(workingXlsxProvenancePath);
  const timingProblems = roadmapTimingProblems({
    roadmapText: readText(roadmapPath),
    teamValidationStatus: provenance.workbook.team_validation_status,
  });
  if (timingProblems.length > 0) {
    throw new Error(`roadmap readiness violation: ${timingProblems[0]}`);
  }
  const storySliceProblems = storySlicePlanningProblems({
    markdownText: readText(storySlicePath),
    csvText: readText(storySliceCsvPath),
    teamValidationStatus: provenance.workbook.team_validation_status,
  });
  if (storySliceProblems.length > 0) {
    throw new Error(`story slice readiness violation: ${storySliceProblems[0]}`);
  }

  const decision = readJson(decisionLedgerPath).records.find((item) => item.decision_id === "UDW-DEC-009");
  const statusProblems = ownerDecisionStatusProblems({
    decisionId: "UDW-DEC-009",
    machineStatus: decision?.accepted_status,
    humanStatus: humanDecisionStatus(readText(ownerDecisionQueuePath), "UDW-DEC-009"),
  });
  if (statusProblems.length > 0) {
    throw new Error(`owner decision queue violation: ${statusProblems[0]}`);
  }

  const decisionQueue = readJson(decisionQueuePath);
  const decisionLedger = readJson(decisionLedgerPath);
  const queueDecision005 = decisionQueue.decisions.find((item) => item.decision_id === "UDW-DEC-005");
  const ledgerDecision005 = decisionLedger.records.find((item) => item.decision_id === "UDW-DEC-005");
  const openDecisionProblems = openDecisionConsistencyProblems({
    decisionId: "UDW-DEC-005",
    queueStatus: queueDecision005?.status,
    queueBlocking: queueDecision005?.blocking,
    ledgerStatus: ledgerDecision005?.accepted_status,
    humanStatus: humanDecisionStatus(readText(ownerDecisionQueuePath), "UDW-DEC-005"),
  });
  if (openDecisionProblems.length > 0) {
    throw new Error(`open owner decision violation: ${openDecisionProblems[0]}`);
  }

  const bmcApplicationProblems = acceptedBmcSegmentDecisionProblems({
    decisionStatus: decision?.accepted_status,
    sourceMapText: readText("docs/product/analysis/documentation-consistency-audit/source-of-truth-map.md"),
    validationEvidenceText: readText("docs/product/analysis/documentation-consistency-audit/validation-evidence.md"),
    sprintPlanText: readText(sprintCandidatePlanPath),
  });
  if (bmcApplicationProblems.length > 0) {
    throw new Error(`BMC segment decision application violation: ${bmcApplicationProblems[0]}`);
  }

  const backlogText = readText(productBacklogPath);
  const existingCandidatePbiIds = [...backlogText.matchAll(/\|\s*(PBI-\d+)\s*\|[^\n]*\|\s*ready_for_team_review\s*\|/g)]
    .map((match) => match[1]);
  const sprintPlanProblems = sprintCandidatePlanProblems({
    planText: readText(sprintCandidatePlanPath),
    existingCandidatePbiIds,
  });
  if (sprintPlanProblems.length > 0) {
    throw new Error(`sprint candidate plan violation: ${sprintPlanProblems[0]}`);
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
    "SRC-DC-BUSINESS-CLAIM-MAP",
    "SRC-DC-ANALYSIS-BA",
    "SRC-DC-SYSTEM-ANALYSIS",
    "SRC-DC-LIFECYCLE-STATE-MODEL",
    "SRC-DC-SRS-V0-1",
    "SRC-DC-SPEC-A2A-LAUNCH",
    "SRC-DC-CASCADE-2026-07-02",
    "SRC-DC-STORIES-XLSX-ORIGIN-METADATA",
    "SRC-DC-STORIES-XLSX-SANITIZED",
    "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08",
  ];
  for (const sourceId of requiredSources) {
    if (!ids.has(sourceId)) {
      throw new Error(`required product source is missing: ${sourceId}`);
    }
  }

  assertXlsxRecoveryIndexConsistency(registry);
  assertRoadmapSourceConsistency(registry);
  assertXlsxApprovalConsistency(registry);
  assertXlsxDownstreamUseNegativeMutations(registry);
  assertTraceabilityVisionAuthority(registry);
  assertBmcAcceptanceStatus(registry);
  assertOwnerAndTeamApprovalSeparation();
  assertPlanningDocumentStatusConsistency();

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
      "docs/product/requirements/user-stories.md",
      "docs/product/change-orders/co-2026-001-a2a-first-priority.md",
      "docs/product/bmc/bmc-v0.2.md",
      "docs/product/requirements/business-requirements.md",
      "docs/product/requirements/acceptance-criteria.md",
      "docs/product/requirements/traceability-matrix.json",
      "docs/product/requirements/business-claim-map.json",
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
      "docs/product/sources/reference/datacanvas-backlog-source-sanitization.json",
      "docs/product/sources/reference/datacanvas-backlog-source-sanitized.xlsx",
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
