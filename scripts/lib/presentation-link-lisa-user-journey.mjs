import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import opentype from "opentype.js";
import {
  renderLisaDemoApp,
  renderLisaDemoStyles,
} from "./presentation-link-lisa-html-runtime.mjs";
import {
  createStoredZip,
  readStoredZip,
} from "./documentation-archive.mjs";
import {
  CANONICAL_RASTER_CANDIDATE_COUNT,
  CANONICAL_RASTER_MANIFEST_RELATIVE_PATH,
  CANONICAL_RASTER_VIEWPORTS,
  buildCanonicalRasterManifest,
  canonicalRasterCandidateFingerprint,
  canonicalRasterExpectedPaths,
  canonicalRasterPath,
  captureCanonicalRasterSet,
  hasCanonicalCaptureToolWarnings,
  readCanonicalRasterManifest,
  stableCanonicalRasterJson,
  writeCanonicalRasterManifest,
} from "./presentation-link-lisa-canonical-raster.mjs";
export {
  CANONICAL_RASTER_CANDIDATE_COUNT,
  CANONICAL_RASTER_MANIFEST_RELATIVE_PATH,
  CANONICAL_RASTER_VIEWPORTS,
} from "./presentation-link-lisa-canonical-raster.mjs";

export const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
export const ACTIVE_CONTRACTS_PATH = `${PACKAGE_PATH}/source/active-contracts.json`;
export const CONTRACT_PATHS = Object.freeze({
  active: ACTIVE_CONTRACTS_PATH,
});
export const SCHEMA_PATHS = Object.freeze({
  active: `${PACKAGE_PATH}/source/schemas/active-contracts.schema.json`,
});
export const STATE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
export const FIXED_EPOCH = "2026-08-11T00:00:00Z";
export const BROWSER_SCREENSHOT_RENDERER = "playwright-webkit-page-screenshot";
export const PORTABLE_ARCHIVE_RELATIVE_PATH =
  "derived/lisa-presentation-user-journey-demo.zip";
export const FONT_RELATIVE_PATH =
  `${PACKAGE_PATH}/source/fonts/NotoSans[wdth,wght].ttf`;
export const FONT_LICENSE_RELATIVE_PATH = `${PACKAGE_PATH}/source/fonts/OFL.txt`;
export const EXPECTED_FONT_SHA256 =
  "bfb7bb691513f12e734dc346c03a03f784912432d7e3fa8e56efcf906fe86b3d";
const DEMO_ASSETS_DIRECTORY = "demo/assets";
const HTML_OUTPUT_PATHS = Object.freeze([
  "demo/index.html",
  "demo/app.js",
  "demo/styles.css",
  "demo/data.js",
]);
const FORBIDDEN_GENERATED_PATTERNS = Object.freeze([
  /mailto:/iu,
  /\bfetch\s*\(/iu,
  /\bXMLHttpRequest\b/u,
  /\bWebSocket\b/u,
  /\bforeignObject\b/iu,
  /\blisa-(?:notification|notifications|result|link|offline|access-denied)/iu,
  /\b(?:presentation-viewer|notification-center|result-link)\b/iu,
  /\b(?:pdf|pptx)\b/iu,
  /file:\/\//iu,
  /(?:^|[\s"'(])\/(?:Users|home|root|etc|var|private|opt|tmp)\//mu,
]);
const SAFE_PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const REQUIRED_TIMELINE = Object.freeze({
  generation_started_at_ms: 600,
  clock_animation_ends_at_ms: 7600,
  ready_at_ms: 8000,
});
const REQUIRED_COPY = Object.freeze({
  generation_started:
    "Презентация будет изготовлена и отправлена на электронную почту в течение 20 минут",
  presentation_sent: "Презентация отправлена на электронную почту",
});

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function absolute(root, relativePath) {
  return path.join(root, relativePath);
}

function packagePath(root, relativePath = "") {
  return path.join(root, PACKAGE_PATH, relativePath);
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function assertSafePackageRelativePath(relativePath, label = "путь") {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\0") ||
    relativePath.split("/").some((segment) => segment === "" || segment === "." || segment === "..") ||
    path.posix.normalize(relativePath) !== relativePath
  ) {
    throw new Error(`${label} небезопасен: ${String(relativePath)}`);
  }
}

function resolvePackagePath(root, relativePath, label) {
  assertSafePackageRelativePath(relativePath, label);
  const packageRoot = path.resolve(root, PACKAGE_PATH);
  const target = path.resolve(packageRoot, relativePath);
  if (!target.startsWith(`${packageRoot}${path.sep}`)) {
    throw new Error(`${label} выходит за границы пакета: ${relativePath}`);
  }
  return target;
}

function readJsonFile(filePath, label) {
  try {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error("не является обычным файлом");
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label}: ${error instanceof Error ? error.message : "не прочитан"}`);
  }
}

function readPackageJson(root, relativePath, label) {
  return readJsonFile(resolvePackagePath(root, relativePath, label), label);
}

export function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function sha256File(filePath) {
  return sha256Bytes(fs.readFileSync(filePath));
}

export function stableStringify(value, indentation = 2) {
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
  return `${JSON.stringify(normalize(value), null, indentation)}\n`;
}

export function parsePresentationLinkLisaValidationArguments(args) {
  const supported = new Set(["--saved-only"]);
  const unknown = args.filter((item) => !supported.has(item));
  if (unknown.length > 0) {
    throw new Error(`неизвестный аргумент проверки: ${unknown.join(", ")}`);
  }
  return { savedOnly: args.includes("--saved-only") };
}

export async function stabilizeBrowserCapture(page, policy) {
  await page.evaluate(async (capturePolicy) => {
    if (capturePolicy?.wait_for_document_fonts) await document.fonts.ready;
    if (
      capturePolicy?.focus_policy ===
        "capture-mode-suppress-then-blur-active-element" &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
    const count = Number.isInteger(capturePolicy?.settle_animation_frames)
      ? capturePolicy.settle_animation_frames
      : 2;
    await new Promise((resolve) => {
      let remaining = Math.max(1, count);
      const settle = () => {
        remaining -= 1;
        if (remaining <= 0) resolve();
        else window.requestAnimationFrame(settle);
      };
      window.requestAnimationFrame(settle);
    });
  }, policy);
}

function formatAjvErrors(errors) {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ");
}

function validateJsonSchema(root, schemaRelativePath, value, label, issues) {
  try {
    const schema = readPackageJson(root, schemaRelativePath, `${label}: схема`);
    const ajv = new Ajv2020({
      allErrors: true,
      strict: true,
      strictRequired: false,
    });
    const validate = ajv.compile(schema);
    if (!validate(value)) {
      issues.push(`${label}: ${formatAjvErrors(validate.errors)}`);
    }
  } catch (error) {
    issues.push(error instanceof Error ? error.message : `${label}: схема недоступна`);
  }
}

function validateRegistryDescriptor(descriptor, label, issues) {
  if (!descriptor || typeof descriptor !== "object") {
    issues.push(`${label}: описание договора отсутствует`);
    return false;
  }
  if (typeof descriptor.id !== "string" || descriptor.id.length === 0) {
    issues.push(`${label}: неизвестная роль ${String(descriptor.id)}`);
    return false;
  }
  try {
    assertSafePackageRelativePath(descriptor.path, `${label}: путь`);
    assertSafePackageRelativePath(descriptor.schema, `${label}: схема`);
  } catch (error) {
    issues.push(error.message);
    return false;
  }
  if (!descriptor.path.startsWith("source/") || !descriptor.schema.startsWith("source/schemas/")) {
    issues.push(`${label}: договор и схема должны находиться в source/`);
    return false;
  }
  return true;
}

export function loadContracts(root = process.cwd()) {
  const registry = readPackageJson(root, "source/active-contracts.json", "реестр активных договоров");
  if (!Array.isArray(registry.active_contracts)) {
    throw new Error("реестр активных договоров не содержит active_contracts");
  }
  const contracts = { registry };
  const seen = new Set();
  for (const descriptor of registry.active_contracts) {
    if (!descriptor || typeof descriptor !== "object") {
      throw new Error("реестр активных договоров содержит повреждённое описание");
    }
    if (typeof descriptor.id !== "string" || descriptor.id.length === 0 || seen.has(descriptor.id)) {
      throw new Error(`реестр активных договоров содержит недопустимую роль: ${String(descriptor.id)}`);
    }
    assertSafePackageRelativePath(descriptor.path, "путь активного договора");
    contracts[descriptor.id] = readPackageJson(root, descriptor.path, `активный договор ${descriptor.id}`);
    seen.add(descriptor.id);
  }
  if (seen.size === 0) {
    throw new Error("реестр активных договоров не содержит договоров MVP");
  }
  Object.defineProperties(contracts, {
    __root: { value: root, enumerable: false },
    __descriptors: { value: registry.active_contracts, enumerable: false },
  });
  return contracts;
}

export function activeStateIds(contracts) {
  const stateIds = contracts?.registry?.active_state_ids;
  if (!Array.isArray(stateIds) || stateIds.length === 0) {
    throw new Error("реестр активных договоров не содержит active_state_ids");
  }
  if (
    new Set(stateIds).size !== stateIds.length ||
    stateIds.some((stateId) => typeof stateId !== "string" || !STATE_ID_PATTERN.test(stateId))
  ) {
    throw new Error("реестр активных договоров содержит недопустимые active_state_ids");
  }
  return [...stateIds];
}

function exactStringArray(value, expected) {
  return Array.isArray(value) && JSON.stringify(value) === JSON.stringify(expected);
}

function exactObjectKeys(value, expected) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort((left, right) => left.localeCompare(right, "en"))) ===
      JSON.stringify([...expected].sort((left, right) => left.localeCompare(right, "en")));
}

function hasRuntimeCaptureSupervision(value) {
  const diagnosticReport = value?.diagnostic_report;
  const postKillGroupExitConfirmation = value?.post_kill_group_exit_confirmation;
  return exactObjectKeys(value, [
    "browser_process_model",
    "browser_execution_order",
    "diagnostic_report",
    "page_timeout_ms",
    "browser_worker_timeout_ms",
    "graceful_cleanup_timeout_ms",
    "force_termination_after_graceful_cleanup",
    "force_termination_scope",
    "post_kill_group_exit_confirmation",
    "partial_browser_or_acceptance_reports_on_failure_allowed",
  ]) &&
    value.browser_process_model === "isolated-child-process-per-browser" &&
    exactStringArray(value.browser_execution_order, ["chromium", "webkit"]) &&
    exactObjectKeys(diagnosticReport, ["path", "must_be_gitignored", "published", "content"]) &&
    diagnosticReport.path === "test-results/presentation-link-lisa-user-journey/runtime-capture" &&
    diagnosticReport.must_be_gitignored === true &&
    diagnosticReport.published === false &&
    diagnosticReport.content === "deterministic-report-only" &&
    value.page_timeout_ms === 45_000 &&
    value.browser_worker_timeout_ms === 480_000 &&
    value.graceful_cleanup_timeout_ms === 5_000 &&
    value.force_termination_after_graceful_cleanup === true &&
    value.force_termination_scope === "isolated-child-process-group" &&
    exactObjectKeys(postKillGroupExitConfirmation, [
      "timeout_ms",
      "required_state",
      "timeout_state",
      "timeout_action",
    ]) &&
    postKillGroupExitConfirmation.timeout_ms === 5_000 &&
    postKillGroupExitConfirmation.required_state === "process-group-exited" &&
    postKillGroupExitConfirmation.timeout_state === "process-group-exit-unconfirmed" &&
    postKillGroupExitConfirmation.timeout_action === "fail-runtime-capture-and-rollback" &&
    value.partial_browser_or_acceptance_reports_on_failure_allowed === false;
}

function registeredSourceAssets(contracts) {
  return Array.isArray(contracts.package?.source_assets)
    ? contracts.package.source_assets
    : [];
}

function isRelativeRasterPath(value, directory) {
  return typeof value === "string" &&
    new RegExp(`^source/${directory}/[a-z0-9-]+\\.png$`, "u").test(value);
}

function activeRasterAssetPaths(contracts) {
  const bindings = Array.isArray(contracts["visual-basis"]?.state_bindings)
    ? contracts["visual-basis"].state_bindings
    : [];
  const paths = new Set();
  for (const binding of bindings) {
    if (isRelativeRasterPath(binding?.base_path, "bases")) paths.add(binding.base_path);
    for (const slot of Array.isArray(binding?.slots) ? binding.slots : []) {
      if (isRelativeRasterPath(slot?.visible_patch_path, "patches")) {
        paths.add(slot.visible_patch_path);
      }
    }
  }
  return [...paths].sort((left, right) => left.localeCompare(right, "en"));
}

function sourceAssetParts(sourcePath) {
  const match = typeof sourcePath === "string"
    ? /^source\/(bases|patches|fonts)\/([A-Za-z0-9\[\],-]+\.(?:png|ttf|txt))$/u.exec(sourcePath)
    : null;
  if (!match) {
    throw new Error(`исходный ресурс не может быть помещён в demo/assets: ${String(sourcePath)}`);
  }
  return { kind: match[1], fileName: match[2] };
}

function demoAssetPathFromSourcePath(sourcePath, runtimeAssets = null) {
  const { kind, fileName } = sourceAssetParts(sourcePath);
  const root = runtimeAssets?.demo_asset_root ?? `${DEMO_ASSETS_DIRECTORY}/`;
  return `${root}${kind}/${fileName}`;
}

function runtimeAssetPathFromSourcePath(sourcePath, runtimeAssets) {
  const { kind, fileName } = sourceAssetParts(sourcePath);
  const prefixes = {
    bases: runtimeAssets.base_path_prefix,
    patches: runtimeAssets.patch_path_prefix,
    fonts: runtimeAssets.font_path_prefix,
  };
  return `${prefixes[kind]}${fileName}`;
}

function sourcePathFromDemoAssetPath(demoAssetPath) {
  if (
    typeof demoAssetPath !== "string" ||
    !/^demo\/assets\/(?:bases|patches|fonts)\/[A-Za-z0-9\[\],-]+\.(?:png|ttf|txt)$/u.test(demoAssetPath)
  ) {
    throw new Error(`ресурс demo/assets имеет недопустимый путь: ${String(demoAssetPath)}`);
  }
  return `source/${demoAssetPath.slice("demo/assets/".length)}`;
}

function demoAssetPaths(contracts) {
  const runtimeAssets = runtimeAssetPolicy(contracts);
  const sourcePaths = [
    ...registeredSourceAssets(contracts).map((asset) => asset?.path),
    ...activeRasterAssetPaths(contracts),
  ];
  const paths = sourcePaths.map((sourcePath) => demoAssetPathFromSourcePath(sourcePath, runtimeAssets));
  if (new Set(paths).size !== paths.length) {
    throw new Error("активные ресурсы demo/assets повторяются");
  }
  return paths.sort((left, right) => left.localeCompare(right, "en"));
}

function runtimeAssetPolicy(contracts) {
  const policy = contracts.package?.raster_base_local_overlay?.runtime_assets;
  if (
    !exactObjectKeys(policy, [
      "demo_asset_root",
      "data_and_runtime_reference_prefix",
      "base_path_prefix",
      "patch_path_prefix",
      "font_path_prefix",
      "source_paths_runtime_dependency",
      "parent_directory_references_allowed",
    ]) ||
    policy.demo_asset_root !== "demo/assets/" ||
    policy.data_and_runtime_reference_prefix !== "assets/" ||
    policy.base_path_prefix !== "assets/bases/" ||
    policy.patch_path_prefix !== "assets/patches/" ||
    policy.font_path_prefix !== "assets/fonts/" ||
    policy.source_paths_runtime_dependency !== false ||
    policy.parent_directory_references_allowed !== false
  ) {
    throw new Error("договор пакета не фиксирует автономные ресурсы demo/assets для file://");
  }
  return policy;
}

function portableArchiveMembers(contracts) {
  const members = contracts.package?.archive?.members;
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error("договор пакета не содержит archive.members");
  }
  for (const member of members) assertSafePackageRelativePath(member, "член переносимого ZIP");
  return [...members];
}

function expectedPortableArchiveMembers(contracts) {
  const runtimeAssets = runtimeAssetPolicy(contracts);
  const bindings = Array.isArray(contracts["visual-basis"]?.state_bindings)
    ? contracts["visual-basis"].state_bindings
    : [];
  return [
    "README.md",
    "manifest.json",
    "demo/index.html",
    "demo/app.js",
    "demo/data.js",
    "demo/styles.css",
    ...registeredSourceAssets(contracts).map((asset) => demoAssetPathFromSourcePath(asset.path, runtimeAssets)),
    ...bindings.map((binding) => demoAssetPathFromSourcePath(binding.base_path, runtimeAssets)),
    ...bindings.flatMap((binding) =>
      (Array.isArray(binding.slots) ? binding.slots : [])
        .map((slot) => slot.visible_patch_path ? demoAssetPathFromSourcePath(slot.visible_patch_path, runtimeAssets) : null)
        .filter(Boolean),
    ),
  ];
}

function assertContractPngAsset(root, relativePath, sha256, dimensions, label) {
  if (!isRelativeRasterPath(relativePath, "bases") && !isRelativeRasterPath(relativePath, "patches")) {
    throw new Error(`${label}: путь PNG не входит в разрешённые bases/patches`);
  }
  if (typeof sha256 !== "string" || !/^[a-f0-9]{64}$/u.test(sha256)) {
    throw new Error(`${label}: не задан SHA-256`);
  }
  const target = resolvePackagePath(root, relativePath, `${label}: путь`);
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${label}: PNG должен быть обычным файлом`);
  }
  const bytes = fs.readFileSync(target);
  if (sha256Bytes(bytes) !== sha256) throw new Error(`${label}: SHA-256 PNG не совпадает с договором`);
  const actual = readPngDimensions(bytes, label);
  if (
    !dimensions ||
    !Number.isInteger(dimensions.width) ||
    !Number.isInteger(dimensions.height) ||
    dimensions.width <= 0 ||
    dimensions.height <= 0 ||
    actual.width !== dimensions.width ||
    actual.height !== dimensions.height
  ) {
    throw new Error(`${label}: размеры PNG не совпадают с договором`);
  }
  return { bytes, dimensions: actual };
}

function validateVisualBasisBindings(contracts, root = contracts.__root ?? process.cwd()) {
  const journey = contracts.journey;
  const basis = contracts["visual-basis"];
  const sourceCatalog = contracts["source-catalog"];
  const runtimeAssets = runtimeAssetPolicy(contracts);
  const registeredIds = activeStateIds(contracts);
  if (!basis || basis.rendering_pipeline !== "raster-base-local-overlay") {
    throw new Error("визуальный договор не задаёт raster-base-local-overlay");
  }
  const bindings = Array.isArray(basis.state_bindings) ? basis.state_bindings : [];
  if (!exactStringArray(bindings.map((binding) => binding?.state_id), registeredIds)) {
    throw new Error("визуальный договор должен задавать основы в порядке активного реестра");
  }
  const sourceById = new Map(
    (Array.isArray(sourceCatalog?.members) ? sourceCatalog.members : []).map((source) => [source?.id, source]),
  );
  const actionsById = new Map(
    (Array.isArray(journey?.actions) ? journey.actions : []).map((action) => [action?.id, action]),
  );
  const statesById = new Map(
    (Array.isArray(journey?.states) ? journey.states : []).map((state) => [state?.id, state]),
  );
  const interactions = Array.isArray(basis.interaction_slots) ? basis.interaction_slots : [];
  const interactionByKey = new Map();
  for (const interaction of interactions) {
    const key = `${interaction?.state_id}\u0000${interaction?.slot_id}`;
    if (interactionByKey.has(key)) throw new Error(`semantic slot повторён: ${key}`);
    interactionByKey.set(key, interaction);
  }
  const result = [];
  for (const binding of bindings) {
    const state = statesById.get(binding.state_id);
    const source = sourceById.get(binding.base_id);
    if (!state) throw new Error(`${binding.state_id}: отсутствует активное состояние`);
    if (!source || !["active-basis", "active-variant", "optional-branch"].includes(source.classification)) {
      throw new Error(`${binding.state_id}: base_id ${String(binding.base_id)} не относится к активному P1/P2`);
    }
    if (binding.render_mode !== "raster-base-local-overlay") {
      throw new Error(`${binding.state_id}: недопустимый режим отрисовки`);
    }
    assertContractPngAsset(root, binding.base_path, binding.base_sha256, binding.natural_dimensions, `${binding.state_id}: основа`);
    const slotIds = new Set();
    const slots = [];
    for (const slot of Array.isArray(binding.slots) ? binding.slots : []) {
      if (!slot || typeof slot.id !== "string" || slotIds.has(slot.id)) {
        throw new Error(`${binding.state_id}: semantic slot отсутствует или повторён`);
      }
      slotIds.add(slot.id);
      if (
        typeof slot.semantic_control_id !== "string" ||
        !slot.rect ||
        !Number.isInteger(slot.rect.x) ||
        !Number.isInteger(slot.rect.y) ||
        !Number.isInteger(slot.rect.width) ||
        !Number.isInteger(slot.rect.height) ||
        slot.rect.x < 0 || slot.rect.y < 0 || slot.rect.width <= 0 || slot.rect.height <= 0 ||
        slot.rect.x + slot.rect.width > binding.natural_dimensions.width ||
        slot.rect.y + slot.rect.height > binding.natural_dimensions.height
      ) {
        throw new Error(`${binding.state_id}: semantic slot ${slot.id} выходит за границы основы`);
      }
      const interaction = interactionByKey.get(`${binding.state_id}\u0000${slot.id}`) ?? null;
      if (interaction) {
        const action = actionsById.get(interaction.action_id);
        if (!action || !state.action_ids?.includes(action.id)) {
          throw new Error(`${binding.state_id}: action semantic slot не относится к состоянию`);
        }
      }
      let visiblePatch = null;
      if (slot.visible_patch_path !== null || slot.visible_patch_sha256 !== null) {
        const asset = assertContractPngAsset(
          root,
          slot.visible_patch_path,
          slot.visible_patch_sha256,
          { width: slot.rect.width, height: slot.rect.height },
          `${binding.state_id}: заплата ${slot.id}`,
        );
        visiblePatch = {
          src: runtimeAssetPathFromSourcePath(slot.visible_patch_path, runtimeAssets),
          sha256: slot.visible_patch_sha256,
          natural_dimensions: asset.dimensions,
        };
      }
      slots.push({
        id: slot.id,
        kind: slot.kind,
        semantic_control_id: slot.semantic_control_id,
        semantic_role: slot.semantic_role ?? null,
        rect: { ...slot.rect },
        action_id: interaction?.action_id ?? null,
        visible_patch: visiblePatch,
      });
    }
    for (const actionId of state.action_ids ?? []) {
      const found = slots.some((slot) => slot.action_id === actionId);
      if (!found) throw new Error(`${binding.state_id}: действие ${actionId} не имеет semantic slot`);
    }
    result.push({
      state_id: binding.state_id,
      base: {
        id: binding.base_id,
        src: runtimeAssetPathFromSourcePath(binding.base_path, runtimeAssets),
        sha256: binding.base_sha256,
        natural_dimensions: { ...binding.natural_dimensions },
      },
      slots,
      protected_regions: Array.isArray(binding.protected_regions) ? binding.protected_regions.map((region) => ({ ...region })) : [],
    });
  }
  return result;
}

function readSafePng(bytes, label) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 45 || !bytes.subarray(0, 8).equals(SAFE_PNG_SIGNATURE)) {
    throw new Error(`${label}: неверная сигнатура PNG`);
  }
  let offset = 8;
  const chunkTypes = [];
  let width = 0;
  let height = 0;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error(`${label}: повреждён PNG`);
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error(`${label}: повреждён PNG`);
    chunkTypes.push(type);
    if (type === "IHDR") {
      if (length !== 13) throw new Error(`${label}: неверный IHDR`);
      width = bytes.readUInt32BE(offset + 8);
      height = bytes.readUInt32BE(offset + 12);
    }
    offset = end;
    if (type === "IEND") break;
  }
  if (offset !== bytes.length || JSON.stringify(chunkTypes) !== JSON.stringify(["IHDR", "IDAT", "IEND"])) {
    throw new Error(`${label}: PNG содержит неразрешённые метаданные или чанки`);
  }
  if (width !== 390 || height !== 844) {
    throw new Error(`${label}: PNG должен иметь размер 390×844`);
  }
  return { width, height, chunkTypes };
}

function referencePngAsset(contracts, root = contracts.__root ?? process.cwd()) {
  const expectedPath = "source/components/lisa-external-visual-reference.png";
  const asset = registeredSourceAssets(contracts).find((item) => item?.path === expectedPath);
  if (!asset) {
    throw new Error("активный договор пакета не регистрирует безопасный PNG-визуал");
  }
  if (asset.usage !== "reference-only") {
    throw new Error("PNG-визуал должен иметь статус reference-only и не может быть содержимым демонстрации");
  }
  if (typeof asset.sha256 !== "string" || !/^[a-f0-9]{64}$/u.test(asset.sha256)) {
    throw new Error("безопасный PNG-визуал не содержит SHA-256");
  }
  const donor = Array.isArray(contracts.visual?.raster_donors)
    ? contracts.visual.raster_donors.find((item) => item?.path === "components/lisa-external-visual-reference.png")
    : undefined;
  if (!donor || donor.usage !== "reference-only" || donor.sha256 !== asset.sha256) {
    throw new Error("визуальный договор не подтверждает reference-only происхождение PNG-визуала");
  }
  const target = resolvePackagePath(root, expectedPath, "безопасный PNG-визуал");
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error("безопасный PNG-визуал должен быть обычным файлом");
  }
  const bytes = fs.readFileSync(target);
  if (sha256Bytes(bytes) !== asset.sha256) {
    throw new Error("SHA-256 безопасного PNG-визуала не совпадает с договором");
  }
  const png = readSafePng(bytes, "безопасный PNG-визуал");
  return { path: expectedPath, bytes, sha256: asset.sha256, ...png };
}

function activeContractRelativePaths(contracts) {
  return ["source/active-contracts.json", ...contracts.__descriptors.map((item) => item.path)];
}

function outputFixedPaths(contracts) {
  const fixed = contracts.package?.outputs?.fixed;
  if (!Array.isArray(fixed) || fixed.length === 0) {
    throw new Error("договор пакета не содержит фиксированные generated-выходы");
  }
  for (const item of fixed) assertSafePackageRelativePath(item, "фиксированный generated-путь");
  return [...fixed];
}

function interpolateStatePath(format, stateId, label) {
  if (
    typeof format !== "string" ||
    format.split("{state_id}").length !== 2 ||
    !STATE_ID_PATTERN.test(stateId)
  ) {
    throw new Error(`${label} не содержит единственный безопасный placeholder состояния`);
  }
  const result = format.replace("{state_id}", stateId);
  assertSafePackageRelativePath(result, label);
  return result;
}

function publishedRasterConfiguration(contracts) {
  const entry = contracts.package?.outputs?.published_raster_matrix?.[0];
  if (
    !entry ||
    entry.browser !== "webkit" ||
    entry.state_selection !== "all" ||
    entry.state_source !== "source/journey-contract.json#/states" ||
    !Array.isArray(entry.viewports) ||
    entry.viewports.length !== CANONICAL_RASTER_VIEWPORTS.length
  ) {
    throw new Error("договор пакета не задаёт единственную каноническую WebKit-матрицу");
  }
  const viewports = entry.viewports.map((item, index) => {
    const expected = CANONICAL_RASTER_VIEWPORTS[index];
    if (
      !item ||
      item.id !== expected.id ||
      item.width !== expected.width ||
      item.height !== expected.height ||
      typeof item.png_path_format !== "string"
    ) {
      throw new Error("договор пакета задаёт неверный viewport канонического растра");
    }
    return { ...item };
  });
  return { entry, viewports };
}

function svgWrapperConfiguration(contracts) {
  const wrapper = contracts.package?.outputs?.svg_wrapper;
  if (
    !wrapper ||
    wrapper.state_selection !== "all" ||
    wrapper.state_source !== "source/journey-contract.json#/states" ||
    wrapper.raster_viewport !== "mobile-390x844" ||
    wrapper.canonical_png_path_format !==
      "evidence/screenshots/webkit/mobile-390x844/{state_id}.png" ||
    typeof wrapper.raster_png_path_format !== "string" ||
    typeof wrapper.svg_path_format !== "string" ||
    wrapper.raster_png_byte_copy_of_canonical_required !== true ||
    wrapper.source_png_sha256_attribute !== "data-capture-sha256" ||
    wrapper.embedded_png_byte_equality_required !== true
  ) {
    throw new Error("договор пакета задаёт неверную связь PNG и SVG-обёртки");
  }
  return wrapper;
}

function canonicalRasterPathsForStates(contracts, states) {
  const { viewports } = publishedRasterConfiguration(contracts);
  const expected = [];
  for (const viewport of viewports) {
    for (const state of states) {
      expected.push(interpolateStatePath(viewport.png_path_format, state.id, "путь канонического PNG"));
    }
  }
  const byContract = expected.slice().sort((left, right) => left.localeCompare(right, "en"));
  const byRuntime = canonicalRasterExpectedPaths(states.map((state) => state.id));
  if (!exactStringArray(byContract, byRuntime)) {
    throw new Error("договор пакета задаёт неверные пути канонических PNG");
  }
  return byContract;
}

function generatedRelativePaths(contracts, states) {
  const wrapper = svgWrapperConfiguration(contracts);
  const paths = [
    ...outputFixedPaths(contracts),
    ...demoAssetPaths(contracts),
    ...canonicalRasterPathsForStates(contracts, states),
    ...states.flatMap((state) => [
      interpolateStatePath(wrapper.raster_png_path_format, state.id, "путь производного PNG"),
      interpolateStatePath(wrapper.svg_path_format, state.id, "путь SVG-обёртки"),
    ]),
  ].sort((left, right) => left.localeCompare(right, "en"));
  if (new Set(paths).size !== paths.length) {
    throw new Error("договор пакета задаёт повторяющиеся generated-пути");
  }
  return paths;
}

function validateLegacyContracts(root = process.cwd(), contracts = loadContracts(root)) {
  const issues = [];
  const registry = contracts.registry;
  validateJsonSchema(root, "source/schemas/active-contracts.schema.json", registry, "реестр активных договоров", issues);
  if (registry?.status !== "active") issues.push("реестр активных договоров должен быть active");
  const activeDescriptors = Array.isArray(registry?.active_contracts)
    ? registry.active_contracts
    : [];
  const activeDescriptorIds = activeDescriptors.map((item) => item?.id);
  if (
    activeDescriptorIds.length === 0 ||
    activeDescriptorIds.some((id) => typeof id !== "string" || id.length === 0) ||
    new Set(activeDescriptorIds).size !== activeDescriptorIds.length
  ) {
    issues.push("реестр активных договоров должен задавать неповторяющийся набор MVP");
  }
  for (const [index, descriptor] of activeDescriptors.entries()) {
    if (!validateRegistryDescriptor(descriptor, `active_contracts[${index}]`, issues)) continue;
    validateJsonSchema(root, descriptor.schema, contracts[descriptor.id], `договор ${descriptor.id}`, issues);
  }
  const inactive = Array.isArray(registry?.inactive_contracts)
    ? registry.inactive_contracts
    : [];
  if (inactive.some((item) => item?.id === "presentation-preview" && activeDescriptors.some((active) => active.path === item.path))) {
    issues.push("неактивный предпросмотр не может быть входом MVP");
  }
  if (!exactStringArray(contracts.scope?.implemented_priorities, ["P1", "P2"])) {
    issues.push("договор области должен ограничивать активный MVP приоритетами P1 и P2");
  }
  if (contracts.scope?.demonstration_context?.not_my_client_control_visible !== false) {
    issues.push("активный MVP не показывает управление «не мой клиент»");
  }
  let registeredStateIds = [];
  try {
    registeredStateIds = activeStateIds(contracts);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "реестр активных договоров не содержит состояния MVP");
  }
  const states = Array.isArray(contracts.journey?.states) ? contracts.journey.states : [];
  const stateIds = states.map((state) => state?.id);
  const forbiddenSurfaces = new Set([
    ...(Array.isArray(registry?.forbidden_active_surfaces)
      ? registry.forbidden_active_surfaces
      : []),
    ...(Array.isArray(contracts.scope?.forbidden_active_surfaces)
      ? contracts.scope.forbidden_active_surfaces
      : []),
  ]);
  for (const stateId of stateIds) {
    const surfaceId = String(stateId).replace(/^lisa-/u, "");
    if (forbiddenSurfaces.has(stateId) || forbiddenSurfaces.has(surfaceId)) {
      issues.push(
        `состояние ${stateId} запрещено: поверхность ${surfaceId} относится к P3/P4 и не входит в активный MVP`,
      );
    }
  }
  if (!exactStringArray(stateIds, registeredStateIds)) {
    issues.push(`договор пути должен содержать состояния из активного реестра: ${registeredStateIds.join(", ")}`);
  }
  if (contracts.journey?.initial_state_id !== registeredStateIds[0]) {
    issues.push("начальным состоянием MVP должно быть первое состояние активного реестра");
  }
  if (
    contracts.journey?.copy?.generation_started !== REQUIRED_COPY.generation_started
  ) {
    issues.push("договор пути содержит неточный первый статус подготовки");
  }
  if (
    contracts.journey?.copy?.presentation_sent !== REQUIRED_COPY.presentation_sent
  ) {
    issues.push("договор пути содержит неточный второй статус отправки");
  }
  if (
    JSON.stringify(contracts.journey?.prototype_timeline) !==
    JSON.stringify({ ...REQUIRED_TIMELINE, direct_state_autoplay: false })
  ) {
    issues.push("договор пути должен фиксировать шкалу 600–7600–8000 мс без автозапуска прямого состояния");
  }
  const searchCases = Array.isArray(contracts.journey?.client_search?.cases)
    ? contracts.journey.client_search.cases
    : [];
  const normalizedSearchCases = searchCases.map((entry) => ({
    query: entry?.query,
    target_state_id: entry?.target_state_id,
    candidate_ids: entry?.candidate_ids,
  }));
  if (
    JSON.stringify(normalizedSearchCases) !==
    JSON.stringify([
      {
        query: "7700000000",
        target_state_id: "lisa-materials",
        candidate_ids: ["client-dostovalova"],
      },
      {
        query: "Достовалова",
        target_state_id: "lisa-client-selection",
        candidate_ids: ["client-dostovalova", "client-dostovalova-trade"],
      },
      {
        query: "0000000000",
        target_state_id: "lisa-client-search",
        candidate_ids: [],
      },
    ])
  ) {
    issues.push("договор пути должен фиксировать три проверяемых исхода поиска клиента");
  }
  const frames = Array.isArray(contracts.frames?.frames) ? contracts.frames.frames : [];
  if (!exactStringArray(frames.map((frame) => frame?.state_id), registeredStateIds)) {
    issues.push("договор кадров должен содержать состояния из активного реестра MVP");
  }
  if (Array.isArray(contracts.visual?.components) && contracts.visual.components.some((component) => String(component?.source_svg ?? "").endsWith(".svg"))) {
    issues.push("активный MVP не должен подключать исходные SVG-компоненты");
  }
  try {
    referencePngAsset(contracts, root);
  } catch (error) {
    issues.push(error.message);
  }
  const archive = contracts.package?.archive;
  if (!archive || archive.path !== PORTABLE_ARCHIVE_RELATIVE_PATH) {
    issues.push("договор пакета содержит неверный путь переносимого ZIP");
  } else if (!exactStringArray(archive.members, expectedPortableArchiveMembers(contracts))) {
    issues.push("договор пакета содержит неверный состав переносимого ZIP");
  }
  try {
    const fixed = outputFixedPaths(contracts);
    if (!fixed.includes(CANONICAL_RASTER_MANIFEST_RELATIVE_PATH)) {
      throw new Error("фиксированные generated-выходы не содержат манифест канонического растра");
    }
    canonicalRasterPathsForStates(contracts, states);
    svgWrapperConfiguration(contracts);
    captureRendererProfilePolicy(contracts);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "договор пакета содержит неверный состав generated-выходов MVP");
  }
  const runtimeMatrix = contracts.package?.evidence_outputs?.runtime_validation_matrix;
  if (
    !Array.isArray(runtimeMatrix) ||
    !exactStringArray(runtimeMatrix.map((entry) => entry?.browser), ["chromium", "webkit"]) ||
    runtimeMatrix.some(
      (entry) =>
        entry?.state_selection !== "all" ||
        entry?.state_source !== "source/journey-contract.json#/states" ||
        entry?.published_png !== false ||
        entry?.retained_png !== false,
    )
  ) {
    issues.push("договор пакета содержит неверную матрицу runtime-проверки для всех активных состояний");
  }
  if (Array.isArray(contracts.package?.canonical_contracts)) {
    const expectedContractPaths = activeContractRelativePaths(contracts).filter((item) => item !== "source/active-contracts.json");
    if (!exactStringArray(contracts.package.canonical_contracts, expectedContractPaths)) {
      issues.push("договор пакета дублирует состав активных договоров неверно");
    }
  }
  for (const asset of registeredSourceAssets(contracts)) {
    try {
      assertSafePackageRelativePath(asset?.path, "путь исходного актива");
      if (!asset.path.startsWith("source/")) throw new Error("исходный актив находится вне source/");
      const assetPath = resolvePackagePath(root, asset.path, "путь исходного актива");
      const stat = fs.lstatSync(assetPath);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("исходный актив должен быть обычным файлом");
      if (typeof asset.sha256 !== "string" || sha256File(assetPath) !== asset.sha256) {
        throw new Error("SHA-256 исходного актива не совпадает с договором");
      }
      if (asset.path.endsWith(".svg")) throw new Error("исходный SVG не входит в активный MVP");
    } catch (error) {
      issues.push(`${String(asset?.path)}: ${error.message}`);
    }
  }
  return issues;
}

export function validateContracts(root = process.cwd(), contracts = loadContracts(root)) {
  const issues = [];
  const registry = contracts.registry;
  validateJsonSchema(root, "source/schemas/active-contracts.schema.json", registry, "реестр активных договоров", issues);
  if (registry?.status !== "active") issues.push("реестр активных договоров должен быть active");

  const descriptors = Array.isArray(registry?.active_contracts) ? registry.active_contracts : [];
  const descriptorIds = descriptors.map((descriptor) => descriptor?.id);
  const requiredDescriptorIds = [
    "scope",
    "fixture",
    "source-catalog",
    "journey",
    "frames",
    "visual",
    "visual-basis",
    "package",
  ];
  if (!exactStringArray(descriptorIds, requiredDescriptorIds)) {
    issues.push("реестр активных договоров задаёт неверный состав MVP");
  }
  for (const [index, descriptor] of descriptors.entries()) {
    if (!validateRegistryDescriptor(descriptor, `active_contracts[${index}]`, issues)) continue;
    validateJsonSchema(root, descriptor.schema, contracts[descriptor.id], `договор ${descriptor.id}`, issues);
  }

  if (!exactStringArray(contracts.scope?.implemented_priorities, ["P1", "P2"])) {
    issues.push("договор области должен ограничивать активный MVP приоритетами P1 и P2");
  }
  if (contracts.scope?.demonstration_context?.not_my_client_control_visible !== false) {
    issues.push("активный MVP не показывает управление «не мой клиент»");
  }

  let registeredStateIds = [];
  try {
    registeredStateIds = activeStateIds(contracts);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "реестр активных договоров не содержит состояния MVP");
  }
  const states = Array.isArray(contracts.journey?.states) ? contracts.journey.states : [];
  const stateIds = states.map((state) => state?.id);
  if (!exactStringArray(stateIds, registeredStateIds)) {
    issues.push("договор пути должен содержать состояния из активного реестра MVP");
  }
  if (contracts.journey?.initial_state_id !== registeredStateIds[0]) {
    issues.push("начальным состоянием MVP должно быть первое состояние активного реестра");
  }

  const forbiddenSurfaces = new Set([
    ...(Array.isArray(registry?.forbidden_active_surfaces) ? registry.forbidden_active_surfaces : []),
    ...(Array.isArray(contracts.scope?.forbidden_active_surfaces) ? contracts.scope.forbidden_active_surfaces : []),
  ]);
  for (const state of states) {
    const surfaceId = String(state?.id ?? "").replace(/^lisa-/u, "");
    if (
      forbiddenSurfaces.has(state?.id) ||
      forbiddenSurfaces.has(surfaceId) ||
      /(?:viewer|notification|result|link|offline|access-denied)/u.test(surfaceId)
    ) {
      issues.push(`состояние ${String(state?.id)} запрещено: поверхность относится к P3/P4 и не входит в активный MVP`);
    }
    if (!Array.isArray(state?.action_ids) || new Set(state.action_ids).size !== state.action_ids.length) {
      issues.push(`состояние ${String(state?.id)} содержит неверные действия`);
    }
  }

  const timeline = contracts.journey?.prototype_timeline;
  if (JSON.stringify(timeline) !== JSON.stringify({ ...REQUIRED_TIMELINE, direct_state_autoplay: false })) {
    issues.push("договор пути должен фиксировать шкалу 600–7600–8000 мс без автозапуска прямого состояния");
  }
  const copy = contracts.journey?.copy;
  const statesById = new Map(states.map((state) => [state?.id, state]));
  if (
    typeof copy?.generation_started !== "string" ||
    typeof copy?.presentation_sent !== "string" ||
    statesById.get("lisa-presentation-generating")?.body !== copy.generation_started ||
    statesById.get("lisa-presentation-sent")?.body !== copy.presentation_sent
  ) {
    issues.push("договор пути должен содержать две точные статусные реплики");
  }

  const expectedSearchCases = [
    { id: "single-client", query: "7700000000", target_state_id: "lisa-client-answer", candidate_ids: ["client-dostovalova"] },
    { id: "multiple-clients", query: "Достовалова", target_state_id: "lisa-client-selection-list", candidate_ids: ["client-dostovalova", "client-dostovalova-trade"] },
    { id: "no-client", query: "0000000000", target_state_id: "lisa-client-answer", candidate_ids: [] },
  ];
  const actualSearchCases = Array.isArray(contracts.journey?.client_search?.cases)
    ? contracts.journey.client_search.cases.map((entry) => ({
      id: entry?.id,
      query: entry?.query,
      target_state_id: entry?.target_state_id,
      candidate_ids: entry?.candidate_ids,
    }))
    : [];
  if (JSON.stringify(actualSearchCases) !== JSON.stringify(expectedSearchCases)) {
    issues.push("договор пути должен фиксировать три проверяемых исхода поиска клиента");
  }
  const candidates = Array.isArray(contracts.journey?.client_search?.candidates)
    ? contracts.journey.client_search.candidates
    : [];
  if (
    candidates.filter((candidate) => candidate?.relationship === "my").length !== 1 ||
    candidates.filter((candidate) => candidate?.relationship === "not-my").length !== 1 ||
    candidates.some((candidate) => !candidate?.id || !candidate?.display_name)
  ) {
    issues.push("договор пути должен содержать одного my и одного not-my клиента");
  }

  const actions = Array.isArray(contracts.journey?.actions) ? contracts.journey.actions : [];
  const actionIds = actions.map((action) => action?.id);
  if (new Set(actionIds).size !== actionIds.length || actionIds.some((id) => typeof id !== "string")) {
    issues.push("договор пути содержит повторяющиеся или неверные действия");
  }
  for (const state of states) {
    for (const actionId of state.action_ids ?? []) {
      if (!actionIds.includes(actionId)) issues.push(`${state.id}: действие ${actionId} не зарегистрировано`);
    }
  }
  for (const action of actions) {
    if (action?.id === "search-client" && action?.behavior === "submit-client-search") {
      continue;
    }
    if (action?.id === "order-presentation") {
      if (
        JSON.stringify(action.prototype_sequence) !==
        JSON.stringify([
          { state_id: "lisa-presentation-generating", at_ms: 600 },
          { state_id: "lisa-presentation-sent", at_ms: 8000 },
        ])
      ) {
        issues.push("заказ презентации должен иметь последовательность 600 и 8000 мс");
      }
    } else if (!registeredStateIds.includes(action?.target_state_id)) {
      issues.push(`действие ${String(action?.id)} ведёт вне активного MVP`);
    }
  }

  const frames = Array.isArray(contracts.frames?.frames) ? contracts.frames.frames : [];
  if (!exactStringArray(frames.map((frame) => frame?.state_id), registeredStateIds)) {
    issues.push("договор кадров должен содержать состояния из активного реестра MVP");
  }
  try {
    validateVisualBasisBindings(contracts, root);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "визуальный договор не проверен");
  }

  const archive = contracts.package?.archive;
  try {
    const expectedMembers = expectedPortableArchiveMembers(contracts);
    if (!exactStringArray(portableArchiveMembers(contracts), expectedMembers)) {
      issues.push("договор пакета содержит неверный состав archive.members");
    }
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "договор пакета не содержит archive.members");
  }
  if (!archive || archive.path !== PORTABLE_ARCHIVE_RELATIVE_PATH || archive.extra_members_allowed !== false) {
    issues.push("договор пакета содержит неверные правила переносимого ZIP");
  }

  try {
    const fixed = outputFixedPaths(contracts);
    if (!fixed.includes(CANONICAL_RASTER_MANIFEST_RELATIVE_PATH)) {
      throw new Error("фиксированные generated-выходы не содержат манифест канонического растра");
    }
    canonicalRasterPathsForStates(contracts, states);
    svgWrapperConfiguration(contracts);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "договор пакета содержит неверные generated-выходы");
  }

  const policy = contracts.package?.reproducibility?.canonical_raster_policy;
  if (
    policy?.engine !== "webkit" ||
    policy?.capture_method !== BROWSER_SCREENSHOT_RENDERER ||
    policy?.repeat_count !== 3 ||
    policy?.independence !== "separate-child-processes-and-browser-instances" ||
    policy?.comparison !== "exact-byte-equality" ||
    policy?.normalization !== "forbidden" ||
    policy?.mismatch_action !== "block" ||
    policy?.publish_after_all_repeats_match !== true ||
    Object.hasOwn(policy ?? {}, "retry_or_majority_selection")
  ) {
    issues.push("договор пакета ослабляет правило канонического WebKit-растра");
  }
  try {
    captureRendererProfilePolicy(contracts);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "договор пакета не фиксирует предупреждение WebKit");
  }
  if (!hasRuntimeCaptureSupervision(contracts.package?.reproducibility?.runtime_capture_supervision)) {
    issues.push("договор пакета содержит неверный надзор runtime-захвата браузеров");
  }
  const runtimeMatrix = contracts.package?.evidence_outputs?.runtime_validation_matrix;
  if (
    !Array.isArray(runtimeMatrix) ||
    !exactStringArray(runtimeMatrix.map((entry) => entry?.browser), ["chromium", "webkit"]) ||
    runtimeMatrix.some((entry) =>
      entry?.state_selection !== "all" ||
      entry?.state_source !== "source/journey-contract.json#/states" ||
      entry?.published_png !== false ||
      entry?.retained_png !== false,
    )
  ) {
    issues.push("договор пакета содержит неверную матрицу runtime-проверки");
  }

  for (const asset of registeredSourceAssets(contracts)) {
    try {
      assertSafePackageRelativePath(asset?.path, "путь исходного актива");
      if (!asset.path.startsWith("source/") || asset.path.endsWith(".svg")) {
        throw new Error("исходный актив не разрешён для активного MVP");
      }
      const target = resolvePackagePath(root, asset.path, "путь исходного актива");
      const stat = fs.lstatSync(target);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("исходный актив должен быть обычным файлом");
      if (typeof asset.sha256 !== "string" || sha256File(target) !== asset.sha256) {
        throw new Error("SHA-256 исходного актива не совпадает с договором");
      }
    } catch (error) {
      issues.push(`${String(asset?.path)}: ${error instanceof Error ? error.message : "не проверен"}`);
    }
  }
  return issues;
}

export function buildNormalizedModel(contracts, root = contracts.__root ?? process.cwd()) {
  const journey = contracts.journey;
  const registeredStateIds = activeStateIds(contracts);
  const visualBindings = validateVisualBasisBindings(contracts, root);
  const bindingByStateId = new Map(visualBindings.map((binding) => [binding.state_id, binding]));
  const sourceStates = new Map(journey.states.map((state) => [state.id, state]));
  const states = registeredStateIds.map((id) => {
    const source = sourceStates.get(id) ?? {};
    const binding = bindingByStateId.get(id);
    if (!binding) throw new Error(`${id}: отсутствует активная растровая основа`);
    const projection = {
      state_id: id,
      display_name: source.display_name ?? id,
      kind: source.kind ?? "lisa-chat",
      title: source.title ?? source.display_name ?? id,
      eyebrow: source.eyebrow ?? "Подготовка к встрече",
      body: source.body ?? "",
      action_ids: Array.isArray(source.action_ids) ? [...source.action_ids] : [],
      active_priorities: ["P1", "P2"],
      base: binding.base,
      slots: binding.slots,
      sequence:
        id === "lisa-presentation-generating"
          ? [REQUIRED_TIMELINE.generation_started_at_ms, REQUIRED_TIMELINE.clock_animation_ends_at_ms]
          : id === "lisa-presentation-sent"
            ? [REQUIRED_TIMELINE.ready_at_ms]
            : [],
    };
    return {
      id,
      display_name: projection.display_name,
      kind: projection.kind,
      title: projection.title,
      eyebrow: projection.eyebrow,
      body: projection.body,
      action_ids: projection.action_ids,
      base: binding.base,
      slots: binding.slots,
      projection,
      projection_sha256: sha256Bytes(stableStringify(projection)),
    };
  });
  return {
    version: "3.0.0",
    status: journey.status ?? "active",
    initial_state_id: registeredStateIds[0],
    states,
    copy: {
      search_placeholder: journey.copy.search_placeholder,
      search_no_results: journey.copy.search_no_results,
      generation_started: journey.copy.generation_started,
      presentation_sent: journey.copy.presentation_sent,
    },
    timeline: { ...REQUIRED_TIMELINE },
    search: {
      placeholder: journey.copy.search_placeholder,
      no_results: journey.copy.search_no_results,
      selection_prompt: journey.copy.selection_prompt,
      cases: journey.client_search.cases.map((entry) => ({
        id: entry.id,
        query: entry.query,
        target_state_id: entry.target_state_id,
        candidate_ids: [...entry.candidate_ids],
      })),
      candidates: journey.client_search.candidates.map((candidate) => ({
        id: candidate.id,
        display_name: candidate.display_name,
        holding: candidate.holding,
        relationship: candidate.relationship,
      })),
    },
    actions: journey.actions.map((action) => ({
      id: action.id,
      label: action.label,
      accessible_label: action.accessible_label,
      target_state_id: action.target_state_id ?? null,
      behavior: action.behavior,
      availability: action.availability ?? null,
      not_my_client_visibility: action.not_my_client_visibility ?? null,
      prototype_sequence: Array.isArray(action.prototype_sequence)
        ? action.prototype_sequence.map((entry) => ({ ...entry }))
        : null,
    })),
    visual_basis_sha256: sha256File(
      resolvePackagePath(root, "source/visual-basis-contract.json", "визуальный договор"),
    ),
  };
}

export function resolvePresentationBinding(material, binding) {
  let current = material;
  for (const segment of String(binding).split(".")) {
    if (["__proto__", "prototype", "constructor"].includes(segment)) return undefined;
    if (Array.isArray(current)) current = current.find((item) => item?.id === segment);
    else if (current && typeof current === "object" && Object.hasOwn(current, segment)) current = current[segment];
    else return undefined;
  }
  return current;
}

export function parseStateSearch(search, initialStateId, knownStateIds) {
  let params;
  try {
    params = new URLSearchParams(String(search).startsWith("?") ? String(search).slice(1) : String(search));
  } catch {
    return { ok: false, reason: "malformed-query" };
  }
  const values = params.getAll("state");
  if (values.length === 0) return { ok: true, stateId: initialStateId, explicit: false };
  if (values.length !== 1) return { ok: false, reason: "duplicate-state" };
  const stateId = values[0];
  if (!STATE_ID_PATTERN.test(stateId)) return { ok: false, reason: "malformed-state" };
  if (!knownStateIds.has(stateId)) return { ok: false, reason: "unknown-state" };
  return { ok: true, stateId, explicit: true };
}

export class LayoutError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "LayoutError";
    this.details = details;
  }
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export function createFontEngine(fontPath, expectedSha256 = null) {
  const bytes = fs.readFileSync(fontPath);
  const actualSha256 = sha256Bytes(bytes);
  if (expectedSha256 && actualSha256 !== expectedSha256) {
    throw new Error(`vendored font hash mismatch: expected ${expectedSha256}, received ${actualSha256}`);
  }
  const font = opentype.parse(toArrayBuffer(bytes));
  return {
    measure(text, fontSize, variation = { wght: 400, wdth: 100 }) {
      if (!Number.isFinite(fontSize) || fontSize <= 0) throw new LayoutError("font size must be positive");
      const glyphs = font.stringToGlyphs(String(text));
      let advance = 0;
      for (let index = 0; index < glyphs.length; index += 1) {
        const sourceGlyph = glyphs[index];
        const glyph = font.variation?.getTransform
          ? font.variation.getTransform(sourceGlyph, variation)
          : sourceGlyph;
        advance += ((glyph.advanceWidth ?? font.unitsPerEm) / font.unitsPerEm) * fontSize;
        if (glyphs[index + 1]) {
          advance += (font.getKerningValue(sourceGlyph, glyphs[index + 1]) / font.unitsPerEm) * fontSize;
        }
      }
      return advance;
    },
  };
}

export function measureVariableText(fontPath, text, fontSize, variation = { wght: 400, wdth: 100 }) {
  return createFontEngine(fontPath).measure(text, fontSize, variation);
}

export function wrapMeasuredText(fontEngine, text, options) {
  const width = options?.width;
  const fontSize = options?.fontSize;
  if (!Number.isFinite(width) || width <= 0) throw new LayoutError("wrap width must be positive");
  const words = String(text).trim().split(/\s+/u).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && fontEngine.measure(candidate, fontSize, options.variation) > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function validateLayoutBoxes(boxes, options = {}) {
  const issues = [];
  const width = options.width ?? Infinity;
  const height = options.height ?? Infinity;
  for (const box of boxes ?? []) {
    if (!Number.isFinite(box?.x) || !Number.isFinite(box?.y) || !Number.isFinite(box?.width) || !Number.isFinite(box?.height) || box.width < 0 || box.height < 0) {
      issues.push(`invalid layout box: ${box?.id ?? "unknown"}`);
      continue;
    }
    if (box.x < 0 || box.y < 0 || box.x + box.width > width || box.y + box.height > height) {
      issues.push(`layout box outside canvas: ${box.id ?? "unknown"}`);
    }
  }
  return issues;
}

export function validateSvgSecurity(svg, limits = {}) {
  const issues = [];
  const maxBytes = limits.component_max_bytes ?? 262144;
  if (Buffer.byteLength(String(svg), "utf8") > maxBytes) issues.push("SVG exceeds byte limit");
  const forbidden = ["script", "foreignObject", "iframe", "object", "embed", "animate", "set"];
  for (const name of forbidden) {
    if (new RegExp(`<\\s*${name}\\b`, "iu").test(String(svg))) issues.push(`SVG contains forbidden element: ${name}`);
  }
  if (/\bon\w+\s*=/iu.test(String(svg))) issues.push("SVG contains event handler");
  if (/\b(?:href|src)\s*=\s*["']\s*(?:https?:|file:|javascript:)/iu.test(String(svg))) issues.push("SVG contains external or executable reference");
  return issues;
}

export function validateInlineSvgComponentSecurity(svg, limits = {}) {
  return validateSvgSecurity(svg, limits);
}

export function assertLosslessPngPixels(beforeBytes, afterBytes, label = "PNG") {
  readSafePng(beforeBytes, `${label} before`);
  readSafePng(afterBytes, `${label} after`);
  if (!Buffer.from(beforeBytes).equals(Buffer.from(afterBytes))) {
    throw new Error(`${label}: PNG bytes differ`);
  }
}

function renderDemoIndex() {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; connect-src 'none'; font-src 'self'; form-action 'none'; frame-src 'none'; img-src 'self'; media-src 'none'; object-src 'none'; script-src 'self'; style-src 'self'; worker-src 'none'">
    <title>Лиса — заказ презентации</title>
    <link rel="stylesheet" href="styles.css">
    <script src="data.js" defer></script>
    <script src="app.js" defer></script>
  </head>
  <body>
    <div class="demo-shell">
      <section class="scene-stage" aria-label="Экран Лисы" tabindex="0">
        <div id="prototype-root"></div>
      </section>
    </div>
    <p id="prototype-live-region" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></p>
  </body>
</html>
`;
}

function buildHtmlOutputMap(model) {
  const data = {
    version: model.version,
    initial_state_id: model.initial_state_id,
    states: model.states.map((state) => ({
      id: state.id,
      display_name: state.display_name,
      title: state.title,
      eyebrow: state.eyebrow,
      body: state.body,
      action_ids: state.action_ids,
      base: state.base,
      slots: state.slots,
      projection_sha256: state.projection_sha256,
    })),
    copy: model.copy,
    timeline: model.timeline,
    search: model.search,
    actions: model.actions,
  };
  return new Map([
    ["index.html", renderDemoIndex()],
    ["styles.css", renderLisaDemoStyles()],
    ["data.js", `window.LISA_PROTOTYPE_DATA = Object.freeze(${stableStringify(data, 0).trimEnd()});\n`],
    ["app.js", renderLisaDemoApp()],
  ]);
}

function validateHtmlOutputMap(outputs) {
  const required = ["index.html", "app.js", "data.js", "styles.css"];
  if (!exactStringArray([...outputs.keys()].sort(), [...required].sort())) {
    throw new Error("HTML-кандидат содержит неверный состав файлов");
  }
  for (const [name, content] of outputs) {
    if (typeof content !== "string" || !content.endsWith("\n")) {
      throw new Error(`HTML-выход должен быть детерминированным текстом: ${name}`);
    }
    for (const pattern of FORBIDDEN_GENERATED_PATTERNS) {
      if (pattern.test(content)) throw new Error(`HTML-выход содержит запрещённый контент: ${name}`);
    }
  }
  if (!outputs.get("index.html").includes("Content-Security-Policy")) {
    throw new Error("HTML-выход не содержит CSP");
  }
  if (!outputs.get("index.html").includes("img-src 'self'")) {
    throw new Error("CSP HTML-выхода должен разрешать только локальные PNG");
  }
  const app = outputs.get("app.js");
  const css = outputs.get("styles.css");
  const data = outputs.get("data.js");
  if (!/data-prototype-scene/u.test(app) || !/data-source-base-id/u.test(app) || !/(?:element|createElement)\(\s*["']img["']/u.test(app)) {
    throw new Error("HTML-рантайм не создаёт контрактную растровую сцену");
  }
  if (
    /(?:^|[^\w-])\.phone(?![\w-])/mu.test(css) ||
    /\.phone-(?:header|content|composer)\b/u.test(css) ||
    /\.clock-(?:face|hand)\b/u.test(css) ||
    /className:\s*["']phone(?:["']|\s)/u.test(app)
  ) {
    throw new Error("HTML-выход содержит запрещённую ручную CSS-оболочку телефона");
  }
  if (/<\/?svg\b|data:image\/|\b(?:https?:|file:|javascript:)/iu.test(`${app}\n${data}\n${css}`)) {
    throw new Error("HTML-выход содержит неразрешённый источник изображения или ссылку");
  }
  if (/\.\.\//u.test(`${app}\n${data}\n${css}\n${outputs.get("index.html")}`)) {
    throw new Error("HTML-выход не должен содержать ссылок на родительский каталог");
  }
  const fontUrl = 'url("assets/fonts/NotoSans[wdth,wght].ttf")';
  const cssUrls = css.match(/url\([^)]*\)/gu) ?? [];
  if (cssUrls.some((value) => value !== fontUrl)) {
    throw new Error("CSS-выход содержит неразрешённую ссылку на ресурс");
  }
  const relativeSources = data.match(/assets\/(?:bases|patches)\/[a-z0-9-]+\.png/gu) ?? [];
  if (
    relativeSources.length === 0 ||
    relativeSources.some((value) => !/^assets\/(?:bases|patches)\/[a-z0-9-]+\.png$/u.test(value))
  ) {
    throw new Error("data.js содержит неразрешённый путь к автономному ресурсу demo/assets");
  }
}

function writeHtmlDirectory(targetDirectory, outputs) {
  fs.mkdirSync(targetDirectory, { recursive: true });
  for (const [name, content] of outputs) {
    fs.writeFileSync(path.join(targetDirectory, name), content, { encoding: "utf8", flag: "wx" });
  }
  const entries = fs.readdirSync(targetDirectory).sort((left, right) => left.localeCompare(right, "en"));
  const expected = [...outputs.keys()].sort((left, right) => left.localeCompare(right, "en"));
  if (!exactStringArray(entries, expected)) throw new Error("HTML-кандидат содержит лишние файлы");
}

function copyDemoAsset(sourceRoot, outputRoot, sourceRelativePath, demoRelativePath) {
  const source = packagePath(sourceRoot, sourceRelativePath);
  const target = packagePath(outputRoot, demoRelativePath);
  const sourceStat = fs.lstatSync(source);
  if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) {
    throw new Error(`активный ресурс demo/assets недоступен: ${sourceRelativePath}`);
  }
  const bytes = fs.readFileSync(source);
  if (path.resolve(source) === path.resolve(target)) return;
  ensureParent(target);
  fs.writeFileSync(target, bytes, { flag: "wx" });
  if (!bytes.equals(fs.readFileSync(target))) {
    throw new Error(`ресурс demo/assets не является побайтной копией source/: ${demoRelativePath}`);
  }
}

function copyDemoAssets(sourceRoot, outputRoot, contracts) {
  const runtimeAssets = runtimeAssetPolicy(contracts);
  const sourcePaths = [
    ...registeredSourceAssets(contracts).map((asset) => asset.path),
    ...activeRasterAssetPaths(contracts),
  ];
  for (const sourceRelativePath of sourcePaths) {
    copyDemoAsset(
      sourceRoot,
      outputRoot,
      sourceRelativePath,
      demoAssetPathFromSourcePath(sourceRelativePath, runtimeAssets),
    );
  }
}

function capturePolicy(contracts) {
  const configured = contracts.package?.reproducibility?.capture_stabilization;
  return {
    wait_for_document_fonts: configured?.wait_for_document_fonts ?? true,
    scroll_policy: "restore-marked-end-after-fonts",
    focus_policy: "capture-mode-suppress-then-blur-active-element",
    settle_animation_frames: configured?.settle_animation_frames ?? 2,
    explicit_screenshot_style_parameter_used:
      configured?.explicit_screenshot_style_parameter_used ?? false,
    playwright_internal_style_attempt_blocked_by_csp:
      configured?.playwright_internal_style_attempt_blocked_by_csp ?? true,
    browser_launch_args: configured?.browser_launch_args?.webkit ?? [],
  };
}

function captureRendererProfilePolicy(contracts) {
  const rendererProfile =
    contracts.package?.reproducibility?.canonical_raster_policy?.renderer_profile;
  if (!hasCanonicalCaptureToolWarnings(rendererProfile?.capture_tool_warnings)) {
    throw new Error("договор пакета не фиксирует единственное предупреждение Playwright CSP");
  }
  return {
    capture_tool_warnings: rendererProfile.capture_tool_warnings.map((warning) => ({ ...warning })),
  };
}

function captureTransport() {
  return {
    mode: "playwright-route-fulfilled-local-files",
    origin: "http://lisa.invalid",
    external_network_requests_allowed: false,
    path_escape_blocked: true,
  };
}

function readPngDimensions(bytes, label) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 24 || !bytes.subarray(0, 8).equals(SAFE_PNG_SIGNATURE)) {
    throw new Error(`${label}: неверная сигнатура PNG`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function hashCandidateInput(root, relativePath, scope) {
  const target = relativePath.startsWith("scripts/") || relativePath === "package.json"
    ? absolute(root, relativePath)
    : packagePath(root, relativePath);
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`кандидатный вход недоступен: ${relativePath}`);
  }
  return { scope, path: relativePath, bytes: stat.size, sha256: sha256File(target) };
}

function canonicalCandidateFingerprintFor(sourceRoot, outputRoot, contracts) {
  const contractPaths = [
    "source/active-contracts.json",
    ...contracts.__descriptors.map((item) => item.path),
    "source/schemas/active-contracts.schema.json",
    ...contracts.__descriptors.map((item) => item.schema),
  ].sort((left, right) => left.localeCompare(right, "en"));
  const assetPaths = [
    ...registeredSourceAssets(contracts).map((asset) => asset.path),
    ...activeRasterAssetPaths(contracts),
  ]
    .sort((left, right) => left.localeCompare(right, "en"));
  const toolchainPaths = [
    "package.json",
    "scripts/capture-presentation-link-lisa-derived-frames.mjs",
    "scripts/capture-presentation-link-lisa-runtime-evidence.mjs",
    "scripts/generate-presentation-link-lisa-user-journey.mjs",
    "scripts/lib/documentation-archive.mjs",
    "scripts/lib/presentation-link-lisa-canonical-raster.mjs",
    "scripts/lib/presentation-link-lisa-html-runtime.mjs",
    "scripts/lib/presentation-link-lisa-user-journey.mjs",
  ].sort((left, right) => left.localeCompare(right, "en"));
  const preRasterGeneratedPaths = [
    ...HTML_OUTPUT_PATHS,
    "derived/projection-map.json",
  ].sort((left, right) => left.localeCompare(right, "en"));
  return canonicalRasterCandidateFingerprint({
    active_contracts: contractPaths.map((item) => hashCandidateInput(sourceRoot, item, "active-contract")),
    generated_html: preRasterGeneratedPaths.map((item) => hashCandidateInput(outputRoot, item, "generated")),
    registered_source_assets: assetPaths.map((item) => hashCandidateInput(sourceRoot, item, "source-asset")),
    capture_toolchain: toolchainPaths.map((item) => hashCandidateInput(sourceRoot, item, "toolchain")),
  });
}

function captureHtmlFrames(sourceRoot, outputRoot, model, contracts, diagnosticRoot) {
  const candidateFingerprint = canonicalCandidateFingerprintFor(sourceRoot, outputRoot, contracts);
  const states = model.states.map((state) => ({
    id: state.id,
    projection_sha256: state.projection_sha256,
  }));
  const capture = captureCanonicalRasterSet({
    sourceRoot,
    diagnosticRoot,
    outputRoot,
    packageRelativePath: PACKAGE_PATH,
    captureScriptPath: path.join(sourceRoot, "scripts/capture-presentation-link-lisa-derived-frames.mjs"),
    demoPath: packagePath(outputRoot, "demo/index.html"),
    states,
    captureStabilization: capturePolicy(contracts),
    rendererProfilePolicy: captureRendererProfilePolicy(contracts),
    captureTransport: captureTransport(),
    candidateFingerprint,
  });
  const frames = new Map();
  for (const state of model.states) {
    const canonicalPath = canonicalRasterPath("mobile-390x844", state.id);
    const bytes = capture.frames.get(canonicalPath);
    if (!bytes) throw new Error(`канонический PNG для ${state.id} отсутствует`);
    const dimensions = readPngDimensions(bytes, `кадр ${state.id}`);
    if (dimensions.width !== 390 || dimensions.height !== 844) {
      throw new Error(`кадр ${state.id} имеет неверный размер`);
    }
    frames.set(state.id, bytes);
  }
  return { frames, canonicalManifest: capture.manifest, candidateFingerprint };
}

export function renderScreenSvg(state, model, assets = {}) {
  const bytes = assets.frames?.get(state.id) ?? assets.frame;
  if (!bytes) throw new Error(`для SVG-кадра отсутствует PNG состояния ${state.id}`);
  readPngDimensions(bytes, `SVG-кадр ${state.id}`);
  const captureSha256 = sha256Bytes(bytes);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844" data-render-source="approved-html-browser-capture" data-state-id="${state.id}" data-projection-sha256="${state.projection_sha256}" data-capture-sha256="${captureSha256}">
  <image x="0" y="0" width="390" height="844" href="data:image/png;base64,${Buffer.from(bytes).toString("base64")}"/>
</svg>
`;
}

function renderPortableArchiveReadme() {
  return Buffer.from(
    [
      "# Переносимая демонстрация заказа презентации в Лисе",
      "",
      "Распакуйте архив и откройте `demo/index.html` в браузере.",
      "",
      "Все данные синтетические. Сеть не нужна.",
      "",
    ].join("\n"),
    "utf8",
  );
}

function readPortableArchiveMember(sourceRoot, outputRoot, memberPath) {
  let target;
  if (memberPath.startsWith("demo/")) {
    target = packagePath(outputRoot, memberPath);
  } else {
    throw new Error(`неподдерживаемый член переносимого ZIP: ${memberPath}`);
  }
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`член переносимого ZIP должен быть обычным файлом: ${memberPath}`);
  }
  return fs.readFileSync(target);
}

function buildPortablePrototypeArchive(sourceRoot, outputRoot, contracts, candidateFingerprint) {
  if (!candidateFingerprint || typeof candidateFingerprint !== "object") {
    throw new Error("переносимый ZIP требует отпечаток кандидатной сборки");
  }
  const members = portableArchiveMembers(contracts);
  if (!exactStringArray(members, expectedPortableArchiveMembers(contracts))) {
    throw new Error("договор переносимого ZIP не соответствует активным PNG-ресурсам");
  }
  const payload = new Map();
  for (const member of members) {
    if (member === "README.md" || member === "manifest.json") continue;
    payload.set(member, readPortableArchiveMember(sourceRoot, outputRoot, member));
  }
  const manifest = Buffer.from(
    stableStringify({
      version: contracts.package?.archive?.manifest_version ?? "2.0.0",
      status: "generated",
      data_class: "internal",
      entrypoint: "demo/index.html",
      contract_fingerprint: {
        path: "source/active-contracts.json",
        sha256: sha256File(packagePath(sourceRoot, "source/active-contracts.json")),
      },
      candidate_fingerprint: candidateFingerprint,
      inventory: {
        members,
      },
      members: [...payload].map(([memberPath, content]) => ({
        path: memberPath,
        bytes: content.length,
        sha256: sha256Bytes(content),
      })),
    }),
    "utf8",
  );
  return createStoredZip(
    members.map((name) => ({
      name,
      content:
        name === "README.md"
          ? renderPortableArchiveReadme()
          : name === "manifest.json"
            ? manifest
            : payload.get(name),
    })),
  );
}

function sourceInputPaths(contracts) {
  const paths = new Set([
    ...activeContractRelativePaths(contracts),
    "source/schemas/active-contracts.schema.json",
    ...contracts.__descriptors.map((item) => item.schema),
    ...registeredSourceAssets(contracts).map((asset) => asset.path),
    ...activeRasterAssetPaths(contracts),
    "scripts/capture-presentation-link-lisa-derived-frames.mjs",
    "scripts/generate-presentation-link-lisa-user-journey.mjs",
    "scripts/lib/documentation-archive.mjs",
    "scripts/lib/presentation-link-lisa-canonical-raster.mjs",
    "scripts/lib/presentation-link-lisa-html-runtime.mjs",
    "scripts/lib/presentation-link-lisa-user-journey.mjs",
  ]);
  return [...paths].sort((left, right) => left.localeCompare(right, "en"));
}

function sourceInputRecord(sourceRoot, relativePath) {
  const target = relativePath.startsWith("scripts/")
    ? absolute(sourceRoot, relativePath)
    : packagePath(sourceRoot, relativePath);
  const stat = fs.statSync(target);
  return { path: relativePath, bytes: stat.size, sha256: sha256File(target) };
}

function manifestFor(sourceRoot, outputRoot, contracts, model, generatedPaths, canonicalManifest) {
  const outputs = generatedPaths
    .filter((item) => item !== "derived/prototype-package-manifest.json")
    .map((relativePath) => {
      const target = packagePath(outputRoot, relativePath);
      const stat = fs.statSync(target);
      return { path: relativePath, bytes: stat.size, sha256: sha256File(target) };
    })
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  return {
    version: "2.0.0",
    status: "generated",
    deterministic_epoch: FIXED_EPOCH,
    active_contract_registry: {
      path: "source/active-contracts.json",
      sha256: sha256File(packagePath(sourceRoot, "source/active-contracts.json")),
    },
    state_ids: model.states.map((state) => state.id),
    candidate_fingerprint: canonicalManifest.candidate_fingerprint,
    generation: {
      renderer: BROWSER_SCREENSHOT_RENDERER,
      capture_engine: "webkit",
      renderer_profile: canonicalManifest.renderer_profile,
      canonical_raster_manifest: {
        path: CANONICAL_RASTER_MANIFEST_RELATIVE_PATH,
        sha256: sha256File(packagePath(outputRoot, CANONICAL_RASTER_MANIFEST_RELATIVE_PATH)),
      },
      external_network_requests_allowed: false,
      source_visual_sha256: model.visual_basis_sha256,
    },
    inputs: sourceInputPaths(contracts).map((item) => sourceInputRecord(sourceRoot, item)),
    outputs,
    inventory: {
      exact_generated_paths: generatedPaths,
      generated_output_count: generatedPaths.length,
    },
  };
}

function writeFile(root, relativePath, content) {
  const target = packagePath(root, relativePath);
  ensureParent(target);
  fs.writeFileSync(target, content, { flag: "wx" });
}

function writePackageCandidate(sourceRoot, outputRoot, contracts, model, diagnosticRoot) {
  const packageDirectory = packagePath(outputRoot);
  fs.mkdirSync(packageDirectory, { recursive: true });
  const html = buildHtmlOutputMap(model);
  validateHtmlOutputMap(html);
  writeHtmlDirectory(path.join(packageDirectory, "demo"), html);
  copyDemoAssets(sourceRoot, outputRoot, contracts);
  writeFile(
    outputRoot,
    "derived/projection-map.json",
    stableStringify({
      version: "2.0.0",
      states: model.states.map((state) => ({
        state_id: state.id,
        projection_sha256: state.projection_sha256,
      })),
    }),
  );
  const capture = captureHtmlFrames(sourceRoot, outputRoot, model, contracts, diagnosticRoot);
  writeFile(
    outputRoot,
    PORTABLE_ARCHIVE_RELATIVE_PATH,
    buildPortablePrototypeArchive(
      sourceRoot,
      outputRoot,
      contracts,
      capture.candidateFingerprint,
    ),
  );
  writeCanonicalRasterManifest(
    packagePath(outputRoot, CANONICAL_RASTER_MANIFEST_RELATIVE_PATH),
    capture.canonicalManifest,
  );
  const wrapper = svgWrapperConfiguration(contracts);
  for (const state of model.states) {
    const png = capture.frames.get(state.id);
    writeFile(
      outputRoot,
      interpolateStatePath(wrapper.raster_png_path_format, state.id, "путь производного PNG"),
      png,
    );
    writeFile(
      outputRoot,
      interpolateStatePath(wrapper.svg_path_format, state.id, "путь SVG-обёртки"),
      renderScreenSvg(state, model, { frames: capture.frames }),
    );
  }
  const generatedPaths = generatedRelativePaths(contracts, model.states);
  const manifest = manifestFor(
    sourceRoot,
    outputRoot,
    contracts,
    model,
    generatedPaths,
    capture.canonicalManifest,
  );
  writeFile(outputRoot, "derived/prototype-package-manifest.json", stableStringify(manifest));
  return {
    generatedPaths,
    manifest,
    canonicalRasterManifest: capture.canonicalManifest,
  };
}

function createCandidateRoot(outputRoot) {
  fs.mkdirSync(outputRoot, { recursive: true });
  return fs.mkdtempSync(path.join(outputRoot, ".lisa-mvp-next-"));
}

function acquirePackageLock(packageDirectory) {
  fs.mkdirSync(packageDirectory, { recursive: true });
  const lockPath = path.join(packageDirectory, ".mvp-package-generation.lock");
  const handle = fs.openSync(lockPath, "wx");
  try {
    fs.writeSync(handle, `${process.pid}\n`);
  } catch (error) {
    fs.closeSync(handle);
    fs.rmSync(lockPath, { force: true });
    throw error;
  }
  return { handle, lockPath };
}

function releasePackageLock(lock) {
  try {
    fs.closeSync(lock.handle);
  } finally {
    fs.rmSync(lock.lockPath, { force: true });
  }
}

function movePublishedDirectories({ targetPackageRoot, candidatePackageRoot, names, afterPublish = () => {} }) {
  const backupRoot = fs.mkdtempSync(path.join(targetPackageRoot, ".mvp-backup-"));
  const recoveryRoot = path.join(targetPackageRoot, `.mvp-failed-publication-${process.pid}-${Date.now()}`);
  const movedOld = [];
  const movedNew = [];
  try {
    for (const name of names) {
      const source = path.join(candidatePackageRoot, name);
      const target = path.join(targetPackageRoot, name);
      const stat = fs.lstatSync(source);
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error(`кандидатный каталог ${name} отсутствует или небезопасен`);
      }
      if (fs.existsSync(target)) {
        const targetStat = fs.lstatSync(target);
        if (!targetStat.isDirectory() || targetStat.isSymbolicLink()) {
          throw new Error(`активный каталог ${name} отсутствует или небезопасен`);
        }
        fs.renameSync(target, path.join(backupRoot, name));
        movedOld.push(name);
      }
    }
    for (const name of names) {
      fs.renameSync(path.join(candidatePackageRoot, name), path.join(targetPackageRoot, name));
      movedNew.push(name);
    }
    afterPublish();
    fs.rmSync(backupRoot, { recursive: true, force: true, maxRetries: 3 });
  } catch (publicationError) {
    const rollbackErrors = [];
    try { fs.mkdirSync(recoveryRoot, { recursive: true }); } catch (error) { rollbackErrors.push(error); }
    for (const name of [...movedNew].reverse()) {
      const target = path.join(targetPackageRoot, name);
      if (!fs.existsSync(target)) continue;
      try {
        fs.renameSync(target, path.join(recoveryRoot, name));
      } catch (error) {
        rollbackErrors.push(error);
      }
    }
    for (const name of [...movedOld].reverse()) {
      const backup = path.join(backupRoot, name);
      const target = path.join(targetPackageRoot, name);
      if (!fs.existsSync(backup) || fs.existsSync(target)) continue;
      try {
        fs.renameSync(backup, target);
      } catch (error) {
        rollbackErrors.push(error);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [publicationError, ...rollbackErrors],
        `публикация MVP и откат не выполнены; резерв сохранён: ${backupRoot}`,
      );
    }
    fs.rmSync(backupRoot, { recursive: true, force: true, maxRetries: 3 });
    throw publicationError;
  }
}

function validateCandidateOrThrow(outputRoot, sourceRoot) {
  const issues = validateGeneratedPackage(outputRoot, sourceRoot);
  if (issues.length > 0) throw new Error(`кандидат MVP не прошёл проверку:\n- ${issues.join("\n- ")}`);
}

function clearGeneratedCandidateDirectories(outputRoot) {
  const packageDirectory = packagePath(outputRoot);
  for (const name of ["demo", "derived", "evidence"]) {
    const target = path.join(packageDirectory, name);
    if (!fs.existsSync(target)) continue;
    const stat = fs.lstatSync(target);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(`staging-каталог ${name} небезопасен`);
    }
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 3 });
  }
}

export function generatePrototypeCandidate({
  sourceRoot,
  outputRoot,
  packageRoot,
  diagnosticRoot = sourceRoot,
} = {}) {
  if (!sourceRoot || !outputRoot || !packageRoot) {
    throw new Error("кандидат MVP требует явные sourceRoot, outputRoot и packageRoot");
  }
  const expectedPackageRoot = packagePath(outputRoot);
  if (path.resolve(packageRoot) !== path.resolve(expectedPackageRoot)) {
    throw new Error("packageRoot кандидата не совпадает с outputRoot");
  }
  if (typeof diagnosticRoot !== "string" || !path.isAbsolute(diagnosticRoot)) {
    throw new Error("кандидат MVP требует абсолютный diagnosticRoot");
  }
  const diagnosticRootStat = fs.lstatSync(diagnosticRoot);
  if (!diagnosticRootStat.isDirectory() || diagnosticRootStat.isSymbolicLink()) {
    throw new Error("diagnosticRoot кандидата должен быть обычным каталогом");
  }
  const contracts = loadContracts(sourceRoot);
  const issues = validateContracts(sourceRoot, contracts);
  if (issues.length > 0) throw new Error(`проверка договоров не пройдена:\n- ${issues.join("\n- ")}`);
  const model = buildNormalizedModel(contracts, sourceRoot);
  fs.mkdirSync(expectedPackageRoot, { recursive: true });
  clearGeneratedCandidateDirectories(outputRoot);
  const candidate = writePackageCandidate(sourceRoot, outputRoot, contracts, model, diagnosticRoot);
  const candidateIssues = validateGeneratedPackage(outputRoot, sourceRoot);
  if (candidateIssues.length > 0) {
    throw new Error(`кандидат MVP не прошёл проверку:\n- ${candidateIssues.join("\n- ")}`);
  }
  return {
    model,
    packageRoot: expectedPackageRoot,
    generatedPaths: candidate.generatedPaths.map((item) => `${PACKAGE_PATH}/${item}`),
    manifest: candidate.manifest,
    canonicalRasterManifest: candidate.canonicalRasterManifest,
    candidateFingerprint: candidate.canonicalRasterManifest.candidate_fingerprint,
  };
}

export function generateHtmlPrototype({
  sourceRoot = process.cwd(),
  outputRoot,
} = {}) {
  if (!outputRoot) {
    throw new Error("HTML-кандидат требует явный изолированный outputRoot; частичная публикация запрещена");
  }
  if (path.resolve(sourceRoot) === path.resolve(outputRoot)) {
    throw new Error("HTML-кандидат нельзя создавать в активном пакете; используйте изолированный outputRoot");
  }
  const contracts = loadContracts(sourceRoot);
  const issues = validateContracts(sourceRoot, contracts);
  if (issues.length > 0) throw new Error(`проверка договоров не пройдена:\n- ${issues.join("\n- ")}`);
  const model = buildNormalizedModel(contracts, sourceRoot);
  const targetDemoDirectory = packagePath(outputRoot, "demo");
  if (fs.existsSync(targetDemoDirectory)) {
    throw new Error("изолированный outputRoot уже содержит demo; HTML-кандидат не перезаписывает существующие файлы");
  }
  const html = buildHtmlOutputMap(model);
  validateHtmlOutputMap(html);
  writeHtmlDirectory(targetDemoDirectory, html);
  copyDemoAssets(sourceRoot, outputRoot, contracts);
  const assetIssues = validateDemoAssets(outputRoot, sourceRoot, contracts);
  if (assetIssues.length > 0) throw new Error(`HTML-кандидат не прошёл проверку ресурсов:\n- ${assetIssues.join("\n- ")}`);
  return {
    model,
    generatedPaths: [...HTML_OUTPUT_PATHS, ...demoAssetPaths(contracts)]
      .map((item) => `${PACKAGE_PATH}/${item}`),
  };
}

export function generatePrototypePackage({
  sourceRoot,
  outputRoot,
  packageRoot = outputRoot ? packagePath(outputRoot) : undefined,
  diagnosticRoot = sourceRoot,
} = {}) {
  return generatePrototypeCandidate({
    sourceRoot,
    outputRoot,
    packageRoot,
    diagnosticRoot,
  });
}

function listFiles(directory, relative = "") {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const item = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(directory, item));
    else if (entry.isFile()) files.push(toPosix(item));
    else files.push(toPosix(item));
  }
  return files;
}

function generatedInventory(root) {
  const packageRoot = packagePath(root);
  return [
    ...listFiles(path.join(packageRoot, "demo")).map((item) => `demo/${item}`),
    ...listFiles(path.join(packageRoot, "derived")).map((item) => `derived/${item}`),
    ...listFiles(path.join(packageRoot, "evidence", "screenshots"))
      .map((item) => `evidence/screenshots/${item}`),
  ].sort((left, right) => left.localeCompare(right, "en"));
}

export function compareGeneratedHtml(root = process.cwd()) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-mvp-html-check-"));
  try {
    const generated = generateHtmlPrototype({ sourceRoot: root, outputRoot: tempRoot });
    const differences = [];
    for (const prefixed of generated.generatedPaths) {
      const relative = prefixed.slice(`${PACKAGE_PATH}/`.length);
      const expected = packagePath(root, relative);
      const actual = packagePath(tempRoot, relative);
      if (!fs.existsSync(expected)) differences.push(`отсутствует generated HTML: ${relative}`);
      else if (!fs.readFileSync(expected).equals(fs.readFileSync(actual))) differences.push(`устарел generated HTML: ${relative}`);
    }
    return differences;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true, maxRetries: 3 });
  }
}

export function compareGeneratedPackage(sourceRoot = process.cwd(), expectedRoot = sourceRoot) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-mvp-package-check-"));
  try {
    const generated = generatePrototypeCandidate({
      sourceRoot,
      outputRoot: tempRoot,
      packageRoot: packagePath(tempRoot),
    });
    const expectedPaths = generated.generatedPaths.map((item) => item.slice(`${PACKAGE_PATH}/`.length)).sort((left, right) => left.localeCompare(right, "en"));
    const actualPaths = generatedInventory(expectedRoot);
    const differences = [];
    for (const relative of expectedPaths) {
      const expected = packagePath(expectedRoot, relative);
      const actual = packagePath(tempRoot, relative);
      if (!fs.existsSync(expected)) differences.push(`отсутствует generated-выход: ${relative}`);
      else if (!fs.readFileSync(expected).equals(fs.readFileSync(actual))) differences.push(`устарел generated-выход: ${relative}`);
    }
    for (const actualPath of actualPaths) {
      if (!expectedPaths.includes(actualPath)) differences.push(`лишний generated-выход: ${actualPath}`);
    }
    return differences;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true, maxRetries: 3 });
  }
}

function validatePortablePrototypeArchive(outputRoot, sourceRoot, contracts, issues) {
  const archivePath = packagePath(outputRoot, PORTABLE_ARCHIVE_RELATIVE_PATH);
  if (!fs.existsSync(archivePath)) {
    issues.push("переносимый ZIP отсутствует");
    return;
  }
  try {
    const stat = fs.lstatSync(archivePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("ZIP должен быть обычным файлом");
    const archive = readStoredZip(fs.readFileSync(archivePath));
    const members = [...archive.keys()];
    const expectedMembers = portableArchiveMembers(contracts);
    if (!exactStringArray(members, expectedMembers)) throw new Error("состав ZIP отличается от договора archive.members");
    for (const member of members) {
      if (member.includes("..") || member.startsWith("/") || member.includes("\\")) throw new Error(`ZIP содержит небезопасный путь: ${member}`);
      const content = archive.get(member);
      if (member.startsWith("demo/") && !member.startsWith("demo/assets/")) {
        const active = fs.readFileSync(packagePath(outputRoot, member));
        if (!content.equals(active)) throw new Error(`ZIP содержит неактуальный файл: ${member}`);
        for (const pattern of FORBIDDEN_GENERATED_PATTERNS) {
          if (pattern.test(content.toString("utf8"))) throw new Error(`ZIP содержит запрещённый контент: ${member}`);
        }
      }
      if (member.startsWith("demo/assets/")) {
        const sourcePath = sourcePathFromDemoAssetPath(member);
        const source = fs.readFileSync(packagePath(sourceRoot, sourcePath));
        if (!content.equals(source)) throw new Error(`ZIP содержит неактуальный автономный ресурс: ${member}`);
      }
    }
    const manifest = JSON.parse(archive.get("manifest.json").toString("utf8"));
    if (!exactStringArray(manifest?.inventory?.members, expectedMembers)) {
      throw new Error("манифест ZIP содержит неверную инвентаризацию");
    }
    if (manifest?.contract_fingerprint?.sha256 !== sha256File(packagePath(sourceRoot, "source/active-contracts.json"))) {
      throw new Error("манифест ZIP содержит неверный отпечаток активного реестра");
    }
    const candidateFingerprint = canonicalCandidateFingerprintFor(sourceRoot, outputRoot, contracts);
    if (
      contracts.package?.archive?.candidate_fingerprint_required !== true ||
      stableCanonicalRasterJson(manifest?.candidate_fingerprint) !==
        stableCanonicalRasterJson(candidateFingerprint)
    ) {
      throw new Error("манифест ZIP не содержит точный отпечаток кандидатной сборки");
    }
  } catch (error) {
    issues.push(`переносимый ZIP: ${error.message}`);
  }
}

function validateDerivedSvg(svgPath, pngPath, canonicalPngPath, state, issues) {
  try {
    const svg = fs.readFileSync(svgPath, "utf8");
    const svgIssues = validateSvgSecurity(svg);
    if (svgIssues.length > 0) throw new Error(svgIssues.join(", "));
    const data = svg.match(/href="data:image\/png;base64,([A-Za-z0-9+/]+={0,2})"/u)?.[1];
    if (!data) throw new Error("SVG не содержит PNG data URI");
    const embedded = Buffer.from(data, "base64");
    const png = fs.readFileSync(pngPath);
    const canonicalPng = fs.readFileSync(canonicalPngPath);
    if (!embedded.equals(png)) throw new Error("встроенный PNG не совпадает с производным PNG");
    if (!png.equals(canonicalPng)) throw new Error("производный PNG не является побайтной копией канонического PNG");
    readPngDimensions(embedded, `SVG-кадр ${state.id}`);
    const captureSha256 = svg.match(/\bdata-capture-sha256="([a-f0-9]{64})"/u)?.[1];
    if (captureSha256 !== sha256Bytes(canonicalPng)) {
      throw new Error("SVG не подтверждает SHA-256 канонического PNG");
    }
    if (!svg.includes(`data-state-id="${state.id}"`) || !svg.includes(`data-projection-sha256="${state.projection_sha256}"`)) {
      throw new Error("SVG не подтверждает активное состояние");
    }
  } catch (error) {
    issues.push(`производный SVG ${state.id}: ${error.message}`);
  }
}

function validateCanonicalRaster(outputRoot, sourceRoot, contracts, model, issues) {
  const packageRoot = packagePath(outputRoot);
  const manifestPath = path.join(packageRoot, CANONICAL_RASTER_MANIFEST_RELATIVE_PATH);
  let manifest;
  try {
    manifest = readCanonicalRasterManifest(manifestPath);
    const normalized = buildCanonicalRasterManifest({
      candidateFingerprint: manifest.candidate_fingerprint,
      rendererProfile: manifest.renderer_profile,
      records: manifest.records,
    });
    if (stableCanonicalRasterJson(normalized) !== stableCanonicalRasterJson(manifest)) {
      throw new Error("манифест канонического растра не имеет детерминированный формат");
    }
    const expectedFingerprint = canonicalCandidateFingerprintFor(sourceRoot, outputRoot, contracts);
    if (
      manifest.candidate_fingerprint?.sha256 !== expectedFingerprint.sha256 ||
      stableCanonicalRasterJson(manifest.candidate_fingerprint?.inputs) !==
        stableCanonicalRasterJson(expectedFingerprint.inputs)
    ) {
      throw new Error("манифест канонического растра содержит неверный отпечаток кандидата");
    }
    const expectedPaths = canonicalRasterPathsForStates(contracts, model.states);
    const records = Array.isArray(manifest.records) ? manifest.records : [];
    if (!exactStringArray(records.map((record) => record.path), expectedPaths)) {
      throw new Error("манифест канонического растра содержит неверную инвентаризацию PNG");
    }
    for (const record of records) {
      const target = packagePath(outputRoot, record.path);
      const bytes = fs.readFileSync(target);
      const dimensions = readPngDimensions(bytes, `канонический PNG ${record.path}`);
      const viewport = CANONICAL_RASTER_VIEWPORTS.find((item) => item.id === record.viewport);
      if (
        !viewport ||
        dimensions.width !== viewport.width ||
        dimensions.height !== viewport.height ||
        record.bytes !== bytes.length ||
        record.sha256 !== sha256Bytes(bytes) ||
        !Array.isArray(record.runs) ||
        record.runs.length !== CANONICAL_RASTER_CANDIDATE_COUNT ||
        record.runs.some((run, index) =>
          run?.run !== index + 1 || run?.sha256 !== record.sha256 || run?.bytes !== record.bytes,
        )
      ) {
        throw new Error(`канонический PNG не совпадает с манифестом: ${record.path}`);
      }
    }
  } catch (error) {
    issues.push(`канонический растр: ${error instanceof Error ? error.message : "не проверен"}`);
  }
  return manifest;
}

function validateGeneratedText(pathName, issues) {
  try {
    const content = fs.readFileSync(pathName, "utf8");
    for (const pattern of FORBIDDEN_GENERATED_PATTERNS) {
      if (pattern.test(content)) issues.push(`generated-файл содержит запрещённый контент: ${toPosix(pathName)}`);
    }
  } catch (error) {
    issues.push(`generated-файл не прочитан: ${toPosix(pathName)}`);
  }
}

function validateDemoAssets(outputRoot, sourceRoot, contracts, issues = []) {
  let runtimeAssets;
  let expectedPaths;
  try {
    runtimeAssets = runtimeAssetPolicy(contracts);
    expectedPaths = demoAssetPaths(contracts);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "автономные ресурсы demo/assets не описаны");
    return issues;
  }
  const assetRoot = packagePath(outputRoot, runtimeAssets.demo_asset_root);
  const actualPaths = listFiles(assetRoot)
    .map((item) => `${runtimeAssets.demo_asset_root}${item}`)
    .sort((left, right) => left.localeCompare(right, "en"));
  if (!exactStringArray(actualPaths, expectedPaths)) {
    issues.push("demo/assets содержит неверную инвентаризацию автономных ресурсов");
  }
  for (const demoRelativePath of expectedPaths) {
    try {
      const target = packagePath(outputRoot, demoRelativePath);
      const stat = fs.lstatSync(target);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new Error("должен быть обычным файлом");
      }
      const sourceRelativePath = sourcePathFromDemoAssetPath(demoRelativePath);
      const source = packagePath(sourceRoot, sourceRelativePath);
      const sourceStat = fs.lstatSync(source);
      if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) {
        throw new Error("исходный ресурс недоступен");
      }
      if (!fs.readFileSync(target).equals(fs.readFileSync(source))) {
        throw new Error("не является побайтной копией source-ресурса");
      }
    } catch (error) {
      issues.push(`${demoRelativePath}: ${error instanceof Error ? error.message : "не проверен"}`);
    }
  }
  return issues;
}

export function validateGeneratedPackage(outputRoot = process.cwd(), sourceRoot = outputRoot) {
  const issues = [];
  let contracts;
  try {
    contracts = loadContracts(sourceRoot);
    issues.push(...validateContracts(sourceRoot, contracts));
  } catch (error) {
    return [error instanceof Error ? error.message : "активные договоры не прочитаны"];
  }
  let model;
  try {
    model = buildNormalizedModel(contracts, sourceRoot);
  } catch (error) {
    return [...issues, error instanceof Error ? error.message : "модель MVP не построена"];
  }
  let expected = [];
  try {
    expected = generatedRelativePaths(contracts, model.states);
  } catch (error) {
    return [...issues, error instanceof Error ? error.message : "состав generated-выходов не построен"];
  }
  const actual = generatedInventory(outputRoot);
  for (const pathName of expected) {
    if (!actual.includes(pathName)) issues.push(`отсутствует зарегистрированный generated-выход: ${pathName}`);
  }
  for (const pathName of actual) {
    if (!expected.includes(pathName)) issues.push(`лишний generated-выход: ${pathName}`);
  }
  const packageRoot = packagePath(outputRoot);
  for (const relative of actual) {
    const target = path.join(packageRoot, relative);
    try {
      const stat = fs.lstatSync(target);
      if (!stat.isFile() || stat.isSymbolicLink()) issues.push(`generated-выход должен быть обычным файлом: ${relative}`);
    } catch {
      issues.push(`generated-выход недоступен: ${relative}`);
    }
  }
  for (const relative of ["demo/index.html", "demo/app.js", "demo/data.js", "demo/styles.css", "derived/projection-map.json"]) {
    if (fs.existsSync(path.join(packageRoot, relative))) validateGeneratedText(path.join(packageRoot, relative), issues);
  }
  validateDemoAssets(outputRoot, sourceRoot, contracts, issues);
  try {
    const html = new Map(
      ["index.html", "app.js", "data.js", "styles.css"].map((name) => [
        name,
        fs.readFileSync(path.join(packageRoot, "demo", name), "utf8"),
      ]),
    );
    validateHtmlOutputMap(html);
  } catch (error) {
    issues.push(`HTML-выход: ${error instanceof Error ? error.message : "не проверен"}`);
  }
  validateCanonicalRaster(outputRoot, sourceRoot, contracts, model, issues);
  let wrapper;
  try {
    wrapper = svgWrapperConfiguration(contracts);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "SVG-обёртка не описана");
  }
  for (const state of model.states) {
    if (!wrapper) continue;
    const canonicalPng = packagePath(
      outputRoot,
      interpolateStatePath(wrapper.canonical_png_path_format, state.id, "путь канонического PNG"),
    );
    const png = packagePath(
      outputRoot,
      interpolateStatePath(wrapper.raster_png_path_format, state.id, "путь производного PNG"),
    );
    const svg = packagePath(
      outputRoot,
      interpolateStatePath(wrapper.svg_path_format, state.id, "путь SVG-обёртки"),
    );
    if (fs.existsSync(png)) {
      try {
        const dimensions = readPngDimensions(fs.readFileSync(png), `производный PNG ${state.id}`);
        if (dimensions.width !== 390 || dimensions.height !== 844) issues.push(`производный PNG имеет неверный размер: ${state.id}`);
        if (!fs.existsSync(canonicalPng) || !fs.readFileSync(png).equals(fs.readFileSync(canonicalPng))) {
          issues.push(`производный PNG не совпадает с каноническим mobile PNG: ${state.id}`);
        }
      } catch (error) {
        issues.push(error.message);
      }
    }
    if (fs.existsSync(svg) && fs.existsSync(png) && fs.existsSync(canonicalPng)) {
      validateDerivedSvg(svg, png, canonicalPng, state, issues);
    }
  }
  const chromiumPngs = listFiles(path.join(packageRoot, "evidence", "screenshots", "chromium"));
  for (const relative of chromiumPngs) {
    issues.push(`публикуемый Chromium PNG запрещён: evidence/screenshots/chromium/${relative}`);
  }
  const manifestPath = path.join(packageRoot, "derived/prototype-package-manifest.json");
  try {
    const manifest = readJsonFile(manifestPath, "манифест MVP");
    if (!exactStringArray(manifest?.state_ids, model.states.map((state) => state.id))) issues.push("манифест MVP содержит неверный набор состояний");
    if (!exactStringArray(manifest?.inventory?.exact_generated_paths, expected)) issues.push("манифест MVP содержит неверный exact inventory");
    if (manifest?.inventory?.generated_output_count !== expected.length) issues.push("манифест MVP содержит неверное число выходов");
    const outputs = Array.isArray(manifest?.outputs) ? manifest.outputs : [];
    const expectedHashed = expected.filter((item) => item !== "derived/prototype-package-manifest.json");
    if (!exactStringArray(outputs.map((item) => item?.path).sort(), expectedHashed.slice().sort())) issues.push("манифест MVP содержит неверные хешированные выходы");
    for (const output of outputs) {
      const target = path.join(packageRoot, output.path ?? "");
      if (!fs.existsSync(target) || sha256File(target) !== output.sha256 || fs.statSync(target).size !== output.bytes) {
        issues.push(`манифест MVP не подтверждает выход: ${String(output.path)}`);
      }
    }
  } catch (error) {
    issues.push(error.message);
  }
  validatePortablePrototypeArchive(outputRoot, sourceRoot, contracts, issues);
  return issues;
}

export function listGeneratedOutputHashes(root = process.cwd()) {
  const hashes = {};
  for (const relative of generatedInventory(root)) {
    const target = packagePath(root, relative);
    hashes[relative] = sha256File(target);
  }
  return hashes;
}
