import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  loadContracts,
  validateContracts,
  validateGeneratedPackage,
} from "../scripts/lib/presentation-link-lisa-user-journey.mjs";
import {
  CANONICAL_RASTER_DIAGNOSTIC_RELATIVE_PATH,
  captureCanonicalRasterSet,
} from "../scripts/lib/presentation-link-lisa-canonical-raster.mjs";
import { readStoredZip } from "../scripts/lib/documentation-archive.mjs";
import {
  DEFAULT_FULL_PACKAGE_TOOLCHAIN_PATHS,
  runFullPackageReleaseTransaction,
} from "../scripts/lib/presentation-link-lisa-full-package-transaction.mjs";
import { resolveEvidenceRoots } from "../scripts/validate-presentation-link-lisa-user-journey-evidence.mjs";

const root = process.cwd();
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const packageRoot = process.env.LISA_PROTOTYPE_PACKAGE_ROOT
  ? path.resolve(process.env.LISA_PROTOTYPE_PACKAGE_ROOT)
  : path.join(root, packagePath);
const activeContractsRelativePath = `${packagePath}/source/active-contracts.json`;
const scopeRelativePath = `${packagePath}/source/prototype-scope-contract.json`;
const sourceFixtureRelativePath = `${packagePath}/source/source-fixture-manifest.json`;
const journeyRelativePath = `${packagePath}/source/journey-contract.json`;
const packageContractRelativePath = `${packagePath}/source/prototype-package-contract.json`;
const activeContractIds = [
  "scope",
  "fixture",
  "source-catalog",
  "journey",
  "frames",
  "visual",
  "visual-basis",
  "package",
];
const canonicalViewportDefinitions = [
  {
    id: "desktop-1280x720",
    width: 1280,
    height: 720,
    png_path_format: "evidence/screenshots/webkit/desktop-1280x720/{state_id}.png",
  },
  {
    id: "mobile-390x844",
    width: 390,
    height: 844,
    png_path_format: "evidence/screenshots/webkit/mobile-390x844/{state_id}.png",
  },
  {
    id: "stress-320x568",
    width: 320,
    height: 568,
    png_path_format: "evidence/screenshots/webkit/stress-320x568/{state_id}.png",
  },
];
const runtimeRequiredChecks = ["behavior", "accessibility", "geometry", "network"];
const canonicalRasterManifestRelativePath =
  "derived/canonical-raster-manifest.json";
const candidateFingerprintInputScopes = Object.freeze({
  active_contracts: "active-contract",
  generated_html: "generated",
  registered_source_assets: "source-asset",
  capture_toolchain: "toolchain",
});
const expectedCaptureToolWarnings = Object.freeze([
  Object.freeze({
    classification: "playwright-webkit-screenshot-inline-style",
    message:
      "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.",
    count: 1,
  }),
]);
const forbiddenActiveSurfaces = [
  "result-link",
  "presentation-viewer",
  "notification-center",
  "presentation-editing",
  "pdf-file-surface",
  "pptx-file-surface",
];
const newWorkbookSha256 =
  "e4cd5a60e2b1b1df2b99978d20c6047d6590368e13d23bc4cd455de4151e1cdf";
const visualArchiveSha256 =
  "b755549c84e059b8d999fcc12e55f6c3903aafe549935b90f2f1b84bb7852026";
const legacyStateFragments = [
  "lisa-presentation-ready",
  "lisa-notification",
  "lisa-result-view",
  "lisa-returned-to-chat",
  "lisa-link-",
  "lisa-access-denied",
  "lisa-offline",
  "lisa-presentation-email",
];

function absolute(relativePath) {
  if (process.env.LISA_PROTOTYPE_PACKAGE_ROOT && relativePath.startsWith(`${packagePath}/`)) {
    return path.join(packageRoot, relativePath.slice(`${packagePath}/`.length));
  }
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  assert.ok(fs.existsSync(absolute(relativePath)), `Отсутствует обязательный файл: ${relativePath}`);
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function collectStrings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((item) => collectStrings(item));
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap((item) => collectStrings(item));
}

function readActiveContracts() {
  const registry = readJson(activeContractsRelativePath);
  assert.ok(
    Array.isArray(registry.active_contracts),
    "Активный реестр должен содержать массив active_contracts",
  );
  return registry;
}

function contractEntry(registry, id) {
  const entry = registry.active_contracts.find((candidate) => candidate.id === id);
  assert.ok(entry, `В активном реестре отсутствует договор ${id}`);
  assert.equal(typeof entry.path, "string", `${id}: не задан относительный path`);
  assert.equal(path.isAbsolute(entry.path), false, `${id}: path должен быть относительным`);
  return entry;
}

function readRegisteredContract(registry, id) {
  return readJson(`${packagePath}/${contractEntry(registry, id).path}`);
}

function activeStateIdsFromRegistry(registry = readActiveContracts()) {
  const stateIds = registry.active_state_ids;
  const journey = readRegisteredContract(registry, "journey");

  assert.ok(Array.isArray(stateIds), "Реестр обязан содержать active_state_ids");
  assert.equal(stateIds.length, 20, "В активном MVP ожидаются 20 состояний P1/P2");
  assert.equal(new Set(stateIds).size, stateIds.length, "active_state_ids не должен содержать дубликатов");
  assert.deepEqual(
    stateIds,
    journey.states.map((state) => state.id),
    "Порядок состояний определяется активным реестром, а не списком в тесте",
  );
  return stateIds;
}

function cloneLoadedContracts(contracts) {
  const clone = structuredClone(contracts);
  Object.defineProperties(clone, {
    __root: { value: contracts.__root, enumerable: false },
    __descriptors: { value: structuredClone(contracts.__descriptors), enumerable: false },
  });
  return clone;
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(target) : [target];
  });
}

function formatStatePath(pathFormat, stateId) {
  assert.equal(
    pathFormat.split("{state_id}").length - 1,
    1,
    `Формат пути должен содержать ровно один {state_id}: ${pathFormat}`,
  );
  return pathFormat.replace("{state_id}", stateId);
}

function expectedCanonicalRasterPaths(packageContract, states) {
  assert.ok(Array.isArray(states), "Для матрицы растров требуется активный реестр состояний");
  const matrix = packageContract.outputs?.published_raster_matrix;
  assert.ok(Array.isArray(matrix), "Договор должен содержать published_raster_matrix");
  assert.equal(matrix.length, 1, "Канонический опубликованный растр создаёт только WebKit");
  const [entry] = matrix;
  assert.equal(entry.browser, "webkit");
  return entry.viewports.flatMap((viewport) =>
    states.map((stateId) => formatStatePath(viewport.png_path_format, stateId)),
  );
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertCandidateFingerprint(value, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label}: объект отсутствует`);
  assert.deepEqual(Object.keys(value).sort(), ["algorithm", "inputs", "sha256"]);
  assert.equal(value.algorithm, "sha256", `${label}: разрешён только sha256`);
  assert.match(value.sha256, /^[a-f0-9]{64}$/u, `${label}: неверный SHA-256`);
  assert.ok(value.inputs && typeof value.inputs === "object" && !Array.isArray(value.inputs));
  assert.deepEqual(
    Object.keys(value.inputs).sort(),
    Object.keys(candidateFingerprintInputScopes).sort(),
    `${label}: набор входов не соответствует договору`,
  );
  for (const [inputType, scope] of Object.entries(candidateFingerprintInputScopes)) {
    const records = value.inputs[inputType];
    assert.ok(Array.isArray(records) && records.length > 0, `${label}: ${inputType} пуст`);
    const paths = records.map((record) => record.path);
    assert.deepEqual(
      paths,
      [...paths].sort((left, right) => left.localeCompare(right, "en")),
      `${label}: ${inputType} должен быть отсортирован по относительному пути`,
    );
    assert.equal(new Set(paths).size, paths.length, `${label}: ${inputType} содержит дубликат пути`);
    for (const record of records) {
      assert.deepEqual(Object.keys(record).sort(), ["bytes", "path", "scope", "sha256"]);
      assert.equal(record.scope, scope, `${label}: ${record.path}: неверная область входа`);
      assert.equal(typeof record.path, "string");
      assert.equal(path.isAbsolute(record.path), false, `${label}: абсолютный путь запрещён`);
      assert.doesNotMatch(record.path, /(?:^|\/)\.\.?\/|\\|file:\/\/|\/Users\/|@|^test-results\//u);
      assert.ok(Number.isInteger(record.bytes) && record.bytes > 0, `${label}: ${record.path}: размер`);
      assert.match(record.sha256, /^[a-f0-9]{64}$/u, `${label}: ${record.path}: SHA-256`);
    }
  }
}

function assertCaptureToolWarnings(rendererProfile, label) {
  assert.ok(rendererProfile && typeof rendererProfile === "object", `${label}: отсутствует renderer_profile`);
  assert.deepEqual(
    rendererProfile.capture_tool_warnings,
    expectedCaptureToolWarnings,
    `${label}: допустимо только одно точное предупреждение Playwright о внутреннем stylesheet`,
  );
}

function readPngDimensions(bytes, label) {
  assert.ok(Buffer.isBuffer(bytes), `${label}: PNG должен быть Buffer`);
  assert.ok(
    bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
    `${label}: неверная сигнатура PNG`,
  );
  assert.ok(bytes.length >= 24, `${label}: PNG слишком короткий`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function activeReleaseTexts() {
  const paths = [
    path.join(packageRoot, "demo/index.html"),
    path.join(packageRoot, "demo/app.js"),
    path.join(packageRoot, "demo/data.js"),
    path.join(packageRoot, "demo/styles.css"),
    path.join(packageRoot, "derived/projection-map.json"),
    path.join(packageRoot, canonicalRasterManifestRelativePath),
    path.join(packageRoot, "derived/prototype-package-manifest.json"),
  ].filter((candidate) => fs.existsSync(candidate));
  return paths.map((candidate) => ({
    path: path.relative(root, candidate),
    text: fs.readFileSync(candidate, "utf8"),
  }));
}

function publicationSnapshot() {
  return listFiles(packageRoot)
    .map((filePath) => path.relative(packageRoot, filePath).split(path.sep).join("/"))
    .filter((relativePath) => /^(?:demo|derived|evidence)\//u.test(relativePath))
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((relativePath) => ({
      path: relativePath,
      sha256: sha256Bytes(fs.readFileSync(path.join(packageRoot, relativePath))),
    }));
}

function runGeneratorCli(args) {
  return spawnSync(
    process.execPath,
    [path.join(root, "scripts/generate-presentation-link-lisa-user-journey.mjs"), ...args],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 2 * 1024 * 1024,
    },
  );
}

function copyFullReleaseToolchain(destinationRoot) {
  for (const relativePath of DEFAULT_FULL_PACKAGE_TOOLCHAIN_PATHS) {
    const sourcePath = path.join(root, relativePath);
    const destinationPath = path.join(destinationRoot, relativePath);
    assert.ok(fs.existsSync(sourcePath), `Отсутствует инструмент полного выпуска: ${relativePath}`);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function assertDeferredPreviewIsAbsentFromGeneratedCandidate({
  releaseRoot,
  previewPayload,
  label,
}) {
  const generatedPackageRoot = path.join(releaseRoot, packagePath);
  const demoDirectory = path.join(generatedPackageRoot, "demo");
  const forbiddenSurface = /presentation-preview|lisa-presentation-ready|lisa-result-view|notification|viewer/u;
  const previewBytes = Buffer.from(previewPayload, "utf8");
  for (const filename of ["index.html", "app.js", "data.js", "styles.css"]) {
    const target = path.join(demoDirectory, filename);
    assert.ok(fs.existsSync(target), `${label}: отсутствует заново созданный demo/${filename}`);
    const content = fs.readFileSync(target, "utf8");
    assert.doesNotMatch(content, forbiddenSurface, `${label}: demo/${filename} содержит P3/P4-поверхность`);
    assert.equal(
      Buffer.from(content, "utf8").includes(previewBytes),
      false,
      `${label}: demo/${filename} содержит повреждённый неактивный договор`,
    );
  }

  const archivePath = path.join(
    generatedPackageRoot,
    "derived/lisa-presentation-user-journey-demo.zip",
  );
  assert.ok(fs.existsSync(archivePath), `${label}: отсутствует заново созданный ZIP`);
  const archive = readStoredZip(fs.readFileSync(archivePath));
  const demoIndex = archive.get("demo/index.html");
  assert.ok(demoIndex, `${label}: ZIP не содержит заново созданный demo/index.html`);
  assert.ok(
    demoIndex.equals(fs.readFileSync(path.join(demoDirectory, "index.html"))),
    `${label}: ZIP не соответствует заново созданному demo/index.html`,
  );
  for (const [memberPath, content] of archive) {
    assert.doesNotMatch(memberPath, forbiddenSurface, `${label}: ZIP содержит P3/P4-файл ${memberPath}`);
    assert.equal(
      content.includes(previewBytes),
      false,
      `${label}: ZIP содержит повреждённый неактивный договор в ${memberPath}`,
    );
    if (/\.(?:html|js|css|json|md)$/u.test(memberPath)) {
      assert.doesNotMatch(
        content.toString("utf8"),
        forbiddenSurface,
        `${label}: ZIP содержит P3/P4-поверхность в ${memberPath}`,
      );
    }
  }
}

test("активный реестр содержит восемь договоров MVP, двадцать состояний P1/P2 и одну отложенную Q4-запись", () => {
  const registry = readActiveContracts();
  const active = registry.active_contracts;
  const inactive = registry.inactive_contracts;
  const activeStateIds = activeStateIdsFromRegistry(registry);

  assert.deepEqual(active.map((entry) => entry.id), activeContractIds);
  assert.deepEqual(registry.active_state_ids, activeStateIds);
  assert.deepEqual(registry.bootstrap_contract.id, "package");
  assert.deepEqual(registry.forbidden_active_surfaces, forbiddenActiveSurfaces);
  assert.deepEqual(inactive.map((entry) => entry.id), ["presentation-preview"]);
  assert.equal(inactive[0].status, "deferred-q4");
  assert.match(JSON.stringify(registry.future_scope), /Q4/u);
  assert.match(JSON.stringify(registry.future_scope), /P3/u);
  assert.match(JSON.stringify(registry.future_scope), /P4/u);
  assert.match(JSON.stringify(registry.future_scope), /preserved-not-rendered/u);

  for (const entry of active) {
    assert.doesNotMatch(entry.path, /presentation-preview|notification|viewer/u);
  }
});

test("реестр активных состояний управляет проверкой пути, а не параллельный список в коде", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-registry-states-"));
  try {
    fs.mkdirSync(path.join(temporaryRoot, "docs/product/analysis"), { recursive: true });
    fs.cpSync(packageRoot, path.join(temporaryRoot, packagePath), { recursive: true });
    const registryPath = path.join(temporaryRoot, activeContractsRelativePath);
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    registry.active_state_ids = [...activeStateIdsFromRegistry(readActiveContracts())].reverse();
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");

    const issues = validateContracts(temporaryRoot, loadContracts(temporaryRoot));
    assert.ok(
      issues.some((issue) => /реестр.*состояни|состояни.*реестр|активн.*состояни|состояни.*активн|пут[ьи].*состояни/u.test(issue)),
      `изменение порядка в реестре должно блокировать путь, получено: ${issues.join(" | ")}`,
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("основной CLI допускает только полный транзакционный выпуск, проверку или восстановление", () => {
  const source = fs.readFileSync(
    path.join(root, "scripts/generate-presentation-link-lisa-user-journey.mjs"),
    "utf8",
  );

  assert.match(source, /runFullPackageReleaseTransaction\(/u);
  assert.match(source, /recoverFullPackageReleaseTransaction\(/u);
  assert.match(source, /compareGeneratedPackage\(root\)/u);
  assert.match(source, /validateGeneratedPackage\(root, root\)/u);
  assert.match(source, /validateEvidencePackage\(/u);
  assert.match(
    source,
    /else if \(htmlOnlyMode\) \{\s*throw new Error\(\s*"частичная публикация HTML запрещена; используйте обычный запуск полного транзакционного выпуска",\s*\);\s*\}/u,
  );
  assert.doesNotMatch(source, /generateHtmlPrototype|generatePrototypePackage/u);
});

test("CLI блокирует старую частичную публикацию HTML и не меняет активный пакет", () => {
  const before = publicationSnapshot();
  const result = runGeneratorCli(["--html-only"]);
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0, output);
  assert.match(output, /частичная публикация HTML запрещена/u);
  assert.deepEqual(publicationSnapshot(), before);
});

test("CLI допускает только проверку HTML без публикации, когда явно передан --check", () => {
  const before = publicationSnapshot();
  const result = runGeneratorCli(["--html-only", "--check"]);
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.signal, null, output);
  assert.equal(result.status, 0, output);
  assert.match(output, /HTML outputs are current/u);
  assert.doesNotMatch(output, /full package published by recoverable switch/u);
  assert.deepEqual(publicationSnapshot(), before);
});

test("только CLI --check разрешает проверять активный пакет, не ослабляя защиту кандидата", () => {
  const source = fs.readFileSync(
    path.join(root, "scripts/generate-presentation-link-lisa-user-journey.mjs"),
    "utf8",
  );
  const activeEvidenceOptions = {
    toolchainRoot: root,
    contractRoot: root,
    packageRoot,
    evidenceRoot: path.join(packageRoot, "evidence"),
  };

  assert.equal(
    (source.match(/allowActivePackage:\s*true/g) || []).length,
    1,
    "CLI не должен открывать активный пакет несколькими ветками",
  );
  assert.match(
    source,
    /else if \(checkMode\) \{[\s\S]*?allowActivePackage:\s*true,[\s\S]*?requireCandidate:\s*false,/u,
    "явное разрешение активного пакета допустимо только в ветке --check",
  );
  assert.throws(
    () => resolveEvidenceRoots({ ...activeEvidenceOptions, allowActivePackage: false }),
    /операция кандидата не может подписывать активный пакет/u,
    "обычный путь валидатора обязан отклонять активный packageRoot",
  );
  const roots = resolveEvidenceRoots({ ...activeEvidenceOptions, allowActivePackage: true });
  assert.equal(roots.isActivePackage, true);
  assert.equal(roots.packageRoot, fs.realpathSync(packageRoot));
});

test("договор области MVP и манифест источника привязывают новую книгу без локального пути", () => {
  const scope = readJson(scopeRelativePath);
  const fixture = readJson(sourceFixtureRelativePath);
  const serializedScope = JSON.stringify(scope);
  const serializedFixture = JSON.stringify(fixture);

  assert.deepEqual(scope.implemented_priorities, ["P1", "P2"]);
  assert.deepEqual(scope.forbidden_active_surfaces, forbiddenActiveSurfaces);
  assert.deepEqual(scope.future_scope, {
    quarter: "Q4",
    priorities: ["P3", "P4"],
    disposition: "preserved-not-rendered",
  });
  assert.equal(scope.demonstration_context.not_my_client_control_visible, false);
  assert.match(serializedFixture, /datacanvas-backlog-draft-pshe-2026-08-11\.xlsx/u);
  assert.match(serializedFixture, /2026-08-11/u);
  assert.match(serializedFixture, new RegExp(newWorkbookSha256, "u"));
  assert.equal(fixture.product_backlog.raw_file_tracked, false);
  assert.equal(fixture.absolute_local_paths_stored, false);
  assert.match(serializedFixture, new RegExp(visualArchiveSha256, "u"));
  assert.equal(fixture.visual_reference_archive.embedded_raw_svg_allowed, false);
  assert.equal(fixture.visual_reference_archive.treatment, "rasterized-png-only");
  assert.doesNotMatch(`${serializedScope}\n${serializedFixture}`, /\/Users\/|file:\/\/|absPath/u);
});

test("зарегистрированная фикстура задаёт один, несколько и ноль результатов поиска и договорную ветку my/not-my", () => {
  const journey = readRegisteredContract(readActiveContracts(), "journey");
  assert.ok(journey.client_search, "Договор пути должен содержать client_search");
  const serialized = JSON.stringify(journey.client_search);
  const candidates = new Map(
    journey.client_search.candidates.map((candidate) => [candidate.id, candidate]),
  );
  const multiple = journey.client_search.cases.find((entry) => entry.id === "multiple-clients");
  const referenceAction = journey.actions.find(
    (action) => action.id === "show-preparation-reference",
  );

  for (const [id, query] of [
    ["single-client", "7700000000"],
    ["multiple-clients", "Достовалова"],
    ["no-client", "0000000000"],
  ]) {
    assert.match(serialized, new RegExp(id, "u"));
    assert.match(serialized, new RegExp(query, "u"));
  }
  assert.equal(candidates.get("client-dostovalova")?.relationship, "my");
  assert.equal(candidates.get("client-dostovalova-trade")?.relationship, "not-my");
  assert.deepEqual(multiple?.candidate_ids, ["client-dostovalova", "client-dostovalova-trade"]);
  assert.deepEqual(journey.client_search.forbidden_control_ids, ["not-my-client"]);
  assert.deepEqual(
    {
      availability: referenceAction?.availability,
      not_my_client_visibility: referenceAction?.not_my_client_visibility,
    },
    { availability: "my-client-only", not_my_client_visibility: "not-rendered" },
  );
  assert.ok(journey.invariants.includes("not-my-client-control-is-never-visible"));
  assert.ok(journey.invariants.includes("not-my-client-preparation-suggestion-is-not-rendered"));
  assert.doesNotMatch(serialized, /не мой клиент|недоступен|нет прав|причина отказа/iu);
  assert.doesNotMatch(serialized, /\/Users\/|file:\/\/|absPath|@/u);
});

test("договор пути получает двадцать состояний из активного реестра, направленные действия и две точные статусные реплики", () => {
  const registry = readActiveContracts();
  const journey = readRegisteredContract(registry, "journey");
  const activeStateIds = activeStateIdsFromRegistry(registry);
  const statesById = new Map(journey.states.map((state) => [state.id, state]));
  const actionsById = new Map(journey.actions.map((action) => [action.id, action]));

  assert.equal(journey.initial_state_id, "lisa-client-answer");
  assert.deepEqual(journey.states.map((state) => state.id), activeStateIds);
  assert.equal(activeStateIds.length, 20);
  assert.equal(
    statesById.get("lisa-presentation-generating")?.body,
    journey.copy.generation_started,
  );
  assert.equal(statesById.get("lisa-presentation-sent")?.body, journey.copy.presentation_sent);
  assert.deepEqual(statesById.get("lisa-presentation-order")?.action_ids, ["order-presentation"]);
  assert.deepEqual(statesById.get("lisa-presentation-generating")?.action_ids, []);
  assert.deepEqual(statesById.get("lisa-presentation-sent")?.action_ids, []);
  assert.deepEqual(actionsById.get("order-presentation")?.prototype_sequence, [
    { state_id: "lisa-presentation-generating", at_ms: 600 },
    { state_id: "lisa-presentation-sent", at_ms: 8000 },
  ]);
  assert.deepEqual(journey.prototype_timeline, {
    generation_started_at_ms: 600,
    clock_animation_ends_at_ms: 7600,
    ready_at_ms: 8000,
    direct_state_autoplay: false,
  });

  for (const state of journey.states) {
    assert.notEqual(state.kind, "viewer");
    assert.equal(state.kind.startsWith("notification"), false);
    assert.equal(hasOwn(state, "result_ref"), false);
    assert.equal(hasOwn(state, "notification_unread"), false);
  }
  for (const action of journey.actions) {
    assert.doesNotMatch(action.id, /view|notification|email|link|edit/u);
    assert.doesNotMatch(action.label, /PDF|PPTX|уведомлен|ссылк|редактир/iu);
  }
});

test("проверка договоров отклоняет P3/P4-поверхность в активной модели", () => {
  const baselineIssues = validateContracts(root, loadContracts(root));
  const contracts = cloneLoadedContracts(loadContracts(root));
  contracts.journey.states.push({
    id: "lisa-presentation-viewer",
    kind: "viewer",
    display_name: "Просмотр презентации",
    title: "Просмотр презентации",
    eyebrow: "P4",
    body: "Запрещённая поверхность",
    detail_lines: [],
    action_ids: [],
  });

  const issues = validateContracts(root, contracts);
  const newlyIntroducedIssues = issues.filter((issue) => !baselineIssues.includes(issue));
  assert.ok(
    newlyIntroducedIssues.some((issue) => /states|MVP|forbidden active surface|P3|P4|неактивн/u.test(issue)),
    `P3/P4-поверхность должна добавить ошибку проверки, получено: ${issues.join(" | ")}`,
  );
});

test("неактивный предпросмотр Q4 не участвует в новом полном кандидате, ZIP и опубликованной временной копии", async () => {
  const activePackageBefore = publicationSnapshot();
  const temporaryRoot = fs.mkdtempSync(path.join(root, ".datacanvas-lisa-active-contracts-"));
  const temporaryPackageRoot = path.join(temporaryRoot, packagePath);
  const previewPayload = "{P3P4-DEFERRED-PREVIEW-MUST-NOT-BE-LOADED}";
  let candidateChecked = false;
  try {
    fs.mkdirSync(path.join(temporaryRoot, "docs/product/analysis"), { recursive: true });
    fs.cpSync(packageRoot, temporaryPackageRoot, { recursive: true });
    copyFullReleaseToolchain(temporaryRoot);
    for (const generatedDirectory of ["demo", "derived", "evidence"]) {
      fs.rmSync(path.join(temporaryPackageRoot, generatedDirectory), {
        recursive: true,
        force: true,
      });
    }
    fs.writeFileSync(
      path.join(temporaryPackageRoot, "source/presentation-preview-contract.json"),
      previewPayload,
      "utf8",
    );

    const result = await runFullPackageReleaseTransaction({
      root: temporaryRoot,
      packageRoot: temporaryPackageRoot,
      toolchainPaths: DEFAULT_FULL_PACKAGE_TOOLCHAIN_PATHS,
      hooks: {
        afterCandidateBuilt({ candidate }) {
          candidateChecked = true;
          assert.notEqual(
            path.resolve(candidate.packageRoot),
            path.resolve(temporaryPackageRoot),
            "полный выпуск обязан собираться в отдельном кандидате до переключения",
          );
          assert.equal(
            fs.readFileSync(
              path.join(candidate.packageRoot, "source/presentation-preview-contract.json"),
              "utf8",
            ),
            previewPayload,
            "кандидат должен содержать повреждённый неактивный preview-договор",
          );
          assertDeferredPreviewIsAbsentFromGeneratedCandidate({
            releaseRoot: candidate.root,
            previewPayload,
            label: "временный полный кандидат",
          });
          assert.deepEqual(
            validateGeneratedPackage(candidate.root, candidate.root),
            [],
            "пакетный валидатор должен принять заново созданный полный кандидат",
          );
        },
      },
    });

    assert.equal(result.status, "COMMITTED");
    assert.equal(candidateChecked, true, "должен быть проверен временный полный кандидат");
    assertDeferredPreviewIsAbsentFromGeneratedCandidate({
      releaseRoot: temporaryRoot,
      previewPayload,
      label: "временная опубликованная копия",
    });
    assert.deepEqual(
      validateGeneratedPackage(temporaryRoot, temporaryRoot),
      [],
      "пакетный валидатор не должен читать повреждённый неактивный договор",
    );
    assert.deepEqual(
      publicationSnapshot(),
      activePackageBefore,
      "полная транзакция временной копии не должна публиковать ничего в активный пакет",
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("договор пакета задаёт единственный WebKit-растр, три независимых прогона и обязательную проверку обоих движков", () => {
  const activeStateIds = activeStateIdsFromRegistry();
  const packageContract = readJson(packageContractRelativePath);
  const reproducibility = packageContract.reproducibility;
  const canonicalRasterPolicy = reproducibility.canonical_raster_policy;
  const candidateFingerprint = reproducibility.candidate_fingerprint;
  const [publishedRaster] = packageContract.outputs.published_raster_matrix;
  const runtimeMatrix = packageContract.evidence_outputs.runtime_validation_matrix;

  assert.equal(hasOwn(packageContract.outputs, "exact_count"), false);
  assert.equal(hasOwn(packageContract.evidence_outputs, "exact_count"), false);
  assert.equal(hasOwn(packageContract.archive, "exact_count"), false);
  assert.deepEqual(packageContract.outputs.fixed, [
    "demo/index.html",
    "demo/app.js",
    "demo/styles.css",
    "demo/data.js",
    "derived/projection-map.json",
    canonicalRasterManifestRelativePath,
    "derived/prototype-package-manifest.json",
    "derived/lisa-presentation-user-journey-demo.zip",
  ]);
  assert.equal(packageContract.outputs.state_source, "source/journey-contract.json#/states");
  assert.equal(hasOwn(packageContract.outputs, "state_formats"), false);
  assert.equal(hasOwn(packageContract.evidence_outputs, "matrix"), false);

  assert.deepEqual(candidateFingerprint, {
    algorithm: "sha256",
    scope: "full-candidate",
    active_contract_registry: "source/active-contracts.json",
    include_active_contracts: true,
    include_generated_html: true,
    include_registered_source_assets: true,
    include_capture_toolchain: true,
    relative_paths_only: true,
    must_match_all_repeats: true,
  });
  assert.deepEqual(canonicalRasterPolicy, {
    engine: "webkit",
    capture_method: "playwright-webkit-page-screenshot",
    renderer_profile: {
      capture_tool_warnings: expectedCaptureToolWarnings,
    },
    repeat_count: 3,
    independence: "separate-child-processes-and-browser-instances",
    comparison: "exact-byte-equality",
    normalization: "forbidden",
    publish_after_all_repeats_match: true,
    mismatch_action: "block",
    diagnostic_bundle: {
      path: "test-results/presentation-link-lisa-user-journey/raster-mismatch",
      must_be_gitignored: true,
      published: false,
      retained_on_success: false,
      members: [
        "candidate-fingerprint.json",
        "run-1",
        "run-2",
        "run-3",
        "sha256.json",
      ],
    },
    cross_platform_png_byte_identity_required: false,
  });
  assert.equal(
    hasOwn(canonicalRasterPolicy, "retry_or_majority_selection"),
    false,
    "Канонический выпуск не допускает повторную попытку вместо падения или выбор большинства",
  );

  assert.deepEqual(packageContract.outputs.published_raster_matrix.length, 1);
  assert.equal(publishedRaster.browser, "webkit");
  assert.equal(publishedRaster.state_selection, "all");
  assert.equal(publishedRaster.state_source, "source/journey-contract.json#/states");
  assert.deepEqual(publishedRaster.viewports, canonicalViewportDefinitions);
  const canonicalPaths = expectedCanonicalRasterPaths(packageContract, activeStateIds);
  assert.equal(canonicalPaths.length, activeStateIds.length * canonicalViewportDefinitions.length);
  assert.equal(new Set(canonicalPaths).size, canonicalPaths.length);
  assert.equal(canonicalPaths.some((item) => item.includes("chromium")), false);
  assert.ok(canonicalPaths.every((item) => item.startsWith("evidence/screenshots/webkit/")));

  assert.deepEqual(packageContract.outputs.svg_wrapper, {
    state_selection: "all",
    state_source: "source/journey-contract.json#/states",
    raster_viewport: "mobile-390x844",
    canonical_png_path_format:
      "evidence/screenshots/webkit/mobile-390x844/{state_id}.png",
    raster_png_path_format: "derived/screens/{state_id}.png",
    raster_png_byte_copy_of_canonical_required: true,
    svg_path_format: "derived/screens/{state_id}.svg",
    source_png_sha256_attribute: "data-capture-sha256",
    embedded_png_byte_equality_required: true,
  });

  assert.deepEqual(runtimeMatrix.map((entry) => entry.browser), ["chromium", "webkit"]);
  for (const entry of runtimeMatrix) {
    assert.equal(entry.state_selection, "all");
    assert.equal(entry.state_source, "source/journey-contract.json#/states");
    assert.deepEqual(entry.viewports, canonicalViewportDefinitions.map((viewport) => viewport.id));
    assert.deepEqual(entry.required_checks, runtimeRequiredChecks);
    assert.equal(entry.published_png, false);
    assert.equal(entry.retained_png, false);
  }
  assert.ok(Array.isArray(packageContract.archive.members));
  assert.equal(hasOwn(packageContract.archive, "exact_members"), false);
});

test("проверка договоров блокирует ослабление WebKit-правила, Chromium PNG и неверное окно", () => {
  const baselineIssues = validateContracts(root, loadContracts(root));
  const cases = [
    ["движок Chromium", (contracts) => {
      contracts.package.reproducibility.canonical_raster_policy.engine = "chromium";
    }],
    ["два независимых прогона", (contracts) => {
      contracts.package.reproducibility.canonical_raster_policy.repeat_count = 2;
    }],
    ["допуск по визуальному сходству", (contracts) => {
      contracts.package.reproducibility.canonical_raster_policy.comparison = "threshold";
    }],
    ["нормализация PNG", (contracts) => {
      contracts.package.reproducibility.canonical_raster_policy.normalization = "lossless-rsvg-reencode";
    }],
    ["выбор большинства", (contracts) => {
      contracts.package.reproducibility.canonical_raster_policy.retry_or_majority_selection = "allowed";
    }],
    ["опубликованный PNG Chromium", (contracts) => {
      contracts.package.evidence_outputs.runtime_validation_matrix[0].published_png = true;
    }],
    ["стресс-окно с неверным размером", (contracts) => {
      contracts.package.outputs.published_raster_matrix[0].viewports[2].height = 569;
    }],
  ];

  for (const [label, mutate] of cases) {
    const contracts = cloneLoadedContracts(loadContracts(root));
    mutate(contracts);
    const issues = validateContracts(root, contracts);
    const introducedIssues = issues.filter((issue) => !baselineIssues.includes(issue));
    assert.ok(
      introducedIssues.length > 0,
      `${label} должен быть блокирующей ошибкой договора, получено: ${issues.join(" | ")}`,
    );
  }
});

test("канонический манифест доказывает 60 WebKit-кадров, три независимых совпадающих прогона и единый отпечаток кандидата", () => {
  const activeStateIds = activeStateIdsFromRegistry();
  const packageContract = readJson(packageContractRelativePath);
  const packageManifest = readJson(
    `${packagePath}/derived/prototype-package-manifest.json`,
  );
  const canonicalManifest = readJson(
    `${packagePath}/${canonicalRasterManifestRelativePath}`,
  );
  const browserReport = readJson(`${packagePath}/evidence/browser-report.json`);
  const acceptanceReport = readJson(`${packagePath}/evidence/acceptance-report.json`);
  const candidateFingerprint = packageManifest.candidate_fingerprint;
  const expectedPaths = expectedCanonicalRasterPaths(packageContract, activeStateIds).sort();

  assertCandidateFingerprint(candidateFingerprint, "prototype-package-manifest.json candidate_fingerprint");
  assert.deepEqual(canonicalManifest.candidate_fingerprint, candidateFingerprint);
  assert.deepEqual(browserReport.candidate_fingerprint, candidateFingerprint);
  assert.deepEqual(acceptanceReport.candidate_fingerprint, candidateFingerprint);
  assert.ok(
    canonicalManifest.renderer_profile && typeof canonicalManifest.renderer_profile === "object",
    "Канонический манифест должен фиксировать профиль WebKit-рендера",
  );
  assert.equal(Object.hasOwn(canonicalManifest, "capture_tool_warnings"), false);
  assertCaptureToolWarnings(canonicalManifest.renderer_profile, "канонический WebKit-профиль");
  assert.doesNotMatch(JSON.stringify(canonicalManifest.renderer_profile), /\/Users\/|file:\/\/|absPath/u);

  assert.ok(Array.isArray(canonicalManifest.records));
  assert.equal(canonicalManifest.records.length, activeStateIds.length * canonicalViewportDefinitions.length);
  assert.deepEqual(
    canonicalManifest.records.map((record) => record.path).sort(),
    expectedPaths,
  );
  for (const record of canonicalManifest.records) {
    assert.equal(record.browser, "webkit");
    assert.ok(canonicalViewportDefinitions.some((viewport) => viewport.id === record.viewport));
    assert.ok(activeStateIds.includes(record.state_id));
    assert.ok(expectedPaths.includes(record.path));
    assert.match(record.sha256, /^[a-f0-9]{64}$/u);
    assert.ok(Number.isInteger(record.bytes) && record.bytes > 0);
    assert.ok(record.png_dimensions && typeof record.png_dimensions === "object");
    assert.deepEqual(record.runs.map((run) => run.run), [1, 2, 3]);

    const png = fs.readFileSync(path.join(packageRoot, record.path));
    assert.equal(record.sha256, sha256Bytes(png), `${record.path}: SHA опубликованного PNG`);
    assert.equal(record.bytes, png.length, `${record.path}: размер опубликованного PNG`);
    const viewport = canonicalViewportDefinitions.find((candidate) => candidate.id === record.viewport);
    assert.deepEqual(readPngDimensions(png, record.path), {
      width: viewport.width,
      height: viewport.height,
    });
    assert.deepEqual(record.png_dimensions, {
      width: viewport.width,
      height: viewport.height,
    });
    for (const run of record.runs) {
      assert.equal(run.sha256, record.sha256, `${record.path}: повтор ${run.run} изменил байты PNG`);
      assert.equal(run.bytes, record.bytes, `${record.path}: повтор ${run.run} изменил размер PNG`);
      assert.equal(hasOwn(run, "path"), false, `${record.path}: успешный манифест не хранит временный путь повтора`);
    }
  }
});

test("мобильный производный PNG и SVG побайтно наследуют канонический WebKit-кадр", () => {
  const activeStateIds = activeStateIdsFromRegistry();
  const packageContract = readJson(packageContractRelativePath);
  const wrapper = packageContract.outputs.svg_wrapper;
  for (const stateId of activeStateIds) {
    const canonicalPath = path.join(
      packageRoot,
      formatStatePath(wrapper.canonical_png_path_format, stateId),
    );
    const derivedPngPath = path.join(
      packageRoot,
      formatStatePath(wrapper.raster_png_path_format, stateId),
    );
    const svgPath = path.join(
      packageRoot,
      formatStatePath(wrapper.svg_path_format, stateId),
    );
    const canonicalPng = fs.readFileSync(canonicalPath);
    const derivedPng = fs.readFileSync(derivedPngPath);
    const svg = fs.readFileSync(svgPath, "utf8");
    const embedded = svg.match(/href="data:image\/png;base64,([A-Za-z0-9+/]+={0,2})"/u)?.[1];

    assert.ok(embedded, `${stateId}: SVG должен содержать встроенный PNG`);
    assert.equal(
      derivedPng.equals(canonicalPng),
      true,
      `${stateId}: derived PNG отличается от канонического mobile PNG`,
    );
    assert.equal(
      Buffer.from(embedded, "base64").equals(canonicalPng),
      true,
      `${stateId}: SVG содержит иной PNG`,
    );
    assert.match(
      svg,
      new RegExp(`${wrapper.source_png_sha256_attribute}="${sha256Bytes(canonicalPng)}"`, "u"),
    );
  }
});

test("диагностика расхождения не публикуется и остаётся в игнорируемой Git-зоне", () => {
  const packageContract = readJson(packageContractRelativePath);
  const diagnosticPath = packageContract.reproducibility.canonical_raster_policy.diagnostic_bundle.path;
  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  const publishedPaths = listFiles(packageRoot)
    .map((filePath) => path.relative(root, filePath).split(path.sep).join("/"));

  assert.equal(diagnosticPath, "test-results/presentation-link-lisa-user-journey/raster-mismatch");
  assert.match(gitignore, /\/test-results\/presentation-link-lisa-user-journey\//u);
  assert.equal(
    publishedPaths.some((relativePath) => relativePath.includes("raster-mismatch")),
    false,
  );
});

test("сбой WebKit сохраняет причину и console/page/network-диагностику вне кандидата", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-raster-diagnostic-"));
  const candidateRoot = path.join(temporaryRoot, "candidate");
  const diagnosticRoot = path.join(temporaryRoot, "diagnostics");
  const candidatePackageRoot = path.join(candidateRoot, packagePath);
  const demoPath = path.join(candidatePackageRoot, "demo", "index.html");
  const captureScriptPath = path.join(temporaryRoot, "failed-canonical-capture.mjs");
  const candidateFingerprint = {
    algorithm: "sha256",
    sha256: "1".repeat(64),
    inputs: {
      active_contracts: [{ scope: "active-contract", path: "source/active-contracts.json", bytes: 1, sha256: "2".repeat(64) }],
      generated_html: [{ scope: "generated", path: "demo/index.html", bytes: 1, sha256: "3".repeat(64) }],
      registered_source_assets: [{ scope: "source-asset", path: "source/reference.png", bytes: 1, sha256: "4".repeat(64) }],
      capture_toolchain: [{ scope: "toolchain", path: "scripts/capture.mjs", bytes: 1, sha256: "5".repeat(64) }],
    },
  };
  const states = activeStateIdsFromRegistry().map((id, index) => ({
    id,
    projection_sha256: "6789a".at(index).repeat(64),
  }));
  fs.mkdirSync(path.dirname(demoPath), { recursive: true });
  fs.mkdirSync(diagnosticRoot, { recursive: true });
  fs.writeFileSync(
    demoPath,
    "<!doctype html><html><body>Кандидатный HTML</body></html>",
    "utf8",
  );
  fs.writeFileSync(
    captureScriptPath,
    `import fs from "node:fs";
const [requestPath, reportPath] = process.argv.slice(2);
const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));
fs.writeFileSync(reportPath, JSON.stringify({
  version: request.version,
  status: "failed",
  capture_engine: "webkit",
  run: request.run,
  candidate_fingerprint: request.candidate_fingerprint,
  viewport: request.viewport,
  failure: {
    state_id: request.states[0].id,
    message: "TDD child capture failure",
    console_errors: ["TDD console sentinel"],
    page_errors: ["TDD page sentinel"],
    network_attempts: ["https://example.invalid/tdd-network-sentinel"]
  }
}));
process.stderr.write("TDD child capture failure\\n");
process.exit(1);
`,
    "utf8",
  );
  try {
    assert.throws(
      () => captureCanonicalRasterSet({
        sourceRoot: root,
        diagnosticRoot,
        outputRoot: candidateRoot,
        packageRelativePath: packagePath,
        captureScriptPath,
        demoPath,
        states,
        captureStabilization: {
          wait_for_document_fonts: true,
          scroll_policy: "restore-marked-end-after-fonts",
          focus_policy: "capture-mode-suppress-then-blur-active-element",
          settle_animation_frames: 2,
          explicit_screenshot_style_parameter_used: false,
          playwright_internal_style_attempt_blocked_by_csp: true,
          browser_launch_args: [],
        },
        rendererProfilePolicy: {
          capture_tool_warnings: expectedCaptureToolWarnings,
        },
        captureTransport: {
          mode: "playwright-route-fulfilled-local-files",
          origin: "http://lisa.invalid",
          external_network_requests_allowed: false,
          path_escape_blocked: true,
        },
        candidateFingerprint,
      }),
      /канонический дочерний захват не выполнен/u,
    );

    const diagnosticPath = path.join(diagnosticRoot, CANONICAL_RASTER_DIAGNOSTIC_RELATIVE_PATH);
    const summary = JSON.parse(fs.readFileSync(path.join(diagnosticPath, "sha256.json"), "utf8"));
    const childReport = JSON.parse(
      fs.readFileSync(path.join(diagnosticPath, "run-1", "desktop-1280x720", "report.json"), "utf8"),
    );
    assert.match(summary.reason, /дочерний захват/u);
    assert.equal(childReport.status, "failed");
    assert.ok(childReport.failure.console_errors.includes("TDD console sentinel"));
    assert.ok(childReport.failure.page_errors.includes("TDD page sentinel"));
    assert.ok(childReport.failure.network_attempts.includes("https://example.invalid/tdd-network-sentinel"));
    assert.equal(JSON.stringify(childReport.failure).includes("/Users/"), false);
    assert.equal(JSON.stringify(candidateFingerprint).includes("test-results"), false);
    assert.equal(fs.existsSync(path.join(candidateRoot, CANONICAL_RASTER_DIAGNOSTIC_RELATIVE_PATH)), false);

    const packageContract = readJson(packageContractRelativePath);
    const archive = readStoredZip(fs.readFileSync(path.join(packageRoot, packageContract.archive.path)));
    assert.equal([...archive.keys()].some((member) => member.startsWith("test-results/")), false);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("визуальный договор разрешает только проверенные PNG-растры выбранных доноров", () => {
  const registry = readActiveContracts();
  const visual = readRegisteredContract(registry, "visual");

  assert.ok(Array.isArray(visual.raster_donors));
  assert.ok(visual.raster_donors.length > 0);
  assert.match(JSON.stringify(visual.raster_donors), new RegExp(visualArchiveSha256, "u"));
  for (const donor of visual.raster_donors) {
    assert.match(donor.path, /^components\/[a-z0-9-]+\.png$/u);
    assert.match(donor.source_member, /\.svg$/u);
    assert.match(donor.sha256, /^[a-f0-9]{64}$/u);
    assert.ok(Number.isInteger(donor.width) && donor.width > 0);
    assert.ok(Number.isInteger(donor.height) && donor.height > 0);
    const png = fs.readFileSync(path.join(packageRoot, "source", donor.path));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(
      createHash("sha256").update(png).digest("hex"),
      donor.sha256,
      `${donor.path}: контрольная сумма растра`,
    );
    assert.equal(png.includes(Buffer.from("<foreignObject", "utf8")), false);
  }
});

test("активный HTML, производные файлы и ZIP не содержат P3/P4, сеть, почту или локальные пути", () => {
  const release = activeReleaseTexts();
  assert.ok(release.length >= 7, "Активный выпуск должен содержать HTML, данные, стили и оба манифеста");
  const text = release.map((item) => item.text).join("\n");
  for (const forbidden of [
    ...legacyStateFragments,
    "presentation-preview",
    "mailto:",
    "fetch(",
    "foreignObject",
    "file://",
    "/Users/",
    ".pdf",
    ".pptx",
  ]) {
    assert.equal(text.includes(forbidden), false, `Активный выпуск содержит ${forbidden}`);
  }

  const packageContract = readJson(packageContractRelativePath);
  const archivePath = path.join(packageRoot, packageContract.archive.path);
  const archive = readStoredZip(fs.readFileSync(archivePath));
  assert.deepEqual([...archive.keys()], packageContract.archive.members);
  for (const [memberPath, content] of archive) {
    const memberText = content.toString("utf8");
    assert.equal(/\.xlsx$|\.svg$/u.test(memberPath), false, `ZIP содержит неразрешённый вход: ${memberPath}`);
    for (const forbidden of ["mailto:", "fetch(", "foreignObject", "file://", "/Users/"]) {
      assert.equal(memberText.includes(forbidden), false, `${memberPath}: содержит ${forbidden}`);
    }
  }
});

test("проверка сгенерированного активного выпуска отвергает лишний P3/P4-кадр", () => {
  assert.deepEqual(
    validateGeneratedPackage(root, root),
    [],
    "Перед отрицательной проверкой активный выпуск должен быть целостным",
  );
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-mvp-output-"));
  try {
    fs.mkdirSync(path.join(temporaryRoot, "docs/product/analysis"), { recursive: true });
    fs.cpSync(packageRoot, path.join(temporaryRoot, packagePath), { recursive: true });
    const staleFrame = path.join(
      temporaryRoot,
      packagePath,
      "derived/screens/lisa-result-view-from-chat.png",
    );
    fs.mkdirSync(path.dirname(staleFrame), { recursive: true });
    fs.writeFileSync(staleFrame, "устаревший P3/P4-кадр\n", "utf8");

    const issues = validateGeneratedPackage(temporaryRoot, root);
    assert.ok(
      issues.some(
        (issue) =>
          /unregistered generated output|лишний generated-выход|P3|P4|неактивн/u.test(issue) &&
          issue.includes("lisa-result-view-from-chat.png"),
      ),
      `Лишний P3/P4-кадр должен остановить выпуск, получено: ${issues.join(" | ")}`,
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("в активных договорах нет локальных путей, почтовых адресов и третьей статусной реплики", () => {
  const registry = readActiveContracts();
  const activeContracts = registry.active_contracts
    .map((entry) => readRegisteredContract(registry, entry.id));
  const journey = readRegisteredContract(registry, "journey");
  const text = collectStrings(activeContracts).join("\n");
  const statusBodies = journey.states
    .map((state) => state.body)
    .filter((body) => typeof body === "string" && body.includes("Презентация"));

  assert.deepEqual(statusBodies, [journey.copy.generation_started, journey.copy.presentation_sent]);
  assert.doesNotMatch(text, /\bPDF\b|\bPPTX\b|mailto:|\/Users\/|file:\/\/|absPath|@[A-Za-z0-9._-]+/u);
  assert.doesNotMatch(text, /Презентация готова|Открыть презентацию|Уведомления|Редактировать/u);
});

test("raster-base-local-overlay: активный HTML связывает 20 состояний с нативными PNG и search-input-slot без ручной phone-оболочки", () => {
  const registry = readActiveContracts();
  const journey = readRegisteredContract(registry, "journey");
  const sourceCatalog = readRegisteredContract(registry, "source-catalog");
  const visualBasis = readRegisteredContract(registry, "visual-basis");
  const packageContract = readJson(packageContractRelativePath);
  const runtimeAssets = packageContract.raster_base_local_overlay?.runtime_assets;
  const demoIndex = fs.readFileSync(path.join(packageRoot, "demo/index.html"), "utf8");
  const demoApp = fs.readFileSync(path.join(packageRoot, "demo/app.js"), "utf8");
  const demoData = fs.readFileSync(path.join(packageRoot, "demo/data.js"), "utf8");
  const demoCss = fs.readFileSync(path.join(packageRoot, "demo/styles.css"), "utf8");
  const initialBinding = visualBasis.state_bindings.find(
    (binding) => binding.state_id === journey.initial_state_id,
  );
  const searchSlot = initialBinding?.slots.find((slot) => slot.id === "search-input-slot");
  const microphoneSlot = initialBinding?.slots.find(
    (slot) => slot.semantic_control_id === "client-answer-microphone-control",
  );
  const deferredSourceIds = sourceCatalog.members
    .filter((member) => member.classification === "deferred-q4")
    .map((member) => member.id);

  assert.equal(visualBasis.rendering_pipeline, "raster-base-local-overlay");
  assert.deepEqual(runtimeAssets, {
    demo_asset_root: "demo/assets/",
    data_and_runtime_reference_prefix: "assets/",
    base_path_prefix: "assets/bases/",
    patch_path_prefix: "assets/patches/",
    font_path_prefix: "assets/fonts/",
    source_paths_runtime_dependency: false,
    parent_directory_references_allowed: false,
  });
  assert.deepEqual(registry.active_state_ids, journey.states.map((state) => state.id));
  assert.equal(registry.active_state_ids.length, 20);
  assert.equal(visualBasis.state_bindings.length, 20);
  assert.equal(journey.initial_state_id, "lisa-client-answer");
  assert.equal(initialBinding?.base_id, "1.1");
  assert.deepEqual(searchSlot, {
    id: "search-input-slot",
    kind: "transparent-semantic-slot",
    semantic_control_id: "client-search-input",
    semantic_role: "input",
    rect: { x: 88, y: 1372, width: 305, height: 32 },
    visible_patch_path: null,
    visible_patch_sha256: null,
  });
  assert.equal(microphoneSlot?.semantic_role, "microphone");
  assert.notEqual(searchSlot?.semantic_control_id, microphoneSlot?.semantic_control_id);
  assert.deepEqual(deferredSourceIds, ["5.3", "5.6", "6.1", "6.2", "7.3"]);
  assert.equal(
    visualBasis.state_bindings.some((binding) => deferredSourceIds.includes(binding.base_id)),
    false,
  );
  assert.equal(
    packageContract.archive.members.filter((member) => member.startsWith("demo/assets/bases/")).length,
    20,
  );
  assert.equal(
    packageContract.archive.members.filter((member) => member.startsWith("demo/assets/patches/")).length,
    4,
  );
  assert.ok(
    packageContract.archive.members.includes("demo/assets/fonts/NotoSans[wdth,wght].ttf"),
    "runtime-версия шрифта должна находиться рядом с demo/index.html",
  );
  assert.ok(
    packageContract.archive.members.includes("demo/assets/fonts/OFL.txt"),
    "лицензионный файл переносимой копии шрифта должен находиться рядом с demo/index.html",
  );
  assert.equal(
    packageContract.archive.members.some((member) => member.startsWith("source/")),
    false,
    "исполняемый ZIP не должен подменять runtime-ресурсы исходным source/**",
  );

  assert.match(demoApp, /data-prototype-scene/u);
  assert.match(demoApp, /data-slot-id/u);
  assert.match(demoApp, /data-semantic-control-id/u);
  assert.match(demoApp, /(?:element|createElement)\(\s*["']img["']/u);
  assert.doesNotMatch(demoApp, /className:\s*["']phone(?:["']|\s)/u);
  assert.doesNotMatch(demoCss, /(?:^|[^\w-])\.phone(?![\w-])/mu);
  assert.doesNotMatch(demoCss, /\.phone-(?:header|content|composer)\b|\.clock-(?:face|hand)\b/u);
  for (const [relativePath, generatedSource] of Object.entries({
    "demo/index.html": demoIndex,
    "demo/app.js": demoApp,
    "demo/data.js": demoData,
    "demo/styles.css": demoCss,
  })) {
    assert.doesNotMatch(
      generatedSource,
      /\.\.\/source\//u,
      `${relativePath}: статический runtime-маршрут не должен зависеть от source/**`,
    );
    assert.doesNotMatch(
      generatedSource,
      /\.\.\//u,
      `${relativePath}: договор запрещает родительские runtime-ссылки при прямом file:// открытии`,
    );
  }
  assert.match(demoData, /assets\/bases\/[a-z0-9-]+\.png/u);
  assert.match(demoData, /assets\/patches\/[a-z0-9-]+\.png/u);
  assert.match(demoCss, /url\(["']?assets\/fonts\/NotoSans\[wdth,wght\]\.ttf["']?\)/u);
  assert.match(demoIndex, /Content-Security-Policy/u);
});
