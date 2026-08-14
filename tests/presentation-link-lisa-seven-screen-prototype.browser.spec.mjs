import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

const root = process.cwd();
const packageRoot = path.join(root, "docs/product/analysis/presentation-link-lisa-user-journey");
const demoIndexPath = path.join(packageRoot, "demo/index.html");
const archivePath = path.join(packageRoot, "derived/lisa-presentation-user-journey-demo.zip");
let extractedArchiveRoot;

test.beforeAll(() => {
  extractedArchiveRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-seven-screen-archive-"));
  execFileSync("unzip", ["-qq", archivePath, "-d", extractedArchiveRoot]);
});

test.afterAll(() => {
  if (extractedArchiveRoot) fs.rmSync(extractedArchiveRoot, { recursive: true, force: true, maxRetries: 2 });
});

const expectedStates = Object.freeze([
  Object.freeze({
    id: "lisa-materials-summary",
    caption: "Краткие материалы: заказ доступен сразу",
    logicalDimensions: Object.freeze({ width: 521, height: 980 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 2940 }),
    hasImmediateCta: true,
    scrollable: false,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-materials-full-reference",
    caption: "Полная справка: прокрутите материалы или оформите заказ",
    logicalDimensions: Object.freeze({ width: 521, height: 5194 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 15582 }),
    hasImmediateCta: true,
    scrollable: true,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-presentation-order",
    caption: "Заказ презентации по подготовленным материалам",
    logicalDimensions: Object.freeze({ width: 521, height: 980 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 2940 }),
    hasImmediateCta: true,
    scrollable: false,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-presentation-generating",
    caption: "Презентация формируется",
    logicalDimensions: Object.freeze({ width: 521, height: 980 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 2940 }),
    hasImmediateCta: false,
    scrollable: false,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-presentation-chat-list",
    caption: "Чаты: ГК Достовалова",
    logicalDimensions: Object.freeze({ width: 521, height: 980 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 2940 }),
    hasImmediateCta: false,
    scrollable: false,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-presentation-sent",
    caption: "Презентация сформирована и отправлена",
    logicalDimensions: Object.freeze({ width: 521, height: 980 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 2940 }),
    hasImmediateCta: false,
    scrollable: false,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-presentation-email",
    caption: "Письмо с версиями презентации в ODT и PDF",
    logicalDimensions: Object.freeze({ width: 1553, height: 1013 }),
    pixelDimensions: Object.freeze({ width: 1553, height: 1013 }),
    hasImmediateCta: false,
    scrollable: false,
    presentation: "desktop",
  }),
  Object.freeze({
    id: "lisa-presentation-slidedoc",
    caption: "Презентация: вариант SlideDoc",
    logicalDimensions: Object.freeze({ width: 960, height: 1620 }),
    pixelDimensions: Object.freeze({ width: 3840, height: 6480 }),
    hasImmediateCta: false,
    scrollable: true,
    presentation: "desktop",
    document: true,
    stageTestId: "document-stage",
    assetPath: "assets/szh-dense-slidedoc-4x.png",
  }),
  Object.freeze({
    id: "lisa-presentation-sber2025",
    caption: "Презентация: вариант Sber 2025",
    logicalDimensions: Object.freeze({ width: 960, height: 1620 }),
    pixelDimensions: Object.freeze({ width: 3840, height: 6480 }),
    hasImmediateCta: false,
    scrollable: true,
    presentation: "desktop",
    document: true,
    stageTestId: "document-stage",
    assetPath: "assets/szh-dense-sber2025-4x.png",
  }),
  Object.freeze({
    id: "lisa-presentation-mag",
    caption: "Презентация: вариант MAG",
    logicalDimensions: Object.freeze({ width: 960, height: 1620 }),
    pixelDimensions: Object.freeze({ width: 3840, height: 6480 }),
    hasImmediateCta: false,
    scrollable: true,
    presentation: "desktop",
    document: true,
    stageTestId: "document-stage",
    assetPath: "assets/szh-dense-mag-4x.png",
  }),
]);

const expectedStateIds = expectedStates.map((state) => state.id);
const expectedEmailState = expectedStates.find((state) => state.id === "lisa-presentation-email");
const documentStates = expectedStates.filter((state) => state.document);
const documentStateIds = documentStates.map((state) => state.id);
const phoneStates = expectedStates.filter((state) => state.presentation === "phone");
const scrollablePhoneStateIds = phoneStates.filter((state) => state.scrollable).map((state) => state.id);
const immediateCtaStateIds = expectedStates.filter((state) => state.hasImmediateCta).map((state) => state.id);
const expectedPhoneLayerRoles = Object.freeze(["system_top", "scroll_content", "system_bottom"]);
const expectedPhoneLayerSuffixes = Object.freeze({
  system_top: "status",
  scroll_content: "content",
  system_bottom: "home",
});
const expectedPhoneLayerSources = Object.freeze({
  "lisa-materials-full-reference": Object.freeze({
    system_top: Object.freeze({ x: 64, y: 48, width: 393, height: 53 }),
    scroll_content: Object.freeze({ x: 64, y: 101, width: 393, height: 4979 }),
    system_bottom: Object.freeze({ x: 64, y: 5080, width: 393, height: 34 }),
  }),
});
const expectedDefaultPhoneLayerSources = Object.freeze({
  system_top: Object.freeze({ x: 64, y: 48, width: 393, height: 53 }),
  scroll_content: Object.freeze({ x: 64, y: 101, width: 393, height: 765 }),
  system_bottom: Object.freeze({ x: 64, y: 866, width: 393, height: 34 }),
});
const forbiddenLegacyStateFragments = Object.freeze([
  "lisa-client-search",
  "lisa-client-selection",
  "lisa-client-selection-compact",
  "lisa-client-selection-list",
  "lisa-preparation-",
  "lisa-materials-gathering",
  "lisa-notification",
  "lisa-result",
  "lisa-link",
  "lisa-access-denied",
  "lisa-offline",
  "lisa-presentation-email-",
]);

function demoUrl(stateId) {
  const url = pathToFileURL(demoIndexPath);
  url.searchParams.set("state", stateId);
  return url.href;
}

function archiveUrl(stateId) {
  const url = pathToFileURL(path.join(extractedArchiveRoot, "index.html"));
  url.searchParams.set("state", stateId);
  return url.href;
}

function assertOnlyRuntimeFileRequests(requests, runtimeRoot) {
  const allowedStaticFiles = new Set(["index.html", "app.js", "data.js", "styles.css"]);
  for (const requestUrl of requests) {
    const parsed = new URL(requestUrl);
    expect(parsed.protocol, `запрос должен оставаться внутри file://: ${requestUrl}`).toBe("file:");
    const relativePath = path.relative(runtimeRoot, fileURLToPath(parsed)).split(path.sep).join("/");
    expect(relativePath, `запрос не должен выходить из автономного runtime: ${requestUrl}`).not.toMatch(/^(?:\.\.\/|\/)/u);
    expect(
      allowedStaticFiles.has(relativePath) || /^assets\/[a-z0-9-]+\.png$/u.test(relativePath),
      `разрешены только исполняемые файлы и PNG из assets: ${relativePath}`,
    ).toBe(true);
  }
}

async function assertOnlyRelativeRuntimeAddresses(page) {
  const addresses = await page.locator("[href], [src], [action], [formaction], [poster], [data]").evaluateAll((nodes) =>
    nodes.flatMap((node) => ["href", "src", "action", "formaction", "poster", "data"]
      .filter((attribute) => node.hasAttribute(attribute))
      .map((attribute) => ({ attribute, value: node.getAttribute(attribute) }))),
  );
  for (const { attribute, value } of addresses) {
    expect(value, `${attribute} должен быть непустым относительным адресом`).toBeTruthy();
    expect(value, `${attribute} не должен содержать запрещённый протокол`).not.toMatch(
      /^(?:file|data|javascript|mailto|blob|https?):/iu,
    );
    expect(value, `${attribute} не должен быть абсолютным или выходить из runtime`).not.toMatch(
      /^(?:\/|[A-Za-z]:[\\/]|\.\.\/)/u,
    );
    expect(
      /^(?:styles\.css|data\.js|app\.js|assets\/[a-z0-9-]+\.png)$/u.test(value),
      `DOM может ссылаться только на локальные файлы runtime: ${value}`,
    ).toBe(true);
  }
}

function scene(page) {
  return page.getByTestId("prototype-root");
}

function stateCaption(page) {
  return page.getByTestId("state-caption");
}

function baseImage(page) {
  return page.getByTestId("state-image");
}

function stageTestId(expected) {
  if (expected.stageTestId) return expected.stageTestId;
  return expected.presentation === "desktop" ? "email-stage" : "phone-stage";
}

function phoneSystemTop(page) {
  return page.getByTestId("phone-system-top");
}

function phoneScrollViewport(page) {
  return page.getByTestId("phone-scroll-viewport");
}

function phoneScrollContent(page) {
  return page.getByTestId("phone-scroll-content");
}

function phoneSystemBottom(page) {
  return page.getByTestId("phone-system-bottom");
}

function servicePanel(page) {
  return page.getByTestId("service-panel");
}

function documentScrollViewport(page) {
  return page.getByTestId("document-scroll-viewport");
}

function serviceHeading(page) {
  return page.getByTestId("service-heading");
}

function previousButton(page) {
  return page.getByTestId("previous-state");
}

function nextButton(page) {
  return page.getByTestId("next-state");
}

function previousSlideButton(page) {
  return page.getByTestId("previous-slide");
}

function nextSlideButton(page) {
  return page.getByTestId("next-slide");
}

function presentationCta(page) {
  return page.getByTestId("order-presentation");
}

function phoneLayerSrc(stateId, role) {
  return `assets/${stateId}-${expectedPhoneLayerSuffixes[role]}-3x.png`;
}

function expectedPhoneRasterLayers(stateId) {
  const sources = expectedPhoneLayerSources[stateId] ?? expectedDefaultPhoneLayerSources;
  return expectedPhoneLayerRoles.map((role) => ({
    role,
    src: phoneLayerSrc(stateId, role),
    pixelDimensions: {
      width: 1179,
      height: sources[role].height * 3,
    },
  }));
}

function phoneLayerContainer(page, role) {
  if (role === "system_top") return phoneSystemTop(page);
  if (role === "scroll_content") return phoneScrollContent(page);
  return phoneSystemBottom(page);
}

async function requiredBox(locator, label) {
  const box = await locator.boundingBox();
  expect(box, label).toBeTruthy();
  return box;
}

function boxesOverlap(left, right) {
  return left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y;
}

function expectBoxesClose(actual, expected, label) {
  expect(actual.x, `${label}: x`).toBeCloseTo(expected.x, 0);
  expect(actual.y, `${label}: y`).toBeCloseTo(expected.y, 0);
  expect(actual.width, `${label}: width`).toBeCloseTo(expected.width, 0);
  expect(actual.height, `${label}: height`).toBeCloseTo(expected.height, 0);
  expect(Math.abs(actual.x - expected.x), `${label}: x должен оставаться в допуске 0.5 CSS px`).toBeLessThanOrEqual(.5);
  expect(Math.abs(actual.y - expected.y), `${label}: y должен оставаться в допуске 0.5 CSS px`).toBeLessThanOrEqual(.5);
  expect(Math.abs(actual.width - expected.width), `${label}: width должен оставаться в допуске 0.5 CSS px`).toBeLessThanOrEqual(.5);
  expect(Math.abs(actual.height - expected.height), `${label}: height должен оставаться в допуске 0.5 CSS px`).toBeLessThanOrEqual(.5);
}

function expectCloseCssPx(actual, expected, label) {
  expect(
    Math.abs(actual - expected),
    `${label}: ожидалось ${expected}, получено ${actual}; отклонение должно быть не больше 0.5 CSS px`,
  ).toBeLessThanOrEqual(.5);
}

async function openState(page, stateId) {
  const expected = expectedStates.find((state) => state.id === stateId);
  await page.goto(demoUrl(stateId), { waitUntil: "load" });
  await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
  await expect(scene(page), "на странице должен быть один публичный root prototype-root").toHaveCount(1);
  await expect(scene(page)).toHaveAttribute("data-state-id", stateId);
  if (expected) {
    await expect(scene(page)).toHaveAttribute("data-presentation", expected.presentation);
    await expect(page.getByTestId(stageTestId(expected))).toHaveCount(1);
  }
}

async function assertEmailImageLoaded(page, expected) {
  const image = baseImage(page);
  await expect(image, `${expected.id}: нужна одиночная PNG-основа state-image`).toHaveCount(1);
  const metadata = await image.evaluate((node) => ({
    src: node.getAttribute("src"),
    complete: node.complete,
    naturalWidth: node.naturalWidth,
    naturalHeight: node.naturalHeight,
  }));
  expect(metadata.src, `${expected.id}: основа должна грузиться только из локальных assets`).toMatch(/^assets\/[a-z0-9/-]+\.png$/u);
  expect(metadata.complete, `${expected.id}: PNG-основа должна загрузиться полностью`).toBe(true);
  expect(
    { width: metadata.naturalWidth, height: metadata.naturalHeight },
    `${expected.id}: натуральные размеры почтовой PNG-основы`,
  ).toEqual(expected.pixelDimensions);
}

async function assertPhoneLayerImagesLoaded(page, expected) {
  await expect(baseImage(page), `${expected.id}: телефон не должен использовать одиночный state-image`).toHaveCount(0);
  for (const layer of expectedPhoneRasterLayers(expected.id)) {
    const container = phoneLayerContainer(page, layer.role);
    await expect(container, `${expected.id}: контейнер слоя ${layer.role} должен быть в DOM`).toHaveCount(1);
    const image = container.locator("img");
    await expect(image, `${expected.id}: в контейнере ${layer.role} должен быть один img`).toHaveCount(1);
    const metadata = await image.evaluate((node) => ({
      src: node.getAttribute("src"),
      complete: node.complete,
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      testContainer: node.closest("[data-testid]")?.getAttribute("data-testid"),
    }));
    expect(metadata.src, `${expected.id}: неверный путь слоя ${layer.role}`).toBe(layer.src);
    expect(metadata.complete, `${expected.id}: слой ${layer.role} должен загрузиться полностью`).toBe(true);
    expect(
      { width: metadata.naturalWidth, height: metadata.naturalHeight },
      `${expected.id}: натуральные размеры слоя ${layer.role}`,
    ).toEqual(layer.pixelDimensions);
    expect(metadata.testContainer, `${expected.id}: img должен лежать в своём testid-контейнере`).toBe(
      layer.role === "system_top"
        ? "phone-system-top"
        : layer.role === "scroll_content"
          ? "phone-scroll-content"
          : "phone-system-bottom",
    );
  }
}

async function assertDocumentImageLoaded(page, expected) {
  await expect(page.getByTestId("document-stage"), `${expected.id}: нужен отдельный desktop-фрейм документа`).toHaveCount(1);
  await expect(documentScrollViewport(page), `${expected.id}: нужен внутренний document-scroll-viewport`).toHaveCount(1);
  const image = baseImage(page);
  await expect(image, `${expected.id}: нужен одиночный PNG документа`).toHaveCount(1);
  const metadata = await image.evaluate((node) => ({
    src: node.getAttribute("src"),
    complete: node.complete,
    naturalWidth: node.naturalWidth,
    naturalHeight: node.naturalHeight,
  }));
  expect(metadata.src, `${expected.id}: документ должен грузиться только из локального assets PNG`).toBe(expected.assetPath);
  expect(metadata.complete, `${expected.id}: документный PNG должен загрузиться полностью`).toBe(true);
  expect(
    { width: metadata.naturalWidth, height: metadata.naturalHeight },
    `${expected.id}: документный PNG должен иметь 3 страницы 3840x2160`,
  ).toEqual(expected.pixelDimensions);
  expect(metadata.naturalHeight / 3, `${expected.id}: высота одной страницы должна быть 2160 px`).toBe(2160);
}

async function assertStateImagesLoaded(page, expected) {
  if (expected.presentation === "phone") {
    await assertPhoneLayerImagesLoaded(page, expected);
  } else if (expected.document) {
    await assertDocumentImageLoaded(page, expected);
  } else {
    await assertEmailImageLoaded(page, expected);
  }
}

async function slideMetrics(page) {
  return documentScrollViewport(page).evaluate((node) => ({
    scrollTop: node.scrollTop,
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
    currentSlide: Number(node.dataset.currentSlide),
    slideCount: Number(node.dataset.slideCount),
    stateId: document.querySelector("[data-testid='prototype-root']")?.getAttribute("data-state-id"),
    counterText: document.querySelector("[data-testid='state-counter']")?.textContent,
    stateParam: new URL(window.location.href).searchParams.get("state"),
    documentScrollY: window.scrollY,
  }));
}

async function expectSlidePosition(page, slideIndex, label) {
  await expect.poll(async () => {
    const metrics = await slideMetrics(page);
    return Math.round(metrics.scrollTop - (metrics.clientHeight * slideIndex));
  }, { message: label }).toBe(0);
  const metrics = await slideMetrics(page);
  expect(metrics.currentSlide, `${label}: номер слайда должен быть синхронизирован`).toBe(slideIndex);
  expect(metrics.slideCount, `${label}: документ должен содержать три слайда`).toBe(3);
  expect(metrics.documentScrollY, `${label}: внешняя страница должна оставаться неподвижной`).toBe(0);
  expectCloseCssPx(metrics.scrollTop, metrics.clientHeight * slideIndex, label);
}

test("Chromium и WebKit открывают все десять состояний напрямую через file:// без сети", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));

  for (const expected of expectedStates) {
    await openState(page, expected.id);
    expect(page.url()).toMatch(/^file:\/\//u);
    await expect(stateCaption(page)).toHaveText(expected.caption);
    await assertStateImagesLoaded(page, expected);
    await assertOnlyRelativeRuntimeAddresses(page);
  }

  assertOnlyRuntimeFileRequests(requests, path.join(packageRoot, "demo"));
});

test("распакованный переносимый ZIP открывает те же десять PNG через file:// без сети", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));

  for (const expected of expectedStates) {
    await page.goto(archiveUrl(expected.id), { waitUntil: "load" });
    await expect(scene(page)).toHaveAttribute("data-state-id", expected.id);
    await expect(stateCaption(page)).toHaveText(expected.caption);
    await assertStateImagesLoaded(page, expected);
    await assertOnlyRelativeRuntimeAddresses(page);
  }

  assertOnlyRuntimeFileRequests(requests, extractedArchiveRoot);
});

test("стрелки, выбор состояния и клавиатура идут по десятиэкранному маршруту с неактивными границами", async ({ page }) => {
  await openState(page, expectedStateIds[0]);

  await expect(previousButton(page)).toBeDisabled();
  await expect(nextButton(page)).toBeEnabled();

  for (let index = 1; index < expectedStateIds.length; index += 1) {
    await nextButton(page).click();
    await expect(scene(page), `после стрелки вперёд ожидается ${expectedStateIds[index]}`).toHaveAttribute(
      "data-state-id",
      expectedStateIds[index],
    );
  }

  await expect(nextButton(page)).toBeDisabled();
  await page.keyboard.press("ArrowRight");
  await expect(scene(page)).toHaveAttribute("data-state-id", expectedStateIds.at(-1));

  for (let index = expectedStateIds.length - 2; index >= 0; index -= 1) {
    await page.keyboard.press("ArrowLeft");
    await expect(scene(page), `после ArrowLeft ожидается ${expectedStateIds[index]}`).toHaveAttribute(
      "data-state-id",
      expectedStateIds[index],
    );
  }

  await expect(previousButton(page)).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(scene(page)).toHaveAttribute("data-state-id", expectedStateIds[0]);
});

test("маршрут после письма открывает три документа и возвращается назад к ранним состояниям", async ({ page }) => {
  await openState(page, "lisa-presentation-email");
  await expect(previousButton(page)).toBeEnabled();
  await expect(nextButton(page), "после письма должна быть доступна стрелка к документам").toBeEnabled();

  for (const stateId of documentStateIds) {
    await nextButton(page).click();
    await expect(scene(page), `после письма и следующих стрелок ожидается ${stateId}`).toHaveAttribute(
      "data-state-id",
      stateId,
    );
    await expect(scene(page)).toHaveAttribute("data-presentation", "desktop");
  }

  await expect(nextButton(page), "последний документ должен отключать стрелку вправо").toBeDisabled();
  await page.keyboard.press("ArrowRight");
  await expect(scene(page)).toHaveAttribute("data-state-id", documentStateIds.at(-1));

  for (const stateId of ["lisa-presentation-sber2025", "lisa-presentation-slidedoc", "lisa-presentation-email"]) {
    await previousButton(page).click();
    await expect(scene(page), `стрелка влево должна вернуть к ${stateId}`).toHaveAttribute("data-state-id", stateId);
  }

  await previousButton(page).click();
  await expect(scene(page), "после письма стрелка влево должна возвращать к ранним состояниям").toHaveAttribute(
    "data-state-id",
    "lisa-presentation-sent",
  );
});

test("постраничная навигация презентаций работает только внутри текущего документа", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const controlViewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
  ];

  for (const stateId of ["lisa-materials-summary", "lisa-presentation-email"]) {
    await openState(page, stateId);
    await expect(previousSlideButton(page), `${stateId}: кнопка предыдущего слайда должна быть в DOM`).toHaveCount(1);
    await expect(nextSlideButton(page), `${stateId}: кнопка следующего слайда должна быть в DOM`).toHaveCount(1);
    await expect(previousSlideButton(page), `${stateId}: кнопка предыдущего слайда должна быть скрыта`).toBeHidden();
    await expect(nextSlideButton(page), `${stateId}: кнопка следующего слайда должна быть скрыта`).toBeHidden();
    const focusedIds = [];
    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press("Tab");
      focusedIds.push(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")));
    }
    expect(focusedIds, `${stateId}: скрытые кнопки слайдов не должны попадать в порядок фокуса`).not.toContain("previous-slide");
    expect(focusedIds, `${stateId}: скрытые кнопки слайдов не должны попадать в порядок фокуса`).not.toContain("next-slide");
  }

  for (const viewport of controlViewports) {
    await page.setViewportSize(viewport);
    for (const expected of documentStates) {
      await openState(page, expected.id);
      await assertDocumentImageLoaded(page, expected);
      await expect(previousSlideButton(page)).toHaveAttribute("aria-label", "Предыдущий слайд");
      await expect(nextSlideButton(page)).toHaveAttribute("aria-label", "Следующий слайд");
      await expect(previousSlideButton(page)).toContainText("↑");
      await expect(nextSlideButton(page)).toContainText("↓");
      for (const button of [previousSlideButton(page), nextSlideButton(page)]) {
        await expect(button, `${expected.id}: кнопка слайда должна быть видима`).toBeVisible();
        const box = await requiredBox(button, `${expected.id}: кнопка слайда должна иметь область нажатия`);
        expect(box.width, `${expected.id}: ширина кнопки слайда должна быть не меньше 44 CSS px`).toBeGreaterThanOrEqual(44);
        expect(box.height, `${expected.id}: высота кнопки слайда должна быть не меньше 44 CSS px`).toBeGreaterThanOrEqual(44);
        expect(await button.evaluate((node) => Boolean(node.closest("[data-testid='service-panel']")))).toBe(true);
        expect(
          boxesOverlap(box, await requiredBox(page.getByTestId("document-stage"), `${expected.id}: документная сцена`)),
          `${expected.id}: кнопка слайда должна оставаться в service-panel, не поверх изображения`,
        ).toBe(false);
      }

      const initial = await slideMetrics(page);
      await expect(previousSlideButton(page), `${expected.id}: первый слайд отключает переход вверх`).toBeDisabled();
      await expect(nextSlideButton(page), `${expected.id}: первый слайд разрешает переход вниз`).toBeEnabled();
      await expectSlidePosition(page, 0, `${expected.id}: начальная позиция слайда`);

      await previousSlideButton(page).click({ force: true });
      await expectSlidePosition(page, 0, `${expected.id}: отключённая кнопка вверх не должна прокручивать`);

      await nextSlideButton(page).click();
      await expectSlidePosition(page, 1, `${expected.id}: переход 1 -> 2`);
      await expect(previousSlideButton(page)).toBeEnabled();
      await expect(nextSlideButton(page)).toBeEnabled();

      await nextSlideButton(page).click();
      await expectSlidePosition(page, 2, `${expected.id}: переход 2 -> 3`);
      await expect(previousSlideButton(page)).toBeEnabled();
      await expect(nextSlideButton(page), `${expected.id}: третий слайд отключает переход вниз`).toBeDisabled();

      await nextSlideButton(page).click({ force: true });
      await expectSlidePosition(page, 2, `${expected.id}: отключённая кнопка вниз не должна прокручивать`);

      await previousSlideButton(page).click();
      await expectSlidePosition(page, 1, `${expected.id}: переход 3 -> 2`);
      await previousSlideButton(page).click();
      await expectSlidePosition(page, 0, `${expected.id}: переход 2 -> 1`);

      await page.keyboard.press("ArrowDown");
      await expectSlidePosition(page, 1, `${expected.id}: ArrowDown переводит на один слайд вниз`);
      await page.keyboard.press("ArrowUp");
      await expectSlidePosition(page, 0, `${expected.id}: ArrowUp переводит на один слайд вверх`);

      const afterSlides = await slideMetrics(page);
      expect(afterSlides.stateId, `${expected.id}: навигация слайдов не должна менять data-state-id`).toBe(initial.stateId);
      expect(afterSlides.counterText, `${expected.id}: навигация слайдов не должна менять счетчик экранов`).toBe(initial.counterText);
      expect(afterSlides.stateParam, `${expected.id}: навигация слайдов не должна менять параметр state`).toBe(initial.stateParam);

      if (expected.id !== documentStateIds.at(-1)) {
        await page.keyboard.press("ArrowRight");
        await expect(scene(page), `${expected.id}: ArrowRight должен перейти к следующему документу`).toHaveAttribute(
          "data-state-id",
          documentStateIds[documentStateIds.indexOf(expected.id) + 1],
        );
        await expectSlidePosition(page, 0, `${expected.id}: новый документ должен начинаться с первого слайда`);
      } else {
        await page.keyboard.press("ArrowLeft");
        await expect(scene(page), `${expected.id}: ArrowLeft должен сохранить переход к предыдущему состоянию`).toHaveAttribute(
          "data-state-id",
          documentStateIds.at(-2),
        );
        await expectSlidePosition(page, 0, `${expected.id}: предыдущий документ должен начинаться с первого слайда`);
      }
    }
  }
});

test("кнопка на трёх разрешённых экранах сразу переводит в lisa-presentation-generating", async ({ page }) => {
  for (const stateId of immediateCtaStateIds) {
    await openState(page, stateId);
    await expect(presentationCta(page), `${stateId}: CTA должен быть публичным data-testid=order-presentation`).toHaveText(
      "Сформировать презентацию",
    );
    await expect(phoneScrollContent(page).getByTestId("order-presentation"), `${stateId}: CTA должен быть внутри phone-scroll-content`).toHaveCount(1);
    await presentationCta(page).click();
    await expect(scene(page), `${stateId}: CTA должен вести сразу в состояние подготовки`).toHaveAttribute(
      "data-state-id",
      "lisa-presentation-generating",
    );
  }
});

test("трёхслойный телефон закрепляет системные слои, прокручивает только середину и держит служебную панель сбоку", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const stateId of ["lisa-materials-full-reference"]) {
    await openState(page, stateId);
    await expect(phoneSystemTop(page), `${stateId}: нужен закреплённый верхний системный слой`).toHaveCount(1);
    await expect(phoneScrollViewport(page), `${stateId}: нужен отдельный viewport средней прокрутки`).toHaveCount(1);
    await expect(phoneScrollContent(page), `${stateId}: нужно отдельное содержимое средней прокрутки`).toHaveCount(1);
    await expect(phoneSystemBottom(page), `${stateId}: нужен закреплённый нижний системный слой`).toHaveCount(1);
    await expect(phoneSystemTop(page).getByTestId("order-presentation")).toHaveCount(0);
    await expect(phoneSystemBottom(page).getByTestId("order-presentation")).toHaveCount(0);
    await expect(phoneScrollContent(page).getByTestId("order-presentation")).toHaveCount(1);

    const topBefore = await requiredBox(phoneSystemTop(page), `${stateId}: верхний слой должен быть видим`);
    const bottomBefore = await requiredBox(phoneSystemBottom(page), `${stateId}: нижний слой должен быть видим`);
    const viewport = phoneScrollViewport(page);
    await viewport.evaluate((node) => { node.scrollTop = 260; });
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expectBoxesClose(
      await requiredBox(phoneSystemTop(page), `${stateId}: верхний слой после программной прокрутки`),
      topBefore,
      `${stateId}: верхний слой после программной прокрутки`,
    );
    expectBoxesClose(
      await requiredBox(phoneSystemBottom(page), `${stateId}: нижний слой после программной прокрутки`),
      bottomBefore,
      `${stateId}: нижний слой после программной прокрутки`,
    );

    await viewport.hover();
    const afterProgrammatic = await viewport.evaluate((node) => node.scrollTop);
    await page.mouse.wheel(0, 360);
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(afterProgrammatic);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expectBoxesClose(
      await requiredBox(phoneSystemTop(page), `${stateId}: верхний слой после колеса`),
      topBefore,
      `${stateId}: верхний слой после колеса`,
    );
    expectBoxesClose(
      await requiredBox(phoneSystemBottom(page), `${stateId}: нижний слой после колеса`),
      bottomBefore,
      `${stateId}: нижний слой после колеса`,
    );

    await viewport.evaluate((node) => { node.scrollTop = 0; });
    const viewportBox = await requiredBox(viewport, `${stateId}: средняя область должна быть видима`);
    const x = viewportBox.x + viewportBox.width / 2;
    const startY = viewportBox.y + viewportBox.height * .72;
    await page.mouse.move(x, startY);
    await page.mouse.down();
    await page.mouse.move(x, startY - 180, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expectBoxesClose(
      await requiredBox(phoneSystemTop(page), `${stateId}: верхний слой после перетаскивания`),
      topBefore,
      `${stateId}: верхний слой после перетаскивания`,
    );
    expectBoxesClose(
      await requiredBox(phoneSystemBottom(page), `${stateId}: нижний слой после перетаскивания`),
      bottomBefore,
      `${stateId}: нижний слой после перетаскивания`,
    );

    await expect(phoneSystemTop(page)).toHaveJSProperty("scrollTop", 0);
    await expect(phoneSystemBottom(page)).toHaveJSProperty("scrollTop", 0);
  }

  await openState(page, "lisa-materials-summary");
  await expect(servicePanel(page), "на широком окне служебные элементы должны быть в service-panel").toHaveCount(1);
  for (const locator of [serviceHeading(page), stateCaption(page), page.getByTestId("state-counter"), previousButton(page), nextButton(page)]) {
    await expect(locator).toHaveCount(1);
    expect(await locator.evaluate((node) => Boolean(node.closest("[data-testid='service-panel']")))).toBe(true);
  }
  await expect(page.locator(".prototype-shell > .prototype-heading, .prototype-shell > .prototype-navigation")).toHaveCount(0);
  const phoneBox = await requiredBox(page.getByTestId("phone-stage"), "телефон должен быть видим");
  expectCloseCssPx(phoneBox.x + phoneBox.width / 2, 856, "телефон должен быть центрирован в рабочей области справа от панели");

  await page.setViewportSize({ width: 1024, height: 1100 });
  await openState(page, "lisa-materials-summary");
  const boundaryPanelBox = await requiredBox(servicePanel(page), "боковая панель на границе широкого режима должна быть видима");
  const boundaryPhoneBox = await requiredBox(page.getByTestId("phone-stage"), "телефон на границе широкого режима должен быть видим");
  expectCloseCssPx(
    boundaryPhoneBox.x + boundaryPhoneBox.width / 2,
    648,
    "телефон на границе широкого режима должен быть центрирован в рабочей области справа от панели",
  );
  expect(boxesOverlap(boundaryPanelBox, boundaryPhoneBox), "боковая панель не должна пересекать центрированный телефон").toBe(false);

  await page.setViewportSize({ width: 900, height: 900 });
  await openState(page, "lisa-materials-summary");
  await expect(serviceHeading(page), "на узком окне заголовок скрыт").toBeHidden();
  await expect(stateCaption(page), "на узком окне пояснение скрыто").toBeHidden();
  await expect(page.getByTestId("state-counter"), "на узком окне счётчик скрыт").toBeHidden();
  await expect(page.locator(".button-label")).toHaveCount(2);
  await expect(page.locator(".button-label").first(), "на узком окне подпись кнопки назад скрыта").toBeHidden();
  await expect(page.locator(".button-label").last(), "на узком окне подпись кнопки вперёд скрыта").toBeHidden();
  const compactPhoneBox = await requiredBox(page.getByTestId("phone-stage"), "телефон на узком окне должен быть видим");
  for (const button of [previousButton(page), nextButton(page)]) {
    const box = await requiredBox(button, "стрелка на узком окне должна быть видима");
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(boxesOverlap(box, compactPhoneBox)).toBe(false);
  }
});

test("геометрия исправленного фрейма центрирует телефон справа от панели на контрольных ширинах", async ({ page }) => {
  const controlViewports = [
    { width: 1440, height: 1000, expectedCenterX: 856 },
    { width: 1024, height: 1100, expectedCenterX: 648 },
    { width: 900, height: 900, expectedCenterX: 480 },
  ];

  for (const viewport of controlViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openState(page, "lisa-materials-summary");

    const panelBox = await requiredBox(servicePanel(page), `${viewport.width}: служебная панель должна быть видима`);
    const phoneBox = await requiredBox(page.getByTestId("phone-stage"), `${viewport.width}: телефон должен быть видим`);
    const rightViewerCenter = panelBox.width + (viewport.width - panelBox.width) / 2;
    expectCloseCssPx(
      rightViewerCenter,
      viewport.expectedCenterX,
      `${viewport.width}: контрольный центр области справа от панели`,
    );
    expectCloseCssPx(
      phoneBox.x + phoneBox.width / 2,
      viewport.expectedCenterX,
      `${viewport.width}: центр телефона должен совпадать с центром области справа от панели`,
    );
  }
});

test("исходный силуэт телефона сохраняет прозрачную сцену, единый фон и масштабированное скругление", async ({ page }) => {
  const mismatches = [];
  const expandRadiusValues = (values) => {
    if (values.length === 1) return [values[0], values[0], values[0], values[0]];
    if (values.length === 2) return [values[0], values[1], values[0], values[1]];
    if (values.length === 3) return [values[0], values[1], values[2], values[1]];
    return values.slice(0, 4);
  };
  const radiusTokens = (value) => [...value.matchAll(/(-?\d*\.?\d+(?:e[-+]?\d+)?)(px|%)/giu)]
    .map((match) => ({ value: Number(match[1]), unit: match[2].toLowerCase() }));
  const radiusTokenToPx = (token, basis) => token.value * (token.unit === "%" ? basis / 100 : 1);
  const radiusListToPx = (value, basis) => expandRadiusValues(radiusTokens(value).map((token) => radiusTokenToPx(token, basis)));
  const clipPathRoundRadii = (clipPath, screenBox) => {
    const body = clipPath.match(/^inset\((.*)\)$/iu)?.[1];
    const roundIndex = body?.toLowerCase().lastIndexOf("round") ?? -1;
    if (!body || roundIndex < 0) return null;
    const [horizontalPart, verticalPart] = body.slice(roundIndex + "round".length).split("/").map((part) => part.trim());
    const horizontal = radiusListToPx(horizontalPart, screenBox.width);
    const vertical = verticalPart ? radiusListToPx(verticalPart, screenBox.height) : radiusListToPx(horizontalPart, screenBox.height);
    return horizontal.length === 4 && vertical.length === 4 ? { horizontal, vertical } : null;
  };
  const borderCornerRadii = (value, screenBox) => {
    const tokens = radiusTokens(value);
    if (tokens.length === 0) return null;
    return {
      horizontal: radiusTokenToPx(tokens[0], screenBox.width),
      vertical: radiusTokenToPx(tokens[1] ?? tokens[0], screenBox.height),
    };
  };

  for (const expected of phoneStates) {
    await openState(page, expected.id);
    const screenBox = await requiredBox(page.locator(".phone-screen"), `${expected.id}: phone-screen должен быть видим`);
    const widthScale = screenBox.width / 393;
    const heightScale = screenBox.height / 852;
    const expectedHorizontalRadius = 32 * widthScale;
    const expectedVerticalRadius = 32 * heightScale;
    const styles = await page.evaluate(() => {
      const shell = document.querySelector(".prototype-shell");
      const phoneScene = document.querySelector(".phone-scene");
      const phoneScreen = document.querySelector(".phone-screen");
      return {
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        shellBackground: getComputedStyle(shell).backgroundColor,
        phoneSceneBackground: getComputedStyle(phoneScene).backgroundColor,
        screenOverflow: getComputedStyle(phoneScreen).overflow,
        screenClipPath: getComputedStyle(phoneScreen).clipPath,
        screenRadius: {
          topLeft: getComputedStyle(phoneScreen).borderTopLeftRadius,
          topRight: getComputedStyle(phoneScreen).borderTopRightRadius,
          bottomRight: getComputedStyle(phoneScreen).borderBottomRightRadius,
          bottomLeft: getComputedStyle(phoneScreen).borderBottomLeftRadius,
        },
      };
    });

    if (styles.bodyBackground !== styles.shellBackground) {
      mismatches.push(`${expected.id}: фон body ${styles.bodyBackground} отличается от фона shell ${styles.shellBackground}`);
    }
    if (styles.phoneSceneBackground !== "rgba(0, 0, 0, 0)") {
      mismatches.push(`${expected.id}: phone-scene должен быть прозрачным, сейчас ${styles.phoneSceneBackground}`);
    }
    if (styles.screenOverflow !== "hidden") {
      mismatches.push(`${expected.id}: phone-screen должен клиповать содержимое через overflow hidden, сейчас ${styles.screenOverflow}`);
    }
    if (Math.abs(widthScale - heightScale) > .001) {
      mismatches.push(
        `${expected.id}: масштаб phone-screen должен быть согласован по ширине и высоте, сейчас ${widthScale.toFixed(6)} и ${heightScale.toFixed(6)}`,
      );
    }
    const clipRadii = clipPathRoundRadii(styles.screenClipPath, screenBox);
    if (styles.screenClipPath === "none" || !/inset\(/iu.test(styles.screenClipPath) || !/round/iu.test(styles.screenClipPath)) {
      mismatches.push(`${expected.id}: phone-screen должен иметь clip-path inset(... round ...), сейчас ${styles.screenClipPath}`);
    } else if (!clipRadii) {
      mismatches.push(`${expected.id}: не удалось извлечь числовой радиус clip-path после round из ${styles.screenClipPath}`);
    } else {
      for (const [index, radius] of clipRadii.horizontal.entries()) {
        if (Math.abs(radius - expectedHorizontalRadius) > .5) {
          mismatches.push(
            `${expected.id}: горизонтальный радиус clip-path #${index + 1} должен быть ${expectedHorizontalRadius.toFixed(2)}px, сейчас ${radius}px`,
          );
        }
      }
      for (const [index, radius] of clipRadii.vertical.entries()) {
        if (Math.abs(radius - expectedVerticalRadius) > .5) {
          mismatches.push(
            `${expected.id}: вертикальный радиус clip-path #${index + 1} должен быть ${expectedVerticalRadius.toFixed(2)}px, сейчас ${radius}px`,
          );
        }
      }
    }
    for (const [corner, radius] of Object.entries(styles.screenRadius)) {
      const cornerRadii = borderCornerRadii(radius, screenBox);
      if (!cornerRadii) {
        mismatches.push(`${expected.id}: не удалось извлечь радиус ${corner} из ${radius}`);
        continue;
      }
      if (Math.abs(cornerRadii.horizontal - expectedHorizontalRadius) > .5) {
        mismatches.push(
          `${expected.id}: ${corner} phone-screen должен иметь горизонтальный радиус ${expectedHorizontalRadius.toFixed(2)}px, сейчас ${cornerRadii.horizontal.toFixed(2)}px из ${radius}`,
        );
      }
      if (Math.abs(cornerRadii.vertical - expectedVerticalRadius) > .5) {
        mismatches.push(
          `${expected.id}: ${corner} phone-screen должен иметь вертикальный радиус ${expectedVerticalRadius.toFixed(2)}px, сейчас ${cornerRadii.vertical.toFixed(2)}px из ${radius}`,
        );
      }
    }
  }

  expect(mismatches).toEqual([]);
});

test("геометрия исправленного фрейма сохраняет закреплённые слои и внутреннюю прокрутку", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const stateId of scrollablePhoneStateIds) {
    await openState(page, stateId);
    const topBefore = await requiredBox(phoneSystemTop(page), `${stateId}: верхний слой до прокрутки`);
    const bottomBefore = await requiredBox(phoneSystemBottom(page), `${stateId}: нижний слой до прокрутки`);
    const viewport = phoneScrollViewport(page);

    await viewport.evaluate((node) => { node.scrollTop = 260; });
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expectBoxesClose(
      await requiredBox(phoneSystemTop(page), `${stateId}: верхний слой после внутренней прокрутки`),
      topBefore,
      `${stateId}: верхний слой после внутренней прокрутки`,
    );
    expectBoxesClose(
      await requiredBox(phoneSystemBottom(page), `${stateId}: нижний слой после внутренней прокрутки`),
      bottomBefore,
      `${stateId}: нижний слой после внутренней прокрутки`,
    );
  }

  for (const expected of phoneStates.filter((state) => !state.scrollable)) {
    await openState(page, expected.id);
    const scrollResult = await phoneScrollViewport(page).evaluate((node) => {
      node.scrollTop = 260;
      return {
        scrollTop: node.scrollTop,
        documentScrollY: window.scrollY,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
    });
    expect(scrollResult.scrollTop, `${expected.id}: фиксированная телефонная сцена не должна прокручиваться`).toBe(0);
    expect(scrollResult.documentScrollY, `${expected.id}: document должен оставаться неподвижным`).toBe(0);
    expect(scrollResult.scrollHeight - scrollResult.clientHeight, `${expected.id}: лишний запас внутренней прокрутки запрещён`).toBeLessThanOrEqual(1);
  }
});

test("почтовый кадр заполняет собственную сцену без пустых полей и сохраняет внешний отступ", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openState(page, "lisa-presentation-email");
  await assertEmailImageLoaded(page, expectedEmailState);

  const rootBox = await requiredBox(scene(page), "корневой viewer должен быть видим");
  const emailBox = await requiredBox(page.getByTestId("email-stage"), "почтовая сцена должна быть видима");
  const imageBox = await requiredBox(baseImage(page), "почтовый кадр должен быть видим");
  const imageMetadata = await baseImage(page).evaluate((node) => ({
    naturalWidth: node.naturalWidth,
    naturalHeight: node.naturalHeight,
  }));
  const imageFit = await baseImage(page).evaluate((node) => getComputedStyle(node).objectFit);
  const expectedRatio = 1553 / 1013;
  const contentScale = Math.min(imageBox.width / 1553, imageBox.height / 1013);
  const paintedImageBox = {
    width: 1553 * contentScale,
    height: 1013 * contentScale,
  };
  const mismatches = [];

  if (imageMetadata.naturalWidth !== 1553 || imageMetadata.naturalHeight !== 1013) {
    mismatches.push(`натуральные размеры почтового PNG должны быть 1553x1013, сейчас ${imageMetadata.naturalWidth}x${imageMetadata.naturalHeight}`);
  }
  if (Math.abs(emailBox.width / emailBox.height - expectedRatio) > .0005) {
    mismatches.push(
      `почтовая сцена должна иметь пропорции 1553/1013, сейчас ${(emailBox.width / emailBox.height).toFixed(6)}`,
    );
  }
  for (const edge of ["x", "y", "width", "height"]) {
    if (Math.abs(imageBox[edge] - emailBox[edge]) > .5) {
      mismatches.push(`bbox почтового кадра по ${edge} должен совпадать со сценой`);
    }
  }
  if (imageFit !== "contain") {
    mismatches.push(`почтовый кадр должен сохранять исходное соотношение через object-fit: contain, сейчас ${imageFit}`);
  }
  if (Math.abs(paintedImageBox.width - imageBox.width) > .5 || Math.abs(paintedImageBox.height - imageBox.height) > .5) {
    mismatches.push(
      `внутренняя область изображения ${paintedImageBox.width.toFixed(1)}x${paintedImageBox.height.toFixed(1)} ` +
        `не заполняет bbox ${imageBox.width.toFixed(1)}x${imageBox.height.toFixed(1)}`,
    );
  }

  const outerPadding = {
    left: emailBox.x - rootBox.x,
    top: emailBox.y - rootBox.y,
    right: rootBox.x + rootBox.width - emailBox.x - emailBox.width,
    bottom: rootBox.y + rootBox.height - emailBox.y - emailBox.height,
  };
  if (outerPadding.left < 12 || outerPadding.left > 24) {
    mismatches.push(`левый внешний отступ относительно viewer должен быть в диапазоне 12..24px, сейчас ${outerPadding.left.toFixed(1)}`);
  }
  if (outerPadding.right < 12 || outerPadding.right > 24) {
    mismatches.push(`правый внешний отступ относительно viewer должен быть в диапазоне 12..24px, сейчас ${outerPadding.right.toFixed(1)}`);
  }
  if (outerPadding.top < 12) mismatches.push(`верхний внешний отступ должен быть не меньше 12px, сейчас ${outerPadding.top.toFixed(1)}`);
  if (outerPadding.bottom < 12) mismatches.push(`нижний внешний отступ должен быть не меньше 12px, сейчас ${outerPadding.bottom.toFixed(1)}`);
  if (Math.abs(outerPadding.top - outerPadding.bottom) > .5) {
    mismatches.push(
      `верхний и нижний внешние отступы должны быть симметричны, сейчас ${outerPadding.top.toFixed(1)} и ${outerPadding.bottom.toFixed(1)}`,
    );
  }

  expect(mismatches).toEqual([]);
});

test("почтовый кадр на тройной плотности заполняет ширину как презентация без обрезания", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 3,
    locale: "ru-RU",
    timezoneId: "UTC",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  try {
    await openState(page, "lisa-presentation-email");
    const visualStageBox = await requiredBox(scene(page), "visual-stage должен быть видим");
    const emailBox = await requiredBox(page.getByTestId("email-stage"), "почтовая сцена должна быть видима");
    const emailImageBox = await requiredBox(baseImage(page), "почтовый PNG должен быть видим");
    const frameInset = await scene(page).evaluate((node) => Number.parseFloat(getComputedStyle(node).paddingLeft));
    const expectedEmailRatio = 1553 / 1013;
    const emailImage = await baseImage(page).evaluate((node) => ({
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      objectFit: getComputedStyle(node).objectFit,
    }));
    const emailLeftInset = emailBox.x - visualStageBox.x;
    const emailRightInset = visualStageBox.x + visualStageBox.width - emailBox.x - emailBox.width;
    const emailScrollY = await page.evaluate(() => window.scrollY);

    await openState(page, "lisa-presentation-slidedoc");
    const slideDocBox = await requiredBox(page.getByTestId("document-stage"), "сцена SlideDoc должна быть видима");

    expect(emailScrollY, "внешняя страница письма не должна прокручиваться").toBe(0);
    expectCloseCssPx(emailBox.width, slideDocBox.width, "почта и SlideDoc должны занимать всю доступную ширину");
    expectCloseCssPx(emailLeftInset, emailRightInset, "левый и правый отступы письма должны совпадать");
    expectCloseCssPx(emailLeftInset, frameInset, "левый отступ письма должен совпадать с --frame-inset");
    expectCloseCssPx(emailBox.width, visualStageBox.width - (frameInset * 2), "почта должна занимать всю ширину внутри frame-inset");
    expect(
      Math.abs((emailBox.width / emailBox.height) - expectedEmailRatio),
      `отношение сторон письма должно сохранять 1553/1013 с безразмерным допуском 0.0005`,
    ).toBeLessThanOrEqual(.0005);
    expectBoxesClose(emailImageBox, emailBox, "bbox почтового PNG должен совпадать со сценой");
    expect(emailImage, "почтовый PNG должен сохранить исходные размеры и object-fit").toEqual({
      naturalWidth: 1553,
      naturalHeight: 1013,
      objectFit: "contain",
    });
  } finally {
    await context.close();
  }
});

test("внутренняя телефонная прокрутка есть только у 5.4, а её положение сбрасывается при переходе", async ({ page }) => {
  for (const stateId of scrollablePhoneStateIds) {
    await openState(page, stateId);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(phoneScrollViewport(page), `${stateId}: нужен внутренний контейнер phone-scroll-viewport`).toHaveCount(1);

    const scrollResult = await phoneScrollViewport(page).evaluate((node) => {
      node.scrollTop = 260;
      return {
        scrollTop: node.scrollTop,
        documentScrollY: window.scrollY,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
    });
    expect(scrollResult.scrollHeight, `${stateId}: контейнер должен иметь запас прокрутки`).toBeGreaterThan(
      scrollResult.clientHeight,
    );
    expect(scrollResult.scrollTop, `${stateId}: должен меняться именно внутренний scrollTop`).toBeGreaterThan(0);
    expect(scrollResult.documentScrollY, `${stateId}: document не должен прокручиваться`).toBe(0);

    await nextButton(page).click();
    await expect(phoneScrollViewport(page), "после перехода новый экран должен начинать с scrollTop=0").toHaveJSProperty(
      "scrollTop",
      0,
    );
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }

  for (const expected of phoneStates.filter((state) => !state.scrollable)) {
    await openState(page, expected.id);
    const scrollResult = await phoneScrollViewport(page).evaluate((node) => {
      node.scrollTop = 260;
      return {
        scrollTop: node.scrollTop,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
    });
    expect(scrollResult.scrollTop, `${expected.id}: телефонная сцена не должна прокручиваться`).toBe(0);
    expect(
      scrollResult.scrollHeight - scrollResult.clientHeight,
      `${expected.id}: не должно быть внутреннего запаса прокрутки`,
    ).toBeLessThanOrEqual(1);
  }
});

test("состояния презентаций прокручиваются внутри десктопной сцены и возвращаются к началу при смене состояния", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const expected of documentStates) {
    await openState(page, expected.id);
    await expect(scene(page)).toHaveAttribute("data-presentation", "desktop");
    await assertDocumentImageLoaded(page, expected);

    const scrollResult = await documentScrollViewport(page).evaluate((node) => {
      node.scrollTop = 900;
      return {
        scrollTop: node.scrollTop,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
        documentScrollY: window.scrollY,
      };
    });
    expect(scrollResult.scrollHeight, `${expected.id}: документ должен иметь внутренний запас прокрутки`).toBeGreaterThan(
      scrollResult.clientHeight,
    );
    expect(scrollResult.scrollTop, `${expected.id}: должен меняться document-scroll-viewport.scrollTop`).toBeGreaterThan(0);
    expect(scrollResult.documentScrollY, `${expected.id}: внешняя страница должна оставаться неподвижной`).toBe(0);

    if (expected.id !== documentStateIds.at(-1)) {
      await nextButton(page).click();
    } else {
      await previousButton(page).click();
    }
    await expect(documentScrollViewport(page), "при смене документа внутренний scrollTop должен сбрасываться").toHaveJSProperty(
      "scrollTop",
      0,
    );
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
});

test("слайды автоматически масштабируются под окно и сохраняют пропорции 16:9", async ({ page }) => {
  for (const expected of documentStates) {
    const widths = [];
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      await openState(page, expected.id);
      const stageBox = await requiredBox(page.getByTestId("document-stage"), `${expected.id}: нужна сцена презентации`);
      const scrollerBox = await requiredBox(documentScrollViewport(page), `${expected.id}: нужно окно прокрутки презентации`);
      const imageBox = await requiredBox(baseImage(page), `${expected.id}: нужен растр из трёх слайдов`);

      expectCloseCssPx(stageBox.width / stageBox.height, 16 / 9, `${expected.id}: сцена должна сохранять пропорции 16:9`);
      expectBoxesClose(scrollerBox, stageBox, `${expected.id}: окно прокрутки должно полностью занимать сцену`);
      expectCloseCssPx(imageBox.width, stageBox.width, `${expected.id}: слайды должны занимать всю ширину сцены`);
      expectCloseCssPx(imageBox.height / 3, stageBox.height, `${expected.id}: каждый слайд должен полностью помещаться по высоте сцены`);
      widths.push(stageBox.width);
    }

    expect(widths[0], `${expected.id}: широкое окно должно давать более крупный слайд`).toBeGreaterThan(widths[1]);
    expect(widths[1], `${expected.id}: узкое окно должно уменьшать слайд`).toBeGreaterThan(widths[2]);
  }
});

test("колесо и перетаскивание прокручивают только содержимое смартфона", async ({ page }) => {
  await openState(page, "lisa-materials-full-reference");
  const phoneScroll = phoneScrollViewport(page);
  await expect(phoneScroll, "нужен новый viewport средней прокрутки").toHaveCount(1);
  await phoneScroll.hover();
  await page.mouse.wheel(0, 360);
  await expect.poll(() => phoneScroll.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await phoneScroll.evaluate((node) => { node.scrollTop = 0; });
  const box = await phoneScroll.boundingBox();
  expect(box, "прокручиваемый экран должен быть видим").toBeTruthy();
  const x = box.x + box.width / 2;
  const startY = box.y + box.height * .72;
  await page.mouse.move(x, startY);
  await page.mouse.down();
  await page.mouse.move(x, startY - 180, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => phoneScroll.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("тройная плотность экрана не увеличивает телефонные и документные растры выше натуральных размеров", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 3,
    locale: "ru-RU",
    timezoneId: "UTC",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  try {
    for (const expected of [...phoneStates, ...documentStates]) {
      await page.goto(demoUrl(expected.id), { waitUntil: "load" });
      const stage = page.getByTestId(stageTestId(expected));
      const stageBox = await stage.boundingBox();
      expect(stageBox, `${expected.id}: сцена должна быть видима`).toBeTruthy();
      if (expected.presentation === "phone") {
        const bodyRatio = 78.1 / 160.8;
        const sourceScreenRatio = 393 / 852;
        await expect(phoneScrollViewport(page), `${expected.id}: нужен новый viewport средней прокрутки`).toHaveCount(1);
        const phoneScrollBox = await phoneScrollViewport(page).boundingBox();
        const phoneScreenBox = await page.locator(".phone-screen").boundingBox();
        expect(phoneScrollBox, `${expected.id}: среднее окно должно быть видимо`).toBeTruthy();
        expect(phoneScreenBox, `${expected.id}: внутренний экран должен быть видим`).toBeTruthy();
        expect(stageBox.width / stageBox.height).toBeCloseTo(bodyRatio, 3);
        expect(phoneScreenBox.width / phoneScreenBox.height).toBeCloseTo(sourceScreenRatio, 3);
        expect(phoneScreenBox.x - stageBox.x).toBeGreaterThan(0);
        expect(stageBox.x + stageBox.width - phoneScreenBox.x - phoneScreenBox.width).toBeGreaterThan(0);
        for (const layer of expectedPhoneRasterLayers(expected.id)) {
          const imageBox = await phoneLayerContainer(page, layer.role).locator("img").boundingBox();
          expect(imageBox, `${expected.id}: слой ${layer.role} должен быть видим для проверки 3x`).toBeTruthy();
          expect(imageBox.width * 3, `${expected.id}: ширина слоя ${layer.role} не должна превышать 3x PNG`).toBeLessThanOrEqual(
            layer.pixelDimensions.width + 1,
          );
          expect(imageBox.height * 3, `${expected.id}: высота слоя ${layer.role} не должна превышать 3x PNG`).toBeLessThanOrEqual(
            layer.pixelDimensions.height + 1,
          );
        }
        const bodyPixelWidth = 1179;
        const bodyPixelHeight = 852 * 3;
        const sourceScreenShare = sourceScreenRatio / bodyRatio;
        expect(stageBox.width * 3).toBeLessThanOrEqual(bodyPixelWidth / sourceScreenShare + 1);
        expect(stageBox.height * 3).toBeLessThanOrEqual(bodyPixelHeight + 1);
      } else {
        const paintScale = Math.min(
          stageBox.width / expected.pixelDimensions.width,
          stageBox.height / expected.pixelDimensions.height,
        );
        expect(expected.pixelDimensions.width * paintScale * 3).toBeLessThanOrEqual(expected.pixelDimensions.width + 1);
        expect(expected.pixelDimensions.height * paintScale * 3).toBeLessThanOrEqual(expected.pixelDimensions.height + 1);
      }
    }
  } finally {
    await context.close();
  }
});

test("почта является отдельной десктопной сценой 1553x1013 без обрезания", async ({ page }) => {
  await page.setViewportSize({ width: 1553, height: 1013 });
  await openState(page, "lisa-presentation-email");

  await expect(scene(page)).toHaveAttribute("data-presentation", "desktop");
  await expect(page.getByTestId("email-stage")).toHaveCount(1);
  await assertEmailImageLoaded(page, expectedEmailState);

  const box = await baseImage(page).boundingBox();
  const viewerBox = await page.getByTestId("email-stage").boundingBox();
  const imageFit = await baseImage(page).evaluate((node) => getComputedStyle(node).objectFit);
  expect(box, "у почтовой сцены должен быть видимый base image").toBeTruthy();
  expect(viewerBox, "почтовая сцена должна иметь viewer").toBeTruthy();
  expect(box.x).toBeGreaterThanOrEqual(viewerBox.x - 1);
  expect(box.y).toBeGreaterThanOrEqual(viewerBox.y - 1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewerBox.x + viewerBox.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewerBox.y + viewerBox.height + 1);
  expect(imageFit, "исходное соотношение должно сохраняться без обрезания").toBe("contain");
});

test("навигационный DOM не содержит старых идентификаторов состояний", async ({ page }) => {
  await openState(page, expectedStateIds[0]);

  const navigationStateIds = await page.evaluate(() => [
    ...document.querySelectorAll("[data-state-id], [data-target-state-id]"),
  ].map((node) => node.getAttribute("data-state-id") || node.getAttribute("data-target-state-id")));

  expect(navigationStateIds.filter(Boolean).every((stateId) => expectedStateIds.includes(stateId))).toBe(true);

  const bodyText = await page.locator("body").evaluate((node) => node.innerHTML);
  for (const fragment of forbiddenLegacyStateFragments) {
    expect(bodyText, `навигация не должна содержать старый state id или поверхность: ${fragment}`).not.toContain(fragment);
  }

  const runtimeSources = ["index.html", "app.js", "data.js", "styles.css"]
    .map((fileName) => fs.readFileSync(path.join(packageRoot, "demo", fileName), "utf8"))
    .join("\n");
  for (const fragment of forbiddenLegacyStateFragments) {
    expect(runtimeSources, `runtime не должен содержать старый state id или поверхность: ${fragment}`).not.toContain(fragment);
  }
});
