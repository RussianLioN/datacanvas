import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contractPath = "docs/process/universal-documentation-workflow/business-artifact-content-contract.json";
const positiveCasesPath = "tests/fixtures/business-docs/positive/cases.json";
const negativeCasesPath = "tests/fixtures/business-docs/negative/cases.json";

const staticGlobalRules = [
  {
    id: "service-header",
    pattern: /^(?:[-*]\s*)?(?:Статус|Владелец|Проверка|Дата обновления|Область):/imu,
    message: "служебные заголовки должны храниться в реестрах, манифестах или процессных артефактах",
  },
  {
    id: "local-path",
    pattern: /(?:\/Users\/|file:\/\/)/u,
    message: "локальные абсолютные пути нельзя фиксировать в бизнесовых или экспортных документах",
  },
  {
    id: "sha",
    pattern: /\b(?:sha256|SHA-?256)\b\s*[:=]?\s*[a-f0-9]{16,}/iu,
    message: "хэши относятся к machine-readable реестрам и проверочным артефактам",
  },
  {
    id: "validation-command",
    pattern: /(?:npm run|node scripts\/|python3 scripts\/|git diff --check)/u,
    message: "команды проверки не должны быть частью бизнесового текста",
  },
  {
    id: "raw-service-json",
    pattern: /"(?:source_refs|validation_status|technical_trace|internal_prompts|request_id|trace_id)"\s*:/u,
    message: "сырой JSON относится к машинному слою",
  },
  {
    id: "technical-contract",
    pattern: /\b(?:PresentationSpec|schema validation|Renderer|HTML\/PDF\/PNG|request ID|trace ID|status code|launch mode|callback)\b|обратн(?:ый|ого)\s+вызов/iu,
    message: "технические контракты, runtime-поля и транспортные детали должны быть вынесены из бизнесового текста",
  },
  {
    id: "source-mechanics",
    pattern: /\b(?:Excel(?:\s+row|-строк|-матриц[аеы]?)?|OPML|RTF|sheetViews|cached totals|comments1\.xml|vmlDrawing|XML-пакет)\b/iu,
    message: "механика источников и файлового пакета относится к source/provenance или evidence",
  },
  {
    id: "sensitive-evidence",
    pattern: /\b(?:raw traces|raw confidential data|internal prompts|tool outputs|local paths)\b/iu,
    message: "детали чувствительных проверочных следов не должны попадать в бизнесовый текст",
  },
  {
    id: "generated-metadata",
    pattern: /\b(?:generator contracts|allowed writes|hash manifest|generated refresh|mutation guard)\b/iu,
    message: "метаданные генерации относятся к процессному и generated-контуру",
  },
];

const classRules = {
  stories: [
    {
      id: "effort-estimation-in-story",
      pattern: /(?:ПШЕ|чел\/дн|оценк[аи]\s+трудозатрат|ресурсн(?:ая|ой)\s+матриц[аы])/iu,
      message: "оценки и ресурсные матрицы должны храниться в backlog/source/provenance контуре, а не в story catalog",
    },
    {
      id: "source-column",
      pattern: /\|\s*(?:Excel row|Оценка|Комментарий Excel)\s*\|/iu,
      message: "story table не должна содержать служебные колонки источника или оценки",
    },
  ],
  requirements: [
    {
      id: "evidence-column",
      pattern: /\|\s*Ожидаемое доказательство\s*\|/iu,
      message: "доказательства проверки должны храниться в traceability/evidence JSON, а не в таблице бизнес-требований",
    },
    {
      id: "security-runtime-detail",
      pattern: /\b(?:secret scan|data leakage checks|runtime state|prompt injection|sanitization)\b/iu,
      message: "технические security/runtime проверки должны быть в security или evidence слое",
    },
  ],
  acceptance: [
    {
      id: "evidence-column",
      pattern: /\|\s*Ожидаемое доказательство\s*\|/iu,
      message: "критерии приемки должны описывать бизнес-результат, а точные доказательства должны жить в JSON/evidence",
    },
    {
      id: "technical-acceptance",
      pattern: /\b(?:claim map|secret scan|data leakage checks|sanitization evidence|export IDs)\b/iu,
      message: "техническая проверка приемки должна быть вынесена в проверочный контур",
    },
  ],
  backlog: [
    {
      id: "technical-pbi",
      pattern: /\b(?:mock data|schema validator|human review flow|PresentationSpec)\b/iu,
      message: "продуктовый backlog не должен описывать технические реализации как бизнесовые PBI",
    },
    {
      id: "effort-detail",
      pattern: /(?:ПШЕ|Excel-версии|рабочая Excel|матриц[аеы]\s+оценк)/iu,
      message: "черновые оценки и Excel-детали не должны быть основным текстом product backlog",
    },
  ],
  nonfunctional: [
    {
      id: "fit-command-column",
      pattern: /\|\s*(?:Проверка|Команда)\s*\|/iu,
      message: "NFR должен описывать требование и условие приемки, а не команды проверки",
    },
  ],
  confluence_export: [
    {
      id: "internal-evidence-export",
      pattern: /(?:internal evidence|raw local|локальные пути|sensitive\/confidential|redacted metadata)/iu,
      message: "карта импорта должна отделять экспортируемый бизнес-пакет от внутреннего evidence и редактирования",
    },
    {
      id: "stale-story-range",
      pattern: /DC-ST-23\.\.DC-ST-28/u,
      message: "карта импорта должна учитывать актуальный диапазон DC-ST-23..DC-ST-29",
    },
  ],
};

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function lineForIndex(text, index) {
  return text.slice(0, index).split("\n").length;
}

function compileContractRules(contract) {
  return contract.global_forbidden_patterns.map((rule) => ({
    id: rule.id,
    pattern: new RegExp(rule.pattern, "imu"),
    message: rule.message,
  }));
}

function normalizeDocument(document) {
  return {
    ...document,
    className: document.className ?? document.class_name,
    breadcrumbRequired: document.breadcrumbRequired ?? document.breadcrumb_required,
    lockPath: document.lockPath ?? document.lock_path,
  };
}

function normalizeFixture(sample) {
  return {
    ...sample,
    className: sample.className ?? sample.class_name,
  };
}

function rulesFor(className, contractRules) {
  return [...staticGlobalRules, ...contractRules, ...(classRules[className] ?? [])];
}

function contractClass(contract, className) {
  return contract.artifact_classes.find((candidate) => candidate.class_name === className);
}

function getH2Sections(text) {
  const sections = [];
  const regex = /^##\s+(.+?)\s*$/gmu;
  let match;
  while ((match = regex.exec(text)) !== null) {
    sections.push({
      title: match[1].trim(),
      line: lineForIndex(text, match.index),
      index: match.index,
    });
  }
  return sections;
}

function splitMarkdownRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function parseMarkdownTables(text) {
  const lines = text.split(/\r?\n/u);
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const current = lines[index].trim();
    const separator = lines[index + 1].trim();
    if (!current.startsWith("|") || !separator.startsWith("|") || !/^\|?\s*:?-{3,}/u.test(separator)) {
      continue;
    }

    const tableLines = [lines[index], lines[index + 1]];
    let cursor = index + 2;
    while (cursor < lines.length && lines[cursor].trim().startsWith("|")) {
      tableLines.push(lines[cursor]);
      cursor += 1;
    }

    const headers = splitMarkdownRow(tableLines[0]);
    const rows = tableLines.slice(2).map((line, rowIndex) => {
      const values = splitMarkdownRow(line);
      const object = {};
      headers.forEach((header, headerIndex) => {
        object[header] = values[headerIndex] ?? "";
      });
      return {
        line: index + rowIndex + 3,
        values,
        object,
      };
    });

    tables.push({
      line: index + 1,
      headers,
      rows,
    });
    index = cursor - 1;
  }
  return tables;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function addViolation(violations, id, message, line, match = "") {
  violations.push({
    rule: { id, message },
    line,
    match,
  });
}

function validateStoryCatalog(text, document, artifactClass, violations) {
  const sections = getH2Sections(text);
  const sectionTitles = sections.map((section) => section.title);
  const requiredSections = artifactClass.required_h2 ?? [];
  const allowedSections = artifactClass.allowed_h2 ?? [];
  const forbiddenSections = new Set(artifactClass.forbidden_h2 ?? []);

  for (const requiredSection of requiredSections) {
    if (!sectionTitles.includes(requiredSection)) {
      addViolation(
        violations,
        "story-catalog-required-section",
        `в каталоге пользовательских историй должен быть раздел "${requiredSection}"`,
        1,
        requiredSection,
      );
    }
  }

  for (const section of sections) {
    if (forbiddenSections.has(section.title) || (allowedSections.length > 0 && !allowedSections.includes(section.title))) {
      addViolation(
        violations,
        "story-catalog-forbidden-section",
        "каталог пользовательских историй не должен содержать служебные, сводные или внешние по смыслу разделы",
        section.line,
        section.title,
      );
    }
  }

  const tables = parseMarkdownTables(text);
  if (tables.length !== 1) {
    addViolation(
      violations,
      "story-catalog-single-table",
      "каталог пользовательских историй должен содержать одну основную таблицу",
      1,
      `${tables.length}`,
    );
    return;
  }

  const table = tables[0];
  const requiredColumns = artifactClass.required_table_columns ?? [];
  const forbiddenColumns = new Set(artifactClass.forbidden_table_columns ?? []);
  if (JSON.stringify(table.headers) !== JSON.stringify(requiredColumns)) {
    addViolation(
      violations,
      "story-catalog-table-columns",
      "таблица каталога пользовательских историй должна содержать только бизнесовые колонки в утвержденном порядке",
      table.line,
      table.headers.join(" | "),
    );
  }

  for (const header of table.headers) {
    if (forbiddenColumns.has(header)) {
      addViolation(
        violations,
        "story-catalog-table-columns",
        "таблица каталога пользовательских историй содержит служебную или внешнюю по смыслу колонку",
        table.line,
        header,
      );
    }
  }

  const ids = new Set();
  for (const row of table.rows) {
    const storyId = row.object.ID;
    if (!/^DC-ST-\d{2}$/u.test(storyId)) {
      addViolation(
        violations,
        "story-catalog-story-id",
        "каждая строка каталога должна иметь стабильный идентификатор DC-ST-XX",
        row.line,
        storyId,
      );
    }
    if (ids.has(storyId)) {
      addViolation(
        violations,
        "story-catalog-story-id",
        "идентификаторы пользовательских историй не должны повторяться",
        row.line,
        storyId,
      );
    }
    ids.add(storyId);
  }

  if (!document?.lockPath) {
    return;
  }

  if (!fs.existsSync(absolute(document.lockPath))) {
    addViolation(
      violations,
      "story-catalog-lock-missing",
      "для каталога пользовательских историй должен существовать lock-файл неизменяемого бизнесового текста",
      1,
      document.lockPath,
    );
    return;
  }

  const lock = readJson(document.lockPath);
  const tableById = new Map(table.rows.map((row) => [row.object.ID, row]));
  for (const lockedRow of lock.rows ?? []) {
    const currentRow = tableById.get(lockedRow.story_id);
    if (!currentRow) {
      addViolation(
        violations,
        "story-catalog-lock-missing-row",
        "строка из lock-файла должна присутствовать в каталоге пользовательских историй",
        table.line,
        lockedRow.story_id,
      );
      continue;
    }
    if (sha256(currentRow.object["Пользовательская формулировка"]) !== lockedRow.story_text_sha256) {
      addViolation(
        violations,
        "story-catalog-immutable-content",
        "текст пользовательской истории изменен без отдельного продуктового решения",
        currentRow.line,
        lockedRow.story_id,
      );
    }
    if (sha256(currentRow.object["Бизнес-ценность"]) !== lockedRow.business_value_sha256) {
      addViolation(
        violations,
        "story-catalog-immutable-content",
        "бизнес-ценность пользовательской истории изменена без отдельного продуктового решения",
        currentRow.line,
        lockedRow.story_id,
      );
    }
  }
}

function findViolations(text, className, contract, document = undefined) {
  const violations = [];
  const contractRules = compileContractRules(contract);
  for (const rule of rulesFor(className, contractRules)) {
    const match = rule.pattern.exec(text);
    if (match) {
      violations.push({
        rule,
        line: lineForIndex(text, match.index),
        match: match[0],
      });
    }
  }

  const artifactClass = contractClass(contract, className);
  if (artifactClass?.class_name === "story_catalog") {
    validateStoryCatalog(text, document, artifactClass, violations);
  }

  return violations;
}

function assertBusinessDoc(document, contract) {
  const normalizedDocument = normalizeDocument(document);
  const text = readText(normalizedDocument.path);
  if (normalizedDocument.breadcrumbRequired !== false && !text.includes("Навигация:")) {
    fail(`${normalizedDocument.path} must keep a breadcrumb navigation line`);
  }
  const violations = findViolations(text, normalizedDocument.className, contract, normalizedDocument);
  if (violations.length > 0) {
    const first = violations[0];
    fail(`${normalizedDocument.path}:${first.line} violates ${first.rule.id}: ${first.rule.message}; found "${first.match}"`);
  }
}

function assertFixtures(contract) {
  for (const rawSample of readJson(positiveCasesPath).cases) {
    const sample = normalizeFixture(rawSample);
    const violations = findViolations(sample.content, sample.className, contract);
    if (violations.length > 0) {
      fail(`positive fixture ${sample.id} violates ${violations[0].rule.id}`);
    }
  }

  for (const rawSample of readJson(negativeCasesPath).cases) {
    const sample = normalizeFixture(rawSample);
    const violations = findViolations(sample.content, sample.className, contract);
    if (violations.length === 0) {
      fail(`negative fixture ${sample.id} did not trigger any business-doc rule`);
    }
    if (sample.expected_rule && !violations.some((violation) => violation.rule.id === sample.expected_rule)) {
      fail(`negative fixture ${sample.id} did not trigger expected rule ${sample.expected_rule}`);
    }
  }
}

try {
  const contract = readJson(contractPath);
  assertFixtures(contract);
  for (const document of contract.documents) {
    assertBusinessDoc(document, contract);
  }
  console.log("business document content validation passed");
} catch (error) {
  fail(error.message);
}
