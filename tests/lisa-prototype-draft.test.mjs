import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const draftRoot = `${packagePath}/candidate-evidence/prototype-draft`;

function readPrototypeData(filePath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: filePath });
  return context.window.LISA_PROTOTYPE_DATA;
}

test("черновой прототип сохраняет оболочку и навигацию действующего прототипа при замене только кадров", () => {
  const manifestPath = path.join(root, draftRoot, "manifest.json");
  const htmlPath = path.join(root, draftRoot, "index.html");
  const appPath = path.join(root, draftRoot, "app.js");
  const dataPath = path.join(root, draftRoot, "data.js");
  const stylesPath = path.join(root, draftRoot, "styles.css");
  const activeDemoRoot = path.join(root, packagePath, "demo");
  assert.equal(fs.existsSync(manifestPath), true, "нужен манифест изолированного чернового прототипа");
  assert.equal(fs.existsSync(htmlPath), true, "нужна открываемая страница чернового прототипа");
  assert.equal(fs.existsSync(appPath), true, "нужен сценарий прежней оболочки прототипа");
  assert.equal(fs.existsSync(dataPath), true, "нужны данные заменённых кадров");
  assert.equal(fs.existsSync(stylesPath), true, "нужны стили прежней оболочки прототипа");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.$schema, "../../source/schemas/lisa-prototype-draft-manifest.schema.json");
  assert.equal(manifest.version, "1.4.0");
  assert.equal(manifest.status, "draft_prototype_accepted_for_documentation_cascade");
  assert.deepEqual(manifest.owner_acceptance, {
    accepted_at: "2026-08-24T00:00:00Z",
    scope: "isolated_draft_only",
    active_release_switch_allowed: false,
    next_gate: "documentation_cascade_then_explicit_final_owner_approval",
  });
  assert.equal(manifest.rendering_mode, "isolated_current_prototype_copy_with_frame_asset_substitution");
  assert.deepEqual(manifest.shell_parity, {
    index_html_source: "demo/index.html",
    app_js_source: "demo/app.js",
    app_js_derivation: "demo_app_js_plus_data_driven_initial_phone_scroll",
    styles_css_source: "demo/styles.css",
    navigation_model: "previous_prototype_state_and_document_navigation",
  });
  assert.equal(manifest.active_release_mutation_prohibited, true);
  assert.equal(manifest.raw_pdf_included, false);
  assert.deepEqual(manifest.candidate_runtime_extension, {
    id: "data_driven_initial_phone_scroll",
    target_file: "app.js",
    state_property: "initial_scroll_position",
    allowed_values: ["top", "bottom"],
    bottom_frame_ids: [
      "lisa-presentation-generating",
      "lisa-presentation-sent",
      "lisa-order-not-accepted",
      "lisa-delivery-delayed",
      "lisa-delivery-partial",
    ],
    effect: "standard_phone_scroller_initial_position_only",
  });
  assert.deepEqual(manifest.scale_parity, {
    phone_layer_raster_scale: 3,
    phone_logical_viewport: { width: 393, height: 852 },
    desktop_viewports_from_historical_demo: true,
  });
  assert.deepEqual(manifest.frame_ids, [
    "lisa-materials-full-reference",
    "lisa-presentation-generating",
    "lisa-presentation-chat-list",
    "lisa-presentation-sent",
    "lisa-presentation-email",
    "lisa-presentation-slidedoc",
    "lisa-presentation-sber2025",
    "lisa-presentation-mag",
    "lisa-order-not-accepted",
    "lisa-delivery-delayed",
    "lisa-delivery-partial",
  ]);
  assert.equal(manifest.frames.length, 11);
  assert.ok(manifest.frames.every((frame) => typeof frame.asset_sha256 === "string" && /^[a-f0-9]{64}$/u.test(frame.asset_sha256)));
  assert.ok(manifest.frames.every((frame) => frame.asset_paths.every((assetPath) => fs.existsSync(path.join(root, draftRoot, assetPath)))));

  const html = fs.readFileSync(htmlPath, "utf8");
  const activeApp = fs.readFileSync(path.join(activeDemoRoot, "app.js"), "utf8");
  const activeStyles = fs.readFileSync(path.join(activeDemoRoot, "styles.css"), "utf8");
  assert.notEqual(fs.readFileSync(appPath, "utf8"), activeApp, "черновик должен содержать только разрешённую настройку начальной прокрутки");
  assert.match(fs.readFileSync(appPath, "utf8"), /function applyInitialPhoneScroll\(state, scroller\)/u);
  assert.match(fs.readFileSync(appPath, "utf8"), /applyInitialPhoneScroll\(state, scroller\);/u);
  assert.equal(fs.readFileSync(stylesPath, "utf8"), activeStyles, "оформление должно быть точной копией действующего прототипа");
  assert.match(html, /data-testid="service-panel"/u);
  assert.match(html, /data-testid="previous-state"/u);
  assert.match(html, /data-testid="next-state"/u);
  assert.match(html, /id="slide-navigation"/u);
  assert.match(html, /data-testid="prototype-root"/u);
  assert.doesNotMatch(html, /draft-shell|draft-viewer|previous-frame|next-frame/u);
  assert.equal(html, fs.readFileSync(path.join(activeDemoRoot, "index.html"), "utf8"), "страница должна быть точной копией действующего прототипа");
  assert.doesNotMatch(html, /(?:\/Users\/|file:\/\/|\.pdf\b|demo\/)/iu);
  const data = fs.readFileSync(dataPath, "utf8");
  for (const frameId of manifest.frame_ids) assert.match(data, new RegExp(frameId, "u"));
});

test("новые кадры сохраняют масштаб и пропорции исторического прототипа", () => {
  const activeData = readPrototypeData(path.join(root, packagePath, "demo/data.js"));
  const draftData = readPrototypeData(path.join(root, draftRoot, "data.js"));
  const activePhone = activeData.states.find((state) => state.id === "lisa-materials-full-reference");
  const activeEmail = activeData.states.find((state) => state.id === "lisa-presentation-email");
  assert.ok(activePhone && activeEmail, "нужны исторические эталонные кадры");

  const phoneFrameIds = [
    "lisa-materials-full-reference",
    "lisa-presentation-generating",
    "lisa-presentation-sent",
    "lisa-order-not-accepted",
    "lisa-delivery-delayed",
    "lisa-delivery-partial",
  ];
  for (const frameId of phoneFrameIds) {
    const state = draftData.states.find((candidate) => candidate.id === frameId);
    assert.ok(state, `${frameId}: нужен новый телефонный кадр`);
    assert.deepEqual(JSON.parse(JSON.stringify(state.viewport)), JSON.parse(JSON.stringify(activePhone.viewport)), `${frameId}: область телефона должна совпадать с исторической`);
    for (const layer of state.asset.layers) {
      const expectedWidth = layer.logical_dimensions.width * 3;
      const expectedHeight = layer.logical_dimensions.height * 3;
      assert.equal(layer.raster_scale, 3, `${frameId}/${layer.role}: требуется историческая трёхкратная плотность`);
      assert.deepEqual(JSON.parse(JSON.stringify(layer.pixel_dimensions)), { width: expectedWidth, height: expectedHeight }, `${frameId}/${layer.role}: размер слоя должен соответствовать историческому масштабу`);
    }
  }

  const draftEmail = draftData.states.find((state) => state.id === "lisa-presentation-email");
  assert.ok(draftEmail, "нужен новый кадр письма");
  assert.deepEqual(JSON.parse(JSON.stringify(draftEmail.viewport)), JSON.parse(JSON.stringify(activeEmail.viewport)), "кадр письма должен сохранять пропорции исторического окна");
});

test("заданные телефонные кадры открывают нижнюю часть чата без потери прокрутки", () => {
  const draftData = readPrototypeData(path.join(root, draftRoot, "data.js"));
  const draftApp = fs.readFileSync(path.join(root, draftRoot, "app.js"), "utf8");
  const initialBottomFrameIds = [
    "lisa-presentation-generating",
    "lisa-presentation-sent",
    "lisa-order-not-accepted",
    "lisa-delivery-delayed",
    "lisa-delivery-partial",
  ];

  for (const state of draftData.states.filter((candidate) => candidate.presentation === "phone")) {
    const expected = initialBottomFrameIds.includes(state.id) ? "bottom" : "top";
    assert.equal(state.initial_scroll_position, expected, `${state.id}: начальное положение прокрутки должно быть явным`);
    if (expected === "bottom") assert.equal(state.scrollable, true, `${state.id}: нижнее положение доступно только в прокручиваемом чате`);
  }
  assert.match(draftApp, /function applyInitialPhoneScroll\(state, scroller\)/u, "оболочка должна применять декларативное начальное положение прокрутки");
  assert.match(draftApp, /scroller\.scrollTop = maximumScrollTop;/u, "нижнее положение должно оставлять стандартную прокрутку без подмены содержимого");
});
