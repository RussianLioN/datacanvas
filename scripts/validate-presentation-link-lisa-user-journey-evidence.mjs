import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  BROWSER_SCREENSHOT_RENDERER,
  FIXED_EPOCH,
  PACKAGE_PATH,
  WEBKIT_EVIDENCE_STATE_IDS,
  loadContracts,
  sha256File,
} from "./lib/presentation-link-lisa-user-journey.mjs";

export const EVIDENCE_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "desktop-1280x720", width: 1280, height: 720 }),
  Object.freeze({ id: "mobile-390x844", width: 390, height: 844 }),
  Object.freeze({ id: "stress-320x568", width: 320, height: 568 }),
]);

const REPORT_PATHS = [
  "evidence/acceptance-report.json",
  "evidence/browser-report.json",
];
const HTML_PATHS = [
  "demo/index.html",
  "demo/app.js",
  "demo/styles.css",
  "demo/data.js",
];
const DOCUMENTATION_PATHS = [
  "README.md",
  "donor-options.md",
  "user-journey.md",
];
const EVIDENCE_TOOLCHAIN_PATHS = [
  "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
  "scripts/validate-presentation-link-lisa-user-journey-evidence.mjs",
  "tests/presentation-link-lisa-user-journey-evidence.test.mjs",
  "tests/presentation-link-lisa-user-journey.browser.spec.mjs",
  "tests/presentation-link-lisa-user-journey.playwright.config.mjs",
];
const SAFE_SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const LOCAL_PATH_PATTERNS = [
  /\/Users\//u,
  /\/home\/[^/\s"]+\//u,
  /file:\/\/\/(?:Users|home)\//u,
  /[A-Za-z]:\\(?:Users|Documents and Settings)\\/u,
];

export function classifyExpectedToolingConsoleMessage(message) {
  if (
    message.includes("connect-src") &&
    message.includes("styles.css") &&
    (message.includes("violates") || message.includes("Refused to connect"))
  ) {
    return "axe-stylesheet-connect-src";
  }
  if (
    message ===
    "Refused to apply a stylesheet because its hash, its nonce, or " +
      "'unsafe-inline' does not appear in the style-src directive of the " +
      "Content Security Policy."
  ) {
    return "playwright-webkit-screenshot-inline-style";
  }
  return null;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function canonicalJson(value) {
  const normalize = (item) => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === "object") {
      return Object.fromEntries(
        Object.keys(item)
          .sort((left, right) => left.localeCompare(right, "en"))
          .map((key) => [key, normalize(item[key])]),
      );
    }
    return item;
  };
  return JSON.stringify(normalize(value));
}

function evidenceFilePath(evidenceRoot, evidenceRelativePath) {
  return path.join(evidenceRoot, evidenceRelativePath.slice("evidence/".length));
}

function readPngDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (
    bytes.length < 24 ||
    bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
  ) {
    throw new Error("неверная сигнатура PNG");
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function readJsonReport(filePath, label, issues) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    issues.push(`${label} повреждён: ${error.message}`);
    return null;
  }
}

function collectEvidenceEntries(evidenceRoot, issues) {
  const entries = [];
  if (!fs.existsSync(evidenceRoot)) {
    issues.push("каталог evidence отсутствует");
    return entries;
  }
  const walk = (directory) => {
    for (const name of fs.readdirSync(directory).sort((left, right) =>
      left.localeCompare(right, "en"),
    )) {
      const target = path.join(directory, name);
      const metadata = fs.lstatSync(target);
      const relative = toPosix(path.relative(evidenceRoot, target));
      if (metadata.isSymbolicLink()) {
        issues.push(`символическая ссылка запрещена: evidence/${relative}`);
      } else if (metadata.isDirectory()) {
        walk(target);
      } else if (metadata.isFile()) {
        entries.push(`evidence/${relative}`);
      } else {
        issues.push(`неподдерживаемый тип evidence-файла: evidence/${relative}`);
      }
    }
  };
  walk(evidenceRoot);
  return entries;
}

function isSafeEvidencePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\\")) {
    return false;
  }
  if (path.posix.isAbsolute(value) || value.split("/").includes("..")) {
    return false;
  }
  return path.posix.normalize(value) === value && value.startsWith("evidence/");
}

function validateNoLocalPaths(filePath, label, issues) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  if (LOCAL_PATH_PATTERNS.some((pattern) => pattern.test(text))) {
    issues.push(`${label} содержит локальный абсолютный путь`);
  }
}

function validateHashRecord(record, target, label, issues) {
  if (!SAFE_SHA256_PATTERN.test(record?.sha256 ?? "")) {
    issues.push(`${label}: отсутствует корректный SHA-256`);
    return;
  }
  if (!fs.existsSync(target)) {
    return;
  }
  const actual = sha256File(target);
  if (actual !== record.sha256) {
    issues.push(`${label}: не совпадает SHA-256`);
  }
}

export function expectedEvidencePaths(root = process.cwd()) {
  const contracts = loadContracts(root);
  const allStateIds = contracts.journey.states.map((state) => state.id);
  const stateIdSet = new Set(allStateIds);
  if (
    WEBKIT_EVIDENCE_STATE_IDS.length !== 10 ||
    new Set(WEBKIT_EVIDENCE_STATE_IDS).size !== 10 ||
    WEBKIT_EVIDENCE_STATE_IDS.some((stateId) => !stateIdSet.has(stateId))
  ) {
    throw new Error(
      "список критических состояний WebKit должен содержать 10 известных состояний",
    );
  }
  const paths = [...REPORT_PATHS];
  for (const viewport of EVIDENCE_VIEWPORTS) {
    for (const stateId of allStateIds) {
      paths.push(
        `evidence/screenshots/chromium/${viewport.id}/${stateId}.png`,
      );
    }
  }
  for (const viewport of EVIDENCE_VIEWPORTS) {
    for (const stateId of WEBKIT_EVIDENCE_STATE_IDS) {
      paths.push(`evidence/screenshots/webkit/${viewport.id}/${stateId}.png`);
    }
  }
  return paths;
}

function validateScreenshotRecord(
  record,
  {
    allowedPaths,
    expectedRecordKeys,
    evidenceRoot,
    browserVersions,
    stateIds,
    criticalStateIds,
    viewportById,
    issues,
  },
) {
  const label = `снимок ${record?.path ?? "(без пути)"}`;
  if (!isSafeEvidencePath(record?.path)) {
    issues.push(`${label}: небезопасный путь`);
    return null;
  }
  if (!allowedPaths.has(record.path)) {
    issues.push(`${label}: неожиданный путь снимка`);
  }
  const browser = record.browser;
  const viewport = viewportById.get(record.viewport);
  if (!["chromium", "webkit"].includes(browser)) {
    issues.push(`${label}: неизвестный браузер`);
  }
  if (!viewport) {
    issues.push(`${label}: неизвестный размер окна`);
  }
  if (!stateIds.has(record.state_id)) {
    issues.push(`${label}: неизвестное состояние`);
  }
  if (browser === "webkit" && !criticalStateIds.has(record.state_id)) {
    issues.push(`${label}: WebKit содержит состояние вне критического списка`);
  }
  const expectedPath =
    browser && viewport && record.state_id
      ? `evidence/screenshots/${browser}/${record.viewport}/${record.state_id}.png`
      : null;
  if (expectedPath && expectedPath !== record.path) {
    issues.push(`${label}: путь не соответствует браузеру, размеру окна и состоянию`);
  }
  const recordKey = `${browser}/${record.viewport}/${record.state_id}`;
  if (expectedRecordKeys.has(recordKey)) {
    issues.push(`${label}: повторная запись снимка`);
  }
  expectedRecordKeys.add(recordKey);
  if (
    typeof record.browser_version !== "string" ||
    record.browser_version.length === 0 ||
    record.browser_version !== browserVersions?.[browser]
  ) {
    issues.push(`${label}: версия браузера не согласована с отчётом`);
  }
  if (
    !viewport ||
    record.viewport_dimensions?.width !== viewport.width ||
    record.viewport_dimensions?.height !== viewport.height
  ) {
    issues.push(`${label}: размеры окна не согласованы с договором`);
  }

  const target = evidenceFilePath(evidenceRoot, record.path);
  validateHashRecord(record, target, label, issues);
  if (fs.existsSync(target)) {
    if (record.bytes !== fs.statSync(target).size) {
      issues.push(`${label}: размер файла в байтах не совпадает`);
    }
    try {
      const dimensions = readPngDimensions(target);
      if (
        dimensions.width !== record.png_dimensions?.width ||
        dimensions.height !== record.png_dimensions?.height ||
        dimensions.width < 1 ||
        dimensions.height < 1
      ) {
        issues.push(`${label}: размеры PNG не совпадают`);
      }
    } catch (error) {
      issues.push(`${label}: ${error.message}`);
    }
  }

  const checks = record.checks ?? {};
  if (checks.geometry?.passed !== true) {
    issues.push(`${label}: проверка геометрии не пройдена`);
  }
  if (
    checks.geometry?.phone_inside_viewport !== true ||
    !Number.isFinite(checks.geometry?.document_scroll_width) ||
    !Number.isFinite(checks.geometry?.viewport_width) ||
    !Number.isFinite(checks.geometry?.document_scroll_height) ||
    !Number.isFinite(checks.geometry?.viewport_height) ||
    checks.geometry?.document_scroll_width >
      checks.geometry?.viewport_width + 1 ||
    checks.geometry?.document_scroll_height >
      checks.geometry?.viewport_height + 1
  ) {
    issues.push(`${label}: геометрия выходит за границы окна`);
  }
  if (
    checks.geometry?.viewport_width !== record.viewport_dimensions?.width ||
    checks.geometry?.viewport_height !== record.viewport_dimensions?.height
  ) {
    issues.push(`${label}: размер окна не совпадает с договором`);
  }
  if (
    checks.overflow?.passed !== true ||
    checks.overflow?.text_issue_count !== 0
  ) {
    issues.push(`${label}: обнаружено переполнение текста`);
  }
  if (
    checks.actions?.passed !== true ||
    checks.actions?.issue_count !== 0 ||
    !Number.isInteger(checks.actions?.action_count) ||
    checks.actions.action_count < 0
  ) {
    issues.push(`${label}: обнаружены ошибки областей действий`);
  }
  if (
    checks.accessibility?.passed !== true ||
    checks.accessibility?.axe_violation_count !== 0 ||
    !Array.isArray(checks.accessibility?.axe_violations) ||
    checks.accessibility.axe_violations.length !== 0
  ) {
    issues.push(`${label}: обнаружены нарушения доступности axe`);
  }
  if (
    checks.resources?.passed !== true ||
    checks.resources?.issue_count !== 0 ||
    !Array.isArray(checks.resources?.issues) ||
    checks.resources.issues.length !== 0
  ) {
    issues.push(`${label}: обнаружен отсутствующий или внешний ресурс`);
  }
  if (!Array.isArray(checks.tooling_console_messages)) {
    issues.push(
      `${label}: поле tooling_console_messages должно быть массивом`,
    );
  } else {
    for (const item of checks.tooling_console_messages) {
      const validAxeMessage =
        item?.classification === "axe-stylesheet-connect-src" &&
        typeof item.message === "string" &&
        item.message.includes("connect-src") &&
        item.message.includes("[локальный-ресурс]");
      const validScreenshotMessage =
        item?.classification ===
          "playwright-webkit-screenshot-inline-style" &&
        item.message ===
          "Refused to apply a stylesheet because its hash, its nonce, or " +
            "'unsafe-inline' does not appear in the style-src directive of the " +
            "Content Security Policy.";
      if (!validAxeMessage && !validScreenshotMessage) {
        issues.push(
          `${label}: обнаружено неклассифицированное предупреждение инструмента`,
        );
      }
    }
  }
  for (const field of ["console_errors", "page_errors", "network_attempts"]) {
    if (!Array.isArray(checks[field]) || checks[field].length !== 0) {
      issues.push(`${label}: поле ${field} должно быть пустым массивом`);
    }
  }
  return {
    browser,
    toolingConsoleMessages: checks.tooling_console_messages?.length ?? 0,
    consoleErrors: checks.console_errors?.length ?? 0,
    pageErrors: checks.page_errors?.length ?? 0,
    networkAttempts: checks.network_attempts?.length ?? 0,
    geometryFailures: checks.geometry?.passed === true ? 0 : 1,
    overflowFailures: checks.overflow?.passed === true ? 0 : 1,
    actionFailures: checks.actions?.passed === true ? 0 : 1,
    axeViolations: checks.accessibility?.axe_violation_count ?? 0,
  };
}

function validateBrowserReport(root, evidenceRoot, report, issues) {
  if (!report) return;
  const contracts = loadContracts(root);
  const stateIds = new Set(contracts.journey.states.map((state) => state.id));
  const criticalStateIds = new Set(WEBKIT_EVIDENCE_STATE_IDS);
  const expectedScreenshots = expectedEvidencePaths(root).filter((item) =>
    item.endsWith(".png"),
  );
  const allowedPaths = new Set(expectedScreenshots);
  const viewportById = new Map(
    EVIDENCE_VIEWPORTS.map((viewport) => [viewport.id, viewport]),
  );
  if (
    report.version !== "2.1.0" ||
    report.status !== "generated" ||
    report.deterministic_epoch !== FIXED_EPOCH
  ) {
    issues.push("browser-report.json содержит неверную версию, статус или эпоху");
  }
  if (
    report.playwright_version !==
    contracts.package.dependencies["@playwright/test"]
  ) {
    issues.push(
      "browser-report.json: версия Playwright не соответствует договору",
    );
  }
  for (const browser of ["chromium", "webkit"]) {
    if (
      typeof report.browser_versions?.[browser] !== "string" ||
      report.browser_versions[browser].length === 0
    ) {
      issues.push(`browser-report.json не содержит версию ${browser}`);
    }
  }
  if (
    canonicalJson(report.capture_stabilization) !==
    canonicalJson(contracts.package.reproducibility.capture_stabilization)
  ) {
    issues.push(
      "browser-report.json содержит неверную политику стабилизации кадров",
    );
  }
  if (report.renderer !== BROWSER_SCREENSHOT_RENDERER) {
    issues.push("browser-report.json содержит неверный способ создания снимков браузера");
  }
  if (canonicalJson(report.viewports) !== canonicalJson(EVIDENCE_VIEWPORTS)) {
    issues.push("browser-report.json содержит неверный набор размеров окна");
  }
  if (!Array.isArray(report.screenshots)) {
    issues.push("browser-report.json не содержит массив screenshots");
    return;
  }
  if (
    report.screenshot_count !== 108 ||
    report.screenshot_count !== report.screenshots.length
  ) {
    issues.push("browser-report.json должен описывать ровно 108 снимков");
  }

  const seenKeys = new Set();
  const totals = {
    chromium_screenshots: 0,
    webkit_screenshots: 0,
    tooling_console_messages: 0,
    console_errors: 0,
    page_errors: 0,
    network_attempts: 0,
    geometry_failures: 0,
    overflow_failures: 0,
    action_failures: 0,
    axe_violations: 0,
  };
  for (const record of report.screenshots) {
    const result = validateScreenshotRecord(record, {
      allowedPaths,
      expectedRecordKeys: seenKeys,
      evidenceRoot,
      browserVersions: report.browser_versions,
      stateIds,
      criticalStateIds,
      viewportById,
      issues,
    });
    if (!result) continue;
    if (result.browser === "chromium") totals.chromium_screenshots += 1;
    if (result.browser === "webkit") totals.webkit_screenshots += 1;
    totals.tooling_console_messages += result.toolingConsoleMessages;
    totals.console_errors += result.consoleErrors;
    totals.page_errors += result.pageErrors;
    totals.network_attempts += result.networkAttempts;
    totals.geometry_failures += result.geometryFailures;
    totals.overflow_failures += result.overflowFailures;
    totals.action_failures += result.actionFailures;
    totals.axe_violations += result.axeViolations;
  }
  const recordedPaths = new Set(report.screenshots.map((record) => record?.path));
  for (const expectedPath of expectedScreenshots) {
    if (!recordedPaths.has(expectedPath)) {
      issues.push(`browser-report.json не описывает снимок: ${expectedPath}`);
    }
  }
  if (canonicalJson(report.totals) !== canonicalJson(totals)) {
    issues.push("browser-report.json содержит неверные итоговые показатели");
  }
  if (
    totals.chromium_screenshots !== 78 ||
    totals.webkit_screenshots !== 30 ||
    totals.console_errors !== 0 ||
    totals.page_errors !== 0 ||
    totals.network_attempts !== 0 ||
    totals.geometry_failures !== 0 ||
    totals.overflow_failures !== 0 ||
    totals.action_failures !== 0 ||
    totals.axe_violations !== 0
  ) {
    issues.push("browser-report.json не подтверждает чистый результат проверок");
  }
}

function validateAcceptanceReport(root, evidenceRoot, report, issues) {
  if (!report) return;
  const contracts = loadContracts(root);
  const packageRoot = path.join(root, PACKAGE_PATH);
  if (
    report.version !== "2.2.0" ||
    report.status !== "owner-approved-prototype" ||
    report.deterministic_epoch !== FIXED_EPOCH ||
    report.result !== "conditional_pass_with_tooling_limitation"
  ) {
    issues.push("acceptance-report.json содержит неверные метаданные приёмки");
  }
  if (
    report.state_count !== contracts.journey.states.length ||
    report.evidence_file_count !== 110
  ) {
    issues.push("acceptance-report.json содержит неверные количества");
  }
  const documentationByPath = new Map(
    Array.isArray(report.documentation)
      ? report.documentation.map((item) => [item.path, item])
      : [],
  );
  if (
    documentationByPath.size !== DOCUMENTATION_PATHS.length ||
    DOCUMENTATION_PATHS.some((item) => !documentationByPath.has(item))
  ) {
    issues.push(
      "acceptance-report.json должен содержать SHA точки входа, решения владельца и пользовательского пути",
    );
  }
  for (const relativePath of DOCUMENTATION_PATHS) {
    const record = documentationByPath.get(relativePath);
    if (record) {
      validateHashRecord(
        record,
        path.join(packageRoot, relativePath),
        `документ ${relativePath}`,
        issues,
      );
    }
  }
  const evidenceToolchainByPath = new Map(
    Array.isArray(report.evidence_toolchain)
      ? report.evidence_toolchain.map((item) => [item.path, item])
      : [],
  );
  if (
    evidenceToolchainByPath.size !== EVIDENCE_TOOLCHAIN_PATHS.length ||
    EVIDENCE_TOOLCHAIN_PATHS.some(
      (item) => !evidenceToolchainByPath.has(item),
    )
  ) {
    issues.push(
      "acceptance-report.json должен содержать SHA генератора, валидатора и браузерных проверок evidence",
    );
  }
  for (const relativePath of EVIDENCE_TOOLCHAIN_PATHS) {
    const record = evidenceToolchainByPath.get(relativePath);
    if (record) {
      validateHashRecord(
        record,
        path.join(root, relativePath),
        `инструмент evidence ${relativePath}`,
        issues,
      );
    }
  }
  const htmlByPath = new Map(
    Array.isArray(report.html_files)
      ? report.html_files.map((item) => [item.path, item])
      : [],
  );
  if (
    htmlByPath.size !== HTML_PATHS.length ||
    HTML_PATHS.some((item) => !htmlByPath.has(item))
  ) {
    issues.push("acceptance-report.json должен содержать SHA четырёх HTML-файлов");
  }
  for (const relativePath of HTML_PATHS) {
    const record = htmlByPath.get(relativePath);
    if (record) {
      validateHashRecord(
        record,
        path.join(packageRoot, relativePath),
        `HTML-файл ${relativePath}`,
        issues,
      );
    }
  }
  const canonicalPaths = contracts.package.canonical_contracts;
  const canonicalByPath = new Map(
    Array.isArray(report.canonical_contracts)
      ? report.canonical_contracts.map((item) => [item.path, item])
      : [],
  );
  if (
    canonicalByPath.size !== canonicalPaths.length ||
    canonicalPaths.some((item) => !canonicalByPath.has(item))
  ) {
    issues.push("acceptance-report.json содержит неверный набор канонических договоров");
  }
  for (const relativePath of canonicalPaths) {
    const record = canonicalByPath.get(relativePath);
    if (record) {
      validateHashRecord(
        record,
        path.join(packageRoot, relativePath),
        `канонический договор ${relativePath}`,
        issues,
      );
    }
  }
  if (
    report.package_manifest?.path !==
    "derived/prototype-package-manifest.json"
  ) {
    issues.push("acceptance-report.json содержит неверный путь манифеста");
  } else {
    validateHashRecord(
      report.package_manifest,
      path.join(packageRoot, report.package_manifest.path),
      "манифест прототипа",
      issues,
    );
  }
  if (report.browser_report?.path !== "evidence/browser-report.json") {
    issues.push("acceptance-report.json содержит неверный путь браузерного отчёта");
  } else {
    validateHashRecord(
      report.browser_report,
      path.join(evidenceRoot, "browser-report.json"),
      "браузерный отчёт",
      issues,
    );
  }
  if (
    contracts.journey.status !== "owner-approved-prototype" ||
    contracts.preview.status !== "owner-approved-prototype" ||
    report.owner_approval?.journey_status !== contracts.journey.status ||
    report.owner_approval?.presentation_preview_status !==
      contracts.preview.status ||
    report.owner_approval?.playwright_substitution_confirmed !== true
  ) {
    issues.push("acceptance-report.json не подтверждает решение владельца");
  }
  const expectedRestrictedAssets = contracts.package.source_assets
    .filter((asset) => asset.license === "repository-license-not-found")
    .map((asset) => ({
      path: asset.path,
      origin_repository: asset.origin_repository,
      origin_commit: asset.origin_commit,
      license: asset.license,
      permission: asset.permission,
    }));
  if (
    report.donor_operations?.write_operations_performed !== false ||
    report.rights?.external_distribution_requires_separate_review !==
      (expectedRestrictedAssets.length > 0) ||
    canonicalJson(report.rights?.restricted_source_assets) !==
      canonicalJson(expectedRestrictedAssets)
  ) {
    issues.push(
      "acceptance-report.json должен фиксировать отсутствие записи в доноры и ограничения прав",
    );
  }
  if (
    report.tooling?.chrome_devtools_mcp?.generator_integration !== false ||
    report.tooling?.chrome_devtools_mcp?.availability_assessed !== false ||
    Object.hasOwn(report.tooling?.chrome_devtools_mcp ?? {}, "available") ||
    typeof report.tooling.chrome_devtools_mcp.limitation !== "string" ||
    report.tooling.chrome_devtools_mcp.limitation.length === 0 ||
    report.tooling?.playwright?.used !== true
  ) {
    issues.push(
      "acceptance-report.json должен отличать невстроенный Chrome DevTools MCP от применения Playwright",
    );
  }
  if (
    report.tooling?.playwright?.version !==
    contracts.package.dependencies["@playwright/test"]
  ) {
    issues.push(
      "acceptance-report.json: версия Playwright не соответствует договору",
    );
  }
  if (
    report.commands?.update !==
      "npm run update:presentation-link-lisa-user-journey:evidence" ||
    report.commands?.validate !==
      "npm run validate:presentation-link-lisa-user-journey:evidence" ||
    report.commands?.check !==
      "npm run check:presentation-link-lisa-user-journey:evidence"
  ) {
    issues.push(
      "acceptance-report.json содержит неверные команды обновления и проверки evidence",
    );
  }
}

export function validateEvidencePackage(
  root = process.cwd(),
  { evidenceRoot = path.join(root, PACKAGE_PATH, "evidence") } = {},
) {
  const issues = [];
  let expectedPaths;
  try {
    expectedPaths = expectedEvidencePaths(root);
  } catch (error) {
    return [error.message];
  }
  const expectedSet = new Set(expectedPaths);
  const actualPaths = collectEvidenceEntries(evidenceRoot, issues);
  const actualSet = new Set(actualPaths);
  if (actualPaths.length !== 110) {
    issues.push(
      `evidence-пакет должен содержать ровно 110 файлов, найдено ${actualPaths.length}`,
    );
  }
  for (const expectedPath of expectedPaths) {
    if (!actualSet.has(expectedPath)) {
      issues.push(`отсутствует обязательный evidence-файл: ${expectedPath}`);
    }
  }
  for (const actualPath of actualPaths) {
    if (!expectedSet.has(actualPath)) {
      issues.push(`лишний evidence-файл: ${actualPath}`);
    }
  }

  const browserReportPath = path.join(evidenceRoot, "browser-report.json");
  const acceptanceReportPath = path.join(evidenceRoot, "acceptance-report.json");
  validateNoLocalPaths(
    browserReportPath,
    "browser-report.json",
    issues,
  );
  validateNoLocalPaths(
    acceptanceReportPath,
    "acceptance-report.json",
    issues,
  );
  const browserReport = readJsonReport(
    browserReportPath,
    "browser-report.json",
    issues,
  );
  const acceptanceReport = readJsonReport(
    acceptanceReportPath,
    "acceptance-report.json",
    issues,
  );
  validateBrowserReport(root, evidenceRoot, browserReport, issues);
  validateAcceptanceReport(root, evidenceRoot, acceptanceReport, issues);
  return issues;
}

export function publishEvidenceAtomically(
  root = process.cwd(),
  {
    stagingRoot,
    targetRoot = path.join(root, PACKAGE_PATH, "evidence"),
  } = {},
) {
  if (!stagingRoot || path.resolve(stagingRoot) === path.resolve(targetRoot)) {
    throw new Error("для публикации нужен отдельный временный каталог evidence");
  }
  const issues = validateEvidencePackage(root, { evidenceRoot: stagingRoot });
  if (issues.length > 0) {
    throw new Error(`evidence-пакет не прошёл проверку:\n- ${issues.join("\n- ")}`);
  }
  fs.mkdirSync(path.dirname(targetRoot), { recursive: true });
  const backupRoot = path.join(
    path.dirname(targetRoot),
    `.${path.basename(targetRoot)}-backup-${process.pid}`,
  );
  fs.rmSync(backupRoot, { recursive: true, force: true });
  const hadTarget = fs.existsSync(targetRoot);
  if (hadTarget) {
    fs.renameSync(targetRoot, backupRoot);
  }
  try {
    fs.renameSync(stagingRoot, targetRoot);
  } catch (error) {
    if (hadTarget && fs.existsSync(backupRoot) && !fs.existsSync(targetRoot)) {
      fs.renameSync(backupRoot, targetRoot);
    }
    throw error;
  }
  fs.rmSync(backupRoot, { recursive: true, force: true });
}

function isDirectExecution() {
  return (
    process.argv[1] &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  );
}

if (isDirectExecution()) {
  const issues = validateEvidencePackage(process.cwd());
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`ERROR: ${issue}`);
    }
    process.exit(1);
  }
  console.log("presentation link Lisa evidence valid: 110 files");
}
