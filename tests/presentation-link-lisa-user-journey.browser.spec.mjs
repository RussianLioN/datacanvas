import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readStoredZip } from "../scripts/lib/documentation-archive.mjs";
import { WEBKIT_EVIDENCE_STATE_IDS } from "../scripts/lib/presentation-link-lisa-user-journey.mjs";

const root = process.cwd();
const packageRoot = path.join(
  root,
  "docs/product/analysis/presentation-link-lisa-user-journey",
);
const demoPath = path.join(packageRoot, "demo/index.html");
const portableArchivePath = path.join(
  packageRoot,
  "derived/lisa-presentation-user-journey-demo.zip",
);
const virtualOrigin = "http://lisa.invalid";
const demoStylesUrl = new URL("/demo/styles.css", virtualOrigin).href;
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
]);
const journey = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "source/journey-contract.json"), "utf8"),
);
const presentationPreview = JSON.parse(
  fs.readFileSync(
    path.join(packageRoot, "source/presentation-preview-contract.json"),
    "utf8",
  ),
);
const allStateIds = journey.states.map((state) => state.id);
const statesById = new Map(journey.states.map((state) => [state.id, state]));
const webkitCriticalStateIds = new Set(WEBKIT_EVIDENCE_STATE_IDS);
const requiredViewports = [
  { id: "desktop-1280x720", width: 1280, height: 720 },
  { id: "mobile-390x844", width: 390, height: 844 },
  { id: "stress-320x568", width: 320, height: 568 },
];

function demoUrl(targetDemoPath = null) {
  return targetDemoPath
    ? pathToFileURL(targetDemoPath)
    : new URL("/demo/index.html", virtualOrigin);
}

function extractPortableArchive(targetRoot) {
  const members = readStoredZip(fs.readFileSync(portableArchivePath));
  for (const [relativePath, content] of members) {
    const targetPath = path.join(targetRoot, ...relativePath.split("/"));
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
  }
  return [...members.keys()];
}

async function openState(page, stateId, targetDemoPath = null) {
  const url = demoUrl(targetDemoPath);
  url.searchParams.set("state", stateId);
  await page.goto(url.href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".phone")).toHaveAttribute("data-state-id", stateId);
}

async function collectGeometry(page) {
  return page.evaluate(() => {
    const phone = document.querySelector(".phone");
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
    const intersection = (left, right) => {
      const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
      const height = Math.max(
        0,
        Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top),
      );
      return { width, height, area: width * height };
    };
    const interactive = [...phone.querySelectorAll("button:not([disabled])")].filter(visible);
    const textNodes = [
      ...phone.querySelectorAll(
        ".message-card h2, .message-card h3, .message-card p, .message-card li, .message-card span, .notification-card h3, .notification-card p, .notification-card span, .notification-card time, .viewer-card h2, .viewer-card p, .viewer-card li, .button",
      ),
    ].filter(visible);
    const actionGroups = [...phone.querySelectorAll(".actions")].map((group) => ({
      width: group.getBoundingClientRect().width,
      items: [...group.querySelectorAll(":scope > button")].filter(visible).map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          id: button.getAttribute("data-action-id"),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      }),
    }));
    const actionIssues = [];
    for (const group of actionGroups) {
      for (let leftIndex = 0; leftIndex < group.items.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < group.items.length; rightIndex += 1) {
          const left = group.items[leftIndex];
          const right = group.items[rightIndex];
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
            actionIssues.push(`${left.id} и ${right.id}: интервал ${gap}px`);
          }
        }
      }
    }
    return {
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
        transform: getComputedStyle(phone).transform,
      },
      actions: interactive.map((action) => {
        const rect = action.getBoundingClientRect();
        return {
          id:
            action.getAttribute("data-action-id") ||
            action.getAttribute("aria-label") ||
            action.textContent.trim(),
          width: rect.width,
          height: rect.height,
          scrollWidth: action.scrollWidth,
          clientWidth: action.clientWidth,
          scrollHeight: action.scrollHeight,
          clientHeight: action.clientHeight,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          visibleArea: intersection(rect, phoneRect).area,
          area: rect.width * rect.height,
          fullyInsidePhone:
            rect.left >= phoneRect.left - 1 &&
            rect.right <= phoneRect.right + 1 &&
            rect.top >= phoneRect.top - 1 &&
            rect.bottom <= phoneRect.bottom + 1,
        };
      }),
      textOverflow: textNodes
        .filter(
          (node) =>
            node.scrollWidth > node.clientWidth + 1 ||
            node.scrollHeight > node.clientHeight + 1,
        )
        .map((node) => ({
          tag: node.tagName,
          className: node.className,
          text: node.textContent.trim().slice(0, 80),
          scrollWidth: node.scrollWidth,
          clientWidth: node.clientWidth,
          scrollHeight: node.scrollHeight,
          clientHeight: node.clientHeight,
        })),
      actionGroups,
      actionIssues,
      fontLoaded: document.fonts.check('16px "Noto Sans"'),
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

function assertLocalResources(resourceUrls, expectedPackageRoot = packageRoot) {
  for (const resourceUrl of resourceUrls) {
    const url = new URL(resourceUrl);
    expect(["file:", "http:", "data:", "blob:", "about:"]).toContain(url.protocol);
    if (url.protocol === "http:") {
      expect(url.origin).toBe(virtualOrigin);
      const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/u, "");
      const resourcePath = path.resolve(packageRoot, relativePath);
      const resolvedRoot = path.resolve(packageRoot);
      expect(
        resourcePath === resolvedRoot || resourcePath.startsWith(`${resolvedRoot}${path.sep}`),
      ).toBe(true);
    }
    if (url.protocol === "file:") {
      const resourcePath = path.resolve(fileURLToPath(url));
      const resolvedRoot = path.resolve(expectedPackageRoot);
      expect(
        resourcePath === resolvedRoot || resourcePath.startsWith(`${resolvedRoot}${path.sep}`),
      ).toBe(true);
    }
  }
}

function isAxeStylesheetConnectNoise(message) {
  const chromiumMessage =
    `Connecting to '${demoStylesUrl}' violates the following Content Security Policy ` +
    `directive: "connect-src 'none'". The action has been blocked.`;
  const webkitMessage =
    `Refused to connect to ${demoStylesUrl} because it does not appear in the ` +
    "connect-src directive of the Content Security Policy.";
  return message === chromiumMessage || message === webkitMessage;
}

async function installVirtualPackageRoute(context) {
  await context.route(/^https?:/u, async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin !== virtualOrigin) {
      await route.abort("blockedbyclient");
      return;
    }
    const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/u, "");
    const targetPath = path.resolve(packageRoot, relativePath);
    const resolvedRoot = path.resolve(packageRoot);
    if (
      !targetPath.startsWith(`${resolvedRoot}${path.sep}`) ||
      !fs.existsSync(targetPath) ||
      !fs.statSync(targetPath).isFile()
    ) {
      await route.abort("blockedbyclient");
      return;
    }
    await route.fulfill({
      status: 200,
      body: fs.readFileSync(targetPath),
      contentType:
        contentTypes.get(path.extname(targetPath).toLowerCase()) ||
        "application/octet-stream",
    });
  });
}

test.beforeEach(async ({ context, page }) => {
  const attemptedNetwork = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("request", (request) => {
    const requestUrl = new URL(request.url());
    if (
      !["file:", "data:", "blob:", "about:"].includes(requestUrl.protocol) &&
      requestUrl.origin !== virtualOrigin
    ) {
      attemptedNetwork.push(request.url());
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await installVirtualPackageRoute(context);
  if (typeof context.routeWebSocket === "function") {
    await context.routeWebSocket(/.*/u, (webSocket) => {
      attemptedNetwork.push(webSocket.url());
      webSocket.close({ code: 1008, reason: "Внешняя сеть запрещена" });
    });
  }
  page.__attemptedNetwork = attemptedNetwork;
  page.__consoleErrors = consoleErrors;
  page.__pageErrors = pageErrors;
});

for (const stateId of allStateIds) {
  test(`${stateId}: доступность, геометрия и автономность`, async ({ page, browserName }) => {
    test.skip(
      browserName === "webkit" && !webkitCriticalStateIds.has(stateId),
      "WebKit проверяет согласованный критический путь",
    );
    await openState(page, stateId);
    const state = statesById.get(stateId);
    const geometry = await collectGeometry(page);
    expect(geometry.documentScrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.phone.left).toBeGreaterThanOrEqual(-1);
    expect(geometry.phone.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.phone.width).toBeLessThanOrEqual(375);
    expect(geometry.phone.height).toBeLessThanOrEqual(812);
    expect(geometry.phone.transform).toBe("none");
    expect(geometry.fontLoaded).toBe(true);
    expect(geometry.textOverflow).toEqual([]);
    expect(geometry.actionIssues).toEqual([]);
    for (const action of geometry.actions) {
      expect(action.width, `${action.id}: ширина области нажатия`).toBeGreaterThanOrEqual(44);
      expect(action.height, `${action.id}: высота области нажатия`).toBeGreaterThanOrEqual(44);
      expect(action.scrollWidth, `${action.id}: горизонтальное переполнение`).toBeLessThanOrEqual(
        action.clientWidth + 1,
      );
      expect(action.scrollHeight, `${action.id}: вертикальное переполнение`).toBeLessThanOrEqual(
        action.clientHeight + 1,
      );
      expect(action.visibleArea, `${action.id}: действие не пересекается с телефоном`).toBeGreaterThan(
        0,
      );
    }
    const standaloneSurface =
      state.kind === "viewer" || state.kind.startsWith("notification");
    await expect(page.locator(".phone-composer")).toHaveCount(standaloneSurface ? 0 : 1);
    assertLocalResources(geometry.resourceUrls);
    expect(page.__consoleErrors).toEqual([]);
    expect(page.__pageErrors).toEqual([]);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(page.__attemptedNetwork).toEqual([]);
    const unexpectedAuditConsoleErrors = page.__consoleErrors.filter(
      (message) => !isAxeStylesheetConnectNoise(message),
    );
    expect(unexpectedAuditConsoleErrors).toEqual([]);
    expect(page.__pageErrors).toEqual([]);
  });
}

test("компоновка действий зависит от фактической ширины содержимого", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 812 },
    { width: 375, height: 812 },
    { width: 389, height: 812 },
    { width: 390, height: 844 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await openState(page, "lisa-materials-ready");
    const layout = await page.locator(".actions-materials").evaluate((group) => {
      const width = group.getBoundingClientRect().width;
      const boxes = [...group.querySelectorAll(":scope > .button")].map((item) => {
        const rect = item.getBoundingClientRect();
        return { top: Math.round(rect.top), left: Math.round(rect.left) };
      });
      return {
        width,
        firstRowCount: boxes.filter((box) => box.top === boxes[0].top).length,
      };
    });
    expect(layout.firstRowCount).toBe(layout.width >= 356 ? 2 : 1);
  }
});

test("неизвестное и повторённое состояние открывает безопасную ошибку", async ({ page }) => {
  for (const search of [
    "?state=unknown",
    "?state=lisa-materials-ready&state=lisa-offline",
    "?state=%3Cscript%3E",
  ]) {
    const url = demoUrl();
    url.search = search;
    await page.goto(url.href);
    await expect(page.getByRole("alert")).toContainText("Не удалось открыть состояние");
    await expect(page.getByRole("button", { name: "Открыть начало" })).toBeVisible();
  }
});

test("основной браузерный профиль использует безопасный виртуальный адрес", async ({
  page,
}) => {
  await openState(page, "lisa-materials-ready");
  const currentUrl = new URL(page.url());
  expect(currentUrl.origin).toBe("http://lisa.invalid");
  expect(currentUrl.pathname).toBe("/demo/index.html");
  expect(page.__attemptedNetwork).toEqual([]);
});

test("стартовый экран сохраняет структуру итоговых материалов вызывающего агента", async ({
  page,
}) => {
  await openState(page, "lisa-materials-ready");
  for (const heading of [
    "Участники встречи",
    "Повестка встречи",
    "Сотрудничество",
    "Предодобренные предложения",
    "Договорённости с прошлой встречи",
    "Риски и инсайты о других банках",
    "С чего начать диалог",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toHaveCount(1);
  }
  await expect(page.getByRole("button", { name: "Заказать презентацию" })).toBeVisible();
  await expect(page.getByText("Холдинг ГК Достовалова")).toBeVisible();
  await expect(page.getByText("ИП Достовалова", { exact: true })).toBeVisible();
  await expect(page.getByText("Достовалова Ирина Антоновна")).toBeVisible();
  await expect(page.getByText("Савёлов Антон Игоревич")).toBeVisible();
  await expect(page.getByText("Эквайринг", { exact: true })).toBeVisible();
  await expect(page.getByText("1 250 млн ₽", { exact: true })).toBeVisible();
  for (const label of [
    "Обязательно",
    "Дополнительно",
    "Наблюдение",
    "Договорённость",
    "Новость",
  ]) {
    await expect(page.locator(".material-tag", { hasText: label }).first()).toBeVisible();
  }
  for (const internalValue of [
    "mandatory",
    "optional",
    "insight",
    "agreement",
    "news",
  ]) {
    await expect(
      page.locator(".material-tag").filter({ hasText: new RegExp(`^${internalValue}$`, "u") }),
    ).toHaveCount(0);
  }
  await expect(page.locator(".phone-status .time")).toHaveText("13:24");
  await expect(page.locator('a[href^="http"]')).toHaveCount(0);
});

test("заказ использует точную восьмисекундную шкалу и конечную анимацию часов", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Управляемое время проверяется один раз в Chromium");
  const startTime = new Date("2026-07-16T10:24:00Z");
  await page.clock.install({ time: startTime });
  await page.clock.pauseAt(startTime);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openState(page, "lisa-materials-ready");
  await page.getByRole("button", { name: "Заказать презентацию" }).click();

  await page.clock.runFor(599);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-order-submitting",
  );
  await page.clock.runFor(1);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );
  await expect(page.getByRole("status")).toContainText("Презентация готовится");
  await expect(page.getByRole("heading", { name: "Презентация готовится" })).toBeFocused();
  const overlay = page.locator('[data-region-id="time-lapse-overlay"]');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText("Проходит 20 минут");
  await expect(overlay).toHaveCSS("pointer-events", "none");
  const initialMinuteTransform = await overlay
    .locator(".clock-hand-minute")
    .evaluate((node) => getComputedStyle(node).transform);

  await page.clock.runFor(6999);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );
  const finalMinuteTransform = await overlay
    .locator(".clock-hand-minute")
    .evaluate((node) => getComputedStyle(node).transform);
  expect(finalMinuteTransform).not.toBe(initialMinuteTransform);
  await page.clock.runFor(400);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );
  await page.clock.runFor(1);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-ready-unread",
  );
  await expect(overlay).toHaveCount(0);
  await expect(page.locator(".phone-status .time")).toHaveText("13:44");
});

test("прямая ссылка на подготовку не запускает автоматическую готовность", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Управляемое время проверяется один раз в Chromium");
  const startTime = new Date("2026-07-16T10:24:00Z");
  await page.clock.install({ time: startTime });
  await page.clock.pauseAt(startTime);
  await openState(page, "lisa-presentation-generating");
  await page.clock.runFor(10000);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );
});

test("колокольчик не отменяет и не ускоряет фоновую подготовку", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Управляемое время проверяется один раз в Chromium");
  const startTime = new Date("2026-07-16T10:24:00Z");
  await page.clock.install({ time: startTime });
  await page.clock.pauseAt(startTime);
  await openState(page, "lisa-materials-ready");
  await page.getByRole("button", { name: "Заказать презентацию" }).click();
  await page.clock.runFor(600);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );

  await page.getByRole("button", { name: "Уведомления", exact: true }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-notifications-list-empty",
  );
  await expect(
    page.getByRole("button", { name: "Презентация готова, сегодня в 13:44" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Закрыть уведомления" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );
  await expect(page.getByRole("button", { name: "Уведомления", exact: true })).toBeFocused();

  await page.clock.runFor(6999);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );
  await page.clock.runFor(400);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );
  await page.clock.runFor(1);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-ready-unread",
  );
});

test("возврат из центра уведомлений кнопкой браузера не отменяет подготовку", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Управляемое время проверяется один раз в Chromium");
  const startTime = new Date("2026-07-16T10:24:00Z");
  await page.clock.install({ time: startTime });
  await page.clock.pauseAt(startTime);
  await openState(page, "lisa-materials-ready");
  await page.getByRole("button", { name: "Заказать презентацию" }).click();
  await page.clock.runFor(600);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );

  await page.getByRole("button", { name: "Уведомления", exact: true }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-notifications-list-empty",
  );
  await page.goBack();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );

  await page.clock.runFor(7400);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-ready-unread",
  );
});

test("готовность в открытом центре уведомлений не оставляет в завершённой генерации", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Управляемое время проверяется один раз в Chromium");
  const startTime = new Date("2026-07-16T10:24:00Z");
  await page.clock.install({ time: startTime });
  await page.clock.pauseAt(startTime);
  await openState(page, "lisa-materials-ready");
  await page.getByRole("button", { name: "Заказать презентацию" }).click();
  await page.clock.runFor(600);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );

  await page.getByRole("button", { name: "Уведомления", exact: true }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-notifications-list-empty",
  );
  await page.clock.runFor(7400);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-ready-unread",
  );

  await page.goBack();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-materials-ready",
  );
  await page.clock.runFor(20000);
  await expect(page.locator(".phone")).not.toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
  );
});

test("при сокращённом движении часы сохраняют время, но не вращаются", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Управляемое время проверяется один раз в Chromium");
  const startTime = new Date("2026-07-16T10:24:00Z");
  await page.clock.install({ time: startTime });
  await page.clock.pauseAt(startTime);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openState(page, "lisa-materials-ready");
  await page.getByRole("button", { name: "Заказать презентацию" }).click();
  await page.clock.runFor(600);
  const overlay = page.locator('[data-region-id="time-lapse-overlay"]');
  await expect(overlay).toContainText("13:24 → 13:44");
  const transformBefore = await overlay
    .locator(".clock-hand-minute")
    .evaluate((node) => getComputedStyle(node).transform);
  await page.clock.runFor(6999);
  const transformAfter = await overlay
    .locator(".clock-hand-minute")
    .evaluate((node) => getComputedStyle(node).transform);
  expect(transformAfter).toBe(transformBefore);
  await page.clock.runFor(401);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-ready-unread",
  );
});

test("просмотрщик содержит три слайда, управление масштабом и отправку на почту", async ({
  page,
}) => {
  await openState(page, "lisa-result-view-from-chat");
  await expect(page.locator(".viewer-surface")).toBeVisible();
  await expect(page.locator('[data-slide-id]')).toHaveCount(3);
  await expect(page.getByText("1 из 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Предыдущий слайд" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Следующий слайд" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Увеличить" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Уменьшить" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Масштаб 100 %" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Отправить презентацию на почту" })).toBeVisible();
  await expect(page.locator(".phone-header")).toHaveCount(0);
  await expect(page.locator(".phone-composer")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Уведомления/u })).toHaveCount(0);

  await page.getByRole("button", { name: "Следующий слайд" }).click();
  await expect(page.getByText("2 из 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    "Слайд 2 из 3: Возможности и давление",
  );
  await page.getByRole("button", { name: "Увеличить" }).click();
  await expect(page.getByRole("button", { name: "Масштаб 125 %" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Масштаб 125 %");
  await page.getByRole("button", { name: "Масштаб 125 %" }).click();
  await expect(page.getByRole("button", { name: "Масштаб 100 %" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Масштаб 100 %");
  await page.keyboard.press("Escape");
  await expect(page.locator(".phone")).toHaveAttribute("data-state-id", "lisa-returned-to-chat");

  await openState(page, "lisa-result-view-from-notification");
  const email = page.getByRole("button", { name: "Отправить презентацию на почту" });
  await email.evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-email-submitting",
  );
  await expect(page.getByRole("status")).toHaveText("");
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-email-sent",
    { timeout: 2500 },
  );
  await expect(page.getByText("Вложения: PDF и PPTX.")).toHaveCount(1);
});

test("просмотрщик различает перелистывание и перемещение увеличенного слайда", async ({
  page,
}) => {
  await openState(page, "lisa-result-view-from-chat");
  const stage = page.locator(".viewer-stage");
  const box = await stage.boundingBox();
  expect(box).not.toBeNull();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await stage.dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    clientX: centerX + 70,
    clientY: centerY,
  });
  await stage.dispatchEvent("pointermove", {
    pointerId: 1,
    pointerType: "touch",
    clientX: centerX - 70,
    clientY: centerY,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId: 1,
    pointerType: "touch",
    clientX: centerX - 70,
    clientY: centerY,
  });
  await expect(page.getByText("2 из 3", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Увеличить" }).click();
  const activeSlide = page.locator('[data-slide-id="opportunities-and-pressure"]');
  const before = await activeSlide.evaluate((node) => getComputedStyle(node).transform);
  await stage.dispatchEvent("pointerdown", {
    pointerId: 2,
    pointerType: "touch",
    clientX: centerX,
    clientY: centerY,
  });
  await stage.dispatchEvent("pointermove", {
    pointerId: 2,
    pointerType: "touch",
    clientX: centerX + 36,
    clientY: centerY + 20,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId: 2,
    pointerType: "touch",
    clientX: centerX + 36,
    clientY: centerY + 20,
  });
  const after = await activeSlide.evaluate((node) => getComputedStyle(node).transform);
  expect(after).not.toBe(before);
  await expect(page.getByText("2 из 3", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Масштаб 125 %" }).click();
  await stage.dblclick();
  await expect(page.getByRole("button", { name: "Масштаб 200 %" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".phone")).toHaveAttribute("data-state-id", "lisa-returned-to-chat");
});

test("двойное касание увеличивает слайд в мобильной модели браузера", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    locale: "ru-RU",
    serviceWorkers: "block",
  });
  await installVirtualPackageRoute(context);
  const touchPage = await context.newPage();
  try {
    await openState(touchPage, "lisa-result-view-from-chat");
    const box = await touchPage.locator(".viewer-stage").boundingBox();
    expect(box).not.toBeNull();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await touchPage.touchscreen.tap(x, y);
    await touchPage.waitForTimeout(80);
    await touchPage.touchscreen.tap(x, y);
    await expect(
      touchPage.getByRole("button", { name: "Масштаб 200 %" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("свайп между одиночными касаниями не считается двойным касанием", async ({ page }) => {
  await openState(page, "lisa-result-view-from-chat");
  const stage = page.locator(".viewer-stage");
  const box = await stage.boundingBox();
  expect(box).not.toBeNull();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await stage.dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    clientX: centerX,
    clientY: centerY,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId: 1,
    pointerType: "touch",
    clientX: centerX,
    clientY: centerY,
  });
  await stage.dispatchEvent("pointerdown", {
    pointerId: 2,
    pointerType: "touch",
    clientX: centerX + 70,
    clientY: centerY,
  });
  await stage.dispatchEvent("pointermove", {
    pointerId: 2,
    pointerType: "touch",
    clientX: centerX - 70,
    clientY: centerY,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId: 2,
    pointerType: "touch",
    clientX: centerX - 70,
    clientY: centerY,
  });
  await stage.dispatchEvent("pointerdown", {
    pointerId: 3,
    pointerType: "touch",
    clientX: centerX,
    clientY: centerY,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId: 3,
    pointerType: "touch",
    clientX: centerX,
    clientY: centerY,
  });

  await expect(page.getByText("2 из 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Масштаб 100 %" })).toBeVisible();
});

test("каждый слайд целиком помещается в 16:9 на мобильных размерах", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await openState(page, "lisa-result-view-from-chat");
    for (const [index, slide] of presentationPreview.slides.entries()) {
      const geometry = await page
        .locator(`[data-slide-id="${slide.id}"]`)
        .evaluate((node) => ({
          scrollHeight: node.scrollHeight,
          clientHeight: node.clientHeight,
          contentScrollHeight: node.querySelector(".slide-content").scrollHeight,
          contentClientHeight: node.querySelector(".slide-content").clientHeight,
        }));
      expect(
        geometry.scrollHeight,
        `${viewport.width}x${viewport.height}: ${slide.id} выходит за слайд`,
      ).toBeLessThanOrEqual(geometry.clientHeight + 1);
      expect(
        geometry.contentScrollHeight,
        `${viewport.width}x${viewport.height}: содержимое ${slide.id} обрезано`,
      ).toBeLessThanOrEqual(geometry.contentClientHeight + 1);
      if (index < 2) {
        await page.getByRole("button", { name: "Следующий слайд" }).click();
      }
    }
  }
});

test("закреплённые действия просмотрщика полностью видимы на 320x568", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const stateId of [
    "lisa-result-view-from-chat",
    "lisa-result-view-from-notification",
  ]) {
    await openState(page, stateId);
    const geometry = await collectGeometry(page);
    for (const action of geometry.actions) {
      expect(action.fullyInsidePhone, `${stateId}: ${action.id} обрезано телефоном`).toBe(true);
    }
  }
});

test("основной путь автоматически доводит заказ до готовности и отправки письма", async ({
  page,
}) => {
  await openState(page, "lisa-materials-ready");
  const order = page.getByRole("button", { name: "Заказать презентацию" });
  await order.evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-order-submitting",
  );
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
    { timeout: 2000 },
  );
  await expect(page.locator('[data-entry-state-id="lisa-materials-ready"]')).toHaveCount(1);
  await expect(page.locator('[data-entry-state-id="lisa-presentation-generating"]')).toHaveCount(1);
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-ready-unread",
    { timeout: 10000 },
  );
  await expect(page.locator('[data-entry-state-id="lisa-materials-ready"]')).toHaveCount(1);
  await expect(page.locator('[data-entry-state-id="lisa-presentation-generating"]')).toHaveCount(1);
  await expect(page.locator('[data-entry-state-id="lisa-presentation-ready-unread"]')).toHaveCount(
    1,
  );
  expect(
    await page
      .locator('[data-scroll-region="chat"] [data-entry-state-id]')
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.entryStateId)),
  ).toEqual([
    "lisa-materials-ready",
    "lisa-presentation-generating",
    "lisa-presentation-ready-unread",
  ]);
  await expect(page.getByRole("status")).toHaveText("Презентация готова");
  await expect(page.getByRole("button", { name: "Уведомления, одно новое" })).toBeVisible();
  await page.getByRole("button", { name: "Уведомления, одно новое" }).click();
  await expect(page.locator('[data-notification-id="presentation-ready"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Закрыть уведомления" }).click();
  const readyCard = page.getByRole("button", {
    name: "Презентация готова. Открыть презентацию",
  });
  await readyCard.click();
  await expect(page.getByText("PDF · только просмотр")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("");
  await expect(page.locator(".phone-composer")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Уведомления/u })).toHaveCount(0);
  await page.getByRole("button", { name: "Закрыть презентацию" }).click();
  await expect(page.locator(".phone")).toHaveAttribute("data-state-id", "lisa-returned-to-chat");
  await expect(page.locator('[data-entry-state-id="lisa-materials-ready"]')).toHaveCount(1);
  await expect(page.locator('[data-entry-state-id="lisa-presentation-generating"]')).toHaveCount(1);
  await expect(page.locator('[data-entry-state-id="lisa-returned-to-chat"]')).toHaveCount(1);
  expect(
    await page
      .locator('[data-scroll-region="chat"] [data-entry-state-id]')
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.entryStateId)),
  ).toEqual([
    "lisa-materials-ready",
    "lisa-presentation-generating",
    "lisa-returned-to-chat",
  ]);
  await expect(
    page.getByRole("button", { name: "Презентация готова. Открыть презентацию" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Отправить презентацию на почту" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-email-submitting",
  );
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-email-sent",
    { timeout: 2500 },
  );
  await expect(page.getByRole("status")).toContainText("Презентация отправлена");
  await expect(page.getByRole("heading", { name: "Презентация отправлена" })).toBeFocused();
  await expect(page.getByText("Вложения: PDF и PPTX.", { exact: true })).toBeVisible();
  expect(
    await page
      .locator('[data-scroll-region="chat"] [data-entry-state-id]')
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.entryStateId)),
  ).toEqual([
    "lisa-materials-ready",
    "lisa-presentation-generating",
    "lisa-returned-to-chat",
    "lisa-presentation-email-sent",
  ]);
  expect(page.__attemptedNetwork).toEqual([]);
});

test("повторные попытки завершают заказ и отправку, а не застревают", async ({ page }) => {
  await openState(page, "lisa-presentation-order-failed");
  await page.getByRole("button", { name: "Повторить передачу" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-order-submitting",
  );
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-generating",
    { timeout: 2000 },
  );
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-ready-unread",
    { timeout: 10000 },
  );

  await openState(page, "lisa-presentation-email-partial-failure");
  await page.getByRole("button", { name: "Повторить отправку PPTX" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-email-submitting",
  );
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-email-sent",
    { timeout: 2500 },
  );

  await openState(page, "lisa-presentation-email-failed");
  await page.getByRole("button", { name: "Повторить отправку" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-email-submitting",
  );
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-presentation-email-sent",
    { timeout: 2500 },
  );

  await openState(page, "lisa-offline");
  await page.getByRole("button", { name: "Повторить открытие" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-result-view-from-chat",
  );
});

test("центр уведомлений не снимает красную точку до открытия презентации", async ({ page }) => {
  await openState(page, "lisa-presentation-ready-unread");
  await page.getByRole("button", { name: "Уведомления, одно новое" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-notifications-list-unread",
  );
  await expect(page.getByRole("button", { name: "Уведомления, одно новое" })).toBeVisible();
  await page
    .getByRole("button", { name: "Презентация готова, сегодня в 13:44" })
    .click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-notification-detail-unread",
  );
  await expect(page.getByRole("button", { name: "Уведомления, одно новое" })).toBeVisible();
  await page.getByRole("button", { name: "Открыть презентацию" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-result-view-from-notification",
  );
  await expect(page.getByRole("button", { name: /Уведомления/u })).toHaveCount(0);
  await page.getByRole("button", { name: "Закрыть презентацию" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-returned-to-chat",
  );
  await expect(
    page.getByRole("button", { name: "Отправить презентацию на почту" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Уведомления", exact: true }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-notifications-list-read",
  );
  await expect(page.getByText("Новых уведомлений нет")).toBeVisible();
  await page.getByRole("button", { name: "Закрыть уведомления" }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-returned-to-chat",
  );
  await expect(page.getByRole("button", { name: "Уведомления", exact: true })).toBeVisible();
});

test("ошибка доставки уведомления не создаёт запись в центре уведомлений", async ({
  page,
}) => {
  await openState(page, "lisa-notification-failed-chat-available");
  await page.getByRole("button", { name: "Уведомления", exact: true }).click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-notifications-list-empty",
  );
  await expect(page.locator("[data-notification-id]")).toHaveCount(0);
  await expect(page.getByText("Новых уведомлений пока нет.")).toBeVisible();
});

test("после отправки по почте готовое уведомление остаётся доступным", async ({
  page,
}) => {
  for (const stateId of [
    "lisa-presentation-email-submitting",
    "lisa-presentation-email-sent",
    "lisa-presentation-email-partial-failure",
    "lisa-presentation-email-failed",
  ]) {
    await openState(page, stateId);
    await page.getByRole("button", { name: "Уведомления", exact: true }).click();
    await expect(page.locator(".phone")).toHaveAttribute(
      "data-state-id",
      "lisa-notifications-list-read",
    );
    await expect(
      page.getByRole("button", { name: "Презентация готова, сегодня в 13:44" }),
    ).toBeVisible();
  }
});

test("действия центра уведомлений размещены на целых пикселях в Chromium", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Целочисленная фаза закрепляет защиту от растрового дефекта Chromium",
  );
  for (const stateId of [
    "lisa-notifications-list-empty",
    "lisa-notifications-list-unread",
    "lisa-notification-detail-unread",
    "lisa-notifications-list-read",
    "lisa-notification-detail-read",
  ]) {
    await openState(page, stateId);
    const actions = await page
      .locator(".notification-surface button:not([disabled])")
      .evaluateAll((buttons) =>
      buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          id:
            button.getAttribute("data-action-id") ||
            button.getAttribute("aria-label") ||
            button.textContent.trim(),
          top: rect.top,
          bottom: rect.bottom,
        };
      }),
      );
    for (const action of actions) {
      expect(
        Math.abs(action.top - Math.round(action.top)),
        `${stateId}: верхняя граница ${action.id}`,
      ).toBeLessThanOrEqual(0.001);
      expect(
        Math.abs(action.bottom - Math.round(action.bottom)),
        `${stateId}: нижняя граница ${action.id}`,
      ).toBeLessThanOrEqual(0.001);
    }
  }
});

test("контуры уведомления используют воспроизводимую обычную границу", async ({ page }) => {
  await openState(page, "lisa-notification-detail-read");
  const appearance = await page.locator(".notification-card").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
    };
  });
  expect(appearance.borderColor).toBe("rgb(229, 225, 233)");
  expect(appearance.boxShadow).toBe("none");
});

test("обычная прямая ссылка сохраняет перенос фокуса на кнопку уведомления", async ({
  page,
}) => {
  await openState(page, "lisa-notification-detail-read");
  await expect(
    page.getByRole("button", { name: "Открыть презентацию" }),
  ).toBeFocused();
});

test("технический режим создания кадров подавляет начальный фокус", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__DATACANVAS_LISA_CAPTURE__ = true;
  });
  await openState(page, "lisa-notification-detail-read");
  await expect(
    page.getByRole("button", { name: "Открыть презентацию" }),
  ).not.toBeFocused();
  await expect(page.locator("body")).toBeFocused();
});

test("переход из списка переносит фокус на действие уведомления", async ({
  page,
}) => {
  await openState(page, "lisa-notifications-list-read");
  await page
    .getByRole("button", { name: "Презентация готова, сегодня в 13:44" })
    .click();
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-notification-detail-read",
  );
  await expect(
    page.getByRole("button", { name: "Открыть презентацию" }),
  ).toBeFocused();
});

test("закрытие центра уведомлений возвращает в исходный контекст", async ({ page }) => {
  for (const [stateId, notificationStateId] of [
    ["lisa-materials-ready", "lisa-notifications-list-empty"],
    ["lisa-presentation-order-failed", "lisa-notifications-list-empty"],
    ["lisa-offline", "lisa-notifications-list-empty"],
    ["lisa-link-expired", "lisa-notifications-list-empty"],
    ["lisa-presentation-ready-unread", "lisa-notifications-list-unread"],
  ]) {
    await openState(page, stateId);
    await page.getByRole("button", { name: /Уведомления/u }).click();
    await expect(page.locator(".phone")).toHaveAttribute(
      "data-state-id",
      notificationStateId,
    );
    await page.getByRole("button", { name: "Закрыть уведомления" }).click();
    await expect(page.locator(".phone")).toHaveAttribute("data-state-id", stateId);
    await expect(page.getByRole("button", { name: /Уведомления/u })).toBeFocused();
  }
});

test("карточка списка уведомлений использует корректное содержимое кнопки", async ({ page }) => {
  await openState(page, "lisa-notifications-list-unread");
  const card = page.getByRole("button", {
    name: "Презентация готова, сегодня в 13:44",
  });
  await expect(card).toBeVisible();
  await expect(
    card.locator(
      "p, h1, h2, h3, h4, h5, h6, div, article, section, ul, ol, li, button, a, input, select, textarea",
    ),
  ).toHaveCount(0);
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".phone")).toHaveAttribute(
    "data-state-id",
    "lisa-notification-detail-unread",
  );
});

test("прямая ссылка просмотра возвращает на поверхность, указанную контрактом", async ({
  page,
}) => {
  for (const [viewerStateId, expectedReturnStateId] of [
    ["lisa-result-view-from-chat", "lisa-returned-to-chat"],
    ["lisa-result-view-from-notification", "lisa-returned-to-chat"],
  ]) {
    await openState(page, viewerStateId);
    await page.getByRole("button", { name: "Закрыть презентацию" }).click();
    await expect(page.locator(".phone")).toHaveAttribute(
      "data-state-id",
      expectedReturnStateId,
    );
  }
});

test("переключатель состояний даёт русское название рядом с устойчивым идентификатором", async ({
  page,
}) => {
  await openState(page, "lisa-materials-ready");
  expect(await page.locator("#state-select option").allTextContents()).toEqual(
    journey.states.map((state) => `${state.display_name} — ${state.id}`),
  );
  const reviewStatus = page.locator(
    '#prototype-review-status[data-status="owner-approved-prototype"]',
  );
  await expect(reviewStatus).toHaveText(
    "HTML-прототип подтверждён владельцем",
  );
});

test("диалог редактирования закрывается Escape и возвращает фокус", async ({ page }) => {
  await openState(page, "lisa-materials-ready");
  const edit = page.getByRole("button", { name: "Редактировать материалы" });
  await edit.click();
  const dialog = page.getByRole("dialog", { name: "Редактирование материалов" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Закрыть" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(edit).toBeFocused();
});

test("переносимая копия работает из каталога с пробелами и кириллицей", async ({ page }) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "Лиса прототип с пробелами "));
  const copiedPackageRoot = path.join(tempRoot, "пакет прототипа");
  try {
    const archiveMembers = extractPortableArchive(copiedPackageRoot);
    expect(archiveMembers).toEqual([
      "README.md",
      "manifest.json",
      "demo/index.html",
      "demo/app.js",
      "demo/data.js",
      "demo/styles.css",
      "source/fonts/NotoSans[wdth,wght].ttf",
      "source/fonts/OFL.txt",
    ]);
    const copiedDemo = path.join(copiedPackageRoot, "demo/index.html");
    await openState(page, "lisa-materials-ready", copiedDemo);
    const geometry = await collectGeometry(page);
    expect(geometry.fontLoaded).toBe(true);
    assertLocalResources(geometry.resourceUrls, copiedPackageRoot);
    expect(page.__attemptedNetwork).toEqual([]);
    expect(page.__consoleErrors).toEqual([]);
    expect(page.__pageErrors).toEqual([]);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("мок телефона не зависит от внешних изображений", async ({ page }) => {
  await openState(page, "lisa-materials-ready", demoPath);
  const dependencies = await page.locator(".phone").evaluate((phone) => {
    const nodes = [phone, ...phone.querySelectorAll("*")];
    return {
      elementSources: [
        ...phone.querySelectorAll(
          "img[src], img[srcset], image[href], image[xlink\\:href], use[href], use[xlink\\:href], feImage[href], feImage[xlink\\:href], object[data], embed[src], video[poster], input[type=image][src], source[src], source[srcset]",
        ),
      ].map((node) => ({
        tag: node.tagName,
        source:
          node.getAttribute("src") ||
          node.getAttribute("srcset") ||
          node.getAttribute("href") ||
          node.getAttribute("xlink:href") ||
          node.getAttribute("poster") ||
          node.getAttribute("data"),
      })),
      cssImageSources: nodes
        .flatMap((node) => {
          const style = getComputedStyle(node);
          return [...style]
            .map((property) => ({
              tag: node.tagName,
              className: node.getAttribute("class") || "",
              property,
              value: style.getPropertyValue(property),
            }))
            .filter(({ value }) => value.includes("url("));
        }),
      inlineComponentIds: [
        ...phone.querySelectorAll("svg[data-component-id]"),
      ]
        .map((node) => node.getAttribute("data-component-id"))
        .sort(),
    };
  });

  expect(dependencies.elementSources).toEqual([]);
  expect(dependencies.cssImageSources).toEqual([]);
  expect(dependencies.inlineComponentIds).toEqual([
    "lisa-notification-bell",
    "lisa-phone-shell",
  ]);
});

for (const viewport of requiredViewports) {
  test(`${viewport.id}: ключевые экраны помещаются в реальном окне`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const stateId of [
      "lisa-materials-ready",
      "lisa-presentation-generating",
      "lisa-presentation-ready-unread",
      "lisa-notifications-list-unread",
      "lisa-result-view-from-notification",
      "lisa-returned-to-chat",
      "lisa-offline",
    ]) {
      await openState(page, stateId);
      const geometry = await collectGeometry(page);
      expect(geometry.documentScrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
      expect(geometry.documentScrollHeight).toBeLessThanOrEqual(geometry.viewportHeight + 1);
      expect(geometry.phone.left).toBeGreaterThanOrEqual(-1);
      expect(geometry.phone.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
      expect(geometry.textOverflow).toEqual([]);
      expect(geometry.actionIssues).toEqual([]);
    }
  });
}
