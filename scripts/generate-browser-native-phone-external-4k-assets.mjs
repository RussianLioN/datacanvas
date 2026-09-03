import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { inspectPng } from "./render-lisa-full-reference-review-draft.mjs";

const root = path.resolve(import.meta.dirname, "..");
const packageRoot = path.join(root, "docs/product/analysis/presentation-link-lisa-user-journey");
const sourceRoot = path.join(packageRoot, "source");
const browserSourceRoot = path.join(sourceRoot, "browser-native-phone-prototype");
const candidateRoot = path.join(packageRoot, "candidate-evidence/browser-native-phone-prototype");
const contractPath = path.join(browserSourceRoot, "browser-native-phone-prototype-contract.json");
const maxPdfBytes = 32 * 1024 * 1024;
const renderTimeoutMs = 120_000;
const legacyRuntimeAssets = [
  "assets/lisa-presentation-email.png",
  "assets/lisa-presentation-slidedoc.png",
  "assets/lisa-presentation-sber2025.png",
  "assets/lisa-presentation-mag.png",
];

const fail = (message) => { throw new Error(`browser-native-phone-external-4k: ${message}`); };
const json = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sha256File = (filePath) => sha256(fs.readFileSync(filePath));

function relativePath(value, label) {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value) || value.includes("\\") || value.split("/").includes("..")) {
    fail(`${label}: небезопасный относительный путь`);
  }
  return value;
}

function safeJoin(base, value, label) {
  const relative = relativePath(value, label);
  const target = path.resolve(base, relative);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) fail(`${label}: путь выходит за границу кандидата`);
  return target;
}

function safePackageJoin(base, value, label) {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value) || value.includes("\\")) fail(`${label}: небезопасный путь`);
  const target = path.resolve(base, value);
  if (!target.startsWith(`${packageRoot}${path.sep}`)) fail(`${label}: путь выходит за границу пакета`);
  return target;
}

function assertSafeSvg(source, label) {
  if (/<(?:script|foreignObject|image|use)\b|<!DOCTYPE|<!ENTITY|\s(?:href|src)\s*=|\son[a-z]+\s*=|url\s*\(\s*(?!#)/iu.test(source)) {
    fail(`${label}: SVG содержит запрещённый узел, обработчик или внешнюю ссылку`);
  }
  const rootTag = /<svg\b([^>]*)>/iu.exec(source);
  if (!rootTag || !/\bviewBox="0 0 1280 960"/u.test(rootTag[1])) fail(`${label}: SVG должен сохранять канонический холст 1280×960`);
}

function rendererCommand() {
  const candidates = ["/opt/homebrew/bin/rsvg-convert", "/usr/local/bin/rsvg-convert", "/usr/bin/rsvg-convert", "rsvg-convert"];
  for (const candidate of candidates) if (spawnSync(candidate, ["--version"], { encoding: "utf8" }).status === 0) return candidate;
  fail("не найден rsvg-convert для контролируемого 4K-рендера письма");
}

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    timeout: renderTimeoutMs,
    killSignal: "SIGKILL",
    maxBuffer: 1024 * 1024,
  });
  if (result.error?.code === "ETIMEDOUT") fail(`${label}: превышено время контролируемого преобразования`);
  if (result.error || result.status !== 0) fail(`${label}: ${(result.stderr || result.stdout || result.error?.message || "неизвестная ошибка").trim()}`);
}

function parseArguments(argumentsList) {
  const options = { check: false, sourceDir: null };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--source-dir" && argumentsList[index + 1]) options.sourceDir = argumentsList[++index];
    else fail("использование: node scripts/generate-browser-native-phone-external-4k-assets.mjs [--check | --source-dir <каталог-pdf>]");
  }
  if (options.check === Boolean(options.sourceDir)) fail("для проверки используйте --check, для подготовки — только --source-dir <каталог-pdf>");
  return options;
}

function readContract() {
  const contract = json(contractPath);
  const profile = contract.external_asset_profile;
  const review = profile?.series_review;
  if (!profile || contract.release_boundary?.high_resolution_release_allowed !== true || contract.release_boundary?.active_release_switch_allowed !== true || contract.release_boundary?.archive_update_allowed !== true || review?.status !== "owner_series_approved" || review.active_release_switch_allowed !== true) {
    fail("договор не фиксирует чистовой выпуск внешней 4K-серии");
  }
  const approval = json(safePackageJoin(browserSourceRoot, review.owner_approval_path, "решение владельца по внешней 4K-серии"));
  if (approval.change_order_id !== contract.change_order_id || approval.series_id !== "browser-native-phone-external-4k" || approval.decision !== "approved" || JSON.stringify(approval.approved_scope) !== JSON.stringify(contract.external_state_ids)) {
    fail("решение владельца не подтверждает полный состав внешней 4K-серии");
  }
  return contract;
}

function expectedStates(contract) {
  const expected = contract.external_state_ids.map((stateId) => {
    const rule = contract.external_state_rules[stateId];
    if (!rule || !Array.isArray(rule.runtime_asset_paths) || rule.runtime_asset_paths.length !== rule.page_count) fail(`${stateId}: договор внешнего ресурса неполон`);
    for (const assetPath of rule.runtime_asset_paths) relativePath(assetPath, `${stateId}: путь runtime-ресурса`);
    return { stateId, ...rule };
  });
  const email = expected.find((state) => state.content_type === "email");
  if (!email || email.asset_format !== "svg" || email.page_count !== 1) fail("договор не закрепляет векторное письмо");
  if (expected.filter((state) => state.content_type === "presentation").some((state) => state.asset_format !== "png" || state.page_count !== 3)) fail("договор не закрепляет три независимые PNG-страницы презентации");
  return expected;
}

function approvedPdfFiles(sourceDir, contract, states) {
  const sourceDirectory = fs.realpathSync(sourceDir);
  const pdfContractPath = safePackageJoin(browserSourceRoot, contract.external_asset_profile.presentations.source_contract_path, "договор PDF");
  const pdfContract = json(pdfContractPath);
  const profile = pdfContract.browser_native_4k_candidate;
  if (!profile || profile.series_review_authorized_by_owner !== true || profile.active_release_mutation_prohibited !== true) {
    fail("договор PDF не разрешает контролируемую 4K-отрисовку из исходных PDF");
  }
  const presentations = states.filter((state) => state.content_type === "presentation").map((state) => {
    const variant = pdfContract.variants?.find((candidate) => candidate.frame_id === state.stateId);
    if (!variant) fail(`${state.stateId}: не найден утверждённый вариант PDF`);
    const sourceFileName = variant.source_file_name;
    const sourcePath = path.resolve(sourceDirectory, sourceFileName);
    if (!sourcePath.startsWith(`${sourceDirectory}${path.sep}`)) fail(`${state.stateId}: PDF выходит за каталог источника`);
    const stat = fs.lstatSync(sourcePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > maxPdfBytes) fail(`${state.stateId}: PDF должен быть обычным файлом допустимого размера`);
    if (sha256File(sourcePath) !== variant.source_pdf_sha256) fail(`${state.stateId}: SHA-256 входного PDF не совпадает с договором`);
    return { state, variant, sourcePath };
  });
  return { pdfContract, presentations };
}

function renderEmail(contract, destination) {
  const profile = contract.external_asset_profile.email;
  const sourcePath = safePackageJoin(browserSourceRoot, profile.source_svg_path, "SVG письма");
  const source = fs.readFileSync(sourcePath, "utf8");
  if (sha256(source) !== profile.source_svg_sha256) fail("SVG письма отличается от принятого источника");
  assertSafeSvg(source, "SVG письма");
  const runtimePath = path.join(destination.runtimeRoot, relativePath(profile.runtime_asset_path, "ресурс письма"));
  fs.mkdirSync(path.dirname(runtimePath), { recursive: true });
  fs.copyFileSync(sourcePath, runtimePath);
  const reviewPath = path.join(destination.reviewRoot, path.basename(profile.review_raster_path));
  run(rendererCommand(), ["-w", String(profile.review_raster_dimensions.width), "-h", String(profile.review_raster_dimensions.height), "-f", "png", sourcePath, "-o", reviewPath], "SVG письма не преобразован в 4K PNG");
  inspectPng(reviewPath, profile.review_raster_dimensions);
  return {
    state_id: "lisa-presentation-email",
    content_type: "email",
    asset_format: "svg",
    runtime_asset_paths: [profile.runtime_asset_path],
    runtime_asset_sha256: [sha256File(runtimePath)],
    intrinsic_page: profile.runtime_intrinsic_dimensions,
    review_asset_path: profile.review_raster_path,
    review_asset_sha256: sha256File(reviewPath),
    review_dimensions: profile.review_raster_dimensions,
    source_svg_sha256: profile.source_svg_sha256,
  };
}

function renderPresentation(contract, descriptor, destination) {
  const { state, variant, sourcePath } = descriptor;
  const profile = contract.external_asset_profile.presentations;
  const rendererPath = safeJoin(root, profile.renderer_path, "отрисовщик PDF");
  const runtimePaths = [];
  const runtimeHashes = [];
  for (let pageIndex = 1; pageIndex <= state.page_count; pageIndex += 1) {
    const assetPath = state.runtime_asset_paths[pageIndex - 1];
    const destinationPath = path.join(destination.runtimeRoot, relativePath(assetPath, `${state.stateId}: путь страницы`));
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    run("swift", [rendererPath, "--input", sourcePath, "--output", destinationPath, "--expected-pages", String(state.page_count), "--page-width", "960", "--page-height", "540", "--scale", String(profile.scale), "--page-index", String(pageIndex)], `${state.stateId}: страница ${pageIndex} не отрисована`);
    inspectPng(destinationPath, profile.runtime_page_dimensions);
    runtimePaths.push(assetPath);
    runtimeHashes.push(sha256File(destinationPath));
  }
  const reviewPath = path.join(destination.reviewRoot, `${state.stateId}-pages-3840x6480.png`);
  run("swift", [rendererPath, "--input", sourcePath, "--output", reviewPath, "--expected-pages", String(state.page_count), "--page-width", "960", "--page-height", "540", "--scale", String(profile.scale)], `${state.stateId}: серия страниц не отрисована`);
  inspectPng(reviewPath, profile.review_stack_dimensions);
  return {
    state_id: state.stateId,
    content_type: "presentation",
    asset_format: "png",
    runtime_asset_paths: runtimePaths,
    runtime_asset_sha256: runtimeHashes,
    intrinsic_page: profile.runtime_page_dimensions,
    review_asset_path: path.posix.join(profile.review_directory, path.basename(reviewPath)),
    review_asset_sha256: sha256File(reviewPath),
    review_dimensions: profile.review_stack_dimensions,
    source_file_name: variant.source_file_name,
    source_pdf_sha256: variant.source_pdf_sha256,
  };
}

function seriesManifest(contract, assets) {
  return {
    "$schema": "../../../source/schemas/browser-native-phone-external-asset-series.schema.json",
    "version": "1.0.0",
    "status": contract.external_asset_profile.series_review.status,
    "series_id": "browser-native-phone-external-4k",
    "owner_decision": "approved",
    "source_paths_stored": false,
    "raw_pdf_served_by_demo": false,
    "active_release_mutation_prohibited": true,
    "assets": assets,
  };
}

function writeReviewReadme(contract, assets, destination) {
  const lines = [
    "# Серия внешних экранов 4K для приёмки",
    "",
    "Статус: серия из четырёх внешних 4K-кадров принята владельцем как часть чистового браузерного прототипа.",
    "",
    "## Материалы",
    "",
  ];
  for (const asset of assets) {
    const label = asset.content_type === "email" ? "Письмо" : `Презентация: ${asset.state_id.replace("lisa-presentation-", "")}`;
    lines.push(`- [${label}](${asset.review_asset_path.replace("external-4k-series-review/", "")}) — ${asset.review_dimensions.width}×${asset.review_dimensions.height}.`);
  }
  lines.push("", "В интерактивном прототипе письмо загружается векторным SVG, а каждая презентация переключает независимую страницу PNG 3840×2160. Сырые PDF не включены, не публикуются и не доступны браузеру.", "");
  fs.writeFileSync(path.join(destination.reviewRoot, "README.md"), lines.join("\n"), "utf8");
}

function replaceDirectory(nextDirectory, destinationDirectory) {
  const backupDirectory = `${destinationDirectory}.previous-${process.pid}`;
  if (fs.existsSync(backupDirectory)) fs.rmSync(backupDirectory, { recursive: true, force: true });
  if (fs.existsSync(destinationDirectory)) fs.renameSync(destinationDirectory, backupDirectory);
  fs.renameSync(nextDirectory, destinationDirectory);
  if (fs.existsSync(backupDirectory)) fs.rmSync(backupDirectory, { recursive: true, force: true });
}

function checkAssets(contract, states) {
  const manifestPath = path.join(candidateRoot, "external-4k-series-review/series-manifest.json");
  if (!fs.existsSync(manifestPath)) fail("не подготовлен манифест внешней 4K-серии");
  const manifest = json(manifestPath);
  if (manifest.status !== contract.external_asset_profile.series_review.status || manifest.owner_decision !== "approved" || manifest.source_paths_stored !== false || manifest.raw_pdf_served_by_demo !== false || manifest.active_release_mutation_prohibited !== true) {
    fail("манифест внешней 4K-серии нарушает границу чистового выпуска");
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length !== states.length) fail("манифест внешней 4K-серии неполон");
  for (const state of states) {
    const asset = manifest.assets.find((candidate) => candidate.state_id === state.stateId);
    if (!asset || asset.asset_format !== state.asset_format || JSON.stringify(asset.runtime_asset_paths) !== JSON.stringify(state.runtime_asset_paths) || JSON.stringify(asset.intrinsic_page) !== JSON.stringify(state.intrinsic_page)) {
      fail(`${state.stateId}: манифест расходится с договором`);
    }
    for (const [index, assetPath] of state.runtime_asset_paths.entries()) {
      const destinationPath = safeJoin(candidateRoot, assetPath, `${state.stateId}: ресурс кандидата`);
      if (!fs.existsSync(destinationPath) || sha256File(destinationPath) !== asset.runtime_asset_sha256[index]) fail(`${state.stateId}: ресурс кандидата отсутствует или повреждён`);
      if (state.asset_format === "png") inspectPng(destinationPath, state.intrinsic_page);
      else assertSafeSvg(fs.readFileSync(destinationPath, "utf8"), `${state.stateId}: ресурс кандидата`);
    }
    const reviewPath = safeJoin(candidateRoot, asset.review_asset_path, `${state.stateId}: PNG для приёмки`);
    if (!fs.existsSync(reviewPath) || sha256File(reviewPath) !== asset.review_asset_sha256) fail(`${state.stateId}: PNG для приёмки отсутствует или повреждён`);
    inspectPng(reviewPath, asset.review_dimensions);
  }
  for (const legacyPath of legacyRuntimeAssets) if (fs.existsSync(path.join(candidateRoot, legacyPath))) fail("в кандидате остался устаревший низкокачественный внешний PNG");
  if (JSON.stringify(manifest).includes("/Users/") || JSON.stringify(manifest).includes("file://")) fail("манифест внешней 4K-серии содержит локальный путь");
  if (contract.release_boundary.high_resolution_release_allowed !== true || contract.release_boundary.active_release_switch_allowed !== true || contract.release_boundary.archive_update_allowed !== true) fail("внешняя 4K-серия не связана с разрешённым чистовым выпуском");
  return manifest;
}

function buildAssets(contract, states, sourceDir) {
  const descriptor = approvedPdfFiles(sourceDir, contract, states);
  const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), "browser-native-phone-external-4k-"));
  const nextRuntimeRoot = path.join(stagingRoot, "assets/external");
  const nextReviewRoot = path.join(stagingRoot, "external-4k-series-review");
  fs.mkdirSync(nextRuntimeRoot, { recursive: true });
  fs.mkdirSync(nextReviewRoot, { recursive: true });
  try {
    const destination = { runtimeRoot: path.join(stagingRoot), reviewRoot: nextReviewRoot };
    const assets = [renderEmail(contract, destination), ...descriptor.presentations.map((item) => renderPresentation(contract, item, destination))];
    const manifest = seriesManifest(contract, assets);
    fs.writeFileSync(path.join(nextReviewRoot, "series-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    writeReviewReadme(contract, assets, destination);
    replaceDirectory(nextRuntimeRoot, path.join(candidateRoot, "assets/external"));
    replaceDirectory(nextReviewRoot, path.join(candidateRoot, "external-4k-series-review"));
    for (const legacyPath of legacyRuntimeAssets) fs.rmSync(path.join(candidateRoot, legacyPath), { force: true });
    return checkAssets(contract, states);
  } finally {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
  }
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const contract = readContract();
  const states = expectedStates(contract);
  const manifest = options.check ? checkAssets(contract, states) : buildAssets(contract, states, options.sourceDir);
  process.stdout.write(options.check
    ? `Внешняя 4K-серия актуальна: ${manifest.status}\n`
    : `Внешняя 4K-серия подготовлена: ${manifest.status}\n`);
}

main();
