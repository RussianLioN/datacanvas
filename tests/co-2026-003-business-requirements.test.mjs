import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const requirementsPath = new URL("../docs/product/requirements/business-requirements.md", import.meta.url);
const acceptanceCriteriaPath = new URL("../docs/product/requirements/acceptance-criteria.md", import.meta.url);
const scopePath = new URL("../docs/product/sources/co-2026-003-current-2026-scope.md", import.meta.url);

const activeRequirementIds = [
  "BT-012", "BT-013", "BT-014", "BT-015", "BT-016", "BT-017",
  "BT-018", "BT-019", "BT-022", "BT-023", "BT-024",
];

function readRequirements() {
  return fs.readFileSync(requirementsPath, "utf8");
}

function readAcceptanceCriteria() {
  return fs.readFileSync(acceptanceCriteriaPath, "utf8");
}

function countOccurrences(text, fragment) {
  return text.split(fragment).length - 1;
}

test("кандидат БТ CO-2026-003 сохраняет действующие идентификаторы и корректно описывает девять историй 2026 года", () => {
  const text = readRequirements();

  for (const id of activeRequirementIds) {
    assert.match(text, new RegExp(`\\b${id}\\b`, "u"), `отсутствует стабильный идентификатор ${id}`);
  }
  assert.doesNotMatch(text, /\\bBT-(?:DC|CI)-/u, "нельзя вводить параллельную линейку идентификаторов БТ");

  assert.match(text, /DC-ST-09[\s\S]{0,120}получени[ея][\s\S]{0,120}электронной почте/iu);
  assert.match(text, /DC-ST-23[\s\S]{0,120}заказ[\s\S]{0,120}контекст/iu);
  assert.match(text, /DC-ST-24[\s\S]{0,120}общем сценарии[\s\S]{0,120}другими агентами/iu);
  assert.match(text, /DC-ST-28[\s\S]{0,120}проверяем[\s\S]{0,120}(?:связ|связь)[\s\S]{0,120}(?:заказ|файл)/iu);
  assert.doesNotMatch(text, /DC-ST-09[^\n]*(?:заказ|общий агентский сценарий)/iu);

  assert.doesNotMatch(text, /защищенн(?:ое|ом) хранилищ/u);
  assert.doesNotMatch(text, /ссылк[ау] на готовую презентацию/iu);
  assert.doesNotMatch(text, /системн(?:ый|ого) PUSH/u);
});

test("каждое БТ кандидата CO-2026-003 имеет классическую бизнесовую структуру", () => {
  const text = readRequirements();

  for (const marker of [
    "**Бизнесовая потребность:**",
    "**Участники:**",
    "**Ценность:**",
    "**Граница применения:**",
    "**Основной сценарий:**",
    "**Альтернативный сценарий:**",
    "**Ошибочный сценарий:**",
  ]) {
    assert.equal(
      countOccurrences(text, marker),
      activeRequirementIds.length,
      `${marker} должен быть указан у каждого действующего БТ`,
    );
  }
});

test("кандидат БТ CO-2026-003 отделяет заказ и безопасное состояние от пользовательского чата", () => {
  const text = readRequirements();

  assert.match(text, /факты[\s\S]{0,120}цель[\s\S]{0,120}параметры результата[\s\S]{0,120}признаки корреляции/iu);
  assert.match(text, /не устанавливает[\s\S]{0,80}фактическую достоверность/iu);
  assert.match(text, /не добавляет сведения из внешних источников/iu);
  assert.match(text, /объявленн(?:ый|ому) внутренн(?:ий|ему) получател/iu);
  assert.doesNotMatch(text, /DataCanvas[^.\n]*переда[её]т[^.\n]*в чат/iu);
  assert.match(text, /Справка по клиенту[\s\S]{0,120}показывает[\s\S]{0,120}в том же чате/iu);
  assert.match(text, /хотя бы один[\s\S]{0,120}SIGMA[\s\S]{0,120}OMEGA/iu);
});

test("кандидат БТ CO-2026-003 фиксирует результат доставки и использует единый реестр текстов", () => {
  const text = readRequirements();

  assert.match(text, /owner-approved-texts/iu);
  assert.match(text, /PPTX[\s\S]{0,120}PDF[\s\S]{0,120}все[\s\S]{0,120}обязательн(?:ые|ый)[\s\S]{0,120}контур/iu);
  assert.match(text, /пять повторных[\s\S]{0,40}попыток[\s\S]*десять минут[\s\S]*одн\S* час/iu);
  assert.match(text, /OMEGA[\s\S]*SIGMA[\s\S]*исчерпани[ея][\s\S]*частичн(?:ая|ую)[\s\S]{0,40}доставк/iu);
  assert.match(text, /ошибк[ае] почтового сервиса[\s\S]*(?:без повторных попыток|повторные попытки не выполняются)/iu);
  assert.match(text, /ни в SIGMA, ни в OMEGA[\s\S]*неподтвержд[её]нн(?:ая|ую) доставк/iu);
});

test("Q4_2026 не возвращает ODT, ссылку, PUSH или произвольный третий контур в активный смысл", () => {
  const text = readRequirements();

  assert.doesNotMatch(text, /ODT/u);
  assert.doesNotMatch(text, /отдельн(?:ая|ую)\s+ссылк[ау][^.\n]*(?:результат|презентац)/iu);
  assert.doesNotMatch(text, /системн(?:ый|ого)\s+PUSH[^.\n]*(?:входит|показывается|отправляется|доставляется)/iu);
  assert.doesNotMatch(text, /(?:трет(?:ий|ьего)|произвольн(?:ый|ого))\s+(?:почтов(?:ый|ого)\s+)?контур/iu);
});

test("критерии приёмки Q4_2026 не содержат активных строк про ссылку, хранилище или PUSH", () => {
  const text = readAcceptanceCriteria();
  const rows = text
    .split("\n")
    .filter((line) => line.startsWith("|") && !line.includes("---"))
    .filter((line) => /BT-020|BT-021/u.test(line));

  assert.ok(rows.length > 0, "будущие строки BT-020/BT-021 должны остаться явно видимыми как вне Q4_2026");
  for (const row of rows) {
    assert.match(
      row,
      /будущ(?:ий|его|ему)|вне\s+Q4_2026|за пределами\s+`?Q4_2026`?/iu,
      `строка с BT-020/BT-021 должна быть явно помечена как будущая или вне Q4_2026: ${row}`,
    );
    assert.doesNotMatch(
      row,
      /получает[^|]*(?:ссылк|уведомлен)|сохранена[^|]*хранилищ|может показать[^|]*ссылк/iu,
      `строка с BT-020/BT-021 не должна утверждать активную ссылку, уведомление или хранение: ${row}`,
    );
  }
});

test("Q4_2026 для «Справки по клиенту» требует оба контура доставки SIGMA и OMEGA", () => {
  const text = readRequirements();

  assert.match(text, /для агента «Справка по клиенту» обязательны оба[\s\S]{0,80}SIGMA[\s\S]{0,80}OMEGA/iu);
  assert.match(text, /если для «Справки по клиенту»[\s\S]{0,160}SIGMA[\s\S]{0,40}OMEGA[\s\S]{0,80}заказ не принимается/iu);
  assert.doesNotMatch(text, /«Справка по клиенту»[\s\S]{0,200}(?:один или два|одному или двум)[\s\S]{0,80}контур/iu);
});

test("человекочитаемая граница 2026 года повторяет порядок историй из рабочей книги", () => {
  const text = fs.readFileSync(scopePath, "utf8");
  const expectedOrder = [
    "DC-ST-09", "DC-ST-23", "DC-ST-24", "DC-ST-25", "DC-ST-26",
    "DC-ST-27", "DC-ST-28", "DC-ST-29", "DC-ST-30",
  ];
  let previousPosition = -1;

  for (const storyId of expectedOrder) {
    const position = text.indexOf(`\`${storyId}\``);
    assert.ok(position > previousPosition, `${storyId} должен находиться в порядке рабочей книги`);
    previousPosition = position;
  }
});
