import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";

import { webkit } from "playwright";

import { canonicalizeApprovedPng } from "./import-presentation-link-lisa-editable-sources.mjs";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const DRAFT_ROOT = `${PACKAGE_PATH}/candidate-evidence/prototype-draft`;
const DEMO_ROOT = `${PACKAGE_PATH}/demo`;
const PHONE_SOURCE_LEFT = 64;
const PHONE_SOURCE_TOP = 48;
const PHONE_SOURCE_WIDTH = 393;
const PHONE_TOP_HEIGHT = 53;
const PHONE_BOTTOM_HEIGHT = 34;
const PHONE_BOTTOM_MARGIN = 80;
const PHONE_RUNTIME_RASTER_SCALE = 3;
const HISTORICAL_EMAIL_VIEWPORT = Object.freeze({ width: 1553, height: 1013 });
const PHONE_SEGMENT_VIEWPORT_RECTS = Object.freeze({
  system_top: Object.freeze({ x: 0, y: 0, width: 393, height: 53 }),
  scroll_content: Object.freeze({ x: 0, y: 53, width: 393, height: 765 }),
  system_bottom: Object.freeze({ x: 0, y: 818, width: 393, height: 34 }),
});
const FRAME_IDS = Object.freeze([
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
const PHONE_FRAME_SPECS = Object.freeze([
  Object.freeze({
    id: "lisa-materials-full-reference",
    caption: "Полная справка: прокрутите материалы или оформите заказ",
    source: "candidate-evidence/frame-review/lisa-materials-full-reference/draft-current-resolution.png",
    interactive: true,
  }),
  Object.freeze({
    id: "lisa-presentation-generating",
    caption: "Презентация формируется",
    source: "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/draft-current-resolution.png",
  }),
  Object.freeze({
    id: "lisa-presentation-sent",
    caption: "Презентация сформирована и отправлена",
    source: "candidate-evidence/frame-review/lisa-presentation-sent/draft-current-resolution.png",
  }),
  Object.freeze({
    id: "lisa-order-not-accepted",
    caption: "Данные для формирования презентации не приняты",
    source: "candidate-evidence/frame-review/lisa-order-not-accepted-clock-13-40/draft-current-resolution.png",
  }),
  Object.freeze({
    id: "lisa-delivery-delayed",
    caption: "Отправка презентации задерживается",
    source: "candidate-evidence/frame-review/lisa-delivery-delayed-clock-13-40/draft-current-resolution.png",
  }),
  Object.freeze({
    id: "lisa-delivery-partial",
    caption: "Частичная или неподтверждённая доставка презентации",
    source: "candidate-evidence/frame-review/lisa-delivery-partial-clock-13-40/draft-current-resolution.png",
  }),
]);
const DESKTOP_FRAME_SPECS = Object.freeze([
  Object.freeze({
    id: "lisa-presentation-email",
    caption: "Письмо с версиями презентации в PPTX и PDF",
    kind: "desktop",
    source: "candidate-evidence/frame-review/lisa-presentation-email/draft-current-resolution.png",
    viewport: Object.freeze({ width: 1280, height: 960 }),
  }),
  Object.freeze({
    id: "lisa-presentation-slidedoc",
    caption: "Презентация: вариант SlideDoc",
    kind: "presentation",
    source: "candidate-evidence/frame-review/lisa-presentation-slidedoc-pdf-import/draft-current-resolution.png",
  }),
  Object.freeze({
    id: "lisa-presentation-sber2025",
    caption: "Презентация: вариант Sber 2025",
    kind: "presentation",
    source: "candidate-evidence/frame-review/lisa-presentation-sber2025-pdf-import/draft-current-resolution.png",
  }),
  Object.freeze({
    id: "lisa-presentation-mag",
    caption: "Презентация: вариант MAG",
    kind: "presentation",
    source: "candidate-evidence/frame-review/lisa-presentation-mag-pdf-import/draft-current-resolution.png",
  }),
]);
function fail(message) {
  throw new Error(message);
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sha256Collection(paths) {
  return createHash("sha256").update(paths.map((assetPath) => sha256File(assetPath)).join("\n")).digest("hex");
}

function safeRelativePath(value) {
  return typeof value === "string" && value.length > 0 && !path.isAbsolute(value) && !value.includes("\\") && !value.split("/").includes("..");
}

function rootPath(root, relativePath, label) {
  if (!safeRelativePath(relativePath)) fail(`${label}: небезопасный относительный путь`);
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`)) fail(`${label}: путь выходит за рабочий корень`);
  return target;
}

function readPngDimensions(filePath, label) {
  const bytes = fs.readFileSync(filePath);
  if (!bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) fail(`${label}: нужен PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o755 });
  fs.writeFileSync(filePath, content, "utf8");
}

function writeBuffer(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o755 });
  fs.writeFileSync(filePath, content);
}

function sourcePath(root, relativePath, label) {
  const target = rootPath(root, `${PACKAGE_PATH}/${relativePath}`, label);
  if (!fs.existsSync(target) || !fs.lstatSync(target).isFile()) fail(`${label}: отсутствует подготовленный ресурс`);
  return target;
}

function phoneSourceRects(dimensions, label) {
  const bottomY = dimensions.height - PHONE_BOTTOM_MARGIN - PHONE_BOTTOM_HEIGHT;
  const contentHeight = bottomY - (PHONE_SOURCE_TOP + PHONE_TOP_HEIGHT);
  if (dimensions.width !== 521 || contentHeight < PHONE_SEGMENT_VIEWPORT_RECTS.scroll_content.height) {
    fail(`${label}: полный кадр телефона не соответствует геометрии исходного прототипа`);
  }
  return {
    system_top: { x: PHONE_SOURCE_LEFT, y: PHONE_SOURCE_TOP, width: PHONE_SOURCE_WIDTH, height: PHONE_TOP_HEIGHT },
    scroll_content: { x: PHONE_SOURCE_LEFT, y: PHONE_SOURCE_TOP + PHONE_TOP_HEIGHT, width: PHONE_SOURCE_WIDTH, height: contentHeight },
    system_bottom: { x: PHONE_SOURCE_LEFT, y: bottomY, width: PHONE_SOURCE_WIDTH, height: PHONE_BOTTOM_HEIGHT },
  };
}

async function cropPhoneLayers(sourceFile, dimensions, rects, label) {
  const browser = await webkit.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: dimensions,
      deviceScaleFactor: PHONE_RUNTIME_RASTER_SCALE,
      javaScriptEnabled: false,
      colorScheme: "light",
      locale: "ru-RU",
      timezoneId: "UTC",
    });
    let routedRequest = false;
    await context.route("**/*", async (route) => {
      routedRequest = true;
      await route.abort();
    });
    const page = await context.newPage();
    const dataUrl = `data:image/png;base64,${fs.readFileSync(sourceFile).toString("base64")}`;
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"></head><body style="margin:0;overflow:hidden"><img id="snapshot" src="${dataUrl}" width="${dimensions.width}" height="${dimensions.height}" style="display:block;width:${dimensions.width}px;height:${dimensions.height}px"></body></html>`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const natural = await page.locator("#snapshot").evaluate((image) => ({ complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }));
    if (!natural.complete || natural.naturalWidth !== dimensions.width || natural.naturalHeight !== dimensions.height) fail(`${label}: браузер не подтвердил натуральные размеры исходного PNG`);
    const output = {};
    for (const [role, rect] of Object.entries(rects)) {
      output[role] = canonicalizeApprovedPng(
        await page.screenshot({ type: "png", clip: rect, timeout: 30_000 }),
        { width: rect.width * PHONE_RUNTIME_RASTER_SCALE, height: rect.height * PHONE_RUNTIME_RASTER_SCALE },
        `${label}: ${role}`,
      );
    }
    await context.close();
    if (routedRequest) fail(`${label}: подготовка слоёв попыталась обратиться к сети`);
    return output;
  } finally {
    await browser.close();
  }
}

function assetPath(frameId, role) {
  return `assets/${frameId}-${role.replace("_", "-")}.png`;
}

function phoneLayer(frameId, role, sourceRect) {
  return {
    role,
    src: assetPath(frameId, role),
    source_rect: sourceRect,
    viewport_rect: PHONE_SEGMENT_VIEWPORT_RECTS[role],
    destination_rect: PHONE_SEGMENT_VIEWPORT_RECTS[role],
    pixel_dimensions: {
      width: sourceRect.width * PHONE_RUNTIME_RASTER_SCALE,
      height: sourceRect.height * PHONE_RUNTIME_RASTER_SCALE,
    },
    logical_dimensions: { width: sourceRect.width, height: sourceRect.height },
    raster_scale: PHONE_RUNTIME_RASTER_SCALE,
  };
}

function phoneState(spec, index, dimensions) {
  const sourceRects = phoneSourceRects(dimensions, spec.id);
  const layers = ["system_top", "scroll_content", "system_bottom"].map((role) => phoneLayer(spec.id, role, sourceRects[role]));
  return {
    id: spec.id,
    order: index + 1,
    display_order: index + 1,
    source_id: "owner_approved_candidate",
    caption: spec.caption,
    presentation: "phone",
    scrollable: sourceRects.scroll_content.height > PHONE_SEGMENT_VIEWPORT_RECTS.scroll_content.height,
    action_ids: spec.interactive ? ["order-presentation"] : [],
    viewport: { width: 393, height: 852 },
    content: { width: 393, height: sourceRects.scroll_content.height },
    logical_dimensions: dimensions,
    cta_rect: spec.interactive ? { x: 80, y: sourceRects.system_bottom.y - 132, width: 361, height: 40 } : null,
    raster_layers: layers,
    asset: { layers },
  };
}

function chatListState(index) {
  const layerSpecs = [
    ["system_top", "lisa-presentation-chat-list-status-3x.png", { x: 64, y: 48, width: 393, height: 53 }],
    ["scroll_content", "lisa-presentation-chat-list-content-3x.png", { x: 64, y: 101, width: 393, height: 765 }],
    ["system_bottom", "lisa-presentation-chat-list-home-3x.png", { x: 64, y: 866, width: 393, height: 34 }],
  ];
  const layers = layerSpecs.map(([role, fileName, sourceRect]) => ({
    role,
    src: `assets/${fileName}`,
    source_rect: sourceRect,
    viewport_rect: PHONE_SEGMENT_VIEWPORT_RECTS[role],
    destination_rect: PHONE_SEGMENT_VIEWPORT_RECTS[role],
    pixel_dimensions: { width: sourceRect.width * 3, height: sourceRect.height * 3 },
    logical_dimensions: { width: sourceRect.width, height: sourceRect.height },
    raster_scale: 3,
  }));
  return {
    id: "lisa-presentation-chat-list",
    order: index + 1,
    display_order: index + 1,
    source_id: "08",
    caption: "Чаты: ООО «Водолей Трейд»",
    presentation: "phone",
    scrollable: false,
    action_ids: [],
    viewport: { width: 393, height: 852 },
    content: { width: 393, height: 765 },
    logical_dimensions: { width: 521, height: 980 },
    cta_rect: null,
    raster_layers: layers,
    asset: { layers },
  };
}

function desktopState(spec, index, dimensions) {
  const documentFrame = spec.kind === "presentation";
  const viewport = documentFrame ? { width: 960, height: 540 } : HISTORICAL_EMAIL_VIEWPORT;
  return {
    id: spec.id,
    order: index + 1,
    display_order: index + 1,
    source_id: documentFrame ? "owner_supplied_pdf_visual_donor" : "owner_supplied_outlook_corporate_email_screenshot_2026_08_19",
    caption: spec.caption,
    presentation: "desktop",
    scrollable: documentFrame,
    action_ids: [],
    viewport,
    content: documentFrame ? { width: 960, height: 1620 } : dimensions,
    logical_dimensions: documentFrame ? { width: 960, height: 1620 } : dimensions,
    cta_rect: null,
    asset: {
      src: `assets/${spec.id}.png`,
      logical_dimensions: documentFrame ? { width: 960, height: 1620 } : dimensions,
      pixel_dimensions: documentFrame ? { width: 3840, height: 6480 } : dimensions,
      raster_scale: documentFrame ? 4 : 1,
      source_pixel_dimensions: dimensions,
      source_raster_scale: 1,
    },
  };
}

function buildData(phoneDimensions, desktopDimensions) {
  const states = [];
  for (const spec of PHONE_FRAME_SPECS.slice(0, 2)) states.push(phoneState(spec, states.length, phoneDimensions.get(spec.id)));
  states.push(chatListState(states.length));
  states.push(phoneState(PHONE_FRAME_SPECS[2], states.length, phoneDimensions.get(PHONE_FRAME_SPECS[2].id)));
  for (const spec of DESKTOP_FRAME_SPECS) states.push(desktopState(spec, states.length, desktopDimensions.get(spec.id)));
  for (const spec of PHONE_FRAME_SPECS.slice(3)) states.push(phoneState(spec, states.length, phoneDimensions.get(spec.id)));
  if (JSON.stringify(states.map((state) => state.id)) !== JSON.stringify(FRAME_IDS)) fail("состояния черновика не соответствуют утверждённому порядку кадров");
  return {
    version: "3.0.0-draft",
    initial_state_id: "lisa-materials-full-reference",
    order_target_state_id: "lisa-presentation-generating",
    lifecycle: {
      button: { enabled_in: ["eligible"], disabled_in: ["accepted_locked"] },
      messages: [{ id: "order_started", authoritative_text_status: "agreed", authoritative_text: "Открыт кадр начала формирования презентации." }],
    },
    navigation: { display_total: FRAME_IDS.length },
    device: {
      model: "iPhone 12 Pro Max",
      body_mm: { width: 78.1, height: 160.8 },
      source_body_viewport: { x: 64, y: 48, width: 393, height: 852 },
      source_body_corner_radius: 32,
    },
    states,
  };
}

function dataJs(data) {
  return `window.LISA_PROTOTYPE_DATA = Object.freeze(${JSON.stringify(data, null, 2)});\n`;
}

function copyDesktopAsset(root, outputRoot, spec) {
  const source = sourcePath(root, spec.source, `${spec.id}/источник`);
  const dimensions = readPngDimensions(source, `${spec.id}/источник`);
  if (spec.kind === "presentation" && (dimensions.width !== 960 || dimensions.height !== 1620)) fail(`${spec.id}: черновой PNG презентации должен сохранять три страницы 960×540`);
  writeBuffer(rootPath(outputRoot, `assets/${spec.id}.png`, `${spec.id}/ресурс черновика`), fs.readFileSync(source));
  return dimensions;
}

async function writePhoneAssets(root, outputRoot, spec) {
  const source = sourcePath(root, spec.source, `${spec.id}/источник`);
  const dimensions = readPngDimensions(source, `${spec.id}/источник`);
  const rects = phoneSourceRects(dimensions, spec.id);
  const layers = await cropPhoneLayers(source, dimensions, rects, spec.id);
  for (const [role, bytes] of Object.entries(layers)) writeBuffer(rootPath(outputRoot, assetPath(spec.id, role), `${spec.id}/${role}`), bytes);
  return dimensions;
}

function writeChatListAssets(root, outputRoot) {
  for (const fileName of ["lisa-presentation-chat-list-status-3x.png", "lisa-presentation-chat-list-content-3x.png", "lisa-presentation-chat-list-home-3x.png"]) {
    const source = rootPath(root, `${DEMO_ROOT}/assets/${fileName}`, `чат/${fileName}`);
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) fail(`чат/${fileName}: отсутствует исходный слой`);
    writeBuffer(rootPath(outputRoot, `assets/${fileName}`, `чат/${fileName}`), fs.readFileSync(source));
  }
}

function sourceRuntimeHashes(root) {
  return Object.fromEntries(["index.html", "app.js", "styles.css"].map((fileName) => [fileName, sha256File(rootPath(root, `${DEMO_ROOT}/${fileName}`, `действующий прототип/${fileName}`))]));
}

function buildManifest(root, outputRoot, data) {
  const frames = data.states.map((state) => {
    const assetPaths = state.presentation === "phone" ? state.raster_layers.map((layer) => layer.src) : [state.asset.src];
    return {
      frame_id: state.id,
      kind: state.presentation === "phone" ? "phone" : state.scrollable ? "presentation" : "desktop",
      asset_paths: assetPaths,
      asset_sha256: sha256Collection(assetPaths.map((asset) => rootPath(outputRoot, asset, `${state.id}/asset`))),
    };
  });
  return {
    $schema: "../../source/schemas/lisa-prototype-draft-manifest.schema.json",
    version: "1.2.0",
    status: "draft_prototype_rendered_pending_owner_approval",
    rendering_mode: "isolated_current_prototype_copy_with_frame_asset_substitution",
    shell_parity: {
      index_html_source: "demo/index.html",
      app_js_source: "demo/app.js",
      styles_css_source: "demo/styles.css",
      navigation_model: "previous_prototype_state_and_document_navigation",
    },
    scale_parity: {
      phone_layer_raster_scale: PHONE_RUNTIME_RASTER_SCALE,
      phone_logical_viewport: { width: 393, height: 852 },
      desktop_viewports_from_historical_demo: true,
    },
    source_runtime_sha256: sourceRuntimeHashes(root),
    active_release_mutation_prohibited: true,
    raw_pdf_included: false,
    frame_ids: FRAME_IDS,
    frames,
  };
}

function validateDraft(root) {
  const outputRoot = rootPath(root, DRAFT_ROOT, "корень чернового прототипа");
  const manifestPath = rootPath(outputRoot, "manifest.json", "манифест чернового прототипа");
  const htmlPath = rootPath(outputRoot, "index.html", "страница чернового прототипа");
  const appPath = rootPath(outputRoot, "app.js", "сценарий чернового прототипа");
  const stylesPath = rootPath(outputRoot, "styles.css", "стили чернового прототипа");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (
    manifest.$schema !== "../../source/schemas/lisa-prototype-draft-manifest.schema.json" ||
    manifest.version !== "1.2.0" ||
    manifest.status !== "draft_prototype_rendered_pending_owner_approval" ||
    manifest.rendering_mode !== "isolated_current_prototype_copy_with_frame_asset_substitution" ||
    manifest.active_release_mutation_prohibited !== true ||
    manifest.raw_pdf_included !== false ||
    JSON.stringify(manifest.frame_ids) !== JSON.stringify(FRAME_IDS) ||
    !Array.isArray(manifest.frames) || manifest.frames.length !== FRAME_IDS.length
  ) fail("манифест чернового прототипа не соответствует договору");
  const expectedShellParity = {
    index_html_source: "demo/index.html",
    app_js_source: "demo/app.js",
    styles_css_source: "demo/styles.css",
    navigation_model: "previous_prototype_state_and_document_navigation",
  };
  if (JSON.stringify(manifest.shell_parity) !== JSON.stringify(expectedShellParity) || JSON.stringify(manifest.source_runtime_sha256) !== JSON.stringify(sourceRuntimeHashes(root))) fail("манифест не подтверждает соответствие оболочки действующему прототипу");
  const expectedScaleParity = {
    phone_layer_raster_scale: PHONE_RUNTIME_RASTER_SCALE,
    phone_logical_viewport: { width: 393, height: 852 },
    desktop_viewports_from_historical_demo: true,
  };
  if (JSON.stringify(manifest.scale_parity) !== JSON.stringify(expectedScaleParity)) fail("манифест не подтверждает соответствие масштаба историческому прототипу");
  for (const frame of manifest.frames) {
    if (!FRAME_IDS.includes(frame.frame_id) || !Array.isArray(frame.asset_paths) || frame.asset_paths.length === 0 || !/^[a-f0-9]{64}$/u.test(frame.asset_sha256)) fail("манифест чернового прототипа содержит неверное описание кадра");
    const assets = frame.asset_paths.map((assetPath) => rootPath(outputRoot, assetPath, `${frame.frame_id}/asset`));
    if (assets.some((assetPath) => !fs.existsSync(assetPath)) || sha256Collection(assets) !== frame.asset_sha256) fail("ресурс чернового прототипа не соответствует сохранённому хэшу");
  }
  const html = fs.readFileSync(htmlPath, "utf8");
  const demoIndex = fs.readFileSync(rootPath(root, `${DEMO_ROOT}/index.html`, "действующий прототип/index.html"), "utf8");
  if (
    html !== demoIndex ||
    fs.readFileSync(appPath, "utf8") !== fs.readFileSync(rootPath(root, `${DEMO_ROOT}/app.js`, "действующий прототип/app.js"), "utf8") ||
    fs.readFileSync(stylesPath, "utf8") !== fs.readFileSync(rootPath(root, `${DEMO_ROOT}/styles.css`, "действующий прототип/styles.css"), "utf8")
  ) fail("оболочка черновика отличается от действующего прототипа");
  if (/(?:\/Users\/|file:\/\/|\.pdf\b|draft-shell|draft-viewer)/iu.test(html)) fail("страница чернового прототипа содержит недопустимый источник или стороннюю оболочку");
  const dataContext = { window: {} };
  vm.createContext(dataContext);
  const dataPath = rootPath(outputRoot, "data.js", "данные чернового прототипа");
  vm.runInContext(fs.readFileSync(dataPath, "utf8"), dataContext, { filename: dataPath });
  const data = dataContext.window.LISA_PROTOTYPE_DATA;
  if (!data || !Array.isArray(data.states)) fail("данные чернового прототипа не загружены");
  const phoneFrames = data.states.filter((state) => state.presentation === "phone");
  for (const state of phoneFrames) {
    if (state.id === "lisa-presentation-chat-list") continue;
    if (state.viewport?.width !== 393 || state.viewport?.height !== 852) fail(`${state.id}: область телефона отличается от исторического прототипа`);
    for (const layer of state.asset?.layers || []) {
      const expectedPixels = {
        width: layer.logical_dimensions?.width * PHONE_RUNTIME_RASTER_SCALE,
        height: layer.logical_dimensions?.height * PHONE_RUNTIME_RASTER_SCALE,
      };
      const actualDimensions = readPngDimensions(rootPath(outputRoot, layer.src, `${state.id}/${layer.role}`), `${state.id}/${layer.role}`);
      if (layer.raster_scale !== PHONE_RUNTIME_RASTER_SCALE || JSON.stringify(layer.pixel_dimensions) !== JSON.stringify(expectedPixels) || JSON.stringify(actualDimensions) !== JSON.stringify(expectedPixels)) {
        fail(`${state.id}/${layer.role}: слой не сохраняет исторический масштаб телефона`);
      }
    }
  }
  const emailState = data.states.find((state) => state.id === "lisa-presentation-email");
  if (!emailState || JSON.stringify(emailState.viewport) !== JSON.stringify(HISTORICAL_EMAIL_VIEWPORT)) fail("кадр письма не сохраняет исторические пропорции окна");
  return manifest;
}

export async function generateLisaPrototypeDraft({ root = process.cwd(), check = false, replace = false } = {}) {
  const resolvedRoot = fs.realpathSync(root);
  if (check) return validateDraft(resolvedRoot);
  const outputRoot = rootPath(resolvedRoot, DRAFT_ROOT, "корень чернового прототипа");
  if (fs.existsSync(outputRoot) && !replace) fail("черновой прототип уже существует; используйте --replace после изменения источников");
  if (fs.existsSync(outputRoot)) fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(outputRoot, "assets"), { recursive: true, mode: 0o755 });
  const phoneDimensions = new Map();
  for (const spec of PHONE_FRAME_SPECS) phoneDimensions.set(spec.id, await writePhoneAssets(resolvedRoot, outputRoot, spec));
  writeChatListAssets(resolvedRoot, outputRoot);
  const desktopDimensions = new Map();
  for (const spec of DESKTOP_FRAME_SPECS) desktopDimensions.set(spec.id, copyDesktopAsset(resolvedRoot, outputRoot, spec));
  const data = buildData(phoneDimensions, desktopDimensions);
  const sourceIndex = fs.readFileSync(rootPath(resolvedRoot, `${DEMO_ROOT}/index.html`, "действующий прототип/index.html"), "utf8");
  writeFile(rootPath(outputRoot, "index.html", "страница чернового прототипа"), sourceIndex);
  writeFile(rootPath(outputRoot, "app.js", "сценарий чернового прототипа"), fs.readFileSync(rootPath(resolvedRoot, `${DEMO_ROOT}/app.js`, "действующий прототип/app.js"), "utf8"));
  writeFile(rootPath(outputRoot, "styles.css", "стили чернового прототипа"), fs.readFileSync(rootPath(resolvedRoot, `${DEMO_ROOT}/styles.css`, "действующий прототип/styles.css"), "utf8"));
  writeFile(rootPath(outputRoot, "data.js", "данные чернового прототипа"), dataJs(data));
  writeFile(rootPath(outputRoot, "manifest.json", "манифест чернового прототипа"), `${JSON.stringify(buildManifest(resolvedRoot, outputRoot, data), null, 2)}\n`);
  return validateDraft(resolvedRoot);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const argumentsList = process.argv.slice(2);
    const check = argumentsList.includes("--check");
    const replace = argumentsList.includes("--replace");
    if ((check && replace) || argumentsList.some((argument) => !["--check", "--replace"].includes(argument))) fail("использование: node scripts/generate-lisa-prototype-draft.mjs [--check|--replace]");
    const manifest = await generateLisaPrototypeDraft({ check, replace });
    process.stdout.write(check ? "Черновой прототип актуален\n" : `Черновой прототип подготовлен: ${manifest.frames.length} кадров\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "черновой прототип не подготовлен"}\n`);
    process.exitCode = 1;
  }
}
