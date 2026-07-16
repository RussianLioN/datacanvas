import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { webkit } from "@playwright/test";
import { stabilizeBrowserCapture } from "./lib/presentation-link-lisa-user-journey.mjs";

const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
]);
const EXPECTED_WEBKIT_SCREENSHOT_CSP_MESSAGE =
  "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' " +
  "does not appear in the style-src directive of the Content Security Policy.";

function fail(message) {
  throw new Error(message);
}

function readRequest(requestPath) {
  const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));
  const stabilization = request?.capture_stabilization;
  const transport = request?.capture_transport;
  if (
    !request ||
    request.version !== "1.0.0" ||
    request.capture_engine !== "webkit" ||
    !path.isAbsolute(request.demo_path) ||
    !path.isAbsolute(request.output_directory) ||
    !Array.isArray(request.states) ||
    request.states.length === 0
  ) {
    fail("Некорректный запрос на создание производных кадров.");
  }
  if (
    !stabilization ||
    Object.keys(stabilization).length !== 7 ||
    stabilization.wait_for_document_fonts !== true ||
    stabilization.scroll_policy !== "restore-marked-end-after-fonts" ||
    stabilization.focus_policy !==
      "capture-mode-suppress-then-blur-active-element" ||
    stabilization.settle_animation_frames !== 2 ||
    stabilization.explicit_screenshot_style_parameter_used !== false ||
    stabilization.playwright_internal_style_attempt_blocked_by_csp !== true ||
    JSON.stringify(stabilization.browser_launch_args) !== JSON.stringify([])
  ) {
    fail("Запрос не закрепляет обязательную стабилизацию браузерного кадра.");
  }
  if (
    !transport ||
    Object.keys(transport).length !== 4 ||
    transport.mode !== "playwright-route-fulfilled-local-files" ||
    transport.origin !== "http://lisa.invalid" ||
    transport.external_network_requests_allowed !== false ||
    transport.path_escape_blocked !== true
  ) {
    fail("Запрос не закрепляет безопасную локальную доставку ресурсов в браузер.");
  }
  if (request.viewport?.width !== 390 || request.viewport?.height !== 844) {
    fail("Производные кадры должны создаваться в размере 390×844.");
  }
  for (const state of request.states) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(state.id) ||
      !/^[a-f0-9]{64}$/u.test(state.projection_sha256)
    ) {
      fail(`Некорректное состояние запроса: ${state.id}`);
    }
  }
  return request;
}

function relativeFramePath(stateId) {
  return `${stateId}.png`;
}

async function inspectFrame(page) {
  return page.evaluate(() => {
    const phone = document.querySelector(".phone");
    if (!phone) throw new Error("Экран телефона не создан.");
    const phoneRect = phone.getBoundingClientRect();
    const visibleActionLabels = [...phone.querySelectorAll("button:not([disabled])")]
      .filter((button) => {
        const rect = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      })
      .map(
        (button) =>
          button.getAttribute("aria-label") ||
          button.textContent?.replace(/\s+/gu, " ").trim() ||
          "",
      );
    return {
      state_id: phone.getAttribute("data-state-id"),
      projection_sha256: phone.getAttribute("data-projection-sha256"),
      document_width: document.documentElement.scrollWidth,
      document_height: document.documentElement.scrollHeight,
      phone: {
        width: phoneRect.width,
        height: phoneRect.height,
        left: phoneRect.left,
        right: phoneRect.right,
        top: phoneRect.top,
        bottom: phoneRect.bottom,
      },
      composer_count: phone.querySelectorAll(".phone-composer").length,
      clock_overlay_count: phone.querySelectorAll(
        '[data-region-id="time-lapse-overlay"]',
      ).length,
      clock_text: phone.querySelector(".clock-panel")?.textContent
        ?.replace(/\s+/gu, " ")
        .trim() ?? null,
      clock_mode:
        phone
          .querySelector('[data-region-id="time-lapse-overlay"]')
          ?.getAttribute("data-clock-mode") ?? null,
      viewer_surface_count: phone.querySelectorAll(
        '[data-region-id="viewer-surface"]',
      ).length,
      viewer_toolbar_count: phone.querySelectorAll(
        '[data-region-id="viewer-toolbar"]',
      ).length,
      viewer_slide_count: phone.querySelectorAll(".presentation-slide").length,
      notification_surface_count: phone.querySelectorAll(
        ".notification-surface",
      ).length,
      notification_dot_count: phone.querySelectorAll(".notification-dot").length,
      material_section_count: phone.querySelectorAll(".material-section").length,
      visible_action_labels: visibleActionLabels,
      active_element_tag: document.activeElement?.tagName ?? null,
      active_action_id:
        document.activeElement instanceof HTMLElement
          ? document.activeElement.dataset.actionId ?? null
          : null,
    };
  });
}

function resolveLocalResource(demoPath, rawUrl, origin) {
  const url = new URL(rawUrl);
  if (url.origin !== origin) return null;
  let relativePath;
  try {
    relativePath = decodeURIComponent(url.pathname).replace(/^\/+/u, "");
  } catch {
    fail("Виртуальный локальный адрес содержит некорректное кодирование.");
  }
  if (!relativePath || relativePath.includes("\0")) {
    fail("Виртуальный локальный адрес не указывает на файл.");
  }
  const packageDirectory = path.resolve(path.dirname(demoPath), "..");
  const resourcePath = path.resolve(packageDirectory, relativePath);
  if (
    resourcePath === packageDirectory ||
    !resourcePath.startsWith(`${packageDirectory}${path.sep}`)
  ) {
    fail("Виртуальный локальный адрес выходит за границы пакета.");
  }
  if (!fs.existsSync(resourcePath) || !fs.statSync(resourcePath).isFile()) {
    fail(`Виртуальный локальный ресурс отсутствует: ${relativePath}`);
  }
  return {
    path: resourcePath,
    contentType:
      CONTENT_TYPES.get(path.extname(resourcePath).toLowerCase()) ??
      "application/octet-stream",
  };
}

async function main() {
  const [requestPath, reportPath] = process.argv.slice(2);
  if (!requestPath || !reportPath) {
    fail("Ожидались пути к запросу и отчёту создания кадров.");
  }
  const request = readRequest(path.resolve(requestPath));
  const outputDirectory = path.resolve(request.output_directory);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const browser = await webkit.launch({
    headless: true,
    args: request.capture_stabilization.browser_launch_args,
  });
  const browserVersion = browser.version();
  const records = [];
  try {
    const context = await browser.newContext({
      viewport: request.viewport,
      deviceScaleFactor: 1,
      locale: "ru-RU",
      timezoneId: "UTC",
      colorScheme: "light",
      reducedMotion: "reduce",
      serviceWorkers: "block",
    });
    const attemptedNetwork = [];
    let virtualOriginRequests = 0;
    await context.route(/^(?:https?|wss?):/u, async (route) => {
      const rawUrl = route.request().url();
      const localResource = resolveLocalResource(
        request.demo_path,
        rawUrl,
        request.capture_transport.origin,
      );
      if (localResource) {
        virtualOriginRequests += 1;
        await route.fulfill({
          status: 200,
          contentType: localResource.contentType,
          body: fs.readFileSync(localResource.path),
        });
        return;
      }
      attemptedNetwork.push(rawUrl);
      await route.abort("blockedbyclient");
    });
    if (typeof context.routeWebSocket === "function") {
      await context.routeWebSocket(/.*/u, (webSocket) => {
        attemptedNetwork.push(webSocket.url());
        webSocket.close({ code: 1008, reason: "Внешняя сеть запрещена" });
      });
    }
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

    for (const state of request.states) {
      consoleErrors.length = 0;
      pageErrors.length = 0;
      const url = new URL("/demo/index.html", request.capture_transport.origin);
      url.searchParams.set("state", state.id);
      await page.goto(url.href, { waitUntil: "load" });
      await page.locator(`.phone[data-state-id="${state.id}"]`).waitFor();
      await stabilizeBrowserCapture(page, request.capture_stabilization);
      const inspection = await inspectFrame(page);
      const framePath = path.join(outputDirectory, relativeFramePath(state.id));
      await page.screenshot({
        path: framePath,
        fullPage: false,
        scale: "css",
      });
      const toolingConsoleMessages = consoleErrors.filter(
        (message) => message === EXPECTED_WEBKIT_SCREENSHOT_CSP_MESSAGE,
      );
      records.push({
        ...inspection,
        frame_path: relativeFramePath(state.id),
        frame_bytes: fs.statSync(framePath).size,
        console_errors: consoleErrors.filter(
          (message) => message !== EXPECTED_WEBKIT_SCREENSHOT_CSP_MESSAGE,
        ),
        tooling_console_messages: toolingConsoleMessages,
        page_errors: [...pageErrors],
      });
    }
    await context.close();
    if (attemptedNetwork.length > 0) {
      fail(`Попытки обращения к внешней сети: ${attemptedNetwork.join(", ")}`);
    }
    if (virtualOriginRequests === 0) {
      fail("Локальные ресурсы не были доставлены через закреплённый виртуальный адрес.");
    }
    request.virtual_origin_requests = virtualOriginRequests;
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.resolve(reportPath),
    `${JSON.stringify(
      {
        version: "1.0.0",
        browser: `Playwright WebKit ${browserVersion}`,
        capture_engine: request.capture_engine,
        viewport: request.viewport,
        capture_stabilization: request.capture_stabilization,
        capture_transport: request.capture_transport,
        virtual_origin_requests: request.virtual_origin_requests,
        tooling_console_messages: records.reduce(
          (total, record) => total + record.tooling_console_messages.length,
          0,
        ),
        network_requests: 0,
        records,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
