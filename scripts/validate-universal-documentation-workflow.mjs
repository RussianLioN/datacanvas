import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  nonNpmWorkflowPlanCommands,
  uncatalogedWorkflowPlanCommands,
} from "./lib/workflow-validation-command-policy.mjs";
import { readReleaseGateState } from "./lib/workflow-release-gate.mjs";

const root = process.cwd();
const mode = process.argv[2] ?? "all";
const packageRoot = "docs/process/universal-documentation-workflow";
const negativeScenariosPath = "tests/fixtures/universal-documentation-workflow/negative/scenarios.json";

const paths = {
  readme: `${packageRoot}/README.md`,
  runbook: `${packageRoot}/universal-workflow-runbook.md`,
  core: `${packageRoot}/universal-workflow-core.json`,
  profile: `${packageRoot}/datacanvas-profile.json`,
  catalog: `${packageRoot}/validation-command-catalog.json`,
  inventory: `${packageRoot}/artifact-inventory.json`,
  generatorContracts: `${packageRoot}/generator-contracts.json`,
  businessArtifactGenerationContract: `${packageRoot}/business-artifact-generation-contract.json`,
  businessClaimMap: "docs/product/requirements/business-claim-map.json",
  mainArtifactLifecycleChain: `${packageRoot}/main-artifact-lifecycle-chain.json`,
  state: `${packageRoot}/workflow-state.json`,
  decisionQueue: `${packageRoot}/decision-queue.json`,
  decisionLedger: `${packageRoot}/decision-ledger.json`,
  acceptanceRecords: `${packageRoot}/acceptance-records.json`,
  runLedger: `${packageRoot}/run-ledger.json`,
  eventLog: `${packageRoot}/event-log.json`,
  schemaCoverage: `${packageRoot}/schema-coverage-registry.json`,
  mutationGuard: `${packageRoot}/mutation-guard-policy.json`,
  portabilityPack: `${packageRoot}/portability-pack.json`,
  bootstrapPack: `${packageRoot}/product-bootstrap-pack.json`,
};

const schemaCases = [
  ["schemas/universal-documentation-core.schema.json", paths.core],
  ["schemas/datacanvas-documentation-profile.schema.json", paths.profile],
  ["schemas/validation-command-catalog.schema.json", paths.catalog],
  ["schemas/documentation-artifact-inventory.schema.json", paths.inventory],
  ["schemas/generator-contracts.schema.json", paths.generatorContracts],
  ["schemas/business-artifact-generation-contract.schema.json", paths.businessArtifactGenerationContract],
  ["schemas/business-claim-map.schema.json", paths.businessClaimMap],
  ["schemas/main-artifact-lifecycle-chain.schema.json", paths.mainArtifactLifecycleChain],
  ["schemas/cascade-impact-cone.schema.json", "tests/fixtures/cascading-governance/cascade-impact-cone.json"],
  ["schemas/cascade-baseline-manifest.schema.json", "tests/fixtures/cascading-governance/cascade-baseline-manifest.json"],
  ["schemas/cascade-verification-evidence.schema.json", "tests/fixtures/cascading-governance/cascade-verification-evidence.json"],
  ["schemas/cascade-resolution-input.schema.json", "tests/fixtures/cascading-governance/cascade-resolution-input.json"],
  ["schemas/workflow-state.schema.json", paths.state],
  ["schemas/workflow-decision-queue.schema.json", paths.decisionQueue],
  ["schemas/decision-ledger.schema.json", paths.decisionLedger],
  ["schemas/acceptance-records.schema.json", paths.acceptanceRecords],
  ["schemas/run-ledger.schema.json", paths.runLedger],
  ["schemas/event-log.schema.json", paths.eventLog],
  ["schemas/schema-coverage-registry.schema.json", paths.schemaCoverage],
  ["schemas/mutation-guard-policy.schema.json", paths.mutationGuard],
  ["schemas/workflow-portability-pack.schema.json", paths.portabilityPack],
  ["schemas/product-bootstrap-pack.schema.json", paths.bootstrapPack],
  ["schemas/documentation-project-profile.schema.json", "tests/fixtures/universal-documentation-workflow/positive/neutral-project-profile.json"],
  ["schemas/documentation-product-profile.schema.json", "tests/fixtures/universal-documentation-workflow/positive/neutral-product-profile.json"],
  ["schemas/documentation-artifact-inventory.schema.json", "tests/fixtures/universal-documentation-workflow/positive/neutral-artifact-inventory.json"],
  ["schemas/workflow-state.schema.json", "tests/fixtures/universal-documentation-workflow/positive/neutral-workflow-state.json"],
  ["schemas/validation-command-catalog.schema.json", "tests/fixtures/universal-documentation-workflow/positive/neutral-validation-command-catalog.json"],
];

const modeNames = new Set([
  "all",
  "documentation-core",
  "documentation-profile",
  "datacanvas-profile",
  "workflow-state-ledger",
  "generator-contracts",
  "schema-coverage",
  "mutation-guard",
]);

if (!modeNames.has(mode)) {
  fail(`unknown universal documentation workflow validation mode: ${mode}`);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(readJson("schemas/common-defs.schema.json"));
ajv.addSchema(readJson("schemas/cascade-impact-cone.schema.json"));
ajv.addSchema(readJson("schemas/impact-analysis-report.schema.json"));
const validators = new Map();

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!exists(relativePath)) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

function pathAtOrWithin(candidatePath, rootPath) {
  return candidatePath === rootPath || candidatePath.startsWith(`${rootPath}/`);
}

function validateWithSchema(schemaPath, data, label) {
  let validate = validators.get(schemaPath);
  if (!validate) {
    const schema = readJson(schemaPath);
    validate = (schema.$id && ajv.getSchema(schema.$id)) || ajv.compile(schema);
    validators.set(schemaPath, validate);
  }

  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${label} does not match ${schemaPath}`);
  }
}

function validateSchemaCases() {
  for (const [schemaPath, dataPath] of schemaCases) {
    validateWithSchema(schemaPath, readJson(dataPath), dataPath);
  }

  const profile = readJson(paths.profile);
  validateWithSchema("schemas/documentation-project-profile.schema.json", profile.project_profile, "datacanvas project_profile");
  validateWithSchema("schemas/documentation-product-profile.schema.json", profile.product_profile, "datacanvas product_profile");
}

function walk(value, visitor, key = "") {
  if (Array.isArray(value)) {
    for (const item of value) {
      walk(item, visitor, key);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      walk(childValue, visitor, childKey);
    }
    return;
  }
  visitor(key, value);
}

function assertNoAbsolutePersistedPaths(label, data) {
  walk(data, (key, value) => {
    if (typeof value !== "string") {
      return;
    }
    const looksLikePathKey = /(^|_)(path|paths)$/.test(key) || key === "$schema";
    if (
      looksLikePathKey &&
      (path.isAbsolute(value) ||
        /^[A-Za-z]:[\\/]/.test(value) ||
        /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(value) ||
        value.includes("\\"))
    ) {
      fail(`${label} contains absolute persisted path: ${value}`);
    }
  });
}

function assertCommandExists(command) {
  const packageJson = readJson("package.json");
  for (const commandPart of command.split("&&").map((part) => part.trim())) {
    const npmRunMatch = commandPart.match(/^npm run ([^ ]+)/);
    if (npmRunMatch) {
      const scriptName = npmRunMatch[1];
      if (!packageJson.scripts[scriptName]) {
        fail(`package.json is missing script used by universal workflow: ${scriptName}`);
      }
      continue;
    }

    if (/^npm test(?:\s|$)/.test(commandPart)) {
      if (!packageJson.scripts.test) {
        fail("package.json is missing test script used by universal workflow");
      }
      continue;
    }

    if (commandPart === "git diff --check") {
      continue;
    }

    const nodeScriptMatch = commandPart.match(/^node (scripts\/[^ ]+\.mjs)/);
    if (nodeScriptMatch) {
      requireFile(nodeScriptMatch[1]);
      continue;
    }

  fail(`unsupported command form in universal workflow catalog: ${commandPart}`);
  }
}

function commandLooksMutating(command) {
  return command
    .split("&&")
    .map((part) => part.trim())
    .some((commandPart) => {
      if (/^npm test(?:\s|$)/.test(commandPart)) {
        return true;
      }
      if (/^npm run generate:/u.test(commandPart) && !/\s--\s.*--check\b/u.test(commandPart)) {
        return true;
      }
      if (/^npm run cascade:(?:run|finalize|verify|complete)(?:\s|$)/u.test(commandPart)) {
        return true;
      }
      if (/^node scripts\/generate-[^ ]+\.mjs/u.test(commandPart) && !/\s--check\b/u.test(commandPart)) {
        return true;
      }
      return false;
    });
}

function validateCatalogCommandPolicy(catalog) {
  const scenario = scenarioById("catalog-command-missing-execution-policy").payload;
  if (!scenario.command || scenario.execution_type !== null || scenario.mutates_files !== null) {
    fail("catalog-command-missing-execution-policy negative fixture no longer exercises missing execution policy");
  }

  for (const command of catalog.commands) {
    if (command.execution_type === "read_only_check" && command.mutates_files) {
      fail(`read-only validation command must not mutate files: ${command.id}`);
    }
    if (["mutating_generator", "full_gate"].includes(command.execution_type) && !command.mutates_files) {
      fail(`mutating/full command must declare mutates_files=true: ${command.id}`);
    }
    if (command.execution_type === "isolated_runtime_check" && !command.runtime_cleanup_required) {
      fail(`isolated runtime command must require cleanup: ${command.id}`);
    }
    if (
      !command.mutates_files &&
      command.writes_expected.length > 0 &&
      command.execution_type !== "isolated_runtime_check"
    ) {
      fail(`non-mutating validation command must not declare writes_expected: ${command.id}`);
    }
    if (command.mutates_files && command.writes_expected.length === 0) {
      fail(`mutating validation command must declare expected writes: ${command.id}`);
    }
    if (
      command.execution_type !== "isolated_runtime_check" &&
      commandLooksMutating(command.command) !== command.mutates_files
    ) {
      fail(`validation command execution policy disagrees with command text: ${command.id}`);
    }
    if (!command.freshness_required) {
      fail(`validation command must require fresh evidence before completion: ${command.id}`);
    }
    if (!command.completion_blocking && !command.non_blocking_rationale) {
      fail(`validation command must be completion-blocking until explicitly downgraded: ${command.id}`);
    }
  }
}

function assertRelativeRepoPath(relativePath, label) {
  if (!relativePath || typeof relativePath !== "string") {
    fail(`${label} is not a path string`);
  }
  if (path.isAbsolute(relativePath) || /^[A-Za-z]:[\\/]/.test(relativePath) || relativePath.includes("..")) {
    fail(`${label} must be a relative repository path: ${relativePath}`);
  }
}

function scenarioById(id) {
  const scenarios = readJson(negativeScenariosPath).scenarios;
  const match = scenarios.find((scenario) => scenario.scenario_id === id);
  if (!match) {
    fail(`negative scenario is missing: ${id}`);
  }
  return match;
}

function assertRequiredFragments(relativePath, fragments) {
  const text = readText(relativePath);
  for (const fragment of fragments) {
    if (!text.includes(fragment)) {
      fail(`${relativePath} is missing required fragment: ${fragment}`);
    }
  }
}

function validateCore() {
  const core = readJson(paths.core);
  assertNoAbsolutePersistedPaths("universal workflow core", core);

  const forbiddenTerms = new Set(core.portability_boundary.forbidden_product_terms);
  const textWithoutAllowedList = JSON.stringify({
    ...core,
    portability_boundary: {
      ...core.portability_boundary,
      forbidden_product_terms: [],
    },
  });
  for (const term of forbiddenTerms) {
    if (textWithoutAllowedList.includes(term)) {
      fail(`universal core contains product-specific term outside boundary list: ${term}`);
    }
  }

  for (const requiredStatus of [
    "initialized",
    "intake_validated",
    "inventory_completed",
    "methodology_checked",
    "impact_analyzed",
    "awaiting_decision",
    "approved_to_apply",
    "applying_changes",
    "generating",
    "validating",
    "blocked",
    "recovery_required",
    "interviewing",
    "completed",
    "abandoned",
  ]) {
    if (!core.state_machine.statuses.includes(requiredStatus)) {
      fail(`universal core state machine is missing status: ${requiredStatus}`);
    }
  }

  for (const requiredFlag of ["universal", "pilot_specific", "project_specific", "generated", "sensitive_metadata_only"]) {
    if (!core.navigation_flags.includes(requiredFlag)) {
      fail(`universal core is missing navigation flag: ${requiredFlag}`);
    }
  }

  if (!core.phases.includes("owner_interview_pass")) {
    fail("universal core must include owner_interview_pass phase");
  }

  for (const requiredCriterion of [
    "blocking_decisions_closed",
    "generated_artifacts_current",
    "hash_manifest_check_passed",
    "mutation_guard_passed",
    "acceptance_records_linked",
    "user_facing_report_has_absolute_clickable_links_and_quotes_for_document_decisions",
  ]) {
    if (!core.completion_criteria.includes(requiredCriterion)) {
      fail(`universal core completion criteria missing: ${requiredCriterion}`);
    }
  }

  if (core.owner_interview_policy.default_mode !== "interview_first_deferred_mutation") {
    fail("universal core must default to interview-first deferred mutation for owner interviews");
  }
  if (!core.owner_interview_policy.description.includes("по любому артефакту")) {
    fail("owner interview policy must apply to any artifact question or questionnaire");
  }
  if (!core.owner_interview_policy.rules.some((rule) => rule.includes("абсолютные кликабельные ссылки"))) {
    fail("owner interview policy must require absolute clickable links in user-facing reports and questions");
  }
  if (!core.owner_interview_policy.rules.some((rule) => rule.includes("короткая цитата"))) {
    fail("owner interview policy must require short quotes for document decisions and corrections");
  }
  if (!core.owner_interview_policy.rules.some((rule) => rule.includes("текущий текст элемента"))) {
    fail("owner interview policy must require current coded element text before owner choices");
  }
  if (!core.owner_interview_policy.rules.some((rule) => rule.includes("логику каждого варианта"))) {
    fail("owner interview policy must require option logic before owner choices");
  }
  if (!core.owner_interview_policy.rules.some((rule) => rule.includes("cli-table-output"))) {
    fail("owner interview policy must require cli-table-output for chat-facing tabular data");
  }
  if (!core.owner_interview_policy.rules.some((rule) => rule.includes("Markdown pipe table"))) {
    fail("owner interview policy must forbid chat-facing Markdown pipe table by default");
  }
  if (!core.owner_interview_policy.rules.some((rule) => rule.includes("реально вызвать") && rule.includes("не имитировать"))) {
    fail("owner interview policy must require real requested skill/plugin/consilium invocation and forbid simulation");
  }
  for (const requiredScope of [
    "single_owner_question",
    "owner_questionnaire",
    "artifact_specific_interview",
    "product_process_architecture_navigation_generated_security_evidence_artifacts",
  ]) {
    if (!core.owner_interview_policy.applies_to.includes(requiredScope)) {
      fail(`owner interview policy must declare scope: ${requiredScope}`);
    }
  }
  for (const requiredOperation of [
    "generated_artifact_refresh",
    "hash_manifest_update",
    "full_validation_gate",
    "final_validation_evidence",
  ]) {
    if (!core.owner_interview_policy.deferred_operations.includes(requiredOperation)) {
      fail(`owner interview policy must defer operation: ${requiredOperation}`);
    }
  }
  for (const requiredAllowedAction of ["read_sources", "impact_analysis", "draft_question_batch", "collect_owner_answers"]) {
    if (!core.owner_interview_policy.allowed_during_interview.includes(requiredAllowedAction)) {
      fail(`owner interview policy must allow interview action: ${requiredAllowedAction}`);
    }
  }

  const negative = scenarioById("core-contains-product-term");
  if (!negative.payload.text.includes("DataCanvas")) {
    fail("negative core product-term fixture no longer exercises product-specific rejection");
  }
  const simulatedTool = scenarioById("simulated-requested-tool").payload;
  if (!(simulatedTool.requested_capability === "consilium" && simulatedTool.execution_mode === "simulated" && simulatedTool.proof === null)) {
    fail("simulated-requested-tool negative fixture no longer exercises requested tool simulation rejection");
  }

  assertRequiredFragments(paths.readme, [
    "DataCanvas используется только как пилотный профиль",
    "Generated artifacts редактируются только через исходный источник",
    "Интервью Сначала, Правки Потом",
    "interview_first_deferred_mutation",
    "любой опрос, вопрос или решение владельца по любому артефакту",
    "сначала собрать полный набор известных независимых вопросов по текущему артефакту",
    "не обновлять смысловые документы, generated artifacts",
    "Отчет для пользователя должен начинаться с простого человеческого итога",
    "cli-table-output",
    "fenced `text` блок с Unicode-таблицей",
    "Markdown pipe table не выводится напрямую в чат по умолчанию",
    "реально вызвать",
    "не имитировать",
    "явный блокер",
    "Любой пользовательский отчет, статус, следующий шаг или вопрос",
    "абсолютную кликабельную Markdown-ссылку",
    "пользователь должен иметь возможность кликнуть ссылку",
    "рядом с абсолютной ссылкой должна быть короткая цитата",
    "расшифровку каждого кодированного элемента",
    "текущий текст каждого элемента",
    "документы-доноры или зависимые документы",
    "логику каждого варианта",
    "абсолютную ссылку на каждый документ",
    "короткую цитату из релевантного фрагмента документа",
    "простой пользовательский итог с абсолютными кликабельными ссылками",
    "полный конус влияния",
    "baseline-манифест",
    "отдельная проверка",
    "npm run validate:universal-documentation-workflow",
  ]);
  assertRequiredFragments(paths.runbook, [
    "CO-*",
    "PROC-*",
    "ADR-*",
    "No-change rationale",
    "mutation guard",
    "interview_first_deferred_mutation",
    "сначала интервью, затем пакетная обработка",
    "любой опрос или вопрос по артефакту",
    "не запускать generated refresh",
    "UX-Френдли Интервью",
    "Правило одинаково для продуктовых, процессных, архитектурных, навигационных",
    "сначала сформулировать простой итог обычным русским языком",
    "cli-table-output",
    "fenced `text` Unicode-таблицы",
    "Markdown pipe table напрямую в чат по умолчанию не выводить",
    "реально вызвать",
    "не имитировать",
    "явный блокер",
    "Если итог, статус, следующий шаг или вопрос упоминает документ",
    "абсолютную кликабельную Markdown-ссылку",
    "рядом с абсолютной ссылкой дать короткую цитату",
    "Формат Отчета Пользователю",
    "абсолютную ссылку на каждый документ",
    "короткую цитату из каждого такого документа",
    "npm run cascade:run",
    "npm run cascade:finalize",
    "npm run cascade:verify",
    "npm run cascade:complete",
    "Не редактировать пакеты запуска вручную",
    "полного конуса",
    "расшифровку каждого кодированного элемента",
    "текущий текст каждого элемента",
    "документы-доноры или зависимые документы",
    "логику каждого варианта",
  ]);
}

function validateProfile() {
  const profile = readJson(paths.profile);
  const project = profile.project_profile;
  const product = profile.product_profile;
  const catalog = readJson(paths.catalog);

  if (profile.profile_binding.project_profile_id !== project.project_profile_id) {
    fail("project_profile_id mismatch in DataCanvas profile binding");
  }
  if (profile.profile_binding.product_profile_id !== product.product_profile_id) {
    fail("product_profile_id mismatch in DataCanvas profile binding");
  }
  requireFile(profile.profile_binding.universal_core_path);
  requireFile(project.validation_command_catalog_path);

  for (const routePath of Object.values(project.routes)) {
    requireFile(routePath);
  }

  for (const source of product.primary_sources) {
    requireFile(source.path);
    if (source.authority !== "product_meaning") {
      fail(`DataCanvas product primary source uses wrong authority: ${source.source_id}`);
    }
  }

  for (const command of catalog.commands) {
    assertCommandExists(command.command);
  }
  validateCatalogCommandPolicy(catalog);

  if (!product.pilot_features.bmc_enabled) {
    fail("DataCanvas pilot profile must explicitly keep BMC in the product profile");
  }

  const neutralProject = JSON.stringify(readJson("tests/fixtures/universal-documentation-workflow/positive/neutral-project-profile.json"));
  const neutralProduct = JSON.stringify(readJson("tests/fixtures/universal-documentation-workflow/positive/neutral-product-profile.json"));
  for (const term of ["DataCanvas", "CO-2026-001", "BMC", "Лиса"]) {
    if (neutralProject.includes(term) || neutralProduct.includes(term)) {
      fail(`neutral portability fixture contains pilot-specific term: ${term}`);
    }
  }

  const portabilityPack = readJson(paths.portabilityPack);
  for (const requiredTemplate of [
    "project_profile",
    "product_profile",
    "artifact_inventory",
    "navigation_source",
    "artifact_registry",
    "hash_manifest",
    "leakage_manifest",
    "workflow_state",
    "decision_queue",
    "acceptance_record",
    "run_ledger",
    "migration_notes",
  ]) {
    if (!portabilityPack.templates.some((template) => template.template_id === requiredTemplate)) {
      fail(`portability pack is missing template: ${requiredTemplate}`);
    }
  }

  const bootstrapPack = readJson(paths.bootstrapPack);
  for (const requiredKind of ["vision", "product_goals", "stakeholders", "brd", "srs", "backlog", "risks", "acceptance", "traceability", "release_evidence"]) {
    if (!bootstrapPack.required_artifacts.some((artifact) => artifact.artifact_kind === requiredKind)) {
      fail(`product bootstrap pack is missing artifact kind: ${requiredKind}`);
    }
  }
}

function validateDataCanvasProfile() {
  const packageJson = readJson("package.json");
  const coreText = JSON.stringify(readJson(paths.core));
  for (const term of ["DataCanvas", "CO-2026-001", "BMC", "Лиса"]) {
    const stripped = coreText.replace(`"${term}"`, "");
    if (stripped.includes(term)) {
      fail(`pilot-specific term leaked into universal core: ${term}`);
    }
  }

  const inventory = readJson(paths.inventory);
  const catalog = readJson(paths.catalog);
  const bmcEntries = inventory.artifacts.filter((artifact) => artifact.path.includes("/bmc/"));
  if (bmcEntries.length === 0) {
    fail("DataCanvas profile inventory must include BMC as pilot-specific artifact");
  }
  for (const artifact of bmcEntries) {
    if (artifact.domain !== "product" || artifact.profile_scope !== "pilot_specific") {
      fail(`BMC artifact must stay in product pilot profile: ${artifact.path}`);
    }
  }

  const productVisionCommand = catalog.commands.find((command) => command.id === "product-vision");
  if (!productVisionCommand || productVisionCommand.command !== "npm run validate:product-vision") {
    fail("DataCanvas validation catalog must include product-vision gate");
  }
  const businessDocsCommand = catalog.commands.find((command) => command.id === "business-docs");
  if (!businessDocsCommand || businessDocsCommand.command !== "npm run validate:business-docs") {
    fail("DataCanvas validation catalog must include business document content gate");
  }
  const businessClaimMapCommand = catalog.commands.find((command) => command.id === "business-claim-map");
  if (!businessClaimMapCommand || businessClaimMapCommand.command !== "npm run validate:business-claim-map") {
    fail("DataCanvas validation catalog must include business claim map gate");
  }
  const productSourcesCommand = catalog.commands.find((command) => command.id === "product-sources");
  if (!productSourcesCommand || !productSourcesCommand.command.includes("npm run validate:product-source-consistency")) {
    fail("DataCanvas validation catalog must include product source consistency gate");
  }
  const xlsxBacklogCommand = catalog.commands.find((command) => command.id === "xlsx-backlog-sync");
  if (!xlsxBacklogCommand || xlsxBacklogCommand.command !== "npm run validate:xlsx-backlog") {
    fail("DataCanvas validation catalog must include XLSX backlog sync gate");
  }
  const xlsxCascadeCommand = catalog.commands.find((command) => command.id === "xlsx-cascade");
  if (!xlsxCascadeCommand || xlsxCascadeCommand.command !== "npm run validate:xlsx-cascade") {
    fail("DataCanvas validation catalog must include XLSX cascade gate");
  }
  const mainArtifactLifecycleCommand = catalog.commands.find((command) => command.id === "main-artifact-lifecycle");
  if (!mainArtifactLifecycleCommand || mainArtifactLifecycleCommand.command !== "npm run validate:main-artifact-lifecycle") {
    fail("DataCanvas validation catalog must include main artifact lifecycle gate");
  }
  for (const [commandId, expectedCommand] of [
    ["xlsx-source-security", "npm run validate:xlsx-source-security"],
    ["git-history-hygiene", "npm run validate:git-history-hygiene"],
    ["ci-exact-sha", "npm run validate:ci-exact-sha"],
    ["cascade-impact", "npm run validate:cascade-impact"],
    ["cascade-verification", "npm run validate:cascade-verification"],
    ["cascade-vnext", "npm run validate:cascade-vnext"],
    ["cascade-trust", "npm run validate:cascade-trust"],
    ["xlsx-change-classifier", "npm run validate:xlsx-change-classifier"],
  ]) {
    const catalogCommand = catalog.commands.find((command) => command.id === commandId);
    if (!catalogCommand || catalogCommand.command !== expectedCommand || catalogCommand.mutates_files) {
      fail(`DataCanvas validation catalog must include read-only ${commandId} gate`);
    }
  }
  const cascadingGovernanceCommand = catalog.commands.find((command) => command.id === "cascading-governance");
  if (
    !cascadingGovernanceCommand ||
    cascadingGovernanceCommand.command !== "npm run validate:cascading-governance" ||
    cascadingGovernanceCommand.execution_type !== "isolated_runtime_check" ||
    cascadingGovernanceCommand.mutates_files ||
    !cascadingGovernanceCommand.runtime_cleanup_required ||
    cascadingGovernanceCommand.writes_expected.length === 0
  ) {
    fail("DataCanvas validation catalog must include isolated cascading-governance gate with declared temporary writes and cleanup");
  }
  const cascadeE2eCommand = catalog.commands.find((command) => command.id === "cascade-vnext-e2e");
  if (!cascadeE2eCommand
    || cascadeE2eCommand.command !== "npm run validate:cascade-vnext-e2e"
    || cascadeE2eCommand.execution_type !== "isolated_runtime_check"
    || cascadeE2eCommand.mutates_files
    || !cascadeE2eCommand.runtime_cleanup_required) {
    fail("DataCanvas validation catalog must include isolated cascade-vnext-e2e gate with cleanup");
  }
  for (const commandId of ["cascade-run", "cascade-finalize", "cascade-verify", "cascade-complete"]) {
    const catalogCommand = catalog.commands.find((command) => command.id === commandId);
    if (!catalogCommand || catalogCommand.execution_type !== "mutating_generator" || !catalogCommand.mutates_files) {
      fail(`DataCanvas validation catalog must include controlled ${commandId} evidence generator`);
    }
  }
  const cascadePreviewCommand = catalog.commands.find((command) => command.id === "cascade-preview");
  if (!cascadePreviewCommand
    || cascadePreviewCommand.command !== "npm run cascade:preview -- --changed-from HEAD"
    || cascadePreviewCommand.completion_blocking) {
    fail("DataCanvas validation catalog must include read-only cascade preview gate");
  }
  const docsVerifyCommand = catalog.commands.find((command) => command.id === "docs-verify");
  if (!docsVerifyCommand
    || docsVerifyCommand.command !== "npm run docs:verify -- --changed-from HEAD"
    || docsVerifyCommand.completion_blocking) {
    fail("DataCanvas validation catalog must include read-only documentation diff verification gate");
  }
  const bmcPackageCommand = catalog.commands.find((command) => command.id === "bmc-package");
  if (!bmcPackageCommand || bmcPackageCommand.command !== "npm run validate:bmc") {
    fail("DataCanvas validation catalog must include BMC package gate");
  }
  if (!packageJson.scripts["validate:bmc"]?.includes("npm run generate:bmc -- --check")) {
    fail("package.json validate:bmc must run BMC generator check mode before BMC validators");
  }
  const fullCommand = catalog.commands.find((command) => command.id === "full");
  if (!fullCommand || fullCommand.command !== "npm test") {
    fail("DataCanvas validation catalog full gate must map to npm test");
  }

  const visionEntry = inventory.artifacts.find((artifact) => artifact.path === "docs/product-vision.md");
  if (!visionEntry) {
    fail("DataCanvas profile inventory must include current Vision as managed artifact");
  }
  if (visionEntry.generated || visionEntry.domain !== "product" || visionEntry.source_of_truth_class !== "product_meaning") {
    fail("current Vision must stay a manual product meaning source in artifact inventory");
  }
  if (!visionEntry.validation_commands.includes("npm run validate:product-vision")) {
    fail("current Vision inventory entry must include product Vision validation");
  }
  for (const requiredVisionInput of [
    "docs/product/change-orders/co-2026-002-agent-launch-delivery-scope.md",
    "docs/product/requirements/business-claim-map.json",
  ]) {
    if (!visionEntry.inputs.includes(requiredVisionInput)) {
      fail(`current Vision inventory entry is missing input: ${requiredVisionInput}`);
    }
  }

  const visionManifestEntry = inventory.artifacts.find((artifact) => artifact.path === "docs/product/vision/manifest.json");
  if (!visionManifestEntry) {
    fail("DataCanvas profile inventory must include product Vision manifest");
  }
  if (visionManifestEntry.generated || visionManifestEntry.visibility !== "internal") {
    fail("product Vision manifest must stay a manual internal machine-readable artifact");
  }
  if (!visionManifestEntry.validation_commands.includes("npm run validate:product-vision")) {
    fail("product Vision manifest inventory entry must include product Vision validation");
  }

  for (const requiredXlsxPath of [
    "docs/product/sources/reference/datacanvas-backlog-source-sanitization.json",
    "docs/product/sources/reference/datacanvas-backlog-source-sanitized.xlsx",
    "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx",
    "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json",
    "docs/process/guides/datacanvas-excel-backlog-sync.md",
  ]) {
    const entry = inventory.artifacts.find((artifact) => artifact.path === requiredXlsxPath);
    if (!entry) {
      fail(`DataCanvas profile inventory must include XLSX workflow artifact: ${requiredXlsxPath}`);
    }
    if (!entry.validation_commands.includes("npm run validate:xlsx-backlog")) {
      fail(`XLSX workflow artifact must include validate:xlsx-backlog: ${requiredXlsxPath}`);
    }
    if (!entry.validation_commands.includes("npm run validate:xlsx-cascade")) {
      fail(`XLSX workflow artifact must include validate:xlsx-cascade: ${requiredXlsxPath}`);
    }
  }
}

function validateWorkflowStateLedger() {
  const state = readJson(paths.state);
  const queue = readJson(paths.decisionQueue);
  const ledger = readJson(paths.decisionLedger);
  const acceptance = readJson(paths.acceptanceRecords);
  const runLedger = readJson(paths.runLedger);
  const eventLog = readJson(paths.eventLog);
  const catalog = readJson(paths.catalog);

  for (const pointer of [state.artifact_catalog_path, state.decision_queue_path, state.event_log_path, state.run_ledger_path]) {
    requireFile(pointer);
  }

  for (const artifactPath of [state.artifact_catalog_path, state.decision_queue_path, state.event_log_path, state.run_ledger_path]) {
    assertRelativeRepoPath(artifactPath, "workflow state pointer");
  }

  const catalogCommandsByText = new Map(catalog.commands.map((command) => [command.command, command]));
  const mutatingPlanCommand = scenarioById("workflow-plan-mutating-command").payload;
  if (!commandLooksMutating(mutatingPlanCommand.command) || mutatingPlanCommand.workflow_status !== "awaiting_decision") {
    fail("workflow-plan-mutating-command negative fixture no longer exercises a mutating validation plan entry");
  }
  const uncatalogedPlanCommand = scenarioById("workflow-plan-uncataloged-command").payload;
  if (uncatalogedWorkflowPlanCommands([uncatalogedPlanCommand.command], catalog.commands).length !== 1) {
    fail("workflow-plan-uncataloged-command negative fixture must remain absent from the command catalog");
  }

  const uncatalogedCommands = uncatalogedWorkflowPlanCommands(state.validation_plan, catalog.commands);
  if (uncatalogedCommands.length > 0) {
    fail(`workflow validation_plan contains command absent from catalog: ${uncatalogedCommands[0]}`);
  }
  const nonNpmCommands = nonNpmWorkflowPlanCommands(state.validation_plan);
  if (nonNpmCommands.length > 0) {
    fail(`workflow validation_plan contains command unsafe for isolated profile: ${nonNpmCommands[0]}`);
  }

  for (const plannedCommand of state.validation_plan) {
    assertCommandExists(plannedCommand);
    const catalogCommand = catalogCommandsByText.get(plannedCommand);
    if (catalogCommand.mutates_files && ["awaiting_decision", "interviewing", "impact_analyzed"].includes(state.status)) {
      fail(`workflow validation_plan contains mutating command while owner decision is not closed: ${plannedCommand}`);
    }
  }

  for (const item of [queue, ledger, acceptance, runLedger, eventLog]) {
    if (item.run_id !== state.run_id) {
      fail(`run_id mismatch for workflow state linked artifact: ${item.run_id}`);
    }
  }

  for (let index = 0; index < eventLog.events.length; index += 1) {
    const expected = index + 1;
    if (eventLog.events[index].sequence !== expected) {
      fail(`event log sequence must be append-only and contiguous: expected ${expected}`);
    }
  }

  const queueDecisionIds = new Set(queue.decisions.map((decision) => decision.decision_id));
  const acceptanceIds = new Set(acceptance.records.map((record) => record.acceptance_record_id));

  for (const record of ledger.records) {
    if (!queueDecisionIds.has(record.decision_id)) {
      fail(`decision ledger references decision missing from queue: ${record.decision_id}`);
    }
    if (record.acceptance_record_id && !acceptanceIds.has(record.acceptance_record_id)) {
      fail(`decision ledger references missing acceptance record: ${record.acceptance_record_id}`);
    }
  }

  for (const decision of queue.decisions) {
    if (decision.acceptance_record_id && !acceptanceIds.has(decision.acceptance_record_id)) {
      fail(`decision queue references missing acceptance record: ${decision.acceptance_record_id}`);
    }
  }

  for (const requiredType of ["owner_decision_acceptance", "documentation_change_acceptance", "product_behavior_acceptance"]) {
    if (!acceptance.records.some((record) => record.acceptance_type === requiredType)) {
      fail(`acceptance records missing separate type: ${requiredType}`);
    }
  }

  const openBlocking = queue.decisions.filter((decision) => decision.blocking && ["pending", "deferred"].includes(decision.status));
  if (state.status === "completed" && openBlocking.length > 0) {
    fail(`completed workflow state has open blocking decisions: ${openBlocking.map((item) => item.decision_id).join(", ")}`);
  }

  const negative = scenarioById("open-blocking-decision");
  if (!(negative.payload.workflow_status === "completed" && negative.payload.blocking === true && negative.payload.decision_status === "pending")) {
    fail("open-blocking-decision negative fixture does not exercise completion blocker");
  }

  for (const changed of runLedger.applied_changes) {
    if (!acceptanceIds.has(changed.requires_acceptance_record)) {
      fail(`applied change references missing acceptance record: ${changed.change_id}`);
    }
  }

  if (runLedger.scope.semantic_product_change) {
    fail("current universal workflow implementation must not claim semantic product change");
  }
}

function validateGeneratorContracts() {
  const contracts = readJson(paths.generatorContracts);
  const policy = readJson(paths.mutationGuard);
  const allowedByGenerator = new Map(
    policy.allowed_write_sets.map((item) => [
      item.generator_id,
      {
        paths: new Set(item.allowed_writes),
        roots: item.allowed_write_roots ?? [],
      },
    ]),
  );
  const seen = new Set();
  const expectedBmcOutputs = [
    "docs/product/bmc/bmc-v0.2.md",
    "docs/product/bmc/source/derived/datacanvas-bmc.puml",
    "docs/product/bmc/source/derived/datacanvas-bmc.svg",
    "docs/product/bmc/source/derived/datacanvas-bmc.png",
    "docs/product/bmc/source/derived/datacanvas-bmc.pdf",
    "docs/product/bmc/bmc-validation-needs.json",
    "docs/product/bmc/bmc-derived-manifest.json",
    "docs/product/bmc/README.md",
    "docs/product/bmc/source-map.md",
    "docs/product/bmc/text-alternative.md",
    "docs/product/bmc/evidence/bmc-visual-design-philosophy.md",
    "docs/product/bmc/evidence/bmc-visual-acceptance.json",
    "docs/product/bmc/evidence/designer-consilium.json",
    "docs/product/bmc/evidence/visual-review.md",
    "docs/product/bmc/manifest.json",
  ];

  for (const generatorId of contracts.topological_order) {
    if (seen.has(generatorId)) {
      fail(`duplicate generator in topological order: ${generatorId}`);
    }
    seen.add(generatorId);
  }

  for (const contract of contracts.contracts) {
    if (!seen.has(contract.generator_id)) {
      fail(`generator contract missing from topological order: ${contract.generator_id}`);
    }

    for (const input of contract.inputs) {
      requireFile(input);
    }
    const releaseGateState = contract.release_gate_contract_path
      ? readReleaseGateState(root, contract.release_gate_contract_path)
      : null;
    for (const output of contract.outputs) {
      if (releaseGateState?.approved) {
        requireFile(output);
      } else if (releaseGateState && exists(output)) {
        fail(`выпускной барьер не пройден, но производный архив уже существует: ${output}; ${releaseGateState.summary}`);
      } else if (!releaseGateState) {
        requireFile(output);
      }
      assertRelativeRepoPath(output, "generator output");
    }
    for (const outputRoot of contract.output_roots ?? []) {
      requireFile(outputRoot);
      assertRelativeRepoPath(outputRoot, "generator output root");
    }

    const allowed = allowedByGenerator.get(contract.generator_id);
    if (!allowed) {
      fail(`mutation guard policy missing allowed write set for generator: ${contract.generator_id}`);
    }
    for (const output of contract.outputs) {
      const allowedByPolicy = allowed.paths.has(output) || allowed.roots.some((rootPath) => pathAtOrWithin(output, rootPath));
      const allowedByContract =
        contract.allowed_writes.includes(output) ||
        (contract.allowed_write_roots ?? []).some((rootPath) => pathAtOrWithin(output, rootPath));
      if (!allowedByPolicy || !allowedByContract) {
        fail(`generator output is not allowed by mutation guard: ${contract.generator_id} -> ${output}`);
      }
    }
    for (const outputRoot of contract.output_roots ?? []) {
      if (!(contract.allowed_write_roots ?? []).includes(outputRoot) || !allowed.roots.includes(outputRoot)) {
        fail(`generator output root is not allowed by mutation guard: ${contract.generator_id} -> ${outputRoot}`);
      }
    }

    assertCommandExists(contract.generate_command);
    assertCommandExists(contract.check_command);
    for (const validator of contract.post_validators) {
      assertCommandExists(validator);
    }
  }

  const hashContract = contracts.contracts.find((contract) => contract.generator_id === "artifact-hash-manifest");
  if (!hashContract || !hashContract.check_command.includes("--check")) {
    fail("artifact hash manifest generator contract must define --check command");
  }

  for (const contract of contracts.contracts) {
    for (const forbiddenManualPath of ["docs/product-vision.md", "docs/product/vision/manifest.json"]) {
      if (
        contract.outputs.includes(forbiddenManualPath) ||
        contract.allowed_writes.includes(forbiddenManualPath) ||
        (contract.output_roots ?? []).some((rootPath) => pathAtOrWithin(forbiddenManualPath, rootPath)) ||
        (contract.allowed_write_roots ?? []).some((rootPath) => pathAtOrWithin(forbiddenManualPath, rootPath))
      ) {
        fail(`manual Vision artifact must not be a generated output: ${contract.generator_id} -> ${forbiddenManualPath}`);
      }
    }
  }

  const bmcContract = contracts.contracts.find((contract) => contract.generator_id === "datacanvas-bmc");
  if (!bmcContract) {
    fail("generator contracts must include datacanvas-bmc");
  }
  for (const requiredInput of [
    "docs/product/bmc/bmc-trace.v0.1.json",
    "docs/product-vision.md",
    "docs/product/requirements/user-stories.md",
    "docs/product/sources/product-source-registry.json",
    "schemas/bmc-trace.schema.json",
    "scripts/generate-bmc-artifacts.mjs",
    "scripts/lib/bmc-visual-layout.mjs",
  ]) {
    if (!bmcContract.inputs.includes(requiredInput)) {
      fail(`datacanvas-bmc generator contract is missing input: ${requiredInput}`);
    }
  }
  for (const output of expectedBmcOutputs) {
    if (!bmcContract.outputs.includes(output)) {
      fail(`datacanvas-bmc generator contract is missing generated output: ${output}`);
    }
    if (!bmcContract.allowed_writes.includes(output)) {
      fail(`datacanvas-bmc generator contract is missing allowed write: ${output}`);
    }
    const allowed = allowedByGenerator.get("datacanvas-bmc");
    if (!allowed?.paths.has(output)) {
      fail(`mutation guard is missing datacanvas-bmc generated output: ${output}`);
    }
  }
  if (bmcContract.inputs.includes("docs/product/bmc/bmc-v0.2.md")) {
    fail("datacanvas-bmc generator contract must not treat generated Markdown as source input");
  }
  for (const requiredFailureMode of [
    "svg_text_outside_frame",
    "visual_frame_overlap",
    "uneven_visual_grid",
    "plantuml_label_overflow",
    "historical_visual_evidence_claimed_current",
  ]) {
    if (!bmcContract.failure_modes.includes(requiredFailureMode)) {
      fail(`datacanvas-bmc generator contract is missing visual failure mode: ${requiredFailureMode}`);
    }
  }

  for (const generatorId of [
    "documentation-cascade-run",
    "documentation-cascade-finalization",
    "documentation-cascade-verification",
    "documentation-cascade-completion",
  ]) {
    const contract = contracts.contracts.find((candidate) => candidate.generator_id === generatorId);
    if (!contract) {
      fail(`generator contracts must include ${generatorId}`);
    }
    const evidenceRoot = "docs/process/cascading-governance/runs";
    if (!(contract.output_roots ?? []).includes(evidenceRoot) || !(contract.allowed_write_roots ?? []).includes(evidenceRoot)) {
      fail(`${generatorId} must restrict dynamic evidence writes to ${evidenceRoot}`);
    }
    if (contract.output_path_policy !== "fresh_direct_child") {
      fail(`${generatorId} must require a fresh direct child output directory`);
    }
  }

  const cascadeFinalizationContract = contracts.contracts.find(
    (candidate) => candidate.generator_id === "documentation-cascade-finalization",
  );
  for (const requiredInput of [
    "docs/process/cascading-governance/acceptance-authority.json",
    "schemas/cascade-acceptance-authority.schema.json",
    "schemas/cascade-acceptance-vnext.schema.json",
    "schemas/cascade-owner-question-packet.schema.json",
    "scripts/cascade-owner-acceptance.mjs",
  ]) {
    if (!cascadeFinalizationContract.inputs.includes(requiredInput)) {
      fail(`documentation-cascade-finalization is missing trusted acceptance input: ${requiredInput}`);
    }
  }
  for (const requiredFailureMode of [
    "unbound_acceptance_record",
    "acceptance_authority_mismatch",
    "unauthorized_confirmation_channel",
    "selected_option_does_not_authorize",
    "replay_input_mismatch",
    "unexpected_changed_path",
  ]) {
    if (!cascadeFinalizationContract.failure_modes.includes(requiredFailureMode)) {
      fail(`documentation-cascade-finalization is missing failure mode: ${requiredFailureMode}`);
    }
  }

  const cascadeRunContract = contracts.contracts.find(
    (candidate) => candidate.generator_id === "documentation-cascade-run",
  );
  for (const requiredInput of [
    "schemas/documentation-change-request.schema.json",
    "schemas/artifact-dependency-graph.schema.json",
    "schemas/cascade-vnext-run.schema.json",
    "schemas/cascade-source-identity.schema.json",
    "scripts/run-cascade-vnext.mjs",
    "scripts/classify-datacanvas-xlsx-change.py",
  ]) {
    if (!cascadeRunContract.inputs.includes(requiredInput)) {
      fail(`documentation-cascade-run is missing runtime schema input: ${requiredInput}`);
    }
  }

  const cascadeVerificationContract = contracts.contracts.find(
    (candidate) => candidate.generator_id === "documentation-cascade-verification",
  );
  for (const requiredInput of [
    "docs/process/universal-documentation-workflow/validation-command-catalog.json",
    "schemas/cascade-vnext-run.schema.json",
    "schemas/cascade-profile-evidence.schema.json",
    "schemas/cascade-validation-manifest.schema.json",
    "scripts/verify-cascade-profile-vnext.mjs",
    "scripts/cascade-profile-verifier.mjs",
  ]) {
    if (!cascadeVerificationContract.inputs.includes(requiredInput)) {
      fail(`documentation-cascade-verification is missing runtime verification input: ${requiredInput}`);
    }
  }

  const cascadeCompletionContract = contracts.contracts.find(
    (candidate) => candidate.generator_id === "documentation-cascade-completion",
  );
  for (const requiredInput of [
    "schemas/cascade-vnext-run.schema.json",
    "schemas/cascade-completion-evidence.schema.json",
    "schemas/cascade-completion-seal.schema.json",
    "scripts/complete-cascade-vnext.mjs",
    "scripts/cascade-completion-core.mjs",
  ]) {
    if (!cascadeCompletionContract.inputs.includes(requiredInput)) {
      fail(`documentation-cascade-completion is missing completion input: ${requiredInput}`);
    }
  }

  for (const scenarioId of ["stale-generated-artifact", "manual-generated-artifact", "unexpected-write", "path-traversal"]) {
    scenarioById(scenarioId);
  }
}

function validateSchemaCoverage() {
  const coverage = readJson(paths.schemaCoverage);
  const requiredEntities = new Set([
    "project_profile",
    "product_profile",
    "artifact_inventory",
    "validation_command_catalog",
    "workflow_state",
    "decision_queue",
    "decision_ledger",
    "acceptance_record",
    "run_ledger",
    "event_log",
    "generator_contract",
    "product_vision_manifest",
    "business_artifact_generation_contract",
    "business_claim_map",
    "main_artifact_lifecycle_chain",
    "cascade_impact_cone",
    "cascade_baseline_manifest",
    "cascade_verification_evidence",
    "cascade_resolution_input",
    "schema_coverage_registry",
  ]);

  for (const entry of coverage.entries) {
    requireFile(entry.schema_path);
    requireFile(entry.data_path);
    requireFile(entry.positive_fixture_path);
    if (entry.negative_fixture_path) {
      requireFile(entry.negative_fixture_path);
      for (const scenarioId of entry.negative_scenario_ids) {
        scenarioById(scenarioId);
      }
    } else if (!entry.negative_rationale) {
      fail(`schema coverage entry without negative fixture requires rationale: ${entry.entity}`);
    }
    requiredEntities.delete(entry.entity);
  }

  if (requiredEntities.size > 0) {
    fail(`schema coverage registry is missing entities: ${[...requiredEntities].join(", ")}`);
  }

  for (const schemaPath of [
    "schemas/universal-documentation-core.schema.json",
    "schemas/datacanvas-documentation-profile.schema.json",
    "schemas/documentation-project-profile.schema.json",
    "schemas/documentation-product-profile.schema.json",
    "schemas/documentation-artifact-inventory.schema.json",
    "schemas/validation-command-catalog.schema.json",
    "schemas/workflow-state.schema.json",
    "schemas/workflow-decision-queue.schema.json",
    "schemas/decision-ledger.schema.json",
    "schemas/acceptance-records.schema.json",
    "schemas/run-ledger.schema.json",
    "schemas/event-log.schema.json",
    "schemas/generator-contracts.schema.json",
    "schemas/business-artifact-generation-contract.schema.json",
    "schemas/business-claim-map.schema.json",
    "schemas/main-artifact-lifecycle-chain.schema.json",
    "schemas/cascade-impact-cone.schema.json",
    "schemas/cascade-baseline-manifest.schema.json",
    "schemas/cascade-verification-evidence.schema.json",
    "schemas/cascade-resolution-input.schema.json",
    "schemas/schema-coverage-registry.schema.json",
    "schemas/mutation-guard-policy.schema.json",
    "schemas/workflow-portability-pack.schema.json",
    "schemas/product-bootstrap-pack.schema.json",
  ]) {
    requireFile(schemaPath);
  }

  for (const scenarioId of [
    "stale-generated-artifact",
    "manual-generated-artifact",
    "public-confidential-artifact",
    "missing-schema",
    "unexpected-write",
    "path-traversal",
    "missing-source-of-truth",
    "open-blocking-decision",
  ]) {
    scenarioById(scenarioId);
  }
}

function validateMutationGuard() {
  const policy = readJson(paths.mutationGuard);
  const contracts = readJson(paths.generatorContracts);
  const generatedOutputs = new Set(contracts.contracts.flatMap((contract) => contract.outputs));

  if (policy.generated_artifact_policy.manual_edit_allowed) {
    fail("mutation guard must block manual edits of generated artifacts");
  }

  for (const writeSet of policy.allowed_write_sets) {
    for (const writePath of writeSet.allowed_writes) {
      assertRelativeRepoPath(writePath, "mutation guard allowed write");
    }
    for (const writeRoot of writeSet.allowed_write_roots ?? []) {
      assertRelativeRepoPath(writeRoot, "mutation guard allowed write root");
    }
  }

  const manualEdit = scenarioById("manual-generated-artifact").payload;
  if (!(generatedOutputs.has(manualEdit.path) && manualEdit.generated && manualEdit.edit_origin === "manual")) {
    fail("manual-generated-artifact negative fixture does not target a known generated output");
  }

  const unexpectedWrite = scenarioById("unexpected-write").payload;
  const allowedSet = policy.allowed_write_sets.find((item) => item.generator_id === unexpectedWrite.generator_id);
  if (
    !allowedSet ||
    allowedSet.allowed_writes.includes(unexpectedWrite.write_path) ||
    (allowedSet.allowed_write_roots ?? []).some((rootPath) => pathAtOrWithin(unexpectedWrite.write_path, rootPath))
  ) {
    fail("unexpected-write negative fixture must be outside the generator allowed set");
  }

  const traversal = scenarioById("path-traversal").payload.write_path;
  if (!traversal.includes("..")) {
    fail("path-traversal negative fixture no longer escapes repository root");
  }

  const publicConfidential = scenarioById("public-confidential-artifact").payload;
  if (!(publicConfidential.data_class === "confidential" && publicConfidential.visibility === "public")) {
    fail("public-confidential-artifact negative fixture no longer exercises leakage rule");
  }
}

validateSchemaCases();

if (mode === "all" || mode === "documentation-core") {
  validateCore();
}
if (mode === "all" || mode === "documentation-profile") {
  validateProfile();
}
if (mode === "all" || mode === "datacanvas-profile") {
  validateDataCanvasProfile();
}
if (mode === "all" || mode === "workflow-state-ledger") {
  validateWorkflowStateLedger();
}
if (mode === "all" || mode === "generator-contracts") {
  validateGeneratorContracts();
}
if (mode === "all" || mode === "schema-coverage") {
  validateSchemaCoverage();
}
if (mode === "all" || mode === "mutation-guard") {
  validateMutationGuard();
}

console.log(`universal documentation workflow validation passed: ${mode}`);
