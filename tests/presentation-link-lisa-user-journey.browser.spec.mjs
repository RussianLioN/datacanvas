import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readStoredZip } from "../scripts/lib/documentation-archive.mjs";

const root = process.cwd();
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const packageRoot = process.env.LISA_PROTOTYPE_PACKAGE_ROOT
  ? path.resolve(process.env.LISA_PROTOTYPE_PACKAGE_ROOT)
  : path.join(root, packagePath);
const activeContractsPath = path.join(packageRoot, "source/active-contracts.json");
const journeyPath = path.join(packageRoot, "source/journey-contract.json");
const packageContractPath = path.join(packageRoot, "source/prototype-package-contract.json");
const sourceCatalogPath = path.join(packageRoot, "source/source-render-catalog.json");
const visualBasisPath = path.join(packageRoot, "source/visual-basis-contract.json");
const virtualOrigin = "http://lisa.invalid";
const runtimeViewports = [
  { id: "desktop-1280x720", width: 1280, height: 720 },
  { id: "mobile-390x844", width: 390, height: 844 },
  { id: "stress-320x568", width: 320, height: 568 },
];
const webkitCaptureToolWarning =
  "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".ttf", "font/ttf"],
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readRasterContracts() {
  return {
    registry: readJson(activeContractsPath),
    journey: readJson(journeyPath),
    packageContract: readJson(packageContractPath),
    sourceCatalog: readJson(sourceCatalogPath),
    visualBasis: readJson(visualBasisPath),
  };
}

function activeStateIds(contracts) {
  const ids = contracts.registry.active_state_ids;
  expect(Array.isArray(ids)).toBe(true);
  expect(ids.length).toBe(20);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).toEqual(contracts.journey.states.map((state) => state.id));
  return ids;
}

function bindingForState(visualBasis, stateId) {
  const binding = visualBasis.state_bindings.find((candidate) => candidate.state_id === stateId);
  expect(binding, `${stateId}: отсутствует binding растровой основы`).toBeTruthy();
  return binding;
}

function actionFor(journey, actionId) {
  const action = journey.actions.find((candidate) => candidate.id === actionId);
  expect(action, `отсутствует действие ${actionId}`).toBeTruthy();
  return action;
}

function interactionFor(visualBasis, stateId, actionId) {
  const interaction = visualBasis.interaction_slots.find(
    (candidate) => candidate.state_id === stateId && candidate.action_id === actionId,
  );
  expect(interaction, `${stateId}: отсутствует semantic slot для ${actionId}`).toBeTruthy();
  return interaction;
}

function slotForInteraction(visualBasis, stateId, actionId) {
  const binding = bindingForState(visualBasis, stateId);
  const interaction = interactionFor(visualBasis, stateId, actionId);
  const slot = binding.slots.find((candidate) => candidate.id === interaction.slot_id);
  expect(slot, `${stateId}: отсутствует slot ${interaction.slot_id}`).toBeTruthy();
  return slot;
}

function prototypeScene(page) {
  return page.locator("[data-prototype-scene]");
}

function expectedDemoAssetPath(sourcePath) {
  expect(sourcePath).toMatch(/^source\/(?:bases|patches)\/[a-z0-9-]+\.png$/u);
  return `assets/${sourcePath.slice("source/".length)}`;
}

function expectedRasterPaths(binding) {
  return [
    expectedDemoAssetPath(binding.base_path),
    ...binding.slots
      .map((slot) => slot.visible_patch_path)
      .filter(Boolean)
      .map((sourcePath) => expectedDemoAssetPath(sourcePath)),
  ].sort((left, right) => left.localeCompare(right, "en"));
}

function expectedPortableRasterMembers(visualBasis) {
  return visualBasis.state_bindings
    .flatMap((binding) => [
      `demo/${expectedDemoAssetPath(binding.base_path)}`,
      ...binding.slots
        .map((slot) => slot.visible_patch_path)
        .filter(Boolean)
        .map((sourcePath) => `demo/${expectedDemoAssetPath(sourcePath)}`),
    ])
    .sort((left, right) => left.localeCompare(right, "en"));
}

function assertPortableRuntimeAssetsInDemo() {
  for (const relativePath of ["demo/index.html", "demo/app.js", "demo/data.js", "demo/styles.css"]) {
    const source = fs.readFileSync(path.join(packageRoot, relativePath), "utf8");
    expect(
      source,
      `${relativePath}: демо не должно зависеть от исходных source/** при прямом file:// открытии`,
    ).not.toMatch(/\.\.\//u);
    expect(
      source,
      `${relativePath}: исполняемое демо не должно ссылаться на source/bases, source/patches или source/fonts`,
    ).not.toMatch(/source\/(?:bases|patches|fonts)\//u);
  }
}

function demoUrl(targetDemoPath = null) {
  return targetDemoPath
    ? pathToFileURL(targetDemoPath)
    : new URL("/demo/index.html", virtualOrigin);
}

async function installVirtualPackageRoute(context) {
  await context.route(/^https?:/u, async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin !== virtualOrigin) {
      await route.abort("blockedbyclient");
      return;
    }
    const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
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

async function openPrototypeScene(page, stateId, targetDemoPath = null) {
  const url = demoUrl(targetDemoPath);
  url.searchParams.set("state", stateId);
  await page.goto(url.href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await expect(prototypeScene(page)).toHaveCount(1);
  await expect(prototypeScene(page)).toHaveAttribute("data-state-id", stateId);
}

async function assertRegisteredRasterScene(page, binding) {
  const images = await prototypeScene(page).locator("img").evaluateAll((nodes) =>
    nodes.map((node) => ({
      src: node.getAttribute("src"),
      alt: node.getAttribute("alt"),
      ariaHidden: node.getAttribute("aria-hidden"),
      complete: node.complete,
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
    })),
  );
  expect(
    images.map((image) => image.src).sort((left, right) => left.localeCompare(right, "en")),
  ).toEqual(expectedRasterPaths(binding));
  for (const image of images) {
    expect(image.src).toMatch(/^assets\/(?:bases|patches)\/[a-z0-9-]+\.png$/u);
    expect(image.alt).toBe("");
    expect(image.ariaHidden).toBe("true");
    expect(image.complete).toBe(true);
    expect(image.naturalWidth).toBeGreaterThan(0);
    expect(image.naturalHeight).toBeGreaterThan(0);
  }
  const base = images.find((image) => image.src === expectedDemoAssetPath(binding.base_path));
  expect(base, `${binding.state_id}: отсутствует нативная PNG-основа`).toBeTruthy();
  expect(base.naturalWidth).toBe(binding.natural_dimensions.width);
  expect(base.naturalHeight).toBe(binding.natural_dimensions.height);
}

async function assertSemanticSlots(page, binding) {
  for (const slot of binding.slots) {
    await expect(
      prototypeScene(page).locator(
        `[data-slot-id="${slot.id}"][data-semantic-control-id="${slot.semantic_control_id}"]`,
      ),
    ).toHaveCount(1);
  }
}

async function activateSlotAction(page, contracts, stateId, actionId, useKeyboard = false) {
  const slot = slotForInteraction(contracts.visualBasis, stateId, actionId);
  const control = prototypeScene(page).locator(
    `[data-slot-id="${slot.id}"][data-semantic-control-id="${slot.semantic_control_id}"][data-action-id="${actionId}"]`,
  );
  expect(await control.count(), `${stateId}: ${actionId} не привязан к semantic slot`).toBeGreaterThan(0);
  const action = actionFor(contracts.journey, actionId);
  await expect(control.first()).toHaveAttribute("data-action-id", actionId);
  if (useKeyboard) {
    await control.first().focus();
    await page.keyboard.press("Enter");
  } else {
    await control.first().click();
  }
  return action;
}

function assertNoManualPhoneShellInSource() {
  const css = fs.readFileSync(path.join(packageRoot, "demo/styles.css"), "utf8");
  const app = fs.readFileSync(path.join(packageRoot, "demo/app.js"), "utf8");
  expect(css).not.toMatch(/(?:^|[^\w-])\.phone(?![\w-])/mu);
  expect(css).not.toMatch(/\.phone-(?:header|content|composer)\b|\.clock-(?:face|hand)\b/u);
  expect(app).not.toMatch(/className:\s*["']phone(?:["']|\s)/u);
}

async function installControlledTimerSeam(page) {
  await page.addInitScript(() => {
    const state = { nextId: 1_000_000, now: 0, timers: new Map() };
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeClearTimeout = window.clearTimeout.bind(window);
    function nextDueTimer(targetTime) {
      return [...state.timers.entries()]
        .filter(([, timer]) => timer.dueAt <= targetTime)
        .sort(([leftId, left], [rightId, right]) => left.dueAt - right.dueAt || leftId - rightId)[0];
    }
    window.setTimeout = (callback, delay = 0, ...args) => {
      if (typeof callback !== "function") return nativeSetTimeout(callback, delay, ...args);
      const id = state.nextId;
      state.nextId += 1;
      state.timers.set(id, {
        callback,
        args,
        dueAt: state.now + (Number.isFinite(Number(delay)) ? Math.max(0, Number(delay)) : 0),
      });
      return id;
    };
    window.clearTimeout = (id) => {
      if (!state.timers.delete(id)) nativeClearTimeout(id);
    };
    Object.defineProperty(window, "__lisaPrototypeTestClock", {
      configurable: false,
      value: Object.freeze({
        advanceBy(milliseconds) {
          if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) {
            throw new Error("Тестовые часы принимают только неотрицательные целые миллисекунды");
          }
          const targetTime = state.now + milliseconds;
          for (let due = nextDueTimer(targetTime); due; due = nextDueTimer(targetTime)) {
            const [id, timer] = due;
            state.timers.delete(id);
            state.now = timer.dueAt;
            timer.callback(...timer.args);
          }
          state.now = targetTime;
          return Object.freeze({ now: state.now, pending: state.timers.size });
        },
      }),
    });
  });
}

async function advanceControlledClock(page, milliseconds) {
  return page.evaluate((duration) => {
    if (!window.__lisaPrototypeTestClock) {
      throw new Error("Браузер-независимые тестовые часы не установлены");
    }
    return window.__lisaPrototypeTestClock.advanceBy(duration);
  }, milliseconds);
}

function extractPortableArchive(targetRoot, archivePath) {
  const members = readStoredZip(fs.readFileSync(archivePath));
  for (const [relativePath, content] of members) {
    const targetPath = path.join(targetRoot, ...relativePath.split("/"));
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
  }
  return [...members.keys()];
}

test.beforeEach(async ({ context, page }, testInfo) => {
  const attemptedNetwork = [];
  const consoleErrors = [];
  const pageErrors = [];
  const captureToolWarnings = [];
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
    if (message.type() !== "error") return;
    if (
      testInfo.project.name === "webkit" &&
      message.text() === webkitCaptureToolWarning &&
      captureToolWarnings.length === 0
    ) {
      captureToolWarnings.push(message.text());
      return;
    }
    consoleErrors.push(message.text());
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
  page.__captureToolWarnings = captureToolWarnings;
});

test("raster-base-local-overlay: HTML не содержит ручную CSS-оболочку телефона или нарисованные CSS-часы", async ({ page }) => {
  const contracts = readRasterContracts();
  assertNoManualPhoneShellInSource();
  await openPrototypeScene(page, contracts.journey.initial_state_id);
  await expect(
    page.locator("main.phone, .phone-header, .phone-content, .phone-composer, .clock-face, .clock-hand"),
  ).toHaveCount(0);
});

test("raster-base-local-overlay: каждый из 20 активных экранов показывает только зарегистрированную PNG-основу и локальные заплаты", async ({ page }) => {
  const contracts = readRasterContracts();
  const sourceById = new Map(contracts.sourceCatalog.members.map((member) => [member.id, member]));
  const activeSourceClasses = new Set(["active-basis", "active-variant", "optional-branch"]);

  expect(contracts.visualBasis.rendering_pipeline).toBe("raster-base-local-overlay");
  for (const stateId of activeStateIds(contracts)) {
    const binding = bindingForState(contracts.visualBasis, stateId);
    const source = sourceById.get(binding.base_id);
    expect(source, `${stateId}: base_id отсутствует в source catalog`).toBeTruthy();
    expect(activeSourceClasses.has(source.classification)).toBe(true);
    await openPrototypeScene(page, stateId);
    await assertRegisteredRasterScene(page, binding);
    await assertSemanticSlots(page, binding);
    await expect(prototypeScene(page).locator("svg, canvas")).toHaveCount(0);
  }
});

test("raster-base-local-overlay: исходный экран 1.1 предоставляет реальное поле ИНН или названия поверх search-input-slot, а не через микрофон", async ({ page }) => {
  const contracts = readRasterContracts();
  const initialBinding = bindingForState(
    contracts.visualBasis,
    contracts.journey.initial_state_id,
  );
  const searchSlot = initialBinding.slots.find((slot) => slot.id === "search-input-slot");
  const microphoneSlot = initialBinding.slots.find(
    (slot) => slot.semantic_control_id === "client-answer-microphone-control",
  );

  expect(contracts.journey.initial_state_id).toBe("lisa-client-answer");
  expect(initialBinding.base_id).toBe("1.1");
  expect(searchSlot).toEqual(
    expect.objectContaining({
      id: "search-input-slot",
      semantic_control_id: "client-search-input",
      semantic_role: "input",
      rect: { x: 88, y: 1372, width: 305, height: 32 },
      visible_patch_path: null,
      visible_patch_sha256: null,
    }),
  );
  expect(microphoneSlot).toEqual(
    expect.objectContaining({
      semantic_control_id: "client-answer-microphone-control",
      semantic_role: "microphone",
    }),
  );

  await openPrototypeScene(page, contracts.journey.initial_state_id);
  const search = prototypeScene(page).getByRole("searchbox", {
    name: contracts.journey.copy.search_placeholder,
  });
  await expect(search).toHaveAttribute("type", "search");
  await expect(search).toHaveAttribute("data-slot-id", "search-input-slot");
  await expect(search).toHaveAttribute("data-semantic-control-id", "client-search-input");
  await expect(search).toHaveAttribute("data-action-id", "search-client");
  await expect(search).not.toHaveAttribute(
    "data-semantic-control-id",
    "client-answer-microphone-control",
  );
  await search.fill("7700000000");
  await search.press("Enter");
  await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-client-answer");
});

test("raster-base-local-overlay: один, несколько и ноль результатов сохраняют P1/P2-маршрут без раскрытия причины", async ({ page }) => {
  const contracts = readRasterContracts();
  const [single, multiple, noResult] = contracts.journey.client_search.cases;
  const initialStateId = contracts.journey.initial_state_id;

  await openPrototypeScene(page, initialStateId);
  let search = prototypeScene(page).getByRole("searchbox", {
    name: contracts.journey.copy.search_placeholder,
  });
  await search.fill(single.query);
  await search.press("Enter");
  await expect(prototypeScene(page)).toHaveAttribute("data-state-id", single.target_state_id);

  await openPrototypeScene(page, initialStateId);
  search = prototypeScene(page).getByRole("searchbox", {
    name: contracts.journey.copy.search_placeholder,
  });
  await search.fill(multiple.query);
  await search.press("Enter");
  await expect(prototypeScene(page)).toHaveAttribute("data-state-id", multiple.target_state_id);
  const selectAction = await activateSlotAction(
    page,
    contracts,
    multiple.target_state_id,
    "select-client",
    true,
  );
  await expect(prototypeScene(page)).toHaveAttribute("data-state-id", selectAction.target_state_id);

  await openPrototypeScene(page, initialStateId);
  search = prototypeScene(page).getByRole("searchbox", {
    name: contracts.journey.copy.search_placeholder,
  });
  await search.fill(noResult.query);
  await search.press("Enter");
  await expect(prototypeScene(page)).toHaveAttribute("data-state-id", noResult.target_state_id);
  await expect(prototypeScene(page)).not.toContainText(/недоступен|нет прав|не мой клиент|причина/iu);
  await expect(prototypeScene(page).locator("[data-client-id]")).toHaveCount(0);
});

test("raster-base-local-overlay: справка доступна только для my-клиента по данным договора, без отдельного not-my-контроля", async ({ page }) => {
  const contracts = readRasterContracts();
  const { client_search: clientSearch, invariants } = contracts.journey;
  const candidatesByRelationship = new Map(
    clientSearch.candidates.map((candidate) => [candidate.relationship, candidate]),
  );
  const myClient = candidatesByRelationship.get("my");
  const notMyClient = candidatesByRelationship.get("not-my");
  const multipleCase = clientSearch.cases.find((candidate) => candidate.id === "multiple-clients");
  const selectionAction = actionFor(contracts.journey, "select-client");
  const referenceAction = actionFor(contracts.journey, "show-preparation-reference");
  const selectionSlot = slotForInteraction(
    contracts.visualBasis,
    multipleCase?.target_state_id,
    "select-client",
  );
  const suggestionSlot = slotForInteraction(
    contracts.visualBasis,
    "lisa-client-answer",
    "show-preparation-reference",
  );

  expect(myClient, "Договор обязан явно пометить одного клиента как my").toBeTruthy();
  expect(notMyClient, "Договор обязан явно пометить одного клиента как not-my").toBeTruthy();
  expect(multipleCase, "Договор обязан задавать сценарий выбора нескольких клиентов").toBeTruthy();
  expect(multipleCase.candidate_ids).toEqual(expect.arrayContaining([myClient.id, notMyClient.id]));
  expect(referenceAction).toEqual(
    expect.objectContaining({
      availability: "my-client-only",
      not_my_client_visibility: "not-rendered",
    }),
  );
  expect(invariants).toEqual(
    expect.arrayContaining([
      "not-my-client-control-is-never-visible",
      "not-my-client-preparation-suggestion-is-not-rendered",
    ]),
  );
  expect(clientSearch.forbidden_control_ids).toContain("not-my-client");

  async function selectFromMultipleCandidates(candidate) {
    await openPrototypeScene(page, contracts.journey.initial_state_id);
    const search = prototypeScene(page).getByRole("searchbox", {
      name: contracts.journey.copy.search_placeholder,
    });
    await search.fill(multipleCase.query);
    await search.press("Enter");
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", multipleCase.target_state_id);

    const control = prototypeScene(page).locator(
      `[data-slot-id="${selectionSlot.id}"][data-semantic-control-id="${selectionSlot.semantic_control_id}"][data-action-id="select-client"][data-client-id="${candidate.id}"]`,
    );
    await expect(control).toHaveCount(1);
    await expect(control).toHaveAttribute("data-client-relationship", candidate.relationship);
    await expect(control).toHaveAccessibleName(new RegExp(candidate.display_name, "u"));
    await control.click();
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", selectionAction.target_state_id);
  }

  const suggestionControl = () =>
    prototypeScene(page).locator(
      `[data-slot-id="${suggestionSlot.id}"][data-semantic-control-id="${suggestionSlot.semantic_control_id}"][data-action-id="show-preparation-reference"]`,
    );
  const suggestionRaster = () =>
    prototypeScene(page).locator(`img[src="${expectedDemoAssetPath(suggestionSlot.visible_patch_path)}"]`);

  await selectFromMultipleCandidates(notMyClient);
  await expect(suggestionControl()).toHaveCount(0);
  await expect(suggestionRaster()).toHaveCount(0);
  for (const controlId of clientSearch.forbidden_control_ids) {
    await expect(
      prototypeScene(page).locator(
        `[data-semantic-control-id="${controlId}"], [data-control-id="${controlId}"], #${controlId}`,
      ),
    ).toHaveCount(0);
  }
  await expect(prototypeScene(page).getByRole("button", { name: /не мой клиент/iu })).toHaveCount(0);

  await selectFromMultipleCandidates(myClient);
  await expect(suggestionControl()).toHaveCount(1);
  await expect(suggestionRaster()).toHaveCount(1);
});

test("raster-base-local-overlay: semantic slots проводят выбор my-клиента через ответ и мастер 2.*–5.* к заказу", async ({ page }) => {
  const contracts = readRasterContracts();
  const multipleCase = contracts.journey.client_search.cases.find(
    (candidate) => candidate.id === "multiple-clients",
  );
  const myClient = contracts.journey.client_search.candidates.find(
    (candidate) => candidate.relationship === "my",
  );
  expect(multipleCase).toBeTruthy();
  expect(myClient).toBeTruthy();
  const selectionSlot = slotForInteraction(
    contracts.visualBasis,
    multipleCase.target_state_id,
    "select-client",
  );
  const directedRoute = [
    ["lisa-client-answer", "show-preparation-reference"],
    ["lisa-preparation-loading", "continue-preparation"],
    ["lisa-preparation-type", "choose-preparation-type"],
    ["lisa-preparation-topics", "open-topic-details"],
    ["lisa-preparation-topic-details", "add-custom-topic"],
    ["lisa-preparation-custom-topic", "confirm-custom-topic"],
    ["lisa-preparation-custom-topic-added", "cancel-topic"],
    ["lisa-preparation-topic-cancelled", "open-participants"],
    ["lisa-preparation-participants-empty", "add-participant"],
    ["lisa-preparation-participants", "expand-participants"],
    ["lisa-preparation-participants-expanded", "choose-holding-participants"],
    ["lisa-preparation-holding-participants", "gather-materials"],
    ["lisa-materials-gathering", "show-materials-summary"],
    ["lisa-materials-summary", "open-full-reference"],
    ["lisa-materials-full-reference", "open-presentation-order"],
  ];

  await openPrototypeScene(page, contracts.journey.initial_state_id);
  const search = prototypeScene(page).getByRole("searchbox", {
    name: contracts.journey.copy.search_placeholder,
  });
  await search.fill(multipleCase.query);
  await search.press("Enter");
  await expect(prototypeScene(page)).toHaveAttribute("data-state-id", multipleCase.target_state_id);
  const mySelectionControl = prototypeScene(page).locator(
    `[data-slot-id="${selectionSlot.id}"][data-semantic-control-id="${selectionSlot.semantic_control_id}"][data-action-id="select-client"][data-client-id="${myClient.id}"][data-client-relationship="my"]`,
  );
  await expect(mySelectionControl).toHaveCount(1);
  await mySelectionControl.click();
  await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-client-answer");

  for (const [stateId, actionId] of directedRoute) {
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", stateId);
    const action = await activateSlotAction(page, contracts, stateId, actionId);
    expect(action.target_state_id, `${actionId}: отсутствует направленный target_state_id`).toBeTruthy();
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", action.target_state_id);
  }
  await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-presentation-order");
});

test("raster-base-local-overlay: заказ через semantic slot показывает точные состояния и статусы на 600 и 8000 мс", async ({ page }) => {
  const contracts = readRasterContracts();
  await installControlledTimerSeam(page);

  for (const reducedMotion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion });
    await openPrototypeScene(page, "lisa-presentation-order");
    const order = await activateSlotAction(
      page,
      contracts,
      "lisa-presentation-order",
      "order-presentation",
    );
    expect(order.target_state_id).toBeNull();
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-presentation-order");
    await expect(
      prototypeScene(page).locator('[data-semantic-control-id="presentation-generating-status"]'),
    ).toHaveCount(0);

    await advanceControlledClock(page, 599);
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-presentation-order");
    await advanceControlledClock(page, 1);
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-presentation-generating");
    const generating = prototypeScene(page).locator(
      '[data-slot-id="visible-patch-generating"][data-semantic-control-id="presentation-generating-status"]',
    );
    await expect(generating).toHaveAttribute("role", "status");
    await expect(generating).toHaveText(contracts.journey.copy.generation_started);

    await advanceControlledClock(page, 6999);
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-presentation-generating");
    await advanceControlledClock(page, 1);
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-presentation-generating");
    await advanceControlledClock(page, 399);
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-presentation-generating");
    await advanceControlledClock(page, 1);
    await expect(prototypeScene(page)).toHaveAttribute("data-state-id", "lisa-presentation-sent");
    const sent = prototypeScene(page).locator(
      '[data-slot-id="visible-patch-sent"][data-semantic-control-id="presentation-sent-status"]',
    );
    await expect(sent).toHaveAttribute("role", "status");
    await expect(sent).toHaveText(contracts.journey.copy.presentation_sent);
  }
});

test("raster-base-local-overlay: P3/P4 не получают основу, semantic slot, внешнюю сеть, почту или файловую поверхность", async ({ page }) => {
  const contracts = readRasterContracts();
  const deferredSourceIds = contracts.sourceCatalog.members
    .filter((member) => member.classification === "deferred-q4")
    .map((member) => member.id);
  const activeBaseIds = new Set(contracts.visualBasis.state_bindings.map((binding) => binding.base_id));

  expect(deferredSourceIds).toEqual(["5.3", "5.6", "6.1", "6.2", "7.3"]);
  for (const sourceId of deferredSourceIds) {
    expect(activeBaseIds.has(sourceId), `${sourceId}: P3/P4 нельзя рендерить в активном MVP`).toBe(false);
  }
  for (const unregisteredStateId of [
    "lisa-presentation-preview",
    "lisa-presentation-viewer",
    "lisa-notifications-list-unread",
    "lisa-result-view-from-chat",
  ]) {
    const url = demoUrl();
    url.searchParams.set("state", unregisteredStateId);
    await page.goto(url.href, { waitUntil: "load" });
    await expect(prototypeScene(page)).toHaveAttribute(
      "data-state-id",
      contracts.journey.initial_state_id,
    );
  }
  await openPrototypeScene(page, contracts.journey.initial_state_id);
  await expect(
    prototypeScene(page).locator('a[href^="mailto:"], a[href*=".pdf" i], a[href*=".pptx" i]'),
  ).toHaveCount(0);
  expect(page.__attemptedNetwork).toEqual([]);
  expect(page.__consoleErrors).toEqual([]);
  expect(page.__pageErrors).toEqual([]);
});

test("raster-base-local-overlay: прямое file:// открытие проверяемого demo/index.html загружает base и patch без source/**", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit", "Safari-дефект воспроизводится и принимается в WebKit");
  const contracts = readRasterContracts();
  assertPortableRuntimeAssetsInDemo();
  await openPrototypeScene(
    page,
    contracts.journey.initial_state_id,
    path.join(packageRoot, "demo/index.html"),
  );
  expect(new URL(page.url()).protocol).toBe("file:");
  await assertRegisteredRasterScene(
    page,
    bindingForState(contracts.visualBasis, contracts.journey.initial_state_id),
  );
});

test("raster-base-local-overlay: автономный ZIP содержит ровно активные PNG в demo/assets и загружает их через file://", async ({ page }) => {
  const contracts = readRasterContracts();
  const archivePath = path.join(packageRoot, contracts.packageContract.archive.path);
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "Лиса растровый MVP "));
  const extractionRoot = path.join(temporaryRoot, "пакет презентации");
  try {
    const archiveMembers = extractPortableArchive(extractionRoot, archivePath);
    expect(archiveMembers).toEqual(contracts.packageContract.archive.members);
    expect(
      archiveMembers
        .filter(
          (member) => member.startsWith("demo/assets/bases/") || member.startsWith("demo/assets/patches/"),
        )
        .sort((left, right) => left.localeCompare(right, "en")),
    ).toEqual(expectedPortableRasterMembers(contracts.visualBasis));
    expect(archiveMembers.some((member) => member.startsWith("source/"))).toBe(false);
    expect(archiveMembers.some((member) => /\.xlsx$|\.svg$/u.test(member))).toBe(false);
    const copiedDemo = path.join(extractionRoot, "demo/index.html");
    for (const relativePath of ["demo/index.html", "demo/app.js", "demo/data.js", "demo/styles.css"]) {
      const source = fs.readFileSync(path.join(extractionRoot, relativePath), "utf8");
      expect(source).not.toMatch(/\.\.\//u);
      expect(source).not.toMatch(/source\/(?:bases|patches|fonts)\//u);
    }
    await openPrototypeScene(page, contracts.journey.initial_state_id, copiedDemo);
    expect(new URL(page.url()).protocol).toBe("file:");
    await assertRegisteredRasterScene(
      page,
      bindingForState(contracts.visualBasis, contracts.journey.initial_state_id),
    );
    const rawPaths = await prototypeScene(page).locator("[src], [href]").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("src") || node.getAttribute("href")),
    );
    for (const rawPath of rawPaths.filter(Boolean)) {
      expect(rawPath).not.toMatch(/^https?:|^file:\/\/\/Users\//u);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

for (const viewport of runtimeViewports) {
  test(`raster-base-local-overlay: ${viewport.id} сохраняет геометрию и доступность всех активных сцен`, async ({ page }) => {
    const contracts = readRasterContracts();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const stateId of activeStateIds(contracts)) {
      const binding = bindingForState(contracts.visualBasis, stateId);
      await openPrototypeScene(page, stateId);
      const geometry = await prototypeScene(page).evaluate((scene) => {
        const base = scene.querySelector("img");
        const sceneRect = scene.getBoundingClientRect();
        const baseRect = base?.getBoundingClientRect();
        const controls = [...scene.querySelectorAll("[data-slot-id]")].map((control) => {
          const rect = control.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          };
        });
        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          sceneWidth: sceneRect.width,
          base: baseRect && {
            left: baseRect.left,
            right: baseRect.right,
            top: baseRect.top,
            bottom: baseRect.bottom,
            width: baseRect.width,
            height: baseRect.height,
          },
          controls,
        };
      });
      expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
      expect(geometry.sceneWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
      expect(geometry.base).toBeTruthy();
      expect(Math.abs(geometry.base.width / geometry.base.height - binding.natural_dimensions.width / binding.natural_dimensions.height)).toBeLessThan(0.002);
      for (const control of geometry.controls) {
        expect(control.width).toBeGreaterThan(0);
        expect(control.height).toBeGreaterThan(0);
        expect(control.left).toBeGreaterThanOrEqual(geometry.base.left - 1);
        expect(control.right).toBeLessThanOrEqual(geometry.base.right + 1);
        expect(control.top).toBeGreaterThanOrEqual(geometry.base.top - 1);
        expect(control.bottom).toBeLessThanOrEqual(geometry.base.bottom + 1);
      }
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axe.violations).toEqual([]);
    }
  });
}

test.afterEach(async ({ page }) => {
  expect(page.__attemptedNetwork).toEqual([]);
  expect(page.__consoleErrors).toEqual([]);
  expect(page.__pageErrors).toEqual([]);
  expect(page.__captureToolWarnings.length).toBeLessThanOrEqual(1);
});
