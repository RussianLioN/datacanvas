import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";

import {
  __test as prototypeInternals,
  loadSevenScreenContracts,
  publishSevenScreenRuntime,
} from "../scripts/lib/presentation-link-lisa-seven-screen-prototype.mjs";

const root = process.cwd();
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const packageRoot = path.join(root, packagePath);
const demoRoot = path.join(packageRoot, "demo");
const zipPath = path.join(packageRoot, "derived/lisa-presentation-user-journey-demo.zip");

const expectedStates = Object.freeze([
  Object.freeze({
    id: "lisa-client-answer",
    sourceId: "1.1",
    caption: "Справка по клиенту: можно заказать презентацию",
    logicalDimensions: Object.freeze({ width: 521, height: 1542 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 4626 }),
    hasImmediateCta: true,
    scrollable: true,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-materials-summary",
    sourceId: "5.2",
    caption: "Краткие материалы: заказ доступен сразу",
    logicalDimensions: Object.freeze({ width: 521, height: 980 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 2940 }),
    hasImmediateCta: true,
    scrollable: false,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-materials-full-reference",
    sourceId: "5.4",
    caption: "Полная справка: прокрутите материалы или оформите заказ",
    logicalDimensions: Object.freeze({ width: 521, height: 5194 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 15582 }),
    hasImmediateCta: true,
    scrollable: true,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-presentation-order",
    sourceId: "7.1",
    caption: "Заказ презентации по подготовленным материалам",
    logicalDimensions: Object.freeze({ width: 521, height: 980 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 2940 }),
    hasImmediateCta: true,
    scrollable: false,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-presentation-generating",
    sourceId: "7.2",
    caption: "Презентация формируется",
    logicalDimensions: Object.freeze({ width: 521, height: 980 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 2940 }),
    hasImmediateCta: false,
    scrollable: false,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-presentation-sent",
    sourceId: "7.3",
    caption: "Презентация сформирована и отправлена",
    logicalDimensions: Object.freeze({ width: 521, height: 980 }),
    pixelDimensions: Object.freeze({ width: 1563, height: 2940 }),
    hasImmediateCta: false,
    scrollable: false,
    presentation: "phone",
  }),
  Object.freeze({
    id: "lisa-presentation-email",
    sourceId: "7.4",
    caption: "Письмо с версиями презентации в ODT и PDF",
    logicalDimensions: Object.freeze({ width: 1553, height: 1013 }),
    pixelDimensions: Object.freeze({ width: 1553, height: 1013 }),
    hasImmediateCta: false,
    scrollable: false,
    presentation: "desktop",
  }),
  Object.freeze({
    id: "lisa-presentation-slidedoc",
    sourceId: "szh-dense-slidedoc",
    caption: "Презентация: вариант SlideDoc",
    logicalDimensions: Object.freeze({ width: 960, height: 1620 }),
    pixelDimensions: Object.freeze({ width: 3840, height: 6480 }),
    hasImmediateCta: false,
    scrollable: true,
    presentation: "desktop",
    document: true,
    assetPath: "assets/szh-dense-slidedoc-4x.png",
  }),
  Object.freeze({
    id: "lisa-presentation-sber2025",
    sourceId: "szh-dense-sber2025",
    caption: "Презентация: вариант Sber 2025",
    logicalDimensions: Object.freeze({ width: 960, height: 1620 }),
    pixelDimensions: Object.freeze({ width: 3840, height: 6480 }),
    hasImmediateCta: false,
    scrollable: true,
    presentation: "desktop",
    document: true,
    assetPath: "assets/szh-dense-sber2025-4x.png",
  }),
  Object.freeze({
    id: "lisa-presentation-mag",
    sourceId: "szh-dense-mag",
    caption: "Презентация: вариант MAG",
    logicalDimensions: Object.freeze({ width: 960, height: 1620 }),
    pixelDimensions: Object.freeze({ width: 3840, height: 6480 }),
    hasImmediateCta: false,
    scrollable: true,
    presentation: "desktop",
    document: true,
    assetPath: "assets/szh-dense-mag-4x.png",
  }),
]);

const expectedStateIds = expectedStates.map((state) => state.id);
const expectedEmailState = expectedStates.find((state) => state.id === "lisa-presentation-email");
const expectedDocumentStates = expectedStates.filter((state) => state.document);
const expectedDocumentStateIds = expectedDocumentStates.map((state) => state.id);
const expectedDocumentSlideCount = 3;
const immediateCtaStateIds = expectedStates
  .filter((state) => state.hasImmediateCta)
  .map((state) => state.id);
const expectedPhoneStates = expectedStates.filter((state) => state.presentation === "phone");
const expectedPhoneStateIds = expectedPhoneStates.map((state) => state.id);

const expectedOrderLabel = "Сформировать презентацию";
const expectedPhoneLayerRoles = Object.freeze(["system_top", "scroll_content", "system_bottom"]);
const expectedPhoneLayerViewportRects = Object.freeze({
  system_top: Object.freeze({ x: 0, y: 0, width: 393, height: 53 }),
  scroll_content: Object.freeze({ x: 0, y: 53, width: 393, height: 765 }),
  system_bottom: Object.freeze({ x: 0, y: 818, width: 393, height: 34 }),
});
const expectedPhoneLayerSuffixes = Object.freeze({
  system_top: "status",
  scroll_content: "content",
  system_bottom: "home",
});
const expectedPhoneLayerSources = Object.freeze({
  "lisa-client-answer": Object.freeze({
    system_top: Object.freeze({ x: 64, y: 48, width: 393, height: 53 }),
    scroll_content: Object.freeze({ x: 64, y: 101, width: 393, height: 1327 }),
    system_bottom: Object.freeze({ x: 64, y: 1428, width: 393, height: 34 }),
  }),
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

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, relativePath), "utf8"));
}

function loadDemoData() {
  const source = fs.readFileSync(path.join(demoRoot, "data.js"), "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "demo/data.js" });
  assert.ok(context.window.LISA_PROTOTYPE_DATA, "demo/data.js должен объявить window.LISA_PROTOTYPE_DATA");
  return context.window.LISA_PROTOTYPE_DATA;
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(target) : [target];
  });
}

function toDemoRelative(filePath) {
  return path.relative(demoRoot, filePath).split(path.sep).join("/");
}

function pngDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  assert.ok(
    bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
    `${path.relative(root, filePath)} должен быть PNG`,
  );
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function unzipList(filePath) {
  const result = spawnSync("unzip", ["-Z1", filePath], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `не удалось прочитать ZIP: ${result.stderr || result.stdout}`);
  return result.stdout.split(/\r?\n/u).filter(Boolean);
}

function unzipRead(filePath, member) {
  const result = spawnSync("unzip", ["-p", filePath, member], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  assert.equal(result.status, 0, `не удалось прочитать ${member} из ZIP: ${result.stderr || result.stdout}`);
  return result.stdout;
}

function collectStrings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((item) => collectStrings(item));
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap((item) => collectStrings(item));
}

function snapshotDirectory(directory) {
  if (!fs.existsSync(directory)) return new Map();
  return new Map(listFiles(directory).map((filePath) => [
    path.relative(directory, filePath).split(path.sep).join("/"),
    fs.readFileSync(filePath),
  ]));
}

function assertDirectorySnapshot(directory, expected) {
  const actual = snapshotDirectory(directory);
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort());
  for (const [name, bytes] of expected) {
    assert.equal(actual.get(name)?.equals(bytes), true, `${name}: прежняя версия demo должна быть побайтно восстановлена`);
  }
}

function stateAsset(state) {
  return state.asset ?? state.base ?? state.raster;
}

function assetSrc(state) {
  return stateAsset(state)?.src ?? stateAsset(state)?.runtime_path;
}

function phoneLayerSrc(stateId, role) {
  return `assets/${stateId}-${expectedPhoneLayerSuffixes[role]}-3x.png`;
}

function expectedPhoneRasterLayers(stateId) {
  const sources = expectedPhoneLayerSources[stateId] ?? expectedDefaultPhoneLayerSources;
  return expectedPhoneLayerRoles.map((role) => {
    const sourceRect = sources[role];
    return {
      role,
      src: phoneLayerSrc(stateId, role),
      source_rect: sourceRect,
      viewport_rect: expectedPhoneLayerViewportRects[role],
      pixel_dimensions: {
        width: 1179,
        height: sourceRect.height * 3,
      },
    };
  });
}

function logicalDimensions(state) {
  if (state.presentation === "phone") return normalizeDimensions(state.logical_dimensions ?? state.asset?.logical_dimensions);
  return normalizeDimensions(state.logical_dimensions ?? stateAsset(state)?.logical_dimensions);
}

function pixelDimensions(state) {
  if (state.presentation === "phone") return normalizeDimensions(state.pixel_dimensions ?? state.asset?.pixel_dimensions);
  return normalizeDimensions(
    state.pixel_dimensions ?? stateAsset(state)?.pixel_dimensions ?? stateAsset(state)?.natural_dimensions,
  );
}

function normalizeDimensions(value) {
  if (!value) return value;
  return {
    width: Number(value.width),
    height: Number(value.height),
  };
}

function stateIds(states) {
  return Array.from(states, (state) => state.id);
}

function assertNoForbiddenRuntimeReferences(label, value) {
  assert.doesNotMatch(value, /(?:^|[^\w])\.\.(?:\/|\\)/u, `${label}: runtime не должен ссылаться через ..`);
  assert.doesNotMatch(value, /\b(?:source|editable-sources)\//u, `${label}: runtime не должен зависеть от source/** или editable-sources/**`);
  assert.doesNotMatch(value, /\.svg\b/iu, `${label}: runtime не должен подключать SVG`);
  assert.doesNotMatch(value, /\bhttps?:\/\//iu, `${label}: runtime не должен содержать сетевые URL`);
  assert.doesNotMatch(value, /\b(?:fetch|XMLHttpRequest|WebSocket)\b/u, `${label}: runtime не должен открывать сеть`);
  assert.doesNotMatch(value, /mailto:/iu, `${label}: runtime не должен открывать почтовые ссылки`);
}

test("активный договор и demo/data.js фиксируют ровно десять состояний в утверждённом порядке", () => {
  const registry = readJson("source/active-contracts.json");
  const journey = readJson("source/journey-contract.json");
  const visualBasis = readJson("source/visual-basis-contract.json");
  const projectionMap = readJson("derived/projection-map.json");
  const rasterManifest = readJson("derived/canonical-raster-manifest.json");
  const browserReport = readJson("evidence/browser-report.json");
  const acceptanceReport = readJson("evidence/acceptance-report.json");
  const data = loadDemoData();

  assert.deepEqual(
    { width: Number(data.device?.body_mm?.width), height: Number(data.device?.body_mm?.height) },
    { width: 78.1, height: 160.8 },
    "внешний мок должен использовать физические пропорции корпуса iPhone 12 Pro Max",
  );
  assert.deepEqual(
    { width: Number(data.device?.screen_px?.width), height: Number(data.device?.screen_px?.height) },
    { width: 428, height: 926 },
    "договор должен сохранять заданную рабочую область экрана",
  );

  assert.deepEqual(registry.active_state_ids, expectedStateIds, "active_state_ids должен быть единственным источником порядка десяти экранов");
  assert.deepEqual(journey.state_ids, expectedStateIds, "journey-contract/state_ids должен повторять активный порядок");
  assert.deepEqual(
    journey.states.map((state) => state.id),
    expectedStateIds,
    "journey-contract должен повторять порядок десяти экранов без старых состояний",
  );
  assert.deepEqual(
    stateIds(data.states),
    expectedStateIds,
    "demo/data.js должен отдавать ровно десять публичных data-state-id",
  );
  assert.deepEqual(
    visualBasis.states.map((state) => state.state_id),
    expectedStateIds,
    "visual-basis-contract должен описывать основы для тех же десяти состояний",
  );
  assert.deepEqual(projectionMap.state_ids, expectedStateIds, "карта проекций должна содержать только десять активных состояний");
  assert.deepEqual(rasterManifest.state_ids, expectedStateIds, "манифест растров должен содержать только десять активных состояний");
  assert.deepEqual(browserReport.active_state_ids, expectedStateIds, "браузерный отчёт должен описывать только активный маршрут");
  assert.deepEqual(acceptanceReport.active_state_ids, expectedStateIds, "отчёт приёмки должен описывать только активный маршрут");
  assert.deepEqual(
    data.state_ids ? Array.from(data.state_ids) : stateIds(data.states),
    expectedStateIds,
    "demo/data.js должен отдавать ровно десять публичных data-state-id",
  );
  assert.equal(data.initial_state_id ?? expectedStateIds[0], expectedStateIds[0], "начальное состояние должно быть первым в десятиэкранном порядке");
  assert.deepEqual(
    expectedStateIds.slice(expectedStateIds.indexOf("lisa-presentation-email") + 1),
    expectedDocumentStateIds,
    "после письма маршрут должен последовательно открыть три документа",
  );

  for (const expected of expectedStates) {
    const state = data.states.find((candidate) => candidate.id === expected.id);
    const journeyState = journey.states.find((candidate) => candidate.id === expected.id);
    const visualState = visualBasis.states.find((candidate) => candidate.state_id === expected.id);
    assert.ok(state, `${expected.id}: состояние отсутствует в demo/data.js`);
    if (expected.sourceId) {
      assert.equal(journeyState?.source_id, expected.sourceId, `${expected.id}: неверный исходный экран в договоре пути`);
      assert.equal(state.source_id ?? stateAsset(state)?.id, expected.sourceId, `${expected.id}: неверный исходный экран`);
    }
    if (expected.caption) {
      assert.equal(journeyState?.caption, expected.caption, `${expected.id}: неточная русская подпись в договоре пути`);
      assert.equal(state.caption, expected.caption, `${expected.id}: неточная русская подпись`);
    }
    assert.deepEqual(
      logicalDimensions(state),
      expected.logicalDimensions,
      `${expected.id}: логические размеры должны совпадать с утверждённым источником`,
    );
    if (expected.presentation === "desktop") {
      assert.deepEqual(
        pixelDimensions(state),
        expected.pixelDimensions,
        `${expected.id}: натуральные размеры PNG должны совпадать с опубликованным asset`,
      );
    }
    assert.deepEqual(visualState?.source?.logical_dimensions, expected.logicalDimensions);
    if (expected.presentation === "desktop") {
      assert.deepEqual(
        visualState?.raster?.pixel_dimensions,
        expected.pixelDimensions,
        `${expected.id}: договор визуальной основы должен фиксировать натуральные размеры почтовой сцены`,
      );
      assert.match(visualState?.raster?.runtime_path ?? "", /^demo\/assets\/[a-z0-9/-]+\.png$/u);
    }
    if (expected.document) {
      assert.equal(assetSrc(state), expected.assetPath, `${expected.id}: документ должен грузиться из локального demo/assets PNG`);
      assert.equal(
        expected.pixelDimensions.height / 3,
        2160,
        `${expected.id}: документный PNG должен содержать три страницы высотой 2160 px`,
      );
      assert.equal(
        expected.logicalDimensions.height / 540,
        expectedDocumentSlideCount,
        `${expected.id}: документ должен вычисляться как три слайда по высоте окна 540 CSS px`,
      );
    }
    assert.equal(Boolean(state.scrollable), expected.scrollable, `${expected.id}: неверный признак внутренней прокрутки`);
    assert.equal(state.presentation, expected.presentation, `${expected.id}: неверный тип представления`);
  }
});

test("шаблон панели содержит отдельные кнопки постраничной навигации презентаций", () => {
  const templateRoot = path.join(root, "scripts/templates/presentation-link-lisa-seven-screen");
  const indexSource = fs.readFileSync(path.join(templateRoot, "index.html"), "utf8");
  const appSource = fs.readFileSync(path.join(templateRoot, "app.js"), "utf8");
  const styleSource = fs.readFileSync(path.join(templateRoot, "styles.css"), "utf8");

  assert.match(indexSource, /data-testid="previous-slide"/u, "в service-panel нужна кнопка previous-slide");
  assert.match(indexSource, /data-testid="next-slide"/u, "в service-panel нужна кнопка next-slide");
  assert.match(indexSource, /aria-label="Предыдущий слайд"/u, "previous-slide должен иметь русскую подпись доступности");
  assert.match(indexSource, /aria-label="Следующий слайд"/u, "next-slide должен иметь русскую подпись доступности");
  assert.match(indexSource, />↑</u, "previous-slide должен показывать знак ↑");
  assert.match(indexSource, />↓</u, "next-slide должен показывать знак ↓");
  assert.match(appSource, /ArrowUp/u, "runtime должен обрабатывать ArrowUp отдельно от перехода между состояниями");
  assert.match(appSource, /ArrowDown/u, "runtime должен обрабатывать ArrowDown отдельно от перехода между состояниями");
  assert.match(appSource, /behavior:\s*prefersReducedMotion\(\)\s*\?\s*"auto"\s*:\s*"smooth"/u, "обычный режим должен использовать плавную прокрутку, а reduce — мгновенную");
  assert.match(styleSource, /min-height:\s*2\.75rem/u, "кнопки в панели должны сохранять область нажатия не меньше 44 CSS px");
});

test("договор кадра передаёт радиус исходного корпуса в runtime-данные", () => {
  const frameContract = readJson("source/frame-contract.json");
  assert.equal(
    frameContract.device?.source_body_corner_radius,
    32,
    "frame-contract должен фиксировать радиус исходного корпуса 32 px",
  );

  const contracts = loadSevenScreenContracts(root);
  const runtimeSource = prototypeInternals.renderRuntimeData(contracts).toString("utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(runtimeSource, context, { filename: "runtime-data.js" });
  assert.equal(
    context.window.LISA_PROTOTYPE_DATA.device?.source_body_corner_radius,
    32,
    "renderRuntimeData должен передавать радиус исходного корпуса в runtime device",
  );
});

test("проверка переносимости отвергает непереносимые и исполняемые адреса", () => {
  const forbiddenSamples = [
    '<img src="file:///Users/example/secret.png">',
    '<img src="data:image/png;base64,AAAA">',
    '<a href="javascript:alert(1)">',
    '<a href="mailto:user@example.test">',
    '<img src="/Users/example/secret.png">',
    '<img src="C:\\Users\\example\\secret.png">',
    '<img src="//example.test/asset.png">',
    'background-image: url(/private/tmp/asset.png)',
  ];
  for (const sample of forbiddenSamples) {
    assert.ok(
      prototypeInternals.forbiddenRuntimeReferences(Buffer.from(sample), "fixture.html").length > 0,
      `должен быть отвергнут адрес: ${sample}`,
    );
  }
  assert.deepEqual(
    prototypeInternals.forbiddenRuntimeReferences(Buffer.from('<img src="assets/screen.png">'), "fixture.html"),
    [],
  );
});

test("действие order-presentation доступно с четырёх экранов и ведёт сразу к подготовке", () => {
  const data = loadDemoData();
  assert.equal(
    data.order_target_state_id,
    "lisa-presentation-generating",
    "order-presentation должен вести сразу к состоянию подготовки",
  );

  const statesById = new Map(data.states.map((state) => [state.id, state]));
  for (const stateId of immediateCtaStateIds) {
    const state = statesById.get(stateId);
    assert.ok(state?.action_ids?.includes("order-presentation"), `${stateId}: CTA заказа должен быть доступен сразу`);
  }
});

test("шесть телефонных состояний описаны тремя закреплёнными asset.layers без одиночного asset.src", () => {
  const data = loadDemoData();
  const statesById = new Map(data.states.map((state) => [state.id, state]));

  for (const stateId of expectedPhoneStateIds) {
    const state = statesById.get(stateId);
    assert.ok(state, `${stateId}: телефонное состояние отсутствует`);
    assert.equal(
      state.asset?.src,
      undefined,
      `${stateId}: одиночный телефонный asset.src больше не допускается`,
    );
    assert.ok(Array.isArray(state.asset?.layers), `${stateId}: должен быть массив state.asset.layers`);
    assert.deepEqual(
      Array.from(state.asset.layers, (layer) => layer.role),
      expectedPhoneLayerRoles,
      `${stateId}: порядок ролей слоёв должен быть system_top, scroll_content, system_bottom`,
    );

    for (const expectedLayer of expectedPhoneRasterLayers(stateId)) {
      const actualLayer = state.asset.layers.find((layer) => layer.role === expectedLayer.role);
      assert.ok(actualLayer, `${stateId}: слой ${expectedLayer.role} отсутствует`);
      assert.equal(actualLayer.src, expectedLayer.src, `${stateId}: неверный путь слоя ${expectedLayer.role}`);
      assert.deepEqual(
        { ...actualLayer.viewport_rect },
        expectedLayer.viewport_rect,
        `${stateId}: неверная геометрия viewport слоя ${expectedLayer.role}`,
      );
      assert.deepEqual(
        { ...actualLayer.source_rect },
        expectedLayer.source_rect,
        `${stateId}: неверная исходная область слоя ${expectedLayer.role}`,
      );
      assert.deepEqual(
        { ...actualLayer.pixel_dimensions },
        expectedLayer.pixel_dimensions,
        `${stateId}: слой ${expectedLayer.role} должен быть сохранён в плотности 3x`,
      );
    }
  }
});

test("runtime-файлы используют только локальные demo/assets и не содержат старых идентификаторов", () => {
  const runtimeFiles = ["index.html", "app.js", "data.js", "styles.css"];
  const joinedRuntime = runtimeFiles
    .map((fileName) => {
      const source = fs.readFileSync(path.join(demoRoot, fileName), "utf8");
      assertNoForbiddenRuntimeReferences(`demo/${fileName}`, source);
      return source;
    })
    .join("\n");

  assert.match(joinedRuntime, /assets\//u, "runtime должен подключать опубликованные demo/assets/**");
  for (const fragment of forbiddenLegacyStateFragments) {
    assert.doesNotMatch(
      joinedRuntime,
      new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
      `runtime не должен содержать старый state id или поверхность: ${fragment}`,
    );
  }

  const data = loadDemoData();
  for (const value of collectStrings(data)) {
    if (value.startsWith("assets/")) continue;
    assertNoForbiddenRuntimeReferences(`demo/data.js значение ${value}`, value);
  }
});

test("demo/assets содержит 18 телефонных сегментов, почтовую PNG-сцену и три документных PNG", () => {
  const assetRoot = path.join(demoRoot, "assets");
  const assetPaths = listFiles(assetRoot).map(toDemoRelative).sort((left, right) => left.localeCompare(right, "en"));
  const expectedPhoneAssetPaths = expectedPhoneStateIds
    .flatMap((stateId) => expectedPhoneRasterLayers(stateId).map((layer) => layer.src))
    .sort((left, right) => left.localeCompare(right, "en"));
  const expectedDocumentAssetPaths = expectedDocumentStates
    .map((state) => state.assetPath)
    .sort((left, right) => left.localeCompare(right, "en"));
  const forbiddenFullPhoneAssetPaths = expectedPhoneStateIds.map((stateId) => `assets/${stateId}-3x.png`);
  const expectedEmailAssetPath = "assets/lisa-presentation-email.png";

  assert.equal(assetPaths.length, 22, "в runtime должно быть ровно 18 телефонных сегментов, один почтовый PNG и три документных PNG");
  assert.ok(assetPaths.every((assetPath) => /^assets\/[a-z0-9/-]+\.png$/u.test(assetPath)), "assets должны быть PNG внутри demo/assets/**");
  assert.deepEqual(
    assetPaths.filter((assetPath) => assetPath !== expectedEmailAssetPath && !expectedDocumentAssetPaths.includes(assetPath)),
    expectedPhoneAssetPaths,
    "телефонные PNG должны быть только assets/lisa-*-status-3x.png, assets/lisa-*-content-3x.png и assets/lisa-*-home-3x.png",
  );
  assert.deepEqual(
    assetPaths.filter((assetPath) => expectedDocumentAssetPaths.includes(assetPath)),
    expectedDocumentAssetPaths,
    "три документных состояния должны использовать только локальные assets/*.png",
  );
  assert.ok(
    !assetPaths.some((assetPath) => forbiddenFullPhoneAssetPaths.includes(assetPath)),
    "полные телефонные PNG больше не должны попадать в runtime",
  );

  const data = loadDemoData();
  const stateAssetPaths = data.states.flatMap((state) =>
    state.presentation === "phone" ? (state.asset?.layers ?? []).map((layer) => layer.src) : [assetSrc(state)],
  );
  assert.deepEqual(
    [...new Set(stateAssetPaths)].sort((left, right) => left.localeCompare(right, "en")),
    assetPaths,
    "каждый опубликованный PNG должен принадлежать телефонному слою или почтовой сцене",
  );

  for (const stateId of expectedPhoneStateIds) {
    for (const expectedLayer of expectedPhoneRasterLayers(stateId)) {
      assert.deepEqual(
        pngDimensions(path.join(demoRoot, expectedLayer.src)),
        expectedLayer.pixel_dimensions,
        `${stateId}: PNG слоя ${expectedLayer.role} должен иметь размеры 3x`,
      );
    }
  }

  const emailState = data.states.find((state) => state.id === "lisa-presentation-email");
  assert.equal(assetSrc(emailState), expectedEmailAssetPath, "почтовая сцена должна оставаться отдельной desktop PNG");
  assert.deepEqual(
    pngDimensions(path.join(demoRoot, expectedEmailAssetPath)),
    expectedEmailState.pixelDimensions,
    "почтовый PNG должен сохранять натуральный размер desktop-сцены",
  );

  for (const expected of expectedDocumentStates) {
    assert.deepEqual(
      pngDimensions(path.join(demoRoot, expected.assetPath)),
      expected.pixelDimensions,
      `${expected.id}: документный PNG должен иметь размеры 3840x6480`,
    );
  }
});

test("ZIP минимален, содержит manifest, 18 телефонных сегментов, почту и три документа без PDF и source/**", () => {
  const members = unzipList(zipPath);
  const assetMembers = members.filter((member) => member.startsWith("assets/")).sort((left, right) => left.localeCompare(right, "en"));
  const forbiddenFullPhoneAssetPaths = expectedPhoneStateIds.map((stateId) => `assets/${stateId}-3x.png`);
  const expectedDocumentAssetPaths = expectedDocumentStates
    .map((state) => state.assetPath)
    .sort((left, right) => left.localeCompare(right, "en"));
  const expectedMembers = [
    "README.md",
    "manifest.json",
    "index.html",
    "app.js",
    "data.js",
    "styles.css",
    ...assetMembers,
  ];

  assert.deepEqual(
    [...members].sort((left, right) => left.localeCompare(right, "en")),
    [...expectedMembers].sort((left, right) => left.localeCompare(right, "en")),
    "ZIP должен содержать только минимальный автономный runtime, телефонные сегменты, почтовый PNG и три документа",
  );
  assert.equal(members.length, 28, "ZIP должен содержать ровно 28 файлов");
  assert.equal(assetMembers.length, 22, "ZIP должен содержать ровно 18 телефонных сегментов, один почтовый PNG и три документа");
  assert.ok(assetMembers.every((member) => /^assets\/[a-z0-9/-]+\.png$/u.test(member)));
  assert.deepEqual(
    assetMembers.filter((member) => expectedDocumentAssetPaths.includes(member)),
    expectedDocumentAssetPaths,
    "ZIP должен содержать три новых документных PNG",
  );
  assert.ok(
    !assetMembers.some((member) => forbiddenFullPhoneAssetPaths.includes(member)),
    "полные телефонные PNG больше не должны попадать в ZIP",
  );
  assert.ok(members.every((member) => !member.startsWith("source/")), "ZIP не должен публиковать source/**");
  assert.ok(members.every((member) => !/\.pdf$/iu.test(member)), "ZIP не должен содержать PDF-файлы");
  assert.ok(
    members.every((member) => !path.isAbsolute(member) && !/^[A-Za-z]:[\\/]/u.test(member)),
    "ZIP не должен содержать абсолютные пути",
  );

  const manifestSource = unzipRead(zipPath, "manifest.json");
  assertNoForbiddenRuntimeReferences("ZIP manifest.json", manifestSource);
  const manifest = JSON.parse(manifestSource);
  const manifestStrings = collectStrings(manifest);
  const manifestAssets = [...new Set(manifestStrings.filter((value) => value.startsWith("assets/")))]
    .sort((left, right) => left.localeCompare(right, "en"));

  assert.deepEqual(manifestAssets, assetMembers, "manifest должен перечислять тот же набор телефонных сегментов и почтовый PNG");
  assert.deepEqual(
    manifest.active_state_ids ?? manifest.states?.map((state) => state.id),
    expectedStateIds,
    "manifest должен фиксировать порядок десяти состояний",
  );
});

test("публикация demo откатывает весь комплект при сбое активации кандидата", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-seven-screen-runtime-"));
  const temporaryDemo = path.join(temporaryRoot, packagePath, "demo");
  fs.mkdirSync(path.join(temporaryDemo, "assets"), { recursive: true });
  for (const name of ["index.html", "app.js", "data.js", "styles.css"]) {
    fs.writeFileSync(path.join(temporaryDemo, name), `previous:${name}`);
  }
  fs.writeFileSync(path.join(temporaryDemo, "assets", "previous.png"), Buffer.from("previous-png"));
  const before = snapshotDirectory(temporaryDemo);
  const built = {
    runtimeEntries: [
      { name: "index.html", content: Buffer.from("candidate:index") },
      { name: "app.js", content: Buffer.from("candidate:app") },
      { name: "data.js", content: Buffer.from("candidate:data") },
      { name: "styles.css", content: Buffer.from("candidate:styles") },
      { name: "assets/candidate.png", content: Buffer.from("candidate-png") },
    ],
  };

  assert.throws(
    () => prototypeInternals.withRuntimePublishRenameHook(({ phase }) => {
      if (phase === "activate") throw new Error("контрольный сбой активации demo");
    }, () => publishSevenScreenRuntime(temporaryRoot, built)),
    /контрольный сбой активации demo/u,
  );

  assertDirectorySnapshot(temporaryDemo, before);
  const packageDirectory = path.dirname(temporaryDemo);
  assert.deepEqual(
    fs.readdirSync(packageDirectory).filter((name) => /^\.demo-(?:candidate|backup)-/u.test(name)),
    [],
    "после отката не должны оставаться временные каталоги публикации",
  );
});
