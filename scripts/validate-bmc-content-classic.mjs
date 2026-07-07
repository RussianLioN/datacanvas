import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const markdownPath = "docs/product/bmc/bmc-v0.2.md";
const tracePath = "docs/product/bmc/bmc-trace.v0.1.json";
const textAlternativePath = "docs/product/bmc/text-alternative.md";
const pumlPath = "docs/product/bmc/source/derived/datacanvas-bmc.puml";
const svgPath = "docs/product/bmc/source/derived/datacanvas-bmc.svg";

const expectedBlocks = [
  ["B1", "Сегменты пользователей", "Customer Segments"],
  ["B2", "Ценностное предложение", "Value Proposition"],
  ["B3", "Каналы", "Channels"],
  ["B4", "Взаимодействие с пользователем", "Customer Relationships"],
  ["B5", "Потоки внутренней пользы", "Revenue Streams / Internal Value Streams"],
  ["B6", "Ключевые ресурсы", "Key Resources"],
  ["B7", "Ключевые активности", "Key Activities"],
  ["B8", "Ключевые партнеры", "Key Partners"],
  ["B9", "Структура затрат", "Cost Structure"],
];

const publicForbidden = [
  "не подтверждено",
  "допущение",
  "подтверждено",
  "unconfirmed",
  "assumption",
  "confirmed",
  "Confidence",
  "Evidence Requests",
  "Open Questions",
  "Source refs",
  "source_refs",
  "evidence_requests",
  "PresentationSpec",
  "trace",
  "validation companion",
  "companion JSON",
  "quality gates",
  "renderer",
  "gateway",
  "callback",
  "A2A",
  "MCP",
  "LLM",
  "SHA",
  "Статус:",
  "## Методика",
  "## Граница модели",
  "рабочая версия",
  "классическую схему Business Model Canvas",
  "внутреннего ИТ-продукта",
  "внешняя выручка",
  "служебные доказательства",
  "машинные артефакты",
  "требует отдельной проверки",
  "предметом отдельной проверки",
  "открытая зависимость",
  "открытые зависимости",
  "/Users/",
  "file://",
];

const roleForbidden = new Map([
  ["B2", ["проверяет вход", "проверяет данные", "генерирует", "доставляет", "отправляет"]],
  ["B3", ["проверяет", "готовит презентацию", "генерирует", "уточняющие вопросы"]],
  ["B4", ["интеграц", "оркестрац", "конвейер", "pipeline"]],
  ["B6", ["почтовый канал", "канал доставки", "инцидент", "служебн", "JSON"]],
  ["B7", ["партнер", "затрат", "сегмент"]],
  ["B8", ["средство подготовки файла как", "шаблоны как", "открыт"]],
  ["B9", ["инцидент", "требует", "статус"]],
]);

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function section(markdown, block, title) {
  const marker = `## ${block}. ${title}`;
  const start = markdown.indexOf(marker);
  if (start === -1) {
    fail(`clean BMC markdown is missing section: ${block}. ${title}`);
  }
  const next = markdown.indexOf("\n## ", start + marker.length);
  return markdown.slice(start, next === -1 ? markdown.length : next);
}

function assertPublicClean(label, content) {
  const normalized = content.replaceAll("http://www.w3.org/2000/svg", "");
  for (const forbidden of publicForbidden) {
    if (normalized.includes(forbidden)) {
      fail(`${label} contains technical, service or validation marker: ${forbidden}`);
    }
  }
}

function assertContains(label, content, fragment) {
  if (!content.includes(fragment)) {
    fail(`${label} is missing required fragment: ${fragment}`);
  }
}

function assertBlockRole(block, content) {
  for (const forbidden of roleForbidden.get(block) ?? []) {
    if (content.includes(forbidden)) {
      fail(`${block} contains wording that belongs to another BMC block or service layer: ${forbidden}`);
    }
  }
}

function assertNoDuplicateBlocks(blocks) {
  const seen = new Set();
  for (const block of blocks) {
    if (seen.has(block.id)) {
      fail(`BMC trace contains duplicate block: ${block.id}`);
    }
    seen.add(block.id);
  }
}

function assertNegativeSelfTest() {
  for (const sample of [
    "## B2. Ценностное предложение\n\nDataCanvas проверяет вход, генерирует файл и доставляет результат.",
    "## B8. Ключевые партнеры\n\nШаблоны как открытая зависимость и средство подготовки файла как ресурс.",
    "## B9. Структура затрат\n\nLLM-вызовы, инциденты и расчет затрат требуют отдельной проверки.",
    "## B6. Ключевые ресурсы\n\nPresentationSpec, trace и validation companion JSON.",
    "Статус: рабочая версия для продуктового обсуждения.",
    "## Методика\n\nДокумент использует классическую схему Business Model Canvas.",
    "## Граница модели\n\nDataCanvas получает данные, проверяет вход и доставляет файл.",
  ]) {
    const hasPublicMarker = publicForbidden.some((forbidden) => sample.includes(forbidden));
    const hasWrongRoleMarker = [...roleForbidden.values()].some((markers) =>
      markers.some((marker) => sample.includes(marker)),
    );
    if (!hasPublicMarker && !hasWrongRoleMarker) {
      fail(`negative self-test did not reject invalid BMC content: ${sample}`);
    }
  }
}

assertNegativeSelfTest();

for (const filePath of [markdownPath, tracePath, textAlternativePath, pumlPath, svgPath]) {
  if (!fs.existsSync(absolute(filePath))) {
    fail(`required BMC artifact is missing: ${filePath}`);
  }
}

const markdown = readText(markdownPath);
const textAlternative = readText(textAlternativePath);
const puml = readText(pumlPath);
const svg = readText(svgPath);
const trace = readJson(tracePath);

for (const [block, title, classic] of expectedBlocks) {
  const traceBlock = trace.blocks.find((item) => item.id === block);
  const traceItem = trace.items.find((item) => item.block === block);
  if (!traceBlock) {
    fail(`BMC trace is missing classic block: ${block}`);
  }
  if (!traceItem) {
    fail(`BMC trace is missing public item for block: ${block}`);
  }
  if (traceBlock.title !== classic) {
    fail(`BMC trace classic title mismatch for ${block}: expected ${classic}, got ${traceBlock.title}`);
  }
  if (traceBlock.public_title !== title) {
    fail(`BMC trace public title mismatch for ${block}: expected ${title}, got ${traceBlock.public_title}`);
  }
  if (!Array.isArray(traceItem.bullets) || traceItem.bullets.length < 2) {
    fail(`BMC trace public bullets are missing for ${block}`);
  }
  if (!Array.isArray(traceItem.detail) || traceItem.detail.length < 2) {
    fail(`BMC trace public detail is missing for ${block}`);
  }

  const markdownSection = section(markdown, block, title);
  assertContains(markdownPath, markdown, `| ${block} | ${classic} | ${title} | ${traceItem.statement} |`);
  assertContains(markdownSection, markdownSection, traceItem.statement);
  for (const item of traceItem.detail) {
    assertContains(markdownSection, markdownSection, item);
  }

  assertContains(textAlternativePath, textAlternative, `## ${block}. ${title}`);
  assertContains(textAlternativePath, textAlternative, traceItem.statement);
  for (const item of traceItem.bullets) {
    assertContains(textAlternativePath, textAlternative, `- ${item}`);
  }

  assertContains(pumlPath, puml, `${block.slice(1)}. ${title}`);
  assertContains(svgPath, svg, `data-block="${block}"`);
  assertBlockRole(block, markdownSection);
}

assertNoDuplicateBlocks(trace.blocks);
assertPublicClean(markdownPath, markdown);
assertPublicClean(textAlternativePath, textAlternative);
assertPublicClean(pumlPath, puml);
assertPublicClean(svgPath, svg);

if (markdown.includes("## Пользовательские и машинные артефакты")) {
  fail("clean BMC markdown must not include user/machine artifact section");
}

if (!markdown.startsWith("# Business Model Canvas DataCanvas v0.2\n\n## Краткая канва\n")) {
  fail("clean BMC markdown must start with the canvas content, without service status, methodology or model boundary preface");
}

console.log("BMC classic content validation passed");
