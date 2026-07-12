import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  absoluteRepoPath,
  evidenceHashProblems,
  expectedDryRunEvidencePaths,
  hashRepoPath,
  writeJsonExclusive,
  writeTextExclusive,
} from "./cascade-evidence-utils.mjs";
import {
  acceptedOwnerDecisionRecord,
  trustedAcceptanceRecordPaths,
} from "./cascade-acceptance-records.mjs";
import { buildCascadeOwnerDecisions } from "./cascade-owner-decision-policy.mjs";
import { requiredCascadeValidationCommands } from "./cascade-validation-command-policy.mjs";
import {
  analyzeImpactCone,
  buildDependencyIndex,
  buildGeneratedOutputLookup,
  changedSourceSetFromProductSourceRegistry,
  classifyImpactObligations,
  normalizeRepoPath,
  sourceChangeClassesForPath,
} from "./documentation-impact-graph.mjs";

const root = process.cwd();
const runsRoot = "docs/process/cascading-governance/runs";
const canonicalGraphPath = "docs/process/cascading-governance/artifact-dependency-graph.json";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absoluteRepoPath(root, relativePath), "utf8"));
}

function assertFreshOutputDir(relativePath) {
  if (!relativePath?.startsWith(`${runsRoot}/`)) {
    fail(`output dir must be a new direct child of ${runsRoot}`);
  }
  const suffix = relativePath.slice(`${runsRoot}/`.length);
  if (!suffix || suffix.includes("/") || fs.existsSync(absoluteRepoPath(root, relativePath))) {
    fail(`output dir must be a fresh direct child of ${runsRoot}: ${relativePath}`);
  }
}

function assertSourceRunPath(relativePath) {
  const suffix = relativePath.slice(`${runsRoot}/`.length);
  const parts = suffix.split("/");
  if (
    !relativePath.startsWith(`${runsRoot}/`) ||
    parts.length !== 2 ||
    !/^cascading-update-run-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{3}\.json$/u.test(parts[1])
  ) {
    fail(`source cascade run must be a generated direct-child run artifact: ${relativePath}`);
  }
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((item) => right.has(item));
}

function uniqueMap(items, key, label) {
  const result = new Map();
  for (const item of items) {
    if (result.has(item[key])) {
      fail(`duplicate ${label}: ${item[key]}`);
    }
    result.set(item[key], item);
  }
  return result;
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

function validateResolutionInput(resolution) {
  validateJsonDocument(
    resolution,
    "schemas/cascade-resolution-input.schema.json",
    "resolution input",
    [
      "schemas/common-defs.schema.json",
      "schemas/cascade-impact-cone.schema.json",
      "schemas/impact-analysis-report.schema.json",
    ],
  );
}

function readTrustedAcceptanceRecord(
  acceptancePath,
  acceptanceRecordId,
  decisionId,
  selectedOptionId,
  context,
  trustedPaths,
) {
  if (!trustedPaths.has(acceptancePath)) {
    fail(`acceptance record path is not trusted: ${acceptancePath}`);
  }
  const ledger = readJson(acceptancePath);
  validateJsonDocument(
    ledger,
    "schemas/acceptance-records.schema.json",
    "acceptance record ledger",
    ["schemas/common-defs.schema.json"],
  );
  return acceptedOwnerDecisionRecord(
    ledger,
    acceptanceRecordId,
    decisionId,
    selectedOptionId,
    context,
  );
}

function renderResolutionReport(resolution, impactReport, decisionQueue) {
  const applied = resolution.artifact_resolutions.filter((item) => item.update_status === "applied").length;
  return [
    "# Разрешение каскадного влияния",
    "",
    `- Запрос на изменение: ${impactReport.change_request_id}`,
    `- Разрешено артефактов: ${resolution.artifact_resolutions.length}`,
    `- Изменено: ${applied}`,
    `- Подтверждено без изменения: ${resolution.artifact_resolutions.length - applied}`,
    `- Закрыто решений владельцев: ${decisionQueue.decisions.length}`,
    "",
    "Этот отчет создан финализатором. Он не заменяет отдельное verification evidence.",
    "",
  ].join("\n");
}

const rawRunPath = argValue("--run");
const rawResolutionPath = argValue("--resolution-input");
const rawOutputDir = argValue("--output-dir");
if (!rawRunPath || !rawResolutionPath || !rawOutputDir) {
  fail("usage: node scripts/finalize-documentation-cascade.mjs --run <run-json> --resolution-input <json> --output-dir <fresh-run-dir>");
}

try {
  const runPath = normalizeRepoPath(rawRunPath);
  const resolutionPath = normalizeRepoPath(rawResolutionPath);
  const outputDir = normalizeRepoPath(rawOutputDir);
  assertFreshOutputDir(outputDir);

  const run = readJson(runPath);
  const resolution = readJson(resolutionPath);
  validateJsonDocument(
    run,
    "schemas/cascading-update-run.schema.json",
    "cascade run",
    ["schemas/common-defs.schema.json"],
  );
  assertSourceRunPath(runPath);
  validateResolutionInput(resolution);
  if (run.version !== "0.2.0" || !run.baseline_manifest_path) {
    fail("cascade finalization requires a version 0.2.0 dry-run with baseline evidence");
  }
  if (run.dependency_graph_path !== canonicalGraphPath) {
    fail(`cascade run does not use the canonical DataCanvas dependency graph: ${run.dependency_graph_path}`);
  }
  if (resolution.source_run_path !== runPath) {
    fail(`resolution input points to another run: ${resolution.source_run_path}`);
  }

  const impactReport = readJson(run.impact_report_path);
  const decisionQueue = readJson(run.decision_queue_path);
  const baseline = readJson(run.baseline_manifest_path);
  const changeRequest = readJson(run.change_request_path);
  validateJsonDocument(
    impactReport,
    "schemas/impact-analysis-report.schema.json",
    "impact report",
    ["schemas/common-defs.schema.json", "schemas/cascade-impact-cone.schema.json"],
  );
  validateJsonDocument(
    decisionQueue,
    "schemas/user-decision-queue.schema.json",
    "decision queue",
    ["schemas/common-defs.schema.json"],
  );
  validateJsonDocument(
    baseline,
    "schemas/cascade-baseline-manifest.schema.json",
    "cascade baseline",
    ["schemas/common-defs.schema.json"],
  );
  validateJsonDocument(
    changeRequest,
    "schemas/documentation-change-request.schema.json",
    "documentation change request",
    ["schemas/common-defs.schema.json"],
  );
  if (baseline.source_run_path !== runPath) {
    fail(`cascade baseline points to another run: ${baseline.source_run_path}`);
  }
  const expectedDryRunPaths = expectedDryRunEvidencePaths(run);
  if (!isDeepStrictEqual(run.evidence_paths, expectedDryRunPaths)) {
    fail("dry-run evidence paths do not match the required generated package");
  }
  const dryRunHashProblems = evidenceHashProblems(
    root,
    run.dry_run_evidence_hashes,
    [run.change_request_path, ...expectedDryRunPaths],
  );
  if (dryRunHashProblems.length > 0) {
    fail(dryRunHashProblems.join("; "));
  }
  if (
    impactReport.change_request_id !== changeRequest.change_request_id ||
    decisionQueue.change_request_id !== changeRequest.change_request_id
  ) {
    fail("cascade run links inconsistent change request ids");
  }
  if (impactReport.target_artifact !== changeRequest.target_artifact) {
    fail("impact report target does not match the change request");
  }
  const expectedRunId = `CUR-${changeRequest.change_request_id.replace("DCR-", "")}`;
  if (run.run_id !== expectedRunId) {
    fail(`cascade run id does not match the change request: ${run.run_id}`);
  }
  const graph = readJson(run.dependency_graph_path);
  validateJsonDocument(
    graph,
    "schemas/artifact-dependency-graph.schema.json",
    "artifact dependency graph",
    ["schemas/common-defs.schema.json"],
  );
  if (graph.status !== "active") {
    fail(`canonical dependency graph is not active: ${graph.status}`);
  }
  const inventory = readJson("docs/process/universal-documentation-workflow/artifact-inventory.json");
  const generatorContracts = readJson("docs/process/universal-documentation-workflow/generator-contracts.json");
  const lifecycle = readJson("docs/process/universal-documentation-workflow/main-artifact-lifecycle-chain.json");
  const sourceRegistry = readJson("docs/product/sources/product-source-registry.json");
  validateJsonDocument(
    sourceRegistry,
    "schemas/product-source-registry.schema.json",
    "product source registry",
  );
  if (sourceRegistry.status !== "active") {
    fail(`canonical product source registry is not active: ${sourceRegistry.status}`);
  }
  const businessClaimMap = readJson("docs/product/requirements/business-claim-map.json");
  const artifactRegistry = readJson("docs/architecture/schemas/artifact-registry.json");
  validateJsonDocument(
    artifactRegistry,
    "schemas/artifact-registry.schema.json",
    "artifact registry",
  );
  let expectedChangedSourceSet;
  let canonicalSource = null;
  if (run.xlsx_change_analysis_path) {
    const xlsxChangeAnalysis = readJson(run.xlsx_change_analysis_path);
    validateJsonDocument(
      xlsxChangeAnalysis,
      "schemas/xlsx-change-analysis.schema.json",
      "XLSX change analysis",
      ["schemas/common-defs.schema.json"],
    );
    canonicalSource = changedSourceSetFromProductSourceRegistry(
      sourceRegistry,
      xlsxChangeAnalysis.source_id,
    );
    const analysisSourceSet = xlsxChangeAnalysis.changed_source_set.map((sourceArtifact) => ({
      path: sourceArtifact.path,
      change_class: sourceArtifact.change_classes[0],
      change_classes: sourceArtifact.change_classes,
    })).sort((left, right) => left.path.localeCompare(right.path));
    const canonicalSourceSet = canonicalSource.changed_source_set.map((sourceArtifact) => ({
      ...sourceArtifact,
      change_classes: sourceChangeClassesForPath(sourceArtifact.path),
    })).sort((left, right) => left.path.localeCompare(right.path));
    if (!isDeepStrictEqual(analysisSourceSet, canonicalSourceSet)) {
      fail("XLSX change analysis does not match the canonical product source registry");
    }
    expectedChangedSourceSet = canonicalSource.changed_source_set;
  } else {
    expectedChangedSourceSet = [
      {
        path: changeRequest.target_artifact,
        change_class: changeRequest.semantic_change ? "business_meaning" : "documentation",
      },
    ];
  }
  const graphIndex = buildDependencyIndex(graph);
  let expectedImpactCone = analyzeImpactCone(graphIndex, expectedChangedSourceSet);
  expectedImpactCone = classifyImpactObligations(expectedImpactCone, {
    inventory,
    generatorContracts,
    lifecycle,
    sourceRegistry,
    businessClaimMap,
    artifactRegistry,
    generatedOutputs: buildGeneratedOutputLookup(generatorContracts),
    changeClass: changeRequest.semantic_change
      ? "business_meaning"
      : expectedChangedSourceSet[0].change_class,
  });
  if (!isDeepStrictEqual(impactReport.impact_cone, expectedImpactCone)) {
    fail("impact cone differs from a fresh calculation over the active dependency graph");
  }
  const expectedImpactPaths = new Set(expectedImpactCone.impacted_artifacts.map((artifact) => artifact.path));
  const reportedImpactPaths = new Set(impactReport.affected_artifacts.map((artifact) => artifact.path));
  if (!sameSet(expectedImpactPaths, reportedImpactPaths)) {
    fail("affected artifact set does not match the freshly calculated impact cone");
  }
  const expectedValidationPlan = requiredCascadeValidationCommands({
    changedSourcePaths: expectedChangedSourceSet.map((sourceArtifact) => sourceArtifact.path),
    impactedArtifactPaths: [...expectedImpactPaths],
    hasXlsxSource: Boolean(canonicalSource),
  });
  if (!isDeepStrictEqual(impactReport.validation_plan, expectedValidationPlan)) {
    fail("validation plan does not match required cascade checks");
  }
  const sourceRequiresTeamApproval = canonicalSource
    ? canonicalSource.source.approval_status === "draft_unapproved" ||
      canonicalSource.source.team_validation_status === "pending_team_review"
    : false;
  const expectedOwnerDecisions = buildCascadeOwnerDecisions({
    suffix: changeRequest.change_request_id.replace("DCR-", ""),
    changeRequest,
    changeRequestPath: run.change_request_path,
    targetArtifact: changeRequest.target_artifact,
    targetInGraph: graphIndex.artifactsByPath.has(changeRequest.target_artifact),
    sourceRequiresTeamApproval,
    sourceRequiresDownstreamResolution: Boolean(canonicalSource),
    impactCone: expectedImpactCone,
    graphIndex,
    affectedArtifacts: [...expectedImpactPaths].sort(),
    requestedAt: decisionQueue.requested_at,
  }).decisions;
  const expectedQueueStatus = expectedOwnerDecisions.length > 0 ? "blocked" : "closed";
  const expectedBlockingDecisionIds = expectedOwnerDecisions.map((decision) => decision.decision_id);
  if (
    decisionQueue.status !== expectedQueueStatus ||
    !isDeepStrictEqual(decisionQueue.decisions, expectedOwnerDecisions) ||
    !isDeepStrictEqual(impactReport.blocking_user_decisions, expectedBlockingDecisionIds)
  ) {
    fail("owner decision queue does not match recalculated gates");
  }
  const sourceResolutions = uniqueMap(
    resolution.source_resolutions,
    "path",
    "source resolution path",
  );
  const expectedSourcePaths = new Set(
    impactReport.impact_cone.changed_source_set.map((sourceArtifact) => sourceArtifact.path),
  );
  if (!sameSet(new Set(sourceResolutions.keys()), expectedSourcePaths)) {
    fail("resolution input source paths must exactly match the changed source set");
  }
  const artifactResolutions = uniqueMap(resolution.artifact_resolutions, "path", "artifact resolution path");
  const expectedArtifactPaths = new Set(impactReport.affected_artifacts.map((artifact) => artifact.path));
  if (!sameSet(new Set(artifactResolutions.keys()), expectedArtifactPaths)) {
    fail("resolution input artifact paths must exactly match the impact cone");
  }

  const decisionResolutions = uniqueMap(resolution.decision_resolutions, "decision_id", "decision resolution id");
  const expectedDecisionIds = new Set(decisionQueue.decisions.map((decision) => decision.decision_id));
  if (!sameSet(new Set(decisionResolutions.keys()), expectedDecisionIds)) {
    fail("resolution input decision ids must exactly match the decision queue");
  }

  const trustedAcceptancePaths = trustedAcceptanceRecordPaths(artifactRegistry);
  const usedAcceptancePaths = new Set();
  const resolvedDecisions = decisionQueue.decisions.map((decision) => {
    const decisionResolution = decisionResolutions.get(decision.decision_id);
    if (!decision.options.some((option) => option.option_id === decisionResolution.selected_option_id)) {
      fail(`selected option is not present in decision ${decision.decision_id}`);
    }
    if (decisionResolution.selected_option_id === "OPT-DEFER") {
      fail(`deferred decision cannot close cascade finalization: ${decision.decision_id}`);
    }
    if (!decision.owner_role) {
      fail(`decision lacks owner role: ${decision.decision_id}`);
    }
    const acceptancePath = normalizeRepoPath(decisionResolution.acceptance_record_path);
    readTrustedAcceptanceRecord(
      acceptancePath,
      decisionResolution.acceptance_record_id,
      decision.decision_id,
      decisionResolution.selected_option_id,
      {
        run_id: run.run_id,
        run_path: runPath,
        change_request_id: changeRequest.change_request_id,
        owner_role: decision.owner_role,
      },
      trustedAcceptancePaths,
    );
    usedAcceptancePaths.add(acceptancePath);
    return {
      ...decision,
      status: "confirmed",
      resolved_at: decisionResolution.resolved_at,
      selected_option_id: decisionResolution.selected_option_id,
    };
  });

  const suffix = run.run_id.replace("CUR-", "");
  const resolvedImpactPath = path.posix.join(outputDir, `impact-analysis-report-resolved-${suffix}.json`);
  const resolvedQueuePath = path.posix.join(outputDir, `user-decision-queue-resolved-${suffix}.json`);
  const resolutionReportPath = path.posix.join(outputDir, `cascade-resolution-report-${suffix}.md`);
  const finalizedRunPath = path.posix.join(outputDir, `cascading-update-run-resolved-${suffix}.json`);
  const resolvedImpactReport = {
    ...impactReport,
    status: "applied",
    generated_at: resolution.resolved_at,
    affected_artifacts: impactReport.affected_artifacts.map((artifact) => ({
      ...artifact,
      update_status: artifactResolutions.get(artifact.path).update_status,
      no_change_rationale: artifactResolutions.get(artifact.path).no_change_rationale,
    })),
    blocking_user_decisions: [],
    blocked_reasons: [],
    completion_status: "complete",
  };
  const resolvedQueue = { ...decisionQueue, status: "closed", decisions: resolvedDecisions };
  const generatedArtifacts = [
    { path: resolvedImpactPath, generator_command: "npm run cascade:finalize" },
    { path: resolvedQueuePath, generator_command: "npm run cascade:finalize" },
    { path: resolutionReportPath, generator_command: "npm run cascade:finalize" },
  ];
  validateJsonDocument(
    resolvedImpactReport,
    "schemas/impact-analysis-report.schema.json",
    "resolved impact report",
    ["schemas/common-defs.schema.json", "schemas/cascade-impact-cone.schema.json"],
  );
  validateJsonDocument(
    resolvedQueue,
    "schemas/user-decision-queue.schema.json",
    "resolved decision queue",
    ["schemas/common-defs.schema.json"],
  );
  writeJsonExclusive(root, resolvedImpactPath, resolvedImpactReport);
  writeJsonExclusive(root, resolvedQueuePath, resolvedQueue);
  writeTextExclusive(root, resolutionReportPath, renderResolutionReport(resolution, resolvedImpactReport, resolvedQueue));

  const finalizedEvidencePaths = [...new Set([
    runPath,
    ...run.evidence_paths,
    run.change_request_path,
    resolutionPath,
    ...usedAcceptancePaths,
    resolvedImpactPath,
    resolvedQueuePath,
    resolutionReportPath,
  ])];
  const finalizedRun = {
    ...run,
    status: "planned",
    impact_report_path: resolvedImpactPath,
    decision_queue_path: resolvedQueuePath,
    resolution_input_path: resolutionPath,
    resolution_report_path: resolutionReportPath,
    finalized_evidence_hashes: finalizedEvidencePaths.map((evidencePath) => ({
      path: evidencePath,
      sha256: hashRepoPath(root, evidencePath),
    })),
    generated_artifacts: [...run.generated_artifacts, ...generatedArtifacts],
    validation_results: run.validation_results.map((result) => ({
      ...result,
      status: "not_run",
      evidence: "Итоговые проверки выполняются отдельным verifier после финализации влияния.",
      ran_at: resolution.resolved_at,
    })),
    evidence_paths: [...new Set([
      ...run.evidence_paths,
      runPath,
      run.baseline_manifest_path,
      run.change_request_path,
      resolutionPath,
      ...usedAcceptancePaths,
      resolvedImpactPath,
      resolvedQueuePath,
      resolutionReportPath,
    ])],
    completion_claim: {
      ...run.completion_claim,
      decision_queue_status: "closed",
      all_affected_artifacts_resolved: true,
      ready_to_apply: false,
      done_claimed: false,
    },
  };

  validateJsonDocument(
    finalizedRun,
    "schemas/cascading-update-run.schema.json",
    "finalized cascade run",
    ["schemas/common-defs.schema.json"],
  );

  writeJsonExclusive(root, finalizedRunPath, finalizedRun);
  console.log(`resolved impact report written: ${resolvedImpactPath}`);
  console.log(`resolved decision queue written: ${resolvedQueuePath}`);
  console.log(`cascade resolution report written: ${resolutionReportPath}`);
  console.log(`finalized cascade run written: ${finalizedRunPath}`);
} catch (error) {
  fail(error.message);
}
