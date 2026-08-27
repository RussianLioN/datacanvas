import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const sourceRoot = `${packagePath}/source`;
const phoneLayerRoles = Object.freeze(["system_top", "scroll_content", "system_bottom"]);
const viewportRects = Object.freeze({
  system_top: Object.freeze({ x: 0, y: 0, width: 393, height: 53 }),
  scroll_content: Object.freeze({ x: 0, y: 53, width: 393, height: 765 }),
  system_bottom: Object.freeze({ x: 0, y: 818, width: 393, height: 34 }),
});

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  const filePath = absolute(relativePath);
  assert.ok(fs.existsSync(filePath), `Отсутствует обязательный договор: ${relativePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function sha256File(relativePath) {
  return createHash("sha256").update(fs.readFileSync(absolute(relativePath))).digest("hex");
}

function assertSha256(value, label) {
  assert.match(value, /^[a-f0-9]{64}$/u, `${label}: нужен SHA-256`);
}

function assertDimensions(value, label) {
  assert.ok(value && Number.isInteger(value.width) && value.width > 0, `${label}: неверная ширина`);
  assert.ok(Number.isInteger(value.height) && value.height > 0, `${label}: неверная высота`);
}

function assertRectInside(rect, dimensions, label) {
  assert.ok(rect && typeof rect === "object" && !Array.isArray(rect), `${label}: отсутствует прямоугольник`);
  for (const key of ["x", "y", "width", "height"]) {
    assert.ok(Number.isInteger(rect[key]), `${label}: ${key} должен быть целым числом`);
  }
  assert.ok(rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0, `${label}: неверная геометрия`);
  assert.ok(rect.x + rect.width <= dimensions.width, `${label}: выход за ширину`);
  assert.ok(rect.y + rect.height <= dimensions.height, `${label}: выход за высоту`);
}

function assertPackagePath(value, prefix, label) {
  assert.equal(typeof value, "string", `${label}: путь должен быть строкой`);
  assert.equal(path.isAbsolute(value), false, `${label}: абсолютный путь запрещён`);
  assert.ok(value.startsWith(prefix), `${label}: ожидается префикс ${prefix}`);
  assert.doesNotMatch(value, /(?:^|\/)\.\.(?:\/|$)|\\|file:\/\/|\/Users\//u, `${label}: небезопасный путь`);
}

function readPngDimensions(relativePath) {
  const bytes = fs.readFileSync(absolute(relativePath));
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${relativePath}: нужен PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("активный реестр является единым источником тринадцати состояний и договоров", () => {
  const registry = readJson(`${sourceRoot}/active-contracts.json`);
  const journey = readJson(`${sourceRoot}/journey-contract.json`);
  const frame = readJson(`${sourceRoot}/frame-contract.json`);
  const visual = readJson(`${sourceRoot}/visual-basis-contract.json`);
  const catalog = readJson(`${sourceRoot}/source-render-catalog.json`);

  const stateIds = journey.states.map((state) => state.id);
  assert.deepEqual(registry.active_state_ids, stateIds);
  assert.deepEqual(journey.state_ids, stateIds);
  assert.deepEqual(frame.frames.map((item) => item.state_id), stateIds);
  assert.deepEqual(visual.states.map((item) => item.state_id), stateIds);
  assert.deepEqual(catalog.sources.map((item) => item.state_id), stateIds);
  assert.equal(new Set(stateIds).size, 13);

  const descriptors = new Map(registry.active_contracts.map((item) => [item.id, item]));
  assert.deepEqual(descriptors.get("source-render-catalog"), {
    id: "source-render-catalog",
    path: "source/source-render-catalog.json",
    schema: "source/schemas/source-render-catalog.schema.json",
  });
  assert.deepEqual(descriptors.get("visual-basis"), {
    id: "visual-basis",
    path: "source/visual-basis-contract.json",
    schema: "source/schemas/visual-basis-contract.schema.json",
  });
});

test("каталог происхождения содержит десять исходных и три самостоятельных SVG-варианта статусов", () => {
  const catalog = readJson(`${sourceRoot}/source-render-catalog.json`);
  assert.deepEqual(catalog.active_source_ids, catalog.sources.map((item) => item.id));
  assert.equal(catalog.sources.length, 13);

  for (const source of catalog.sources) {
    assert.ok(["active-basis", "active-status-variant"].includes(source.classification), `${source.id}: неверная классификация`);
    assertPackagePath(source.path, "editable-sources/", `${source.id}: источник`);
    assertSha256(source.sha256, `${source.id}: источник`);
    assertDimensions(source.logical_dimensions, `${source.id}: источник`);
    const relativePath = `${packagePath}/${source.path}`;
    assert.ok(fs.existsSync(absolute(relativePath)), `${source.id}: исходный файл отсутствует`);
    assert.equal(sha256File(relativePath), source.sha256, `${source.id}: SHA-256 источника изменился`);
  }
  const statusVariants = catalog.sources.filter((source) => source.classification === "active-status-variant");
  assert.deepEqual(statusVariants.map((source) => source.id), [
    "status-order-not-accepted",
    "status-delivery-delayed",
    "status-delivery-partial",
  ]);
});

test("девять телефонных состояний используют ровно три проверенных PNG-слоя", () => {
  const visual = readJson(`${sourceRoot}/visual-basis-contract.json`);
  const phoneStates = visual.states.filter((state) => Array.isArray(state.raster_layers));
  assert.equal(phoneStates.length, 9);

  for (const state of phoneStates) {
    assert.equal("raster" in state, false, `${state.state_id}: одиночный raster запрещён`);
    assert.deepEqual(state.raster_layers.map((layer) => layer.role), phoneLayerRoles);
    for (const layer of state.raster_layers) {
      assertPackagePath(layer.source_path, "source/bases/", `${state.state_id}/${layer.role}: основа`);
      assertPackagePath(layer.runtime_path, "demo/assets/", `${state.state_id}/${layer.role}: runtime`);
      assertSha256(layer.sha256, `${state.state_id}/${layer.role}: PNG`);
      assert.equal(layer.scale, 3, `${state.state_id}/${layer.role}: нужен масштаб 3`);
      assertDimensions(layer.pixel_dimensions, `${state.state_id}/${layer.role}: PNG`);
      const sourcePath = `${packagePath}/${layer.source_path}`;
      assert.ok(fs.existsSync(absolute(sourcePath)), `${state.state_id}/${layer.role}: PNG отсутствует`);
      assert.equal(sha256File(sourcePath), layer.sha256, `${state.state_id}/${layer.role}: SHA-256 не совпадает`);
      assert.deepEqual(readPngDimensions(sourcePath), layer.pixel_dimensions);
    }
  }

  const email = visual.states.find((state) => state.state_id === "lisa-presentation-email");
  assert.ok(email?.raster, "почта должна иметь одиночный PNG");
  assert.equal("raster_layers" in email, false, "почта не должна иметь телефонные слои");

  const documents = visual.states.filter((state) => [
    "lisa-presentation-slidedoc",
    "lisa-presentation-sber2025",
    "lisa-presentation-mag",
  ].includes(state.state_id));
  assert.equal(documents.length, 3, "после почты должны быть три растровых документа");
  for (const document of documents) {
    assert.equal("raster_layers" in document, false, `${document.state_id}: документ не должен иметь телефонные слои`);
    assert.equal(document.raster?.scale, 4, `${document.state_id}: документ должен иметь плотность 4x`);
    assert.deepEqual(document.source?.logical_dimensions, { width: 960, height: 1620 });
    assert.deepEqual(document.raster?.pixel_dimensions, { width: 3840, height: 6480 });
    assertPackagePath(document.raster?.source_path, "editable-sources/", `${document.state_id}: основа`);
    assertPackagePath(document.raster?.runtime_path, "demo/assets/", `${document.state_id}: runtime`);
    const sourcePath = `${packagePath}/${document.raster.source_path}`;
    assert.equal(sha256File(sourcePath), document.raster.sha256, `${document.state_id}: SHA-256 не совпадает`);
    assert.deepEqual(readPngDimensions(sourcePath), document.raster.pixel_dimensions);
  }
});

test("договор кадров непрерывно собирает экран 393x852 и оставляет прокрутку только середине", () => {
  const frame = readJson(`${sourceRoot}/frame-contract.json`);
  const visual = readJson(`${sourceRoot}/visual-basis-contract.json`);
  const visualById = new Map(visual.states.map((state) => [state.state_id, state]));

  for (const item of frame.frames.filter((candidate) => candidate.presentation === "phone")) {
    const visualState = visualById.get(item.state_id);
    assert.deepEqual(item.viewport, { width: 393, height: 852 });
    assert.deepEqual(Object.keys(item.regions), phoneLayerRoles);
    for (const role of phoneLayerRoles) {
      const region = item.regions[role];
      assert.deepEqual(region.viewport_rect, viewportRects[role], `${item.state_id}/${role}: неверный viewport`);
      assertRectInside(region.source_rect, visualState.source.logical_dimensions, `${item.state_id}/${role}: источник`);
      const layer = visualState.raster_layers.find((candidate) => candidate.role === role);
      assert.deepEqual(layer.pixel_dimensions, {
        width: region.source_rect.width * 3,
        height: region.source_rect.height * 3,
      });
    }

    if (visualState.cta_rect) {
      const middle = item.regions.scroll_content.source_rect;
      const cta = visualState.cta_rect;
      assert.ok(cta.x >= middle.x && cta.x + cta.width <= middle.x + middle.width, `${item.state_id}: CTA выходит по ширине`);
      assert.ok(cta.y >= middle.y && cta.y + cta.height <= middle.y + middle.height, `${item.state_id}: CTA выходит по высоте`);
    }
  }

  assert.deepEqual(
    frame.frames.filter((item) => item.scrollable).map((item) => item.state_id),
    [
      "lisa-materials-full-reference",
      "lisa-presentation-slidedoc",
      "lisa-presentation-sber2025",
      "lisa-presentation-mag",
    ],
  );
});

test("человекочитаемые договоры фиксируют слои, неподвижную систему и запрет CSS-рамки", () => {
  const documents = [
    `${packagePath}/README.md`,
    `${packagePath}/user-journey.md`,
    `${packagePath}/donor-options.md`,
  ].map(readText).join("\n");

  assert.match(documents, /тр[её]х[^\n]*PNG|три\s+растровые\s+области/iu);
  assert.match(documents, /системн(?:ая|ые)[^\n]*(?:неподвиж|53)/iu);
  assert.match(documents, /домашн(?:ий|его)\s+индикатор/iu);
  assert.match(documents, /без\s+CSS-рамки|без\s+нарисованной\s+рамки/iu);
  assert.match(documents, /27\s+телефонных\s+PNG-сегмент/iu);
});

test("экран 5.2 становится источником первого активного состояния", () => {
  const journey = readJson(`${sourceRoot}/journey-contract.json`);
  const catalog = readJson(`${sourceRoot}/source-render-catalog.json`);
  const initial = catalog.sources.find((source) => source.id === "5.2");
  assert.equal(journey.initial_state_id, "lisa-materials-summary");
  assert.equal(initial?.state_id, journey.initial_state_id);
  assert.equal(initial?.classification, "active-basis");
});
