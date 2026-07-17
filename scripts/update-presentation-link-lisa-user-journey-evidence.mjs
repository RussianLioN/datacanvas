import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, webkit } from "@playwright/test";
import {
  BROWSER_SCREENSHOT_RENDERER,
  FIXED_EPOCH,
  PACKAGE_PATH,
  WEBKIT_EVIDENCE_STATE_IDS,
  loadContracts,
  sha256File,
  stabilizeBrowserCapture,
  stableStringify,
  validateContracts,
} from "./lib/presentation-link-lisa-user-journey.mjs";
import {
  EVIDENCE_VIEWPORTS,
  classifyExpectedToolingConsoleMessage,
  expectedEvidencePaths,
  publishEvidenceAtomically,
  validateEvidencePackage,
} from "./validate-presentation-link-lisa-user-journey-evidence.mjs";

const require = createRequire(import.meta.url);
const { version: PLAYWRIGHT_VERSION } = require("@playwright/test/package.json");
const ROOT = process.cwd();
const PACKAGE_ROOT = path.join(ROOT, PACKAGE_PATH);
const DEMO_PATH = path.join(PACKAGE_ROOT, "demo/index.html");
const MANIFEST_PATH = path.join(
  PACKAGE_ROOT,
  "derived/prototype-package-manifest.json",
);
const EVIDENCE_ROOT = path.join(PACKAGE_ROOT, "evidence");
const EVIDENCE_REPOSITORY_INPUTS = [
  "package.json",
  "package-lock.json",
  "scripts/capture-presentation-link-lisa-derived-frames.mjs",
  "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
  "scripts/validate-presentation-link-lisa-user-journey-evidence.mjs",
  "scripts/lib/presentation-link-lisa-html-runtime.mjs",
  "scripts/lib/presentation-link-lisa-user-journey.mjs",
  "tests/presentation-link-lisa-user-journey-evidence.test.mjs",
  "tests/presentation-link-lisa-user-journey.browser.spec.mjs",
  "tests/presentation-link-lisa-user-journey.playwright.config.mjs",
];

function walkFiles(directory, relativeDirectory = "") {
  const files = [];
  for (const entry of fs
    .readdirSync(path.join(directory, relativeDirectory), { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (relativeDirectory === "" && entry.name === "evidence") continue;
    if (entry.name.startsWith(".evidence-staging-")) continue;
    if (entry.isDirectory()) {
      files.push(...walkFiles(directory, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

export function snapshotEvidenceInputs({
  root = ROOT,
  packageRoot = path.join(root, PACKAGE_PATH),
} = {}) {
  const records = {};
  for (const relativePath of walkFiles(packageRoot)) {
    const repositoryPath = path
      .relative(root, path.join(packageRoot, relativePath))
      .split(path.sep)
      .join("/");
    records[repositoryPath] = sha256File(path.join(packageRoot, relativePath));
  }
  for (const relativePath of EVIDENCE_REPOSITORY_INPUTS) {
    const target = path.join(root, relativePath);
    if (!fs.existsSync(target)) {
      records[relativePath] = "missing";
      continue;
    }
    records[relativePath] = sha256File(target);
  }
  return records;
}

function compareEvidenceRoots(root, savedRoot, generatedRoot) {
  const differences = [];
  for (const evidencePath of expectedEvidencePaths(root)) {
    const relativePath = evidencePath.slice("evidence/".length);
    const savedPath = path.join(savedRoot, relativePath);
    const generatedPath = path.join(generatedRoot, relativePath);
    if (!fs.existsSync(savedPath) || !fs.existsSync(generatedPath)) {
      differences.push(evidencePath);
      continue;
    }
    if (sha256File(savedPath) !== sha256File(generatedPath)) {
      differences.push(evidencePath);
    }
  }
  return differences;
}

function readPngDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (
    bytes.length < 24 ||
    bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
  ) {
    throw new Error(`неверная сигнатура PNG: ${path.basename(filePath)}`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
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
    .replace(
      /file:\/\/\/(?:Users|home)\/[^\s"'<>)]*/gu,
      "[локальный-ресурс]",
    )
    .replace(/\/(?:Users|home)\/[^\s"'<>)]*/gu, "[локальный-ресурс]")
    .replace(
      /[A-Za-z]:\\(?:Users|Documents and Settings)\\[^\s"'<>)]*/gu,
      "[локальный-ресурс]",
    );
}

function relativeEvidencePath(filePath, evidenceRoot) {
  return `evidence/${path
    .relative(evidenceRoot, filePath)
    .split(path.sep)
    .join("/")}`;
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
    if (!["file:", "data:", "blob:", "about:"].includes(url.protocol)) {
      issues.push(`запрещён внешний протокол ресурса: ${url.protocol}`);
      continue;
    }
    if (url.protocol === "file:") {
      const resourcePath = path.resolve(fileURLToPath(url));
      if (
        resourcePath !== resolvedPackageRoot &&
        !resourcePath.startsWith(`${resolvedPackageRoot}${path.sep}`)
      ) {
        issues.push("локальный ресурс находится вне переносимого пакета");
      } else if (!fs.existsSync(resourcePath)) {
        issues.push("локальный ресурс отсутствует");
      }
    }
  }
  return issues;
}

async function collectGeometry(page) {
  return page.evaluate(() => {
    const phone = document.querySelector(".phone");
    if (!phone) {
      return { missingPhone: true };
    }
    const phoneRect = phone.getBoundingClientRect();
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const textNodes = [
      ...phone.querySelectorAll(
        ".message-card h2, .message-card h3, .message-card p, .message-card li, " +
          ".message-card span, .notification-card h3, .notification-card p, " +
          ".notification-card span, .notification-card time, .viewer-card h2, " +
          ".viewer-card p, .viewer-card li, .button",
      ),
    ].filter(visible);
    const textIssues = textNodes
      .filter(
        (node) =>
          node.scrollWidth > node.clientWidth + 1 ||
          node.scrollHeight > node.clientHeight + 1,
      )
      .map((node) => ({
        tag: node.tagName,
        text: node.textContent.trim().slice(0, 80),
      }));
    const actions = [...phone.querySelectorAll("button:not([disabled])")]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          id:
            element.getAttribute("data-action-id") ||
            element.getAttribute("aria-label") ||
            element.textContent.trim(),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          fullyInsidePhone:
            rect.left >= phoneRect.left - 1 &&
            rect.right <= phoneRect.right + 1 &&
            rect.top >= phoneRect.top - 1 &&
            rect.bottom <= phoneRect.bottom + 1,
        };
      });
    const actionIssues = [];
    for (const action of actions) {
      if (action.width < 44 || action.height < 44) {
        actionIssues.push(`${action.id}: область нажатия меньше 44 px`);
      }
      if (
        action.scrollWidth > action.clientWidth + 1 ||
        action.scrollHeight > action.clientHeight + 1
      ) {
        actionIssues.push(`${action.id}: содержимое области действия переполнено`);
      }
      if (!action.fullyInsidePhone) {
        actionIssues.push(`${action.id}: область действия выходит за телефон`);
      }
    }
    for (const group of phone.querySelectorAll(".actions")) {
      const groupActions = [...group.querySelectorAll(":scope > button")]
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            id: element.getAttribute("data-action-id") || element.textContent.trim(),
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
          };
        });
      for (let leftIndex = 0; leftIndex < groupActions.length; leftIndex += 1) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < groupActions.length;
          rightIndex += 1
        ) {
          const left = groupActions[leftIndex];
          const right = groupActions[rightIndex];
          const overlapWidth =
            Math.min(left.right, right.right) - Math.max(left.left, right.left);
          const overlapHeight =
            Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
          if (overlapWidth > 1 && overlapHeight > 1) {
            actionIssues.push(`${left.id} пересекается с ${right.id}`);
            continue;
          }
          const horizontalGap = Math.max(
            right.left - left.right,
            left.left - right.right,
            0,
          );
          const verticalGap = Math.max(
            right.top - left.bottom,
            left.top - right.bottom,
            0,
          );
          const gap = Math.max(horizontalGap, verticalGap);
          if (gap > 0 && gap < 8) {
            actionIssues.push(
              `${left.id} и ${right.id}: интервал меньше 8 px`,
            );
          }
        }
      }
    }
    return {
      missingPhone: false,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentScrollHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      phone: {
        left: phoneRect.left,
        right: phoneRect.right,
        top: phoneRect.top,
        bottom: phoneRect.bottom,
        width: phoneRect.width,
        height: phoneRect.height,
      },
      phoneInsideViewport:
        phoneRect.left >= -1 &&
        phoneRect.right <= window.innerWidth + 1 &&
        phoneRect.top >= -1 &&
        phoneRect.bottom <= window.innerHeight + 1,
      textIssues,
      actionCount: actions.length,
      actionIssues,
      resourceUrls: [
        ...new Set([
          ...[...document.querySelectorAll("[src], [href]")].map(
            (element) => element.src || element.href,
          ),
          ...performance.getEntriesByType("resource").map((entry) => entry.name),
        ]),
      ],
    };
  });
}

function compactAxeViolations(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    node_count: violation.nodes.length,
  }));
}

export async function installNetworkGuards(page, attemptedNetwork) {
  const recordAttempt = (rawUrl) => {
    if (isExternalNetworkUrl(rawUrl)) attemptedNetwork.add(rawUrl);
  };
  page.on("request", (request) => recordAttempt(request.url()));
  await page.route(/^(?:https?|wss?):/u, async (route) => {
    recordAttempt(route.request().url());
    await route.abort("blockedbyclient");
  });
  if (typeof page.routeWebSocket === "function") {
    await page.routeWebSocket(/^(?:ws|wss):/u, (webSocket) => {
      const rawUrl = webSocket.url();
      if (isExternalNetworkUrl(rawUrl)) {
        attemptedNetwork.add(rawUrl);
        webSocket.close({
          code: 1008,
          reason: "Внешняя сеть запрещена",
        });
      }
    });
  }
}

async function captureBrowser({
  browserType,
  browserName,
  states,
  stagingRoot,
  packageRoot,
  demoPath,
  captureStabilization,
}) {
  const browser = await browserType.launch({
    headless: true,
    args: captureStabilization.browser_launch_args,
  });
  const browserVersion = browser.version();
  const records = [];
  try {
    for (const viewport of EVIDENCE_VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        locale: "ru-RU",
        timezoneId: "UTC",
        colorScheme: "light",
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      try {
        for (const state of states) {
          const page = await context.newPage();
          const attemptedNetwork = new Set();
          const consoleErrors = [];
          const pageErrors = [];
          page.on("console", (message) => {
            if (message.type() === "error") consoleErrors.push(message.text());
          });
          page.on("pageerror", (error) => pageErrors.push(error.message));
          await installNetworkGuards(page, attemptedNetwork);
          await page.addInitScript(() => {
            Date.now = () => 1784150400000;
            window.__DATACANVAS_LISA_CAPTURE__ = true;
          });
          try {
            const url = pathToFileURL(demoPath);
            url.searchParams.set("state", state.id);
            await page.goto(url.href, { waitUntil: "load" });
            const phone = page.locator(".phone");
            await phone.waitFor();
            await stabilizeBrowserCapture(page, captureStabilization);
            const renderedStateId = await phone.getAttribute("data-state-id");
            if (renderedStateId !== state.id) {
              throw new Error(
                `${state.id}: отрисовано другое состояние ${renderedStateId}`,
              );
            }

            const geometry = await collectGeometry(page);
            const resourceIssues = inspectResourceUrls(
              geometry.resourceUrls ?? [],
              packageRoot,
            );
            const screenshotPath = path.join(
              stagingRoot,
              "screenshots",
              browserName,
              viewport.id,
              `${state.id}.png`,
            );
            fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
            await phone.screenshot({
              path: screenshotPath,
              animations: "disabled",
              caret: "hide",
              scale: "css",
            });
            const axe = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
              .analyze();
            const toolingConsoleMessages = consoleErrors.flatMap((message) => {
              const classification =
                classifyExpectedToolingConsoleMessage(message);
              return classification
                ? [
                    {
                      classification,
                      message: sanitizeDiagnostic(message),
                    },
                  ]
                : [];
            });
            const relevantConsoleErrors = consoleErrors
              .filter(
                (message) =>
                  classifyExpectedToolingConsoleMessage(message) === null,
              )
              .map(sanitizeDiagnostic);
            const sanitizedPageErrors = pageErrors.map(sanitizeDiagnostic);
            const networkAttempts = [...attemptedNetwork].sort((left, right) =>
              left.localeCompare(right, "en"),
            );
            const axeViolations = compactAxeViolations(axe.violations);
            const dimensions = readPngDimensions(screenshotPath);
            const geometryPassed =
              !geometry.missingPhone &&
              geometry.documentScrollWidth <= geometry.viewportWidth + 1 &&
              geometry.documentScrollHeight <= geometry.viewportHeight + 1 &&
              geometry.phoneInsideViewport === true;
            records.push({
              browser: browserName,
              browser_version: browserVersion,
              viewport: viewport.id,
              viewport_dimensions: {
                width: viewport.width,
                height: viewport.height,
              },
              state_id: state.id,
              path: relativeEvidencePath(screenshotPath, stagingRoot),
              bytes: fs.statSync(screenshotPath).size,
              sha256: sha256File(screenshotPath),
              png_dimensions: dimensions,
              checks: {
                geometry: {
                  passed: geometryPassed,
                  document_scroll_width:
                    geometry.documentScrollWidth ?? Number.MAX_SAFE_INTEGER,
                  document_scroll_height:
                    geometry.documentScrollHeight ?? Number.MAX_SAFE_INTEGER,
                  viewport_width:
                    geometry.viewportWidth ?? viewport.width,
                  viewport_height:
                    geometry.viewportHeight ?? viewport.height,
                  phone_inside_viewport:
                    geometry.phoneInsideViewport === true,
                  phone_width: geometry.phone?.width ?? 0,
                  phone_height: geometry.phone?.height ?? 0,
                },
                overflow: {
                  passed: (geometry.textIssues?.length ?? 1) === 0,
                  text_issue_count: geometry.textIssues?.length ?? 1,
                  issues: geometry.textIssues ?? [
                    { text: "Не удалось измерить текст" },
                  ],
                },
                actions: {
                  passed: (geometry.actionIssues?.length ?? 1) === 0,
                  action_count: geometry.actionCount ?? 0,
                  issue_count: geometry.actionIssues?.length ?? 1,
                  issues: geometry.actionIssues ?? [
                    "Не удалось измерить области действий",
                  ],
                },
                accessibility: {
                  passed: axeViolations.length === 0,
                  axe_violation_count: axeViolations.length,
                  axe_violations: axeViolations,
                },
                resources: {
                  passed: resourceIssues.length === 0,
                  issue_count: resourceIssues.length,
                  issues: resourceIssues,
                },
                tooling_console_messages: toolingConsoleMessages,
                console_errors: relevantConsoleErrors,
                page_errors: sanitizedPageErrors,
                network_attempts: networkAttempts,
              },
            });
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
  return { browserVersion, records };
}

function sumRecords(records, selector) {
  return records.reduce((total, record) => total + selector(record), 0);
}

export function buildBrowserReport({
  records,
  browserVersions,
  captureStabilization,
  playwrightVersion = PLAYWRIGHT_VERSION,
}) {
  return {
    version: "2.1.0",
    status: "generated",
    deterministic_epoch: FIXED_EPOCH,
    playwright_version: playwrightVersion,
    browser_versions: browserVersions,
    capture_stabilization: captureStabilization,
    renderer: BROWSER_SCREENSHOT_RENDERER,
    viewports: EVIDENCE_VIEWPORTS,
    screenshot_count: records.length,
    screenshots: records,
    totals: {
      chromium_screenshots: records.filter(
        (record) => record.browser === "chromium",
      ).length,
      webkit_screenshots: records.filter(
        (record) => record.browser === "webkit",
      ).length,
      console_errors: sumRecords(
        records,
        (record) => record.checks.console_errors.length,
      ),
      tooling_console_messages: sumRecords(
        records,
        (record) => record.checks.tooling_console_messages.length,
      ),
      page_errors: sumRecords(
        records,
        (record) => record.checks.page_errors.length,
      ),
      network_attempts: sumRecords(
        records,
        (record) => record.checks.network_attempts.length,
      ),
      geometry_failures: sumRecords(
        records,
        (record) => (record.checks.geometry.passed ? 0 : 1),
      ),
      overflow_failures: sumRecords(
        records,
        (record) => (record.checks.overflow.passed ? 0 : 1),
      ),
      action_failures: sumRecords(
        records,
        (record) => (record.checks.actions.passed ? 0 : 1),
      ),
      axe_violations: sumRecords(
        records,
        (record) => record.checks.accessibility.axe_violation_count,
      ),
    },
    network_policy: {
      external_protocols: ["http", "https", "ws", "wss"],
      blocked_before_send: true,
      publication_requires_zero_attempts: true,
    },
  };
}

export function assertEvidenceContracts(root, contracts) {
  const issues = validateContracts(root, contracts);
  if (issues.length > 0) {
    throw new Error(
      `канонические договоры не прошли проверку: ${issues.join("; ")}`,
    );
  }
  if (
    contracts.journey.status !== "owner-approved-prototype" ||
    contracts.preview.status !== "owner-approved-prototype"
  ) {
    throw new Error(
      "генерация evidence остановлена: владелец ещё не подтвердил прототип",
    );
  }
}

export function buildAcceptanceReport({
  root = process.cwd(),
  evidenceRoot = path.join(root, PACKAGE_PATH, "evidence"),
  playwrightVersion = PLAYWRIGHT_VERSION,
}) {
  const contracts = loadContracts(root);
  if (
    contracts.journey.status !== "owner-approved-prototype" ||
    contracts.preview.status !== "owner-approved-prototype"
  ) {
    throw new Error(
      "evidence разрешён только для подтверждённого владельцем прототипа",
    );
  }
  const packageRoot = path.join(root, PACKAGE_PATH);
  const hashRecord = (relativePath) => ({
    path: relativePath,
    sha256: sha256File(path.join(packageRoot, relativePath)),
  });
  const repositoryHashRecord = (relativePath) => ({
    path: relativePath,
    sha256: sha256File(path.join(root, relativePath)),
  });
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
    version: "2.2.0",
    status: "owner-approved-prototype",
    deterministic_epoch: FIXED_EPOCH,
    result: "conditional_pass_with_tooling_limitation",
    state_count: contracts.journey.states.length,
    evidence_file_count: 110,
    documentation: [
      "README.md",
      "donor-options.md",
      "user-journey.md",
    ].map(hashRecord),
    evidence_toolchain: [
      "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
      "scripts/validate-presentation-link-lisa-user-journey-evidence.mjs",
      "tests/presentation-link-lisa-user-journey-evidence.test.mjs",
      "tests/presentation-link-lisa-user-journey.browser.spec.mjs",
      "tests/presentation-link-lisa-user-journey.playwright.config.mjs",
    ].map(repositoryHashRecord),
    html_files: [
      "demo/index.html",
      "demo/app.js",
      "demo/styles.css",
      "demo/data.js",
    ].map(hashRecord),
    canonical_contracts: contracts.package.canonical_contracts.map(hashRecord),
    package_manifest: hashRecord("derived/prototype-package-manifest.json"),
    browser_report: {
      path: "evidence/browser-report.json",
      sha256: sha256File(path.join(evidenceRoot, "browser-report.json")),
    },
    owner_approval: {
      journey_status: contracts.journey.status,
      presentation_preview_status: contracts.preview.status,
      playwright_substitution_confirmed: true,
    },
    donor_operations: {
      write_operations_performed: false,
    },
    rights: {
      restricted_source_assets: restrictedSourceAssets,
      external_distribution_requires_separate_review:
        restrictedSourceAssets.length > 0,
    },
    tooling: {
      chrome_devtools_mcp: {
        generator_integration: false,
        availability_assessed: false,
        limitation:
          "Генератор evidence использует Playwright и не оценивает доступность Chrome DevTools MCP в сеансе; ручная проверка фиксируется отдельно.",
      },
      playwright: {
        used: true,
        version: playwrightVersion,
        owner_approved_substitution: true,
      },
    },
    commands: {
      update:
        "npm run update:presentation-link-lisa-user-journey:evidence",
      validate:
        "npm run validate:presentation-link-lisa-user-journey:evidence",
      check:
        "npm run check:presentation-link-lisa-user-journey:evidence",
    },
  };
}

export async function generateEvidence({
  root = ROOT,
  packageRoot = path.join(root, PACKAGE_PATH),
  evidenceRoot = path.join(root, PACKAGE_PATH, "evidence"),
} = {}) {
  const contracts = loadContracts(root);
  assertEvidenceContracts(root, contracts);
  const demoPath = path.join(packageRoot, "demo/index.html");
  const manifestPath = path.join(
    packageRoot,
    "derived/prototype-package-manifest.json",
  );
  for (const requiredPath of [demoPath, manifestPath]) {
    if (!fs.existsSync(requiredPath)) {
      throw new Error(`обязательный вход отсутствует: ${path.basename(requiredPath)}`);
    }
  }
  const stagingRoot = path.join(
    path.dirname(evidenceRoot),
    `.evidence-staging-${process.pid}`,
  );
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  fs.mkdirSync(stagingRoot, { recursive: true });
  try {
    const chromiumCapture = await captureBrowser({
      browserType: chromium,
      browserName: "chromium",
      states: contracts.journey.states,
      stagingRoot,
      packageRoot,
      demoPath,
      captureStabilization:
        contracts.package.reproducibility.capture_stabilization,
    });
    const criticalStateIds = new Set(WEBKIT_EVIDENCE_STATE_IDS);
    const webkitCapture = await captureBrowser({
      browserType: webkit,
      browserName: "webkit",
      states: contracts.journey.states.filter((state) =>
        criticalStateIds.has(state.id),
      ),
      stagingRoot,
      packageRoot,
      demoPath,
      captureStabilization:
        contracts.package.reproducibility.capture_stabilization,
    });
    const records = [...chromiumCapture.records, ...webkitCapture.records];
    const browserReport = buildBrowserReport({
      records,
      browserVersions: {
        chromium: chromiumCapture.browserVersion,
        webkit: webkitCapture.browserVersion,
      },
      captureStabilization:
        contracts.package.reproducibility.capture_stabilization,
    });
    fs.writeFileSync(
      path.join(stagingRoot, "browser-report.json"),
      stableStringify(browserReport),
    );
    const acceptanceReport = buildAcceptanceReport({
      root,
      evidenceRoot: stagingRoot,
    });
    fs.writeFileSync(
      path.join(stagingRoot, "acceptance-report.json"),
      stableStringify(acceptanceReport),
    );
    publishEvidenceAtomically(root, { stagingRoot, targetRoot: evidenceRoot });
    return {
      fileCount: 110,
      screenshotCount: records.length,
      browserVersions: browserReport.browser_versions,
    };
  } finally {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
  }
}

export async function checkEvidenceFreshness({
  root = ROOT,
  packageRoot = path.join(root, PACKAGE_PATH),
  evidenceRoot = path.join(root, PACKAGE_PATH, "evidence"),
  createTemporaryRoot = () =>
    fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-evidence-check-")),
  generateEvidenceFn = generateEvidence,
  validateEvidenceFn = validateEvidencePackage,
  snapshotInputsFn = snapshotEvidenceInputs,
} = {}) {
  const savedIssues = validateEvidenceFn(root, { evidenceRoot });
  if (savedIssues.length > 0) {
    throw new Error(
      `сохранённый evidence-пакет не прошёл быструю проверку:\n- ${savedIssues.join("\n- ")}`,
    );
  }

  const inputsBefore = snapshotInputsFn({ root, packageRoot });
  const temporaryRoot = createTemporaryRoot();
  const generatedEvidenceRoot = path.join(temporaryRoot, "evidence");
  const startedAt = Date.now();
  try {
    const generation = await generateEvidenceFn({
      root,
      packageRoot,
      evidenceRoot: generatedEvidenceRoot,
    });
    const inputsAfter = snapshotInputsFn({ root, packageRoot });
    if (stableStringify(inputsBefore) !== stableStringify(inputsAfter)) {
      throw new Error(
        "входы evidence изменились во время повторной съёмки; результат проверки недействителен",
      );
    }

    const generatedIssues = validateEvidenceFn(root, {
      evidenceRoot: generatedEvidenceRoot,
    });
    if (generatedIssues.length > 0) {
      throw new Error(
        `повторно созданный evidence-пакет не прошёл проверку:\n- ${generatedIssues.join("\n- ")}`,
      );
    }

    const differences = compareEvidenceRoots(
      root,
      evidenceRoot,
      generatedEvidenceRoot,
    );
    if (differences.length > 0) {
      const shown = differences.slice(0, 10);
      const remainder = differences.length - shown.length;
      throw new Error(
        `evidence-пакет не воспроизводится (${differences.length} отличий):\n- ` +
          shown.join("\n- ") +
          (remainder > 0 ? `\n- и ещё ${remainder}` : ""),
      );
    }

    return {
      fileCount: generation.fileCount,
      screenshotCount: generation.screenshotCount,
      browserVersions: generation.browserVersions,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

export async function main() {
  try {
    if (process.argv.includes("--check")) {
      const result = await checkEvidenceFreshness();
      console.log(
        `presentation link Lisa evidence is fresh: ${result.fileCount} files, ` +
          `${result.screenshotCount} screenshots, ${result.durationMs} ms`,
      );
      return;
    }
    const result = await generateEvidence();
    console.log(
      `presentation link Lisa evidence written: ${result.fileCount} files, ` +
        `${result.screenshotCount} screenshots`,
    );
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
