import fs from "node:fs";
import path from "node:path";
import process from "node:process";
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
  boundaryMatrix: "docs/architecture/security/integration-boundary-matrix.json",
  runLedger: "docs/architecture/observability/process-run-ledger.json",
  baSaEvals: "tests/evals/ba-sa-eval-cases.json",
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

  console.log("BA spec validation passed");
}

function validateBusinessRules() {
  validateBaSpec();
  const baSpec = readJson(paths.baSpec);
  const rules = readJson(paths.businessRules);
  const specRuleIds = ids(baSpec.business_rules, "rule_id");
  for (const rule of rules.rules) {
    if (!specRuleIds.has(rule.rule_id)) {
      fail(`business rule is missing from BA spec: ${rule.rule_id}`);
    }
    validateCommand(rule.verification);
  }
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
  console.log("error taxonomy validation passed");
}

function validateProductChangeOrders() {
  const order = validateSchema("schemas/product-change-order.schema.json", paths.changeOrder);
  const ledger = readJson(paths.changeLedger);
  if (!ledger.entries.some((entry) => entry.id === order.id && entry.order_path === paths.changeOrder)) {
    fail(`change order ledger does not include ${order.id}`);
  }
  for (const artifactPath of order.affected_artifacts) {
    requireFile(artifactPath);
  }
  for (const command of order.validation_plan) {
    validateCommand(command);
  }
  if (order.status === "accepted" && order.product_owner_decision.decision !== "accepted") {
    fail("accepted change order must have accepted Product Owner decision");
  }
  console.log("product change order validation passed");
}

function validateChangeImpact() {
  const impact = validateSchema("schemas/change-impact-assessment.schema.json", paths.changeImpact);
  const order = validateSchema("schemas/product-change-order.schema.json", paths.changeOrder);
  if (impact.change_order_id !== order.id) {
    fail("change impact assessment is linked to a different change order");
  }
  for (const command of impact.validation_plan) {
    validateCommand(command);
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
  const feature = validateSchema("schemas/feature-spec.schema.json", paths.featureSpec);
  const task = validateSchema("schemas/task-spec.schema.json", paths.taskSpec);
  const prompt = validateSchema("schemas/agent-prompt-spec.schema.json", paths.promptSpec);
  const manifest = validateSchema("schemas/generated-spec-package-manifest.schema.json", paths.specManifest);
  const baSpec = validateSchema("schemas/ba-spec.schema.json", paths.baSpec);
  const evals = readJson(paths.baSaEvals);
  const claimById = new Map(baSpec.claims.map((claim) => [claim.claim_id, claim]));
  const evalIds = ids(evals.cases, "id");

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
  for (const output of manifest.outputs) {
    requireFile(output.path);
  }
  console.log("spec/task/prompt readiness validation passed");
}

function validateInterfaces() {
  validateSaSpec();
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

if (target === "all") {
  for (const runner of Object.values(runners)) {
    runner();
  }
} else if (target in runners) {
  runners[target]();
} else {
  fail(`unknown BA/SA validation target: ${target}`);
}
