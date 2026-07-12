export function approvalConsistencyProblems({
  approvalStatus,
  teamValidationStatus,
  rowTeamValidationStatuses = [],
  downstreamPolicy = null,
}) {
  const problems = [];

  if (teamValidationStatus === "approved" && approvalStatus !== "team_approved") {
    problems.push("team approval requires approval_status=team_approved");
  }
  if (approvalStatus === "team_approved" && teamValidationStatus !== "approved") {
    problems.push("approval_status=team_approved requires approved team validation");
  }

  if (teamValidationStatus === "pending_team_review") {
    if (rowTeamValidationStatuses.some((status) => status !== "pending_team_review")) {
      problems.push("all workbook rows must remain pending while team validation is pending");
    }
    if (downstreamPolicy) {
      if (downstreamPolicy.may_update_sprint_backlog !== false) {
        problems.push("pending team validation must block sprint backlog updates");
      }
      if (downstreamPolicy.may_export_to_jira !== false) {
        problems.push("pending team validation must block Jira export");
      }
      if (downstreamPolicy.requires_team_approval_record !== true) {
        problems.push("pending team validation must require a team approval record");
      }
    }
  }

  return problems;
}

export function planningReadinessProblems({ teamValidationStatus, backlogStatuses }) {
  if (teamValidationStatus !== "pending_team_review") {
    return [];
  }

  const problems = [];
  for (const [itemId, status] of Object.entries(backlogStatuses)) {
    if (status !== "ready_for_team_review") {
      problems.push(`${itemId} must be ready_for_team_review while team validation is pending`);
    }
  }
  return problems;
}

export function pendingTeamDownstreamUseProblems({ teamValidationStatus, downstreamUse }) {
  if (teamValidationStatus !== "pending_team_review") {
    return [];
  }

  const forbiddenUses = new Set([
    "accepted_effort_estimation",
    "sprint_planning_input",
    "jira_import_preparation",
    "opml_export_preparation",
  ]);
  return downstreamUse
    .filter((use) => forbiddenUses.has(use))
    .map((use) => `pending team validation forbids downstream use: ${use}`);
}

export function traceabilityVisionAuthorityProblems({
  links,
  currentVisionPath,
  historicalVisionPath,
}) {
  const sourcePaths = links.flatMap((link) => [link.source, ...(link.sources ?? [])]);
  const problems = [];

  if (sourcePaths.includes(historicalVisionPath)) {
    problems.push("historical Vision must not be used as a current traceability authority");
  }
  if (!sourcePaths.includes(currentVisionPath)) {
    problems.push("traceability must reference the current Vision");
  }

  return problems;
}

export function bmcAcceptanceStatusProblems({
  decisionStatus,
  sourceLifecycle,
  consistencyStatus,
  packageStatus,
}) {
  const problems = [];
  if (decisionStatus === "accepted" && sourceLifecycle === "accepted" && consistencyStatus !== "ok") {
    problems.push("accepted BMC content must have consistency status ok");
  }
  if (packageStatus !== "ready_for_user_acceptance") {
    problems.push("generated BMC package must remain ready for separate visual acceptance");
  }
  return problems;
}

export function decisionApprovalConsistencyProblems({
  queueDecisionType,
  ledgerDecisionType,
  acceptanceType,
  ownerRole,
  teamValidationStatus,
}) {
  const problems = [];
  if (queueDecisionType !== ledgerDecisionType) {
    problems.push("decision queue and ledger must use the same decision type");
  }
  if (ownerRole === "Product Owner" && acceptanceType === "owner_decision_acceptance") {
    if (queueDecisionType !== "owner_decision_acceptance" || ledgerDecisionType !== "owner_decision_acceptance") {
      problems.push("Product Owner acceptance must be recorded as owner_decision_acceptance");
    }
  }
  if (
    teamValidationStatus === "pending_team_review" &&
    [queueDecisionType, ledgerDecisionType].includes("team_estimation_acceptance")
  ) {
    problems.push("pending team review cannot be recorded as team_estimation_acceptance");
  }
  return problems;
}

export function roadmapTimingProblems({ roadmapText, teamValidationStatus }) {
  if (teamValidationStatus !== "pending_team_review") {
    return [];
  }
  const periods = [...new Set(roadmapText.match(/\b20\d{2}-Q[1-4]\b/g) ?? [])];
  return periods.map((period) => `roadmap timing ${period} requires completed team validation`);
}

export function ownerDecisionStatusProblems({ decisionId, machineStatus, humanStatus }) {
  if (machineStatus === humanStatus) {
    return [];
  }
  return [`${decisionId} human status ${humanStatus} differs from machine status ${machineStatus}`];
}

export function sprintCandidatePlanProblems({ planText, existingCandidatePbiIds }) {
  if (existingCandidatePbiIds.length === 0 || !/Не создаются новые\s+`?PBI/iu.test(planText)) {
    return [];
  }
  return ["sprint candidate plan uses an obsolete no-new-PBI statement after candidate PBI creation"];
}

export function openDecisionConsistencyProblems({
  decisionId,
  queueStatus,
  queueBlocking,
  ledgerStatus,
  humanStatus,
}) {
  const problems = [];
  const executionOpen = ledgerStatus === "deferred" || ["pending", "deferred"].includes(humanStatus);
  if (!executionOpen) {
    return problems;
  }
  if (!["pending", "deferred"].includes(queueStatus)) {
    problems.push(`${decisionId} open execution cannot have queue status ${queueStatus}`);
  }
  if (queueBlocking !== true) {
    problems.push(`${decisionId} open execution must remain blocking`);
  }
  return problems;
}

export function acceptedBmcSegmentDecisionProblems({
  decisionStatus,
  sourceMapText,
  validationEvidenceText,
  sprintPlanText,
}) {
  if (decisionStatus !== "accepted") {
    return [];
  }
  const problems = [];
  if (/BAQ-001\.2[^\n]*должен подтвердить/iu.test(sourceMapText)) {
    problems.push("accepted BMC segment decision remains unconfirmed in source map");
  }
  if (
    /намеренно не применен/iu.test(validationEvidenceText)
    || /не применяет[^\n]*BAQ-001\.2/iu.test(validationEvidenceText)
    || /BAQ-001\.2[^\n]*ожида\w* пакетн/iu.test(validationEvidenceText)
  ) {
    problems.push("accepted BMC segment decision remains unapplied in validation evidence");
  }
  if (/оставшиеся вопросы BMC-интервью[^\n]*BAQ-001\.2/iu.test(sprintPlanText)) {
    problems.push("accepted BMC segment decision remains open in sprint candidate plan");
  }
  return problems;
}

export function storySlicePlanningProblems({ markdownText, csvText, teamValidationStatus }) {
  if (teamValidationStatus !== "pending_team_review") return [];
  const problems = [];
  if (/\b20\d{2}-Q[1-4]\b/u.test(markdownText)) {
    problems.push("story slice cannot promise a calendar quarter before team estimation");
  }
  if (/\b20\d{2}-Q[1-4]\b/u.test(csvText)) {
    problems.push("story slice CSV cannot promise a calendar quarter before team estimation");
  }
  return problems;
}
