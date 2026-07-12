import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { publishAtomicPackage } from "./cascade-atomic-publisher.mjs";
import { analyzeSemanticCascade } from "./cascade-semantic-impact.mjs";
import { buildValidationManifest } from "./cascade-validation-manifest.mjs";
import {
  assertRegistryDeltaIntegrity,
  buildCascadeReplayKey,
  classifyXlsxChangeSignals,
  resolveActualTriggerPaths,
  resolveSourceIdentities,
} from "./cascade-vnext-core.mjs";
import { requiredOwnerRoles } from "./cascade-owner-acceptance.mjs";
import { buildRuntimeManifest, parseGitNameStatus } from "./cascade-vnext-runtime.mjs";
import {
  absoluteRepoPath,
  hashJsonDocument,
  hashRepoPath,
} from "./cascade-evidence-utils.mjs";
import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

const root = process.cwd();
const runsRoot = "docs/process/cascading-governance/runs";
const graphPath = "docs/process/cascading-governance/artifact-dependency-graph.json";
const sourceRegistryPath = "docs/product/sources/product-source-registry.json";
const validationCatalogPath = "docs/process/universal-documentation-workflow/validation-command-catalog.json";
const acceptanceAuthorityPath = "docs/process/cascading-governance/acceptance-authority.json";

function fail(message) {
  throw new Error(message);
}

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function argValues(name) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) values.push(process.argv[index + 1]);
  }
  return values;
}

function run(command, args) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 2 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: process.env.LANG ?? "C.UTF-8", TZ: process.env.TZ ?? "UTC" },
  }).trim();
}

function gitFileAt(commitSha, relativePath) {
  try {
    return execFileSync("git", ["show", commitSha + ":" + relativePath], {
      cwd: root,
      encoding: null,
      timeout: 30_000,
      maxBuffer: 64 * 1024 * 1024,
      env: { PATH: process.env.PATH, HOME: process.env.HOME },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function sha256Buffer(value) {
  return value ? crypto.createHash("sha256").update(value).digest("hex") : null;
}

function syntheticWorkbookAnalysis(kind) {
  const signals = {
    noChange: false,
    formattingChanged: true,
    formulaCacheOnly: false,
    estimateChanged: true,
    priorityChanged: true,
    storyTextChanged: true,
    rowAddedOrRemoved: true,
    scopeChanged: true,
  };
  return {
    analyzer_version: "1.0.0",
    signals,
    changed_cell_count: 0,
    changed_cell_samples: [],
    structural_changes: [kind],
  };
}

function analyzeXlsxSources(paths, baseSha, planningHeadSha) {
  if (paths.length === 0) return [];
  const analyzerPath = "scripts/classify-datacanvas-xlsx-change.py";
  return paths.map((relativePath, index) => {
    const before = gitFileAt(baseSha, relativePath);
    const after = gitFileAt(planningHeadSha, relativePath);
    let analysis;
    if (!before || !after) {
      analysis = syntheticWorkbookAnalysis(before ? "workbook_deleted" : "workbook_added");
    } else {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-xlsx-diff-"));
      try {
        const beforePath = path.join(tempRoot, "before-" + index + ".xlsx");
        const afterPath = path.join(tempRoot, "after-" + index + ".xlsx");
        fs.writeFileSync(beforePath, before);
        fs.writeFileSync(afterPath, after);
        const output = execFileSync("python3", [absoluteRepoPath(root, analyzerPath), "--before", beforePath, "--after", afterPath], {
          cwd: root,
          encoding: "utf8",
          timeout: 120_000,
          maxBuffer: 4 * 1024 * 1024,
          env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: process.env.LANG ?? "C.UTF-8" },
          stdio: ["ignore", "pipe", "pipe"],
        });
        analysis = JSON.parse(output);
      } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    }
    const changeClasses = classifyXlsxChangeSignals(analysis.signals);
    if (changeClasses.includes("no_change")) {
      fail("triggered XLSX has no content delta in the declared Git range: " + relativePath);
    }
    return {
      path: relativePath,
      before_sha256: sha256Buffer(before),
      after_sha256: sha256Buffer(after),
      signals: analysis.signals,
      change_classes: changeClasses,
      changed_cell_count: analysis.changed_cell_count,
      changed_cell_samples: analysis.changed_cell_samples,
      structural_changes: analysis.structural_changes,
    };
  });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absoluteRepoPath(root, relativePath), "utf8"));
}

function validateDocument(data, schemaPath) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(readJson("schemas/common-defs.schema.json"));
  const validate = ajv.compile(readJson(schemaPath));
  if (!validate(data)) fail(`${schemaPath} validation failed: ${JSON.stringify(validate.errors, null, 2)}`);
}

function gitSha(value, label) {
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(value ?? "")) fail(`${label} must be an immutable Git SHA`);
  run("git", ["cat-file", "-e", `${value}^{commit}`]);
  return value;
}

function sourceKind(relativePath) {
  if (relativePath.endsWith(".provenance.json")) return "provenance";
  if (relativePath.endsWith("product-source-registry.json")) return "source_registry";
  if (relativePath.endsWith(".xlsx")) return "xlsx";
  if (relativePath.startsWith("docs/process/")) return "process";
  if (relativePath.startsWith("docs/product/") || relativePath === "docs/product-vision.md") return "product_document";
  return "generated";
}

function documentChangeClasses(graphArtifact, kind, semanticChange) {
  if (kind === "provenance") return ["provenance_only"];
  if (kind === "source_registry") return ["source_identity"];
  if (!semanticChange || ["generated", "process"].includes(kind)) return ["documentation"];
  const aliases = new Map([
    ["effort_estimate", "estimate_change"],
    ["provenance", "provenance_only"],
  ]);
  const declared = (graphArtifact?.authority_scope ?? [])
    .filter((value) => value !== "source_data")
    .map((value) => aliases.get(value) ?? value);
  return [...new Set(declared.length > 0 ? declared : ["product_meaning"])].sort();
}

function excerptFor(relativePath, fallback) {
  if (relativePath.endsWith(".xlsx")) return fallback;
  const content = fs.readFileSync(absoluteRepoPath(root, relativePath), "utf8");
  const paragraph = content.split(/\n\s*\n/u).map((item) => item.trim()).find((item) => item && !item.startsWith("#"));
  return (paragraph ?? fallback).slice(0, 1200);
}

function buildQuestionPacket({ suffix, changeRequest, sourcePaths, affectedPaths, changeClasses, ownerRoles }) {
  const packet = {
    $schema: "https://datacanvas.local/schemas/v1/cascade-owner-question-packet.schema.json",
    version: "1.0.0",
    packet_id: `QPK-CASCADE-${suffix}`,
    decision_id: `DEC-CASCADE-${suffix}`,
    required_owner_roles: ownerRoles,
    change_classes: changeClasses,
    authority_manifest_path: acceptanceAuthorityPath,
    authority_manifest_sha256: hashRepoPath(root, acceptanceAuthorityPath),
    question: `Как согласовать влияние изменения «${changeRequest.desired_change}» на авторитетные источники и зависимые документы?`,
    source_excerpts: sourcePaths.map((sourcePath) => {
      const excerpt = excerptFor(sourcePath, changeRequest.desired_change);
      return {
        path: sourcePath,
        excerpt,
        excerpt_sha256: crypto.createHash("sha256").update(excerpt).digest("hex"),
      };
    }),
    affected_artifacts: affectedPaths.map((artifactPath) => ({
      path: artifactPath,
      sha256: hashRepoPath(root, artifactPath) ?? "0".repeat(64),
    })),
    options: [
      { option_id: `OPT-${suffix}-ACCEPT`, text: "Принять изменение полностью и обновить авторитетный источник.", consequences: "После согласования будет запущен новый downstream-проход по зависимым документам.", effect: "authorize_apply" },
      { option_id: `OPT-${suffix}-REJECT`, text: "Отклонить изменение и сохранить текущий авторитетный смысл.", consequences: "Измененный производный документ потребуется привести к действующему источнику истины.", effect: "reject_change" },
      { option_id: `OPT-${suffix}-PARTIAL`, text: "Принять только часть изменения после уточнения формулировки.", consequences: "Каскад останется заблокированным до согласования уточненного текста.", effect: "block_pending_text" },
      { option_id: `OPT-${suffix}-DEFER`, text: "Отложить решение без смысловых правок.", consequences: "Документы не меняются, запуск остается в состоянии ожидания владельца.", effect: "block_deferred" },
      { option_id: `OPT-${suffix}-EVIDENCE`, text: "Запросить дополнительные сведения и повторный анализ.", consequences: "Будет дополнен пакет доказательств без изменения продуктового смысла.", effect: "block_more_evidence" },
    ],
    recommended_option_id: `OPT-${suffix}-EVIDENCE`,
    packet_sha256: "0".repeat(64),
  };
  packet.packet_sha256 = hashJsonDocument({ ...packet, packet_sha256: null });
  return packet;
}

function assertDirectRunDir(relativePath) {
  if (!relativePath.startsWith(`${runsRoot}/`) || relativePath.slice(runsRoot.length + 1).includes("/")) {
    fail(`output dir must be a fresh direct child of ${runsRoot}`);
  }
  if (fs.existsSync(absoluteRepoPath(root, relativePath))) fail(`output dir already exists: ${relativePath}`);
}

async function main() {
  if (process.argv.includes("--apply")) fail("vNext planner never applies documentation changes");
  const changeRequestPath = normalizeRepoPath(argValue("--change-request") ?? "");
  const outputDir = normalizeRepoPath(argValue("--output-dir") ?? "");
  const baseSha = gitSha(argValue("--base-sha"), "base_sha");
  const planningHeadSha = gitSha(run("git", ["rev-parse", "HEAD"]), "planning_head_sha");
  const dirtyStatus = run("git", ["status", "--porcelain=v1"]);
  if (dirtyStatus && !process.argv.includes("--allow-dirty")) {
    fail("persisted cascade planning requires a clean worktree; use --allow-dirty for profile diagnostics only");
  }
  const explicitSourceIds = argValues("--source-id");
  const explicitTriggers = argValues("--trigger-path").map(normalizeRepoPath);
  const registryDeltaPath = argValue("--source-registry-delta");
  if (process.argv.includes("--xlsx-change-signals")) {
    fail("manual XLSX change signals are not accepted; the classifier reads the declared Git range");
  }
  if (!changeRequestPath || !outputDir) fail("usage: npm run cascade:run -- --change-request <path> --output-dir <fresh-run-dir> --base-sha <sha> [--trigger-path <path>] [--source-id <id>]");
  if (run("git", ["merge-base", "--is-ancestor", baseSha, planningHeadSha]) !== "") {
    // git merge-base --is-ancestor succeeds without output.
  }
  assertDirectRunDir(outputDir);

  const changeRequest = readJson(changeRequestPath);
  validateDocument(changeRequest, "schemas/documentation-change-request.schema.json");
  const graph = readJson(graphPath);
  validateDocument(graph, "schemas/artifact-dependency-graph.schema.json");
  const acceptanceAuthority = readJson(acceptanceAuthorityPath);
  validateDocument(acceptanceAuthority, "schemas/cascade-acceptance-authority.schema.json");
  const sourceRegistry = readJson(sourceRegistryPath);
  const validationCatalog = readJson(validationCatalogPath);
  const registryDelta = registryDeltaPath ? readJson(normalizeRepoPath(registryDeltaPath)) : null;
  const targetPath = normalizeRepoPath(changeRequest.target_artifact);
  const initialTriggers = explicitTriggers.length > 0 ? explicitTriggers : [targetPath];
  const sensitiveSourceRoute = initialTriggers.some((candidate) => ["xlsx", "provenance", "source_registry"].includes(sourceKind(candidate)));
  const changedEntries = parseGitNameStatus(run("git", ["diff", "--name-status", "-z", `${baseSha}..${planningHeadSha}`]));
  const changedPaths = changedEntries.flatMap((entry) => [entry.path, entry.old_path].filter(Boolean));
  if (registryDelta) {
    const beforeRegistryContent = gitFileAt(baseSha, sourceRegistryPath);
    const afterRegistryContent = gitFileAt(planningHeadSha, sourceRegistryPath);
    if (!beforeRegistryContent || !afterRegistryContent) {
      fail("source registry delta requires the registry in both Git revisions");
    }
    assertRegistryDeltaIntegrity(registryDelta, {
      beforeSha256: sha256Buffer(beforeRegistryContent),
      afterSha256: sha256Buffer(afterRegistryContent),
      registryChanged: changedPaths.includes(sourceRegistryPath),
      beforeRegistry: JSON.parse(beforeRegistryContent.toString("utf8")),
      afterRegistry: JSON.parse(afterRegistryContent.toString("utf8")),
    });
  }

  let identities;
  try {
    identities = resolveSourceIdentities({ sourceRegistry, triggerPaths: initialTriggers, explicitSourceIds, registryDelta });
  } catch (error) {
    if (sensitiveSourceRoute) throw error;
    identities = [{
      source_id: `SRC-DCR-${changeRequest.change_request_id.replace(/^DCR-/u, "")}`,
      source_path: targetPath,
      provenance_path: null,
      resolution: "change_request",
    }];
  }
  const resolvedTriggers = resolveActualTriggerPaths({
    initialTriggers,
    identities,
    explicitSourceSelection: explicitSourceIds.length > 0,
    changedPaths,
  });
  const graphPaths = new Set(graph.artifacts.map((artifact) => artifact.path));
  const graphArtifacts = new Map(graph.artifacts.map((artifact) => [artifact.path, artifact]));
  const uncovered = resolvedTriggers.filter((candidate) => !graphPaths.has(candidate));
  if (uncovered.length > 0) fail(`uncovered changed paths: ${uncovered.join(", ")}`);

  const xlsxPaths = resolvedTriggers.filter((triggerPath) => sourceKind(triggerPath) === "xlsx");
  const xlsxAnalyses = analyzeXlsxSources(xlsxPaths, baseSha, planningHeadSha);
  const xlsxAnalysisByPath = new Map(xlsxAnalyses.map((entry) => [entry.path, entry]));
  const changedSources = resolvedTriggers.map((triggerPath) => {
    const kind = sourceKind(triggerPath);
    const changeClasses = kind === "xlsx"
      ? xlsxAnalysisByPath.get(triggerPath).change_classes
      : documentChangeClasses(graphArtifacts.get(triggerPath), kind, changeRequest.semantic_change);
    return { path: triggerPath, source_kind: kind, change_classes: changeClasses };
  });
  const semanticImpact = analyzeSemanticCascade(graph, changedSources);
  validateDocument(semanticImpact, "schemas/cascade-semantic-impact-report.schema.json");
  const ownerDecisionClasses = new Set([
    "acceptance_meaning",
    "business_model",
    "business_requirement",
    "capacity",
    "change_order",
    "hypothesis",
    "mixed_or_ambiguous",
    "non_functional_requirement",
    "priority_change",
    "estimate_change",
    "product_goal",
    "product_meaning",
    "roadmap_meaning",
    "row_add_remove",
    "scope_change",
    "source_identity",
    "story_text_change",
  ]);
  const ownerRequired = semanticImpact.authoritative_review_paths.length > 0
    || changedSources.some((source) => source.change_classes.some((value) => ownerDecisionClasses.has(value)));
  const routeCommands = [...new Set(semanticImpact.route_evidence.map((route) => route.validation_command).filter(Boolean))];
  const scopes = ["change_instance", "cascade", "security"];
  if (changedSources.some((source) => source.source_kind === "xlsx" || source.source_kind === "provenance")) scopes.push("analysis_source", "xlsx_backlog", "effort_estimation");
  if (ownerRequired) scopes.push("product_meaning", "traceability");
  const validationManifest = buildValidationManifest({ catalog: validationCatalog, routeCommands, scopes });
  validationManifest.$schema = "https://datacanvas.local/schemas/v1/cascade-validation-manifest.schema.json";
  const runtimeManifest = buildRuntimeManifest(root);
  const suffix = changeRequest.change_request_id.replace(/^DCR-/u, "");
  const sourceChangeAnalysis = xlsxAnalyses.length > 0 ? {
    $schema: "https://datacanvas.local/schemas/v1/cascade-source-change-analysis.schema.json",
    version: "1.0.0",
    analysis_id: "CSCA-" + suffix,
    base_sha: baseSha,
    planning_head_sha: planningHeadSha,
    analyzer_path: "scripts/classify-datacanvas-xlsx-change.py",
    analyzer_sha256: hashRepoPath(root, "scripts/classify-datacanvas-xlsx-change.py"),
    sources: xlsxAnalyses,
  } : null;
  const runId = `CUR-${suffix}`;
  const attemptId = argValue("--attempt-id", `ATTEMPT-${path.posix.basename(outputDir).toUpperCase().replace(/[^A-Z0-9]+/gu, "-")}`);
  const timestamp = new Date().toISOString();
  const sourceIdentityManifest = {
    $schema: "https://datacanvas.local/schemas/v1/cascade-source-identity.schema.json",
    version: "1.0.0",
    identity_set_id: `CSI-${suffix}`,
    registry_path: sourceRegistryPath,
    registry_sha256: hashRepoPath(root, sourceRegistryPath),
    registry_delta: registryDelta,
    trigger_sources: changedSources.map((source) => {
      const identity = identities.find((candidate) => candidate.source_path === source.path || candidate.provenance_path === source.path) ?? identities[0];
      return {
        trigger_path: source.path,
        source_kind: source.source_kind,
        source_id: identity.source_id,
        source_path: identity.source_path,
        provenance_path: identity.provenance_path,
        resolution: identity.resolution,
      };
    }),
  };
  const ownerQuestion = ownerRequired
    ? buildQuestionPacket({
      suffix,
      changeRequest,
      sourcePaths: changedSources.map((source) => source.path),
      affectedPaths: [...new Set([
        ...semanticImpact.authoritative_review_paths,
        ...semanticImpact.write_obligations,
        ...changedSources.map((source) => source.path),
      ])].sort(),
      changeClasses: [...new Set(changedSources.flatMap((source) => source.change_classes))].sort(),
      ownerRoles: requiredOwnerRoles(changedSources.flatMap((source) => source.change_classes)),
    })
    : null;
  const fileNames = {
    run: "cascade-vnext-run.json",
    source: "source-identity.json",
    sourceAnalysis: sourceChangeAnalysis ? "source-change-analysis.json" : null,
    impact: "semantic-impact-report.json",
    validation: "validation-manifest.json",
    runtime: "runtime-manifest.json",
    question: ownerQuestion ? "owner-question-packet.json" : null,
  };
  const replayInputs = {
    runner_version: "1.0.0",
    change_request_sha256: hashRepoPath(root, changeRequestPath),
    graph_sha256: hashRepoPath(root, graphPath),
    source_registry_sha256: hashRepoPath(root, sourceRegistryPath),
    acceptance_authority_sha256: hashRepoPath(root, acceptanceAuthorityPath),
    source_identity_sha256: hashJsonDocument(sourceIdentityManifest),
    source_change_analysis_sha256: sourceChangeAnalysis ? hashJsonDocument(sourceChangeAnalysis) : null,
    semantic_impact_sha256: hashJsonDocument(semanticImpact),
    validation_manifest_sha256: hashJsonDocument(validationManifest),
    runtime_contract_sha256: hashJsonDocument({
      lockfile_sha256: runtimeManifest.lockfile_sha256,
      command_map_sha256: runtimeManifest.command_map_sha256,
    }),
    owner_question_packet_sha256: ownerQuestion ? hashJsonDocument(ownerQuestion) : null,
  };
  const runRecord = {
    $schema: "https://datacanvas.local/schemas/v1/cascade-vnext-run.schema.json",
    version: "1.0.0",
    run_id: runId,
    attempt_id: attemptId,
    process_status: "draft_opt_in",
    state: ownerRequired ? "awaiting_owner" : "planned",
    created_at: timestamp,
    change_request_id: changeRequest.change_request_id,
    change_request_path: changeRequestPath,
    base_sha: baseSha,
    planning_head_sha: planningHeadSha,
    candidate_head_sha: null,
    acceptance_authority_path: acceptanceAuthorityPath,
    source_identity_manifest_path: `${outputDir}/${fileNames.source}`,
    source_change_analysis_path: sourceChangeAnalysis ? `${outputDir}/${fileNames.sourceAnalysis}` : null,
    impact_report_path: `${outputDir}/${fileNames.impact}`,
    diff_manifest_path: null,
    validation_manifest_path: `${outputDir}/${fileNames.validation}`,
    runtime_manifest_path: `${outputDir}/${fileNames.runtime}`,
    owner_question_packet_path: ownerQuestion ? `${outputDir}/${fileNames.question}` : null,
    resolution_input_path: null,
    resolution_report_path: null,
    acceptance_paths: [],
    profile_evidence_path: null,
    completion_evidence_path: null,
    completion_seal_path: null,
    completion_claim: { done_claimed: false },
    replay_inputs: replayInputs,
    replay_key: null,
  };
  runRecord.replay_key = buildCascadeReplayKey(runRecord);
  validateDocument(sourceIdentityManifest, "schemas/cascade-source-identity.schema.json");
  if (sourceChangeAnalysis) validateDocument(sourceChangeAnalysis, "schemas/cascade-source-change-analysis.schema.json");
  validateDocument(validationManifest, "schemas/cascade-validation-manifest.schema.json");
  validateDocument(runtimeManifest, "schemas/cascade-runtime-manifest.schema.json");
  if (ownerQuestion) validateDocument(ownerQuestion, "schemas/cascade-owner-question-packet.schema.json");
  validateDocument(runRecord, "schemas/cascade-vnext-run.schema.json");

  const files = new Map([
    [fileNames.run, `${JSON.stringify(runRecord, null, 2)}\n`],
    [fileNames.source, `${JSON.stringify(sourceIdentityManifest, null, 2)}\n`],
    [fileNames.impact, `${JSON.stringify(semanticImpact, null, 2)}\n`],
    [fileNames.validation, `${JSON.stringify(validationManifest, null, 2)}\n`],
    [fileNames.runtime, `${JSON.stringify(runtimeManifest, null, 2)}\n`],
  ]);
  if (sourceChangeAnalysis) files.set(fileNames.sourceAnalysis, `${JSON.stringify(sourceChangeAnalysis, null, 2)}\n`);
  if (ownerQuestion) files.set(fileNames.question, `${JSON.stringify(ownerQuestion, null, 2)}\n`);
  publishAtomicPackage({ targetDir: absoluteRepoPath(root, outputDir), attemptId, files });
  console.log(`cascade vNext planned: ${outputDir}`);
  console.log(`state: ${runRecord.state}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
