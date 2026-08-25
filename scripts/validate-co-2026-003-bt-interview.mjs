import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const expectedStoryIds = [
  "DC-ST-09",
  "DC-ST-23",
  "DC-ST-24",
  "DC-ST-25",
  "DC-ST-26",
  "DC-ST-27",
  "DC-ST-28",
  "DC-ST-29",
  "DC-ST-30",
];

const expectedPriorityByStory = new Map([
  ["DC-ST-09", "P2"],
  ["DC-ST-23", "P1"],
  ["DC-ST-24", "P1"],
  ["DC-ST-25", "P1"],
  ["DC-ST-26", "P1"],
  ["DC-ST-27", "P1"],
  ["DC-ST-28", "P1"],
  ["DC-ST-29", "P1"],
  ["DC-ST-30", "P2"],
]);

const expectedTexts = [
  "Отправка презентации в SIGMA задерживается. В течение часа будут выполнены повторные попытки. Сообщу здесь, если отправка будет подтверждена.",
  "Презентация готова и направлена по электронной почте в SIGMA в ЧЧ:ММ.",
  "Презентация сформирована, но отправка по электронной почте в SIGMA и OMEGA не подтверждена. Задача передана в сопровождение.",
];

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  throw new Error(message);
}

export function loadBtInterviewArtifacts(root = process.cwd()) {
  const scopePath = "docs/product/sources/co-2026-003-current-2026-scope.json";
  const statePath = "docs/product/change-orders/co-2026-003-q4-lisa-profile-bt-interview-state.json";
  const transcriptPath = "docs/product/change-orders/co-2026-003-q4-lisa-profile-bt-interview-transcript.md";
  const amendmentPath = "docs/product/change-orders/co-2026-003-bt-interview-amendment.md";

  return {
    scope: readJson(root, scopePath),
    state: readJson(root, statePath),
    transcript: readText(root, transcriptPath),
    amendment: readText(root, amendmentPath),
    provenance: readJson(root, "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-08-19.provenance.json"),
  };
}

export function validateBtInterviewArtifacts(artifacts) {
  const { scope, state, transcript, amendment, provenance } = artifacts;

  if (scope.change_order_id !== "CO-2026-003" || scope.scope_period !== "2026-Q4") {
    fail("scope must belong to CO-2026-003 and 2026-Q4");
  }
  if (scope.resource_data_used !== false) {
    fail("2026 scope must not use resource data");
  }
  if (JSON.stringify(scope.active_story_ids) !== JSON.stringify(expectedStoryIds)) {
    fail("scope must contain exactly nine active 2026 stories in the approved order");
  }
  if (scope.stories.length !== expectedStoryIds.length) {
    fail("scope must contain exactly nine active 2026 stories");
  }
  for (const story of scope.stories) {
    if (!expectedPriorityByStory.has(story.story_id)) {
      fail(`unexpected active story: ${story.story_id}`);
    }
    if (story.priority !== expectedPriorityByStory.get(story.story_id) || story.target_period !== "2026-Q4") {
      fail(`invalid priority or period for active story: ${story.story_id}`);
    }
  }
  if (scope.excluded_story_ids.some((storyId) => scope.active_story_ids.includes(storyId))) {
    fail("excluded future stories must not be active");
  }
  if (scope.source.original_sha256 !== provenance.original_sha256) {
    fail("scope source hash must match controlled source provenance");
  }
  if (provenance.profile !== "backlog-2026-08-19-working" || provenance.renamed_status_labels !== 0) {
    fail("controlled workbook must preserve business wording without status renaming");
  }
  if (state.change_order_id !== "CO-2026-003" || state.scope_path !== "docs/product/sources/co-2026-003-current-2026-scope.json") {
    fail("interview state must point to the current 2026 scope");
  }
  const businessRequirementsApproved = state.status === "business_requirements_owner_approved";
  const expectedBusinessRequirementsStatus = businessRequirementsApproved
    ? "owner_approved"
    : "candidate_pending_owner_review";
  if (state.documentation_cascade.business_requirements !== expectedBusinessRequirementsStatus) {
    fail("business requirements state must match the owner approval status");
  }
  if (state.documentation_cascade.user_stories !== "pending" || state.documentation_cascade.system_requirements !== "pending") {
    fail("user stories and system requirements must remain pending during the business requirements stage");
  }
  if (state.documentation_cascade.prototype !== "accepted_11_frame_draft_unchanged" || state.documentation_cascade.final_release !== "pending") {
    fail("accepted draft prototype must remain unchanged and final release pending");
  }
  for (const expectedText of expectedTexts) {
    if (!transcript.includes(expectedText)) {
      fail(`transcript is missing accepted wording: ${expectedText}`);
    }
  }
  if (!/пять повторных попыток.*десять минут.*один час/isu.test(transcript)) {
    fail("transcript must define the SIGMA retry rule");
  }
  if (!/ошибке почтового сервиса.*повторные попытки не\s+выполняются/isu.test(transcript)) {
    fail("transcript must prohibit retries for a non-encryption mail-service error");
  }
  if (!amendment.includes("CO3-BT-AMND-005") || !amendment.includes("CO3-BT-AMND-006")) {
    fail("amendment must preserve the retry and wording decisions");
  }
  for (const forbidden of [/\/Users\//u, /file:\/\//iu, /tool output/iu, /internal prompt/iu]) {
    if (forbidden.test(transcript)) {
      fail("transcript contains a prohibited raw technical or local-data trace");
    }
  }
}

function isDirectExecution() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  try {
    validateBtInterviewArtifacts(loadBtInterviewArtifacts());
    console.log("CO-2026-003 BT interview validation passed");
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
