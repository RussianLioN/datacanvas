import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

const paths = {
  vision: "docs/product-vision.md",
  historicalVision: "docs/product/vision/vision-v0.1.md",
  manifest: "docs/product/vision/manifest.json",
  manifestSchema: "schemas/product-vision-manifest.schema.json",
  sourceRegistry: "docs/product/sources/product-source-registry.json",
  navigationSource: "docs/navigation/navigation-source.json",
  artifactRegistry: "docs/architecture/schemas/artifact-registry.json",
  negativeCases: "tests/fixtures/product-vision/negative/cases.json",
};

const forbiddenPublicVisionMarkers = [
  "Статус:",
  "Владелец:",
  "Проверка:",
  "Дата обновления:",
  "/Users/",
  "file://",
  "source_refs",
  "validation_status",
  "technical_trace",
  "internal prompt",
  "internal_prompts",
  "raw JSON",
  "raw_json",
  "служебные доказательства",
  "служебная трассировка",
  "A2A",
  "MCP",
  "provider",
  "SHA",
  "sha256:",
];

const semanticForbiddenPatterns = [
  {
    id: "abbreviation-comma-km",
    pattern: /КМ,\s*клиентск(?:ий|им|ого|ому|ие|их|ими)\s+менеджер/iu,
    message: "сокращение КМ должно раскрываться через скобки, например КМ (клиентский менеджер)",
  },
  {
    id: "ambiguous-email-work-channel",
    pattern: /Доставка\s+результата\s+в\s+канале,\s+пригодном\s+для\s+работы\s+с\s+файлом\s+презентации/iu,
    message: "нельзя писать так, будто с файлом презентации удобно работать прямо в почтовом приложении",
  },
  {
    id: "technical-contract-in-public-vision",
    pattern: /Точный\s+технический\s+контракт\s+входного\s+пакета/iu,
    message: "технический контракт входа не должен быть частью публичного Vision",
  },
  {
    id: "corrected-version-as-lifecycle-object",
    pattern: /исправленн(?:ая|ую|ой|ые|ых)\s+верси(?:я|ю|и)\s+презентации/iu,
    message: "DataCanvas не должен обещать исправленную версию презентации после доставки",
  },
  {
    id: "post-delivery-email-edits",
    pattern: /Правки\s+после\s+получения\s+файла\s+могут\s+запрашиваться\s+через\s+ответное\s+письмо/iu,
    message: "правки через ответное письмо не подтверждены как часть жизненного цикла DataCanvas",
  },
  {
    id: "raw-story-backlog-listing",
    pattern: /`DC-ST-\d+`/u,
    message: "публичный Vision не должен превращаться в список story-id",
  },
  {
    id: "raw-priority-horizon-listing",
    pattern: /\bP[3-5]\s+(?:развивает|расширяет|покрывает)\b/iu,
    message: "публичный Vision не должен повторять backlog по приоритетам P3-P5",
  },
  {
    id: "post-delivery-scope",
    pattern: /\bpost-delivery\b/iu,
    message: "неподтвержденная post-delivery область не должна попадать в публичный Vision",
  },
  {
    id: "technical-service-section",
    pattern: /^##\s+(?:Методика|Граница модели|Жизненный цикл презентации|Связь со stories)\s*$/imu,
    message: "публичный Vision не должен включать служебные, методические или трассировочные разделы",
  },
];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    throw new Error(`required file is missing: ${relativePath}`);
  }
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function readH2Sections(text) {
  return [...text.matchAll(/^##\s+(.+?)\s*$/gmu)].map((match) => match[1]);
}

function assertNoForbiddenPublicMarkers(text, label) {
  for (const marker of forbiddenPublicVisionMarkers) {
    if (text.includes(marker)) {
      throw new Error(`${label} contains forbidden public Vision marker: ${marker}`);
    }
  }

  if (/"(?:source_refs|validation_status|technical_trace|internal_prompts)"\s*:/u.test(text)) {
    throw new Error(`${label} contains raw service JSON marker`);
  }
  if (/\bsha256\b\s*[:=]\s*[a-f0-9]{64}/iu.test(text)) {
    throw new Error(`${label} contains raw sha256 marker`);
  }
}

function assertNoForbiddenPublicContent(text, label, manifest) {
  assertNoForbiddenPublicMarkers(text, label);

  for (const forbidden of manifest.classic_vision_policy.forbidden_public_claims) {
    if (text.includes(forbidden.text)) {
      throw new Error(`${label} contains forbidden public Vision claim: ${forbidden.claim_id}`);
    }
  }

  for (const pattern of semanticForbiddenPatterns) {
    if (pattern.pattern.test(text)) {
      throw new Error(`${label} contains forbidden public Vision content (${pattern.id}): ${pattern.message}`);
    }
  }
}

function assertClassicSectionOrder(text, manifest) {
  const actual = readH2Sections(text);
  const expected = manifest.classic_vision_policy.required_section_order;
  if (actual.length !== expected.length) {
    throw new Error(`current public Vision section count must be ${expected.length}, got ${actual.length}: ${actual.join(", ")}`);
  }
  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      throw new Error(`current public Vision section ${index + 1} must be "${expected[index]}", got "${actual[index]}"`);
    }
  }
}

function assertRequiredPublicPhrases(text, manifest) {
  const normalizedText = text.toLocaleLowerCase("ru-RU");
  for (const phrase of manifest.classic_vision_policy.required_public_phrases) {
    if (!normalizedText.includes(phrase.toLocaleLowerCase("ru-RU"))) {
      throw new Error(`current public Vision is missing required product phrase: ${phrase}`);
    }
  }
}

function assertGlossaryCoverage(manifest) {
  const glossaryPath = manifest.classic_vision_policy.glossary_path;
  requireFile(glossaryPath);
  const glossary = readText(glossaryPath);

  for (const term of manifest.classic_vision_policy.required_glossary_terms) {
    const rowPattern = new RegExp(`^\\|\\s*${escapeRegExp(term)}\\s*\\|`, "mu");
    if (!rowPattern.test(glossary)) {
      throw new Error(`glossary is missing required Vision term: ${term}`);
    }
  }
}

function assertPublicVisionClean(manifest) {
  const text = readText(paths.vision);
  if (!text.startsWith("# Видение продукта DataCanvas\n\nНавигация:")) {
    throw new Error("current public Vision must start with title and breadcrumb");
  }

  assertNoForbiddenPublicContent(text, paths.vision, manifest);
  assertClassicSectionOrder(text, manifest);
  assertRequiredPublicPhrases(text, manifest);
}

function assertManifest() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(readJson(paths.manifestSchema));
  const manifest = readJson(paths.manifest);
  if (!validate(manifest)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    throw new Error(`${paths.manifest} does not match ${paths.manifestSchema}`);
  }

  if (manifest.public_content_policy.allowed_public_content !== "product_vision_only") {
    throw new Error("Vision manifest must restrict public content to product Vision only");
  }
  if (!manifest.public_content_policy.allowed_public_service_elements.includes("breadcrumb")) {
    throw new Error("Vision manifest must explicitly allow breadcrumb as the only public service element");
  }
  for (const requiredStorage of [
    paths.manifest,
    paths.sourceRegistry,
    manifest.classic_vision_policy.glossary_path,
    paths.navigationSource,
    paths.artifactRegistry,
  ]) {
    if (!manifest.service_information_storage.includes(requiredStorage)) {
      throw new Error(`Vision manifest service storage is missing: ${requiredStorage}`);
    }
  }
  if (manifest.artifact_governance.artifact_kind !== "manual_machine_readable_manifest" || manifest.artifact_governance.generator_id !== null) {
    throw new Error("Vision manifest must stay a manual machine-readable manifest, not a generated public artifact");
  }
  for (const requiredValidator of [
    "npm run validate:product-vision",
    "npm run validate:product-sources",
    "npm run validate:product-source-consistency",
    "npm run validate:accepted-change-order-impact",
  ]) {
    if (!manifest.validators.includes(requiredValidator)) {
      throw new Error(`Vision manifest validator list is missing: ${requiredValidator}`);
    }
  }

  return manifest;
}

function assertSourceRegistry(manifest) {
  const registry = readJson(paths.sourceRegistry);
  const current = registry.sources.find((source) => source.source_id === "SRC-DC-PRODUCT-VISION-CURRENT");
  const historical = registry.sources.find((source) => source.source_id === "SRC-DC-PRODUCT-VISION-SNAPSHOT-V0-1");

  if (!current || current.path !== paths.vision || current.source_role !== "current_vision") {
    throw new Error("product source registry must keep docs/product-vision.md as current Vision");
  }
  if (current.lifecycle !== "active" || current.trust_level !== "current") {
    throw new Error("current Vision must stay active/current in source registry");
  }
  if (current.owner_role !== manifest.current_vision.owner_role || current.effective_date !== manifest.current_vision.effective_date) {
    throw new Error("current Vision manifest metadata must match source registry");
  }
  if (!historical || historical.path !== paths.historicalVision || historical.source_role !== "historical_snapshot") {
    throw new Error("product source registry must keep vision-v0.1 as historical snapshot");
  }
  if (historical.lifecycle !== "historical" || historical.trust_level !== "historical") {
    throw new Error("Vision snapshot must stay historical in source registry");
  }
  for (const allowedUse of historical.allowed_downstream_use) {
    if (!["comparison", "audit"].includes(allowedUse)) {
      throw new Error(`historical Vision snapshot has forbidden downstream use: ${allowedUse}`);
    }
  }
}

function assertRegistries() {
  const navigation = readJson(paths.navigationSource);
  const registry = readJson(paths.artifactRegistry);
  const managedPaths = new Set(navigation.managed_entries.map((entry) => entry.path));
  const artifactPaths = new Set(registry.artifacts.map((artifact) => artifact.path));

  for (const requiredPath of [paths.vision, paths.manifest]) {
    if (!managedPaths.has(requiredPath)) {
      throw new Error(`Vision path is missing from navigation source: ${requiredPath}`);
    }
    if (!artifactPaths.has(requiredPath)) {
      throw new Error(`Vision path is missing from artifact registry: ${requiredPath}`);
    }
  }
}

function assertHistoricalSnapshotPolicy() {
  const text = readText(paths.historicalVision);
  assertNoForbiddenPublicMarkers(text, paths.historicalVision);
  if (text.includes("Статус:") || text.includes("Версия процесса:")) {
    throw new Error("historical Vision snapshot must not expose service metadata in Markdown");
  }
}

function assertNegativeCases(manifest) {
  const cases = readJson(paths.negativeCases);
  if (!Array.isArray(cases) || cases.length < 10) {
    throw new Error("Vision negative cases must contain at least 10 scenarios");
  }
  for (const testCase of cases) {
    let failed = false;
    try {
      assertNoForbiddenPublicContent(testCase.text, testCase.id, manifest);
    } catch {
      failed = true;
    }
    if (!failed) {
      throw new Error(`negative Vision fixture did not fail as expected: ${testCase.id}`);
    }
  }
}

try {
  for (const requiredPath of Object.values(paths)) {
    requireFile(requiredPath);
  }
  const manifest = assertManifest();
  assertPublicVisionClean(manifest);
  assertGlossaryCoverage(manifest);
  assertSourceRegistry(manifest);
  assertRegistries();
  assertHistoricalSnapshotPolicy();
  assertNegativeCases(manifest);
  console.log("product Vision validation passed");
} catch (error) {
  fail(error.message);
}
