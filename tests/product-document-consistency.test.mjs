import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptedBmcSegmentDecisionProblems,
  approvalConsistencyProblems,
  bmcAcceptanceStatusProblems,
  decisionApprovalConsistencyProblems,
  ownerDecisionStatusProblems,
  openDecisionConsistencyProblems,
  pendingTeamDownstreamUseProblems,
  planningReadinessProblems,
  roadmapTimingProblems,
  sprintCandidatePlanProblems,
  storySlicePlanningProblems,
  traceabilityVisionAuthorityProblems,
} from "../scripts/lib/product-document-consistency.mjs";

test("owner approval cannot be presented as team approval", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "owner_approved",
    teamValidationStatus: "approved",
  });
  assert.ok(problems.some((problem) => problem.includes("team_approved")));
});

test("explicit owner authority permits Jira export without team or sprint approval", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "owner_approved",
    teamValidationStatus: "approved",
    rowApprovalStatuses: ["owner_approved", "owner_approved"],
    rowTeamValidationStatuses: ["approved", "approved"],
    downstreamPolicy: {
      may_update_sprint_backlog: false,
      may_export_to_jira: true,
      requires_team_approval_record: false,
      jira_export_authority: "process_owner_and_product_owner",
      jira_export_decision_id: "UDW-DEC-019",
    },
  });
  assert.deepEqual(problems, []);
});

test("owner-authorized Jira export requires both authority fields", () => {
  const withoutAuthority = approvalConsistencyProblems({
    approvalStatus: "owner_approved",
    teamValidationStatus: "approved",
    rowApprovalStatuses: ["owner_approved"],
    rowTeamValidationStatuses: ["approved"],
    downstreamPolicy: {
      may_update_sprint_backlog: false,
      may_export_to_jira: true,
      requires_team_approval_record: false,
      jira_export_decision_id: "UDW-DEC-019",
    },
  });
  assert.ok(withoutAuthority.some((problem) => problem.includes("jira_export_authority")));

  const withoutDecision = approvalConsistencyProblems({
    approvalStatus: "owner_approved",
    teamValidationStatus: "approved",
    rowApprovalStatuses: ["owner_approved"],
    rowTeamValidationStatuses: ["approved"],
    downstreamPolicy: {
      may_update_sprint_backlog: false,
      may_export_to_jira: true,
      requires_team_approval_record: false,
      jira_export_authority: "process_owner_and_product_owner",
    },
  });
  assert.ok(withoutDecision.some((problem) => problem.includes("jira_export_decision_id")));
});

test("owner-authorized Jira export keeps sprint backlog forbidden", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "owner_approved",
    teamValidationStatus: "approved",
    rowApprovalStatuses: ["owner_approved"],
    rowTeamValidationStatuses: ["approved"],
    downstreamPolicy: {
      may_update_sprint_backlog: true,
      may_export_to_jira: true,
      requires_team_approval_record: false,
      jira_export_authority: "process_owner_and_product_owner",
      jira_export_decision_id: "UDW-DEC-019",
    },
  });
  assert.ok(problems.some((problem) => problem.includes("sprint backlog")));
});

test("draft_unapproved always forbids Jira export", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "draft_unapproved",
    teamValidationStatus: "approved",
    rowApprovalStatuses: ["owner_approved"],
    rowTeamValidationStatuses: ["approved"],
    downstreamPolicy: {
      may_update_sprint_backlog: false,
      may_export_to_jira: true,
      requires_team_approval_record: false,
      jira_export_authority: "process_owner_and_product_owner",
      jira_export_decision_id: "UDW-DEC-019",
    },
  });
  assert.ok(problems.some((problem) => problem.includes("draft_unapproved")));
});

test("owner-authorized Jira export requires approved status for every row", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "owner_approved",
    teamValidationStatus: "approved",
    rowApprovalStatuses: ["owner_approved", "owner_approved"],
    rowTeamValidationStatuses: ["approved", "pending_team_review"],
    downstreamPolicy: {
      may_update_sprint_backlog: false,
      may_export_to_jira: true,
      requires_team_approval_record: false,
      jira_export_authority: "process_owner_and_product_owner",
      jira_export_decision_id: "UDW-DEC-019",
    },
  });
  assert.ok(problems.some((problem) => problem.includes("all workbook rows")));
});

test("team_approved Jira export without owner authority is rejected", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "team_approved",
    teamValidationStatus: "approved",
    rowApprovalStatuses: ["team_approved"],
    rowTeamValidationStatuses: ["approved"],
    downstreamPolicy: {
      may_update_sprint_backlog: false,
      may_export_to_jira: true,
      requires_team_approval_record: false,
    },
  });
  assert.ok(problems.some((problem) => problem.includes("jira_export_authority")));
});

test("blocked workbook cannot enter the owner-authorized Jira export branch", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "blocked",
    teamValidationStatus: "blocked",
    rowApprovalStatuses: ["owner_approved"],
    rowTeamValidationStatuses: ["approved"],
    downstreamPolicy: {
      may_update_sprint_backlog: false,
      may_export_to_jira: true,
      requires_team_approval_record: false,
      jira_export_authority: "process_owner_and_product_owner",
      jira_export_decision_id: "UDW-DEC-019",
    },
  });
  assert.ok(problems.some((problem) => problem.includes("approval_status=owner_approved")));
});

test("draft_unapproved row cannot enter the owner-authorized Jira export branch", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "owner_approved",
    teamValidationStatus: "approved",
    rowApprovalStatuses: ["draft_unapproved"],
    rowTeamValidationStatuses: ["approved"],
    downstreamPolicy: {
      may_update_sprint_backlog: false,
      may_export_to_jira: true,
      requires_team_approval_record: false,
      jira_export_authority: "process_owner_and_product_owner",
      jira_export_decision_id: "UDW-DEC-019",
    },
  });
  assert.ok(problems.some((problem) => problem.includes("all row approval statuses")));
});

test("pending team review blocks sprint and Jira use", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "owner_approved",
    teamValidationStatus: "pending_team_review",
    rowTeamValidationStatuses: ["pending_team_review", "approved"],
    downstreamPolicy: {
      may_update_sprint_backlog: true,
      may_export_to_jira: true,
      requires_team_approval_record: false,
    },
  });
  assert.ok(problems.some((problem) => problem.includes("team_validation_status=approved")));
  assert.ok(problems.some((problem) => problem.includes("jira_export_authority")));
  assert.ok(problems.some((problem) => problem.includes("pending team validation must block Jira export")));
  assert.ok(problems.some((problem) => problem.includes("sprint backlog")));
});

test("pending estimates require team-review backlog status", () => {
  const problems = planningReadinessProblems({
    teamValidationStatus: "pending_team_review",
    backlogStatuses: { "PBI-007": "ready", "PBI-008": "ready_for_team_review" },
  });
  assert.deepEqual(problems, ["PBI-007 must be ready_for_team_review while team validation is pending"]);
});

test("pending estimates cannot be exposed as sprint or Jira input", () => {
  const problems = pendingTeamDownstreamUseProblems({
    teamValidationStatus: "pending_team_review",
    downstreamUse: ["team_estimation_review", "sprint_planning_input", "jira_import_preparation"],
  });
  assert.deepEqual(problems, [
    "pending team validation forbids downstream use: sprint_planning_input",
    "pending team validation forbids downstream use: jira_import_preparation",
  ]);
});

test("owner-authorized source registry forbids sprint planning use", () => {
  const problems = pendingTeamDownstreamUseProblems({
    teamValidationStatus: "approved",
    downstreamUse: ["jira_resource_estimate_export", "sprint_planning_input"],
    downstreamPolicy: {
      may_export_to_jira: true,
    },
  });
  assert.deepEqual(problems, [
    "owner-authorized Jira export forbids downstream use: sprint_planning_input",
  ]);
});

test("owner-authorized recovery index forbids sprint planning use", () => {
  const problems = pendingTeamDownstreamUseProblems({
    teamValidationStatus: "approved",
    downstreamUse: ["jira_resource_estimate_export", "sprint_planning_input"],
    downstreamPolicy: {
      may_export_to_jira: true,
    },
  });
  assert.deepEqual(problems, [
    "owner-authorized Jira export forbids downstream use: sprint_planning_input",
  ]);
});

test("owner-authorized Jira resource estimate use remains permitted", () => {
  const problems = pendingTeamDownstreamUseProblems({
    teamValidationStatus: "approved",
    downstreamUse: ["jira_resource_estimate_export"],
    downstreamPolicy: {
      may_export_to_jira: true,
    },
  });
  assert.deepEqual(problems, []);
});

test("owner-authorized downstream list declares Jira resource estimate export", () => {
  const problems = pendingTeamDownstreamUseProblems({
    teamValidationStatus: "approved",
    downstreamUse: ["team_refinement_input"],
    downstreamPolicy: {
      may_export_to_jira: true,
    },
  });
  assert.deepEqual(problems, [
    "owner-authorized Jira export requires downstream use: jira_resource_estimate_export",
  ]);
});

test("historical Vision cannot act as a current traceability source", () => {
  const problems = traceabilityVisionAuthorityProblems({
    links: [{ source: "docs/product/vision/vision-v0.1.md" }],
    currentVisionPath: "docs/product-vision.md",
    historicalVisionPath: "docs/product/vision/vision-v0.1.md",
  });
  assert.equal(problems.length, 2);
});

test("accepted BMC content is distinct from visual package acceptance", () => {
  assert.deepEqual(bmcAcceptanceStatusProblems({
    decisionStatus: "accepted",
    sourceLifecycle: "accepted",
    consistencyStatus: "ok",
    packageStatus: "ready_for_user_acceptance",
  }), []);

  const staleProblems = bmcAcceptanceStatusProblems({
    decisionStatus: "accepted",
    sourceLifecycle: "accepted",
    consistencyStatus: "needs-owner-decision",
    packageStatus: "ready_for_user_acceptance",
  });
  assert.deepEqual(staleProblems, ["accepted BMC content must have consistency status ok"]);
});

test("owner acceptance cannot be recorded as team estimation acceptance", () => {
  const problems = decisionApprovalConsistencyProblems({
    queueDecisionType: "team_estimation_acceptance",
    ledgerDecisionType: "team_estimation_acceptance",
    acceptanceType: "owner_decision_acceptance",
    ownerRole: "Product Owner",
    teamValidationStatus: "pending_team_review",
  });
  assert.ok(problems.some((problem) => problem.includes("owner_decision_acceptance")));
});

test("roadmap cannot promise a quarter while team validation is pending", () => {
  const problems = roadmapTimingProblems({
    roadmapText: "Основной маршрут: 2026-Q3, приоритет P1.",
    teamValidationStatus: "pending_team_review",
  });
  assert.deepEqual(problems, ["roadmap timing 2026-Q3 requires completed team validation"]);
});

test("human owner queue must reflect an accepted machine decision", () => {
  assert.deepEqual(ownerDecisionStatusProblems({
    decisionId: "UDW-DEC-009",
    machineStatus: "accepted",
    humanStatus: "pending",
  }), ["UDW-DEC-009 human status pending differs from machine status accepted"]);
});

test("sprint candidate plan cannot claim that no PBI exist after they were created", () => {
  const problems = sprintCandidatePlanProblems({
    planText: "- Не создаются новые `PBI-*` — элементы продуктового бэклога.",
    existingCandidatePbiIds: ["PBI-007", "PBI-008"],
  });
  assert.equal(problems.length, 1);
});

test("deferred BA work cannot appear accepted and nonblocking in the machine queue", () => {
  const problems = openDecisionConsistencyProblems({
    decisionId: "UDW-DEC-005",
    queueStatus: "accepted",
    queueBlocking: false,
    ledgerStatus: "deferred",
    humanStatus: "pending",
  });
  assert.equal(problems.length, 2);
});

test("accepted BMC segment decision cannot retain stale not-applied wording", () => {
  const problems = acceptedBmcSegmentDecisionProblems({
    decisionStatus: "accepted",
    sourceMapText: "BAQ-001.2 должен подтвердить пользовательские сегменты BMC.",
    validationEvidenceText: "Ответ намеренно не применен к продуктовым документам.",
    sprintPlanText: "Закрыть оставшиеся вопросы BMC-интервью после BAQ-001.2.",
  });
  assert.equal(problems.length, 3);
});

test("accepted BMC segment decision rejects the historical awaiting-package wording", () => {
  const problems = acceptedBmcSegmentDecisionProblems({
    decisionStatus: "accepted",
    sourceMapText: "",
    validationEvidenceText: "Это изменение не применяет ответ 1 по BAQ-001.2; ответ ожидает пакетного применения.",
    sprintPlanText: "",
  });
  assert.equal(problems.length, 1);
});

test("pending team estimation rejects calendar promises in story slice exports", () => {
  const problems = storySlicePlanningProblems({
    markdownText: "| DC-ST-23 | P1 | 2026-Q3 | принято Product Owner |",
    csvText: '\"DC-ST-23\",\"P1\",\"2026-Q3\",\"принято Product Owner\"',
    teamValidationStatus: "pending_team_review",
  });
  assert.equal(problems.length, 2);
});
