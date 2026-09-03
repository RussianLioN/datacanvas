import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { inspectPng } from "./render-lisa-full-reference-review-draft.mjs";

const root = path.resolve(import.meta.dirname, "..");
const packageRoot = path.join(root, "docs/product/analysis/presentation-link-lisa-user-journey");
const sourceRoot = path.join(packageRoot, "source/browser-native-phone-prototype");
const candidateRoot = path.join(packageRoot, "candidate-evidence/browser-native-phone-prototype");
const read = (file) => fs.readFileSync(file, "utf8");
const json = (file) => JSON.parse(read(file));
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const fail = (message) => { throw new Error(`browser-native-phone-prototype: ${message}`); };
const assert = (value, message) => { if (!value) fail(message); };
function data() { const source = read(path.join(candidateRoot, "data.js")); const match = /^window\.LISA_BROWSER_NATIVE_PHONE_DATA = ([\s\S]+);\s*$/u.exec(source); assert(Boolean(match), "data.js должен содержать только сериализованную модель"); return JSON.parse(match[1]); }
function safeRelative(value, label) { assert(typeof value === "string" && value.length > 0 && !path.isAbsolute(value) && !value.includes("\\") && !value.split("/").includes(".."), `${label}: небезопасный относительный путь`); }
function safeCandidatePath(value, label) { safeRelative(value, label); const target = path.resolve(candidateRoot, value); assert(target.startsWith(`${candidateRoot}${path.sep}`), `${label}: путь выходит за границу кандидата`); return target; }
function safeSourcePath(value, label) { safeRelative(value, label); const target = path.resolve(sourceRoot, value); assert(target.startsWith(`${sourceRoot}${path.sep}`), `${label}: путь выходит за границу исходников`); return target; }
function assertSafeExternalSvg(source, label) { assert(!/<(?:script|foreignObject|image|use)\b|<!DOCTYPE|<!ENTITY|\s(?:href|src)\s*=|\son[a-z]+\s*=|url\s*\(\s*(?!#)/iu.test(source), `${label}: небезопасный SVG`); assert(/<svg\b[^>]*\bviewBox="0 0 1280 960"/iu.test(source), `${label}: SVG должен сохранять холст 1280×960`); }

function main() {
  const contract = json(path.join(sourceRoot, "browser-native-phone-prototype-contract.json"));
  const manifest = json(path.join(candidateRoot, "manifest.json")); const runtime = data();
  assert(contract.status === "owner_final_approved", "прототип должен быть принят как чистовой результат");
  const finalApprovalPath = safeSourcePath(contract.release_boundary.final_approval_path, "итоговое решение владельца");
  const finalApproval = json(finalApprovalPath);
  assert(finalApproval.decision === "approved" && finalApproval.authorizations?.high_resolution_release_allowed === true && finalApproval.authorizations?.active_release_switch_allowed === true && finalApproval.authorizations?.delivery_archive_allowed === true, "итоговое решение владельца не разрешает чистовой выпуск");
  assert(contract.release_boundary.high_resolution_release_allowed === true && contract.release_boundary.active_release_switch_allowed === true && contract.release_boundary.archive_update_allowed === true, "договор не открывает чистовой выпуск, основной маршрут и архив");
  assert(contract.phone_runtime.raster_content_forbidden && contract.phone_runtime.product_text_source === "semantic_svg" && contract.phone_runtime.legacy_runtime_changed === false, "нарушена граница DOM-телефона");
  assert(contract.phone_runtime.review_panel === "phone_frame_controls_and_state_caption", "панель телефона должна содержать статусную подпись");
  const expectedViewerShell = {
    documentTitle: contract.viewer_shell.document_title,
    panelTitle: contract.viewer_shell.panel_title,
    phoneStateCaptions: contract.viewer_shell.phone_state_captions,
    externalPanelHidden: contract.viewer_shell.external_panel_hidden,
  };
  assert(JSON.stringify(runtime.viewerShell) === JSON.stringify(expectedViewerShell), "DOM-модель потеряла договорную оболочку просмотра");
  assert(JSON.stringify(manifest.viewer_shell) === JSON.stringify(contract.viewer_shell), "манифест потерял договорную оболочку просмотра");
  assert(JSON.stringify(Object.keys(runtime.viewerShell.phoneStateCaptions)) === JSON.stringify(contract.phone_state_ids), "подписи оболочки должны покрывать ровно семь телефонных состояний");
  assert(!Object.hasOwn(contract.phone_runtime, "device_mock"), "приблизительная геометрия device_mock запрещена");
  const geometryPath = path.join(sourceRoot, contract.phone_runtime.geometry_source); const provenancePath = path.join(sourceRoot, contract.phone_runtime.geometry_provenance_source);
  assert(fs.existsSync(geometryPath) && fs.existsSync(provenancePath), "отсутствует канонический векторный источник корпуса");
  const geometry = read(geometryPath), provenance = json(provenancePath);
  for (const id of ["phone-assembly", "phone-body", "phone-glass", "phone-active-display", "phone-notch", "phone-speaker"]) assert(geometry.includes(`id="${id}"`), `геометрия не содержит ${id}`);
  assert(!/phone-side-controls|phone-silent-switch|phone-volume-up|phone-volume-down|phone-side-button/u.test(geometry), "геометрия не должна содержать боковые аппаратные кнопки");
  assert(/viewBox="0 0 78\.1 160\.8"/u.test(geometry), "геометрия должна сохранять габариты корпуса iPhone 12 Pro Max");
  assert(/id="phone-active-display" x="1\.1567" y="1\.1567" width="75\.7866" height="158\.4866"/u.test(geometry), "видимый кант должен быть уменьшен до согласованной толщины");
  assert(provenance.official_sources?.length === 2 && provenance.official_sources.every((source) => source.url.startsWith("https://")), "не зафиксированы официальные источники геометрии");
  assert(manifest.geometry_source_sha256 === sha(geometry) && manifest.geometry_provenance_sha256 === sha(read(provenancePath)), "манифест не соответствует источнику геометрии");
  assert(runtime.phoneGeometry?.viewBox === "0 0 78.1 160.8", "DOM-модель потеряла границы полного корпуса");
  assert(runtime.phoneGeometry.elements.some((element) => element.attributes.id === "phone-active-display"), "DOM-модель потеряла активную область дисплея");
  assert(runtime.phoneGeometry.hasSideControls === false && runtime.phoneGeometry.visibleBezelLogicalUnitsMax === 1.157, "DOM-модель расходится с договором геометрии");
  assert(JSON.stringify(runtime.phoneStateIds) === JSON.stringify(contract.phone_state_ids) && runtime.states.length === contract.phone_state_ids.length, "DOM-модель расходится с договором состояний");
  assert(JSON.stringify(runtime.viewerNavigation?.frameSequence) === JSON.stringify(contract.viewer_navigation.frame_sequence), "DOM-модель потеряла порядок кадров");
  assert(JSON.stringify(runtime.viewerNavigation?.chatList?.openFromStateIds) === JSON.stringify(contract.viewer_navigation.chat_list.open_from_state_ids), "DOM-модель потеряла переходы в список чатов");
  assert(runtime.viewerNavigation?.chatList?.returnToOrigin === true && runtime.viewerNavigation?.chatList?.restoreScrollPosition === true, "возврат из списка чатов должен восстанавливать исходный экран и прокрутку");
  for (const state of runtime.states) {
    const svgPath = path.join(sourceRoot, "semantic-svgs", `${state.id}.svg`); const svg = read(svgPath);
    assert(!/<(?:script|foreignObject|image|use)\b|<!DOCTYPE|<!ENTITY|\s(?:href|src)\s*=|\son[a-z]+\s*=/iu.test(svg), `${state.id}: небезопасный SVG`);
    assert(manifest.source_sha256[state.id] === sha(svg), `${state.id}: устарел хэш семантического SVG`);
    assert(state.nodes.length > 0 && state.nodes.every((node) => node.text?.trim() && Number.isFinite(node.style?.fontSize)), `${state.id}: SVG-текст не попал в DOM`);
    assert(state.nodes.some((node) => node.role === "status-time" && node.text === state.phoneTime), `${state.id}: время не происходит из SVG`);
  }
  const rejected = runtime.states.find((state) => state.id === "lisa-order-not-accepted");
  const rejectionText = json(path.join(packageRoot, "source/error-frame-review-contract.json")).candidates.find((frame) => frame.message_id === "order_not_accepted")?.text;
  assert(Boolean(rejected) && !rejected.nodes.some((node) => node.id === "generation-started"), "данные не приняты: сообщение начала формирования должно быть заменено ошибкой");
  assert(rejected.nodes.find((node) => node.id === "order-not-accepted")?.text.replaceAll("\n", " ") === rejectionText, "данные не приняты: текст должен совпадать с утверждённым договором ошибки");
  const knownStateIds = new Set([...contract.phone_state_ids, ...contract.external_state_ids]);
  for (const transition of contract.scenario_transitions) assert(knownStateIds.has(transition.from) && knownStateIds.has(transition.to), `переход ${transition.event} ведёт к неизвестному состоянию`);
  for (const stateId of contract.viewer_navigation.frame_sequence) assert(knownStateIds.has(stateId), `последовательность просмотра содержит неизвестный кадр ${stateId}`);
  for (const state of runtime.externalStates) {
    const rule = contract.external_state_rules[state.id];
    assert(rule && state.contentType === rule.content_type && state.pageCount === rule.page_count && state.assetFormat === rule.asset_format && JSON.stringify(state.assetPaths) === JSON.stringify(rule.runtime_asset_paths) && JSON.stringify(state.intrinsicPage) === JSON.stringify(rule.intrinsic_page), `${state.id}: потеряно правило внешнего кадра`);
    assert(Array.isArray(state.assetPaths) && state.assetPaths.length === state.pageCount, `${state.id}: число ресурсов не равно числу страниц`);
  }
  const styles = read(path.join(candidateRoot, "styles.css")); const app = read(path.join(candidateRoot, "app.js")); const html = read(path.join(candidateRoot, "index.html"));
  assert(/container-type:\s*size/u.test(styles) && /100cqi/u.test(styles) && /100cqb/u.test(styles), "размер телефона должен вычисляться из контейнера");
  assert(!/phone-shell::|100dvh|100dvw|transform:\s*scale/iu.test(styles), "в стилях осталась приблизительная геометрия или запрещённый масштаб");
  assert(/makePhoneAssembly/u.test(app) && !/innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function/u.test(app), "рантайм обязан собирать безопасный DOM из векторной геометрии");
  assert(/viewerNavigation/u.test(app) && !/state\.id === "lisa-presentation-sent"/u.test(app), "переход в список чатов должен следовать договору, а не одному экрану");
  assert(/viewerShell/u.test(app) && /isEditableTarget/u.test(app), "оболочка и защита поля ввода должны обрабатываться рантаймом");
  assert(/phone-panel-hidden/u.test(styles) && /external-overlay/u.test(styles), "стили должны отделять телефонную панель от внешнего оверлея");
  assert(/default-src 'none'; base-uri 'none'; connect-src 'none'; form-action 'none'; frame-src 'none'; img-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'/u.test(html), "страница должна сохранять полный запрет сети и внешних источников");
  assert(html.includes('<title id="viewer-document-title"></title>') && html.includes('<h1 id="viewer-title"></h1>') && html.includes('<p id="viewer-subtitle" data-testid="review-subtitle"></p>'), "HTML обязан содержать только структурные узлы договорной оболочки");
  assert(/<aside[^>]+aria-labelledby="viewer-title"/u.test(html), "панель должна получать доступное имя от договорного заголовка");
  assert(!/Черновик браузерного телефона Лисы|Черновик для покадровой приёмки|Панель приёмки черновика/u.test(html), "устаревшие тексты оболочки запрещены");
  const seriesPath = path.join(candidateRoot, "external-4k-series-review/series-manifest.json");
  assert(fs.existsSync(seriesPath), "не подготовлен манифест внешней 4K-серии");
  const series = json(seriesPath);
  const seriesApprovalPath = safeSourcePath(contract.external_asset_profile.series_review.owner_approval_path, "решение по внешней 4K-серии");
  const seriesApproval = json(seriesApprovalPath);
  assert(seriesApproval.decision === "approved" && JSON.stringify(seriesApproval.approved_scope) === JSON.stringify(contract.external_state_ids), "решение владельца не подтверждает полный состав внешней 4K-серии");
  assert(series.status === contract.external_asset_profile.series_review.status && series.owner_decision === "approved" && series.source_paths_stored === false && series.raw_pdf_served_by_demo === false && series.active_release_mutation_prohibited === true, "манифест внешней 4K-серии нарушает границу чистового выпуска");
  assert(manifest.external_asset_series_sha256 === sha(read(seriesPath)), "манифест кандидата не соответствует серии внешних 4K-ресурсов");
  assert(manifest.candidate_fingerprint?.algorithm === "sha256" && /^[a-f0-9]{64}$/u.test(manifest.candidate_fingerprint?.sha256 || ""), "манифест чистового прототипа не содержит отпечаток кандидата");
  assert(!JSON.stringify(series).includes("/Users/") && !JSON.stringify(series).includes("file://"), "серия внешних 4K-ресурсов раскрывает локальный путь");
  assert(Array.isArray(series.assets) && series.assets.length === runtime.externalStates.length, "манифест внешней 4K-серии неполон");
  for (const state of runtime.externalStates) {
    const asset = series.assets.find((candidate) => candidate.state_id === state.id);
    assert(asset && asset.asset_format === state.assetFormat && JSON.stringify(asset.runtime_asset_paths) === JSON.stringify(state.assetPaths) && JSON.stringify(asset.intrinsic_page) === JSON.stringify(state.intrinsicPage), `${state.id}: серия внешних ресурсов расходится с DOM-моделью`);
    assert(Object.keys(manifest.external_asset_sha256[state.id] || {}).length === state.assetPaths.length, `${state.id}: манифест кандидата не покрывает все внешние ресурсы`);
    for (const [index, assetPath] of state.assetPaths.entries()) {
      const candidate = safeCandidatePath(assetPath, `${state.id}: путь ресурса`);
      assert(fs.existsSync(candidate), `${state.id}: внешний ресурс отсутствует`);
      assert(asset.runtime_asset_sha256[index] === sha(fs.readFileSync(candidate)), `${state.id}: хэш серии внешних ресурсов устарел`);
      assert(manifest.external_asset_sha256[state.id][assetPath] === sha(fs.readFileSync(candidate)), `${state.id}: хэш кандидата внешнего ресурса устарел`);
      if (state.assetFormat === "png") inspectPng(candidate, state.intrinsicPage);
      else assertSafeExternalSvg(read(candidate), `${state.id}: ресурс`);
    }
    const reviewAsset = safeCandidatePath(asset.review_asset_path, `${state.id}: PNG приёмки`);
    assert(fs.existsSync(reviewAsset) && asset.review_asset_sha256 === sha(fs.readFileSync(reviewAsset)), `${state.id}: PNG приёмки отсутствует или повреждён`);
    inspectPng(reviewAsset, asset.review_dimensions);
  }
  for (const legacyPath of ["assets/lisa-presentation-email.png", "assets/lisa-presentation-slidedoc.png", "assets/lisa-presentation-sber2025.png", "assets/lisa-presentation-mag.png"]) assert(!fs.existsSync(path.join(candidateRoot, legacyPath)), "в кандидате остался устаревший низкокачественный внешний PNG");
  process.stdout.write("Браузерный кандидат телефона проверен.\n");
}
main();
