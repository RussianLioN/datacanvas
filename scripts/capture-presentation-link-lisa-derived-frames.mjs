import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { webkit } from "@playwright/test";
import {
  stabilizeBrowserCapture,
} from "./lib/presentation-link-lisa-user-journey.mjs";
import {
  CANONICAL_RASTER_CANDIDATE_COUNT,
  CANONICAL_RASTER_VERSION,
  CANONICAL_RASTER_VIEWPORTS,
  CANONICAL_CAPTURE_TOOL_WARNING,
  NATURAL_SOURCE_CAPTURE_LAYOUT,
  canonicalRasterPngDimensions,
  canonicalRasterSha256,
  hasCanonicalCaptureToolWarnings,
  inspectRasterSourceParity,
  stableCanonicalRasterJson,
} from "./lib/presentation-link-lisa-canonical-raster.mjs";

const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".ttf", "font/ttf"],
]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
let latestCaptureFailure = null;

function fail(message) {
  throw new Error(message);
}

function sanitizeDiagnosticText(value) {
  return String(value ?? "")
    .replace(/file:\/\/[^\s"']+/gu, "[локальный-путь]")
    .replace(/\/(?:Users|home)\/[^\s"']+/gu, "[локальный-путь]")
    .replace(/[A-Za-z]:\\(?:Users|Documents and Settings)\\[^\s"']+/gu, "[локальный-путь]")
    .slice(0, 2000);
}

function sanitizeNetworkAttempt(rawUrl) {
  try {
    const value = new URL(rawUrl);
    value.username = "";
    value.password = "";
    value.search = "";
    value.hash = "";
    return value.href;
  } catch {
    return sanitizeDiagnosticText(rawUrl);
  }
}

function consoleMessageOriginatesFromDemoApplication(message, origin) {
  if (typeof message.location !== "function") return false;
  try {
    const location = message.location();
    if (typeof location?.url !== "string" || location.url.length === 0) return false;
    const source = new URL(location.url);
    return source.origin === origin &&
      (source.pathname === "/demo/app.js" || source.pathname === "/demo/data.js");
  } catch {
    return false;
  }
}

function diagnosticConsoleLocation(message) {
  if (typeof message.location !== "function") return null;
  try {
    const location = message.location();
    return typeof location?.url === "string" && location.url.length > 0
      ? sanitizeNetworkAttempt(location.url)
      : null;
  } catch {
    return null;
  }
}

function isExpectedPlaywrightCspStyleRejection(message, text, policy, origin) {
  return policy?.playwright_internal_style_attempt_blocked_by_csp === true &&
    text === CANONICAL_CAPTURE_TOOL_WARNING.message &&
    !consoleMessageOriginatesFromDemoApplication(message, origin);
}

function requestUsesActiveRegistryStates(request) {
  return Array.isArray(request?.active_state_ids) &&
    request.active_state_ids.length > 0 &&
    new Set(request.active_state_ids).size === request.active_state_ids.length &&
    JSON.stringify(request.states?.map((state) => state?.id)) ===
      JSON.stringify(request.active_state_ids);
}

function safeSourcePath(value) {
  return typeof value === "string" &&
    value.startsWith("source/") &&
    !value.includes("\\") &&
    !path.posix.isAbsolute(value) &&
    !value.includes("\0") &&
    !value.split("/").includes("..") &&
    path.posix.normalize(value) === value;
}

function assertVisualBinding(state) {
  const binding = state?.visual_binding;
  if (
    !binding ||
    binding.state_id !== state.id ||
    !safeSourcePath(binding.base_path) ||
    !binding.base_path.startsWith("source/bases/") ||
    !SHA256_PATTERN.test(binding.base_sha256 ?? "") ||
    !binding.natural_dimensions ||
    !Number.isInteger(binding.natural_dimensions.width) || binding.natural_dimensions.width < 1 ||
    !Number.isInteger(binding.natural_dimensions.height) || binding.natural_dimensions.height < 1 ||
    !Array.isArray(binding.slots) || binding.slots.length === 0 ||
    !Array.isArray(binding.protected_regions) || binding.protected_regions.length === 0
  ) {
    fail(`${String(state?.id)}: запрос не содержит визуальный договор source parity.`);
  }
  for (const slot of binding.slots) {
    if (
      typeof slot?.id !== "string" ||
      !["transparent-semantic-slot", "visible-local-overlay"].includes(slot.kind) ||
      !slot.rect || !Number.isInteger(slot.rect.x) || !Number.isInteger(slot.rect.y) ||
      !Number.isInteger(slot.rect.width) || !Number.isInteger(slot.rect.height)
    ) {
      fail(`${state.id}: запрос содержит некорректный local_slot source parity.`);
    }
  }
  return binding;
}

function readRequest(requestPath) {
  const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));
  if (
    !request ||
    request.version !== CANONICAL_RASTER_VERSION ||
    !Number.isInteger(request.run) ||
    request.run < 1 ||
    request.run > CANONICAL_RASTER_CANDIDATE_COUNT ||
    request.capture_engine !== "webkit" ||
    !request.candidate_fingerprint ||
    request.candidate_fingerprint.algorithm !== "sha256" ||
    !SHA256_PATTERN.test(request.candidate_fingerprint.sha256 ?? "") ||
    !path.isAbsolute(request.demo_path) ||
    !path.isAbsolute(request.output_directory) ||
    !requestUsesActiveRegistryStates(request) ||
    typeof request.source_parity_required !== "boolean"
  ) {
    fail("Некорректный запрос на канонический захват MVP.");
  }
  const viewport = CANONICAL_RASTER_VIEWPORTS.find(
    (candidate) =>
      candidate.id === request.viewport?.id &&
      candidate.width === request.viewport?.width &&
      candidate.height === request.viewport?.height,
  );
  if (!viewport) fail("Запрос не содержит зарегистрированный размер канонического растра.");
  const policy = request.capture_stabilization;
  if (
    !policy ||
    policy.wait_for_document_fonts !== true ||
    policy.scroll_policy !== "restore-marked-end-after-fonts" ||
    policy.focus_policy !== "capture-mode-suppress-then-blur-active-element" ||
    policy.settle_animation_frames !== 2 ||
    policy.explicit_screenshot_style_parameter_used !== false ||
    policy.playwright_internal_style_attempt_blocked_by_csp !== true ||
    JSON.stringify(policy.browser_launch_args) !== JSON.stringify([])
  ) {
    fail("Запрос не закрепляет каноническую стабилизацию кадра MVP.");
  }
  const transport = request.capture_transport;
  if (
    !transport ||
    transport.mode !== "playwright-route-fulfilled-local-files" ||
    transport.origin !== "http://lisa.invalid" ||
    transport.external_network_requests_allowed !== false ||
    transport.path_escape_blocked !== true
  ) {
    fail("Запрос не закрепляет безопасную локальную доставку ресурсов.");
  }
  if (!hasCanonicalCaptureToolWarnings(request.renderer_profile_policy?.capture_tool_warnings)) {
    fail("Запрос не закрепляет договорное предупреждение Playwright CSP.");
  }
  for (const state of request.states) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(state?.id ?? "") ||
      !SHA256_PATTERN.test(state?.projection_sha256 ?? "")
    ) {
      fail(`Некорректное состояние запроса: ${String(state?.id)}`);
    }
    assertVisualBinding(state);
  }
  return { ...request, viewport };
}

function resolveLocalResource(demoPath, rawUrl, origin) {
  const url = new URL(rawUrl);
  if (url.origin !== origin) return null;
  let relativePath;
  try {
    relativePath = decodeURIComponent(url.pathname).replace(/^\/+/u, "");
  } catch {
    fail("Виртуальный адрес содержит некорректное кодирование.");
  }
  if (!relativePath || relativePath.includes("\0")) fail("Виртуальный адрес не указывает на файл.");
  const packageDirectory = path.resolve(path.dirname(demoPath), "..");
  const resourcePath = path.resolve(packageDirectory, relativePath);
  if (
    resourcePath === packageDirectory ||
    !resourcePath.startsWith(`${packageDirectory}${path.sep}`) ||
    relativePath.includes("\\")
  ) {
    fail("Виртуальный адрес выходит за границы пакета.");
  }
  const stat = fs.existsSync(resourcePath) ? fs.lstatSync(resourcePath) : null;
  if (!stat || !stat.isFile() || stat.isSymbolicLink()) {
    fail(`Локальный ресурс отсутствует: ${relativePath}`);
  }
  return {
    path: resourcePath,
    contentType: CONTENT_TYPES.get(path.extname(resourcePath).toLowerCase()) ?? "application/octet-stream",
  };
}

function readPackageSourcePng(demoPath, relativePath, label) {
  if (!safeSourcePath(relativePath)) fail(`${label}: небезопасный путь PNG-основы.`);
  const packageDirectory = path.resolve(path.dirname(demoPath), "..");
  const target = path.resolve(packageDirectory, relativePath);
  if (target === packageDirectory || !target.startsWith(`${packageDirectory}${path.sep}`)) {
    fail(`${label}: PNG-основа выходит за границы пакета.`);
  }
  const stat = fs.existsSync(target) ? fs.lstatSync(target) : null;
  if (!stat || !stat.isFile() || stat.isSymbolicLink()) {
    fail(`${label}: PNG-основа отсутствует.`);
  }
  return fs.readFileSync(target);
}

async function inspectFrame(page) {
  return page.evaluate(() => {
    const scene = document.querySelector(".prototype-scene[data-prototype-scene]");
    const base = scene?.querySelector("img.scene-base[data-source-base-id]");
    if (!scene || !base) throw new Error("Растровая сцена не создана.");
    const rect = scene.getBoundingClientRect();
    return {
      state_id: scene.getAttribute("data-state-id"),
      projection_sha256: scene.getAttribute("data-projection-sha256"),
      document_width: document.documentElement.scrollWidth,
      document_height: document.documentElement.scrollHeight,
      scene: {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      },
      base: {
        source_base_id: base.getAttribute("data-source-base-id"),
        src: base.getAttribute("src"),
        natural_width: base.naturalWidth,
        natural_height: base.naturalHeight,
        complete: base.complete,
      },
    };
  });
}

async function prepareNaturalSourceParityCapture(page, state) {
  const naturalCapture = await page.evaluate(() => {
    const stage = document.querySelector(".scene-stage");
    const root = document.querySelector("#prototype-root");
    const scene = document.querySelector(".prototype-scene[data-prototype-scene]");
    if (!stage || !root || !scene) throw new Error("Растровая сцена natural capture не создана.");
    stage.style.padding = "0";
    root.style.justifyItems = "start";
    const rect = scene.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const settled = await page.locator(".prototype-scene[data-prototype-scene]").evaluate((scene) => {
    const rect = scene.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  if (JSON.stringify(naturalCapture) !== JSON.stringify(settled)) {
    fail(`${state.id}: natural source parity capture-only layout не стабилизировался`);
  }
  return settled;
}

function captureStateUrl(request, state) {
  const url = new URL("/demo/index.html", request.capture_transport.origin);
  url.searchParams.set("state", state.id);
  return url.href;
}

function assertNaturalSourceCaptureBounds({ state, naturalCapture, binding }) {
  if (
    !Number.isInteger(naturalCapture.x) || !Number.isInteger(naturalCapture.y) ||
    !Number.isInteger(naturalCapture.width) || !Number.isInteger(naturalCapture.height) ||
    naturalCapture.x !== NATURAL_SOURCE_CAPTURE_LAYOUT.expected_origin.x ||
    naturalCapture.y !== NATURAL_SOURCE_CAPTURE_LAYOUT.expected_origin.y ||
    naturalCapture.width !== binding.natural_dimensions.width ||
    naturalCapture.height !== binding.natural_dimensions.height
  ) {
    fail(`${state.id}: natural source parity требует не масштабированную растровую сцену и целочисленную сцену в natural-source-pixels`);
  }
}

async function captureNaturalSourceParity({ context, request, state, binding, attemptedNetwork }) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const expectedCspStyleRejections = [];
  const networkAttemptCount = attemptedNetwork.length;
  let screenshotInProgress = false;
  let resolveExpectedScreenshotWarning;
  const expectedScreenshotWarning = new Promise((resolve) => {
    resolveExpectedScreenshotWarning = resolve;
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = sanitizeDiagnosticText(message.text());
    if (isExpectedPlaywrightCspStyleRejection(
      message,
      text,
      request.capture_stabilization,
      request.capture_transport.origin,
    ) && screenshotInProgress) {
      expectedCspStyleRejections.push(text);
      resolveExpectedScreenshotWarning();
      return;
    }
    consoleErrors.push(text);
  });
  page.on("pageerror", (error) => pageErrors.push(sanitizeDiagnosticText(error.message)));
  await page.setViewportSize({
    width: binding.natural_dimensions.width,
    height: binding.natural_dimensions.height,
  });
  await page.addInitScript(() => {
    Date.now = () => 1786473600000;
    window.__DATACANVAS_LISA_CAPTURE__ = true;
  });
  try {
    await page.goto(captureStateUrl(request, state), { waitUntil: "load" });
    const scene = page.locator(`.prototype-scene[data-prototype-scene][data-state-id="${state.id}"]`);
    await scene.waitFor();
    await page.locator("img.scene-base[data-source-base-id]").waitFor();
    await stabilizeBrowserCapture(page, request.capture_stabilization);
    const inspection = await inspectFrame(page);
    if (inspection.state_id !== state.id || inspection.projection_sha256 !== state.projection_sha256) {
      fail(`${state.id}: natural source parity отрисовал неверное состояние`);
    }
    if (
      inspection.base.complete !== true ||
      inspection.base.natural_width !== binding.natural_dimensions.width ||
      inspection.base.natural_height !== binding.natural_dimensions.height
    ) {
      fail(`${state.id}: natural source parity не загрузил зарегистрированную растровую основу`);
    }
    const naturalCapture = await prepareNaturalSourceParityCapture(page, state);
    assertNaturalSourceCaptureBounds({ state, naturalCapture, binding });
    let naturalScenePng;
    screenshotInProgress = true;
    try {
      naturalScenePng = await scene.screenshot({ scale: "css" });
      await waitForExpectedScreenshotWarning(expectedScreenshotWarning);
    } finally {
      screenshotInProgress = false;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    const naturalSceneDimensions = canonicalRasterPngDimensions(naturalScenePng, `${state.id}: natural scene`);
    if (
      naturalSceneDimensions.width !== binding.natural_dimensions.width ||
      naturalSceneDimensions.height !== binding.natural_dimensions.height
    ) {
      fail(`${state.id}: natural source parity PNG не совпадает с natural_dimensions`);
    }
    if (
      expectedCspStyleRejections.length !== CANONICAL_CAPTURE_TOOL_WARNING.count ||
      consoleErrors.length > 0 ||
      pageErrors.length > 0 ||
      attemptedNetwork.length !== networkAttemptCount
    ) {
      fail(`${state.id}: natural source parity зафиксировал ошибку или обращение к сети`);
    }
    const sourceParity = inspectRasterSourceParity({
      stateId: state.id,
      basePng: readPackageSourcePng(request.demo_path, binding.base_path, state.id),
      renderedPng: naturalScenePng,
      naturalDimensions: binding.natural_dimensions,
      slots: binding.slots,
      protectedRegions: binding.protected_regions,
      expectedBaseSha256: binding.base_sha256,
    });
    if (!sourceParity.passed) {
      fail(
        `${state.id}: source parity нарушен вне local_slots: ` +
        `${sourceParity.outside_slot_result.differing_pixel_count} px, ` +
        `first=${JSON.stringify(sourceParity.outside_slot_result.first_difference)}`,
      );
    }
    return sourceParity;
  } finally {
    await page.close();
  }
}

function waitForExpectedScreenshotWarning(warningReceived) {
  return Promise.race([
    warningReceived,
    new Promise((resolve) => setTimeout(resolve, 250)),
  ]);
}

function rendererProfile(browserVersion, request) {
  return {
    capture_engine: "webkit",
    capture_method: "playwright-webkit-page-screenshot",
    browser_version: browserVersion,
    node_version: process.version,
    headless: true,
    device_scale_factor: 1,
    locale: "ru-RU",
    timezone: "UTC",
    color_scheme: "light",
    reduced_motion: "reduce",
    service_workers: "block",
    source_parity_capture_method: "playwright-webkit-locator-screenshot-natural-source-pixels",
    source_parity_capture_layout: {
      mode: NATURAL_SOURCE_CAPTURE_LAYOUT.mode,
      scene_stage_padding: NATURAL_SOURCE_CAPTURE_LAYOUT.scene_stage_padding,
      prototype_root_justify_items: NATURAL_SOURCE_CAPTURE_LAYOUT.prototype_root_justify_items,
      expected_origin: { ...NATURAL_SOURCE_CAPTURE_LAYOUT.expected_origin },
    },
    capture_stabilization: request.capture_stabilization,
    capture_transport: request.capture_transport,
    capture_tool_warnings: request.renderer_profile_policy.capture_tool_warnings.map(
      (warning) => ({ ...warning }),
    ),
  };
}

async function captureState({ context, request, state, attemptedNetwork }) {
  const page = await context.newPage();
  const consoleErrors = [];
  const consoleErrorMetadata = [];
  const expectedCspStyleRejections = [];
  const pageErrors = [];
  let screenshotInProgress = false;
  let resolveExpectedScreenshotWarning;
  const expectedScreenshotWarning = new Promise((resolve) => {
    resolveExpectedScreenshotWarning = resolve;
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = sanitizeDiagnosticText(message.text());
    consoleErrorMetadata.push({
      message: text,
      location: diagnosticConsoleLocation(message),
      screenshot_in_progress: screenshotInProgress,
    });
    if (isExpectedPlaywrightCspStyleRejection(
      message,
      text,
      request.capture_stabilization,
      request.capture_transport.origin,
    ) && screenshotInProgress) {
      expectedCspStyleRejections.push(text);
      resolveExpectedScreenshotWarning();
      return;
    }
    consoleErrors.push(text);
  });
  page.on("pageerror", (error) => pageErrors.push(sanitizeDiagnosticText(error.message)));
  await page.addInitScript(() => {
    Date.now = () => 1786473600000;
    window.__DATACANVAS_LISA_CAPTURE__ = true;
  });
  try {
    await page.goto(captureStateUrl(request, state), { waitUntil: "load" });
    const scene = page.locator(`.prototype-scene[data-prototype-scene][data-state-id="${state.id}"]`);
    await scene.waitFor();
    await page.locator("img.scene-base[data-source-base-id]").waitFor();
    await stabilizeBrowserCapture(page, request.capture_stabilization);
    const inspection = await inspectFrame(page);
    if (inspection.state_id !== state.id || inspection.projection_sha256 !== state.projection_sha256) {
      fail(`${state.id}: браузер отрисовал неверное состояние`);
    }
    const binding = assertVisualBinding(state);
    if (
      inspection.base.complete !== true ||
      inspection.base.natural_width !== binding.natural_dimensions.width ||
      inspection.base.natural_height !== binding.natural_dimensions.height
    ) {
      fail(`${state.id}: браузер не загрузил зарегистрированную растровую основу`);
    }
    let bytes;
    screenshotInProgress = true;
    try {
      bytes = await page.screenshot({ fullPage: false, scale: "css" });
      await waitForExpectedScreenshotWarning(expectedScreenshotWarning);
    } finally {
      screenshotInProgress = false;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    const pngDimensions = canonicalRasterPngDimensions(bytes, state.id);
    if (
      pngDimensions.width !== request.viewport.width ||
      pngDimensions.height !== request.viewport.height
    ) {
      fail(`${state.id}: PNG не совпадает с размером зарегистрированного viewport`);
    }
    if (
      expectedCspStyleRejections.length !== CANONICAL_CAPTURE_TOOL_WARNING.count ||
      consoleErrors.length > 0 ||
      pageErrors.length > 0 ||
      attemptedNetwork.length > 0
    ) {
      fail(`${state.id}: браузерный захват зафиксировал ошибку или обращение к сети`);
    }
    const sourceParity = request.source_parity_required
      ? await captureNaturalSourceParity({ context, request, state, binding, attemptedNetwork })
      : null;
    const framePath = path.join(request.output_directory, `${state.id}.png`);
    fs.writeFileSync(framePath, bytes, { flag: "wx" });
    return {
      ...inspection,
      frame_path: `${state.id}.png`,
      bytes: bytes.length,
      sha256: canonicalRasterSha256(bytes),
      png_dimensions: pngDimensions,
      source_parity: sourceParity,
      console_errors: consoleErrors,
      page_errors: pageErrors,
      network_requests: 0,
    };
  } catch (error) {
    latestCaptureFailure = {
      state_id: state.id,
      message: sanitizeDiagnosticText(error instanceof Error ? error.message : "канонический захват не выполнен"),
      console_errors: consoleErrors,
      console_error_metadata: consoleErrorMetadata,
      page_errors: pageErrors,
      network_attempts: [...attemptedNetwork],
    };
    throw error;
  } finally {
    await page.close();
  }
}

function writeFailedCaptureReport(requestPath, reportPath, error) {
  let request;
  try {
    request = readRequest(path.resolve(requestPath));
    if (fs.existsSync(reportPath)) return;
    fs.mkdirSync(path.dirname(path.resolve(reportPath)), { recursive: true });
    const failure = latestCaptureFailure ?? {
      state_id: null,
      message: sanitizeDiagnosticText(error instanceof Error ? error.message : "канонический захват не выполнен"),
      console_errors: [],
      page_errors: [],
      network_attempts: [],
    };
    fs.writeFileSync(
      path.resolve(reportPath),
      stableCanonicalRasterJson({
        version: CANONICAL_RASTER_VERSION,
        status: "failed",
        capture_engine: "webkit",
        run: request.run,
        candidate_fingerprint: request.candidate_fingerprint,
        viewport: request.viewport,
        failure,
      }),
      { flag: "wx" },
    );
  } catch {
    // Основная ошибка захвата важнее вторичной ошибки записи диагностического отчёта.
  }
}

async function main() {
  const [requestPath, reportPath] = process.argv.slice(2);
  if (!requestPath || !reportPath) fail("Ожидались пути запроса и отчёта канонического захвата.");
  const request = readRequest(path.resolve(requestPath));
  if (fs.existsSync(request.output_directory)) {
    const entries = fs.readdirSync(request.output_directory);
    if (entries.length > 0) fail("Каталог канонического захвата должен быть пустым.");
  }
  fs.mkdirSync(request.output_directory, { recursive: true });
  const browser = await webkit.launch({ headless: true, args: request.capture_stabilization.browser_launch_args });
  const browserVersion = browser.version();
  const attemptedNetwork = [];
  let virtualOriginRequests = 0;
  try {
    const context = await browser.newContext({
      viewport: { width: request.viewport.width, height: request.viewport.height },
      deviceScaleFactor: 1,
      locale: "ru-RU",
      timezoneId: "UTC",
      colorScheme: "light",
      reducedMotion: "reduce",
      serviceWorkers: "block",
    });
    try {
      await context.route(/^(?:https?|wss?):/u, async (route) => {
        const rawUrl = route.request().url();
        const local = resolveLocalResource(request.demo_path, rawUrl, request.capture_transport.origin);
        if (local) {
          virtualOriginRequests += 1;
          await route.fulfill({
            status: 200,
            contentType: local.contentType,
            body: fs.readFileSync(local.path),
          });
          return;
        }
        attemptedNetwork.push(sanitizeNetworkAttempt(rawUrl));
        await route.abort("blockedbyclient");
      });
      if (typeof context.routeWebSocket === "function") {
        await context.routeWebSocket(/.*/u, (socket) => {
          attemptedNetwork.push(sanitizeNetworkAttempt(socket.url()));
          socket.close({ code: 1008, reason: "Сеть запрещена" });
        });
      }
      const records = [];
      for (const state of request.states) {
        records.push(await captureState({ context, request, state, attemptedNetwork }));
      }
      if (attemptedNetwork.length > 0) {
        fail(`Попытки обращения к внешней сети: ${attemptedNetwork.join(", ")}`);
      }
      if (virtualOriginRequests === 0) fail("Локальные ресурсы не были доставлены через виртуальный адрес.");
      fs.writeFileSync(
        path.resolve(reportPath),
        stableCanonicalRasterJson({
          version: CANONICAL_RASTER_VERSION,
          run: request.run,
          capture_engine: "webkit",
          candidate_fingerprint: request.candidate_fingerprint,
          viewport: request.viewport,
          renderer_profile: rendererProfile(browserVersion, request),
          virtual_origin_requests: virtualOriginRequests,
          network_requests: 0,
          records,
        }),
        { flag: "wx" },
      );
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  const [requestPath, reportPath] = process.argv.slice(2);
  if (requestPath && reportPath) writeFailedCaptureReport(requestPath, reportPath, error);
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "канонический захват не выполнен"}\n`);
  process.exit(1);
});
