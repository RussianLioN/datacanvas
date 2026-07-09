import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contractPath = "docs/process/universal-documentation-workflow/business-artifact-content-contract.json";
const generationContractPath = "docs/process/universal-documentation-workflow/business-artifact-generation-contract.json";
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
  {
    id: "service-rationale",
    pattern: /\b(?:no-change rationale|impact analysis|dependency graph|source registry|changed_source_set)\b|обосновани[ея]\s+отсутствия\s+правк[и]|анализ\s+влияния/iu,
    message: "служебные обоснования каскада должны храниться в impact/evidence JSON, а не в бизнесовом Markdown",
  },
];

const generationCategoryRules = {
  service_status: {
    id: "service-header",
    pattern: /^(?:[-*]\s*)?(?:Статус|Владелец|Проверка|Дата обновления|Область):/imu,
    message: "служебные заголовки должны храниться в реестрах, манифестах или процессных артефактах",
  },
  local_path: {
    id: "local-path",
    pattern: /(?:\/Users\/|file:\/\/)/u,
    message: "локальные абсолютные пути нельзя фиксировать в бизнесовых или экспортных документах",
  },
  hash: {
    id: "sha",
    pattern: /\b(?:sha256|SHA-?256)\b\s*[:=]?\s*[a-f0-9]{16,}/iu,
    message: "хэши относятся к machine-readable реестрам и проверочным артефактам",
  },
  validation_command: {
    id: "validation-command",
    pattern: /(?:npm run|node scripts\/|python3 scripts\/|git diff --check)/u,
    message: "команды проверки не должны быть частью бизнесового текста",
  },
  raw_json: {
    id: "raw-service-json",
    pattern: /"(?:source_refs|validation_status|technical_trace|internal_prompts|request_id|trace_id)"\s*:/u,
    message: "сырой JSON относится к машинному слою",
  },
  technical_contract: {
    id: "technical-contract",
    pattern: /\b(?:PresentationSpec|schema validation|Renderer|HTML\/PDF\/PNG|request ID|trace ID|status code|launch mode|callback)\b|обратн(?:ый|ого)\s+вызов/iu,
    message: "технические контракты, runtime-поля и транспортные детали должны быть вынесены из бизнесового текста",
  },
  source_mechanics: {
    id: "source-mechanics",
    pattern: /\b(?:Excel(?:\s+row|-строк|-матриц[аеы]?)?|OPML|RTF|sheetViews|cached totals|comments1\.xml|vmlDrawing|XML-пакет)\b/iu,
    message: "механика источников и файлового пакета относится к source/provenance или evidence",
  },
  sensitive_evidence: {
    id: "sensitive-evidence",
    pattern: /\b(?:raw traces|raw confidential data|internal prompts|tool outputs|local paths)\b/iu,
    message: "детали чувствительных проверочных следов не должны попадать в бизнесовый текст",
  },
  generated_metadata: {
    id: "generated-metadata",
    pattern: /\b(?:generator contracts|allowed writes|hash manifest|generated refresh|mutation guard)\b/iu,
    message: "метаданные генерации относятся к процессному и generated-контуру",
  },
  service_rationale: {
    id: "service-rationale",
    pattern: /\b(?:no-change rationale|impact analysis|dependency graph|source registry|changed_source_set)\b|обосновани[ея]\s+отсутствия\s+правк[и]|анализ\s+влияния/iu,
    message: "служебные обоснования каскада должны храниться в impact/evidence JSON, а не в бизнесовом Markdown",
  },
  effort_estimation: {
    id: "effort-estimation-in-story",
    pattern: /(?:ПШЕ|чел\/дн|оценк[аи]\s+трудозатрат|ресурсн(?:ая|ой)\s+матриц[аы])/iu,
    message: "оценки и ресурсные матрицы должны храниться в backlog/source/provenance контуре, а не в бизнесовых документах",
  },
};

const classRules = {
  story_catalog: [
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
  business_redirect: [
    {
      id: "redirect-must-not-repeat-table",
      pattern: /^\|.*\|/mu,
      message: "redirect-документ должен только указывать на канон и не повторять таблицу основного артефакта",
    },
  ],
  story_slice: [
    {
      id: "story-slice-repeats-catalog",
      pattern: /\|\s*(?:История|Пользовательская формулировка|Бизнес-ценность)\s*\|/iu,
      message: "плановый story slice не должен повторять полный текст пользовательских историй или бизнес-ценностей",
    },
    {
      id: "story-slice-effort-detail",
      pattern: /(?:ПШЕ|чел\/дн|оценк[аи]\s+трудозатрат|ресурсн(?:ая|ой)\s+матриц[аы])/iu,
      message: "оценки и ресурсные матрицы должны храниться в backlog/source/provenance контуре, а не в story slice",
    },
  ],
  story_slice_export: [
    {
      id: "story-export-local-source",
      pattern: /(?:\/Users\/|file:\/\/|provenance|sha256|node scripts\/|npm run)/iu,
      message: "CSV/export среза историй не должен содержать локальные пути, команды, хэши или provenance",
    },
  ],
  roadmap: [
    {
      id: "roadmap-repeats-backlog",
      pattern: /(?:DC-ST-\d{2}|ПШЕ|чел\/дн|оценк[аи]\s+трудозатрат)/iu,
      message: "roadmap должен описывать порядок поставки, а не повторять stories, backlog или оценки",
    },
    {
      id: "roadmap-technical-contract",
      pattern: /\b(?:PresentationSpec|Renderer|LLM|schema boundary|UAT\/evidence)\b/iu,
      message: "roadmap не должен подменять продуктовый порядок поставки техническими контрактами",
    },
  ],
  hypothesis_board: [
    {
      id: "hypothesis-board-process-hypothesis",
      pattern: /(?:Недельный Scrum|sprint predictability|spillover rate|process metrics)/iu,
      message: "доска продуктовых гипотез не должна хранить процессные эксперименты",
    },
  ],
  hypothesis_validation: [
    {
      id: "hypothesis-validation-repeats-board",
      pattern: /\|\s*ID\s*\|\s*Гипотеза\s*\|/iu,
      message: "план проверки гипотез не должен повторять доску гипотез как второй канон",
    },
    {
      id: "hypothesis-validation-process-hypothesis",
      pattern: /(?:Недельный Scrum|sprint predictability|spillover rate|process metrics)/iu,
      message: "план проверки продуктовых гипотез не должен хранить process-only гипотезы",
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

function compileGenerationCategoryRules(generationContract, generationDocument = undefined) {
  const categories = new Set([
    ...(generationContract?.enforced_forbidden_categories ?? []),
    ...(generationDocument?.enforced_forbidden_categories ?? []),
  ]);
  return [...categories].map((category) => generationCategoryRules[category]).filter(Boolean);
}

function assertKnownGenerationCategories(categories, label) {
  for (const category of categories ?? []) {
    if (!generationCategoryRules[category]) {
      fail(`${label} contains unknown enforced forbidden category: ${category}`);
    }
  }
}

function normalizeDocument(document) {
  return {
    ...document,
    className: document.className ?? document.class_name,
    breadcrumbRequired: document.breadcrumbRequired ?? document.breadcrumb_required,
    lockPath: document.lockPath ?? document.lock_path,
    semanticFamily: document.semanticFamily ?? document.semantic_family,
    artifactRole: document.artifactRole ?? document.artifact_role,
    derivedFrom: document.derivedFrom ?? document.derived_from,
  };
}

function normalizeFixture(sample) {
  return {
    ...sample,
    className: sample.className ?? sample.class_name,
  };
}

function assertReadyOrDoneTodo(todoText, todoId) {
  const pattern = new RegExp(`\\|\\s*${todoId}\\s*\\|[^\\n]*\\|\\s*(?:ready|done)\\s*\\|`, "u");
  if (!pattern.test(todoText)) {
    fail(`business artifact generation contract references missing or inactive process backlog item: ${todoId}`);
  }
}

function assertGenerationContract(contentContract, generationContract) {
  if (generationContract.status !== "active") {
    fail("business artifact generation contract must stay active");
  }
  if (generationContract.source_content_contract !== contentContract.contract_id) {
    fail("business artifact generation contract must reference the active business artifact content contract");
  }
  if (!generationContract.blocking_policy?.required_before_document_cleanup) {
    fail("business artifact generation contract must block document cleanup until generation rules exist");
  }
  if (!generationContract.blocking_policy?.required_before_validator_rollout) {
    fail("business artifact generation contract must block validator rollout until generation rules exist");
  }
  if (!generationContract.blocking_policy?.stop_if_missing_contract) {
    fail("business artifact generation contract must stop when a document generation contract is missing");
  }
  assertKnownGenerationCategories(generationContract.enforced_forbidden_categories, "business artifact generation contract");

  const todoBacklogPath = generationContract.blocking_policy.todo_backlog_path;
  const todoText = readText(todoBacklogPath);
  assertReadyOrDoneTodo(todoText, generationContract.backlog_parent_todo_id);

  const contentDocumentsByPath = new Map(
    contentContract.documents.map((rawDocument) => {
      const document = normalizeDocument(rawDocument);
      return [document.path, document];
    }),
  );
  const generationDocumentsByPath = new Map();

  for (const generationDocument of generationContract.documents) {
    if (generationDocumentsByPath.has(generationDocument.path)) {
      fail(`duplicate business artifact generation contract for ${generationDocument.path}`);
    }
    generationDocumentsByPath.set(generationDocument.path, generationDocument);

    const contentDocument = contentDocumentsByPath.get(generationDocument.path);
    if (!contentDocument) {
      fail(`business artifact generation contract contains a document outside the content contract: ${generationDocument.path}`);
    }
    if (generationDocument.id !== contentDocument.id) {
      fail(`business artifact generation contract id mismatch for ${generationDocument.path}`);
    }
    if (generationDocument.class_name !== contentDocument.className) {
      fail(`business artifact generation contract class mismatch for ${generationDocument.path}`);
    }
    assertKnownGenerationCategories(generationDocument.enforced_forbidden_categories, `business artifact generation contract for ${generationDocument.path}`);
    assertReadyOrDoneTodo(todoText, generationDocument.blocking_todo_id);
  }

  for (const contentDocument of contentDocumentsByPath.values()) {
    if (!generationDocumentsByPath.has(contentDocument.path)) {
      fail(`business artifact generation contract is missing ${contentDocument.path}`);
    }
  }
}

function assertContentContractRoles(contract) {
  const canonicalByFamily = new Map();
  const documents = contract.documents.map(normalizeDocument);

  for (const document of documents) {
    if (!document.semanticFamily || !document.artifactRole) {
      continue;
    }
    if (["redirect", "derived"].includes(document.artifactRole) && (!Array.isArray(document.derivedFrom) || document.derivedFrom.length === 0)) {
      fail(`${document.path} must declare derived_from because it is ${document.artifactRole}`);
    }
    if (document.artifactRole === "canonical") {
      const existing = canonicalByFamily.get(document.semanticFamily);
      if (existing) {
        fail(`semantic family ${document.semanticFamily} has duplicate canonical documents: ${existing} and ${document.path}`);
      }
      canonicalByFamily.set(document.semanticFamily, document.path);
    }
  }

  for (const document of documents) {
    if (!document.semanticFamily || ["canonical", "historical_snapshot", "evidence", "generated", "process_guardrail"].includes(document.artifactRole)) {
      continue;
    }
    const canonicalPath = canonicalByFamily.get(document.semanticFamily);
    if (!canonicalPath) {
      fail(`${document.path} belongs to semantic family ${document.semanticFamily}, but that family has no canonical document`);
    }
    if (document.path === canonicalPath && document.artifactRole !== "canonical") {
      fail(`${document.path} cannot be both canonical and ${document.artifactRole}`);
    }
  }
}

function rulesFor(className, contractRules, generationRules = []) {
  const byId = new Map();
  for (const rule of [...staticGlobalRules, ...contractRules, ...generationRules, ...(classRules[className] ?? [])]) {
    if (!byId.has(rule.id)) {
      byId.set(rule.id, rule);
    }
  }
  return [...byId.values()];
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

function validateSections(text, artifactClass, violations) {
  const requiredSections = artifactClass.required_h2 ?? [];
  const allowedSections = artifactClass.allowed_h2 ?? [];
  if (requiredSections.length === 0 && allowedSections.length === 0) {
    return;
  }

  const sections = getH2Sections(text);
  const sectionTitles = sections.map((section) => section.title);
  for (const requiredSection of requiredSections) {
    if (!sectionTitles.includes(requiredSection)) {
      addViolation(
        violations,
        "business-doc-required-section",
        `документ должен содержать раздел "${requiredSection}"`,
        1,
        requiredSection,
      );
    }
  }

  if (allowedSections.length === 0) {
    return;
  }

  for (const section of sections) {
    if (!allowedSections.includes(section.title)) {
      addViolation(
        violations,
        "business-doc-forbidden-section",
        "документ содержит раздел, не разрешенный контрактом для этого класса артефакта",
        section.line,
        section.title,
      );
    }
  }
}

function findViolations(text, className, contract, document = undefined, generationContract = undefined, generationDocument = undefined) {
  const violations = [];
  const contractRules = compileContractRules(contract);
  const generationRules = compileGenerationCategoryRules(generationContract, generationDocument);
  for (const rule of rulesFor(className, contractRules, generationRules)) {
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
  } else if (artifactClass) {
    validateSections(text, artifactClass, violations);
  }

  return violations;
}

function assertBusinessDoc(document, contract, generationContract) {
  const normalizedDocument = normalizeDocument(document);
  const text = readText(normalizedDocument.path);
  const generationDocument = generationContract.documents.find((candidate) => candidate.path === normalizedDocument.path);
  if (normalizedDocument.breadcrumbRequired !== false && !text.includes("Навигация:")) {
    fail(`${normalizedDocument.path} must keep a breadcrumb navigation line`);
  }
  const violations = findViolations(text, normalizedDocument.className, contract, normalizedDocument, generationContract, generationDocument);
  if (violations.length > 0) {
    const first = violations[0];
    fail(`${normalizedDocument.path}:${first.line} violates ${first.rule.id}: ${first.rule.message}; found "${first.match}"`);
  }
}

function assertFixtures(contract) {
  const validClassNames = new Set(contract.artifact_classes.map((artifactClass) => artifactClass.class_name));
  for (const rawSample of readJson(positiveCasesPath).cases) {
    const sample = normalizeFixture(rawSample);
    if (!validClassNames.has(sample.className)) {
      fail(`positive fixture ${sample.id} uses unknown business artifact class: ${sample.className}`);
    }
    const violations = findViolations(sample.content, sample.className, contract);
    if (violations.length > 0) {
      fail(`positive fixture ${sample.id} violates ${violations[0].rule.id}`);
    }
  }

  for (const rawSample of readJson(negativeCasesPath).cases) {
    const sample = normalizeFixture(rawSample);
    if (!validClassNames.has(sample.className)) {
      fail(`negative fixture ${sample.id} uses unknown business artifact class: ${sample.className}`);
    }
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
  const generationContract = readJson(generationContractPath);
  assertContentContractRoles(contract);
  assertGenerationContract(contract, generationContract);
  assertFixtures(contract);
  for (const document of contract.documents) {
    assertBusinessDoc(document, contract, generationContract);
  }
  console.log("business document content validation passed");
} catch (error) {
  fail(error.message);
}
