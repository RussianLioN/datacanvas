import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const target = process.argv[2] ?? "all";

const paths = {
  session: "docs/product/interviews/ba-sa/active-interview-runtime-state.json",
  questionBank: "docs/product/interviews/ba-sa/question-bank.json",
  answers: "docs/product/interviews/ba-sa/interview-answer-set.json",
  results: "docs/product/interviews/ba-sa/interview-results.json",
  baSpec: "docs/product/analysis/ba/ba-spec.json",
  businessRules: "docs/product/analysis/ba/business-rules.json",
  stakeholderRegister: "docs/product/analysis/ba/stakeholder-register.json",
  businessNeeds: "docs/product/analysis/ba/business-needs.json",
  saSpec: "docs/architecture/system-analysis/sa-spec.json",
  srs: "docs/architecture/system-analysis/srs-v0.1.json",
  stateModel: "docs/architecture/system-analysis/datacanvas-lifecycle-state-model.json",
  errorTaxonomy: "docs/architecture/system-analysis/error-taxonomy.json",
  changeOrder: "docs/product/change-orders/co-2026-001-a2a-first-priority.json",
  changeLedger: "docs/product/change-orders/product-change-order-ledger.json",
  changeImpact: "docs/product/change-orders/change-impact-assessment.json",
  coverage: "docs/product/analysis/ba-sa/interview-derived-coverage.json",
  featureSpec: "docs/product/specs/feature-spec-a2a-launch.json",
  taskSpec: "docs/product/specs/task-spec-a2a-launch.json",
  promptSpec: "docs/product/specs/agent-prompt-spec-a2a-launch.json",
  specTrace: "docs/product/specs/interview-to-spec-trace.json",
  specManifest: "docs/product/specs/generated-spec-package-manifest.json",
  q4SpecFixture: "tests/fixtures/spec-task-prompt-q4-lisa-profile.json",
  userStories: "docs/product/requirements/user-stories.md",
  traceabilityMatrix: "docs/product/requirements/traceability-matrix.json",
  boundaryMatrix: "docs/architecture/security/integration-boundary-matrix.json",
  runLedger: "docs/architecture/observability/process-run-ledger.json",
  baSaEvals: "tests/evals/ba-sa-eval-cases.json",
  q4Fixture: "tests/fixtures/ba-sa-q4-lisa-profile.json",
  q4DecisionRegister: "docs/product/change-orders/co-2026-003-authoritative-interview-decision-register.json",
};

const requiredDomains = [
  "stakeholders",
  "current_process",
  "target_outcome",
  "value",
  "constraints",
  "policies",
  "exceptions",
  "channels",
  "data",
  "decision_roles",
  "acceptance_examples",
  "risks",
  "metrics",
  "rollback",
];

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
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

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    fail(`required file is missing: ${relativePath}`);
  }
}

function validateSchema(schemaPath, dataPath) {
  requireFile(schemaPath);
  requireFile(dataPath);
  let validate = validators.get(schemaPath);
  if (!validate) {
    validate = ajv.compile(readJson(schemaPath));
    validators.set(schemaPath, validate);
  }

  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
  return data;
}

function knownPackageScripts() {
  return readJson("package.json").scripts ?? {};
}

function validateCommand(command) {
  if (command === "npm test") {
    return;
  }
  if (!command.startsWith("npm run ")) {
    fail(`unsupported validation command format: ${command}`);
  }
  const scriptName = command.slice("npm run ".length);
  if (!(scriptName in knownPackageScripts())) {
    fail(`validation command references missing npm script: ${command}`);
  }
}

function assertNoForbiddenRawAnswerKeys(value, location) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenRawAnswerKeys(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "raw_answer") {
      fail(`raw_answer key is forbidden: ${location}.${key}`);
    }
    assertNoForbiddenRawAnswerKeys(child, `${location}.${key}`);
  }
}

function ids(items, field) {
  return new Set(items.map((item) => item[field]));
}

function requireIds(actualIds, requiredIds, subject) {
  for (const id of requiredIds) {
    if (!actualIds.has(id)) {
      fail(`${subject} is missing required item: ${id}`);
    }
  }
}

function q4Fixture() {
  return readJson(paths.q4Fixture);
}

export function validateQ4TraceabilityReferences(refs, knownStoryIds, knownAcceptanceScenarioIds, subject) {
  for (const storyId of refs.story_ids ?? []) {
    if (!knownStoryIds.has(storyId)) {
      throw new Error(`${subject} references unknown story: ${storyId}`);
    }
  }
  for (const acceptanceScenarioId of refs.acceptance_scenario_ids ?? []) {
    if (!knownAcceptanceScenarioIds.has(acceptanceScenarioId)) {
      throw new Error(`${subject} references unknown acceptance scenario: ${acceptanceScenarioId}`);
    }
  }
}

function storyIdsFromAuthoritativeCatalog() {
  const storyIds = new Set(
    [...readText(paths.userStories).matchAll(/^\|\s*(DC-ST-\d+)\s*\|/gmu)].map((match) => match[1]),
  );
  if (storyIds.size === 0) {
    fail(`authoritative story catalog contains no story IDs: ${paths.userStories}`);
  }
  return storyIds;
}

function acceptanceScenarioIdsFromAuthoritativeMatrix() {
  const matrix = readJson(paths.traceabilityMatrix);
  if (!Array.isArray(matrix.links)) {
    fail(`authoritative traceability matrix must contain links: ${paths.traceabilityMatrix}`);
  }
  const scenarioIds = new Set(matrix.links.flatMap((entry) => entry.acceptance_scenarios ?? []));
  if (scenarioIds.size === 0) {
    fail(`authoritative traceability matrix contains no acceptance scenarios: ${paths.traceabilityMatrix}`);
  }
  return scenarioIds;
}

const q4OpenExternalInterfaceIds = new Set(["IF-006", "IF-007"]);
const preciseExternalContractClaim = /\b(?:REST(?:\s+API)?|GraphQL|gRPC|SOAP|OAuth(?:\s*2(?:\.0)?)?|OpenID Connect|SAML|Basic(?:\s+auth(?:entication)?)?|Bearer|HTTP(?:\/\d(?:\.\d)?)?|HTTPS|SMTP|IMAP|POP3|TCP|UDP|webhook)\b|\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/|\bAPI\s*(?:v)?\d+|\/v\d+(?:\/|$)/iu;

export function validateOpenExternalQ4Interfaces(interfaces) {
  const byId = new Map(interfaces.map((item) => [item.interface_id, item]));
  for (const interfaceId of q4OpenExternalInterfaceIds) {
    const item = byId.get(interfaceId);
    if (!item) {
      throw new Error(`Q4 interface is missing: ${interfaceId}`);
    }
    if (!Array.isArray(item.open_questions) || item.open_questions.length === 0) {
      throw new Error(`Q4 interface must keep open questions: ${interfaceId}`);
    }
    const externalContractText = [item.contract_status, ...item.open_questions].filter(Boolean).join("\n");
    if (preciseExternalContractClaim.test(externalContractText)) {
      throw new Error(`Q4 interface must not define a precise API, authentication, or protocol claim: ${interfaceId}`);
    }
  }
}

export function validateQ4DeliveryProblemClosure({ baSpec, businessRules, saSpec, stateModel, errorTaxonomy }) {
  const requireText = (value, pattern, message) => {
    if (!pattern.test(value ?? "")) {
      throw new Error(message);
    }
  };
  const byId = (items, field) => new Map(items.map((item) => [item[field], item]));
  const baRequirements = byId(baSpec.requirements, "requirement_id");
  const rules = byId(businessRules.rules, "rule_id");
  const saRequirements = byId(saSpec.requirements, "requirement_id");
  const lifecycleStates = byId(stateModel.states, "name");
  const saLifecycleStates = byId(saSpec.lifecycle_states, "name");
  const errors = byId(errorTaxonomy.errors, "error_id");

  requireText(
    baRequirements.get("BT-024")?.summary,
    /задержанн.*сопровожден.*закрыва.*новый заказ/iu,
    "BT-024 must close the delayed-delivery session and block a new order",
  );
  requireText(
    rules.get("BRULE-008")?.summary,
    /задержанн.*сопровожден.*закрыва.*новый заказ/iu,
    "BRULE-008 must close the delayed-delivery session and block a new order",
  );
  requireText(
    saRequirements.get("BT-024")?.verification_method,
    /задержанн.*support_pending.*session_closed/iu,
    "SA BT-024 must describe delayed to support_pending to session_closed",
  );
  for (const [states, subject] of [[lifecycleStates, "state model"], [saLifecycleStates, "SA lifecycle"]]) {
    requireText(states.get("delayed")?.exit_condition, /support_pending/u, `${subject} delayed must transfer to support_pending`);
    requireText(states.get("support_pending")?.exit_condition, /session_closed/u, `${subject} support_pending must close the session`);
    requireText(states.get("session_closed")?.exit_condition, /новый заказ не создается/iu, `${subject} session_closed must block a new order`);
  }
  requireText(errors.get("ERR-009")?.retry_policy, /support_pending/u, "ERR-009 must transfer delayed delivery to support_pending");
  requireText(errors.get("ERR-009")?.rollback_signal, /закрыть сеанс.*новый заказ/iu, "ERR-009 must close the session and block a new order");
}

function validateInterview() {
  const session = validateSchema("schemas/interview-session.schema.json", paths.session);
  const answers = validateSchema("schemas/interview-answer-set.schema.json", paths.answers);
  const questionBank = readJson(paths.questionBank);
  const results = readJson(paths.results);
  assertNoForbiddenRawAnswerKeys(answers, paths.answers);

  for (const requiredPath of [session.question_bank_path, session.answer_set_path, session.results_path]) {
    requireFile(requiredPath);
  }

  const questionDomains = new Set(questionBank.questions.map((question) => question.domain));
  const answerDomains = new Set(answers.answers.map((answer) => answer.domain));
  for (const domain of requiredDomains) {
    if (!questionDomains.has(domain)) {
      fail(`question bank is missing domain: ${domain}`);
    }
    if (!answerDomains.has(domain)) {
      fail(`answer set is missing domain: ${domain}`);
    }
  }

  const questionIds = ids(questionBank.questions, "question_id");
  for (const answer of answers.answers) {
    if (!questionIds.has(answer.question_id)) {
      fail(`answer references unknown question: ${answer.answer_id}`);
    }
    if (answer.raw_answer_ref.startsWith("inline:")) {
      fail(`raw answer ref must not inline content: ${answer.answer_id}`);
    }
    if (answer.confirmation_status === "confirmed" && answer.evidence_refs.length === 0) {
      fail(`confirmed answer must have evidence refs: ${answer.answer_id}`);
    }
    if (
      answer.confirmation_status !== "confirmed" &&
      answer.allowed_downstream_use.some((use) => ["artifact_generation", "acceptance_gate"].includes(use))
    ) {
      fail(`unconfirmed answer cannot be used for artifact generation or acceptance: ${answer.answer_id}`);
    }
  }

  for (const claimId of results.confirmed_claim_ids ?? []) {
    if (!/^BASA-CLM-\d{3}$/.test(claimId)) {
      fail(`invalid confirmed claim id in results: ${claimId}`);
    }
  }

  console.log("BA/SA interview validation passed");
}

function validateBaSpec() {
  const baSpec = validateSchema("schemas/ba-spec.schema.json", paths.baSpec);
  const answers = validateSchema("schemas/interview-answer-set.schema.json", paths.answers);
  const answerIds = ids(answers.answers, "answer_id");
  const claimById = new Map(baSpec.claims.map((claim) => [claim.claim_id, claim]));

  assertNoForbiddenRawAnswerKeys(baSpec, paths.baSpec);
  requireFile(baSpec.source_answer_set_path);

  for (const claim of baSpec.claims) {
    if (claim.trust_status === "confirmed" && claim.evidence_refs.length === 0) {
      fail(`confirmed claim must have evidence refs: ${claim.claim_id}`);
    }
    if (claim.trust_status !== "confirmed" && claim.promoted_to_requirement) {
      fail(`only confirmed claims can be promoted to requirements: ${claim.claim_id}`);
    }
    if (claim.trust_status !== "confirmed" && claim.allowed_downstream_use.includes("acceptance_gate")) {
      fail(`only confirmed claims can be used as acceptance gate: ${claim.claim_id}`);
    }
  }

  const requireClaim = (claimId, location) => {
    if (!claimById.has(claimId)) {
      fail(`${location} references unknown claim: ${claimId}`);
    }
  };

  for (const requirement of baSpec.requirements) {
    for (const claimId of requirement.source_claim_ids) {
      requireClaim(claimId, requirement.requirement_id);
      if (claimById.get(claimId).trust_status !== "confirmed") {
        fail(`requirement uses non-confirmed claim: ${requirement.requirement_id}/${claimId}`);
      }
    }
    if (requirement.coverage_status === "covered" && requirement.acceptance_refs.length === 0) {
      fail(`covered requirement must have acceptance refs: ${requirement.requirement_id}`);
    }
  }

  for (const stakeholder of baSpec.stakeholders) {
    stakeholder.source_claim_ids.forEach((claimId) => requireClaim(claimId, stakeholder.stakeholder_id));
  }
  for (const need of baSpec.needs) {
    need.source_claim_ids.forEach((claimId) => requireClaim(claimId, need.need_id));
  }
  for (const rule of baSpec.business_rules) {
    rule.source_claim_ids.forEach((claimId) => requireClaim(claimId, rule.rule_id));
  }

  for (const answer of answers.answers) {
    if (!answerIds.has(answer.answer_id)) {
      fail(`answer map consistency failed: ${answer.answer_id}`);
    }
  }

  const q4 = q4Fixture();
  requireIds(ids(baSpec.claims, "claim_id"), q4.required_claim_ids, "BA spec claims");
  requireIds(ids(baSpec.business_rules, "rule_id"), q4.required_rule_ids, "BA spec business rules");
  requireIds(ids(baSpec.requirements, "requirement_id"), ["BT-019", "BT-022", "BT-023", "BT-024"], "BA spec requirements");
  for (const claimId of q4.required_claim_ids) {
    if (claimById.get(claimId).trust_status !== "confirmed") {
      fail(`Q4 claim must be confirmed: ${claimId}`);
    }
  }

  console.log("BA spec validation passed");
}

function validateBusinessRules() {
  validateBaSpec();
  const baSpec = readJson(paths.baSpec);
  const rules = readJson(paths.businessRules);
  const specRules = new Map(baSpec.business_rules.map((rule) => [rule.rule_id, rule]));
  const q4RuleIds = new Set(q4Fixture().required_rule_ids);
  for (const rule of rules.rules) {
    const specRule = specRules.get(rule.rule_id);
    if (!specRule) {
      fail(`business rule is missing from BA spec: ${rule.rule_id}`);
    }
    if (q4RuleIds.has(rule.rule_id)) {
      for (const field of ["summary", "owner_role", "verification"]) {
        if (rule[field] !== specRule[field]) {
          fail(`business rule diverges from BA spec: ${rule.rule_id}/${field}`);
        }
      }
      if (JSON.stringify(rule.source_claim_ids) !== JSON.stringify(specRule.source_claim_ids)) {
        fail(`business rule diverges from BA spec: ${rule.rule_id}/source_claim_ids`);
      }
    }
    validateCommand(rule.verification);
  }
  requireIds(ids(rules.rules, "rule_id"), q4Fixture().required_rule_ids, "business rules");
  console.log("business rules validation passed");
}

function validateSaSpec() {
  const saSpec = validateSchema("schemas/sa-spec.schema.json", paths.saSpec);
  for (const requiredPath of [saSpec.source_ba_spec_path, saSpec.srs_path, paths.srs, paths.runLedger]) {
    requireFile(requiredPath);
  }
  const srs = readJson(paths.srs);
  if (!srs.assumptions?.some((assumption) => assumption.includes("CO-2026-001 принят Product Owner"))) {
    fail("SRS must reflect accepted CO-2026-001 status");
  }
  if (JSON.stringify(srs).includes("A2A-first is a draft Product Change Order until Product Owner acceptance")) {
    fail("SRS must not keep stale draft Product Change Order assumption after CO-2026-001 acceptance");
  }
  for (const item of [...saSpec.interfaces, ...saSpec.nfrs]) {
    validateCommand(item.validation_command);
  }
  const runLedger = readJson(paths.runLedger);
  for (const run of runLedger.runs) {
    for (const inputPath of run.input_paths) {
      requireFile(inputPath);
    }
    for (const outputPath of run.output_paths) {
      requireFile(outputPath);
    }
  }
  const q4 = q4Fixture();
  requireIds(ids(saSpec.interfaces, "interface_id"), q4.required_interface_ids, "SA spec interfaces");
  requireIds(ids(saSpec.requirements, "requirement_id"), ["BT-019", "BT-022", "BT-023", "BT-024"], "SA spec requirements");
  for (const interfaceId of q4.required_interface_ids) {
    const item = saSpec.interfaces.find((candidate) => candidate.interface_id === interfaceId);
    if (!item.contract_status || !Array.isArray(item.open_questions) || item.open_questions.length === 0) {
      fail(`Q4 interface must keep its external contract open: ${interfaceId}`);
    }
  }
  try {
    validateOpenExternalQ4Interfaces(saSpec.interfaces);
  } catch (error) {
    fail(error.message);
  }
  console.log("SA spec validation passed");
}

function validateStateModel() {
  const stateModel = readJson(paths.stateModel);
  const stateIds = ids(stateModel.states, "state_id");
  for (const requiredState of ["STATE-001", "STATE-002", "STATE-003", "STATE-004", "STATE-005", "STATE-006", "STATE-007", "STATE-008"]) {
    if (!stateIds.has(requiredState)) {
      fail(`state model is missing state: ${requiredState}`);
    }
  }
  const deliveryState = stateModel.states.find((state) => state.name === "delivery_acceptance");
  if (!deliveryState?.entry_condition?.includes("канал доставки файла по CO-2026-001 принят")) {
    fail("delivery_acceptance must reflect accepted CO-2026-001 delivery channel");
  }
  const q4 = q4Fixture();
  requireIds(ids(stateModel.states, "name"), q4.required_state_names, "Q4 lifecycle states");
  const byName = new Map(stateModel.states.map((state) => [state.name, state]));
  if (!byName.get("accepted_locked")?.exit_condition.includes("повторный запрос")) {
    fail("accepted_locked must block duplicate requests");
  }
  if (!byName.get("delivery_confirmed")?.exit_condition.includes("Кнопка недоступна")) {
    fail("delivery_confirmed must disable the action until session end");
  }
  if (!byName.get("delivery_partial")?.exit_condition.includes("support_pending")) {
    fail("delivery_partial must transfer to support_pending");
  }
  if (!byName.get("delayed")?.exit_condition.includes("support_pending")) {
    fail("delayed must transfer to support_pending");
  }
  if (!byName.get("support_pending")?.exit_condition.includes("session_closed")) {
    fail("support_pending must close the session");
  }
  if (!byName.get("session_closed")?.exit_condition.includes("новый заказ не создается")) {
    fail("session_closed must block a new order");
  }
  console.log("state model validation passed");
}

function validateErrorTaxonomy() {
  const taxonomy = readJson(paths.errorTaxonomy);
  const coverage = validateSchema("schemas/interview-derived-coverage.schema.json", paths.coverage);
  const acceptanceIds = new Set(coverage.coverage_links.map((link) => link.acceptance_id));
  for (const error of taxonomy.errors) {
    if (!acceptanceIds.has(error.linked_acceptance)) {
      fail(`error taxonomy references unknown acceptance id: ${error.error_id}`);
    }
    if (!error.retry_policy || !error.rollback_signal || !error.redaction_rule) {
      fail(`error taxonomy entry is incomplete: ${error.error_id}`);
    }
  }
  const q4 = q4Fixture();
  requireIds(ids(taxonomy.errors, "error_id"), q4.required_error_ids, "Q4 errors");
  const q4Errors = taxonomy.errors.filter((error) => q4.required_error_ids.includes(error.error_id));
  if (q4Errors.some((error) => /\\b[0-9]+\\s*(?:раз|повтор)/iu.test(error.retry_policy))) {
    fail("Q4 error taxonomy must not invent a numeric retry policy");
  }
  if (!q4Errors.find((error) => error.error_id === "ERR-010")?.rollback_signal.includes("Закрыть сеанс")) {
    fail("ERR-010 must close the session");
  }
  try {
    validateQ4DeliveryProblemClosure({
      baSpec: readJson(paths.baSpec),
      businessRules: readJson(paths.businessRules),
      saSpec: readJson(paths.saSpec),
      stateModel: readJson(paths.stateModel),
      errorTaxonomy: taxonomy,
    });
  } catch (error) {
    fail(error.message);
  }
  console.log("error taxonomy validation passed");
}

function validateProductChangeOrders() {
  const ledger = readJson(paths.changeLedger);
  if (!Array.isArray(ledger.entries) || ledger.entries.length === 0) {
    fail("change order ledger must contain at least one entry");
  }

  for (const entry of ledger.entries) {
    const order = validateSchema("schemas/product-change-order.schema.json", entry.order_path);
    if (order.id !== entry.id) {
      fail(`change order ledger id mismatch for ${entry.order_path}`);
    }
    if (entry.impact_assessment_path !== order.impact_assessment_path) {
      fail(`change order ledger impact path mismatch for ${order.id}`);
    }
    for (const artifactPath of order.affected_artifacts) {
      requireFile(artifactPath);
    }
    for (const command of order.validation_plan) {
      validateCommand(command);
    }
    if (order.status === "accepted" && order.product_owner_decision.decision !== "accepted") {
      fail(`accepted change order must have accepted Product Owner decision: ${order.id}`);
    }
  }
  console.log("product change orders validation passed");
}

function validateChangeImpact() {
  const ledger = readJson(paths.changeLedger);
  if (!Array.isArray(ledger.entries) || ledger.entries.length === 0) {
    fail("change order ledger must contain at least one entry");
  }

  for (const entry of ledger.entries) {
    const order = validateSchema("schemas/product-change-order.schema.json", entry.order_path);
    const impact = validateSchema("schemas/change-impact-assessment.schema.json", entry.impact_assessment_path);
    if (impact.change_order_id !== order.id) {
      fail(`change impact assessment is linked to a different change order: ${entry.impact_assessment_path}`);
    }
    if (entry.impact_assessment_path !== order.impact_assessment_path) {
      fail(`change impact assessment path mismatch for ${order.id}`);
    }
    for (const artifactPath of impact.affected_artifacts) {
      requireFile(artifactPath);
    }
    for (const command of impact.validation_plan) {
      validateCommand(command);
    }
  }
  console.log("change impact validation passed");
}

function validateCoverage() {
  const coverage = validateSchema("schemas/interview-derived-coverage.schema.json", paths.coverage);
  const baSpec = validateSchema("schemas/ba-spec.schema.json", paths.baSpec);
  const evals = readJson(paths.baSaEvals);
  const claimIds = ids(baSpec.claims, "claim_id");
  const requirementIds = ids(baSpec.requirements, "requirement_id");
  const evalIds = ids(evals.cases, "id");
  for (const link of coverage.coverage_links) {
    if (!claimIds.has(link.claim_id)) {
      fail(`coverage references unknown claim: ${link.claim_id}`);
    }
    if (!requirementIds.has(link.requirement_id) && link.status !== "deferred") {
      fail(`coverage references unknown requirement: ${link.requirement_id}`);
    }
    if (!evalIds.has(link.eval_id)) {
      fail(`coverage references unknown eval: ${link.eval_id}`);
    }
    validateCommand(link.gate);
  }
  console.log("interview-derived coverage validation passed");
}

function validateSpecReadiness() {
  const manifest = validateSchema("schemas/generated-spec-package-manifest.schema.json", paths.specManifest);
  const baSpec = validateSchema("schemas/ba-spec.schema.json", paths.baSpec);
  const evals = readJson(paths.baSaEvals);
  const businessRules = readJson(paths.businessRules);
  const q4SpecFixture = readJson(paths.q4SpecFixture);
  const q4DecisionRegister = validateSchema("schemas/authoritative-interview-decision-register.schema.json", paths.q4DecisionRegister);
  const q4DecisionIds = new Set(q4DecisionRegister.decisions.map((decision) => decision.decision_id));
  const claimById = new Map(baSpec.claims.map((claim) => [claim.claim_id, claim]));
  const evalIds = ids(evals.cases, "id");
  const ruleIds = ids(businessRules.rules, "rule_id");
  const interfaceIds = ids(validateSchema("schemas/sa-spec.schema.json", paths.saSpec).interfaces, "interface_id");
  const authoritativeStoryIds = storyIdsFromAuthoritativeCatalog();
  const authoritativeAcceptanceScenarioIds = acceptanceScenarioIdsFromAuthoritativeMatrix();
  const defaultSpecSet = {
    feature_spec_path: paths.featureSpec,
    task_spec_path: paths.taskSpec,
    prompt_spec_path: paths.promptSpec,
  };
  const specSets = manifest.spec_sets ?? [defaultSpecSet];

  for (const specSet of specSets) {
    const feature = validateSchema("schemas/feature-spec.schema.json", specSet.feature_spec_path);
    const task = validateSchema("schemas/task-spec.schema.json", specSet.task_spec_path);
    const prompt = validateSchema("schemas/agent-prompt-spec.schema.json", specSet.prompt_spec_path);

    if (task.feature_id !== feature.feature_id) {
      fail("TaskSpec feature_id does not match FeatureSpec");
    }
    if (prompt.task_id !== task.task_id) {
      fail("AgentPromptSpec task_id does not match TaskSpec");
    }
    if (feature.priority !== task.priority) {
      fail("FeatureSpec and TaskSpec priorities differ");
    }
    for (const claimId of feature.source_claim_ids) {
      const claim = claimById.get(claimId);
      if (!claim) {
        fail(`FeatureSpec references unknown claim: ${claimId}`);
      }
      if (claim.trust_status !== "confirmed") {
        fail(`FeatureSpec references non-confirmed claim: ${claimId}`);
      }
    }
    for (const evalId of [...feature.eval_cases, ...task.eval_cases]) {
      if (!evalIds.has(evalId)) {
        fail(`spec references unknown BA/SA eval: ${evalId}`);
      }
    }
    for (const command of [...feature.validation_commands, ...task.validation_commands, ...prompt.validation_commands]) {
      validateCommand(command);
    }
    if (prompt.raw_transcript_included !== false) {
      fail("AgentPromptSpec must not include raw transcript");
    }
  }

  for (const expected of q4SpecFixture.spec_sets) {
    const specSet = specSets.find((candidate) =>
      candidate.feature_spec_path === expected.feature_path &&
      candidate.task_spec_path === expected.task_path &&
      candidate.prompt_spec_path === expected.prompt_path,
    );
    if (!specSet) {
      fail(`Q4 spec set is missing from manifest: ${expected.task_id}`);
    }
    for (const specPath of [expected.feature_path, expected.task_path, expected.prompt_path]) {
      const refs = readJson(specPath).traceability_refs;
      if (!refs || refs.change_order_ids?.length !== 1 || refs.change_order_ids[0] !== q4SpecFixture.change_order_id) {
        fail(`Q4 spec must reference ${q4SpecFixture.change_order_id}: ${specPath}`);
      }
      for (const key of q4SpecFixture.required_traceability_keys) {
        if (!Array.isArray(refs[key]) || refs[key].length === 0) {
          fail(`Q4 spec has incomplete traceability_refs.${key}: ${specPath}`);
        }
      }
      if (!Array.isArray(refs.decision_ids) || refs.decision_ids.length === 0) {
        fail(`Q4 spec must reference authoritative interview decisions: ${specPath}`);
      }
      for (const decisionId of refs.decision_ids) {
        if (!q4DecisionIds.has(decisionId)) fail(`Q4 spec references unknown authoritative decision: ${decisionId}`);
      }
      for (const interfaceId of refs.interface_ids) {
        if (!interfaceIds.has(interfaceId)) {
          fail(`Q4 spec references unknown interface: ${interfaceId}`);
        }
      }
      for (const ruleId of refs.business_rule_ids) {
        if (!ruleIds.has(ruleId)) {
          fail(`Q4 spec references unknown business rule: ${ruleId}`);
        }
      }
      try {
        validateQ4TraceabilityReferences(refs, authoritativeStoryIds, authoritativeAcceptanceScenarioIds, specPath);
      } catch (error) {
        fail(error.message);
      }
    }
  }

  const q4Traceability = q4SpecFixture.expected_traceability_by_path;
  const actualQ4StoryIds = new Set(q4Traceability.flatMap((entry) => readJson(entry.path).traceability_refs.story_ids));
  const actualQ4AcceptanceScenarioIds = new Set(q4Traceability.flatMap((entry) => readJson(entry.path).traceability_refs.acceptance_scenario_ids));
  requireIds(actualQ4StoryIds, q4SpecFixture.required_q4_story_ids, "Q4 spec traceability stories");
  requireIds(actualQ4AcceptanceScenarioIds, q4SpecFixture.required_q4_acceptance_scenario_ids, "Q4 spec traceability acceptance scenarios");

  const validationResults = new Map();
  for (const result of manifest.validation_results) {
    if (validationResults.has(result.command)) {
      fail(`spec package manifest records duplicate validation result: ${result.command}`);
    }
    validationResults.set(result.command, result.status);
  }
  for (const command of q4SpecFixture.required_validation_commands) {
    if (validationResults.get(command) !== "passed") {
      fail(`Q4 spec package manifest lacks a passed validation result: ${command}`);
    }
  }

  const trace = readJson(paths.specTrace);
  assertNoForbiddenRawAnswerKeys(trace, paths.specTrace);
  for (const link of trace.links) {
    const claim = claimById.get(link.claim_id);
    if (!claim || claim.trust_status !== "confirmed" || link.trust_status !== "confirmed") {
      fail(`interview-to-spec trace has non-confirmed claim: ${link.claim_id}`);
    }
  }
  for (const expectedLink of q4SpecFixture.required_trace_links) {
    const found = trace.links.some((link) => Object.entries(expectedLink).every(([key, value]) => link[key] === value));
    if (!found) {
      fail(`Q4 interview-to-spec trace is missing: ${expectedLink.claim_id}/${expectedLink.task_id}`);
    }
  }
  for (const link of trace.links.filter((link) => ["FS-002", "FS-003"].includes(link.feature_id))) {
    if (!link.decision_id || !q4DecisionIds.has(link.decision_id)) {
      fail(`Q4 interview-to-spec trace lacks an authoritative decision: ${link.claim_id}/${link.task_id}`);
    }
  }
  for (const output of manifest.outputs) {
    requireFile(output.path);
  }
  console.log("spec/task/prompt readiness validation passed");
}

function validateInterfaces() {
  validateSaSpec();
  const saSpec = readJson(paths.saSpec);
  const byId = new Map(saSpec.interfaces.map((item) => [item.interface_id, item]));
  if (!byId.get("IF-008")?.contract_status.includes("прямой маршрут DataCanvas в Лису не утвержден")) {
    fail("IF-008 must keep direct DataCanvas to Lisa delivery unapproved");
  }
  if (!byId.get("IF-009")?.contract_status.includes("прямую доставку DataCanvas в Лису этот контракт не фиксирует")) {
    fail("IF-009 must not define direct DataCanvas to Lisa delivery");
  }
  const matrix = readJson(paths.boundaryMatrix);
  for (const boundary of matrix.boundaries) {
    if (boundary.stop_rules.length === 0) {
      fail(`boundary has no stop rules: ${boundary.boundary_id}`);
    }
    if (
      ["A2A launch", "MCP context"].includes(boundary.name) &&
      !boundary.authn_authz.includes("not enabled in baseline")
    ) {
      fail(`live integration boundary must remain disabled in baseline: ${boundary.boundary_id}`);
    }
  }
  console.log("interface contracts validation passed");
}

const runners = {
  "ba-sa-interview": validateInterview,
  "ba-spec": validateBaSpec,
  "sa-spec": validateSaSpec,
  "business-rules": validateBusinessRules,
  "interview-derived-coverage": validateCoverage,
  "product-change-orders": validateProductChangeOrders,
  "change-impact": validateChangeImpact,
  "spec-task-prompt-readiness": validateSpecReadiness,
  "interface-contracts": validateInterfaces,
  "state-model": validateStateModel,
  "error-taxonomy": validateErrorTaxonomy,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (target === "all") {
    for (const runner of Object.values(runners)) {
      runner();
    }
  } else if (target in runners) {
    runners[target]();
  } else {
    fail(`unknown BA/SA validation target: ${target}`);
  }
}
