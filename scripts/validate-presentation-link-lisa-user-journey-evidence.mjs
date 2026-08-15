import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  FIXED_EPOCH,
  PACKAGE_PATH,
  activeStateIds,
  loadContracts,
  sha256File,
  validateContracts,
} from "./lib/presentation-link-lisa-user-journey.mjs";
import { readStoredZip } from "./lib/documentation-archive.mjs";
import {
  NATURAL_SOURCE_CAPTURE_LAYOUT,
  NATURAL_SOURCE_PARITY_POLICY,
  canonicalRasterCandidateFingerprint,
  hasNaturalSourceCaptureLayout,
  validateRasterSourceParityResult,
} from "./lib/presentation-link-lisa-canonical-raster.mjs";

export const EVIDENCE_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "desktop-1280x720", width: 1280, height: 720 }),
  Object.freeze({ id: "mobile-390x844", width: 390, height: 844 }),
  Object.freeze({ id: "stress-320x568", width: 320, height: 568 }),
]);

export const EVIDENCE_NETWORK_GUARD_SCOPE = "browser-context";
export const EVIDENCE_REPORT_VERSION = "4.0.0";
export const CANONICAL_RASTER_MANIFEST_PATH =
  "derived/canonical-raster-manifest.json";
export const CANONICAL_CAPTURE_TOOL_WARNINGS = Object.freeze([
  Object.freeze({
    classification: "playwright-webkit-screenshot-inline-style",
    message:
      "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.",
    count: 1,
  }),
]);

const EXPECTED_REPORT_PATHS = Object.freeze([
  "evidence/acceptance-report.json",
  "evidence/browser-report.json",
]);
const CANONICAL_RASTER_MANIFEST_KEYS = Object.freeze([
  "version",
  "status",
  "candidate_fingerprint",
  "renderer_profile",
  "source_parity",
  "records",
]);
const BROWSER_REPORT_KEYS = Object.freeze([
  "version",
  "status",
  "deterministic_epoch",
  "playwright_version",
  "active_state_ids",
  "active_contract_ids",
  "active_contracts_sha256",
  "mvp_scope",
  "candidate_fingerprint",
  "renderer_profile",
  "source_parity",
  "canonical_raster_manifest",
  "runtime_profile",
  "runtime_results",
  "totals",
  "network_policy",
]);
const ACCEPTANCE_REPORT_KEYS = Object.freeze([
  "version",
  "status",
  "deterministic_epoch",
  "result",
  "active_state_ids",
  "active_contract_ids",
  "active_contracts_sha256",
  "mvp_scope",
  "candidate_fingerprint",
  "renderer_profile",
  "source_parity",
  "canonical_raster_manifest",
  "status_messages",
  "timeline",
  "state_count",
  "evidence_file_count",
  "canonical_webkit_png_count",
  "runtime_check_count",
  "documentation",
  "evidence_toolchain",
  "html_files",
  "canonical_contracts",
  "active_contract_registry",
  "package_manifest",
  "browser_report",
  "owner_approval",
  "donor_operations",
  "rights",
  "tooling",
  "browser_report_runtime_result_count",
  "commands",
]);
const EXPECTED_BROWSERS = Object.freeze(["chromium", "webkit"]);
const HTML_PATHS = Object.freeze([
  "demo/index.html",
  "demo/app.js",
  "demo/styles.css",
  "demo/data.js",
]);
const DOCUMENTATION_PATHS = Object.freeze([
  "README.md",
  "donor-options.md",
  "user-journey.md",
]);
const EVIDENCE_TOOLCHAIN_PATHS = Object.freeze([
  "scripts/capture-presentation-link-lisa-runtime-evidence.mjs",
  "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
  "scripts/validate-presentation-link-lisa-user-journey-evidence.mjs",
]);
const CANDIDATE_CAPTURE_TOOLCHAIN_PATHS = Object.freeze([
  "package.json",
  "scripts/capture-presentation-link-lisa-derived-frames.mjs",
  "scripts/capture-presentation-link-lisa-runtime-evidence.mjs",
  "scripts/generate-presentation-link-lisa-user-journey.mjs",
  "scripts/lib/documentation-archive.mjs",
  "scripts/lib/presentation-link-lisa-canonical-raster.mjs",
  "scripts/lib/presentation-link-lisa-html-runtime.mjs",
  "scripts/lib/presentation-link-lisa-user-journey.mjs",
]);
const SAFE_SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const VIRTUAL_CAPTURE_ORIGIN = "http://lisa.invalid";
const FORBIDDEN_EVIDENCE_PATTERNS = Object.freeze([
  /lisa-presentation-ready/iu,
  /lisa-notification/iu,
  /lisa-result-view/iu,
  /lisa-returned-to-chat/iu,
  /lisa-presentation-email/iu,
  /lisa-link-/iu,
  /lisa-offline/iu,
  /presentation-preview/iu,
  /foreignObject/iu,
  /mailto:/iu,
  /data:image\/svg\+xml/iu,
]);
const FORBIDDEN_ACTIVE_OUTPUT_PATTERNS = Object.freeze([
  ...FORBIDDEN_EVIDENCE_PATTERNS,
  /(?:https?|wss?):\/\/(?!www\.w3\.org\/2000\/svg(?:["'\s]|$))/iu,
  /\bfetch\s*\(/iu,
  /XMLHttpRequest/iu,
  /\bWebSocket\b/iu,
  /\bEventSource\b/iu,
  /sendBeacon/iu,
  /serviceWorker/iu,
  /<foreignObject\b/iu,
  /<object\b/iu,
  /<embed\b/iu,
]);
const UNSAFE_SVG_PATTERNS = Object.freeze([
  /<script\b/iu,
  /<foreignObject\b/iu,
  /<use\b/iu,
  /<feImage\b/iu,
  /\bon[a-z]+\s*=/iu,
  /(?:https?|wss?):\/\/(?!www\.w3\.org\/2000\/svg(?:["'\s]|$))/iu,
  /<!DOCTYPE/iu,
]);
const LOCAL_PATH_PATTERNS = Object.freeze([
  /\/Users\//u,
  /\/home\/[^/\s"]+\//u,
  /file:\/\/(?:\/)?(?:Users|home)\//u,
  /[A-Za-z]:\\(?:Users|Documents and Settings)\\/u,
]);
const PNG_CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

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

function sameOrderedValues(left, right) {
  return Array.isArray(left) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

/** The approved user-facing wording belongs to the active journey contract. */
export function journeyStatusMessages(journey) {
  const values = [journey?.copy?.generation_started, journey?.copy?.presentation_sent];
  if (!values.every((value) => typeof value === "string" && value.trim().length > 0)) {
    throw new Error("договор пути не содержит две непустые статусные реплики");
  }
  return Object.freeze([...values]);
}

function exactObjectKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    sameOrderedValues(
      Object.keys(value).sort((left, right) => left.localeCompare(right, "en")),
      [...keys].sort((left, right) => left.localeCompare(right, "en")),
    );
}

/**
 * Канонический захват WebKit допускает ровно одно известное предупреждение
 * Playwright CSP при внутреннем стиле page.screenshot(). Это диагностическое
 * сообщение инструмента захвата, а не ошибка консоли продукта.
 */
export function validateCanonicalCaptureToolWarnings(value) {
  return Array.isArray(value) && value.length === CANONICAL_CAPTURE_TOOL_WARNINGS.length &&
    value.every((warning, index) =>
      exactObjectKeys(warning, ["classification", "message", "count"]) &&
      warning.classification === CANONICAL_CAPTURE_TOOL_WARNINGS[index].classification &&
      warning.message === CANONICAL_CAPTURE_TOOL_WARNINGS[index].message &&
      warning.count === CANONICAL_CAPTURE_TOOL_WARNINGS[index].count,
    );
}

export function validateNaturalSourceCaptureLayout(value) {
  return hasNaturalSourceCaptureLayout(value) &&
    canonicalJson(value) === canonicalJson(NATURAL_SOURCE_CAPTURE_LAYOUT);
}

function safeRelativePath(value) {
  return typeof value === "string" &&
    value.length > 0 &&
    !value.includes("\\") &&
    !path.posix.isAbsolute(value) &&
    !value.includes("\0") &&
    !value.split("/").includes("..") &&
    path.posix.normalize(value) === value;
}

function isSafeEvidencePath(value) {
  return safeRelativePath(value) && value.startsWith("evidence/");
}

function isContained(parent, child) {
  return child.startsWith(`${parent}${path.sep}`);
}

function canonicalExistingDirectory(rawPath, label) {
  if (typeof rawPath !== "string" || rawPath.length === 0) {
    throw new Error(`${label} не задан`);
  }
  const resolved = path.resolve(rawPath);
  const stat = fs.lstatSync(resolved);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${label} должен быть обычным каталогом без символических ссылок`);
  }
  return fs.realpathSync.native(resolved);
}

function canonicalExistingFile(rawPath, label) {
  const resolved = path.resolve(rawPath);
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${label} должен быть обычным файлом без символических ссылок`);
  }
  return fs.realpathSync.native(resolved);
}

function canonicalCandidatePath(packageRoot, rawPath, label) {
  const resolved = path.resolve(rawPath);
  if (fs.existsSync(resolved)) {
    const canonical = canonicalExistingDirectory(resolved, label);
    if (!isContained(packageRoot, canonical)) {
      throw new Error(`${label} должен находиться внутри packageRoot`);
    }
    return canonical;
  }
  let probe = resolved;
  while (!fs.existsSync(probe)) {
    const parent = path.dirname(probe);
    if (parent === probe) throw new Error(`${label} не имеет существующего родителя`);
    probe = parent;
  }
  const canonicalParent = canonicalExistingDirectory(probe, `${label}: родитель`);
  const suffix = path.relative(probe, resolved);
  const canonical = path.resolve(canonicalParent, suffix);
  if (!isContained(packageRoot, canonical)) {
    throw new Error(`${label} выходит за канонические границы packageRoot`);
  }
  return canonical;
}

function fileInside(root, relativePath, label) {
  if (!safeRelativePath(relativePath)) {
    throw new Error(`${label}: небезопасный относительный путь`);
  }
  const target = path.resolve(root, relativePath);
  if (!isContained(root, target)) {
    throw new Error(`${label}: путь выходит за границы`);
  }
  return target;
}

/**
 * Resolves the three trust roots without allowing a candidate operation to
 * silently fall back to the active package.
 */
export function resolveEvidenceRoots({
  toolchainRoot = process.cwd(),
  contractRoot = toolchainRoot,
  packageRoot,
  evidenceRoot,
  activePackageRoot,
  requireCandidate = false,
  allowActivePackage = false,
} = {}) {
  const canonicalToolchainRoot = canonicalExistingDirectory(
    toolchainRoot,
    "toolchainRoot",
  );
  const canonicalContractRoot = canonicalExistingDirectory(
    contractRoot,
    "contractRoot",
  );
  const contractPackageRoot = canonicalExistingDirectory(
    path.join(canonicalContractRoot, PACKAGE_PATH),
    "пакет договоров",
  );
  const currentToolchainRoot = canonicalExistingDirectory(process.cwd(), "текущий toolchainRoot");
  const protectedActivePackageRoot = activePackageRoot
    ? canonicalExistingDirectory(activePackageRoot, "activePackageRoot")
    : canonicalToolchainRoot === currentToolchainRoot
      ? canonicalExistingDirectory(
        path.join(currentToolchainRoot, PACKAGE_PATH),
        "активный пакет текущего toolchainRoot",
      )
      : null;
  const explicitPackageRoot = packageRoot !== undefined;
  if (requireCandidate && !explicitPackageRoot) {
    throw new Error("операция кандидата требует явный packageRoot");
  }
  const canonicalPackageRoot = canonicalExistingDirectory(
    packageRoot ?? contractPackageRoot,
    "packageRoot",
  );
  if (
    protectedActivePackageRoot &&
    (requireCandidate || explicitPackageRoot) &&
    !allowActivePackage &&
    canonicalPackageRoot === protectedActivePackageRoot
  ) {
    throw new Error(
      "операция кандидата не может подписывать активный пакет; передайте отдельный packageRoot",
    );
  }
  const canonicalEvidenceRoot = canonicalCandidatePath(
    canonicalPackageRoot,
    evidenceRoot ?? path.join(canonicalPackageRoot, "evidence"),
    "evidenceRoot",
  );
  return Object.freeze({
    toolchainRoot: canonicalToolchainRoot,
    contractRoot: canonicalContractRoot,
    contractPackageRoot,
    packageRoot: canonicalPackageRoot,
    evidenceRoot: canonicalEvidenceRoot,
    activePackageRoot: protectedActivePackageRoot,
    isActivePackage: protectedActivePackageRoot !== null && canonicalPackageRoot === protectedActivePackageRoot,
  });
}

function contractRootFrom(input = process.cwd()) {
  if (typeof input === "string") return canonicalExistingDirectory(input, "contractRoot");
  return canonicalExistingDirectory(
    input?.contractRoot ?? input?.toolchainRoot ?? process.cwd(),
    "contractRoot",
  );
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label}: ${error instanceof Error ? error.message : "не прочитан"}`);
  }
}

function pngCrc32(...parts) {
  let value = 0xffffffff;
  for (const part of parts) {
    for (const byte of part) {
      value = PNG_CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function readPngDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 45 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("неверная сигнатура PNG");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let sawImageData = false;
  let sawEnd = false;
  let chunkIndex = 0;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error("повреждённая структура PNG");
    const length = bytes.readUInt32BE(offset);
    const typeBytes = bytes.subarray(offset + 4, offset + 8);
    const type = typeBytes.toString("ascii");
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error("повреждённая длина чанка PNG");
    const data = bytes.subarray(offset + 8, end - 4);
    if (pngCrc32(typeBytes, data) !== bytes.readUInt32BE(end - 4)) {
      throw new Error("не совпадает CRC чанка PNG");
    }
    if (chunkIndex === 0 && (type !== "IHDR" || length !== 13)) {
      throw new Error("PNG должен начинаться с IHDR");
    }
    if (type === "IHDR") {
      if (chunkIndex !== 0) throw new Error("PNG содержит повторный IHDR");
      width = bytes.readUInt32BE(offset + 8);
      height = bytes.readUInt32BE(offset + 12);
    }
    if (type === "IDAT") sawImageData = true;
    if (type === "IEND") {
      if (length !== 0 || end !== bytes.length) {
        throw new Error("PNG имеет данные после IEND");
      }
      sawEnd = true;
      break;
    }
    offset = end;
    chunkIndex += 1;
  }
  if (!sawEnd || !sawImageData || width < 1 || height < 1) {
    throw new Error("PNG не содержит полноценные данные изображения");
  }
  return { width, height };
}

export function validateStrictPng(filePath) {
  return readPngDimensions(filePath);
}

export function selectEvidenceBrowserLaunchArgs(captureStabilization, browserName) {
  if (!EXPECTED_BROWSERS.includes(browserName)) {
    throw new Error(`неизвестный браузер evidence: ${String(browserName)}`);
  }
  const configured = captureStabilization?.browser_launch_args;
  if (!exactObjectKeys(configured, EXPECTED_BROWSERS)) {
    throw new Error("browser_launch_args должен содержать только Chromium и WebKit");
  }
  const args = configured[browserName];
  if (
    !Array.isArray(args) ||
    new Set(args).size !== args.length ||
    !args.every(
      (arg) => typeof arg === "string" && arg.startsWith("--") && !/[\u0000\r\n]/u.test(arg),
    )
  ) {
    throw new Error(`${browserName}: browser_launch_args содержит небезопасный набор`);
  }
  if (browserName !== "chromium" && args.length !== 0) {
    throw new Error("аргументы запуска evidence разрешены только для Chromium");
  }
  return [...args];
}

export function expectedEvidenceBrowserLaunchArgs(captureStabilization) {
  return Object.fromEntries(
    EXPECTED_BROWSERS.map((browserName) => [
      browserName,
      selectEvidenceBrowserLaunchArgs(captureStabilization, browserName),
    ]),
  );
}

function readActiveContext(contractRoot, contracts = loadContracts(contractRoot)) {
  const contractPackageRoot = path.join(contractRoot, PACKAGE_PATH);
  const activeContractsPath = path.join(contractPackageRoot, "source/active-contracts.json");
  const registry = readJson(activeContractsPath, "active-contracts.json повреждён");
  const activeEntries = Array.isArray(registry.active_contracts) ? registry.active_contracts : [];
  const scopeEntry = activeEntries.find((entry) => entry?.id === "scope");
  if (!scopeEntry || !safeRelativePath(scopeEntry.path)) {
    throw new Error("активный реестр не содержит безопасный договор области MVP");
  }
  return {
    contracts,
    registry,
    scope: readJson(path.join(contractPackageRoot, scopeEntry.path), "договор области MVP повреждён"),
    activeContractsPath,
    activeContractIds: activeEntries.map((entry) => entry?.id),
    activeContractPaths: activeEntries.map((entry) => entry?.path),
    activeContractsSha256: sha256File(activeContractsPath),
    activeStateIds: activeStateIds(contracts),
    journeyStateIds: contracts.journey?.states?.map((state) => state.id) ?? [],
    statusMessages: journeyStatusMessages(contracts.journey),
  };
}

function mvpContextIssues(context) {
  const issues = [];
  if (!sameOrderedValues(context.journeyStateIds, context.activeStateIds)) {
    issues.push("активный путь должен содержать состояния из активного реестра MVP P1/P2");
  }
  if (new Set(context.activeContractIds).size !== context.activeContractIds.length) {
    issues.push("активный реестр договоров MVP содержит повторяющиеся роли");
  }
  if (context.registry?.status !== "active") issues.push("реестр договоров MVP не активен");
  if (!sameOrderedValues(context.scope?.implemented_priorities, ["P1", "P2"])) {
    issues.push("договор области должен содержать только P1/P2");
  }
  if (
    context.scope?.future_scope?.quarter !== "Q4" ||
    !sameOrderedValues(context.scope?.future_scope?.priorities, ["P3", "P4"])
  ) {
    issues.push("договор области должен отделять P3/P4 как будущий объём Q4");
  }
  const timeline = context.contracts.journey?.prototype_timeline;
  if (
    timeline?.generation_started_at_ms !== 600 ||
    timeline?.clock_animation_ends_at_ms !== 7600 ||
    timeline?.ready_at_ms !== 8000 ||
    timeline?.direct_state_autoplay !== false
  ) {
    issues.push("договор пути не содержит шкалу 600/7600/8000 мс");
  }
  if (!Array.isArray(context.statusMessages) || context.statusMessages.length !== 2) {
    issues.push("договор пути не содержит две точные статусные реплики MVP");
  }
  return issues;
}

export function buildActiveEvidenceContext(input = process.cwd()) {
  const contractRoot = contractRootFrom(input);
  const context = readActiveContext(contractRoot);
  const issues = mvpContextIssues(context);
  if (issues.length > 0) {
    throw new Error(`активный MVP не прошёл проверку evidence:\n- ${issues.join("\n- ")}`);
  }
  return context;
}

function expectedPublishedRecords(context, publishedMatrix, issues) {
  if (!Array.isArray(publishedMatrix) || publishedMatrix.length !== 1) {
    issues.push("published_raster_matrix должен содержать одну матрицу WebKit");
    return [];
  }
  const entry = publishedMatrix[0];
  if (
    entry?.browser !== "webkit" ||
    entry?.state_selection !== "all" ||
    entry?.state_source !== "source/journey-contract.json#/states"
  ) {
    issues.push("published_raster_matrix должен описывать все WebKit-кадры MVP");
  }
  const records = [];
  const expectedViewportIds = EVIDENCE_VIEWPORTS.map((viewport) => viewport.id);
  if (!Array.isArray(entry?.viewports) || entry.viewports.length !== expectedViewportIds.length) {
    issues.push("published_raster_matrix содержит неверный набор размеров окна");
    return records;
  }
  for (const expectedViewport of EVIDENCE_VIEWPORTS) {
    const viewport = entry.viewports.find((item) => item?.id === expectedViewport.id);
    if (
      !viewport ||
      viewport.width !== expectedViewport.width ||
      viewport.height !== expectedViewport.height ||
      !safeRelativePath(viewport.png_path_format) ||
      !viewport.png_path_format.includes("{state_id}") ||
      viewport.png_path_format.split("{state_id}").length !== 2
    ) {
      issues.push(`published_raster_matrix содержит неверное описание ${expectedViewport.id}`);
      continue;
    }
    for (const stateId of context.activeStateIds) {
      records.push({
        browser: "webkit",
        viewport: expectedViewport.id,
        state_id: stateId,
        path: viewport.png_path_format.replace("{state_id}", stateId),
        viewport_dimensions: { width: expectedViewport.width, height: expectedViewport.height },
      });
    }
  }
  if (new Set(records.map((record) => record.path)).size !== records.length) {
    issues.push("published_raster_matrix содержит повторяющиеся пути");
  }
  const expectedCount = EVIDENCE_VIEWPORTS.length * context.activeStateIds.length;
  if (records.length !== expectedCount) {
    issues.push(`published_raster_matrix должен содержать ${expectedCount} PNG, получено ${records.length}`);
  }
  return records;
}

function expectedRuntimeRecords(context, runtimeMatrix, issues) {
  if (!Array.isArray(runtimeMatrix) || runtimeMatrix.length !== EXPECTED_BROWSERS.length) {
    issues.push("runtime_validation_matrix должен содержать Chromium и WebKit");
    return [];
  }
  const records = [];
  let bindings;
  try {
    bindings = visualBindingsByState(context);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "визуальный договор runtime не прочитан");
    return records;
  }
  const viewportIds = EVIDENCE_VIEWPORTS.map((viewport) => viewport.id);
  for (const browser of EXPECTED_BROWSERS) {
    const entry = runtimeMatrix.find((item) => item?.browser === browser);
    if (!entry) {
      issues.push(`runtime_validation_matrix не содержит ${browser}`);
      continue;
    }
    if (
      entry.state_selection !== "all" ||
      entry.state_source !== "source/journey-contract.json#/states" ||
      !sameOrderedValues(entry.viewports, viewportIds) ||
      !sameOrderedValues(entry.required_checks, ["behavior", "accessibility", "geometry", "network"]) ||
      entry.published_png !== false ||
      entry.retained_png !== false
    ) {
      issues.push(`${browser}: runtime_validation_matrix не фиксирует строгую проверку без PNG`);
      continue;
    }
    for (const viewport of EVIDENCE_VIEWPORTS) {
      for (const stateId of context.activeStateIds) {
        const binding = bindings.get(stateId);
        if (!binding) {
          issues.push(`${browser}/${viewport.id}/${stateId}: отсутствуют semantic slots визуального договора`);
          continue;
        }
        records.push({
          browser,
          viewport: viewport.id,
          state_id: stateId,
          viewport_dimensions: { width: viewport.width, height: viewport.height },
          semantic_slots: binding.slots.map((slot) => ({
            id: slot.id,
            semantic_control_id: slot.semantic_control_id,
          })),
        });
      }
    }
  }
  const expectedCount = EXPECTED_BROWSERS.length * EVIDENCE_VIEWPORTS.length * context.activeStateIds.length;
  if (records.length !== expectedCount) {
    issues.push(`runtime_validation_matrix должен содержать ${expectedCount} проверок, получено ${records.length}`);
  }
  return records;
}

export function buildEvidenceMatrix(input = process.cwd()) {
  const contractRoot = contractRootFrom(input);
  const context = buildActiveEvidenceContext({ contractRoot });
  const packageContract = context.contracts.package ?? {};
  const issues = [];
  const reports = packageContract.evidence_outputs?.reports;
  if (!sameOrderedValues(reports, EXPECTED_REPORT_PATHS)) {
    issues.push("evidence должен содержать ровно два отчёта MVP");
  }
  const canonicalRecords = expectedPublishedRecords(
    context,
    packageContract.outputs?.published_raster_matrix,
    issues,
  );
  const runtimeRecords = expectedRuntimeRecords(
    context,
    packageContract.evidence_outputs?.runtime_validation_matrix,
    issues,
  );
  const paths = [...EXPECTED_REPORT_PATHS, ...canonicalRecords.map((record) => record.path)];
  const expectedFileCount = EXPECTED_REPORT_PATHS.length + canonicalRecords.length;
  if (new Set(paths).size !== paths.length || paths.length !== expectedFileCount) {
    issues.push(`evidence-пакет должен содержать ровно ${canonicalRecords.length} WebKit PNG и ${EXPECTED_REPORT_PATHS.length} отчёта`);
  }
  if (issues.length > 0) {
    throw new Error(`матрица evidence невалидна:\n- ${issues.join("\n- ")}`);
  }
  return {
    context,
    reportPaths: [...EXPECTED_REPORT_PATHS],
    canonicalRecords,
    runtimeRecords,
    paths,
    fileCount: paths.length,
    canonicalPngCount: canonicalRecords.length,
    runtimeCount: runtimeRecords.length,
  };
}

export function expectedEvidencePaths(input = process.cwd()) {
  return buildEvidenceMatrix(input).paths;
}

export function expectedEvidenceInventory(input = process.cwd()) {
  const matrix = buildEvidenceMatrix(input);
  return {
    fileCount: matrix.fileCount,
    screenshotCount: matrix.canonicalPngCount,
    canonicalPngCount: matrix.canonicalPngCount,
    runtimeCount: matrix.runtimeCount,
    paths: [...matrix.paths],
  };
}

function validateNoLocalPathsInText(text, label, issues) {
  if (/file:\/\//iu.test(text) || LOCAL_PATH_PATTERNS.some((pattern) => pattern.test(text))) {
    issues.push(`${label} содержит локальный абсолютный путь`);
  }
}

function validateForbiddenText(text, label, issues) {
  for (const pattern of FORBIDDEN_EVIDENCE_PATTERNS) {
    if (pattern.test(text)) issues.push(`${label} содержит запрещённый фрагмент ${pattern}`);
  }
}

export function validateStructuredCaptureMetadataTextSafety(text, label, expectedVirtualOriginPath, issues) {
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch {
    issues.push(`${label} не является корректным JSON`);
    return;
  }
  const actualOrigin = expectedVirtualOriginPath.reduce(
    (value, key) => value?.[key],
    manifest,
  );
  const originOccurrences = [];
  const visit = (value, currentPath = []) => {
    if (value === VIRTUAL_CAPTURE_ORIGIN) {
      originOccurrences.push(currentPath.join("."));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...currentPath, String(index)]));
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) visit(item, [...currentPath, key]);
    }
  };
  visit(manifest);
  if (
    actualOrigin !== VIRTUAL_CAPTURE_ORIGIN ||
    !sameOrderedValues(originOccurrences, [expectedVirtualOriginPath.join(".")])
  ) {
    issues.push(`${label} содержит виртуальный origin вне зарегистрированного профиля захвата`);
  }
  const sanitized = text.replaceAll(
    JSON.stringify(VIRTUAL_CAPTURE_ORIGIN),
    JSON.stringify("capture-origin-validated-elsewhere"),
  );
  validateNoLocalPathsInText(sanitized, label, issues);
  for (const pattern of FORBIDDEN_ACTIVE_OUTPUT_PATTERNS) {
    if (pattern.test(sanitized)) issues.push(`${label} содержит запрещённый фрагмент ${pattern}`);
  }
}

function validateSvgTextSafety(text, label, issues) {
  validateNoLocalPathsInText(text, label, issues);
  for (const pattern of UNSAFE_SVG_PATTERNS) {
    if (pattern.test(text)) issues.push(`${label} содержит небезопасный SVG-фрагмент ${pattern}`);
  }
  if (/<image\b[^>]*(?:href|xlink:href)\s*=\s*["'](?!data:image\/png;base64,)/iu.test(text)) {
    issues.push(`${label} содержит SVG-изображение не в формате data:image/png`);
  }
}

function collectEvidenceEntries(evidenceRoot, issues) {
  const entries = [];
  if (!fs.existsSync(evidenceRoot)) {
    issues.push("каталог evidence отсутствует");
    return entries;
  }
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort(
      (left, right) => left.name.localeCompare(right.name, "en"),
    )) {
      const target = path.join(directory, entry.name);
      const relative = toPosix(path.relative(evidenceRoot, target));
      const metadata = fs.lstatSync(target);
      if (metadata.isSymbolicLink()) issues.push(`символическая ссылка запрещена: evidence/${relative}`);
      else if (metadata.isDirectory()) walk(target);
      else if (metadata.isFile()) entries.push(`evidence/${relative}`);
      else issues.push(`неподдерживаемый тип evidence-файла: evidence/${relative}`);
    }
  };
  walk(evidenceRoot);
  return entries.sort((left, right) => left.localeCompare(right, "en"));
}

function evidenceFilePath(roots, evidencePath) {
  return fileInside(roots.packageRoot, evidencePath, "evidence-файл");
}

function validateHashRecord(record, target, label, issues) {
  if (!SAFE_SHA256_PATTERN.test(record?.sha256 ?? "")) {
    issues.push(`${label}: отсутствует корректный SHA-256`);
    return;
  }
  if (!fs.existsSync(target)) {
    issues.push(`${label}: файл отсутствует`);
    return;
  }
  if (sha256File(target) !== record.sha256) issues.push(`${label}: не совпадает SHA-256`);
}

function canonicalManifestRecordKey(record) {
  return `${record?.browser}/${record?.viewport}/${record?.state_id}`;
}

function canonicalRecordProjection(record) {
  return {
    browser: record.browser,
    viewport: record.viewport,
    state_id: record.state_id,
    path: record.path,
    sha256: record.sha256,
    bytes: record.bytes,
    png_dimensions: record.png_dimensions,
    source_parity: record.source_parity,
  };
}

function sameSourceParityPolicy(value) {
  return canonicalJson(value) === canonicalJson(NATURAL_SOURCE_PARITY_POLICY);
}

function visualBindingsByState(context) {
  const visualBasis = context.contracts?.["visual-basis"];
  if (
    visualBasis?.rendering_pipeline !== "raster-base-local-overlay" ||
    !sameSourceParityPolicy(visualBasis?.source_parity) ||
    !sameOrderedValues(
      visualBasis?.state_bindings?.map((binding) => binding?.state_id),
      context.activeStateIds,
    )
  ) {
    throw new Error("визуальный договор не задаёт source parity для всех активных состояний");
  }
  return new Map(visualBasis.state_bindings.map((binding) => [binding.state_id, binding]));
}

function validateSourceParityAggregate(value, context, label, issues) {
  if (!exactObjectKeys(value, ["policy", "records"]) || !sameSourceParityPolicy(value?.policy)) {
    issues.push(`${label} не содержит точную политику source parity`);
    return new Map();
  }
  const expectedStateIds = [...context.activeStateIds].sort((left, right) => left.localeCompare(right, "en"));
  if (!Array.isArray(value.records) || value.records.length !== expectedStateIds.length) {
    issues.push(`${label} должен содержать ${expectedStateIds.length} результатов source parity`);
    return new Map();
  }
  const bindings = visualBindingsByState(context);
  const byState = new Map();
  for (const record of value.records) {
    const stateId = record?.state_id;
    if (byState.has(stateId)) {
      issues.push(`${label} содержит повтор source parity ${String(stateId)}`);
      continue;
    }
    const binding = bindings.get(stateId);
    if (!binding) {
      issues.push(`${label} содержит неактивное source parity ${String(stateId)}`);
      continue;
    }
    try {
      validateRasterSourceParityResult(record, binding);
      byState.set(stateId, record);
    } catch (error) {
      issues.push(`${label} ${stateId}: ${error instanceof Error ? error.message : "source parity невалиден"}`);
    }
  }
  if (!sameOrderedValues(value.records.map((record) => record?.state_id), expectedStateIds) ||
    expectedStateIds.some((stateId) => !byState.has(stateId))) {
    issues.push(`${label} не покрывает активные состояния в детерминированном порядке`);
  }
  return byState;
}

export function readCanonicalRasterManifest({ roots, matrix = buildEvidenceMatrix({ contractRoot: roots?.contractRoot }) }) {
  if (!roots) throw new Error("для canonical raster manifest нужны разрешённые корни");
  const manifestPath = fileInside(
    roots.packageRoot,
    CANONICAL_RASTER_MANIFEST_PATH,
    "canonical raster manifest",
  );
  canonicalExistingFile(manifestPath, "canonical raster manifest");
  const manifest = readJson(manifestPath, "canonical raster manifest повреждён");
  const issues = [];
  if (
    !exactObjectKeys(manifest, CANONICAL_RASTER_MANIFEST_KEYS) ||
    typeof manifest.version !== "string" ||
    manifest.version.length === 0 ||
    manifest.status !== "generated" ||
    !manifest.renderer_profile || typeof manifest.renderer_profile !== "object" || Array.isArray(manifest.renderer_profile) ||
    !manifest.candidate_fingerprint || typeof manifest.candidate_fingerprint !== "object" || Array.isArray(manifest.candidate_fingerprint) ||
    !Array.isArray(manifest.records)
  ) {
    issues.push("canonical raster manifest имеет неполную верхнеуровневую форму");
  }
  const sourceParityByState = validateSourceParityAggregate(
    manifest.source_parity,
    matrix.context,
    "canonical raster manifest source_parity",
    issues,
  );
  if (
    manifest.renderer_profile?.capture_engine !== "webkit" ||
    !validateCanonicalCaptureToolWarnings(manifest.renderer_profile?.capture_tool_warnings) ||
    !validateNaturalSourceCaptureLayout(manifest.renderer_profile?.source_parity_capture_layout)
  ) {
    issues.push("canonical raster manifest не фиксирует точный WebKit capture profile natural source parity");
  }
  const expectedByKey = new Map(matrix.canonicalRecords.map((record) => [canonicalManifestRecordKey(record), record]));
  const seen = new Set();
  const records = Array.isArray(manifest.records) ? manifest.records : [];
  if (records.length !== matrix.canonicalRecords.length) {
    issues.push(`canonical raster manifest должен содержать ${matrix.canonicalRecords.length} записей`);
  }
  for (const record of records) {
    const label = `canonical raster ${record?.path ?? "(без пути)"}`;
    if (!exactObjectKeys(record, ["browser", "viewport", "state_id", "path", "sha256", "bytes", "png_dimensions", "runs", "source_parity"])) {
      issues.push(`${label}: неверный набор полей`);
      continue;
    }
    const key = canonicalManifestRecordKey(record);
    const expected = expectedByKey.get(key);
    if (!expected || record.browser !== "webkit" || record.path !== expected.path) {
      issues.push(`${label}: не соответствует published_raster_matrix`);
    }
    if (seen.has(key)) issues.push(`${label}: повторная запись`);
    seen.add(key);
    const expectedParity = sourceParityByState.get(record.state_id);
    if (!expectedParity || canonicalJson(record.source_parity) !== canonicalJson(expectedParity)) {
      issues.push(`${label}: source_parity не совпадает с результатом состояния`);
    }
    if (
      !Number.isInteger(record.bytes) || record.bytes < 1 ||
      !SAFE_SHA256_PATTERN.test(record.sha256 ?? "") ||
      !exactObjectKeys(record.png_dimensions, ["width", "height"]) ||
      !Number.isInteger(record.png_dimensions?.width) || record.png_dimensions.width < 1 ||
      !Number.isInteger(record.png_dimensions?.height) || record.png_dimensions.height < 1
    ) {
      issues.push(`${label}: некорректные опубликованные метаданные`);
    }
    const target = isSafeEvidencePath(record.path)
      ? evidenceFilePath(roots, record.path)
      : null;
    if (!target) {
      issues.push(`${label}: небезопасный путь PNG`);
    } else {
      try {
        canonicalExistingFile(target, label);
        validateHashRecord(record, target, label, issues);
        if (record.bytes !== fs.statSync(target).size) issues.push(`${label}: размер PNG не совпадает`);
        const dimensions = readPngDimensions(target);
        if (canonicalJson(dimensions) !== canonicalJson(record.png_dimensions)) {
          issues.push(`${label}: размеры PNG не совпадают`);
        }
      } catch (error) {
        issues.push(`${label}: ${error instanceof Error ? error.message : "PNG не прочитан"}`);
      }
    }
    if (!Array.isArray(record.runs) || record.runs.length !== 3) {
      issues.push(`${label}: должны быть ровно три независимых запуска`);
    } else {
      for (const run of record.runs) {
        if (!exactObjectKeys(run, ["run", "sha256", "bytes"]) ||
          ![1, 2, 3].includes(run.run) || run.sha256 !== record.sha256 || run.bytes !== record.bytes) {
          issues.push(`${label}: запуск не совпадает с опубликованным PNG`);
          break;
        }
      }
      if (!sameOrderedValues(record.runs.map((run) => run.run), [1, 2, 3])) {
        issues.push(`${label}: номера запусков должны быть 1, 2, 3`);
      }
    }
  }
  for (const expected of matrix.canonicalRecords) {
    if (!seen.has(canonicalManifestRecordKey(expected))) {
      issues.push(`canonical raster manifest не описывает ${expected.path}`);
    }
  }
  if (issues.length > 0) {
    throw new Error(`canonical raster manifest невалиден:\n- ${issues.join("\n- ")}`);
  }
  return {
    path: CANONICAL_RASTER_MANIFEST_PATH,
    sha256: sha256File(manifestPath),
    manifest,
    sourceParity: manifest.source_parity,
    records: records.map(canonicalRecordProjection),
  };
}

function hashRecord(root, relativePath) {
  const target = fileInside(root, relativePath, "хэшируемый файл");
  canonicalExistingFile(target, relativePath);
  return { path: relativePath, sha256: sha256File(target), bytes: fs.statSync(target).size };
}

export function buildCandidateFingerprint({ roots, matrix, canonicalRasterManifest }) {
  if (!roots || !matrix || !canonicalRasterManifest) {
    throw new Error("отпечаток кандидата требует корни, матрицу и canonical raster manifest");
  }
  const contractPaths = [
    "source/active-contracts.json",
    ...matrix.context.contracts.__descriptors.map((item) => item.path),
    "source/schemas/active-contracts.schema.json",
    ...matrix.context.contracts.__descriptors.map((item) => item.schema),
  ].sort((left, right) => left.localeCompare(right, "en"));
  const visualRasterAssets = (matrix.context.contracts["visual-basis"]?.state_bindings ?? []).flatMap((binding) => [
    binding?.base_path,
    ...(binding?.slots ?? []).map((slot) => slot?.visible_patch_path).filter(Boolean),
  ]);
  const sourceAssetPaths = [...new Set([
    ...(matrix.context.contracts.package?.source_assets ?? []).map((asset) => asset.path),
    ...visualRasterAssets,
  ])].sort((left, right) => left.localeCompare(right, "en"));
  const generatedPaths = [
    ...HTML_PATHS,
    "derived/projection-map.json",
  ].sort((left, right) => left.localeCompare(right, "en"));
  const captureToolchainPaths = [...CANDIDATE_CAPTURE_TOOLCHAIN_PATHS]
    .sort((left, right) => left.localeCompare(right, "en"));
  const inputs = {
    active_contracts: contractPaths.map((relativePath) => ({
      scope: "active-contract",
      ...hashRecord(roots.contractPackageRoot, relativePath),
    })),
    generated_html: generatedPaths.map((relativePath) => ({
      scope: "generated",
      ...hashRecord(roots.packageRoot, relativePath),
    })),
    registered_source_assets: sourceAssetPaths.map((relativePath) => ({
      scope: "source-asset",
      ...hashRecord(roots.contractPackageRoot, relativePath),
    })),
    capture_toolchain: captureToolchainPaths.map((relativePath) => ({
      scope: "toolchain",
      ...hashRecord(roots.toolchainRoot, relativePath),
    })),
  };
  const fingerprint = canonicalRasterCandidateFingerprint(inputs);
  if (canonicalRasterManifest.manifest.candidate_fingerprint?.algorithm !== fingerprint.algorithm) {
    throw new Error("canonical raster manifest содержит неизвестный алгоритм candidate_fingerprint");
  }
  return fingerprint;
}

function validateCandidateFingerprint(value, expected, label, issues) {
  if (
    !exactObjectKeys(value, ["algorithm", "sha256", "inputs"]) ||
    value.algorithm !== expected.algorithm ||
    value.sha256 !== expected.sha256 ||
    canonicalJson(value.inputs) !== canonicalJson(expected.inputs)
  ) {
    issues.push(`${label} не совпадает с детерминированным отпечатком кандидата`);
  }
}

function validateCanonicalManifestLink(value, canonical, label, issues) {
  if (
    !exactObjectKeys(value, ["path", "sha256"]) ||
    value.path !== canonical.path ||
    value.sha256 !== canonical.sha256
  ) {
    issues.push(`${label} не ссылается на точный canonical raster manifest`);
  }
}

function checkPassed(check) {
  return check && check.passed === true;
}

function validateRuntimeChecks(checks, label, issues) {
  if (!exactObjectKeys(checks, ["behavior", "accessibility", "geometry", "network"])) {
    issues.push(`${label}: checks должен содержать behavior/accessibility/geometry/network`);
    return { consoleErrors: 1, pageErrors: 1, networkAttempts: 1, failures: 1 };
  }
  const behavior = checks.behavior;
  const accessibility = checks.accessibility;
  const geometry = checks.geometry;
  const network = checks.network;
  if (!exactObjectKeys(behavior, ["passed"]) || !checkPassed(behavior)) {
    issues.push(`${label}: поведенческая проверка не чистая`);
  }
  if (
    !exactObjectKeys(accessibility, ["passed", "axe_violation_count"]) ||
    !checkPassed(accessibility) || !Number.isInteger(accessibility.axe_violation_count) ||
    accessibility.axe_violation_count !== 0
  ) {
    issues.push(`${label}: проверка доступности не чистая`);
  }
  if (
    !exactObjectKeys(geometry, ["passed"]) || !checkPassed(geometry)
  ) {
    issues.push(`${label}: проверка геометрии не чистая`);
  }
  if (
    !exactObjectKeys(network, ["passed", "network_attempts", "console_errors", "page_errors"]) ||
    !checkPassed(network) || !Array.isArray(network.network_attempts) ||
    network.network_attempts.length !== 0 || !Array.isArray(network.console_errors) ||
    network.console_errors.length !== 0 || !Array.isArray(network.page_errors) ||
    network.page_errors.length !== 0
  ) {
    issues.push(`${label}: контекстная защита сети не подтверждена`);
  }
  return {
    consoleErrors: Array.isArray(network?.console_errors) ? network.console_errors.length : 1,
    pageErrors: Array.isArray(network?.page_errors) ? network.page_errors.length : 1,
    networkAttempts: Array.isArray(network?.network_attempts) ? network.network_attempts.length : 1,
    failures: [behavior, accessibility, geometry, network].filter((item) => !checkPassed(item)).length,
  };
}

function validateBrowserReport({ roots, matrix, canonical, fingerprint, report, issues }) {
  if (!report) return;
  const context = matrix.context;
  if (!exactObjectKeys(report, BROWSER_REPORT_KEYS)) {
    issues.push("browser-report.json содержит лишние или отсутствующие верхнеуровневые поля");
  }
  if (
    report.version !== EVIDENCE_REPORT_VERSION ||
    report.status !== "generated" ||
    report.deterministic_epoch !== FIXED_EPOCH ||
    !sameOrderedValues(report.active_state_ids, context.activeStateIds) ||
    !sameOrderedValues(report.active_contract_ids, context.activeContractIds) ||
    report.active_contracts_sha256 !== context.activeContractsSha256 ||
    report.mvp_scope !== "P1/P2"
  ) {
    issues.push("browser-report.json содержит неверные метаданные MVP");
  }
  validateCandidateFingerprint(report.candidate_fingerprint, fingerprint, "browser-report.json candidate_fingerprint", issues);
  validateCanonicalManifestLink(report.canonical_raster_manifest, canonical, "browser-report.json canonical_raster_manifest", issues);
  if (canonicalJson(report.renderer_profile) !== canonicalJson(canonical.manifest.renderer_profile)) {
    issues.push("browser-report.json не фиксирует профиль канонического рендерера");
  }
  if (canonicalJson(report.source_parity) !== canonicalJson(canonical.manifest.source_parity)) {
    issues.push("browser-report.json не фиксирует точный source parity канонического растра");
  }
  if (!exactObjectKeys(report.runtime_profile, EXPECTED_BROWSERS)) {
    issues.push("browser-report.json не содержит профили Chromium и WebKit");
  } else {
    for (const browser of EXPECTED_BROWSERS) {
      const profile = report.runtime_profile[browser];
      if (
        !exactObjectKeys(profile, ["browser", "browser_version", "launch_args", "runtime_check_only", "published_png", "retained_png", "network_guard_scope"]) ||
        profile.browser !== browser || typeof profile.browser_version !== "string" || profile.browser_version.length === 0 ||
        !Array.isArray(profile.launch_args) || profile.runtime_check_only !== true ||
        profile.published_png !== false || profile.retained_png !== false ||
        profile.network_guard_scope !== EVIDENCE_NETWORK_GUARD_SCOPE
      ) {
        issues.push(`browser-report.json содержит неверный runtime_profile ${browser}`);
      }
    }
  }
  if (!Array.isArray(report.runtime_results) || report.runtime_results.length !== matrix.runtimeCount) {
    issues.push(`browser-report.json должен содержать ровно ${matrix.runtimeCount} runtime_results`);
    return;
  }
  const expectedByKey = new Map(matrix.runtimeRecords.map((record) => [canonicalManifestRecordKey(record), record]));
  const canonicalByKey = new Map(canonical.records.map((record) => [canonicalManifestRecordKey(record), record]));
  const seen = new Set();
  const totals = { chromium: 0, webkit: 0, console_errors: 0, page_errors: 0, network_attempts: 0, failed_checks: 0 };
  for (const record of report.runtime_results) {
    const key = canonicalManifestRecordKey(record);
    const label = `runtime result ${key}`;
    const expected = expectedByKey.get(key);
    if (!exactObjectKeys(record, ["browser", "viewport", "state_id", "checks"])) {
      issues.push(`${label}: запись не должна содержать raster-output поля`);
      continue;
    }
    if (!expected) issues.push(`${label}: отсутствует в runtime_validation_matrix`);
    if (seen.has(key)) issues.push(`${label}: повторная запись`);
    seen.add(key);
    if (!EXPECTED_BROWSERS.includes(record.browser)) issues.push(`${label}: неизвестный браузер`);
    totals[record.browser] = (totals[record.browser] ?? 0) + 1;
    const result = validateRuntimeChecks(record.checks, label, issues);
    totals.console_errors += result.consoleErrors;
    totals.page_errors += result.pageErrors;
    totals.network_attempts += result.networkAttempts;
    totals.failed_checks += result.failures;
    if (record.browser === "webkit" && !canonicalByKey.has(key)) {
      issues.push(`${label}: WebKit runtime не имеет канонического PNG`);
    }
  }
  for (const expected of matrix.runtimeRecords) {
    if (!seen.has(canonicalManifestRecordKey(expected))) {
      issues.push(`browser-report.json не описывает runtime ${canonicalManifestRecordKey(expected)}`);
    }
  }
  const expectedTotals = {
    chromium_runtime_results: matrix.runtimeRecords.filter((record) => record.browser === "chromium").length,
    webkit_runtime_results: matrix.runtimeRecords.filter((record) => record.browser === "webkit").length,
    canonical_webkit_pngs: matrix.canonicalPngCount,
    console_errors: 0,
    page_errors: 0,
    network_attempts: 0,
    failed_checks: 0,
  };
  if (canonicalJson(report.totals) !== canonicalJson(expectedTotals) ||
    totals.chromium !== expectedTotals.chromium_runtime_results ||
    totals.webkit !== expectedTotals.webkit_runtime_results || totals.console_errors !== 0 ||
    totals.page_errors !== 0 || totals.network_attempts !== 0 || totals.failed_checks !== 0) {
    issues.push("browser-report.json содержит неверные итоги runtime-проверок");
  }
  if (
    report.network_policy?.guard_scope !== EVIDENCE_NETWORK_GUARD_SCOPE ||
    report.network_policy?.blocked_before_send !== true ||
    report.network_policy?.publication_requires_zero_attempts !== true ||
    !sameOrderedValues(report.network_policy?.external_protocols, ["http", "https", "ws", "wss"])
  ) {
    issues.push("browser-report.json не подтверждает контекстную защиту сети");
  }
}

function validateHashInventory(records, expectedPaths, targetRoot, label, issues) {
  const byPath = new Map(Array.isArray(records) ? records.map((record) => [record?.path, record]) : []);
  if (byPath.size !== expectedPaths.length || expectedPaths.some((item) => !byPath.has(item))) {
    issues.push(`${label} содержит неверный набор записей SHA-256`);
  }
  for (const relativePath of expectedPaths) {
    const record = byPath.get(relativePath);
    if (record) validateHashRecord(record, fileInside(targetRoot, relativePath, label), `${label} ${relativePath}`, issues);
  }
}

function validateAcceptanceReport({ roots, matrix, canonical, fingerprint, report, browserReport, issues }) {
  if (!report) return;
  const context = matrix.context;
  if (!exactObjectKeys(report, ACCEPTANCE_REPORT_KEYS)) {
    issues.push("acceptance-report.json содержит лишние или отсутствующие верхнеуровневые поля");
  }
  if (
    report.version !== EVIDENCE_REPORT_VERSION ||
    report.status !== "owner-approved-prototype" ||
    report.deterministic_epoch !== FIXED_EPOCH ||
    report.result !== "conditional_pass_with_tooling_limitation" ||
    !sameOrderedValues(report.active_state_ids, context.activeStateIds) ||
    !sameOrderedValues(report.active_contract_ids, context.activeContractIds) ||
    report.active_contracts_sha256 !== context.activeContractsSha256 ||
    report.mvp_scope !== "P1/P2" ||
    report.state_count !== context.activeStateIds.length || report.evidence_file_count !== matrix.fileCount ||
    report.canonical_webkit_png_count !== matrix.canonicalPngCount || report.runtime_check_count !== matrix.runtimeCount
  ) {
    issues.push("acceptance-report.json содержит неверные метаданные MVP");
  }
  validateCandidateFingerprint(report.candidate_fingerprint, fingerprint, "acceptance-report.json candidate_fingerprint", issues);
  validateCanonicalManifestLink(report.canonical_raster_manifest, canonical, "acceptance-report.json canonical_raster_manifest", issues);
  if (canonicalJson(report.renderer_profile) !== canonicalJson(canonical.manifest.renderer_profile)) {
    issues.push("acceptance-report.json не фиксирует профиль канонического рендерера");
  }
  if (canonicalJson(report.source_parity) !== canonicalJson(canonical.manifest.source_parity)) {
    issues.push("acceptance-report.json не фиксирует точный source parity канонического растра");
  }
  if (!sameOrderedValues(report.status_messages, context.statusMessages)) {
    issues.push("acceptance-report.json не содержит две точные статусные реплики");
  }
  if (
    canonicalJson(report.timeline) !== canonicalJson(context.contracts.journey?.prototype_timeline)
  ) {
    issues.push("acceptance-report.json не содержит шкалу 600/7600/8000 мс");
  }
  validateHashInventory(report.documentation, DOCUMENTATION_PATHS, roots.contractPackageRoot, "документ", issues);
  validateHashInventory(report.evidence_toolchain, EVIDENCE_TOOLCHAIN_PATHS, roots.toolchainRoot, "инструмент evidence", issues);
  validateHashInventory(report.html_files, HTML_PATHS, roots.packageRoot, "HTML-файл", issues);
  validateHashInventory(report.canonical_contracts, context.activeContractPaths, roots.contractPackageRoot, "канонический договор", issues);
  if (report.active_contract_registry?.path !== "source/active-contracts.json") {
    issues.push("acceptance-report.json не содержит путь активного реестра");
  } else {
    validateHashRecord(report.active_contract_registry, context.activeContractsPath, "активный реестр договоров", issues);
  }
  if (report.package_manifest?.path !== "derived/prototype-package-manifest.json") {
    issues.push("acceptance-report.json содержит неверный путь манифеста прототипа");
  } else {
    validateHashRecord(report.package_manifest, path.join(roots.packageRoot, report.package_manifest.path), "манифест прототипа", issues);
  }
  if (report.browser_report?.path !== "evidence/browser-report.json") {
    issues.push("acceptance-report.json содержит неверный путь browser report");
  } else {
    validateHashRecord(report.browser_report, path.join(roots.evidenceRoot, "browser-report.json"), "browser report", issues);
  }
  if (browserReport && report.browser_report?.sha256 && report.browser_report.sha256 !== sha256File(path.join(roots.evidenceRoot, "browser-report.json"))) {
    issues.push("acceptance-report.json не связывает точный browser report");
  }
}

function collectPackageFiles(packageRoot, relativeDirectory) {
  const directory = path.join(packageRoot, relativeDirectory);
  if (!fs.existsSync(directory)) return [];
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort(
      (left, right) => left.name.localeCompare(right.name, "en"),
    )) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isFile()) files.push(toPosix(path.relative(packageRoot, target)));
    }
  };
  walk(directory);
  return files.sort((left, right) => left.localeCompare(right, "en"));
}

function validateActiveOutputSafety(roots, matrix, canonical, fingerprint, issues) {
  const contracts = matrix.context.contracts;
  const outputs = contracts.package?.outputs;
  const fixed = Array.isArray(outputs?.fixed) ? outputs.fixed : [];
  const svgWrapper = outputs?.svg_wrapper;
  const stateFiles = matrix.context.activeStateIds.flatMap((stateId) => [
    svgWrapper?.raster_png_path_format?.replace("{state_id}", stateId),
    svgWrapper?.svg_path_format?.replace("{state_id}", stateId),
  ]);
  const expectedDerived = [...fixed, ...stateFiles]
    .filter((item) => typeof item === "string" && item.startsWith("derived/"))
    .sort((left, right) => left.localeCompare(right, "en"));
  const actualDerived = collectPackageFiles(roots.packageRoot, "derived");
  if (!sameOrderedValues(actualDerived, expectedDerived)) {
    issues.push("каталог derived содержит неактивные или отсутствующие выходы MVP");
  }
  for (const relativePath of [...HTML_PATHS, ...fixed.filter((item) => item.startsWith("derived/"))]) {
    try {
      const target = fileInside(roots.packageRoot, relativePath, "активный выход");
      canonicalExistingFile(target, `активный выход ${relativePath}`);
      if (/\.svg$/iu.test(relativePath)) {
        validateSvgTextSafety(fs.readFileSync(target, "utf8"), relativePath, issues);
      } else if (/\.(?:html|js|css|json)$/iu.test(relativePath)) {
        const text = fs.readFileSync(target, "utf8");
        if (relativePath === "derived/canonical-raster-manifest.json") {
          validateStructuredCaptureMetadataTextSafety(
            text,
            relativePath,
            ["renderer_profile", "capture_transport", "origin"],
            issues,
          );
        } else if (relativePath === "derived/prototype-package-manifest.json") {
          validateStructuredCaptureMetadataTextSafety(
            text,
            relativePath,
            ["generation", "renderer_profile", "capture_transport", "origin"],
            issues,
          );
        } else {
          validateNoLocalPathsInText(text, relativePath, issues);
          for (const pattern of FORBIDDEN_ACTIVE_OUTPUT_PATTERNS) {
            if (pattern.test(text)) issues.push(`${relativePath} содержит запрещённый фрагмент ${pattern}`);
          }
        }
      }
    } catch (error) {
      issues.push(`${relativePath}: ${error instanceof Error ? error.message : "не прочитан"}`);
    }
  }
  const prototypeManifestPath = path.join(roots.packageRoot, "derived/prototype-package-manifest.json");
  if (fs.existsSync(prototypeManifestPath)) {
    try {
      const prototypeManifest = readJson(prototypeManifestPath, "манифест прототипа повреждён");
      if (fingerprint && canonicalJson(prototypeManifest.candidate_fingerprint) !== canonicalJson(fingerprint)) {
        issues.push("манифест прототипа не содержит точный candidate_fingerprint");
      }
      if (
        canonical &&
        (prototypeManifest.generation?.canonical_raster_manifest?.path !== canonical.path ||
          prototypeManifest.generation?.canonical_raster_manifest?.sha256 !== canonical.sha256)
      ) {
        issues.push("манифест прототипа не связывает точный canonical raster manifest");
      }
      if (
        canonical &&
        canonicalJson(prototypeManifest.generation?.renderer_profile) !==
          canonicalJson(canonical.manifest.renderer_profile)
      ) {
        issues.push("манифест прототипа не фиксирует точный профиль канонического рендерера");
      }
    } catch (error) {
      issues.push(`манифест прототипа: ${error instanceof Error ? error.message : "не прочитан"}`);
    }
  }
  const archivePath = path.join(roots.packageRoot, contracts.package?.archive?.path ?? "");
  try {
    canonicalExistingFile(archivePath, "переносимый ZIP-архив");
    const members = readStoredZip(fs.readFileSync(archivePath));
    const memberPaths = [...members.keys()].sort((left, right) => left.localeCompare(right, "en"));
    const expectedMembers = [...(contracts.package?.archive?.members ?? [])].sort(
      (left, right) => left.localeCompare(right, "en"),
    );
    if (!sameOrderedValues(memberPaths, expectedMembers)) {
      issues.push("ZIP-архив содержит неверный состав файлов MVP");
    }
    const archiveManifest = JSON.parse(members.get("manifest.json")?.toString("utf8") ?? "");
    if (
      contracts.package?.archive?.candidate_fingerprint_required !== true ||
      !fingerprint ||
      canonicalJson(archiveManifest?.candidate_fingerprint) !== canonicalJson(fingerprint)
    ) {
      issues.push("манифест ZIP не содержит точный candidate_fingerprint");
    }
    for (const [memberPath, bytes] of members) {
      if (/\.(?:html|js|css|json|md)$/iu.test(memberPath)) {
        const text = bytes.toString("utf8");
        validateNoLocalPathsInText(text, `ZIP ${memberPath}`, issues);
        for (const pattern of FORBIDDEN_ACTIVE_OUTPUT_PATTERNS) {
          if (pattern.test(text)) issues.push(`ZIP ${memberPath} содержит запрещённый фрагмент ${pattern}`);
        }
      }
    }
  } catch (error) {
    issues.push(`переносимый ZIP-архив повреждён: ${error instanceof Error ? error.message : "не прочитан"}`);
  }
}

function readEvidenceReports(roots, issues) {
  const result = {};
  for (const [key, filename] of [["browser", "browser-report.json"], ["acceptance", "acceptance-report.json"]]) {
    const target = path.join(roots.evidenceRoot, filename);
    if (!fs.existsSync(target)) continue;
    try {
      canonicalExistingFile(target, filename);
      const text = fs.readFileSync(target, "utf8");
      validateStructuredCaptureMetadataTextSafety(
        text,
        filename,
        ["renderer_profile", "capture_transport", "origin"],
        issues,
      );
      result[key] = JSON.parse(text);
    } catch (error) {
      issues.push(`${filename} повреждён: ${error instanceof Error ? error.message : "не прочитан"}`);
    }
  }
  return result;
}

function normalizeValidateOptions(rootOrOptions, legacyOptions) {
  if (typeof rootOrOptions === "string") {
    return {
      // Compatibility mode treats the positional root as the candidate's
      // contracts/package root; executable tooling stays in this process'
      // checked-out workspace unless explicitly overridden.
      toolchainRoot: legacyOptions.toolchainRoot ?? process.cwd(),
      contractRoot: legacyOptions.contractRoot ?? rootOrOptions,
      packageRoot: legacyOptions.packageRoot ?? path.join(rootOrOptions, PACKAGE_PATH),
      evidenceRoot: legacyOptions.evidenceRoot,
      allowActivePackage: legacyOptions.allowActivePackage ?? true,
      requireCandidate: legacyOptions.requireCandidate ?? false,
    };
  }
  return { ...rootOrOptions };
}

export function validateEvidencePackage(rootOrOptions = process.cwd(), legacyOptions = {}) {
  const issues = [];
  let roots;
  let matrix;
  try {
    roots = resolveEvidenceRoots(normalizeValidateOptions(rootOrOptions, legacyOptions));
    matrix = buildEvidenceMatrix({ contractRoot: roots.contractRoot });
    const contractIssues = validateContracts(roots.contractRoot, matrix.context.contracts);
    if (contractIssues.length > 0) {
      issues.push(`канонические договоры не прошли проверку: ${contractIssues.join("; ")}`);
    }
  } catch (error) {
    return [error instanceof Error ? error.message : "корни или договоры evidence не прочитаны"];
  }
  let canonical = null;
  try {
    canonical = readCanonicalRasterManifest({ roots, matrix });
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "canonical raster manifest не прочитан");
  }
  let fingerprint = null;
  if (canonical) {
    try {
      fingerprint = buildCandidateFingerprint({ roots, matrix, canonicalRasterManifest: canonical });
      if (canonicalJson(canonical.manifest.candidate_fingerprint) !== canonicalJson(fingerprint)) {
        issues.push("canonical raster manifest не содержит точный candidate_fingerprint");
      }
    } catch (error) {
      issues.push(error instanceof Error ? error.message : "candidate_fingerprint не рассчитан");
    }
  }
  const expectedPaths = matrix.paths;
  const actualPaths = collectEvidenceEntries(roots.evidenceRoot, issues);
  const expectedSet = new Set(expectedPaths);
  const actualSet = new Set(actualPaths);
  if (actualPaths.length !== expectedPaths.length) {
    issues.push(`evidence-пакет должен содержать ровно ${expectedPaths.length} файла, найдено ${actualPaths.length}`);
  }
  for (const expectedPath of expectedPaths) if (!actualSet.has(expectedPath)) issues.push(`отсутствует обязательный evidence-файл: ${expectedPath}`);
  for (const actualPath of actualPaths) {
    if (!expectedSet.has(actualPath)) issues.push(`лишний evidence-файл: ${actualPath}`);
    if (actualPath.includes("/chromium/") || actualPath.startsWith("evidence/screenshots/chromium")) {
      issues.push(`Chromium PNG запрещён в evidence: ${actualPath}`);
    }
  }
  for (const relativePath of actualPaths.filter((item) => item.endsWith(".png"))) {
    try {
      const target = evidenceFilePath(roots, relativePath);
      canonicalExistingFile(target, relativePath);
      readPngDimensions(target);
      const text = fs.readFileSync(target).toString("utf8");
      validateNoLocalPathsInText(text, relativePath, issues);
      validateForbiddenText(text, relativePath, issues);
    } catch (error) {
      issues.push(`${relativePath}: ${error instanceof Error ? error.message : "PNG не прочитан"}`);
    }
  }
  const reports = readEvidenceReports(roots, issues);
  if (canonical && fingerprint) {
    validateBrowserReport({ roots, matrix, canonical, fingerprint, report: reports.browser, issues });
    validateAcceptanceReport({ roots, matrix, canonical, fingerprint, report: reports.acceptance, browserReport: reports.browser, issues });
  }
  validateActiveOutputSafety(roots, matrix, canonical, fingerprint, issues);
  return issues;
}

/**
 * Publishes only a separately staged evidence directory for a separately
 * supplied candidate package. The active package is rejected before rename.
 */
export function publishEvidenceAtomically({
  toolchainRoot = process.cwd(),
  contractRoot = toolchainRoot,
  packageRoot,
  evidenceRoot,
  stagingRoot,
} = {}) {
  if (!stagingRoot) throw new Error("для публикации нужен stagingRoot");
  const roots = resolveEvidenceRoots({
    toolchainRoot,
    contractRoot,
    packageRoot,
    evidenceRoot,
    requireCandidate: true,
    allowActivePackage: false,
  });
  const canonicalStagingRoot = canonicalExistingDirectory(stagingRoot, "stagingRoot");
  if (canonicalStagingRoot === roots.evidenceRoot || !isContained(roots.packageRoot, canonicalStagingRoot)) {
    throw new Error("stagingRoot должен быть отдельным каталогом внутри candidate packageRoot");
  }
  const issues = validateEvidencePackage({
    toolchainRoot: roots.toolchainRoot,
    contractRoot: roots.contractRoot,
    packageRoot: roots.packageRoot,
    evidenceRoot: canonicalStagingRoot,
    requireCandidate: true,
  });
  if (issues.length > 0) throw new Error(`staging evidence не прошёл проверку:\n- ${issues.join("\n- ")}`);
  const targetRoot = roots.evidenceRoot;
  const parent = path.dirname(targetRoot);
  fs.mkdirSync(parent, { recursive: true });
  const hadTarget = fs.existsSync(targetRoot);
  const backupRoot = hadTarget
    ? path.join(parent, `.${path.basename(targetRoot)}-backup-${process.pid}-${Date.now()}`)
    : null;
  try {
    if (backupRoot) fs.renameSync(targetRoot, backupRoot);
    fs.renameSync(canonicalStagingRoot, targetRoot);
    const postIssues = validateEvidencePackage({
      toolchainRoot: roots.toolchainRoot,
      contractRoot: roots.contractRoot,
      packageRoot: roots.packageRoot,
      evidenceRoot: targetRoot,
      requireCandidate: true,
    });
    if (postIssues.length > 0) throw new Error(`опубликованный evidence не прошёл проверку:\n- ${postIssues.join("\n- ")}`);
    if (backupRoot) fs.rmSync(backupRoot, { recursive: true, force: true });
  } catch (error) {
    if (backupRoot && fs.existsSync(backupRoot)) {
      if (fs.existsSync(targetRoot)) {
        const failedRoot = path.join(
          parent,
          `.${path.basename(targetRoot)}-failed-${process.pid}-${Date.now()}`,
        );
        fs.renameSync(targetRoot, failedRoot);
      }
      fs.renameSync(backupRoot, targetRoot);
    }
    throw error;
  }
}

function isDirectExecution() {
  return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isDirectExecution()) {
  const issues = validateEvidencePackage(process.cwd());
  if (issues.length > 0) {
    for (const issue of issues) console.error(`ERROR: ${issue}`);
    process.exit(1);
  }
  const inventory = expectedEvidenceInventory(process.cwd());
  console.log(`presentation link Lisa evidence valid: ${inventory.fileCount} files`);
}
