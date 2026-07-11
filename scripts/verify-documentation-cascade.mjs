import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  absoluteRepoPath,
  evidenceHashProblems,
  expectedDryRunEvidencePaths,
  hashRepoPath,
  renderVerificationMarkdown,
  writeJsonExclusive,
  writeTextExclusive,
} from "./cascade-evidence-utils.mjs";
import {
  acceptedOwnerDecisionRecord,
  trustedAcceptanceRecordPaths,
} from "./cascade-acceptance-records.mjs";
import {
  buildCascadeOwnerDecisions,
  immutableOwnerDecisionShape,
} from "./cascade-owner-decision-policy.mjs";
import {
  requiredCascadeValidationCommands,
  safeValidationScriptNames,
} from "./cascade-validation-command-policy.mjs";
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

function assertFreshOutputDir(relativePath) {
  if (!relativePath?.startsWith(`${runsRoot}/`)) {
    fail(`output dir must be a new direct child of ${runsRoot}`);
  }
  const suffix = relativePath.slice(`${runsRoot}/`.length);
  if (!suffix || suffix.includes("/") || fs.existsSync(absoluteRepoPath(root, relativePath))) {
    fail(`output dir must be a fresh direct child of ${runsRoot}: ${relativePath}`);
  }
}

function assertFinalizedRunPath(relativePath) {
  const suffix = relativePath.slice(`${runsRoot}/`.length);
  const parts = suffix.split("/");
  if (
    !relativePath.startsWith(`${runsRoot}/`) ||
    parts.length !== 2 ||
    !/^cascading-update-run-resolved-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{3}\.json$/u.test(parts[1])
  ) {
    fail(`verified cascade run must be a finalized direct-child run artifact: ${relativePath}`);
  }
}

function runValidation(command, catalogCommands) {
  const catalogEntry = catalogCommands.get(command);
  const scriptNames = safeValidationScriptNames(command);
  const ranAt = new Date().toISOString();
  if (!catalogEntry || !scriptNames) {
    return {
      command,
      status: "failed",
      evidence: "Command is not an exact registered and built-in safe cascade validation.",
      ran_at: ranAt,
    };
  }
  try {
    const outputs = scriptNames.map((scriptName) =>
      execFileSync("npm", ["run", scriptName], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
    );
    return { command, status: "passed", evidence: outputs.filter(Boolean).join("\n") || "exit 0", ran_at: ranAt };
  } catch (error) {
    const evidence = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    return { command, status: "failed", evidence: evidence || error.message, ran_at: ranAt };
  }
}

const rawRunPath = argValue("--run");
const rawOutputDir = argValue("--output-dir");
if (!rawRunPath || !rawOutputDir) {
  fail("usage: node scripts/verify-documentation-cascade.mjs --run <run-json> --output-dir <fresh-run-dir>");
}

try {
  const runPath = normalizeRepoPath(rawRunPath);
  const outputDir = normalizeRepoPath(rawOutputDir);
  assertFreshOutputDir(outputDir);
  const run = readJson(runPath);
  validateJsonDocument(
    run,
    "schemas/cascading-update-run.schema.json",
    "cascade run",
    ["schemas/common-defs.schema.json"],
  );
  assertFinalizedRunPath(runPath);
  if (
    run.version !== "0.2.0" ||
    !run.baseline_manifest_path ||
    !run.human_report_path ||
    !run.resolution_input_path ||
    !run.resolution_report_path
  ) {
    fail("cascade verification requires a finalized version 0.2.0 run with baseline and resolution evidence");
  }
  if (run.dependency_graph_path !== canonicalGraphPath) {
    fail(`cascade run does not use the canonical DataCanvas dependency graph: ${run.dependency_graph_path}`);
  }

  const impactReport = readJson(run.impact_report_path);
  const decisionQueue = readJson(run.decision_queue_path);
  const baseline = readJson(run.baseline_manifest_path);
  const resolution = readJson(run.resolution_input_path);
  const sourceRun = readJson(resolution.source_run_path);
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
    resolution,
    "schemas/cascade-resolution-input.schema.json",
    "resolution input",
    [
      "schemas/common-defs.schema.json",
      "schemas/cascade-impact-cone.schema.json",
      "schemas/impact-analysis-report.schema.json",
    ],
  );
  validateJsonDocument(
    sourceRun,
    "schemas/cascading-update-run.schema.json",
    "source dry-run",
    ["schemas/common-defs.schema.json"],
  );
  validateJsonDocument(
    changeRequest,
    "schemas/documentation-change-request.schema.json",
    "documentation change request",
    ["schemas/common-defs.schema.json"],
  );
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
  const baselineByPath = new Map(baseline.files.map((entry) => [entry.path, entry]));
  const blockingReasons = [];

  if (sourceRun.run_id !== run.run_id || !isDeepStrictEqual(sourceRun.dry_run_evidence_hashes, run.dry_run_evidence_hashes)) {
    blockingReasons.push("Finalized run does not preserve the original dry-run evidence seal.");
  }
  const expectedDryRunPaths = expectedDryRunEvidencePaths(sourceRun);
  if (!isDeepStrictEqual(sourceRun.evidence_paths, expectedDryRunPaths)) {
    blockingReasons.push("Dry-run evidence paths do not match the required generated package.");
  }
  for (const problem of evidenceHashProblems(
    root,
    sourceRun.dry_run_evidence_hashes,
    [sourceRun.change_request_path, ...expectedDryRunPaths],
  )) {
    blockingReasons.push(problem);
  }

  if (baseline.source_run_path !== resolution.source_run_path) {
    blockingReasons.push("Baseline and resolution input refer to different dry runs.");
  }
  if (
    impactReport.change_request_id !== changeRequest.change_request_id ||
    decisionQueue.change_request_id !== changeRequest.change_request_id
  ) {
    blockingReasons.push("Cascade evidence contains inconsistent change request ids.");
  }
  if (impactReport.target_artifact !== changeRequest.target_artifact) {
    blockingReasons.push("Impact report target differs from the change request target.");
  }
  const expectedRunId = `CUR-${changeRequest.change_request_id.replace("DCR-", "")}`;
  if (run.run_id !== expectedRunId) {
    blockingReasons.push(`Cascade run id does not match the change request: ${run.run_id}`);
  }
  if (!isDeepStrictEqual(impactReport.impact_cone, expectedImpactCone)) {
    blockingReasons.push("Impact cone differs from a fresh calculation over the active dependency graph.");
  }
  const expectedImpactPaths = new Set(expectedImpactCone.impacted_artifacts.map((artifact) => artifact.path));
  const reportedImpactPaths = new Set(impactReport.affected_artifacts.map((artifact) => artifact.path));
  if (
    expectedImpactPaths.size !== reportedImpactPaths.size ||
    [...expectedImpactPaths].some((artifactPath) => !reportedImpactPaths.has(artifactPath))
  ) {
    blockingReasons.push("Affected artifact set does not match the freshly calculated impact cone.");
  }
  const expectedValidationPlan = requiredCascadeValidationCommands({
    changedSourcePaths: expectedChangedSourceSet.map((sourceArtifact) => sourceArtifact.path),
    impactedArtifactPaths: [...expectedImpactPaths],
    hasXlsxSource: Boolean(canonicalSource),
  });
  if (!isDeepStrictEqual(impactReport.validation_plan, expectedValidationPlan)) {
    blockingReasons.push("Validation plan does not match required cascade checks.");
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
  const actualDecisionShapes = decisionQueue.decisions.map(immutableOwnerDecisionShape);
  const expectedDecisionShapes = expectedOwnerDecisions.map(immutableOwnerDecisionShape);
  if (!isDeepStrictEqual(actualDecisionShapes, expectedDecisionShapes)) {
    blockingReasons.push("Owner decision queue does not match recalculated gates.");
  }

  if (baselineByPath.size !== baseline.files.length) {
    blockingReasons.push("Baseline contains duplicate artifact paths.");
  }
  if (run.finalized_evidence_hashes.length === 0) {
    blockingReasons.push("Finalized run lacks immutable resolution evidence hashes.");
  }
  const finalizedHashPaths = new Set(run.finalized_evidence_hashes.map((entry) => entry.path));
  if (finalizedHashPaths.size !== run.finalized_evidence_hashes.length) {
    blockingReasons.push("Finalized run contains duplicate evidence hash paths.");
  }
  for (const requiredEvidencePath of [
    ...run.evidence_paths,
    run.resolution_input_path,
    resolution.source_run_path,
    run.baseline_manifest_path,
    run.change_request_path,
    run.impact_report_path,
    run.decision_queue_path,
    run.resolution_report_path,
    ...resolution.decision_resolutions.map((item) => normalizeRepoPath(item.acceptance_record_path)),
  ]) {
    if (!finalizedHashPaths.has(requiredEvidencePath)) {
      blockingReasons.push(`Finalized run lacks required evidence hash: ${requiredEvidencePath}`);
    }
  }
  for (const evidenceHash of run.finalized_evidence_hashes) {
    if (hashRepoPath(root, evidenceHash.path) !== evidenceHash.sha256) {
      blockingReasons.push(`Finalized cascade evidence changed before verification: ${evidenceHash.path}`);
    }
  }

  for (const control of baseline.files.filter((entry) => entry.scope === "control_input")) {
    if (!control.exists || hashRepoPath(root, control.path) !== control.sha256) {
      blockingReasons.push(`Cascade control input changed after baseline: ${control.path}`);
    }
  }

  const sourceResolutions = new Map(
    resolution.source_resolutions.map((item) => [item.path, item]),
  );
  if (sourceResolutions.size !== resolution.source_resolutions.length) {
    blockingReasons.push("Resolution input contains duplicate changed source paths.");
  }
  const expectedSourcePaths = new Set(expectedChangedSourceSet.map((sourceArtifact) => sourceArtifact.path));
  if (
    sourceResolutions.size !== expectedSourcePaths.size ||
    [...sourceResolutions.keys()].some((artifactPath) => !expectedSourcePaths.has(artifactPath))
  ) {
    blockingReasons.push("Changed source resolution set does not exactly match the cascade roots.");
  }

  const artifactResolutions = new Map(
    resolution.artifact_resolutions.map((item) => [item.path, item]),
  );
  if (artifactResolutions.size !== resolution.artifact_resolutions.length) {
    blockingReasons.push("Resolution input contains duplicate artifact paths.");
  }
  const impactArtifactPaths = new Set(impactReport.affected_artifacts.map((artifact) => artifact.path));
  if (
    artifactResolutions.size !== impactArtifactPaths.size ||
    [...artifactResolutions.keys()].some((artifactPath) => !impactArtifactPaths.has(artifactPath))
  ) {
    blockingReasons.push("Resolution artifact set does not exactly match the impact report.");
  }
  for (const artifact of impactReport.affected_artifacts) {
    const artifactResolution = artifactResolutions.get(artifact.path);
    if (
      !artifactResolution ||
      artifactResolution.update_status !== artifact.update_status ||
      !isDeepStrictEqual(artifactResolution.no_change_rationale, artifact.no_change_rationale)
    ) {
      blockingReasons.push(`Impact resolution differs from resolution input: ${artifact.path}`);
    }
  }

  function verifyResolvedPath(artifactPath, artifactResolution, artifactRef) {
    const baselineEntry = baselineByPath.get(artifactPath);
    const afterHash = hashRepoPath(root, artifactPath);
    let passed = Boolean(baselineEntry);
    if (!baselineEntry) {
      blockingReasons.push(`Baseline lacks resolved artifact: ${artifactPath}`);
    } else if (artifactResolution?.update_status === "applied") {
      passed = afterHash !== null && baselineEntry.sha256 !== afterHash;
      if (!passed) blockingReasons.push(`Applied artifact is missing or has not changed since baseline: ${artifactPath}`);
    } else if (["no_change_confirmed", "not_applicable"].includes(artifactResolution?.update_status)) {
      passed = baselineEntry.exists && Boolean(artifactResolution.no_change_rationale) && baselineEntry.sha256 === afterHash;
      if (!passed) blockingReasons.push(`No-change resolution is incomplete or content changed: ${artifactPath}`);
    } else {
      passed = false;
      blockingReasons.push(`Artifact resolution is still ${artifactResolution?.update_status ?? "missing"}: ${artifactPath}`);
    }
    return {
      path: artifactPath,
      impact_artifact_ref: artifactRef,
      before_sha256: baselineEntry?.sha256 ?? null,
      after_sha256: afterHash,
      verification_status: passed ? "passed" : "failed",
    };
  }

  const resolutionRefs = [
    ...expectedChangedSourceSet.map((sourceArtifact, index) =>
      verifyResolvedPath(
        sourceArtifact.path,
        sourceResolutions.get(sourceArtifact.path),
        `/impact_cone/changed_source_set/${index}`,
      ),
    ),
    ...impactReport.affected_artifacts.map((artifact, index) =>
      verifyResolvedPath(
        artifact.path,
        artifactResolutions.get(artifact.path),
        `/affected_artifacts/${index}`,
      ),
    ),
  ];

  if (decisionQueue.status !== "closed") {
    blockingReasons.push(`Decision queue is not closed: ${decisionQueue.status}`);
  }
  const decisionResolutions = new Map(
    resolution.decision_resolutions.map((item) => [item.decision_id, item]),
  );
  if (decisionResolutions.size !== resolution.decision_resolutions.length) {
    blockingReasons.push("Resolution input contains duplicate decision ids.");
  }
  const trustedAcceptancePaths = trustedAcceptanceRecordPaths(artifactRegistry);
  for (const decision of decisionQueue.decisions) {
    const decisionResolution = decisionResolutions.get(decision.decision_id);
    if (
      decision.status !== "confirmed" ||
      !decision.selected_option_id ||
      decision.selected_option_id === "OPT-DEFER"
    ) {
      blockingReasons.push(`Owner decision is not conclusively confirmed: ${decision.decision_id}`);
      continue;
    }
    if (!decisionResolution || decisionResolution.selected_option_id !== decision.selected_option_id) {
      blockingReasons.push(`Owner decision differs from resolution input: ${decision.decision_id}`);
      continue;
    }
    const acceptancePath = normalizeRepoPath(decisionResolution.acceptance_record_path);
    if (!trustedAcceptancePaths.has(acceptancePath)) {
      blockingReasons.push(`Acceptance record path is not trusted: ${acceptancePath}`);
      continue;
    }
    const acceptanceLedger = readJson(acceptancePath);
    validateJsonDocument(
      acceptanceLedger,
      "schemas/acceptance-records.schema.json",
      "acceptance record ledger",
      ["schemas/common-defs.schema.json"],
    );
    try {
      acceptedOwnerDecisionRecord(
        acceptanceLedger,
        decisionResolution.acceptance_record_id,
        decision.decision_id,
        decision.selected_option_id,
        {
          run_id: run.run_id,
          run_path: resolution.source_run_path,
          change_request_id: changeRequest.change_request_id,
          owner_role: decision.owner_role,
        },
      );
    } catch (error) {
      blockingReasons.push(error.message);
    }
  }
  if (decisionResolutions.size !== decisionQueue.decisions.length) {
    blockingReasons.push("Resolution decision set does not exactly match the closed decision queue.");
  }
  if (impactReport.blocking_user_decisions.length > 0) {
    blockingReasons.push(`Impact report keeps blocking owner decisions: ${impactReport.blocking_user_decisions.join(", ")}`);
  }

  const validationCommands = expectedValidationPlan;
  let validationResults;
  if (blockingReasons.length > 0) {
    const ranAt = new Date().toISOString();
    validationResults = validationCommands.map((command) => ({
      command,
      status: "failed",
      evidence: "Проверка не запускалась: до выполнения команд обнаружено нарушение целостности или незакрытое обязательство каскада.",
      ran_at: ranAt,
    }));
  } else {
    const validationCatalog = readJson(
      "docs/process/universal-documentation-workflow/validation-command-catalog.json",
    );
    validateJsonDocument(
      validationCatalog,
      "schemas/validation-command-catalog.schema.json",
      "validation command catalog",
    );
    const catalogCommands = new Map(validationCatalog.commands.map((entry) => [entry.command, entry]));
    validationResults = validationCommands.map((command) => runValidation(command, catalogCommands));
  }
  for (const result of validationResults.filter((item) => item.status === "failed")) {
    blockingReasons.push(`Validation failed: ${result.command}`);
  }

  const suffix = run.run_id.replace("CUR-", "");
  const evidencePath = path.posix.join(outputDir, `cascade-verification-evidence-${suffix}.json`);
  const reportPath = path.posix.join(outputDir, `cascade-verification-evidence-${suffix}.md`);
  const evidence = {
    version: "0.2.0",
    verification_id: `CVE-${suffix}`,
    status: blockingReasons.length === 0 ? "verified" : "blocked",
    verified_at: new Date().toISOString(),
    source_run_path: runPath,
    impact_report_path: run.impact_report_path,
    baseline_manifest_path: run.baseline_manifest_path,
    resolution_input_path: run.resolution_input_path,
    resolution_report_path: run.resolution_report_path,
    artifact_resolution_refs: resolutionRefs,
    validation_results: validationResults,
    decision_queue_status: decisionQueue.status,
    blocking_reasons: blockingReasons,
  };
  validateJsonDocument(
    evidence,
    "schemas/cascade-verification-evidence.schema.json",
    "cascade verification evidence",
    ["schemas/common-defs.schema.json"],
  );
  writeJsonExclusive(root, evidencePath, evidence);
  writeTextExclusive(root, reportPath, renderVerificationMarkdown(evidence, outputDir));
  console.log(`cascade verification evidence written: ${evidencePath}`);
  console.log(`cascade verification report written: ${reportPath}`);
  if (evidence.status !== "verified") {
    process.exitCode = 1;
  }
} catch (error) {
  fail(error.message);
}
