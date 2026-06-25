import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const statePath = process.argv.includes("--input")
  ? process.argv[process.argv.indexOf("--input") + 1]
  : "docs/product/bmc/interviews/2026-W26-bmc-interview-runtime-state.json";

const outputPaths = {
  answers: "docs/product/bmc/interviews/2026-W26-interview-answers.json",
  userEvidence: "docs/product/bmc/interviews/2026-W26-user-evidence.json",
  results: "docs/product/bmc/interviews/2026-W26-bmc-interview-results.json",
  trace: "docs/product/bmc/bmc-trace.v0.1.json",
  validationNeeds: "docs/product/bmc/bmc-validation-needs.json",
};

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  fs.mkdirSync(path.dirname(absolute(relativePath)), { recursive: true });
  fs.writeFileSync(absolute(relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

function validateData(schemaPath, data, label) {
  const validate = ajv.compile(readJson(schemaPath));
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${label} does not match ${schemaPath}`);
  }
}

const state = readJson(statePath);
validateData("schemas/bmc-interview-runtime-state.schema.json", state, statePath);

if (!["ready_for_confirmation", "completed"].includes(state.status)) {
  fail("runtime state must be ready_for_confirmation or completed before preparing BMC artifacts");
}

const selectedModeByDepth = {
  fast: "light",
  standard: "standard",
  deep: "deep",
};

const answers = {
  version: "0.1.0",
  status: state.status === "completed" ? "completed" : "draft_unvalidated",
  interview_id: state.interview_id,
  session_kind: state.session_kind === "real_user_interview" ? "real_user_interview" : "prepared_interview_baseline",
  selected_mode: selectedModeByDepth[state.selected_depth],
  selected_duration_minutes: state.selected_duration_minutes,
  respondent_role: state.respondent_role,
  captured_at: state.updated_at,
  answers: state.answers.map((answer) => ({
    answer_id: answer.answer_id,
    question_id: answer.question_id,
    bmc_block: answer.bmc_block,
    selected_option_ids: answer.selected_option_ids,
    custom_answer: answer.custom_answer,
    evidence_requested: answer.evidence_requested,
    evidence_ids: answer.evidence_ids,
    confidence: answer.confidence,
    confirmation_status: answer.confirmation_status,
    notes: answer.notes || answer.normalized_answer,
  })),
};

const userEvidence = {
  version: "0.1.0",
  status: state.status === "completed" ? "completed" : "draft_unvalidated",
  interview_id: state.interview_id,
  evidence_items: state.evidence_items.map(({ lifecycle_status: _lifecycleStatus, ...item }) => item),
  missing_evidence_notices: state.missing_evidence_notices.map((notice) => ({
    notice_id: notice.notice_id,
    linked_answer_ids: notice.linked_answer_ids,
    reason: `${notice.reason} Linked claims: ${notice.linked_claim_ids.join(", ")}`,
  })),
  privacy_rule: "Store only sanitized evidence metadata; user answers are not evidence by themselves.",
};

const claimIdsByStatus = (status) =>
  state.claims_snapshot.filter((claim) => claim.status === status).map((claim) => claim.claim_id);

const results = {
  version: "0.1.0",
  status: state.status === "completed" ? "completed" : "draft_unvalidated",
  interview_id: state.interview_id,
  session_kind: state.session_kind === "real_user_interview" ? "real_user_interview" : "prepared_interview_baseline",
  selected_mode: selectedModeByDepth[state.selected_depth],
  selected_duration_minutes: state.selected_duration_minutes,
  respondent_role: state.respondent_role,
  source_lock_path: "docs/product/bmc/source-lock.json",
  question_bank_path: "docs/product/bmc/bmc-interview-question-bank.json",
  answers_path: outputPaths.answers,
  user_evidence_path: outputPaths.userEvidence,
  bmc_trace_path: outputPaths.trace,
  summary: state.completion_summary,
  covered_bmc_blocks: state.covered_bmc_blocks,
  confirmed_claim_ids: claimIdsByStatus("confirmed"),
  unconfirmed_claim_ids: claimIdsByStatus("unconfirmed"),
  assumption_claim_ids: claimIdsByStatus("assumption"),
  contradicted_claim_ids: claimIdsByStatus("contradicted"),
  decisions: [
    {
      decision_id: "BMC-DEC-001",
      status: "accepted",
      summary: "BMC interview is conducted as a one-question-at-a-time Codex chat runtime.",
    },
    {
      decision_id: "BMC-DEC-002",
      status: "accepted",
      summary: "User answers without evidence keep related claims unconfirmed or assumption.",
    },
  ],
  evidence_requests: state.missing_evidence_notices.map((notice, index) => `EVD-REQ-${String(index + 1).padStart(3, "0")}`),
  top_hypotheses: state.claims_snapshot
    .filter((claim) => ["unconfirmed", "assumption"].includes(claim.status))
    .slice(0, 5)
    .map((claim) => `${claim.claim_id}: ${claim.statement}`),
  next_safe_step: "Review missing evidence requests, then regenerate BMC artifacts.",
};

validateData("schemas/bmc-interview-answers.schema.json", answers, outputPaths.answers);
validateData("schemas/bmc-user-evidence.schema.json", userEvidence, outputPaths.userEvidence);
validateData("schemas/bmc-interview-results.schema.json", results, outputPaths.results);

const trace = readJson(outputPaths.trace);
const claimsById = new Map(state.claims_snapshot.map((claim) => [claim.claim_id, claim]));
trace.status = state.status === "completed" ? "draft_working" : trace.status;
trace.interview_result_paths = [outputPaths.results];
for (const item of trace.items) {
  const claim = claimsById.get(item.item_id);
  if (!claim) {
    continue;
  }
  item.status = claim.status;
  item.statement = claim.statement;
  item.confidence = claim.confidence;
  item.interview_answer_ids = claim.linked_answer_ids;
  item.evidence_ids = claim.evidence_ids;
  item.brainstorm_result_ids = [state.interview_id];
  item.last_reviewed_at = state.updated_at;
}
const itemsById = new Map(trace.items.map((item) => [item.item_id, item]));
trace.claims = trace.claims.map((claim) => {
  const item = itemsById.get(claim.item_id);
  return {
    claim_id: claim.claim_id,
    item_id: claim.item_id,
    source_refs: item?.source_refs ?? [],
    derivation: claim.derivation ?? "derived_from_bmc_interview_source_lock_and_clean_content_model",
    introduced_in: claim.introduced_in ?? "SPRINT-2026-W26-S64",
    validation_state: item?.status ?? claim.validation_state ?? "unconfirmed",
    public_inclusion_policy: claim.public_inclusion_policy ?? "include_clean_statement_only",
  };
});
trace.unsupported_claims = claimIdsByStatus("deprecated");
trace.evidence_requests = results.evidence_requests;
trace.derived_artifacts = [
  {
    path: "docs/product/bmc/bmc-v0.2.md",
    format: "markdown",
    generated_by: "scripts/generate-bmc-artifacts.mjs",
  },
  {
    path: "docs/product/bmc/source/derived/datacanvas-bmc.puml",
    format: "plantuml",
    generated_by: "scripts/generate-bmc-artifacts.mjs",
  },
  {
    path: "docs/product/bmc/source/derived/datacanvas-bmc.svg",
    format: "svg",
    generated_by: "scripts/generate-bmc-artifacts.mjs",
  },
  {
    path: "docs/product/bmc/source/derived/datacanvas-bmc.png",
    format: "png",
    generated_by: "scripts/generate-bmc-artifacts.mjs",
  },
  {
    path: "docs/product/bmc/source/derived/datacanvas-bmc.pdf",
    format: "pdf",
    generated_by: "scripts/generate-bmc-artifacts.mjs",
  },
  {
    path: outputPaths.validationNeeds,
    format: "validation_needs_json",
    generated_by: "scripts/generate-bmc-artifacts.mjs",
  },
];
trace.audit.real_user_interview_completed = state.session_kind === "real_user_interview" && state.status === "completed";
trace.audit.next_safe_step = results.next_safe_step;
validateData("schemas/bmc-trace.schema.json", trace, outputPaths.trace);

if (dryRun) {
  console.log(`BMC interview artifact preparation dry-run passed: ${statePath}`);
} else {
  writeJson(outputPaths.answers, answers);
  writeJson(outputPaths.userEvidence, userEvidence);
  writeJson(outputPaths.results, results);
  writeJson(outputPaths.trace, trace);
  console.log(`BMC interview artifacts prepared from runtime state: ${statePath}`);
}
