import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const policyPath = "docs/process/methodology/documentation-methodology-policy.json";
const sourceIndexPath = "docs/process/methodology/babok-research-source-index.json";
const traceabilityModelPath = "docs/process/methodology/traceability-model.json";
const artifactMapPath = "docs/process/methodology/methodology-artifact-map.json";
const coverageMapPath = "docs/process/methodology/babok-coverage-map.json";
const navigationSourcePath = "docs/navigation/navigation-source.json";
const fixtureCasesPath = "tests/fixtures/documentation-methodology/fixture-cases.json";
const goldenDiagnosticPath = "tests/fixtures/documentation-methodology/golden-diagnostic-report.json";

const validationLevel = process.argv.includes("--level=baseline")
  ? "baseline"
  : process.argv.includes("--level=advisory")
    ? "advisory"
    : "strict";

const expectedLifecycle = [
  "idea",
  "discovery",
  "business_analysis",
  "system_analysis",
  "architecture",
  "backlog",
  "delivery",
  "testing",
  "release",
  "operations",
  "change_management",
];

const expectedTraceabilityChain = [
  "business_goal",
  "stakeholder_need",
  "business_requirement",
  "system_requirement",
  "interface_requirement",
  "data_requirement",
  "nfr_requirement",
  "error_requirement",
  "backlog_item",
  "acceptance_test",
  "evidence",
  "release_record",
  "telemetry_or_feedback",
  "improvement_item",
];

const expectedGateSets = {
  business_analysis: [
    "problem_defined",
    "business_value_measurable",
    "stakeholders_identified",
    "scope_defined",
    "success_metrics_defined",
    "business_rules_recorded",
    "business_requirements_traceable",
  ],
  system_analysis: [
    "behavior_defined",
    "data_defined",
    "integrations_defined",
    "nfr_defined",
    "errors_defined",
    "acceptance_criteria_defined",
    "verification_method_defined",
  ],
  ai_agent_solution: [
    "agent_goal_defined",
    "tools_defined",
    "permissions_defined",
    "human_approval_defined",
    "traces_defined",
    "evals_defined",
    "guardrails_defined",
    "explainability_defined",
  ],
};

const requiredArtifactTypes = new Set([
  "business_requirements",
  "system_analysis",
  "backlog_mapping",
  "acceptance_and_tests",
  "release_and_operations",
  "ai_agent_governance",
  "methodology_templates",
]);

const requiredBabokKnowledgeAreas = [
  "Business Analysis Planning & Monitoring",
  "Elicitation & Collaboration",
  "Requirements Life Cycle Management",
  "Strategy Analysis",
  "Requirements Analysis & Design Definition",
  "Solution Evaluation",
];

const requiredClassifications = ["manual", "machine_readable", "template", "generated", "evidence", "reference"];

const templateRequirements = {
  brd: {
    path: "docs/process/methodology/templates/brd-template.md",
    check: "template.brd",
    sections: [
      "Проблема И Контекст",
      "Бизнес-Цель",
      "Измеримая Ценность",
      "Заинтересованные Стороны",
      "Границы",
      "Бизнес-Правила",
      "Метрики Успеха",
      "Бизнес-Требования",
      "Предположения И Ограничения",
      "Открытые Вопросы",
      "Traceability Links",
    ],
  },
  srs: {
    path: "docs/process/methodology/templates/srs-template.md",
    check: "template.srs",
    sections: [
      "Системный Контекст",
      "Сценарии И Поведение",
      "Функциональные Требования",
      "Данные И Доменная Модель",
      "Интеграции И Интерфейсы",
      "API/Schema Impact",
      "NFR С Метриками",
      "Ошибки И Edge Cases",
      "Acceptance Criteria",
      "Verification Method",
      "Architecture Handoff",
      "Traceability Links",
    ],
  },
  stakeholder_map: {
    path: "docs/process/methodology/templates/stakeholder-map-template.md",
    check: "template.stakeholder-map",
    sections: ["Stakeholder Map", "Решения И Подтверждения"],
  },
  elicitation_log: {
    path: "docs/process/methodology/templates/elicitation-log-template.md",
    check: "template.elicitation-log",
    sections: ["Elicitation Log", "Классификация Записи"],
  },
  change_request_impact_analysis: {
    path: "docs/process/methodology/templates/change-request-impact-analysis-template.md",
    check: "template.change-request-impact-analysis",
    sections: [
      "Источник Изменения",
      "Затронутые Требования",
      "Затронутые Backlog Items",
      "Затронутые Architecture/Schema/Test/Release Artifacts",
      "Оценка Влияния",
      "Решение",
      "Baseline/Change Status",
    ],
  },
  story_readiness: {
    path: "docs/process/methodology/templates/story-readiness-report-template.md",
    check: "template.story-readiness-report",
    sections: [
      "Story",
      "Связанный Business Requirement",
      "Связанный System Requirement",
      "Acceptance Criteria",
      "Verification Method",
      "Dependency/Blocked Status",
      "Readiness Verdict",
      "Missing Gates",
    ],
  },
  solution_evaluation: {
    path: "docs/process/methodology/templates/solution-evaluation-report-template.md",
    check: "template.solution-evaluation-report",
    sections: [
      "Реализованная Capability",
      "Ожидаемая Бизнес-Ценность",
      "Фактический Сигнал Или Метрика",
      "Release Evidence",
      "Telemetry Или Feedback",
      "Gap/Improvement Item",
    ],
  },
};

const requiredNavigationPaths = [
  sourceIndexPath,
  traceabilityModelPath,
  artifactMapPath,
  coverageMapPath,
  ...Object.values(templateRequirements).map((template) => template.path),
];

const diagnostics = [];
const validators = new Map();
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function diagnostic(target, fields) {
  target.push({
    severity: fields.severity || "error",
    artifact_path: fields.artifact_path,
    check: fields.check,
    ...(fields.missing_gate ? { missing_gate: fields.missing_gate } : {}),
    ...(fields.broken_link ? { broken_link: fields.broken_link } : {}),
    remediation_hint: fields.remediation_hint,
  });
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function failWithDiagnostics() {
  const report = {
    version: "0.1.0",
    validation_level: validationLevel,
    diagnostics,
  };
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

function requireFile(relativePath, check = "file.exists") {
  if (!fs.existsSync(absolute(relativePath))) {
    diagnostic(diagnostics, {
      artifact_path: relativePath,
      check,
      broken_link: relativePath,
      remediation_hint: `Создайте или зарегистрируйте обязательный artifact: ${relativePath}.`,
    });
    return false;
  }
  return true;
}

function validateSchema(dataPath, schemaPath) {
  if (!requireFile(dataPath, "schema.data_exists") || !requireFile(schemaPath, "schema.exists")) {
    return;
  }

  const data = readJson(dataPath);
  let validate = validators.get(schemaPath);
  if (!validate) {
    validate = ajv.compile(readJson(schemaPath));
    validators.set(schemaPath, validate);
  }

  if (!validate(data)) {
    diagnostic(diagnostics, {
      artifact_path: dataPath,
      check: `schema:${schemaPath}`,
      remediation_hint: `Приведите ${dataPath} к контракту ${schemaPath}: ${ajv.errorsText(validate.errors)}`,
    });
  }
}

function sameArray(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function checkExactArray(actual, expected, artifactPath, check, target = diagnostics) {
  if (sameArray(actual, expected)) {
    return;
  }

  const missing = expected.find((item) => !actual.includes(item));
  diagnostic(target, {
    artifact_path: artifactPath,
    check,
    missing_gate: missing,
    remediation_hint: missing
      ? `Добавьте обязательный элемент ${missing} в ${check}.`
      : `Синхронизируйте порядок и состав ${check} с методическим контрактом.`,
  });
}

function checkGateSet(policy, group, expected, artifactPath, target = diagnostics) {
  const actual = policy.quality_gate_policy?.[group] || [];
  checkExactArray(actual, expected, artifactPath, `quality_gate_policy.${group}`, target);
}

function checkPolicy(policy, artifactPath, target = diagnostics) {
  checkExactArray(policy.lifecycle_policy || [], expectedLifecycle, artifactPath, "lifecycle_policy", target);
  for (const [group, expected] of Object.entries(expectedGateSets)) {
    checkGateSet(policy, group, expected, artifactPath, target);
  }

  const artifactTypes = new Set((policy.artifact_policy || []).map((item) => item.artifact_type));
  for (const requiredType of requiredArtifactTypes) {
    if (!artifactTypes.has(requiredType)) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "artifact_policy",
        missing_gate: requiredType,
        remediation_hint: `Добавьте artifact_policy для ${requiredType}.`,
      });
    }
  }

  const levelIds = (policy.validation_levels || []).map((level) => level.id);
  checkExactArray(levelIds, ["baseline", "advisory", "strict"], artifactPath, "validation_levels", target);

  const severityValues = policy.gate_severity?.allowed_values || [];
  checkExactArray(severityValues, ["error", "warning", "advisory"], artifactPath, "gate_severity.allowed_values", target);

  if (!policy.exception_policy?.not_applicable?.rationale_required) {
    diagnostic(target, {
      artifact_path: artifactPath,
      check: "exception_policy.not_applicable",
      missing_gate: "rationale_required",
      remediation_hint: "Исключение not_applicable должно требовать rationale в policy.",
    });
  }

  if (!policy.agent_governance?.requires_human_confirmation?.includes("change_product_backlog_priority")) {
    diagnostic(target, {
      artifact_path: artifactPath,
      check: "agent_governance.requires_human_confirmation",
      missing_gate: "change_product_backlog_priority",
      remediation_hint: "Изменение приоритета backlog должно требовать подтверждения человека.",
    });
  }

  if (policy.agent_governance?.allowed_without_confirmation?.includes("change_product_backlog_priority")) {
    diagnostic(target, {
      artifact_path: artifactPath,
      check: "agent_governance.allowed_without_confirmation",
      missing_gate: "human_confirmation",
      remediation_hint: "Удалите change_product_backlog_priority из allowed_without_confirmation.",
    });
  }
}

function checkSourceIndex(sourceIndex, artifactPath, target = diagnostics) {
  if (!Array.isArray(sourceIndex.entries) || sourceIndex.entries.length === 0) {
    diagnostic(target, {
      artifact_path: artifactPath,
      check: "source_index.entries",
      remediation_hint: "Заполните source index нормализованными фрагментами с locator и content_hash.",
    });
    return;
  }

  for (const entry of sourceIndex.entries) {
    for (const field of [
      "source_id",
      "section_id",
      "section_title",
      "topic",
      "applies_to",
      "rule_summary",
      "locator",
      "content_hash",
      "source_file_reference",
      "source_date_or_version",
    ]) {
      const value = entry[field];
      if (Array.isArray(value) ? value.length === 0 : !value) {
        diagnostic(target, {
          artifact_path: artifactPath,
          check: "source_index.entry",
          missing_gate: field,
          remediation_hint: `Заполните поле ${field} для ${entry.source_id || "source index entry"}.`,
        });
      }
    }

    if (entry.source_file_reference?.includes("Downloads") || entry.locator?.includes("Downloads")) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "source_index.raw_source_boundary",
        broken_link: entry.source_file_reference,
        remediation_hint: "Не ссылайтесь на raw-файлы из Downloads; используйте нормализованный источник в репозитории.",
      });
    }

    if (entry.source_file_reference && !fs.existsSync(absolute(entry.source_file_reference))) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "source_index.source_file_reference",
        broken_link: entry.source_file_reference,
        remediation_hint: "Исправьте source_file_reference на существующий нормализованный artifact.",
      });
    }

    const expectedHash = `sha256:${sha256(entry.rule_summary || "")}`;
    if (entry.content_hash !== expectedHash) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "source_index.content_hash",
        missing_gate: entry.source_id,
        remediation_hint: `Обновите content_hash для ${entry.source_id}: ожидается ${expectedHash}.`,
      });
    }
  }
}

function checkTraceabilityModel(model, artifactPath, target = diagnostics) {
  checkExactArray(model.chain || [], expectedTraceabilityChain, artifactPath, "traceability_model.chain", target);

  const nodeIds = new Set((model.nodes || []).map((node) => node.id));
  for (const nodeId of expectedTraceabilityChain) {
    if (!nodeIds.has(nodeId)) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "traceability_model.nodes",
        missing_gate: nodeId,
        remediation_hint: `Добавьте node ${nodeId} в traceability model.`,
      });
    }
  }

  const linkTypes = new Set((model.link_types || []).map((link) => link.id));
  for (const linkType of ["derives_from", "satisfies", "verifies", "implements", "impacts", "supersedes", "monitors"]) {
    if (!linkTypes.has(linkType)) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "traceability_model.link_types",
        missing_gate: linkType,
        remediation_hint: `Добавьте link type ${linkType}.`,
      });
    }
  }

  const coverageMetrics = new Set((model.coverage_report_expectations || []).map((metric) => metric.metric_id));
  for (const metricId of [
    "requirements_with_business_trace",
    "requirements_with_system_trace",
    "backlog_items_with_requirement_trace",
    "requirements_with_acceptance_criteria",
    "requirements_with_verification_method",
    "released_requirements_with_evidence",
    "orphan_stale_missing_links",
  ]) {
    if (!coverageMetrics.has(metricId)) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "traceability_model.coverage_report_expectations",
        missing_gate: metricId,
        remediation_hint: `Добавьте coverage expectation ${metricId}.`,
      });
    }
  }
}

function checkArtifactMap(artifactMap, artifactPath, target = diagnostics) {
  checkExactArray(
    artifactMap.classification_values || [],
    requiredClassifications,
    artifactPath,
    "artifact_map.classification_values",
    target,
  );

  for (const entrypoint of [
    artifactMap.entrypoints?.primary,
    artifactMap.entrypoints?.templates,
    ...(artifactMap.entrypoints?.machine_support_artifacts || []),
  ]) {
    if (!entrypoint || !fs.existsSync(absolute(entrypoint))) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "artifact_map.entrypoints",
        broken_link: entrypoint,
        remediation_hint: "Исправьте entrypoint в methodology-artifact-map.json.",
      });
    }
  }

  for (const artifact of artifactMap.artifacts || []) {
    if (!fs.existsSync(absolute(artifact.path))) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "artifact_map.artifacts",
        broken_link: artifact.path,
        remediation_hint: `Зарегистрированный methodology artifact не найден: ${artifact.path}.`,
      });
    }
  }
}

function checkCoverageMap(coverageMap, artifactPath, target = diagnostics) {
  const actualAreas = new Set((coverageMap.knowledge_areas || []).map((area) => area.knowledge_area));
  for (const knowledgeArea of requiredBabokKnowledgeAreas) {
    if (!actualAreas.has(knowledgeArea)) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: "babok_coverage_map.knowledge_areas",
        missing_gate: knowledgeArea,
        remediation_hint: `Добавьте BABOK coverage entry для ${knowledgeArea}.`,
      });
    }
  }

  for (const area of coverageMap.knowledge_areas || []) {
    for (const field of [
      "datacanvas_artifacts",
      "policy_sections",
      "validator_checks",
      "required_artifacts",
      "applicable_gates",
      "expected_evidence",
    ]) {
      if (!Array.isArray(area[field]) || area[field].length === 0) {
        diagnostic(target, {
          artifact_path: artifactPath,
          check: `babok_coverage_map.${field}`,
          missing_gate: area.knowledge_area,
          remediation_hint: `Заполните ${field} для ${area.knowledge_area}.`,
        });
      }
    }
  }
}

function checkTemplate(templateKey, artifactPath, target = diagnostics) {
  const template = templateRequirements[templateKey];
  if (!template) {
    fail(`unknown template key: ${templateKey}`);
  }
  if (!fs.existsSync(absolute(artifactPath))) {
    diagnostic(target, {
      artifact_path: artifactPath,
      check: template.check,
      broken_link: artifactPath,
      remediation_hint: `Создайте template artifact ${artifactPath}.`,
    });
    return;
  }

  const text = readText(artifactPath);
  for (const section of template.sections) {
    if (!text.includes(section)) {
      diagnostic(target, {
        artifact_path: artifactPath,
        check: template.check,
        missing_gate: section,
        remediation_hint: `Добавьте обязательный раздел ${section} в ${path.basename(artifactPath)}.`,
      });
    }
  }
}

function checkNfrMetricSample(artifactPath, target = diagnostics) {
  const lines = readText(artifactPath).split("\n").filter((line) => /NFR-\d+/.test(line));
  const missingMetric = lines.some((line) => !/метрик|metric|p\d+|<=|>=|\d+\s*(ms|s|%)/i.test(line));
  if (lines.length === 0 || missingMetric) {
    diagnostic(target, {
      artifact_path: artifactPath,
      check: "nfr.metric",
      missing_gate: "nfr_metric",
      remediation_hint: "Укажите измеримую метрику для каждого NFR.",
    });
  }
}

function checkStoryReadinessTrace(artifactPath, target = diagnostics) {
  const text = readText(artifactPath);
  if (!/Trace link:/i.test(text) || !/Requirement id:/i.test(text)) {
    diagnostic(target, {
      artifact_path: artifactPath,
      check: "story_readiness.requirement_trace",
      missing_gate: "requirement_trace",
      remediation_hint: "Добавьте связанный business/system requirement и trace link в story readiness report.",
    });
  }
}

function checkNavigationRegistration(navigationSource, target = diagnostics) {
  const managed = new Set(navigationSource.managed_entries.map((entry) => entry.path));
  const ignored = navigationSource.ignored_paths.map((entry) => entry.path);

  for (const requiredPath of requiredNavigationPaths) {
    const ignoredByPrefix = ignored.some((ignoredPath) => requiredPath === ignoredPath || requiredPath.startsWith(`${ignoredPath}/`));
    if (!managed.has(requiredPath) && !ignoredByPrefix) {
      diagnostic(target, {
        artifact_path: navigationSourcePath,
        check: "navigation.registration",
        broken_link: requiredPath,
        remediation_hint: `Добавьте ${requiredPath} в managed_entries или ignored_paths с причиной.`,
      });
    }
  }
}

function checkMethodologyText() {
  const methodologyText = readText("docs/process/methodology/project-documentation-methodology.md");
  for (const requiredText of [
    "Backlog не подменяет анализ",
    "business goal",
    "AI-Агентные Решения",
    "Возобновление Остановленного Интервью",
  ]) {
    if (!methodologyText.includes(requiredText)) {
      diagnostic(diagnostics, {
        artifact_path: "docs/process/methodology/project-documentation-methodology.md",
        check: "methodology.required_text",
        missing_gate: requiredText,
        remediation_hint: `Добавьте или восстановите методический текст: ${requiredText}.`,
      });
    }
  }

  const readmeText = readText("docs/process/methodology/README.md");
  for (const requiredText of ["Источники И Precedence", "Как Работать Агенту", "Режим Остановленного Интервью"]) {
    if (!readmeText.includes(requiredText)) {
      diagnostic(diagnostics, {
        artifact_path: "docs/process/methodology/README.md",
        check: "methodology_readme.agent_contract",
        missing_gate: requiredText,
        remediation_hint: `Добавьте раздел README: ${requiredText}.`,
      });
    }
  }
}

function checkProcessBacklog() {
  const processBacklog = readText("docs/process/current/process-backlog.md");
  for (const requiredId of ["PROC-039", "PROC-040", "PROC-041", "PROC-042", "PROC-043", "PROC-044", "PROC-045"]) {
    if (!processBacklog.includes(requiredId)) {
      diagnostic(diagnostics, {
        artifact_path: "docs/process/current/process-backlog.md",
        check: "process_backlog.methodology_rollout",
        missing_gate: requiredId,
        remediation_hint: `Добавьте follow-up process item ${requiredId}.`,
      });
    }
  }

  if (!processBacklog.includes("npm run validate:documentation-methodology")) {
    diagnostic(diagnostics, {
      artifact_path: "docs/process/current/process-backlog.md",
      check: "process_backlog.validation",
      missing_gate: "validate:documentation-methodology",
      remediation_hint: "Process backlog должен ссылаться на methodology validation.",
    });
  }
}

function materializePolicyMutation(fixturePath) {
  const fixture = readJson(fixturePath);
  const policy = readJson(fixture.base_policy_path);
  if (fixture.mutation !== "remove_gate") {
    fail(`unknown policy fixture mutation: ${fixture.mutation}`);
  }
  policy.quality_gate_policy[fixture.gate_group] = policy.quality_gate_policy[fixture.gate_group].filter(
    (gate) => gate !== fixture.gate,
  );
  return policy;
}

function normalizeGoldenDiagnostic(diagnosticItem) {
  return {
    severity: diagnosticItem.severity,
    artifact_path: diagnosticItem.artifact_path,
    check: diagnosticItem.check,
    ...(diagnosticItem.missing_gate ? { missing_gate: diagnosticItem.missing_gate } : {}),
    ...(diagnosticItem.broken_link ? { broken_link: diagnosticItem.broken_link } : {}),
    remediation_hint: diagnosticItem.remediation_hint,
  };
}

function checkFixtures() {
  const fixtureCases = readJson(fixtureCasesPath);
  const negativeDiagnostics = [];

  for (const testCase of fixtureCases.valid_cases) {
    if (testCase.kind === "template") {
      checkTemplate(testCase.template_type, testCase.path, diagnostics);
      continue;
    }
    if (testCase.kind === "policy") {
      checkPolicy(readJson(testCase.path), testCase.path, diagnostics);
      continue;
    }
    if (testCase.kind === "source_index") {
      checkSourceIndex(readJson(testCase.path), testCase.path, diagnostics);
      continue;
    }
    if (testCase.kind === "traceability_model") {
      checkTraceabilityModel(readJson(testCase.path), testCase.path, diagnostics);
      continue;
    }
    fail(`valid fixture case has unknown kind: ${testCase.kind}`);
  }

  for (const testCase of fixtureCases.negative_cases) {
    const beforeCount = negativeDiagnostics.length;
    if (testCase.kind === "policy_gate_removed") {
      const mutatedPolicy = materializePolicyMutation(testCase.fixture_path);
      checkGateSet(
        mutatedPolicy,
        testCase.gate_group,
        expectedGateSets[testCase.gate_group],
        testCase.fixture_path,
        negativeDiagnostics,
      );
    } else if (testCase.kind === "source_index") {
      checkSourceIndex(readJson(testCase.fixture_path), testCase.fixture_path, negativeDiagnostics);
    } else if (testCase.kind === "traceability_model") {
      checkTraceabilityModel(readJson(testCase.fixture_path), testCase.fixture_path, negativeDiagnostics);
    } else if (testCase.kind === "template") {
      checkTemplate(testCase.template_type, testCase.fixture_path, negativeDiagnostics);
    } else if (testCase.kind === "nfr_sample") {
      checkNfrMetricSample(testCase.fixture_path, negativeDiagnostics);
    } else if (testCase.kind === "story_readiness_sample") {
      checkStoryReadinessTrace(testCase.fixture_path, negativeDiagnostics);
    } else {
      fail(`negative fixture case has unknown kind: ${testCase.kind}`);
    }

    if (negativeDiagnostics.length === beforeCount) {
      diagnostic(diagnostics, {
        artifact_path: testCase.fixture_path,
        check: "fixture.negative",
        missing_gate: testCase.id,
        remediation_hint: "Negative fixture не вызвал ожидаемую диагностику.",
      });
    }
  }

  const actual = negativeDiagnostics.map(normalizeGoldenDiagnostic);
  const expected = readJson(goldenDiagnosticPath).diagnostics.map(normalizeGoldenDiagnostic);
  if (JSON.stringify(actual, null, 2) !== JSON.stringify(expected, null, 2)) {
    console.error("Actual negative fixture diagnostics:");
    console.error(JSON.stringify(actual, null, 2));
    console.error("Expected golden diagnostics:");
    console.error(JSON.stringify(expected, null, 2));
    fail("documentation methodology golden diagnostic report mismatch");
  }
}

for (const requiredPath of [
  policyPath,
  "schemas/documentation-methodology-policy.schema.json",
  sourceIndexPath,
  "schemas/babok-research-source-index.schema.json",
  traceabilityModelPath,
  "schemas/methodology-traceability-model.schema.json",
  artifactMapPath,
  "schemas/methodology-artifact-map.schema.json",
  coverageMapPath,
  "schemas/babok-coverage-map.schema.json",
  fixtureCasesPath,
  goldenDiagnosticPath,
]) {
  requireFile(requiredPath);
}

validateSchema(policyPath, "schemas/documentation-methodology-policy.schema.json");
validateSchema(sourceIndexPath, "schemas/babok-research-source-index.schema.json");
validateSchema(traceabilityModelPath, "schemas/methodology-traceability-model.schema.json");
validateSchema(artifactMapPath, "schemas/methodology-artifact-map.schema.json");
validateSchema(coverageMapPath, "schemas/babok-coverage-map.schema.json");

const policy = readJson(policyPath);
const sourceIndex = readJson(sourceIndexPath);
const traceabilityModel = readJson(traceabilityModelPath);
const artifactMap = readJson(artifactMapPath);
const coverageMap = readJson(coverageMapPath);
const navigationSource = readJson(navigationSourcePath);

for (const linkedPath of [
  policy.source_methodology.summary_path,
  policy.source_methodology.policy_path,
  policy.source_methodology.source_index_path,
  policy.source_methodology.traceability_model_path,
  policy.source_methodology.artifact_map_path,
  policy.source_methodology.coverage_map_path,
]) {
  requireFile(linkedPath, "policy.linked_artifact");
}

checkPolicy(policy, policyPath);
checkSourceIndex(sourceIndex, sourceIndexPath);
checkTraceabilityModel(traceabilityModel, traceabilityModelPath);
checkArtifactMap(artifactMap, artifactMapPath);
checkCoverageMap(coverageMap, coverageMapPath);

for (const [templateKey, template] of Object.entries(templateRequirements)) {
  checkTemplate(templateKey, template.path);
}

checkNavigationRegistration(navigationSource);
checkMethodologyText();
checkProcessBacklog();
checkFixtures();

if (diagnostics.some((item) => item.severity === "error")) {
  failWithDiagnostics();
}

console.log("documentation methodology validation passed");
