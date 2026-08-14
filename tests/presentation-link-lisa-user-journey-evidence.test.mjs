import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { deflateSync, inflateSync } from "node:zlib";
import {
  createStoredZip,
  readStoredZip,
} from "../scripts/lib/documentation-archive.mjs";
import * as canonicalRaster from "../scripts/lib/presentation-link-lisa-canonical-raster.mjs";
import * as runtimeEvidenceWorker from "../scripts/capture-presentation-link-lisa-runtime-evidence.mjs";
import * as evidenceUpdater from "../scripts/update-presentation-link-lisa-user-journey-evidence.mjs";
import { validateEvidencePackage } from "../scripts/validate-presentation-link-lisa-user-journey-evidence.mjs";

const root = process.cwd();
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const packageRoot = path.join(root, packagePath);
const activeContractsPath = path.join(packageRoot, "source/active-contracts.json");
const journeyPath = path.join(packageRoot, "source/journey-contract.json");
const visualBasisPath = path.join(packageRoot, "source/visual-basis-contract.json");
const sourceCatalogPath = path.join(packageRoot, "source/source-render-catalog.json");
const packageContractPath = path.join(
  packageRoot,
  "source/prototype-package-contract.json",
);
const packageManifestPath = path.join(
  packageRoot,
  "derived/prototype-package-manifest.json",
);
const canonicalRasterManifestRelativePath =
  "derived/canonical-raster-manifest.json";
const canonicalRasterManifestPath = path.join(
  packageRoot,
  canonicalRasterManifestRelativePath,
);
const acceptanceReportPath = path.join(packageRoot, "evidence/acceptance-report.json");
const browserReportPath = path.join(packageRoot, "evidence/browser-report.json");
const naturalSourceCaptureScriptPath = path.join(
  root,
  "scripts/capture-presentation-link-lisa-derived-frames.mjs",
);
const evidenceUpdaterScriptPath = path.join(
  root,
  "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
);
const runtimeEvidenceWorkerScriptPath = path.join(
  root,
  "scripts/capture-presentation-link-lisa-runtime-evidence.mjs",
);
const expectedCanonicalViewports = [
  {
    id: "desktop-1280x720",
    width: 1280,
    height: 720,
    png_path_format: "evidence/screenshots/webkit/desktop-1280x720/{state_id}.png",
  },
  {
    id: "mobile-390x844",
    width: 390,
    height: 844,
    png_path_format: "evidence/screenshots/webkit/mobile-390x844/{state_id}.png",
  },
  {
    id: "stress-320x568",
    width: 320,
    height: 568,
    png_path_format: "evidence/screenshots/webkit/stress-320x568/{state_id}.png",
  },
];
const runtimeBrowsers = ["chromium", "webkit"];
const runtimeRequiredChecks = ["behavior", "accessibility", "geometry", "network"];
const expectedSourceParity = Object.freeze({
  comparison: "pixel-exact-outside-slots",
  outside_slots: "must-match",
  mask_coordinate_space: "natural-source-pixels",
  failure_action: "block-release",
});
const expectedNaturalSourceCaptureLayout = Object.freeze({
  mode: "capture-only-zero-origin",
  scene_stage_padding: "0",
  prototype_root_justify_items: "start",
  expected_origin: Object.freeze({ x: 0, y: 0 }),
});
const expectedDeferredQ4SourceIds = ["5.3", "5.6", "6.1", "6.2", "7.3"];
const candidateFingerprintInputScopes = Object.freeze({
  active_contracts: "active-contract",
  generated_html: "generated",
  registered_source_assets: "source-asset",
  capture_toolchain: "toolchain",
});
const expectedCaptureToolWarnings = Object.freeze([
  Object.freeze({
    classification: "playwright-webkit-screenshot-inline-style",
    message:
      "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.",
    count: 1,
  }),
]);
const expectedRuntimeCaptureSupervision = Object.freeze({
  browser_process_model: "isolated-child-process-per-browser",
  browser_execution_order: Object.freeze(["chromium", "webkit"]),
  diagnostic_report: Object.freeze({
    path: "test-results/presentation-link-lisa-user-journey/runtime-capture",
    must_be_gitignored: true,
    published: false,
    content: "deterministic-report-only",
  }),
  page_timeout_ms: 45_000,
  browser_worker_timeout_ms: 480_000,
  graceful_cleanup_timeout_ms: 5_000,
  force_termination_after_graceful_cleanup: true,
  force_termination_scope: "isolated-child-process-group",
  post_kill_group_exit_confirmation: Object.freeze({
    timeout_ms: 5_000,
    required_state: "process-group-exited",
    timeout_state: "process-group-exit-unconfirmed",
    timeout_action: "fail-runtime-capture-and-rollback",
  }),
  partial_browser_or_acceptance_reports_on_failure_allowed: false,
});
const forbiddenEvidenceFragments = [
  "lisa-presentation-ready",
  "lisa-notification",
  "lisa-result-view",
  "lisa-returned-to-chat",
  "lisa-presentation-email",
  "lisa-link-",
  "lisa-offline",
  "presentation-preview",
  "foreignObject",
  "mailto:",
  "file://",
  "/Users/",
];

function readJson(filePath) {
  assert.ok(fs.existsSync(filePath), `Отсутствует доказательство: ${path.relative(root, filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function synchronizeBrowserReportHash(packageRoot) {
  const reportPath = path.join(packageRoot, "evidence/browser-report.json");
  const acceptancePath = path.join(packageRoot, "evidence/acceptance-report.json");
  const acceptance = readJson(acceptancePath);
  acceptance.browser_report.sha256 = sha256File(reportPath);
  writeJson(acceptancePath, acceptance);
}

function synchronizeEvidenceToolchain(packageRoot) {
  const acceptancePath = path.join(packageRoot, "evidence/acceptance-report.json");
  const acceptance = readJson(acceptancePath);
  for (const record of acceptance.evidence_toolchain) {
    const currentTool = path.join(root, record.path);
    assert.ok(fs.existsSync(currentTool), `Отсутствует инструмент evidence: ${record.path}`);
    record.bytes = fs.statSync(currentTool).size;
    record.sha256 = sha256File(currentTool);
  }
  writeJson(acceptancePath, acceptance);
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(filePath) : [filePath];
  });
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function assertCandidateFingerprint(value, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label}: объект отсутствует`);
  assert.deepEqual(Object.keys(value).sort(), ["algorithm", "inputs", "sha256"]);
  assert.equal(value.algorithm, "sha256", `${label}: разрешён только sha256`);
  assert.match(value.sha256, /^[a-f0-9]{64}$/u, `${label}: неверный SHA-256`);
  assert.ok(value.inputs && typeof value.inputs === "object" && !Array.isArray(value.inputs));
  assert.deepEqual(
    Object.keys(value.inputs).sort(),
    Object.keys(candidateFingerprintInputScopes).sort(),
    `${label}: набор входов не соответствует договору`,
  );
  for (const [inputType, scope] of Object.entries(candidateFingerprintInputScopes)) {
    const records = value.inputs[inputType];
    assert.ok(Array.isArray(records) && records.length > 0, `${label}: ${inputType} пуст`);
    const paths = records.map((record) => record.path);
    assert.deepEqual(
      paths,
      [...paths].sort((left, right) => left.localeCompare(right, "en")),
      `${label}: ${inputType} должен быть отсортирован по относительному пути`,
    );
    assert.equal(new Set(paths).size, paths.length, `${label}: ${inputType} содержит дубликат пути`);
    for (const record of records) {
      assert.deepEqual(Object.keys(record).sort(), ["bytes", "path", "scope", "sha256"]);
      assert.equal(record.scope, scope, `${label}: ${record.path}: неверная область входа`);
      assert.equal(typeof record.path, "string");
      assert.equal(path.isAbsolute(record.path), false, `${label}: абсолютный путь запрещён`);
      assert.doesNotMatch(record.path, /(?:^|\/)\.\.?\/|\\|file:\/\/|\/Users\/|@|^test-results\//u);
      assert.ok(Number.isInteger(record.bytes) && record.bytes > 0, `${label}: ${record.path}: размер`);
      assert.match(record.sha256, /^[a-f0-9]{64}$/u, `${label}: ${record.path}: SHA-256`);
    }
  }
}

function assertCaptureToolWarnings(rendererProfile, label) {
  assert.ok(rendererProfile && typeof rendererProfile === "object", `${label}: отсутствует renderer_profile`);
  assert.deepEqual(
    rendererProfile.capture_tool_warnings,
    expectedCaptureToolWarnings,
    `${label}: допустимо только одно точное предупреждение Playwright о внутреннем stylesheet`,
  );
  assert.deepEqual(
    rendererProfile.source_parity_capture_layout,
    expectedNaturalSourceCaptureLayout,
    `${label}: source parity обязан зафиксировать capture-only выравнивание натуральной сцены`,
  );
}

function assertParityResult(result, { stateId, naturalDimensions, slots, passed }, label) {
  assert.ok(result && typeof result === "object" && !Array.isArray(result), `${label}: отсутствует результат source parity`);
  assert.deepEqual(
    Object.keys(result).sort(),
    [
      "base_sha256",
      "mask",
      "natural_dimensions",
      "outside_slot_result",
      "passed",
      "policy",
      "rendered_sha256",
      "slots",
      "state_id",
    ],
    `${label}: результат source parity содержит неверные поля`,
  );
  assert.equal(result.state_id, stateId, `${label}: неверное состояние`);
  assert.deepEqual(result.policy, expectedSourceParity, `${label}: неверная политика source parity`);
  assert.match(result.base_sha256, /^[a-f0-9]{64}$/u, `${label}: base_sha256`);
  assert.match(result.rendered_sha256, /^[a-f0-9]{64}$/u, `${label}: rendered_sha256`);
  assert.deepEqual(result.natural_dimensions, naturalDimensions, `${label}: natural_dimensions`);
  assert.deepEqual(
    Object.keys(result.mask).sort(),
    ["masked_pixel_count", "protected_pixel_count", "sha256", "unmasked_pixel_count"],
    `${label}: mask содержит неверные поля`,
  );
  assert.match(result.mask.sha256, /^[a-f0-9]{64}$/u, `${label}: SHA mask`);
  for (const key of ["masked_pixel_count", "unmasked_pixel_count", "protected_pixel_count"]) {
    assert.ok(Number.isInteger(result.mask[key]) && result.mask[key] >= 0, `${label}: mask.${key}`);
  }
  assert.equal(
    result.mask.masked_pixel_count + result.mask.unmasked_pixel_count,
    naturalDimensions.width * naturalDimensions.height,
    `${label}: маска должна покрывать весь натуральный холст`,
  );
  assert.deepEqual(
    Object.keys(result.outside_slot_result).sort(),
    ["compared_pixel_count", "differing_pixel_count", "first_difference", "max_channel_delta"],
    `${label}: итог вне slots содержит неверные поля`,
  );
  assert.ok(
    Number.isInteger(result.outside_slot_result.compared_pixel_count) &&
      result.outside_slot_result.compared_pixel_count >= 0,
    `${label}: compared_pixel_count`,
  );
  assert.ok(
    Number.isInteger(result.outside_slot_result.differing_pixel_count) &&
      result.outside_slot_result.differing_pixel_count >= 0,
    `${label}: differing_pixel_count`,
  );
  assert.ok(
    Number.isInteger(result.outside_slot_result.max_channel_delta) &&
      result.outside_slot_result.max_channel_delta >= 0,
    `${label}: max_channel_delta`,
  );
  if (result.outside_slot_result.first_difference !== null) {
    assert.deepEqual(
      Object.keys(result.outside_slot_result.first_difference).sort(),
      ["x", "y"],
      `${label}: first_difference`,
    );
  }
  assert.ok(Array.isArray(result.slots), `${label}: slots должен быть массивом`);
  assert.deepEqual(
    result.slots.map((slot) => slot.id),
    slots.map((slot) => slot.id),
    `${label}: slots должен следовать визуальному договору`,
  );
  for (const [index, slot] of result.slots.entries()) {
    const bindingSlot = slots[index];
    assert.deepEqual(
      Object.keys(slot).sort(),
      ["differing_pixel_count", "id", "kind", "masked_pixel_count", "rect"],
      `${label}: ${slot.id}: неверные поля slot`,
    );
    assert.equal(slot.kind, bindingSlot.kind, `${label}: ${slot.id}: kind`);
    assert.deepEqual(slot.rect, bindingSlot.rect, `${label}: ${slot.id}: rect`);
    assert.ok(Number.isInteger(slot.masked_pixel_count) && slot.masked_pixel_count >= 0);
    assert.ok(Number.isInteger(slot.differing_pixel_count) && slot.differing_pixel_count >= 0);
  }
  assert.equal(result.passed, passed, `${label}: неверный итог source parity`);
}

function cloneRgba(data) {
  return Buffer.from(data);
}

function setRgbaPixel(data, width, x, y, rgba) {
  const offset = (y * width + x) * 4;
  Buffer.from(rgba).copy(data, offset);
}

function rgbaCanvas(width, height, rgba = [17, 34, 51, 255]) {
  const data = Buffer.alloc(width * height * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    Buffer.from(rgba).copy(data, offset);
  }
  return data;
}

function encodeRgbaPng({ width, height, data }) {
  assert.equal(
    typeof canonicalRaster.encodeCanonicalRgbaPng,
    "function",
    "канонический растр должен экспортировать воспроизводимое кодирование RGBA PNG",
  );
  return canonicalRaster.encodeCanonicalRgbaPng({ width, height, data });
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return chunk;
}

function changeOnePngPixel(filePath) {
  const source = fs.readFileSync(filePath);
  assert.ok(source.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")));

  const chunks = [];
  const idat = [];
  let offset = 8;
  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.subarray(offset + 4, offset + 8).toString("ascii");
    const data = source.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    if (type === "IDAT") idat.push(data);
    offset += length + 12;
  }
  assert.ok(idat.length > 0, "PNG должен содержать IDAT");

  const pixels = inflateSync(Buffer.concat(idat));
  assert.ok(pixels.length > 1, "PNG должен содержать хотя бы один компонент пикселя");
  pixels[1] = (pixels[1] + 1) & 0xff;
  const changedIdat = deflateSync(pixels);
  const output = [source.subarray(0, 8)];
  let wroteIdat = false;
  for (const chunk of chunks) {
    if (chunk.type === "IDAT") {
      if (!wroteIdat) {
        output.push(pngChunk("IDAT", changedIdat));
        wroteIdat = true;
      }
      continue;
    }
    output.push(pngChunk(chunk.type, chunk.data));
  }
  fs.writeFileSync(filePath, Buffer.concat(output));
}

function rewriteArchiveManifest(archivePath, mutate) {
  const archive = readStoredZip(fs.readFileSync(archivePath));
  const manifest = JSON.parse(archive.get("manifest.json").toString("utf8"));
  mutate(manifest);
  fs.writeFileSync(
    archivePath,
    createStoredZip(
      [...archive].map(([name, content]) => ({
        name,
        content:
          name === "manifest.json"
            ? Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8")
            : content,
      })),
    ),
  );
}

function formatStatePath(pathFormat, stateId) {
  assert.equal(pathFormat.split("{state_id}").length - 1, 1);
  return pathFormat.replace("{state_id}", stateId);
}

function activeStateIdsFromRegistry(registry = readJson(activeContractsPath)) {
  const journey = readJson(journeyPath);
  const stateIds = registry.active_state_ids;
  assert.ok(Array.isArray(stateIds), "active_state_ids должен быть массивом активного реестра");
  assert.equal(stateIds.length, 20, "MVP P1/P2 должен содержать ровно 20 активных состояний");
  assert.equal(new Set(stateIds).size, stateIds.length, "active_state_ids не должен содержать повторов");
  assert.deepEqual(
    stateIds,
    journey.states.map((state) => state.id),
    "active_state_ids должен точно следовать активному договору пути",
  );
  return stateIds;
}

function canonicalRasterEntry(packageContract) {
  const matrix = packageContract.outputs?.published_raster_matrix;
  assert.ok(Array.isArray(matrix));
  assert.equal(matrix.length, 1);
  const [entry] = matrix;
  assert.equal(entry.browser, "webkit");
  assert.equal(entry.state_selection, "all");
  assert.equal(entry.state_source, "source/journey-contract.json#/states");
  assert.deepEqual(entry.viewports, expectedCanonicalViewports);
  return entry;
}

function canonicalViewportsFromContract(packageContract) {
  return canonicalRasterEntry(packageContract).viewports;
}

function expectedPublishedRasterPaths(
  packageContract,
  states = activeStateIdsFromRegistry(),
) {
  return canonicalRasterEntry(packageContract).viewports.flatMap((viewport) =>
    states.map((stateId) => formatStatePath(viewport.png_path_format, stateId)),
  );
}

function expectedRuntimeKeys(
  packageContract,
  states = activeStateIdsFromRegistry(),
) {
  return runtimeBrowsers.flatMap((browser) =>
    canonicalViewportsFromContract(packageContract).flatMap((viewport) =>
      states.map((stateId) => `${browser}/${viewport.id}/${stateId}`),
    ),
  );
}

function expectedGeneratedInventory(
  packageContract,
  states = activeStateIdsFromRegistry(),
) {
  const fixed = packageContract.outputs?.fixed;
  const wrapper = packageContract.outputs?.svg_wrapper;
  assert.ok(Array.isArray(fixed), "договор пакета не содержит fixed outputs");
  assert.ok(wrapper && typeof wrapper === "object", "договор пакета не содержит svg_wrapper");
  const stateOutputs = states.flatMap((stateId) => [
    formatStatePath(wrapper.raster_png_path_format, stateId),
    formatStatePath(wrapper.svg_path_format, stateId),
  ]);
  const inventory = [...fixed, ...stateOutputs, ...expectedPublishedRasterPaths(packageContract, states)]
    .sort((left, right) => left.localeCompare(right, "en"));
  assert.equal(new Set(inventory).size, inventory.length, "инвентарь выпуска не должен содержать повторов");
  return inventory;
}

function deferredQ4SourceIds(catalog = readJson(sourceCatalogPath)) {
  const actual = catalog.members
    .filter((member) => member.classification === "deferred-q4")
    .map((member) => member.id)
    .sort((left, right) => left.localeCompare(right, "en"));
  assert.deepEqual(actual, expectedDeferredQ4SourceIds);
  return actual;
}

function runtimeKey(record) {
  return `${record.browser}/${record.viewport}/${record.state_id}`;
}

function assertRuntimeChecks(record) {
  assert.deepEqual(
    Object.keys(record).sort(),
    ["browser", "checks", "state_id", "viewport"],
    `${runtimeKey(record)}: runtime-результат не должен нести скрытых полей`,
  );
  const checks = record.checks;
  assert.ok(checks && typeof checks === "object", `${runtimeKey(record)}: отсутствуют checks`);
  assert.deepEqual(
    Object.keys(checks).sort(),
    runtimeRequiredChecks.slice().sort(),
    `${runtimeKey(record)}: должны быть только обязательные проверки исполнения`,
  );
  assert.equal(checks.behavior?.passed, true, `${runtimeKey(record)}: поведение не прошло`);
  assert.deepEqual(Object.keys(checks.behavior || {}).sort(), ["passed"]);
  assert.equal(checks.accessibility?.passed, true, `${runtimeKey(record)}: доступность не прошла`);
  assert.equal(checks.accessibility?.axe_violation_count, 0, `${runtimeKey(record)}: нарушения axe`);
  assert.deepEqual(
    Object.keys(checks.accessibility || {}).sort(),
    ["axe_violation_count", "passed"],
  );
  assert.equal(checks.geometry?.passed, true, `${runtimeKey(record)}: геометрия не прошла`);
  assert.deepEqual(Object.keys(checks.geometry || {}).sort(), ["passed"]);
  assert.equal(checks.network?.passed, true, `${runtimeKey(record)}: сеть не прошла`);
  assert.deepEqual(checks.network?.network_attempts, [], `${runtimeKey(record)}: внешняя сеть`);
  assert.deepEqual(checks.network?.console_errors, [], `${runtimeKey(record)}: ошибки консоли`);
  assert.deepEqual(checks.network?.page_errors, [], `${runtimeKey(record)}: ошибки страницы`);
  assert.deepEqual(
    Object.keys(checks.network || {}).sort(),
    ["console_errors", "network_attempts", "page_errors", "passed"],
  );
}

function temporaryPackageCopy(label) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), `datacanvas-lisa-evidence-${label}-`));
  fs.mkdirSync(path.join(temporaryRoot, "docs/product/analysis"), { recursive: true });
  const temporaryPackageRoot = path.join(temporaryRoot, packagePath);
  fs.cpSync(packageRoot, temporaryPackageRoot, { recursive: true });
  synchronizeEvidenceToolchain(temporaryPackageRoot);
  return temporaryRoot;
}

function assertEvidenceRejectsMutation(label, mutate, expectedIssue) {
  const temporaryRoot = temporaryPackageCopy(label);
  try {
    const evidenceRoot = path.join(temporaryRoot, packagePath, "evidence");
    assert.deepEqual(
      validateEvidencePackage(temporaryRoot, { evidenceRoot }),
      [],
      `${label}: исходный кандидат должен быть валиден перед отрицательной проверкой`,
    );
    mutate({
      packageRoot: path.join(temporaryRoot, packagePath),
      evidenceRoot,
    });
    const issues = validateEvidencePackage(temporaryRoot, { evidenceRoot });
    assert.ok(
      issues.some((issue) => expectedIssue.test(issue)),
      `${label}: ожидается блокирующая ошибка ${expectedIssue}, получено: ${issues.join(" | ")}`,
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function createRuntimeWorkerFixture(label) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), `datacanvas-lisa-runtime-worker-${label}-`));
  const temporaryPackageRoot = path.join(temporaryRoot, "candidate-package");
  const demoPath = path.join(temporaryPackageRoot, "demo/index.html");
  const diagnosticRoot = path.join(temporaryRoot, "diagnostics");
  fs.mkdirSync(path.dirname(demoPath), { recursive: true });
  fs.writeFileSync(demoPath, "<!doctype html><title>runtime worker fixture</title>\n", "utf8");
  return { temporaryRoot, temporaryPackageRoot, demoPath, diagnosticRoot };
}

function runtimeWorkerRequest({ fixture, browserName, launchWorker }) {
  return {
    toolchainRoot: root,
    packageRoot: fixture.temporaryPackageRoot,
    demoPath: fixture.demoPath,
    browserName,
    runtimePlans: [{
      state_id: "lisa-client-answer",
      viewport: "mobile-390x844",
      semantic_slots: [],
    }],
    runtimeViewports: [{
      id: "mobile-390x844",
      width: 390,
      height: 844,
    }],
    captureStabilization: {
      wait_for_document_fonts: true,
      settle_animation_frames: 2,
    },
    browserLaunchArgs: [],
    supervision: expectedRuntimeCaptureSupervision,
    diagnosticRoot: fixture.diagnosticRoot,
    launchWorker,
  };
}

function runtimeCaptureDiagnosticPath(fixture, browserName) {
  const reportRoot = path.join(
    fixture.diagnosticRoot,
    expectedRuntimeCaptureSupervision.diagnostic_report.path,
  );
  const runDirectories = fs.readdirSync(reportRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^run-[a-z0-9-]+$/u.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));
  assert.deepEqual(
    runDirectories.length,
    1,
    `диагностика ${browserName} должна попасть ровно в один изолированный run-* каталог`,
  );
  return path.join(reportRoot, runDirectories[0], `${browserName}.json`);
}

function createLauncherChild(pid = 7341) {
  const child = new EventEmitter();
  child.pid = pid;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

function createManualTimerApi() {
  const scheduled = [];
  let nextId = 0;
  let now = 0;
  const nextActive = () => scheduled
    .filter((entry) => !entry.cleared)
    .sort((left, right) => left.dueAt - right.dueAt || left.id - right.id)[0];
  return {
    setTimeout(callback, delay) {
      assert.ok(Number.isInteger(delay) && delay >= 0, "тестовый таймер принимает только ограниченную целую задержку");
      const entry = {
        id: nextId += 1,
        callback,
        dueAt: now + delay,
        cleared: false,
      };
      scheduled.push(entry);
      return entry.id;
    },
    clearTimeout(id) {
      const entry = scheduled.find((candidate) => candidate.id === id);
      if (entry) entry.cleared = true;
    },
    runNext(expectedDelay) {
      const entry = nextActive();
      assert.ok(entry, "ожидается запланированный ограниченный таймер");
      const elapsed = entry.dueAt - now;
      if (expectedDelay !== undefined) assert.equal(elapsed, expectedDelay);
      now = entry.dueAt;
      entry.cleared = true;
      entry.callback();
    },
    advanceBy(duration) {
      assert.ok(Number.isInteger(duration) && duration >= 0);
      const deadline = now + duration;
      while (nextActive() && nextActive().dueAt <= deadline) {
        const entry = nextActive();
        now = entry.dueAt;
        entry.cleared = true;
        entry.callback();
      }
      now = deadline;
    },
    pendingDueOffsets() {
      return scheduled
        .filter((entry) => !entry.cleared)
        .map((entry) => entry.dueAt - now)
        .sort((left, right) => left - right);
    },
  };
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

function launcherRequest({ supervision = expectedRuntimeCaptureSupervision, ...overrides } = {}) {
  return {
    requestPath: "/tmp/runtime-request.json",
    resultPath: "/tmp/runtime-result.json",
    browserName: "webkit",
    supervision,
    ...overrides,
  };
}

function assertRuntimeLifecycleLauncherSeams() {
  const workerSource = fs.readFileSync(runtimeEvidenceWorkerScriptPath, "utf8");
  assert.match(
    workerSource,
    /export function launchRuntimeBrowserWorkerProcess\(\{[\s\S]*spawnWorker[\s\S]*signalProcessGroupFn[\s\S]*probeProcessGroupFn[\s\S]*timerApi[\s\S]*\}\)/u,
    "launcher должен принимать проверяемые швы spawnWorker, signalProcessGroupFn, probeProcessGroupFn и timerApi",
  );
  assert.doesNotMatch(
    workerSource,
    /Promise\.resolve\(probe\)/u,
    "probeProcessGroupFn обязан быть синхронным boolean: Promise создаёт новую неограниченную точку ожидания",
  );
}

test("договор надзора runtime-захвата фиксирует отдельный процесс, порядок браузеров и непубликуемую диагностику", () => {
  const packageContract = readJson(packageContractPath);
  assert.deepEqual(
    packageContract.reproducibility.runtime_capture_supervision,
    expectedRuntimeCaptureSupervision,
  );
  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  assert.match(
    gitignore,
    /^\/test-results\/presentation-link-lisa-user-journey\/$/mu,
    "диагностика runtime-захвата должна оставаться вне Git",
  );
});

test("launcher runtime-worker подтверждает отсутствие process group после TERM до успешного outcome и не посылает SIGKILL", async () => {
  assertRuntimeLifecycleLauncherSeams();
  assert.equal(
    typeof runtimeEvidenceWorker.launchRuntimeBrowserWorkerProcess,
    "function",
    "worker должен экспортировать проверяемый launcher изолированного process group",
  );
  const child = createLauncherChild();
  const timerApi = createManualTimerApi();
  const signals = [];
  const probes = [];
  let groupAlive = true;
  let resolved = false;
  const outcomePromise = runtimeEvidenceWorker.launchRuntimeBrowserWorkerProcess(
    launcherRequest({
      spawnWorker: () => child,
      signalProcessGroupFn: (pid, signal) => {
        signals.push({ pid, signal });
        return true;
      },
      probeProcessGroupFn: (pid) => {
        probes.push(pid);
        return groupAlive;
      },
      timerApi,
    }),
  ).then((outcome) => {
    resolved = true;
    return outcome;
  });

  timerApi.runNext(expectedRuntimeCaptureSupervision.browser_worker_timeout_ms);
  await flushAsyncWork();
  groupAlive = false;
  child.emit("close", 0, null);
  await flushAsyncWork();
  assert.equal(
    resolved,
    true,
    "когда close и probe=false уже получены, launcher не должен ждать лишние 5 секунд до outcome",
  );
  assert.deepEqual(signals, [{ pid: child.pid, signal: "SIGTERM" }]);
  assert.ok(probes.length >= 1, "после TERM нужна проверка отсутствия process group");
  const outcome = await outcomePromise;
  assert.equal(outcome.status, 0);
  assert.equal(outcome.signal, null);
  assert.equal(outcome.timeoutTriggered, true);
  assert.equal(outcome.termination, "process-group-exited");
  assert.equal(signals.some((entry) => entry.signal === "SIGKILL"), false);
});

test("нормальный close runtime-worker не принимает PID reuse или оставшихся потомков без probe=false", async () => {
  assertRuntimeLifecycleLauncherSeams();
  const child = createLauncherChild(7342);
  const timerApi = createManualTimerApi();
  const signals = [];
  const probes = [];
  let groupAlive = true;
  let resolved = false;
  const outcomePromise = runtimeEvidenceWorker.launchRuntimeBrowserWorkerProcess(
    launcherRequest({
      spawnWorker: () => child,
      signalProcessGroupFn: (pid, signal) => {
        signals.push({ pid, signal });
        return true;
      },
      probeProcessGroupFn: (pid) => {
        probes.push(pid);
        return groupAlive;
      },
      timerApi,
    }),
  ).then((outcome) => {
    resolved = true;
    return outcome;
  });

  child.emit("close", 0, null);
  await flushAsyncWork();
  assert.equal(
    resolved,
    false,
    "status=0 не доказывает, что изолированная группа исчезла: PID может быть переиспользован либо потомок может остаться",
  );
  assert.deepEqual(probes, [child.pid]);
  assert.equal(
    outcomePromise instanceof Promise,
    true,
    "до подтверждения отсутствия группы outcome обязан оставаться неразрешённым",
  );
  assert.deepEqual(signals, [], "нормальный close не должен немедленно посылать сигнал без deadline");

  // Завершаем управляемую фикстуру без реального ожидания 480 секунд. Группа уже
  // отсутствует, поэтому ни TERM, ни KILL не допустимы: PID мог быть переиспользован.
  groupAlive = false;
  timerApi.advanceBy(expectedRuntimeCaptureSupervision.browser_worker_timeout_ms);
  await flushAsyncWork();
  const outcome = await outcomePromise;
  assert.equal(outcome.status, 0);
  assert.equal(outcome.termination, "process-group-exited");
  assert.deepEqual(signals, []);
});

test("probe=false до close не завершает runtime-worker: требуется оба факта отсутствия группы и close", async () => {
  assertRuntimeLifecycleLauncherSeams();
  const child = createLauncherChild(7343);
  const timerApi = createManualTimerApi();
  const signals = [];
  let resolved = false;
  const outcomePromise = runtimeEvidenceWorker.launchRuntimeBrowserWorkerProcess(
    launcherRequest({
      spawnWorker: () => child,
      signalProcessGroupFn: (pid, signal) => {
        signals.push({ pid, signal });
        return true;
      },
      probeProcessGroupFn: () => false,
      timerApi,
    }),
  ).then((outcome) => {
    resolved = true;
    return outcome;
  });

  timerApi.advanceBy(expectedRuntimeCaptureSupervision.browser_worker_timeout_ms);
  await flushAsyncWork();
  assert.equal(resolved, false, "launcher не может завершиться только по probe=false до child.close");
  assert.deepEqual(
    signals,
    [],
    "если синхронный probe уже подтвердил отсутствие группы, TERM/KILL запрещены: PID мог быть переиспользован",
  );
  child.emit("close", 0, null);
  await flushAsyncWork();
  assert.equal(resolved, true, "после close при уже подтверждённом отсутствии группы outcome завершается без задержки");
  const outcome = await outcomePromise;
  assert.equal(outcome.termination, "process-group-exited");
  assert.equal(outcome.timeoutTriggered, true);
});

test("probe=false без close получает ограниченный process-group-exit-unconfirmed, а не успешный outcome", async () => {
  assertRuntimeLifecycleLauncherSeams();
  const child = createLauncherChild(7344);
  const timerApi = createManualTimerApi();
  const signals = [];
  let settled = false;
  const outcomePromise = runtimeEvidenceWorker.launchRuntimeBrowserWorkerProcess(
    launcherRequest({
      spawnWorker: () => child,
      signalProcessGroupFn: (pid, signal) => {
        signals.push({ pid, signal });
        return true;
      },
      probeProcessGroupFn: () => false,
      timerApi,
    }),
  ).then((outcome) => {
    settled = true;
    return outcome;
  });

  timerApi.advanceBy(expectedRuntimeCaptureSupervision.browser_worker_timeout_ms);
  await flushAsyncWork();
  assert.equal(settled, false, "probe=false без child.close не может быть успешным запуском");
  assert.deepEqual(
    signals,
    [],
    "подтверждённое отсутствие process group исключает ложный SIGTERM/SIGKILL",
  );
  timerApi.advanceBy(expectedRuntimeCaptureSupervision.post_kill_group_exit_confirmation.timeout_ms);
  await flushAsyncWork();
  assert.equal(
    settled,
    true,
    "отсутствие close должно завершиться ограниченным terminal outcome, а не вечным ожиданием",
  );
  const outcome = await outcomePromise;
  assert.equal(outcome.status, null);
  assert.equal(outcome.signal, null);
  assert.equal(outcome.timeoutTriggered, true);
  assert.equal(outcome.termination, "process-group-exit-unconfirmed");
});

test("launcher runtime-worker после SIGKILL не завершает outcome, пока probe не подтвердит отсутствие process group", async () => {
  assertRuntimeLifecycleLauncherSeams();
  const child = createLauncherChild();
  const timerApi = createManualTimerApi();
  const signals = [];
  const probes = [];
  let groupAlive = true;
  let resolved = false;
  const outcomePromise = runtimeEvidenceWorker.launchRuntimeBrowserWorkerProcess(
    launcherRequest({
      spawnWorker: () => child,
      signalProcessGroupFn: (pid, signal) => {
        signals.push({ pid, signal });
        return true;
      },
      probeProcessGroupFn: (pid) => {
        probes.push(pid);
        return groupAlive;
      },
      timerApi,
    }),
  ).then((outcome) => {
    resolved = true;
    return outcome;
  });

  timerApi.runNext(expectedRuntimeCaptureSupervision.browser_worker_timeout_ms);
  await flushAsyncWork();
  child.emit("close", null, "SIGTERM");
  await flushAsyncWork();
  assert.equal(resolved, false, "close после TERM не заменяет probe process group");
  timerApi.advanceBy(expectedRuntimeCaptureSupervision.graceful_cleanup_timeout_ms);
  await flushAsyncWork();
  assert.deepEqual(
    signals,
    [
      { pid: child.pid, signal: "SIGTERM" },
      { pid: child.pid, signal: "SIGKILL" },
    ],
    "после неподтверждённого TERM должен последовать ровно один SIGKILL группы",
  );
  assert.equal(resolved, false, "после SIGKILL нельзя принять close, пока probe не даст false");
  assert.ok(probes.length >= 2, "launcher обязан проверить группу после TERM и после SIGKILL");

  groupAlive = false;
  timerApi.advanceBy(100);
  await flushAsyncWork();
  const outcome = await outcomePromise;
  assert.equal(outcome.termination, "process-group-exited");
  assert.equal(outcome.timeoutTriggered, true);
});

test("неподтверждённый выход process group за post-kill timeout возвращает ограниченный terminal outcome и запрещает принять полный worker result", async (t) => {
  assertRuntimeLifecycleLauncherSeams();
  const child = createLauncherChild();
  const timerApi = createManualTimerApi();
  const signals = [];
  let settled = false;
  const outcomePromise = runtimeEvidenceWorker.launchRuntimeBrowserWorkerProcess(
    launcherRequest({
      spawnWorker: () => child,
      signalProcessGroupFn: (pid, signal) => {
        signals.push({ pid, signal });
        return true;
      },
      probeProcessGroupFn: () => true,
      timerApi,
    }),
  ).then((outcome) => {
    settled = true;
    return outcome;
  });

  timerApi.runNext(expectedRuntimeCaptureSupervision.browser_worker_timeout_ms);
  await flushAsyncWork();
  child.emit("close", 0, null);
  timerApi.advanceBy(expectedRuntimeCaptureSupervision.graceful_cleanup_timeout_ms);
  await flushAsyncWork();
  assert.equal(settled, false, "после SIGKILL launcher обязан ожидать post-kill подтверждение выхода группы");
  timerApi.advanceBy(expectedRuntimeCaptureSupervision.post_kill_group_exit_confirmation.timeout_ms);
  await flushAsyncWork();
  assert.equal(
    settled,
    true,
    `post-kill deadline обязан завершить launcher; ожидаются только ограниченные таймеры, осталось: ${timerApi.pendingDueOffsets().join(", ")}`,
  );
  const outcome = await outcomePromise;
  assert.equal(outcome.termination, "process-group-exit-unconfirmed");
  assert.equal(outcome.timeoutTriggered, true);
  assert.deepEqual(
    signals,
    [
      { pid: child.pid, signal: "SIGTERM" },
      { pid: child.pid, signal: "SIGKILL" },
    ],
  );

  const fixture = createRuntimeWorkerFixture("unconfirmed-process-group");
  t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
  await assert.rejects(
    evidenceUpdater.runRuntimeBrowserWorker(
      runtimeWorkerRequest({
        fixture,
        browserName: "webkit",
        launchWorker: async () => outcome,
      }),
    ),
    /process-group-exit-unconfirmed|runtime|browser-worker|неуспеш/u,
  );
  assert.equal(
    fs.existsSync(path.join(fixture.temporaryPackageRoot, "evidence/browser-report.json")),
    false,
    "неподтверждённая группа запрещает частичный browser-report",
  );
  assert.equal(
    fs.existsSync(path.join(fixture.temporaryPackageRoot, "evidence/acceptance-report.json")),
    false,
    "неподтверждённая группа запрещает acceptance-report и публикацию",
  );
  const diagnostic = JSON.parse(
    fs.readFileSync(runtimeCaptureDiagnosticPath(fixture, "webkit"), "utf8"),
  );
  assert.equal(diagnostic.termination, "process-group-exit-unconfirmed");
});

test("обновитель evidence запускает изолированные browser-worker последовательно до отчётов и публикации", () => {
  const updaterSource = fs.readFileSync(evidenceUpdaterScriptPath, "utf8");
  const workerSource = fs.readFileSync(runtimeEvidenceWorkerScriptPath, "utf8");
  const generateEvidenceStart = updaterSource.indexOf("export async function generateEvidence");
  const freshnessStart = updaterSource.indexOf("export async function checkEvidenceFreshness");
  assert.ok(generateEvidenceStart >= 0 && freshnessStart > generateEvidenceStart);
  const generateEvidenceSource = updaterSource.slice(generateEvidenceStart, freshnessStart);

  assert.equal(
    typeof evidenceUpdater.runRuntimeBrowserWorker,
    "function",
    "обновитель должен экспортировать проверяемый запуск изолированного browser-worker",
  );
  assert.match(
    updaterSource,
    /runRuntimeBrowserWorkerFn/u,
    "generateEvidence должен принимать тестовый шов запуска browser-worker",
  );
  assert.match(
    updaterSource,
    /for\s*\(\s*const\s+browserName\s+of\s+supervision\.browser_execution_order\s*\)/u,
    "Chromium и WebKit должны запускаться строго в порядке договора",
  );
  assert.match(
    updaterSource,
    /for\s*\(\s*const\s+browserName\s+of\s+supervision\.browser_execution_order\s*\)\s*\{[\s\S]{0,3000}await runRuntimeBrowserWorkerFn\(\{/u,
    "await внутри последовательного цикла гарантирует: отказ Chromium прерывает цикл до запуска WebKit",
  );
  assert.doesNotMatch(
    generateEvidenceSource,
    /Promise\.all\s*\(/u,
    "параллельный запуск скрывает зависание WebKit и не допускается",
  );
  const workerCall = generateEvidenceSource.indexOf("await runRuntimeBrowserWorkerFn({");
  const browserReport = generateEvidenceSource.indexOf("buildBrowserReport({");
  const acceptanceReport = generateEvidenceSource.indexOf("buildAcceptanceReport({");
  const publication = generateEvidenceSource.indexOf("publishEvidenceAtomically({");
  assert.ok(workerCall >= 0, "browser-worker должен ожидаться до создания отчётов");
  assert.ok(
    workerCall < browserReport && browserReport < acceptanceReport && acceptanceReport < publication,
    "ошибка browser-worker обязана остановить выполнение до browser-report, acceptance-report и публикации",
  );
  assert.match(
    updaterSource,
    /finally\s*\{[\s\S]*fs\.rmSync\(stagingRoot,\s*\{\s*recursive:\s*true,\s*force:\s*true\s*\}\)/u,
    "неопубликованный staging evidence должен удаляться и при сбое browser-worker",
  );
  assert.doesNotMatch(
    workerSource,
    /from\s+["']\.\/validate-presentation-link-lisa-user-journey-evidence\.mjs["']/u,
    "worker request→result не может импортировать валидатор или издатель evidence",
  );
  assert.doesNotMatch(
    workerSource,
    /publishEvidenceAtomically|validateEvidencePackage/u,
    "worker не имеет права валидировать или публиковать пакет evidence",
  );
});

test("тайм-аут изолированного runtime browser-worker не возвращает результаты и сохраняет только санитизированную диагностику", async (t) => {
  const fixture = createRuntimeWorkerFixture("timeout");
  t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
  let launchRequest = null;

  await assert.rejects(
    evidenceUpdater.runRuntimeBrowserWorker(
      runtimeWorkerRequest({
        fixture,
        browserName: "webkit",
        launchWorker: async (request) => {
          launchRequest = request;
          return {
            status: null,
            signal: "SIGKILL",
            stdout: `worker timeout for ${fixture.demoPath}`,
            stderr: `worker deadline exceeded for ${fixture.temporaryPackageRoot}`,
            pid: 4242,
          };
        },
      }),
    ),
    /runtime|browser-worker|тайм-аут|timeout|deadline|SIGKILL/u,
  );

  assert.ok(launchRequest, "launcher должен получить задание worker до истечения deadline");
  assert.equal(launchRequest.browserName, "webkit");
  assert.deepEqual(launchRequest.supervision, expectedRuntimeCaptureSupervision);
  assert.equal(
    fs.existsSync(path.join(fixture.temporaryPackageRoot, "evidence/browser-report.json")),
    false,
    "при тайм-ауте нельзя создавать частичный browser-report",
  );
  assert.equal(
    fs.existsSync(path.join(fixture.temporaryPackageRoot, "evidence/acceptance-report.json")),
    false,
    "при тайм-ауте нельзя создавать acceptance-report",
  );

  const diagnosticPath = runtimeCaptureDiagnosticPath(fixture, "webkit");
  assert.ok(fs.existsSync(diagnosticPath), "тайм-аут обязан оставить непубликуемую диагностику");
  assert.equal(diagnosticPath.startsWith(`${fixture.temporaryPackageRoot}${path.sep}`), false);
  const diagnostic = JSON.parse(fs.readFileSync(diagnosticPath, "utf8"));
  const allowedFields = new Set([
    "version",
    "status",
    "browser",
    "last_viewport",
    "last_state_id",
    "last_stage",
    "elapsed_ms",
    "termination",
    "network_attempts",
    "console_errors",
    "page_errors",
    "stderr",
  ]);
  assert.ok(
    Object.keys(diagnostic).every((field) => allowedFields.has(field)),
    `диагностика не должна раскрывать путь, HTML, PNG или fingerprint: ${Object.keys(diagnostic).join(", ")}`,
  );
  assert.equal(diagnostic.browser, "webkit");
  assert.ok(diagnostic.termination, "диагностика должна сохранить причину остановки");
  assert.deepEqual(diagnostic.network_attempts, []);
  assert.deepEqual(diagnostic.console_errors, []);
  assert.deepEqual(diagnostic.page_errors, []);
  assert.equal(
    JSON.stringify(diagnostic).includes(fixture.temporaryPackageRoot),
    false,
    "санитизированная диагностика не должна содержать локальные пути кандидата",
  );
});

test("runtime browser-worker отвергает неполный успешный ответ и не допускает частичных отчётов", async (t) => {
  const fixture = createRuntimeWorkerFixture("partial-response");
  t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));

  await assert.rejects(
    evidenceUpdater.runRuntimeBrowserWorker(
      runtimeWorkerRequest({
        fixture,
        browserName: "chromium",
        launchWorker: async ({ resultPath }) => {
          fs.mkdirSync(path.dirname(resultPath), { recursive: true });
          fs.writeFileSync(
            resultPath,
            `${JSON.stringify({
              version: "1.0.0",
              status: "success",
              browser: "chromium",
              browser_version: "fixture",
              browser_launch_args: [],
            })}\n`,
            "utf8",
          );
          return { status: 0, signal: null, stdout: "", stderr: "", pid: 4243 };
        },
      }),
    ),
    /runtime|browser-worker|непол|result|ответ/u,
  );

  assert.equal(
    fs.existsSync(path.join(fixture.temporaryPackageRoot, "evidence/browser-report.json")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(fixture.temporaryPackageRoot, "evidence/acceptance-report.json")),
    false,
  );
  const diagnosticPath = runtimeCaptureDiagnosticPath(fixture, "chromium");
  assert.ok(fs.existsSync(diagnosticPath), "неполный ответ должен оставлять санитизированную диагностику");
  const diagnostic = JSON.parse(fs.readFileSync(diagnosticPath, "utf8"));
  assert.equal(diagnostic.browser, "chromium");
  assert.equal(
    JSON.stringify(diagnostic).includes(fixture.temporaryPackageRoot),
    false,
    "диагностика неполного ответа не должна раскрывать путь кандидата",
  );
});

test("runtime browser-worker отвергает outcome с наступившим deadline даже при полном result и нулевом статусе", async (t) => {
  const fixture = createRuntimeWorkerFixture("deadline-after-exit");
  t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));

  await assert.rejects(
    evidenceUpdater.runRuntimeBrowserWorker(
      runtimeWorkerRequest({
        fixture,
        browserName: "chromium",
        launchWorker: async ({ resultPath, browserName }) => {
          fs.mkdirSync(path.dirname(resultPath), { recursive: true });
          fs.writeFileSync(
            resultPath,
            `${JSON.stringify({
              version: "1.0.0",
              status: "success",
              browser: browserName,
              browser_version: "fixture",
              browser_launch_args: [],
              runtime_results: [{
                browser: browserName,
                viewport: "mobile-390x844",
                state_id: "lisa-client-answer",
              }],
            })}\n`,
            "utf8",
          );
          return {
            status: 0,
            signal: null,
            timeoutTriggered: true,
            stdout: "",
            stderr: "worker deadline exceeded after graceful exit",
            pid: 4244,
          };
        },
      }),
    ),
    /runtime|browser-worker|тайм-аут|timeout|deadline/u,
  );

  assert.equal(
    fs.existsSync(path.join(fixture.temporaryPackageRoot, "evidence/browser-report.json")),
    false,
    "наступивший deadline запрещает browser-report даже при полном result",
  );
  assert.equal(
    fs.existsSync(path.join(fixture.temporaryPackageRoot, "evidence/acceptance-report.json")),
    false,
    "наступивший deadline запрещает acceptance-report даже при полном result",
  );
  const diagnosticPath = runtimeCaptureDiagnosticPath(fixture, "chromium");
  const diagnostic = JSON.parse(fs.readFileSync(diagnosticPath, "utf8"));
  assert.equal(diagnostic.browser, "chromium");
  assert.equal(diagnostic.termination, "worker-timeout");
});

test("runtime browser-worker требует явные runtimeViewports и не подменяет их фиктивным размером", async (t) => {
  const fixture = createRuntimeWorkerFixture("missing-viewports");
  t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
  let launchCount = 0;
  const request = runtimeWorkerRequest({
    fixture,
    browserName: "chromium",
    launchWorker: async ({ resultPath, browserName }) => {
      launchCount += 1;
      fs.mkdirSync(path.dirname(resultPath), { recursive: true });
      fs.writeFileSync(
        resultPath,
        `${JSON.stringify({
          version: "1.0.0",
          status: "success",
          browser: browserName,
          browser_version: "fixture",
          browser_launch_args: [],
          runtime_results: [{
            browser: browserName,
            viewport: "mobile-390x844",
            state_id: "lisa-client-answer",
          }],
        })}\n`,
        "utf8",
      );
      return { status: 0, signal: null, stdout: "", stderr: "", pid: 4245 };
    },
  });
  delete request.runtimeViewports;

  await assert.rejects(
    evidenceUpdater.runRuntimeBrowserWorker(request),
    /runtime.*viewport|viewport.*request|viewport/u,
  );
  assert.equal(launchCount, 0, "без exact runtimeViewports дочерний процесс не должен запускаться");
  assert.equal(
    fs.existsSync(path.join(
      fixture.diagnosticRoot,
      expectedRuntimeCaptureSupervision.diagnostic_report.path,
    )),
    false,
    "некорректный request должен быть отклонён до создания diagnostic run-*",
  );
});

test("пред-runtime сбой copyCanonicalRastersToStaging не оставляет пустой diagnostic run-*", () => {
  const updaterSource = fs.readFileSync(evidenceUpdaterScriptPath, "utf8");
  const generateEvidenceStart = updaterSource.indexOf("export async function generateEvidence");
  const freshnessStart = updaterSource.indexOf("export async function checkEvidenceFreshness");
  assert.ok(generateEvidenceStart >= 0 && freshnessStart > generateEvidenceStart);
  const generateEvidenceSource = updaterSource.slice(generateEvidenceStart, freshnessStart);
  const copyCanonicalRasters = generateEvidenceSource.indexOf(
    "copyCanonicalRastersToStaging({ roots, matrix, stagingRoot });",
  );
  const runRootCreation = generateEvidenceSource.indexOf(
    "diagnosticRunRoot = createRuntimeDiagnosticRunRoot({",
  );
  const browserLoop = generateEvidenceSource.indexOf(
    "for (const browserName of supervision.browser_execution_order)",
  );

  assert.ok(copyCanonicalRasters >= 0, "generateEvidence должен копировать канонические PNG в staging");
  assert.ok(runRootCreation >= 0, "runtime-захват должен иметь один общий diagnostic run-*");
  assert.ok(browserLoop > runRootCreation, "общий run-* должен существовать до первого browser-worker");
  assert.ok(
    copyCanonicalRasters < runRootCreation,
    "пустой diagnostic run-* нельзя создавать до copyCanonicalRastersToStaging: пред-runtime отказ обязан оставить ноль run-*",
  );
});

test("generateEvidence создаёт один общий run-* для Chromium и WebKit, удаляет его только после двух успехов и сохраняет файл упавшего браузера", async (t) => {
  const updaterSource = fs.readFileSync(evidenceUpdaterScriptPath, "utf8");
  const workerSource = fs.readFileSync(runtimeEvidenceWorkerScriptPath, "utf8");
  const generateEvidenceStart = updaterSource.indexOf("export async function generateEvidence");
  const freshnessStart = updaterSource.indexOf("export async function checkEvidenceFreshness");
  assert.ok(generateEvidenceStart >= 0 && freshnessStart > generateEvidenceStart);
  const generateEvidenceSource = updaterSource.slice(generateEvidenceStart, freshnessStart);
  const runRootCreation = generateEvidenceSource.indexOf(
    "diagnosticRunRoot = createRuntimeDiagnosticRunRoot({",
  );
  const browserLoop = generateEvidenceSource.indexOf(
    "for (const browserName of supervision.browser_execution_order)",
  );
  const browserReport = generateEvidenceSource.indexOf("buildBrowserReport({");
  const publication = generateEvidenceSource.indexOf("publishEvidenceAtomically({");
  const cleanupMatch = /if \(([A-Za-z_$][\w$]*) && diagnosticRunRoot && fs\.existsSync\(diagnosticRunRoot\)\)/u
    .exec(generateEvidenceSource);

  assert.ok(runRootCreation >= 0 && browserLoop > runRootCreation);
  assert.equal(
    (generateEvidenceSource.match(/createRuntimeDiagnosticRunRoot\(\{/gu) ?? []).length,
    1,
    "generateEvidence должен создать ровно один общий run-* до цикла браузеров",
  );
  const loopSource = generateEvidenceSource.slice(browserLoop, browserReport);
  assert.match(
    loopSource,
    /await runRuntimeBrowserWorkerFn\(\{[\s\S]*diagnosticRunRoot,[\s\S]*\}\);/u,
    "один и тот же diagnosticRunRoot должен передаваться каждому browser-worker",
  );
  assert.ok(cleanupMatch, "finally должен очищать общий run-* только по флагу успешной публикации");
  const publicationCompletedFlag = cleanupMatch?.[1];
  const publicationCompletedAt = generateEvidenceSource.indexOf(`${publicationCompletedFlag} = true;`);
  assert.ok(publication > browserReport && publicationCompletedAt > publication);
  assert.match(
    generateEvidenceSource.slice(cleanupMatch?.index ?? 0),
    /fs\.rmSync\(diagnosticRunRoot, \{ recursive: true, force: true \}\);/u,
    "при успешной публикации общий run-* должен удаляться целиком",
  );
  assert.match(
    workerSource,
    /writeAtomicJson\(path\.join\(diagnosticRunRoot, `\$\{browserName\}\.json`\), diagnostic\);/u,
    "worker должен сохранить ровно именованный файл только своего упавшего браузера",
  );

  const fixture = createRuntimeWorkerFixture("shared-run-root");
  t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
  const diagnosticRunRoot = path.join(
    fixture.diagnosticRoot,
    expectedRuntimeCaptureSupervision.diagnostic_report.path,
    "run-shared-worker-test",
  );
  const launchedBrowsers = [];
  const chromiumRequest = {
    ...runtimeWorkerRequest({
      fixture,
      browserName: "chromium",
      launchWorker: async ({ resultPath, browserName }) => {
        launchedBrowsers.push(browserName);
        fs.mkdirSync(path.dirname(resultPath), { recursive: true });
        fs.writeFileSync(
          resultPath,
          `${JSON.stringify({
            version: "1.0.0",
            status: "success",
            browser: browserName,
            browser_version: "fixture",
            browser_launch_args: [],
            runtime_results: [{
              browser: browserName,
              viewport: "mobile-390x844",
              state_id: "lisa-client-answer",
            }],
          })}\n`,
          "utf8",
        );
        return { status: 0, signal: null, stdout: "", stderr: "", pid: 4250 };
      },
    }),
    diagnosticRunRoot,
  };
  const chromiumCapture = await evidenceUpdater.runRuntimeBrowserWorker(chromiumRequest);
  assert.equal(chromiumCapture.diagnosticRunRoot, diagnosticRunRoot);
  assert.deepEqual(fs.readdirSync(diagnosticRunRoot), []);

  await assert.rejects(
    evidenceUpdater.runRuntimeBrowserWorker({
      ...runtimeWorkerRequest({
        fixture,
        browserName: "webkit",
        launchWorker: async ({ browserName }) => {
          launchedBrowsers.push(browserName);
          return {
            status: null,
            signal: "SIGKILL",
            stdout: "",
            stderr: "worker deadline exceeded",
            pid: 4251,
          };
        },
      }),
      diagnosticRunRoot,
    }),
    /runtime|browser-worker|тайм-аут|timeout|deadline|SIGKILL/u,
  );

  assert.deepEqual(launchedBrowsers, ["chromium", "webkit"]);
  assert.deepEqual(
    fs.readdirSync(diagnosticRunRoot).sort((left, right) => left.localeCompare(right, "en")),
    ["webkit.json"],
    "после сбоя должен остаться ровно файл упавшего WebKit, без диагностики успешного Chromium",
  );
  const diagnostic = JSON.parse(
    fs.readFileSync(path.join(diagnosticRunRoot, "webkit.json"), "utf8"),
  );
  assert.equal(diagnostic.browser, "webkit");
  assert.equal(diagnostic.status, "failed");
});

test("канонический source parity захватывает натуральную сцену против зарегистрированной PNG-основы, а не viewport или самоподобный PNG", () => {
  const captureScript = fs.readFileSync(naturalSourceCaptureScriptPath, "utf8");

  assert.match(
    captureScript,
    /source_parity_capture_method:\s*"playwright-webkit-locator-screenshot-natural-source-pixels"/u,
  );
  assert.match(
    captureScript,
    /natural source parity требует не масштабированную растровую сцену/u,
  );
  assert.match(captureScript, /naturalScenePng\s*=\s*await scene\.screenshot\(\{ scale: "css" \}\);/u);
  assert.match(captureScript, /basePng:\s*readPackageSourcePng\(/u);
  assert.match(captureScript, /renderedPng:\s*naturalScenePng/u);
  assert.match(captureScript, /expectedBaseSha256:\s*binding\.base_sha256/u);
  assert.match(captureScript, /if \(!sourceParity\.passed\)/u);
  assert.doesNotMatch(
    captureScript,
    /inspectRasterSourceParity\(\{[\s\S]{0,400}basePng:\s*naturalScenePng/u,
    "захваченный natural scene не может быть одновременно PNG-основой для самоподобного сравнения",
  );
});

test("natural source parity блокирует дробный bbox и размер, отличный от зарегистрированной PNG-основы", () => {
  const captureScript = fs.readFileSync(naturalSourceCaptureScriptPath, "utf8");

  assert.match(
    captureScript,
    /async function prepareNaturalSourceParityCapture\(page, state\)/u,
    "capture-only подготовка должна быть отдельной от рабочего HTML",
  );
  assert.match(captureScript, /stage\.style\.padding\s*=\s*"0"/u);
  assert.match(captureScript, /root\.style\.justifyItems\s*=\s*"start"/u);
  assert.match(captureScript, /const naturalCapture = await prepareNaturalSourceParityCapture\(page, state\);/u);
  assert.match(
    captureScript,
    /!Number\.isInteger\(naturalCapture\.x\)\s*\|\|\s*!Number\.isInteger\(naturalCapture\.y\)\s*\|\|\s*!Number\.isInteger\(naturalCapture\.width\)\s*\|\|\s*!Number\.isInteger\(naturalCapture\.height\)/u,
    "дробный bbox должен останавливать захват до сравнения PNG",
  );
  assert.match(
    captureScript,
    /naturalCapture\.width\s*!==\s*binding\.natural_dimensions\.width\s*\|\|\s*naturalCapture\.height\s*!==\s*binding\.natural_dimensions\.height/u,
    "bbox должен точно совпасть с натуральными размерами PNG-основы",
  );
  assert.match(
    captureScript,
    /natural source parity требует[^\n]*целочисленную сцену в natural-source-pixels/u,
  );
  assert.match(
    captureScript,
    /const naturalSceneDimensions = canonicalRasterPngDimensions\(naturalScenePng, [^)]+\);/u,
    "после захвата должны проверяться фактические размеры PNG",
  );
  assert.match(
    captureScript,
    /naturalSceneDimensions\.width\s*!==\s*binding\.natural_dimensions\.width\s*\|\|\s*naturalSceneDimensions\.height\s*!==\s*binding\.natural_dimensions\.height/u,
  );
});

test("natural source parity захватывает высокую основу в отдельной WebKit-странице с viewport natural_dimensions", () => {
  const captureScript = fs.readFileSync(naturalSourceCaptureScriptPath, "utf8");

  assert.match(
    captureScript,
    /async function captureNaturalSourceParity\(\{ context, request, state, binding, attemptedNetwork \}\)/u,
    "проверка parity должна быть изолирована от desktop runtime-страницы",
  );
  assert.match(
    captureScript,
    /async function captureNaturalSourceParity\([\s\S]{0,5000}const page = await context\.newPage\(\);[\s\S]{0,5000}await page\.setViewportSize\(\{\s*width: binding\.natural_dimensions\.width,\s*height: binding\.natural_dimensions\.height,?\s*\}\);[\s\S]{0,5000}await page\.goto\(/u,
    "отдельная страница должна получить viewport ровно natural_dimensions до загрузки высокой основы",
  );
  assert.match(
    captureScript,
    /await prepareNaturalSourceParityCapture\(page, state\)/u,
    "capture-only выравнивание должно применяться в отдельной странице",
  );
  assert.match(
    captureScript,
    /request\.source_parity_required\s*\?\s*await captureNaturalSourceParity\(\{ context, request, state, binding, attemptedNetwork \}\)\s*:\s*null/u,
    "desktop-страница не может сама выполнять natural locator screenshot",
  );
  assert.doesNotMatch(
    captureScript,
    /if \(request\.source_parity_required\) \{[\s\S]{0,1200}const naturalScenePng = await scene\.screenshot/u,
    "natural parity нельзя снимать locator-ом desktop-страницы: высокий экран будет обрезан viewport",
  );
});

test("контур source parity блокирует один пиксель вне slot и сторонний PNG, но допускает локальную правку внутри slot", () => {
  assert.equal(
    typeof canonicalRaster.buildNaturalSourceMask,
    "function",
    "канонический растр должен строить маску из натуральных координат slots и protected regions",
  );
  assert.equal(
    typeof canonicalRaster.inspectRasterSourceParity,
    "function",
    "канонический растр должен проверять pixel-exact parity вне slots",
  );

  const naturalDimensions = { width: 4, height: 4 };
  const slots = [{
    id: "local-slot",
    kind: "transparent-semantic-slot",
    rect: { x: 1, y: 1, width: 1, height: 1 },
  }];
  const protectedRegions = [{
    id: "protected-header",
    rect: { x: 3, y: 0, width: 1, height: 1 },
  }];
  const mask = canonicalRaster.buildNaturalSourceMask({
    naturalDimensions,
    slots,
    protectedRegions,
  });
  assert.ok(mask && typeof mask === "object", "маска натуральной растровой основы должна быть построена");

  const baseData = rgbaCanvas(naturalDimensions.width, naturalDimensions.height);
  const basePng = encodeRgbaPng({ ...naturalDimensions, data: baseData });

  const outsideData = cloneRgba(baseData);
  setRgbaPixel(outsideData, naturalDimensions.width, 0, 0, [18, 34, 51, 255]);
  const outsideResult = canonicalRaster.inspectRasterSourceParity({
    stateId: "parity-fixture",
    basePng,
    renderedPng: encodeRgbaPng({ ...naturalDimensions, data: outsideData }),
    naturalDimensions,
    slots,
    protectedRegions,
  });
  assertParityResult(
    outsideResult,
    { stateId: "parity-fixture", naturalDimensions, slots, passed: false },
    "различие одного пикселя вне slot",
  );
  assert.equal(outsideResult.outside_slot_result.differing_pixel_count, 1);
  assert.equal(outsideResult.outside_slot_result.max_channel_delta, 1);
  assert.deepEqual(outsideResult.outside_slot_result.first_difference, { x: 0, y: 0 });

  const slotData = cloneRgba(baseData);
  setRgbaPixel(slotData, naturalDimensions.width, 1, 1, [18, 34, 51, 255]);
  const slotResult = canonicalRaster.inspectRasterSourceParity({
    stateId: "parity-fixture",
    basePng,
    renderedPng: encodeRgbaPng({ ...naturalDimensions, data: slotData }),
    naturalDimensions,
    slots,
    protectedRegions,
  });
  assertParityResult(
    slotResult,
    { stateId: "parity-fixture", naturalDimensions, slots, passed: true },
    "различие одного пикселя внутри slot",
  );
  assert.equal(slotResult.outside_slot_result.differing_pixel_count, 0);
  assert.equal(slotResult.outside_slot_result.first_difference, null);
  assert.equal(slotResult.slots[0].differing_pixel_count, 1);

  const thirdPartyData = rgbaCanvas(naturalDimensions.width, naturalDimensions.height, [237, 12, 71, 255]);
  const thirdPartyResult = canonicalRaster.inspectRasterSourceParity({
    stateId: "parity-fixture",
    basePng,
    renderedPng: encodeRgbaPng({ ...naturalDimensions, data: thirdPartyData }),
    naturalDimensions,
    slots,
    protectedRegions,
  });
  assertParityResult(
    thirdPartyResult,
    { stateId: "parity-fixture", naturalDimensions, slots, passed: false },
    "сторонний PNG того же размера",
  );
  assert.ok(thirdPartyResult.outside_slot_result.differing_pixel_count > 0);

  assert.throws(
    () => canonicalRaster.inspectRasterSourceParity({
      stateId: "parity-fixture",
      basePng,
      renderedPng: encodeRgbaPng({ width: 3, height: 4, data: rgbaCanvas(3, 4) }),
      naturalDimensions,
      slots,
      protectedRegions,
    }),
    /PNG|размер|dimension|размеры/u,
    "иной натуральный размер PNG должен блокировать проверку",
  );
  assert.throws(
    () => canonicalRaster.buildNaturalSourceMask({
      naturalDimensions,
      slots: [{ ...slots[0], rect: { x: 4, y: 1, width: 1, height: 1 } }],
      protectedRegions,
    }),
    /slot|границ|rect/u,
    "slot за натуральным холстом должен блокировать проверку",
  );
  assert.throws(
    () => canonicalRaster.buildNaturalSourceMask({
      naturalDimensions,
      slots,
      protectedRegions: [{ id: "overlap", rect: { x: 1, y: 1, width: 1, height: 1 } }],
    }),
    /slot|protected|пересеч/u,
    "пересечение slot и protected region должно блокировать проверку",
  );
});

test("договор evidence публикует ровно 60 WebKit PNG для 20 активных состояний и отделяет их от обязательной runtime-проверки", () => {
  const stateIds = activeStateIdsFromRegistry();
  const packageContract = readJson(packageContractPath);
  const viewports = canonicalViewportsFromContract(packageContract);
  const publishedPaths = expectedPublishedRasterPaths(packageContract, stateIds);
  const runtimeMatrix = packageContract.evidence_outputs.runtime_validation_matrix;

  assert.equal(publishedPaths.length, stateIds.length * viewports.length);
  assert.equal(publishedPaths.length, 60);
  assert.equal(new Set(publishedPaths).size, publishedPaths.length);
  assert.equal(publishedPaths.some((item) => item.includes("chromium")), false);
  assert.ok(publishedPaths.every((item) => item.startsWith("evidence/screenshots/webkit/")));
  assert.equal(Object.hasOwn(packageContract.evidence_outputs, "matrix"), false);
  assert.deepEqual(runtimeMatrix.map((entry) => entry.browser), runtimeBrowsers);
  for (const entry of runtimeMatrix) {
    assert.equal(entry.state_selection, "all");
    assert.equal(entry.state_source, "source/journey-contract.json#/states");
    assert.deepEqual(entry.viewports, viewports.map((viewport) => viewport.id));
    assert.deepEqual(entry.required_checks, runtimeRequiredChecks);
    assert.equal(entry.published_png, false);
    assert.equal(entry.retained_png, false);
  }
});

test("канонический манифест и оба отчёта доказывают пиксельный source parity вне slots для всех 20 состояний", () => {
  const registry = readJson(activeContractsPath);
  const visualBasis = readJson(visualBasisPath);
  const canonicalManifest = readJson(canonicalRasterManifestPath);
  const browser = readJson(browserReportPath);
  const acceptance = readJson(acceptanceReportPath);
  const stateIds = activeStateIdsFromRegistry(registry);
  const bindingsByStateId = new Map(
    visualBasis.state_bindings.map((binding) => [binding.state_id, binding]),
  );
  const sourceParity = canonicalManifest.source_parity;

  assert.ok(sourceParity && typeof sourceParity === "object" && !Array.isArray(sourceParity));
  assert.deepEqual(Object.keys(sourceParity).sort(), ["policy", "records"]);
  assert.deepEqual(sourceParity.policy, expectedSourceParity);
  assert.ok(Array.isArray(sourceParity.records));
  assert.equal(sourceParity.records.length, stateIds.length);
  assert.deepEqual(
    sourceParity.records.map((record) => record.state_id),
    [...stateIds].sort((left, right) => left.localeCompare(right, "en")),
    "агрегированный source parity должен иметь стабильный порядок, не скрывая ни одного активного состояния",
  );
  assert.equal(new Set(sourceParity.records.map((record) => record.state_id)).size, stateIds.length);

  const resultByStateId = new Map(sourceParity.records.map((record) => [record.state_id, record]));
  for (const stateId of stateIds) {
    const binding = bindingsByStateId.get(stateId);
    const result = resultByStateId.get(stateId);
    assert.ok(binding, `${stateId}: отсутствует binding растровой основы`);
    assertParityResult(
      result,
      {
        stateId,
        naturalDimensions: binding.natural_dimensions,
        slots: binding.slots,
        passed: true,
      },
      `${stateId}: source parity`,
    );
    assert.equal(result.base_sha256, binding.base_sha256, `${stateId}: source parity должен использовать зарегистрированную PNG-основу`);
    assert.equal(result.outside_slot_result.differing_pixel_count, 0, `${stateId}: вне slots запрещено любое различие`);
    assert.equal(result.outside_slot_result.max_channel_delta, 0, `${stateId}: вне slots запрещён допуск по каналу`);
    assert.equal(result.outside_slot_result.first_difference, null, `${stateId}: вне slots не может быть first_difference`);
  }
  assert.deepEqual(browser.source_parity, sourceParity, "browser-report обязан нести полный source parity без отдельной ссылки");
  assert.deepEqual(acceptance.source_parity, sourceParity, "acceptance-report обязан нести полный source parity без отдельной ссылки");
  assert.equal(canonicalManifest.records.length, 60);
  for (const record of canonicalManifest.records) {
    assert.deepEqual(
      record.source_parity,
      resultByStateId.get(record.state_id),
      `${record.viewport}/${record.state_id}: канонический PNG обязан нести результат своего source parity`,
    );
  }
});

test("опубликованные evidence PNG совпадают с канонической 60-кадровой WebKit-матрицей и не содержат Chromium", () => {
  const packageContract = readJson(packageContractPath);
  const stateIds = activeStateIdsFromRegistry();
  const expected = expectedPublishedRasterPaths(packageContract, stateIds).sort();
  const evidenceRoot = path.join(packageRoot, "evidence/screenshots");
  const actual = listFiles(evidenceRoot)
    .filter((filePath) => filePath.endsWith(".png"))
    .map((filePath) => path.relative(packageRoot, filePath).split(path.sep).join("/"))
    .sort();

  assert.deepEqual(actual, expected);
  assert.equal(actual.length, 60);
  assert.equal(actual.some((relativePath) => relativePath.includes("/chromium/")), false);
  assert.equal(
    listFiles(path.join(evidenceRoot, "chromium")).length,
    0,
    "Chromium может создавать временную диагностику вне выпуска, но не опубликованный PNG",
  );
});

test("манифест полного кандидата учитывает ровно 108 активных выходов: 20 растровых основ, 60 WebKit-кадров и без P3/P4", () => {
  const registry = readJson(activeContractsPath);
  const packageContract = readJson(packageContractPath);
  const packageManifest = readJson(packageManifestPath);
  const visualBasis = readJson(visualBasisPath);
  const catalog = readJson(sourceCatalogPath);
  const stateIds = activeStateIdsFromRegistry(registry);
  const expected = expectedGeneratedInventory(packageContract, stateIds);
  const activeBindings = visualBasis.state_bindings;
  const activeBaseIds = new Set(activeBindings.map((binding) => binding.base_id));
  const activeBasePaths = activeBindings.map((binding) => binding.base_path);
  const activeVisiblePatchPaths = activeBindings
    .flatMap((binding) => binding.slots)
    .map((slot) => slot.visible_patch_path)
    .filter((item) => item !== null);
  const archiveMembers = packageContract.archive.members;

  assert.equal(activeBindings.length, stateIds.length);
  assert.deepEqual(activeBindings.map((binding) => binding.state_id), stateIds);
  assert.equal(new Set(activeBasePaths).size, stateIds.length);
  assert.equal(expected.length, 108);
  assert.deepEqual(packageManifest.state_ids, stateIds);
  assert.deepEqual(packageManifest.inventory.exact_generated_paths, expected);
  assert.equal(packageManifest.inventory.generated_output_count, expected.length);
  assert.deepEqual(
    archiveMembers.filter((memberPath) => memberPath.startsWith("source/bases/")),
    activeBasePaths,
    "ZIP должен содержать только 20 активных PNG-основ в порядке маршрута",
  );
  assert.deepEqual(
    archiveMembers.filter((memberPath) => memberPath.startsWith("source/patches/")),
    activeVisiblePatchPaths,
    "ZIP должен содержать только видимые заплаты активного маршрута",
  );
  for (const deferredSourceId of deferredQ4SourceIds(catalog)) {
    assert.equal(activeBaseIds.has(deferredSourceId), false, `${deferredSourceId}: P3/P4 не может быть основой MVP`);
    assert.equal(
      archiveMembers.some((memberPath) => memberPath.includes(deferredSourceId)),
      false,
      `${deferredSourceId}: P3/P4 не может попасть в ZIP`,
    );
  }
});

test("отчёты связывают один кандидат, канонический манифест и 120 runtime-результатов без полей растра", () => {
  const registry = readJson(activeContractsPath);
  const journey = readJson(journeyPath);
  const packageManifest = readJson(packageManifestPath);
  const canonicalManifest = readJson(canonicalRasterManifestPath);
  const acceptance = readJson(acceptanceReportPath);
  const browser = readJson(browserReportPath);
  const candidateFingerprint = packageManifest.candidate_fingerprint;
  const activeRegistrySha256 = sha256File(activeContractsPath);
  const packageContract = readJson(packageContractPath);
  const stateIds = activeStateIdsFromRegistry(registry);
  const archive = readStoredZip(
    fs.readFileSync(path.join(packageRoot, packageContract.archive.path)),
  );
  const archiveManifest = JSON.parse(archive.get("manifest.json").toString("utf8"));

  assertCandidateFingerprint(candidateFingerprint, "prototype-package-manifest.json candidate_fingerprint");
  assert.equal(packageContract.archive.candidate_fingerprint_required, true);
  assert.equal(
    candidateFingerprint.inputs.generated_html.some(
      (record) => record.path === "derived/lisa-presentation-user-journey-demo.zip",
    ),
    false,
    "Сам содержащий отпечаток ZIP не может входить в собственный расчёт",
  );
  assert.deepEqual(archiveManifest.candidate_fingerprint, candidateFingerprint);
  assert.deepEqual(canonicalManifest.candidate_fingerprint, candidateFingerprint);
  assert.deepEqual(browser.candidate_fingerprint, candidateFingerprint);
  assert.deepEqual(acceptance.candidate_fingerprint, candidateFingerprint);
  assert.deepEqual(browser.canonical_raster_manifest, {
    path: canonicalRasterManifestRelativePath,
    sha256: sha256File(canonicalRasterManifestPath),
  });
  assert.equal(Object.hasOwn(canonicalManifest, "capture_tool_warnings"), false);
  assert.equal(Object.hasOwn(browser, "capture_tool_warnings"), false);
  assertCaptureToolWarnings(canonicalManifest.renderer_profile, "канонический WebKit-профиль");
  assertCaptureToolWarnings(browser.renderer_profile, "browser-report WebKit-профиль");
  assert.deepEqual(browser.renderer_profile, canonicalManifest.renderer_profile);
  assert.ok(browser.runtime_profile && typeof browser.runtime_profile === "object");
  assert.deepEqual(Object.keys(browser.runtime_profile).sort(), runtimeBrowsers.slice().sort());
  assert.doesNotMatch(JSON.stringify(browser.runtime_profile), /\/Users\/|file:\/\/|absPath/u);

  assert.deepEqual(journey.states.map((state) => state.id), stateIds);
  assert.deepEqual(browser.active_state_ids, stateIds);
  assert.deepEqual(acceptance.active_state_ids, stateIds);
  assert.equal(browser.active_contracts_sha256, activeRegistrySha256);
  assert.equal(acceptance.active_contracts_sha256, activeRegistrySha256);
  assert.deepEqual(browser.active_contract_ids, registry.active_contracts.map((entry) => entry.id));
  assert.deepEqual(acceptance.active_contract_ids, registry.active_contracts.map((entry) => entry.id));
  assert.equal(browser.mvp_scope, "P1/P2");
  assert.equal(acceptance.mvp_scope, "P1/P2");

  assert.ok(Array.isArray(browser.runtime_results));
  assert.equal(browser.runtime_results.length, 120);
  assert.deepEqual(
    browser.runtime_results.map(runtimeKey).sort(),
    expectedRuntimeKeys(packageContract, stateIds).sort(),
  );
  for (const record of browser.runtime_results) {
    assertRuntimeChecks(record);
    for (const forbidden of ["path", "sha256", "bytes", "png", "png_dimensions", "screenshot"]) {
      assert.equal(
        Object.hasOwn(record, forbidden),
        false,
        `${runtimeKey(record)}: runtime-результат не должен публиковать поле ${forbidden}`,
      );
    }
  }
  assert.equal(Object.hasOwn(browser, "screenshots"), false);
  assert.equal(Object.hasOwn(browser, "screenshot_count"), false);
});

test("evidence и ZIP не выдают P3/P4 за активный MVP и не содержат Chromium PNG", () => {
  const packageContract = readJson(packageContractPath);
  const catalog = readJson(sourceCatalogPath);
  const evidenceFiles = [
    acceptanceReportPath,
    browserReportPath,
    canonicalRasterManifestPath,
    ...listFiles(path.join(packageRoot, "evidence/screenshots")),
  ];
  const archive = readStoredZip(
    fs.readFileSync(path.join(packageRoot, packageContract.archive.path)),
  );

  for (const filePath of evidenceFiles) {
    const content = fs.readFileSync(filePath);
    const text = content.toString("utf8");
    const relativePath = path.relative(root, filePath);
    for (const forbidden of forbiddenEvidenceFragments) {
      assert.equal(text.includes(forbidden), false, `${relativePath}: содержит ${forbidden}`);
    }
    assert.equal(relativePath.includes("/chromium/"), false, `${relativePath}: опубликован Chromium PNG`);
  }
  for (const memberPath of archive.keys()) {
    assert.equal(memberPath.includes("chromium"), false, `ZIP содержит Chromium: ${memberPath}`);
    assert.equal(memberPath.includes("presentation-preview"), false, `ZIP содержит P3/P4: ${memberPath}`);
    for (const deferredSourceId of deferredQ4SourceIds(catalog)) {
      assert.equal(memberPath.includes(deferredSourceId), false, `ZIP содержит P3/P4 основу ${deferredSourceId}`);
    }
  }
});

test("валидатор evidence отвергает расхождение одного пикселя, устаревшую или пропущенную запись и Chromium PNG", () => {
  const firstStateId = activeStateIdsFromRegistry()[0];
  assertEvidenceRejectsMutation(
    "one-pixel-byte-mismatch",
    ({ packageRoot: temporaryPackageRoot }) => {
      const target = path.join(
        temporaryPackageRoot,
        `evidence/screenshots/webkit/mobile-390x844/${firstStateId}.png`,
      );
      changeOnePngPixel(target);
    },
    /sha256|byte|байт|canonical|каноническ/u,
  );
  assertEvidenceRejectsMutation(
    "missing-canonical-record",
    ({ packageRoot: temporaryPackageRoot }) => {
      const manifestPath = path.join(temporaryPackageRoot, canonicalRasterManifestRelativePath);
      const manifest = readJson(manifestPath);
      manifest.records.pop();
      writeJson(manifestPath, manifest);
    },
    /canonical|каноническ|record|запис/u,
  );
  assertEvidenceRejectsMutation(
    "stale-canonical-record",
    ({ packageRoot: temporaryPackageRoot }) => {
      const manifestPath = path.join(temporaryPackageRoot, canonicalRasterManifestRelativePath);
      const manifest = readJson(manifestPath);
      manifest.records[0].sha256 = "0".repeat(64);
      writeJson(manifestPath, manifest);
    },
    /canonical|каноническ|sha256|хэш|record|запис/u,
  );
  assertEvidenceRejectsMutation(
    "mismatched-independent-run",
    ({ packageRoot: temporaryPackageRoot }) => {
      const manifestPath = path.join(temporaryPackageRoot, canonicalRasterManifestRelativePath);
      const manifest = readJson(manifestPath);
      manifest.records[0].runs[1].sha256 = "0".repeat(64);
      writeJson(manifestPath, manifest);
    },
    /canonical|каноническ|run|прогон|sha256|хэш/u,
  );
  assertEvidenceRejectsMutation(
    "second-capture-tool-warning",
    ({ packageRoot: temporaryPackageRoot }) => {
      const manifestPath = path.join(temporaryPackageRoot, canonicalRasterManifestRelativePath);
      const manifest = readJson(manifestPath);
      manifest.renderer_profile.capture_tool_warnings[0].count = 2;
      writeJson(manifestPath, manifest);
    },
    /capture.*warning|предупреж|renderer|profile/u,
  );
  assertEvidenceRejectsMutation(
    "other-capture-tool-warning",
    ({ packageRoot: temporaryPackageRoot }) => {
      const manifestPath = path.join(temporaryPackageRoot, canonicalRasterManifestRelativePath);
      const manifest = readJson(manifestPath);
      manifest.renderer_profile.capture_tool_warnings[0].message = "Неразрешённое предупреждение";
      writeJson(manifestPath, manifest);
    },
    /capture.*warning|предупреж|renderer|profile/u,
  );
  assertEvidenceRejectsMutation(
    "top-level-capture-tool-warning",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.capture_tool_warnings = expectedCaptureToolWarnings;
      writeJson(reportPath, report);
      synchronizeBrowserReportHash(temporaryPackageRoot);
    },
    /browser-report|лишн|неверн|capture.*warning|предупреж/u,
  );
  assertEvidenceRejectsMutation(
    "chromium-png",
    ({ evidenceRoot }) => {
      const target = path.join(
        evidenceRoot,
        `screenshots/chromium/mobile-390x844/${firstStateId}.png`,
      );
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, Buffer.from("not-a-png"));
    },
    /chromium|лишн|неожидан/u,
  );
});

test("валидатор evidence отвергает дрейф policy или P3/P4 в опубликованном source parity", () => {
  assertEvidenceRejectsMutation(
    "source-parity-policy-drift",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.source_parity.policy.comparison = "threshold-outside-slots";
      writeJson(reportPath, report);
      synchronizeBrowserReportHash(temporaryPackageRoot);
    },
    /source.*parity|pixel.*exact|policy|пиксель|политик/u,
  );
  assertEvidenceRejectsMutation(
    "source-parity-p3-p4-state",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.source_parity.records[0].state_id = "lisa-presentation-preview";
      writeJson(reportPath, report);
      synchronizeBrowserReportHash(temporaryPackageRoot);
    },
    /source.*parity|state|состояни|P3|P4/u,
  );
});

test("валидатор evidence отвергает разные отпечатки кандидата, неполный runtime-отчёт и любой сбой проверки", () => {
  assertEvidenceRejectsMutation(
    "registry-state-order",
    ({ packageRoot: temporaryPackageRoot }) => {
      const registryPath = path.join(temporaryPackageRoot, "source/active-contracts.json");
      const registry = readJson(registryPath);
      registry.active_state_ids.reverse();
      writeJson(registryPath, registry);
    },
    /реестр.*состояни|состояни.*реестр|активн.*состояни|состояни.*активн/u,
  );
  assertEvidenceRejectsMutation(
    "zip-candidate-fingerprint",
    ({ packageRoot: temporaryPackageRoot }) => {
      rewriteArchiveManifest(
        path.join(temporaryPackageRoot, "derived/lisa-presentation-user-journey-demo.zip"),
        (manifest) => {
          manifest.candidate_fingerprint = {
            algorithm: "sha256",
            sha256: "0".repeat(64),
            inputs: {},
          };
        },
      );
    },
    /ZIP.*candidate.*fingerprint|ZIP.*отпечаток.*кандидат|переносимый ZIP.*отпечаток/u,
  );
  assertEvidenceRejectsMutation(
    "candidate-fingerprint",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.candidate_fingerprint.sha256 = "0".repeat(64);
      writeJson(reportPath, report);
    },
    /candidate.*fingerprint|отпечаток.*кандидат/u,
  );
  assertEvidenceRejectsMutation(
    "unsorted-candidate-fingerprint-inputs",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      const records = report.candidate_fingerprint.inputs.capture_toolchain;
      [records[0], records[1]] = [records[1], records[0]];
      writeJson(reportPath, report);
    },
    /candidate.*fingerprint|отпечаток.*кандидат|sort|сорт/u,
  );
  assertEvidenceRejectsMutation(
    "partial-runtime-report",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.runtime_results.pop();
      writeJson(reportPath, report);
    },
    /runtime|120|результат|матриц/u,
  );
  assertEvidenceRejectsMutation(
    "wrong-runtime-viewport",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.runtime_results[0].viewport = "tablet-768x1024";
      writeJson(reportPath, report);
    },
    /viewport|окн|runtime|матриц/u,
  );
  assertEvidenceRejectsMutation(
    "runtime-network-failure",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.runtime_results[0].checks.network.network_attempts = ["https://example.invalid/"];
      writeJson(reportPath, report);
    },
    /network|сет|runtime|попыт/u,
  );
  assertEvidenceRejectsMutation(
    "runtime-console-error",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.runtime_results[0].checks.network.console_errors = ["Ошибка JavaScript"];
      writeJson(reportPath, report);
    },
    /console|консол|network|сет|runtime/u,
  );
  assertEvidenceRejectsMutation(
    "runtime-csp-warning-is-not-console-error",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.runtime_results[0].checks.network.console_errors = [
        expectedCaptureToolWarnings[0].message,
      ];
      writeJson(reportPath, report);
    },
    /console|консол|network|сет|runtime/u,
  );
  assertEvidenceRejectsMutation(
    "runtime-page-error",
    ({ packageRoot: temporaryPackageRoot }) => {
      const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
      const report = readJson(reportPath);
      report.runtime_results[0].checks.network.page_errors = ["Ошибка страницы"];
      writeJson(reportPath, report);
    },
    /page|страниц|network|сет|runtime/u,
  );
  for (const [label, mutate] of [
    ["runtime-behavior-failed", (checks) => { checks.behavior.passed = false; }],
    ["runtime-accessibility-failed", (checks) => { checks.accessibility.passed = false; }],
    ["runtime-geometry-failed", (checks) => { checks.geometry.passed = false; }],
    ["runtime-network-failed", (checks) => { checks.network.passed = false; }],
  ]) {
    assertEvidenceRejectsMutation(
      label,
      ({ packageRoot: temporaryPackageRoot }) => {
        const reportPath = path.join(temporaryPackageRoot, "evidence/browser-report.json");
        const report = readJson(reportPath);
        mutate(report.runtime_results[0].checks);
        writeJson(reportPath, report);
      },
      /behavior|доступ|access|geometry|геомет|network|сет|runtime/u,
    );
  }
});

test("две обязательные статусные реплики присутствуют в evidence, третья не появляется", () => {
  const acceptance = readJson(acceptanceReportPath);
  const journey = readJson(journeyPath);

  assert.deepEqual(acceptance.status_messages, [
    journey.copy.generation_started,
    journey.copy.presentation_sent,
  ]);
  assert.equal(acceptance.status_messages.length, 2);
  assert.equal(acceptance.timeline.generation_started_at_ms, 600);
  assert.equal(acceptance.timeline.clock_animation_ends_at_ms, 7600);
  assert.equal(acceptance.timeline.ready_at_ms, 8000);
});
