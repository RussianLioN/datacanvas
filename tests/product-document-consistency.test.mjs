import assert from "node:assert/strict";
import test from "node:test";

import {
  approvalConsistencyProblems,
  bmcAcceptanceStatusProblems,
  pendingTeamDownstreamUseProblems,
  planningReadinessProblems,
  traceabilityVisionAuthorityProblems,
} from "../scripts/lib/product-document-consistency.mjs";

test("owner approval cannot be presented as team approval", () => {
  const problems = approvalConsistencyProblems({
    approvalStatus: "owner_approved",
    teamValidationStatus: "approved",
  });
  assert.ok(problems.some((problem) => problem.includes("team_approved")));
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
  assert.equal(problems.length, 4);
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
