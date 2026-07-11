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
  classifyXlsxChangeSignals,
  resolveSourceIdentities,
} from "./cascade-vnext-core.mjs";
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

function authorityScope(artifact) {
  const byLayer = {
    Vision: ["product_meaning", "scope_change"],
    BMC: ["business_model"],
    stories: ["story_text_change"],
    "business requirements": ["business_requirement"],
    NFR: ["non_functional_requirement"],
    "acceptance criteria": ["acceptance_meaning"],
    "product backlog": ["priority_change", "scope_change"],
    roadmap: ["roadmap_meaning"],
  };
  return byLayer[artifact.layer] ?? [];
}

function enrichGraph(graph) {
  return {
    ...graph,
    artifacts: graph.artifacts.map((artifact) => ({ ...artifact, authority_scope: authorityScope(artifact) })),
    dependencies: graph.dependencies.map((edge, index) => ({
      ...edge,
      edge_id: `EDGE-${String(index + 1).padStart(4, "0")}`,
    })),
  };
}

function excerptFor(relativePath, fallback) {
  if (relativePath.endsWith(".xlsx")) return fallback;
  const content = fs.readFileSync(absoluteRepoPath(root, relativePath), "utf8");
  const paragraph = content.split(/\n\s*\n/u).map((item) => item.trim()).find((item) => item && !item.startsWith("#"));
  return (paragraph ?? fallback).slice(0, 1200);
}

function buildQuestionPacket({ suffix, changeRequest, sourcePath, affectedPaths, timestamp }) {
  const excerpt = excerptFor(sourcePath, changeRequest.desired_change);
  const packet = {
    $schema: "https://datacanvas.local/schemas/v1/cascade-owner-question-packet.schema.json",
    version: "1.0.0",
    packet_id: `QPK-CASCADE-${suffix}`,
    decision_id: `DEC-CASCADE-${suffix}`,
    owner_role: "Product Owner / Process Owner",
    question: `Как согласовать влияние изменения «${changeRequest.desired_change}» на авторитетные источники и зависимые документы?`,
    source_excerpts: [{ path: sourcePath, excerpt, excerpt_sha256: crypto.createHash("sha256").update(excerpt).digest("hex") }],
    affected_artifacts: affectedPaths.map((artifactPath) => ({
      path: artifactPath,
      sha256: hashRepoPath(root, artifactPath) ?? "0".repeat(64),
    })),
    options: [
      { option_id: `OPT-${suffix}-ACCEPT`, text: "Принять изменение полностью и обновить авторитетный источник.", consequences: "После согласования будет запущен новый downstream-проход по зависимым документам." },
      { option_id: `OPT-${suffix}-REJECT`, text: "Отклонить изменение и сохранить текущий авторитетный смысл.", consequences: "Измененный производный документ потребуется привести к действующему источнику истины." },
      { option_id: `OPT-${suffix}-PARTIAL`, text: "Принять только часть изменения после уточнения формулировки.", consequences: "Каскад останется заблокированным до согласования уточненного текста." },
      { option_id: `OPT-${suffix}-DEFER`, text: "Отложить решение без смысловых правок.", consequences: "Документы не меняются, запуск остается в состоянии ожидания владельца." },
      { option_id: `OPT-${suffix}-EVIDENCE`, text: "Запросить дополнительные сведения и повторный анализ.", consequences: "Будет дополнен пакет доказательств без изменения продуктового смысла." },
    ],
    recommended_option_id: `OPT-${suffix}-EVIDENCE`,
    packet_sha256: "0".repeat(64),
    generated_at: timestamp,
  };
  delete packet.generated_at;
  packet.packet_sha256 = hashJsonDocument({ ...packet, packet_sha256: null });
  return packet;
}

function buildRuntimeManifest() {
  const packageJson = readJson("package.json");
  return {
    $schema: "https://datacanvas.local/schemas/v1/cascade-runtime-manifest.schema.json",
    version: "1.0.0",
    node: process.version.replace(/^v/u, ""),
    npm: run("npm", ["--version"]),
    python: run("python3", ["-c", "import platform; print(platform.python_version())"]),
    platform: process.platform,
    arch: process.arch,
    locale: process.env.LC_ALL ?? process.env.LANG ?? "C.UTF-8",
    timezone: process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    lockfile_sha256: hashRepoPath(root, "package-lock.json"),
    command_map_sha256: hashJsonDocument(packageJson.scripts),
    environment_allowlist: ["CI", "LANG", "LC_ALL", "TZ"],
  };
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
  const xlsxSignalsPath = argValue("--xlsx-change-signals");
  if (!changeRequestPath || !outputDir) fail("usage: npm run cascade:run -- --change-request <path> --output-dir <fresh-run-dir> --base-sha <sha> [--trigger-path <path>] [--source-id <id>]");
  if (run("git", ["merge-base", "--is-ancestor", baseSha, planningHeadSha]) !== "") {
    // git merge-base --is-ancestor succeeds without output.
  }
  assertDirectRunDir(outputDir);

  const changeRequest = readJson(changeRequestPath);
  validateDocument(changeRequest, "schemas/documentation-change-request.schema.json");
  const graph = enrichGraph(readJson(graphPath));
  const sourceRegistry = readJson(sourceRegistryPath);
  const validationCatalog = readJson(validationCatalogPath);
  const registryDelta = registryDeltaPath ? readJson(normalizeRepoPath(registryDeltaPath)) : null;
  const targetPath = normalizeRepoPath(changeRequest.target_artifact);
  const initialTriggers = explicitTriggers.length > 0 ? explicitTriggers : [targetPath];
  const sensitiveSourceRoute = initialTriggers.some((candidate) => ["xlsx", "provenance", "source_registry"].includes(sourceKind(candidate)));

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
  const resolvedTriggers = explicitSourceIds.length > 0
    ? identities.flatMap((identity) => [identity.source_path, identity.provenance_path].filter(Boolean))
    : initialTriggers;
  const graphPaths = new Set(graph.artifacts.map((artifact) => artifact.path));
  const uncovered = resolvedTriggers.filter((candidate) => !graphPaths.has(candidate));
  if (uncovered.length > 0) fail(`uncovered changed paths: ${uncovered.join(", ")}`);

  const xlsxSignals = xlsxSignalsPath ? readJson(normalizeRepoPath(xlsxSignalsPath)) : null;
  const changedSources = resolvedTriggers.map((triggerPath) => {
    const kind = sourceKind(triggerPath);
    const changeClasses = kind === "xlsx"
      ? classifyXlsxChangeSignals(xlsxSignals ?? {})
      : kind === "provenance"
        ? ["provenance_only"]
        : changeRequest.semantic_change
          ? ["product_meaning"]
          : ["documentation"];
    return { path: triggerPath, source_kind: kind, change_classes: changeClasses };
  });
  const semanticImpact = analyzeSemanticCascade(graph, changedSources);
  const ownerRequired = semanticImpact.authoritative_review_paths.length > 0
    || changedSources.some((source) => source.change_classes.some((value) => ["mixed_or_ambiguous", "priority_change", "story_text_change", "scope_change", "product_meaning"].includes(value)));
  const routeCommands = [...new Set(semanticImpact.route_evidence.map((route) => route.validation_command).filter(Boolean))];
  const scopes = ["change_instance", "cascade", "security"];
  if (changedSources.some((source) => source.source_kind === "xlsx" || source.source_kind === "provenance")) scopes.push("analysis_source", "xlsx_backlog", "effort_estimation");
  if (ownerRequired) scopes.push("product_meaning", "traceability");
  const validationManifest = buildValidationManifest({ catalog: validationCatalog, routeCommands, scopes });
  validationManifest.$schema = "https://datacanvas.local/schemas/v1/cascade-validation-manifest.schema.json";
  const runtimeManifest = buildRuntimeManifest();
  const suffix = changeRequest.change_request_id.replace(/^DCR-/u, "");
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
    ? buildQuestionPacket({ suffix, changeRequest, sourcePath: changedSources[0].path, affectedPaths: semanticImpact.authoritative_review_paths, timestamp })
    : null;
  const fileNames = {
    run: "cascade-vnext-run.json",
    source: "source-identity.json",
    impact: "semantic-impact-report.json",
    validation: "validation-manifest.json",
    runtime: "runtime-manifest.json",
    question: ownerQuestion ? "owner-question-packet.json" : null,
  };
  const runRecord = {
    $schema: "https://datacanvas.local/schemas/v1/cascade-vnext-run.schema.json",
    version: "1.0.0",
    run_id: runId,
    attempt_id: attemptId,
    process_status: "draft_opt_in",
    state: ownerRequired ? "awaiting_owner" : "planned",
    created_at: timestamp,
    change_request_path: changeRequestPath,
    base_sha: baseSha,
    planning_head_sha: planningHeadSha,
    candidate_head_sha: null,
    source_identity_manifest_path: `${outputDir}/${fileNames.source}`,
    impact_report_path: `${outputDir}/${fileNames.impact}`,
    diff_manifest_path: null,
    validation_manifest_path: `${outputDir}/${fileNames.validation}`,
    runtime_manifest_path: `${outputDir}/${fileNames.runtime}`,
    owner_question_packet_path: ownerQuestion ? `${outputDir}/${fileNames.question}` : null,
    resolution_input_path: null,
    resolution_report_path: null,
    acceptance_paths: [],
    profile_evidence_path: null,
    completion_seal_path: null,
    completion_claim: { done_claimed: false },
  };
  validateDocument(sourceIdentityManifest, "schemas/cascade-source-identity.schema.json");
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
  if (ownerQuestion) files.set(fileNames.question, `${JSON.stringify(ownerQuestion, null, 2)}\n`);
  publishAtomicPackage({ targetDir: absoluteRepoPath(root, outputDir), attemptId, files });
  console.log(`cascade vNext planned: ${outputDir}`);
  console.log(`state: ${runRecord.state}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
