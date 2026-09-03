import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const indexPath = path.join(process.cwd(), "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/browser-native-phone-prototype/index.html");
const urlFor = (state, parameters = {}) => {
  const url = pathToFileURL(indexPath);
  url.searchParams.set("state", state);
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, String(value));
  return url.href;
};
const generation = "Формирование презентации началось в 13:24 и займет не более 20 минут. После завершения презентация будет направлена по электронной почте в SIGMA и OMEGA.";
const phoneChatStateIds = ["lisa-materials-full-reference", "lisa-presentation-generating", "lisa-presentation-sent", "lisa-order-not-accepted", "lisa-delivery-delayed", "lisa-delivery-partial"];
const viewerFrameSequence = ["lisa-materials-full-reference", "lisa-presentation-generating", "lisa-presentation-chat-list", "lisa-presentation-sent", "lisa-presentation-email", "lisa-presentation-slidedoc", "lisa-presentation-sber2025", "lisa-presentation-mag", "lisa-order-not-accepted", "lisa-delivery-delayed", "lisa-delivery-partial"];
const viewerTitle = "Прототип заказа презентации из агента \"Справка по клиенту\"";
const phoneStateCaptions = {
  "lisa-materials-full-reference": "Заказ презентации по справке по клиенту",
  "lisa-presentation-generating": "Успешное начало изготовления презентации",
  "lisa-presentation-chat-list": "Список чатов и возврат к исходному экрану",
  "lisa-presentation-sent": "Презентация направлена по электронной почте",
  "lisa-order-not-accepted": "Данные не приняты для формирования презентации",
  "lisa-delivery-delayed": "Отправка презентации в SIGMA задерживается",
  "lisa-delivery-partial": "Частичная или неподтверждённая доставка презентации",
};

async function settled(page) { await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); }); }

test("оболочка просмотра получает договорный заголовок и статусную подпись", async ({ page }) => {
  await page.goto(pathToFileURL(indexPath).href); await settled(page);
  await expect(page).toHaveTitle(viewerTitle);
  await expect(page.locator("#viewer-title")).toHaveText(viewerTitle);
  await expect(page.getByTestId("review-panel")).toHaveAttribute("aria-labelledby", "viewer-title");
  await expect(page.getByTestId("review-subtitle")).toHaveText(phoneStateCaptions["lisa-materials-full-reference"]);

  for (const [stateId, caption] of Object.entries(phoneStateCaptions)) {
    await page.goto(urlFor(stateId)); await settled(page);
    await expect(page.getByTestId("review-panel")).toBeVisible();
    await expect(page.getByTestId("review-subtitle")).toHaveText(caption);
  }

  for (const stateId of ["lisa-presentation-email", "lisa-presentation-slidedoc", "lisa-presentation-sber2025", "lisa-presentation-mag"]) {
    await page.goto(urlFor(stateId)); await settled(page);
    await expect(page.getByTestId("review-panel")).toBeHidden();
    await expect(page.getByTestId("review-subtitle")).toHaveText("");
    await expect(page.getByTestId("review-panel")).toHaveJSProperty("inert", true);
  }
});

test("стрелки кадра работают мышью и клавиатурой, но не в поле сообщения", async ({ page }) => {
  await page.goto(pathToFileURL(indexPath).href); await settled(page);
  const phone = page.getByTestId("phone-assembly");
  await page.getByTestId("next-frame").click();
  await expect(phone).toHaveAttribute("data-state-id", "lisa-presentation-generating");
  await page.getByTestId("previous-frame").click();
  await expect(phone).toHaveAttribute("data-state-id", "lisa-materials-full-reference");

  await page.keyboard.press("ArrowRight");
  await expect(phone).toHaveAttribute("data-state-id", "lisa-presentation-generating");
  await page.locator(".composer-field").focus();
  await page.keyboard.press("ArrowRight");
  await expect(phone).toHaveAttribute("data-state-id", "lisa-presentation-generating");
  await page.getByTestId("phone-scroll-region").focus();
  await page.keyboard.press("ArrowRight");
  await expect(phone).toHaveAttribute("data-state-id", "lisa-presentation-chat-list");

  await page.goto(urlFor("lisa-presentation-email")); await settled(page);
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("external-stage")).toHaveAttribute("data-state-id", "lisa-presentation-slidedoc");

  await page.goto(pathToFileURL(indexPath).href); await settled(page);
  const visibleState = page.locator("[data-testid='phone-assembly'], [data-testid='external-stage']");
  for (const stateId of viewerFrameSequence.slice(1)) {
    await page.getByTestId("next-frame").click();
    await expect(visibleState).toHaveAttribute("data-state-id", stateId);
  }
  for (const stateId of viewerFrameSequence.slice(0, -1).reverse()) {
    await page.getByTestId("previous-frame").click();
    await expect(visibleState).toHaveAttribute("data-state-id", stateId);
  }
});

test("DOM-телефон следует маршруту и не загружает сетевые данные", async ({ page }) => {
  const requests = []; const errors = [];
  page.on("request", (request) => requests.push(request.url())); page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(urlFor("lisa-materials-full-reference")); await settled(page);
  const phone = page.getByTestId("phone-assembly"); await expect(phone).toBeVisible();
  await expect(phone.locator(".phone-hardware [id='phone-notch']")).toHaveCount(1);
  await expect(phone.locator(".phone-hardware-overlay [id='phone-notch']")).toHaveCount(1);
  await expect(phone.locator("[id^='phone-side-'], [id='phone-side-button'], [id='phone-silent-switch'], [id='phone-volume-up'], [id='phone-volume-down']")).toHaveCount(0);
  await expect(phone.locator("img")).toHaveCount(0);
  await page.getByTestId("order-presentation").click();
  await expect(phone).toHaveAttribute("data-state-id", "lisa-presentation-generating");
  await expect(page.getByText(generation)).toBeVisible(); await expect(page.getByTestId("order-presentation")).toBeDisabled();
  const correctOrder = await page.evaluate(() => { const button = document.querySelector("[data-dom-id='create-presentation']"); const message = document.querySelector("[data-dom-id='generation-started']"); return Boolean(button && message && button.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING); });
  expect(correctOrder).toBe(true);
  expect(requests.every((item) => item.startsWith("file:"))).toBe(true); expect(errors).toEqual([]);
});

test("векторный корпус укладывается в контейнер с четырёхпиксельным зазором", async ({ page }) => {
  await page.goto(urlFor("lisa-presentation-sent")); await settled(page);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 800, height: 900 }, { width: 1200, height: 616 }, { width: 3840, height: 2160 }]) {
    await page.setViewportSize(viewport); await settled(page);
    const result = await page.evaluate(() => {
      const phone = document.querySelector("[data-testid='phone-assembly']"), stage = document.querySelector(".prototype-stage"), screen = document.querySelector("[data-testid='phone-screen']");
      if (!phone || !stage || !screen) throw new Error("Не найдена геометрия телефона");
      const a = phone.getBoundingClientRect(), b = stage.getBoundingClientRect(), c = screen.getBoundingClientRect();
      return { gaps: [a.left - b.left, b.right - a.right, a.top - b.top, b.bottom - a.bottom], ratio: a.width / a.height, contained: c.left >= a.left && c.right <= a.right && c.top >= a.top && c.bottom <= a.bottom };
    });
    expect(result.contained).toBe(true); expect(result.ratio).toBeCloseTo(78.1 / 160.8, 4);
    expect(Math.min(...result.gaps)).toBeGreaterThanOrEqual(3.5);
    expect(Math.min(...result.gaps)).toBeLessThanOrEqual(4.5);
  }
});

test("все экраны переписки открывают список чатов и возвращают в исходный экран", async ({ page }) => {
  for (const stateId of phoneChatStateIds) {
    await page.goto(urlFor(stateId)); await settled(page);
    const menu = page.getByRole("button", { name: "Открыть список чатов" });
    await expect(menu).toBeEnabled();
    const before = await page.getByTestId("phone-scroll-region").evaluate((node) => {
      node.scrollTop = Math.max(0, node.scrollHeight - node.clientHeight - 8);
      return node.scrollTop;
    });
    await menu.click();
    await expect(page.getByTestId("phone-assembly")).toHaveAttribute("data-state-id", "lisa-presentation-chat-list");
    expect(new URL(page.url()).searchParams.get("return_state")).toBe(stateId);
    await page.getByRole("button", { name: /Справка по клиенту ООО «Водолей Трейд»/u }).click();
    await expect(page.getByTestId("phone-assembly")).toHaveAttribute("data-state-id", stateId);
    await settled(page);
    const after = await page.getByTestId("phone-scroll-region").evaluate((node) => node.scrollTop);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
  }
});

test("панель телефона содержит только переход по кадрам, а внешние кадры используют оверлей", async ({ page }) => {
  await page.goto(urlFor("lisa-materials-full-reference")); await settled(page);
  await expect(page.getByTestId("review-panel")).toBeVisible();
  await expect(page.getByTestId("previous-frame")).toBeDisabled();
  await expect(page.getByTestId("next-frame")).toBeEnabled();
  await page.getByTestId("next-frame").click();
  await expect(page.getByTestId("phone-assembly")).toHaveAttribute("data-state-id", "lisa-presentation-generating");

  await page.goto(urlFor("lisa-presentation-email")); await settled(page);
  await expect(page.getByTestId("review-panel")).toBeHidden();
  await expect(page.getByTestId("external-overlay")).toBeVisible();
  await expect(page.getByTestId("previous-frame")).toBeVisible();
  await expect(page.getByTestId("next-frame")).toBeVisible();
  await expect(page.getByTestId("previous-page")).toHaveCount(0);
  await expect(page.getByTestId("next-page")).toHaveCount(0);
  await page.getByTestId("next-frame").click();
  await expect(page.getByTestId("external-stage")).toHaveAttribute("data-state-id", "lisa-presentation-slidedoc");
  await expect(page.getByTestId("previous-page")).toBeDisabled();
  await expect(page.getByTestId("next-page")).toBeEnabled();
});

test("презентация листается оверлеем и клавиатурой сменой независимой 4K-страницы", async ({ page }) => {
  await page.goto(urlFor("lisa-presentation-slidedoc", { page: 0 })); await settled(page);
  const stage = page.getByTestId("external-stage");
  await expect(stage).toHaveAttribute("data-page", "0");
  const source = await stage.locator("img").getAttribute("src");
  expect(source).toMatch(/lisa-presentation-slidedoc-page-1\.png$/u);
  await expect(stage.locator("img")).toHaveJSProperty("naturalWidth", 3840);
  await expect(stage.locator("img")).toHaveJSProperty("naturalHeight", 2160);
  await page.getByTestId("next-page").click();
  await expect(stage).toHaveAttribute("data-page", "1");
  expect(await stage.locator("img").getAttribute("src")).toMatch(/lisa-presentation-slidedoc-page-2\.png$/u);
  expect(await stage.locator("img").getAttribute("src")).not.toBe(source);
  await page.keyboard.press("ArrowDown");
  await expect(stage).toHaveAttribute("data-page", "2");
  await expect(page.getByTestId("next-page")).toBeDisabled();
  await page.keyboard.press("ArrowUp");
  await expect(stage).toHaveAttribute("data-page", "1");
});

test("письмо остаётся векторным и не запускает внешнюю сеть", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(urlFor("lisa-presentation-email")); await settled(page);
  const image = page.getByTestId("external-stage").locator("img");
  await expect(image).toHaveAttribute("src", /assets\/external\/lisa-presentation-email\.svg$/u);
  const source = await image.getAttribute("src");
  expect(source).not.toMatch(/https?:/u);
  expect(requests.every((request) => request.startsWith("file:"))).toBe(true);
});

test("последовательность кадров и оверлей не выходят за границы доступного окна", async ({ page }) => {
  for (const [index, stateId] of viewerFrameSequence.entries()) {
    await page.goto(urlFor(stateId)); await settled(page);
    const expectedPrevious = index === 0;
    const expectedNext = index === viewerFrameSequence.length - 1;
    await expect(page.getByTestId("previous-frame")).toHaveJSProperty("disabled", expectedPrevious);
    await expect(page.getByTestId("next-frame")).toHaveJSProperty("disabled", expectedNext);
  }
});

test("нижнее сообщение закрепляется внизу и прокрутка остаётся единственной", async ({ page }) => {
  await page.goto(urlFor("lisa-presentation-generating")); await settled(page);
  const values = await page.evaluate(() => {
    const screen = document.querySelector("[data-testid='phone-screen']"), scroll = document.querySelector("[data-testid='phone-scroll-region']");
    if (!screen || !scroll) throw new Error("Не найдено окно чата");
    const initial = scroll.scrollTop; scroll.scrollTop = 0; const top = scroll.scrollTop; scroll.scrollTop = scroll.scrollHeight; const bottom = scroll.scrollTop;
    return { initial, top, bottom, scrollHeight: scroll.scrollHeight, clientHeight: scroll.clientHeight, overflow: getComputedStyle(screen).overflow, scrollOverflow: getComputedStyle(scroll).overflowY };
  });
  expect(values.initial).toBeGreaterThan(0); expect(values.top).toBe(0); expect(values.bottom).toBeGreaterThan(0); expect(values.scrollHeight).toBeGreaterThan(values.clientHeight); expect(values.overflow).toBe("hidden"); expect(values.scrollOverflow).toBe("auto");
  await page.goto(urlFor("lisa-presentation-generating")); await settled(page);
  for (const viewport of [{ width: 1200, height: 616 }, { width: 800, height: 900 }, { width: 1440, height: 900 }]) { await page.setViewportSize(viewport); await settled(page); const anchored = await page.getByTestId("phone-scroll-region").evaluate((node) => node.scrollTop >= node.scrollHeight - node.clientHeight - 2); expect(anchored).toBe(true); }
});
