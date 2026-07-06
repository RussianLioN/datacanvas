import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const markdownPath = "docs/product/bmc/bmc-v0.2.md";
const tracePath = "docs/product/bmc/bmc-trace.v0.1.json";

const expected = [
  ["B1", "Сегменты пользователей", ["КМ", "CSM", "Лисы"]],
  ["B2", "Ценностное предложение", ["презентации", "ручн", "редактируем"]],
  ["B3", "Каналы", ["другим агентом", "Лис", "электронной почте"]],
  ["B4", "Взаимодействие с пользователем", ["уточня", "прав", "описан"]],
  ["B5", "Потоки внутренней пользы", ["внутрен", "эконом", "финанс"]],
  ["B6", "Ключевые ресурсы", ["подготовлен", "безопасн", "шаблон", "почтов"]],
  ["B7", "Ключевые активности", ["провер", "готовит", "отправляет"]],
  ["B8", "Ключевые партнеры", ["Лиса", "другой агент", "почтов"]],
  ["B9", "Структура затрат", ["LLM", "сопровожд", "инцидент"]],
];

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

if (!fs.existsSync(absolute(markdownPath))) {
  fail(`BMC markdown is missing: ${markdownPath}`);
}

const markdown = readText(markdownPath);
const trace = readJson(tracePath);

for (const fragment of [
  "Business Model Canvas",
  "классическую схему Business Model Canvas",
  "внутреннего ИТ-продукта",
  "Краткая канва",
]) {
  if (!markdown.includes(fragment)) {
    fail(`clean BMC markdown is missing required method fragment: ${fragment}`);
  }
}

for (const [block, title, anchors] of expected) {
  if (!markdown.includes(`## ${block}. ${title}`)) {
    fail(`clean BMC markdown is missing section: ${block}. ${title}`);
  }
  for (const anchor of anchors) {
    const sectionStart = markdown.indexOf(`## ${block}. ${title}`);
    const nextSection = markdown.indexOf("\n## ", sectionStart + 1);
    const section = markdown.slice(sectionStart, nextSection === -1 ? markdown.length : nextSection);
    if (!section.includes(anchor)) {
      fail(`BMC section ${block} does not contain classic DataCanvas anchor: ${anchor}`);
    }
  }
}

const traceBlocks = new Set(trace.blocks.map((block) => block.id));
for (const [block] of expected) {
  if (!traceBlocks.has(block)) {
    fail(`BMC trace is missing classic block: ${block}`);
  }
}

for (const forbidden of [
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
  "/Users/",
  "file://",
]) {
  if (markdown.includes(forbidden)) {
    fail(`clean BMC markdown contains validation or local marker: ${forbidden}`);
  }
}

console.log("BMC classic content validation passed");
