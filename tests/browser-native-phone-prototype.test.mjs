import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const packageRoot = path.join(root, "docs/product/analysis/presentation-link-lisa-user-journey");
const sourceRoot = path.join(packageRoot, "source/browser-native-phone-prototype");
const runtimeRoot = path.join(packageRoot, "candidate-evidence/browser-native-phone-prototype");

function readRuntimeData(filePath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: filePath });
  return context.window.LISA_BROWSER_NATIVE_PHONE_DATA;
}

const phoneStateIds = Object.freeze([
  "lisa-materials-full-reference",
  "lisa-presentation-generating",
  "lisa-presentation-chat-list",
  "lisa-presentation-sent",
  "lisa-order-not-accepted",
  "lisa-delivery-delayed",
  "lisa-delivery-partial",
]);

const viewerFrameSequence = Object.freeze([
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

const chatSourceStateIds = Object.freeze(phoneStateIds.filter((stateId) => stateId !== "lisa-presentation-chat-list"));
const viewerTitle = "Прототип заказа презентации из агента \"Справка по клиенту\"";
const phoneStateCaptions = Object.freeze({
  "lisa-materials-full-reference": "Заказ презентации по справке по клиенту",
  "lisa-presentation-generating": "Успешное начало изготовления презентации",
  "lisa-presentation-chat-list": "Список чатов и возврат к исходному экрану",
  "lisa-presentation-sent": "Презентация направлена по электронной почте",
  "lisa-order-not-accepted": "Данные не приняты для формирования презентации",
  "lisa-delivery-delayed": "Отправка презентации в SIGMA задерживается",
  "lisa-delivery-partial": "Частичная или неподтверждённая доставка презентации",
});

test("чистовой браузерный прототип телефона имеет отдельный договор и семь семантических SVG-источников", () => {
  const contractPath = path.join(sourceRoot, "browser-native-phone-prototype-contract.json");
  assert.equal(fs.existsSync(contractPath), true, "нужен отдельный договор браузерного телефона");

  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  assert.equal(contract.status, "owner_final_approved");
  assert.deepEqual(contract.release_boundary, {
    owner_frame_approval_required: true,
    full_prototype_approval_required: true,
    final_approval_path: "owner-final-approval.json",
    high_resolution_release_allowed: true,
    active_release_switch_allowed: true,
    archive_update_allowed: true,
  });
  assert.deepEqual(contract.phone_state_ids, phoneStateIds);
  assert.deepEqual(contract.external_state_ids, [
    "lisa-presentation-email",
    "lisa-presentation-slidedoc",
    "lisa-presentation-sber2025",
    "lisa-presentation-mag",
  ]);
  assert.equal(contract.phone_runtime.raster_content_forbidden, true);
  assert.equal(contract.phone_runtime.product_text_source, "semantic_svg");
  assert.equal(contract.phone_runtime.legacy_runtime_changed, false);
  assert.equal(contract.phone_runtime.review_panel, "phone_frame_controls_and_state_caption");
  assert.equal("device_mock" in contract.phone_runtime, false, "приблизительная геометрия больше не допустима");
  assert.equal(contract.phone_runtime.geometry_source, "iphone-12-pro-max-geometry.svg");
  assert.equal(contract.phone_runtime.responsive_policy.visible_edge_clearance_css_px, 4);
  assert.deepEqual(contract.phone_runtime.geometry, {
    body_dimensions_mm: { width: 78.1, height: 160.8 },
    visible_bezel_logical_units_max: 1.157,
    side_controls_forbidden: true,
  });
  assert.deepEqual(contract.viewer_navigation.frame_sequence, viewerFrameSequence);
  assert.deepEqual(contract.viewer_shell, {
    document_title: viewerTitle,
    panel_title: viewerTitle,
    phone_state_captions: phoneStateCaptions,
    external_panel_hidden: true,
  });
  assert.deepEqual(contract.viewer_navigation.phone_panel.controls, ["previous_frame", "next_frame"]);
  assert.deepEqual(contract.viewer_navigation.external_overlay.email_controls, ["previous_frame", "next_frame"]);
  assert.deepEqual(contract.viewer_navigation.external_overlay.presentation_controls, ["previous_frame", "next_frame", "previous_page", "next_page"]);
  assert.equal(contract.viewer_navigation.external_overlay.minimum_target_css_px, 44);
  assert.deepEqual(contract.viewer_navigation.chat_list.open_from_state_ids, chatSourceStateIds);
  assert.equal(contract.viewer_navigation.chat_list.return_to_origin, true);
  assert.equal(contract.viewer_navigation.chat_list.restore_scroll_position, true);
  assert.deepEqual(contract.viewer_navigation.presentation_pages, {
    page_count: 3,
    logical_page: { width: 960, height: 540 },
  });
  assert.deepEqual(contract.external_asset_profile, {
    email: {
      source_svg_path: "../../candidate-evidence/frame-review/lisa-presentation-email/source.svg",
      source_svg_sha256: "f7335e8533e30139fa049cf6357c13646b047d61c7079f218fd91b7d956994d7",
      runtime_asset_path: "assets/external/lisa-presentation-email.svg",
      review_raster_path: "external-4k-series-review/lisa-presentation-email-3840x2880.png",
      runtime_intrinsic_dimensions: { width: 1280, height: 960 },
      review_raster_dimensions: { width: 3840, height: 2880 },
    },
    presentations: {
      source_contract_path: "../presentation-pdf-raster-import-contract.json",
      renderer_path: "scripts/render-presentation-link-lisa-pdf-slides.swift",
      scale: 4,
      runtime_page_dimensions: { width: 3840, height: 2160 },
      review_stack_dimensions: { width: 3840, height: 6480 },
      runtime_asset_directory: "assets/external",
      review_directory: "external-4k-series-review",
      source_files_local_only: true,
      raw_pdf_runtime_forbidden: true,
    },
    series_review: {
      status: "owner_series_approved",
      scope: "external_email_and_three_presentation_variants",
      owner_approval_required: true,
      owner_approval_path: "external-4k-series-owner-approval.json",
      active_release_switch_allowed: true,
    },
  });
  const geometry = fs.readFileSync(path.join(sourceRoot, "iphone-12-pro-max-geometry.svg"), "utf8");
  assert.match(geometry, /viewBox="0 0 78\.1 160\.8"/u);
  for (const id of ["phone-assembly", "phone-body", "phone-glass", "phone-active-display", "phone-notch", "phone-speaker"]) {
    assert.match(geometry, new RegExp(`id="${id}"`, "u"));
  }
  assert.doesNotMatch(geometry, /phone-side-controls|phone-silent-switch|phone-volume-up|phone-volume-down|phone-side-button/u);
  assert.match(geometry, /id="phone-active-display" x="1\.1567" y="1\.1567" width="75\.7866" height="158\.4866"/u);
  assert.deepEqual(contract.phone_runtime.chat_list_source, {
    donor_path: "../../editable-sources/08.svg",
    donor_viewport: { x: 64, y: 48, width: 393, height: 852 },
    semantic_svg_path: "semantic-svgs/lisa-presentation-chat-list.svg",
    only_text_replacement: {
      from: "Справка по клиенту ГК Достовалова",
      to: "Справка по клиенту ООО «Водолей Трейд»",
    },
  });
  assert.equal("additional_chat_rows" in contract.phone_runtime, false, "список чатов нельзя собирать из выдуманных карточек");

  for (const stateId of phoneStateIds) {
    const svgPath = path.join(sourceRoot, "semantic-svgs", `${stateId}.svg`);
    assert.equal(fs.existsSync(svgPath), true, `${stateId}: нужен семантический SVG-источник`);
    const svg = fs.readFileSync(svgPath, "utf8");
    assert.match(svg, /<text\b/u, `${stateId}: текст должен быть редактируемым SVG-текстом`);
    assert.match(svg, /data-dom-id=/u, `${stateId}: нужны семантические идентификаторы DOM`);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\son[a-z]+\s*=/iu, `${stateId}: SVG не должен содержать исполняемый код`);
  }

  for (const fileName of ["index.html", "app.js", "data.js", "styles.css", "manifest.json"]) {
    assert.equal(fs.existsSync(path.join(runtimeRoot, fileName)), true, `нужен файл браузерного макета: ${fileName}`);
  }
});

test("генератор и валидатор закрепляют DOM-текст, границы растра и утверждённые состояния", () => {
  const generatorPath = path.join(root, "scripts/generate-browser-native-phone-prototype.mjs");
  const validatorPath = path.join(root, "scripts/validate-browser-native-phone-prototype.mjs");
  assert.equal(fs.existsSync(generatorPath), true, "нужен генератор браузерного кандидата");
  assert.equal(fs.existsSync(validatorPath), true, "нужен независимый валидатор браузерного кандидата");

  execFileSync("node", [generatorPath, "--check"], { cwd: root, stdio: "pipe" });
  execFileSync("node", [validatorPath], { cwd: root, stdio: "pipe" });

  const model = readRuntimeData(path.join(runtimeRoot, "data.js"));
  const client = JSON.parse(fs.readFileSync(path.join(packageRoot, "source/client-reference-data.json"), "utf8"));
  assert.deepEqual(JSON.parse(JSON.stringify(model.phoneStateIds)), phoneStateIds);
  assert.equal(model.states.length, 7);
  assert.deepEqual(JSON.parse(JSON.stringify(model.viewerNavigation.frameSequence)), viewerFrameSequence);
  assert.deepEqual(JSON.parse(JSON.stringify(model.viewerShell)), {
    documentTitle: viewerTitle,
    panelTitle: viewerTitle,
    phoneStateCaptions,
    externalPanelHidden: true,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(model.viewerNavigation.chatList.openFromStateIds)), chatSourceStateIds);
  assert.equal(model.viewerNavigation.chatList.returnToOrigin, true);
  assert.equal(model.viewerNavigation.chatList.restoreScrollPosition, true);
  assert.equal(model.phoneGeometry.hasSideControls, false);
  assert.equal(model.phoneGeometry.visibleBezelLogicalUnitsMax, 1.157);
  assert.deepEqual(
    JSON.parse(JSON.stringify(model.externalStates.map((state) => [state.id, state.contentType, state.pageCount, state.assetFormat, state.assetPaths, state.intrinsicPage]))),
    [
      ["lisa-presentation-email", "email", 1, "svg", ["assets/external/lisa-presentation-email.svg"], { width: 1280, height: 960 }],
      ["lisa-presentation-slidedoc", "presentation", 3, "png", ["assets/external/lisa-presentation-slidedoc-page-1.png", "assets/external/lisa-presentation-slidedoc-page-2.png", "assets/external/lisa-presentation-slidedoc-page-3.png"], { width: 3840, height: 2160 }],
      ["lisa-presentation-sber2025", "presentation", 3, "png", ["assets/external/lisa-presentation-sber2025-page-1.png", "assets/external/lisa-presentation-sber2025-page-2.png", "assets/external/lisa-presentation-sber2025-page-3.png"], { width: 3840, height: 2160 }],
      ["lisa-presentation-mag", "presentation", 3, "png", ["assets/external/lisa-presentation-mag-page-1.png", "assets/external/lisa-presentation-mag-page-2.png", "assets/external/lisa-presentation-mag-page-3.png"], { width: 3840, height: 2160 }],
    ],
  );
  assert.ok(model.states.every((state) => state.nodes.every((node) => typeof node.text === "string" && node.text.length > 0)));
  assert.ok(model.states.every((state) => state.nodes.some((node) => node.role === "status-time" && node.text === state.phoneTime)), "время телефона должно происходить из SVG");
  assert.ok(model.states.filter((state) => state.id !== "lisa-presentation-chat-list").every((state) => state.nodes.some((node) => node.role === "assistant-name" && node.text === "Лиса")), "подпись ассистента должна происходить из SVG");
  assert.equal(
    model.states.find((state) => state.id === "lisa-materials-full-reference").nodes.find((node) => node.id === "reference-title").text,
    `Справка по клиенту ${client.client.short_name}`,
    "заголовок справки должен показывать согласованное название клиента",
  );
  assert.ok(model.states.every((state) => state.nodes.every((node) => node.role !== "primary-action" || node.text === "Создать презентацию по справке")));
  const chatList = model.states.find((state) => state.id === "lisa-presentation-chat-list");
  assert.ok(chatList.nodes.some((node) => node.text === "Избранное"), "список должен сохранять раздел из SVG-донора");
  assert.ok(chatList.nodes.some((node) => node.text === "Новости по АПК"), "список должен сохранять строки из SVG-донора");
  assert.ok(chatList.nodes.some((node) => node.text === "Справка по клиенту ООО «Водолей Трейд»"), "в списке должен быть заменён только клиент");
  assert.equal(chatList.nodes.some((node) => node.text === "Презентация готова и направлена по электронной почте в 13:40."), false, "список чатов не должен дублировать текст успеха");
  assert.equal(chatList.nodes.filter((node) => node.action === "return_to_same_chat").length, 1, "открывается только текущий чат");

  const app = fs.readFileSync(path.join(runtimeRoot, "app.js"), "utf8");
  const styles = fs.readFileSync(path.join(runtimeRoot, "styles.css"), "utf8");
  const html = fs.readFileSync(path.join(runtimeRoot, "index.html"), "utf8");
  assert.doesNotMatch(app, /innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function/u);
  assert.match(app, /textContent/u, "текст должен собираться DOM-средствами");
  assert.doesNotMatch(styles, /background-image/u, "внутреннее окно телефона не должно получать растровую подложку");
  assert.match(app, /makePhoneAssembly/u, "корпус должен собираться из векторной геометрии");
  assert.match(app, /viewerNavigation/u, "навигация просмотра должна поступать из договора");
  assert.doesNotMatch(app, /state\.id === "lisa-presentation-sent"/u, "доступ к списку чатов не может зависеть только от успеха");
  assert.doesNotMatch(app, /reviewButton\("Полная справка"/u, "прямые кнопки исходов нельзя оставлять в интерфейсе");
  assert.match(styles, /100cqi/u, "размер телефона должен зависеть от контейнера");
  assert.match(styles, /phone-panel-hidden/u, "внешние кадры должны скрывать левую панель");
  assert.match(styles, /external-overlay/u, "для внешних кадров нужен оверлей навигации");
  assert.doesNotMatch(styles, /translateY\(-\$\{/u, "для презентации нельзя использовать один вертикальный PNG-спрайт");
  assert.match(app, /viewerShell/u, "оболочка просмотра должна поступать из договора");
  assert.match(app, /isEditableTarget/u, "стрелки не должны перехватываться у поля ввода");
  assert.equal(html.includes('<title id="viewer-document-title"></title>'), true, "HTML должен содержать только структурный узел заголовка браузера");
  assert.match(html, /<aside[^>]+aria-labelledby="viewer-title"/u, "панель должна получать доступное имя от договорного заголовка");
  assert.equal(html.includes('<h1 id="viewer-title"></h1>'), true, "HTML должен содержать только структурный узел заголовка панели");
  assert.equal(html.includes('<p id="viewer-subtitle" data-testid="review-subtitle"></p>'), true, "HTML должен содержать только структурный узел подписи");
  assert.doesNotMatch(html, /Черновик браузерного телефона Лисы|Черновик для покадровой приёмки|Панель приёмки черновика/u, "устаревшие тексты оболочки запрещены");
  assert.doesNotMatch(styles, /phone-shell::|100dvh|100dvw|transform:\s*scale/iu, "нельзя оставлять приблизительный макет и масштаб окна");
});

test("пакет предоставляет отдельные команды DOM-кандидата без подмены исторического черновика", () => {
  const scripts = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).scripts;
  assert.equal(scripts["generate:browser-native-phone-external-4k-assets"], "node scripts/generate-browser-native-phone-external-4k-assets.mjs");
  assert.equal(scripts["check:browser-native-phone-external-4k-assets"], "node scripts/generate-browser-native-phone-external-4k-assets.mjs --check");
  assert.equal(scripts["generate:browser-native-phone-prototype"], "node scripts/generate-browser-native-phone-prototype.mjs");
  assert.equal(scripts["check:browser-native-phone-prototype"], "node scripts/generate-browser-native-phone-prototype.mjs --check");
  assert.equal(scripts["validate:browser-native-phone-prototype"], "node --test tests/browser-native-phone-prototype.test.mjs && npm run check:browser-native-phone-prototype && node scripts/validate-browser-native-phone-prototype.mjs");
  assert.equal(scripts["render:browser-native-phone-prototype-review"], "node scripts/render-browser-native-phone-prototype-review.mjs");
  assert.equal(scripts["validate:browser-native-phone-prototype:profile"], "npm run validate:browser-native-phone-prototype && npm run test:browser-native-phone-prototype && npm run check:browser-native-phone-prototype:release-evidence && npm run validate:co-2026-003-delivery-archive");
  assert.equal(scripts["generate:lisa-prototype-draft"], "node scripts/generate-lisa-prototype-draft.mjs", "историческая команда черновика не должна меняться");
});

test("проверка обзорных кадров получает внешние ресурсы только из договора", () => {
  const reviewRenderer = path.join(root, "scripts/render-browser-native-phone-prototype-review.mjs");
  const source = fs.readFileSync(reviewRenderer, "utf8");
  assert.match(source, /contract\.external_state_rules\[stateId\]\?\.runtime_asset_paths/u);
  assert.doesNotMatch(source, /path\.join\(runtimeRoot, "assets", `\$\{stateId\}\.png`\)/u);
});

test("покадровый рендер принимает все договорные кадры и публикует ревизию атомарно", () => {
  const render = fs.readFileSync(path.join(root, "scripts/render-browser-native-phone-prototype-review.mjs"), "utf8");
  assert.doesNotMatch(render, /contract\.phone_state_ids\.includes\(state\)/u, "внешние кадры должны проходить тот же порядок приёмки");
  assert.match(render, /contract\.external_state_ids/u, "отпечаток должен учитывать внешние кадры");
  assert.match(render, /mkdtempSync/u, "PNG сначала должен формироваться во временном каталоге");
  assert.match(render, /renameSync/u, "готовая ревизия должна публиковаться одной операцией");
  assert.match(render, /external_overlay/u, "манифест внешнего кадра должен фиксировать оверлей навигации");
  assert.match(render, /viewer_shell/u, "манифест кадра должен фиксировать договорную оболочку");
  assert.match(render, /panel_caption/u, "манифест кадра должен фиксировать статусную подпись");
});
