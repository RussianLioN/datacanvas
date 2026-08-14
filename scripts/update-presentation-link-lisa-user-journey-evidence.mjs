import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, webkit } from "@playwright/test";
import {
  FIXED_EPOCH,
  PACKAGE_PATH,
  sha256File,
  stabilizeBrowserCapture,
  stableStringify,
  validateContracts,
} from "./lib/presentation-link-lisa-user-journey.mjs";
import {
  EVIDENCE_NETWORK_GUARD_SCOPE,
  EVIDENCE_REPORT_VERSION,
  EVIDENCE_VIEWPORTS,
  buildCandidateFingerprint,
  buildEvidenceMatrix,
  expectedEvidenceBrowserLaunchArgs,
  publishEvidenceAtomically,
  readCanonicalRasterManifest,
  resolveEvidenceRoots,
  selectEvidenceBrowserLaunchArgs,
  validateEvidencePackage,
} from "./validate-presentation-link-lisa-user-journey-evidence.mjs";
import {
  runRuntimeBrowserWorker,
} from "./capture-presentation-link-lisa-runtime-evidence.mjs";

export { runRuntimeBrowserWorker } from "./capture-presentation-link-lisa-runtime-evidence.mjs";

const require = createRequire(import.meta.url);
const { version: PLAYWRIGHT_VERSION } = require("@playwright/test/package.json");
const ROOT = process.cwd();
const EVIDENCE_TOOLCHAIN_PATHS = Object.freeze([
  "scripts/capture-presentation-link-lisa-runtime-evidence.mjs",
  "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
  "scripts/validate-presentation-link-lisa-user-journey-evidence.mjs",
]);
const DOCUMENTATION_PATHS = Object.freeze([
  "README.md",
  "donor-options.md",
  "user-journey.md",
]);
const HTML_PATHS = Object.freeze([
  "demo/index.html",
  "demo/app.js",
  "demo/styles.css",
  "demo/data.js",
]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function sameOrderedValues(left, right) {
  return Array.isArray(left) && Array.isArray(right) &&
    left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizedOptions(options = {}) {
  return {
    toolchainRoot: options.toolchainRoot ?? options.root ?? ROOT,
    contractRoot: options.contractRoot ?? options.root ?? options.toolchainRoot ?? ROOT,
    packageRoot: options.packageRoot,
    evidenceRoot: options.evidenceRoot,
  };
}

function relativePath(root, target) {
  return toPosix(path.relative(root, target));
}

function hashRecord(root, relative) {
  const target = path.join(root, relative);
  return { path: relative, sha256: sha256File(target), bytes: fs.statSync(target).size };
}

function walkFiles(directory, relativeDirectory = "") {
  const files = [];
  for (const entry of fs.readdirSync(path.join(directory, relativeDirectory), { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name, "en"),
  )) {
    const relative = path.join(relativeDirectory, entry.name);
    if (relativeDirectory === "" && entry.name === "evidence") continue;
    if (entry.name.startsWith(".evidence-staging-")) continue;
    if (entry.isDirectory()) files.push(...walkFiles(directory, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

/** Captures a read-only fingerprint of candidate inputs; evidence itself is excluded. */
export function snapshotEvidenceInputs(options = {}) {
  const input = normalizedOptions(options);
  const roots = resolveEvidenceRoots({
    ...input,
    allowActivePackage: options.allowActivePackage ?? false,
    requireCandidate: options.requireCandidate ?? false,
  });
  const records = {};
  for (const relative of walkFiles(roots.packageRoot)) {
    records[`candidate/${toPosix(relative)}`] = sha256File(path.join(roots.packageRoot, relative));
  }
  for (const relative of EVIDENCE_TOOLCHAIN_PATHS) {
    const target = path.join(roots.toolchainRoot, relative);
    records[`toolchain/${relative}`] = fs.existsSync(target) ? sha256File(target) : "missing";
  }
  return records;
}

export function isExternalNetworkUrl(rawUrl) {
  try {
    return ["http:", "https:", "ws:", "wss:"].includes(new URL(rawUrl).protocol);
  } catch {
    return false;
  }
}

export function sanitizeDiagnostic(value) {
  return String(value)
    .replace(/file:\/\/(?:\/)?(?:Users|home)\/[^\s"'<>)]*/gu, "[локальный-ресурс]")
    .replace(/\/(?:Users|home)\/[^\s"'<>)]*/gu, "[локальный-ресурс]")
    .replace(/[A-Za-z]:\\(?:Users|Documents and Settings)\\[^\s"'<>)]*/gu, "[локальный-ресурс]");
}

function classifyExpectedToolingConsoleMessage(message) {
  if (
    message.includes("connect-src") &&
    message.includes("styles.css") &&
    (message.includes("violates") || message.includes("Refused to connect"))
  ) {
    return "axe-stylesheet-connect-src";
  }
  if (
    message === "Refused to apply a stylesheet because its hash, its nonce, or " +
      "'unsafe-inline' does not appear in the style-src directive of the " +
      "Content Security Policy."
  ) {
    return "playwright-webkit-screenshot-inline-style";
  }
  return null;
}

function inspectResourceUrls(resourceUrls, packageRoot) {
  const issues = [];
  const resolvedPackageRoot = path.resolve(packageRoot);
  for (const rawUrl of resourceUrls) {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      issues.push("ресурс содержит некорректный URL");
      continue;
    }
    if (!['file:', 'data:', 'about:'].includes(url.protocol)) {
      issues.push(`запрещён внешний протокол ресурса: ${url.protocol}`);
      continue;
    }
    if (url.protocol === "data:" && !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/u.test(rawUrl)) {
      issues.push("разрешены только проверенные data:image/png ресурсы");
      continue;
    }
    if (url.protocol === "file:") {
      const resourcePath = path.resolve(fileURLToPath(url));
      if (!resourcePath.startsWith(`${resolvedPackageRoot}${path.sep}`) || !fs.existsSync(resourcePath)) {
        issues.push("локальный ресурс находится вне переносимого пакета");
      }
    }
  }
  return issues;
}

async function collectGeometry(page, expectedSlots = []) {
  return page.evaluate(() => {
    const scene = document.querySelector(".prototype-scene[data-prototype-scene]");
    const base = scene?.querySelector("img.scene-base[data-source-base-id]");
    const stage = document.querySelector(".scene-stage");
    if (!scene || !base || !stage) return { missingScene: true };
    const sceneRect = scene.getBoundingClientRect();
    const baseRect = base.getBoundingClientRect();
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const slots = [...scene.querySelectorAll("[data-slot-id][data-semantic-control-id]")];
    const slotIds = slots.map((element) => element.getAttribute("data-slot-id"));
    const semanticControlIds = slots.map((element) => element.getAttribute("data-semantic-control-id"));
    const actions = slots.filter((element) => !element.hasAttribute("disabled")).filter(visible).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        id: element.getAttribute("data-action-id") || element.getAttribute("data-semantic-control-id"),
        width: rect.width,
        height: rect.height,
        inside: rect.left >= sceneRect.left - 1 && rect.right <= sceneRect.right + 1 &&
          rect.top >= sceneRect.top - 1 && rect.bottom <= sceneRect.bottom + 1,
      };
    });
    return {
      missingScene: false,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentScrollHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      sceneInsideViewportHorizontally: sceneRect.left >= -1 && sceneRect.right <= window.innerWidth + 1,
      sceneMatchesBase: base.complete && base.naturalWidth > 0 && base.naturalHeight > 0 &&
        Math.abs(sceneRect.width - baseRect.width) < 0.1 && Math.abs(sceneRect.height - baseRect.height) < 0.1 &&
        Math.abs((baseRect.width / base.naturalWidth) - (baseRect.height / base.naturalHeight)) < 0.001,
      slotIds,
      semanticControlIds,
      actionOutsideSceneCount: actions.filter((action) => !action.inside).length,
      stageContainsScene: stage.contains(scene),
      resourceUrls: [...new Set([
        ...[...document.querySelectorAll("[src], [href]")].map((element) => element.src || element.href),
        ...performance.getEntriesByType("resource").map((entry) => entry.name),
      ])],
    };
  }, expectedSlots);
}

function compactAxeViolations(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    node_count: violation.nodes.length,
  }));
}

/** Enforces that the guard is installed on BrowserContext, never Page. */
export function assertContextNetworkGuard(context) {
  if (
    !context ||
    typeof context.newPage !== "function" ||
    typeof context.route !== "function" ||
    typeof context.routeWebSocket !== "function"
  ) {
    throw new Error("защита сети evidence должна устанавливаться на BrowserContext, а не на Page");
  }
}

export async function installNetworkGuards(context, attemptedNetwork) {
  assertContextNetworkGuard(context);
  const recordAttempt = (rawUrl) => {
    if (isExternalNetworkUrl(rawUrl)) attemptedNetwork.add(rawUrl);
  };
  context.on("request", (request) => recordAttempt(request.url()));
  await context.route(/^(?:https?|wss?):/u, async (route) => {
    recordAttempt(route.request().url());
    await route.abort("blockedbyclient");
  });
  await context.routeWebSocket(/^(?:ws|wss):/u, (socket) => {
    recordAttempt(socket.url());
    socket.close({ code: 1008, reason: "Внешняя сеть запрещена" });
  });
}

function runtimeRecord({ browserName, browserVersion, plan, checks }) {
  return {
    browser: browserName,
    viewport: plan.viewport,
    state_id: plan.state_id,
    checks,
  };
}

function runtimeChecks({ renderedStateId, expectedStateId, expectedSlots, consoleErrors, pageErrors, axeViolations, geometry, resourceIssues, attemptedNetwork }) {
  const relevantConsoleErrors = consoleErrors
    .filter((message) => classifyExpectedToolingConsoleMessage(message) === null)
    .map(sanitizeDiagnostic);
  const sanitizedPageErrors = pageErrors.map(sanitizeDiagnostic);
  const attempts = [...attemptedNetwork].sort((left, right) => left.localeCompare(right, "en"));
  const behaviorPassed = renderedStateId === expectedStateId && relevantConsoleErrors.length === 0 && sanitizedPageErrors.length === 0;
  const expectedSlotIds = expectedSlots.map((slot) => slot.id);
  const expectedControlIds = expectedSlots.map((slot) => slot.semantic_control_id);
  const geometryPassed = !geometry.missingScene &&
    geometry.documentScrollWidth <= geometry.viewportWidth + 1 &&
    geometry.documentScrollHeight <= geometry.viewportHeight + 1 &&
    geometry.sceneInsideViewportHorizontally === true && geometry.sceneMatchesBase === true &&
    geometry.stageContainsScene === true && geometry.actionOutsideSceneCount === 0 &&
    sameOrderedValues([...geometry.slotIds].sort((left, right) => String(left).localeCompare(String(right), "en")), [...expectedSlotIds].sort((left, right) => left.localeCompare(right, "en"))) &&
    sameOrderedValues([...geometry.semanticControlIds].sort((left, right) => String(left).localeCompare(String(right), "en")), [...expectedControlIds].sort((left, right) => left.localeCompare(right, "en"))) &&
    resourceIssues.length === 0;
  return {
    behavior: { passed: behaviorPassed },
    accessibility: {
      passed: axeViolations.length === 0,
      axe_violation_count: axeViolations.length,
    },
    geometry: { passed: geometryPassed },
    network: {
      passed: attempts.length === 0,
      network_attempts: attempts,
      console_errors: relevantConsoleErrors,
      page_errors: sanitizedPageErrors,
    },
  };
}

/**
 * Runs interaction/accessibility/layout/network checks only. It deliberately
 * never calls screenshot(), so Chromium cannot publish an unstable PNG.
 */
export async function captureBrowser({
  browserType,
  browserName,
  runtimePlans,
  packageRoot,
  demoPath = path.join(packageRoot, "demo/index.html"),
  captureStabilization,
  browserLaunchArgs,
}) {
  const appliedBrowserLaunchArgs = browserLaunchArgs ??
    selectEvidenceBrowserLaunchArgs(captureStabilization, browserName);
  const browser = await browserType.launch({ headless: true, args: appliedBrowserLaunchArgs });
  const browserVersion = browser.version();
  const results = [];
  try {
    for (const viewport of EVIDENCE_VIEWPORTS) {
      const plans = runtimePlans.filter((plan) => plan.viewport === viewport.id);
      if (plans.length === 0) continue;
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        locale: "ru-RU",
        timezoneId: "UTC",
        colorScheme: "light",
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      const attemptedNetwork = new Set();
      try {
        await installNetworkGuards(context, attemptedNetwork);
        for (const plan of plans) {
          const page = await context.newPage();
          const consoleErrors = [];
          const pageErrors = [];
          page.on("console", (message) => {
            if (message.type() === "error") consoleErrors.push(message.text());
          });
          page.on("pageerror", (error) => pageErrors.push(error.message));
          await page.addInitScript(() => {
            Date.now = () => 1784150400000;
            window.__DATACANVAS_LISA_CAPTURE__ = true;
          });
          try {
            const url = pathToFileURL(demoPath);
            url.searchParams.set("state", plan.state_id);
            await page.goto(url.href, { waitUntil: "load" });
            const scene = page.locator(".prototype-scene[data-prototype-scene]");
            await scene.waitFor();
            await stabilizeBrowserCapture(page, captureStabilization);
            const renderedStateId = await scene.getAttribute("data-state-id");
            const geometry = await collectGeometry(page, plan.semantic_slots ?? []);
            const resourceIssues = inspectResourceUrls(geometry.resourceUrls ?? [], packageRoot);
            const axe = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
              .analyze();
            results.push(runtimeRecord({
              browserName,
              browserVersion,
              plan,
              checks: runtimeChecks({
                renderedStateId,
                expectedStateId: plan.state_id,
                expectedSlots: plan.semantic_slots ?? [],
                consoleErrors,
                pageErrors,
                axeViolations: compactAxeViolations(axe.violations),
                geometry,
                resourceIssues,
                attemptedNetwork,
              }),
            }));
          } finally {
            await page.close();
          }
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return {
    browserVersion,
    runtimeResults: results,
    browserLaunchArgs: [...appliedBrowserLaunchArgs],
  };
}

function runtimeTotals(records, canonicalPngCount) {
  const checkList = records.map((record) => record.checks);
  return {
    chromium_runtime_results: records.filter((record) => record.browser === "chromium").length,
    webkit_runtime_results: records.filter((record) => record.browser === "webkit").length,
    canonical_webkit_pngs: canonicalPngCount,
    console_errors: checkList.reduce((count, checks) => count + checks.network.console_errors.length, 0),
    page_errors: checkList.reduce((count, checks) => count + checks.network.page_errors.length, 0),
    network_attempts: checkList.reduce((count, checks) => count + checks.network.network_attempts.length, 0),
    failed_checks: checkList.reduce((count, checks) => count + [
      checks.behavior,
      checks.accessibility,
      checks.geometry,
      checks.network,
    ].filter((check) => check.passed !== true).length, 0),
  };
}

export function buildBrowserReport({
  runtimeResults,
  browserVersions,
  browserLaunchArgsApplied,
  captureStabilization,
  activeEvidence,
  canonicalRasterManifest,
  candidateFingerprint,
  playwrightVersion = PLAYWRIGHT_VERSION,
}) {
  const matrix = activeEvidence;
  const context = matrix.context;
  const launchArgs = browserLaunchArgsApplied ?? expectedEvidenceBrowserLaunchArgs(captureStabilization);
  return {
    version: EVIDENCE_REPORT_VERSION,
    status: "generated",
    deterministic_epoch: FIXED_EPOCH,
    playwright_version: playwrightVersion,
    active_state_ids: [...context.activeStateIds],
    active_contract_ids: [...context.activeContractIds],
    active_contracts_sha256: context.activeContractsSha256,
    mvp_scope: "P1/P2",
    candidate_fingerprint: candidateFingerprint,
    renderer_profile: canonicalRasterManifest.manifest.renderer_profile,
    source_parity: canonicalRasterManifest.manifest.source_parity,
    canonical_raster_manifest: {
      path: canonicalRasterManifest.path,
      sha256: canonicalRasterManifest.sha256,
    },
    runtime_profile: Object.fromEntries(["chromium", "webkit"].map((browser) => [
      browser,
      {
        browser,
        browser_version: browserVersions[browser],
        launch_args: launchArgs[browser],
        runtime_check_only: true,
        published_png: false,
        retained_png: false,
        network_guard_scope: EVIDENCE_NETWORK_GUARD_SCOPE,
      },
    ])),
    runtime_results: runtimeResults,
    totals: runtimeTotals(runtimeResults, matrix.canonicalPngCount),
    network_policy: {
      external_protocols: ["http", "https", "ws", "wss"],
      blocked_before_send: true,
      publication_requires_zero_attempts: true,
      guard_scope: EVIDENCE_NETWORK_GUARD_SCOPE,
    },
  };
}

export function assertEvidenceContracts(contractRoot = process.cwd()) {
  const matrix = buildEvidenceMatrix({ contractRoot });
  const issues = validateContracts(contractRoot, matrix.context.contracts);
  if (issues.length > 0) {
    throw new Error(`канонические договоры не прошли проверку: ${issues.join("; ")}`);
  }
  if (matrix.context.contracts.journey.status !== "owner-approved-prototype") {
    throw new Error("генерация evidence остановлена: владелец ещё не подтвердил прототип");
  }
  return matrix;
}

export function buildAcceptanceReport({
  roots,
  activeEvidence,
  canonicalRasterManifest,
  candidateFingerprint,
  browserReport,
  playwrightVersion = PLAYWRIGHT_VERSION,
}) {
  const matrix = activeEvidence;
  const context = matrix.context;
  const contracts = context.contracts;
  const contractHash = (relative) => hashRecord(roots.contractPackageRoot, relative);
  const candidateHash = (relative) => hashRecord(roots.packageRoot, relative);
  const toolchainHash = (relative) => hashRecord(roots.toolchainRoot, relative);
  const restrictedSourceAssets = contracts.package.source_assets
    .filter((asset) => asset.license === "repository-license-not-found")
    .map((asset) => ({
      path: asset.path,
      origin_repository: asset.origin_repository,
      origin_commit: asset.origin_commit,
      license: asset.license,
      permission: asset.permission,
    }));
  return {
    version: EVIDENCE_REPORT_VERSION,
    status: "owner-approved-prototype",
    deterministic_epoch: FIXED_EPOCH,
    result: "conditional_pass_with_tooling_limitation",
    active_state_ids: [...context.activeStateIds],
    active_contract_ids: [...context.activeContractIds],
    active_contracts_sha256: context.activeContractsSha256,
    mvp_scope: "P1/P2",
    candidate_fingerprint: candidateFingerprint,
    renderer_profile: canonicalRasterManifest.manifest.renderer_profile,
    source_parity: canonicalRasterManifest.manifest.source_parity,
    canonical_raster_manifest: {
      path: canonicalRasterManifest.path,
      sha256: canonicalRasterManifest.sha256,
    },
    status_messages: [...context.statusMessages],
    timeline: {
      generation_started_at_ms: contracts.journey.prototype_timeline.generation_started_at_ms,
      clock_animation_ends_at_ms: contracts.journey.prototype_timeline.clock_animation_ends_at_ms,
      ready_at_ms: contracts.journey.prototype_timeline.ready_at_ms,
      direct_state_autoplay: contracts.journey.prototype_timeline.direct_state_autoplay,
    },
    state_count: context.activeStateIds.length,
    evidence_file_count: matrix.fileCount,
    canonical_webkit_png_count: matrix.canonicalPngCount,
    runtime_check_count: matrix.runtimeCount,
    documentation: DOCUMENTATION_PATHS.map(contractHash),
    evidence_toolchain: EVIDENCE_TOOLCHAIN_PATHS.map(toolchainHash),
    html_files: HTML_PATHS.map(candidateHash),
    canonical_contracts: context.activeContractPaths.map(contractHash),
    active_contract_registry: contractHash("source/active-contracts.json"),
    package_manifest: candidateHash("derived/prototype-package-manifest.json"),
    browser_report: {
      path: "evidence/browser-report.json",
      sha256: sha256File(path.join(roots.evidenceRoot, "browser-report.json")),
    },
    owner_approval: {
      journey_status: contracts.journey.status,
      active_registry_status: context.registry.status,
      playwright_substitution_confirmed: true,
    },
    donor_operations: { write_operations_performed: false },
    rights: {
      restricted_source_assets: restrictedSourceAssets,
      external_distribution_requires_separate_review: restrictedSourceAssets.length > 0,
    },
    tooling: {
      playwright: {
        used: true,
        version: playwrightVersion,
        runtime_checks_only: true,
      },
    },
    browser_report_runtime_result_count: browserReport.runtime_results.length,
    commands: {
      update: "npm run update:presentation-link-lisa-user-journey:evidence",
      validate: "npm run validate:presentation-link-lisa-user-journey:evidence",
      check: "npm run check:presentation-link-lisa-user-journey:evidence",
    },
  };
}

function copyCanonicalRastersToStaging({ roots, matrix, stagingRoot }) {
  for (const record of matrix.canonicalRecords) {
    const source = path.join(roots.packageRoot, record.path);
    const target = path.join(stagingRoot, record.path.slice("evidence/".length));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  }
}

function createRuntimeDiagnosticRunRoot({ toolchainRoot, supervision }) {
  const resolvedToolchainRoot = path.resolve(toolchainRoot);
  const relativeDiagnosticPath = supervision?.diagnostic_report?.path;
  if (
    typeof relativeDiagnosticPath !== "string" ||
    path.isAbsolute(relativeDiagnosticPath) ||
    relativeDiagnosticPath.split(/[\\/]/u).some((part) => part === ".." || part.length === 0)
  ) {
    throw new Error("runtime_capture_supervision содержит небезопасный путь диагностики");
  }
  const diagnosticRoot = path.resolve(resolvedToolchainRoot, relativeDiagnosticPath);
  if (!diagnosticRoot.startsWith(`${resolvedToolchainRoot}${path.sep}`)) {
    throw new Error("диагностика runtime browser-worker находится вне toolchainRoot");
  }
  fs.mkdirSync(diagnosticRoot, { recursive: true });
  const diagnosticRunRoot = path.join(diagnosticRoot, `run-${randomUUID()}`);
  fs.mkdirSync(diagnosticRunRoot, { recursive: false });
  return diagnosticRunRoot;
}

/**
 * Creates evidence only for an explicit non-active candidate. Unix-produced
 * WebKit PNGs must already exist and pass the three-run manifest check.
 */
export async function generateEvidence(options = {}) {
  const input = normalizedOptions(options);
  if (!input.packageRoot) {
    throw new Error("generateEvidence требует явный candidate packageRoot; активный пакет не подписывается");
  }
  const roots = resolveEvidenceRoots({
    ...input,
    requireCandidate: true,
    allowActivePackage: false,
  });
  const matrix = assertEvidenceContracts(roots.contractRoot);
  const canonicalRasterManifest = readCanonicalRasterManifest({ roots, matrix });
  const candidateFingerprint = buildCandidateFingerprint({
    roots,
    matrix,
    canonicalRasterManifest,
  });
  if (stableStringify(canonicalRasterManifest.manifest.candidate_fingerprint) !== stableStringify(candidateFingerprint)) {
    throw new Error("Unix canonical raster manifest не совпадает с candidate_fingerprint кандидата");
  }
  const stagingRoot = fs.mkdtempSync(path.join(roots.packageRoot, ".evidence-staging-"));
  const supervision = matrix.context.contracts.package.reproducibility.runtime_capture_supervision;
  const runRuntimeBrowserWorkerFn = options.runRuntimeBrowserWorkerFn ?? runRuntimeBrowserWorker;
  let diagnosticRunRoot = null;
  let evidencePublished = false;
  try {
    copyCanonicalRastersToStaging({ roots, matrix, stagingRoot });
    const demoPath = path.join(roots.packageRoot, "demo/index.html");
    const captureStabilization = matrix.context.contracts.package.reproducibility.capture_stabilization;
    const captures = {};
    diagnosticRunRoot = createRuntimeDiagnosticRunRoot({
      toolchainRoot: roots.toolchainRoot,
      supervision,
    });
    for (const browserName of supervision.browser_execution_order) {
      const capture = await runRuntimeBrowserWorkerFn({
        toolchainRoot: roots.toolchainRoot,
        packageRoot: roots.packageRoot,
        demoPath,
        browserName,
        runtimePlans: matrix.runtimeRecords.filter((record) => record.browser === browserName),
        runtimeViewports: EVIDENCE_VIEWPORTS.map((viewport) => ({
          id: viewport.id,
          width: viewport.width,
          height: viewport.height,
        })),
        captureStabilization,
        browserLaunchArgs: selectEvidenceBrowserLaunchArgs(captureStabilization, browserName),
        supervision,
        diagnosticRunRoot,
      });
      captures[browserName] = capture;
    }
    const chromiumCapture = captures.chromium;
    const webkitCapture = captures.webkit;
    const browserReport = buildBrowserReport({
      runtimeResults: [...chromiumCapture.runtimeResults, ...webkitCapture.runtimeResults],
      browserVersions: {
        chromium: chromiumCapture.browserVersion,
        webkit: webkitCapture.browserVersion,
      },
      browserLaunchArgsApplied: {
        chromium: chromiumCapture.browserLaunchArgs,
        webkit: webkitCapture.browserLaunchArgs,
      },
      captureStabilization,
      activeEvidence: matrix,
      canonicalRasterManifest,
      candidateFingerprint,
    });
    fs.writeFileSync(path.join(stagingRoot, "browser-report.json"), stableStringify(browserReport));
    const stagingRoots = resolveEvidenceRoots({
      toolchainRoot: roots.toolchainRoot,
      contractRoot: roots.contractRoot,
      packageRoot: roots.packageRoot,
      evidenceRoot: stagingRoot,
      requireCandidate: true,
    });
    const acceptanceReport = buildAcceptanceReport({
      roots: stagingRoots,
      activeEvidence: matrix,
      canonicalRasterManifest,
      candidateFingerprint,
      browserReport,
    });
    fs.writeFileSync(path.join(stagingRoot, "acceptance-report.json"), stableStringify(acceptanceReport));
    publishEvidenceAtomically({
      toolchainRoot: roots.toolchainRoot,
      contractRoot: roots.contractRoot,
      packageRoot: roots.packageRoot,
      evidenceRoot: roots.evidenceRoot,
      stagingRoot,
    });
    evidencePublished = true;
    return {
      fileCount: matrix.fileCount,
      screenshotCount: matrix.canonicalPngCount,
      runtimeCheckCount: matrix.runtimeCount,
      browserVersions: browserReport.runtime_profile,
    };
  } finally {
    if (fs.existsSync(stagingRoot)) fs.rmSync(stagingRoot, { recursive: true, force: true });
    if (evidencePublished && diagnosticRunRoot && fs.existsSync(diagnosticRunRoot)) {
      fs.rmSync(diagnosticRunRoot, { recursive: true, force: true });
    }
  }
}

/**
 * Freshness is now a read-only contract check. It never repeats a raster
 * capture, because repeatability belongs to Unix canonical generation.
 */
export async function checkEvidenceFreshness(options = {}) {
  const input = normalizedOptions(options);
  const roots = resolveEvidenceRoots({
    ...input,
    allowActivePackage: options.allowActivePackage ?? false,
    requireCandidate: options.requireCandidate ?? Boolean(input.packageRoot),
  });
  const issues = validateEvidencePackage({
    toolchainRoot: roots.toolchainRoot,
    contractRoot: roots.contractRoot,
    packageRoot: roots.packageRoot,
    evidenceRoot: roots.evidenceRoot,
    allowActivePackage: roots.isActivePackage,
    requireCandidate: !roots.isActivePackage,
  });
  if (issues.length > 0) throw new Error(`evidence-пакет не прошёл проверку:\n- ${issues.join("\n- ")}`);
  const matrix = buildEvidenceMatrix({ contractRoot: roots.contractRoot });
  return { fileCount: matrix.fileCount, screenshotCount: matrix.canonicalPngCount, runtimeCheckCount: matrix.runtimeCount };
}

function cliValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export async function main() {
  try {
    const packageRoot = cliValue("--package-root");
    const options = {
      toolchainRoot: cliValue("--toolchain-root") ?? ROOT,
      contractRoot: cliValue("--contract-root") ?? ROOT,
      packageRoot,
      evidenceRoot: cliValue("--evidence-root"),
    };
    if (process.argv.includes("--check")) {
      const result = await checkEvidenceFreshness({
        ...options,
        allowActivePackage: !packageRoot,
        requireCandidate: Boolean(packageRoot),
      });
      console.log(`presentation link Lisa evidence valid: ${result.fileCount} files, ${result.runtimeCheckCount} runtime checks`);
      return;
    }
    const result = await generateEvidence(options);
    console.log(`presentation link Lisa evidence written: ${result.fileCount} files, ${result.runtimeCheckCount} runtime checks`);
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : "evidence не создан"}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
