export function buildCascadeOwnerDecisions({
  suffix,
  changeRequest,
  changeRequestPath,
  targetArtifact,
  targetInGraph,
  sourceRequiresTeamApproval,
  sourceRequiresDownstreamResolution,
  impactCone,
  graphIndex,
  affectedArtifacts,
  requestedAt,
}) {
  const targetOwnerRole = graphIndex.artifactsByPath.get(targetArtifact)?.owner_role;
  const decisionDrafts = [];
  const decisionAffectedArtifacts = affectedArtifacts.length > 0 ? affectedArtifacts : [targetArtifact];

  if (!targetInGraph) {
    decisionDrafts.push({
      kind: "GRAPH-TARGET-MISSING",
      owner_role: "Process Owner / Documentation Owner",
      question: "Добавить целевой артефакт в граф зависимостей до каскадного обновления?",
      affected_artifacts: [targetArtifact],
      option_id: "OPT-REGISTER-TARGET",
      option_label: "Зарегистрировать артефакт",
      option_consequence: "Следующий сухой запуск сможет рассчитать полный конус влияния по графу.",
    });
  }
  if (sourceRequiresTeamApproval) {
    decisionDrafts.push({
      kind: "XLSX-TEAM-APPROVAL",
      owner_role: "Implementation Team",
      question: "Подтвердить командную оценку XLSX перед переносом ПШЕ в sprint backlog или Jira import?",
      affected_artifacts: decisionAffectedArtifacts,
      option_id: "OPT-TEAM-APPROVED",
      option_label: "Оценка команды подтверждена",
      option_consequence: "Sprint backlog и Jira смогут использовать ПШЕ после закрытия полного каскадного влияния.",
    });
  }
  if (sourceRequiresDownstreamResolution) {
    decisionDrafts.push({
      kind: "XLSX-DOWNSTREAM-RESOLUTION",
      owner_role: targetOwnerRole ?? "Product Owner / Documentation Owner",
      question: "Закрыть полный конус влияния XLSX изменениями или no-change rationale перед завершением?",
      affected_artifacts: decisionAffectedArtifacts,
      option_id: "OPT-RESOLVE-DOWNSTREAM",
      option_label: "Закрыть конус влияния",
      option_consequence: "Каждый затронутый артефакт нужно обновить или закрыть no-change rationale в impact analysis.",
    });
  }

  const semanticArtifactsByOwner = new Map();
  function addSemanticOwnerArtifact(ownerRole, artifactPath) {
    const normalizedOwnerRole = ownerRole ?? "Process Owner / Documentation Owner";
    const paths = semanticArtifactsByOwner.get(normalizedOwnerRole) ?? new Set();
    paths.add(artifactPath);
    semanticArtifactsByOwner.set(normalizedOwnerRole, paths);
  }
  if (changeRequest.semantic_change && targetInGraph) {
    addSemanticOwnerArtifact(targetOwnerRole, targetArtifact);
  }
  for (const artifact of impactCone.impacted_artifacts.filter((item) => item.owner_gate_required)) {
    addSemanticOwnerArtifact(graphIndex.artifactsByPath.get(artifact.path)?.owner_role, artifact.path);
  }
  for (const [ownerRole, artifactPaths] of [...semanticArtifactsByOwner].sort(([left], [right]) => left.localeCompare(right))) {
    const ownerCode = ownerRole.toUpperCase().replace(/[^A-Z0-9]+/gu, "-").replace(/^-|-$/gu, "") || "OWNER";
    decisionDrafts.push({
      kind: `SEMANTIC-${ownerCode}`,
      owner_role: ownerRole,
      question: `Подтвердить смысловые правки в области ответственности ${ownerRole} до каскадного обновления документации?`,
      affected_artifacts: [...artifactPaths].sort(),
      option_id: "OPT-CONFIRM-EDITS",
      option_label: "Подтвердить правки",
      option_consequence: "Подтвержденные смысловые правки можно будет применить отдельным шагом реализации.",
    });
  }

  const decisions = decisionDrafts.map((draft, index) => ({
    decision_id: `DEC-${suffix}-${String(index + 1).padStart(2, "0")}-${draft.kind}`,
    owner_role: draft.owner_role,
    question: draft.question,
    affected_artifacts: draft.affected_artifacts,
    options: [
      {
        option_id: draft.option_id,
        label: draft.option_label,
        consequence: draft.option_consequence,
        recommended: false,
      },
      {
        option_id: "OPT-DEFER",
        label: "Отложить правки",
        consequence: "Каскадный запуск остается заблокированным, смысловые правки не применяются.",
        recommended: true,
      },
    ],
    recommended_option_id: "OPT-DEFER",
    recommendation_rationale: "Runner не может сам принять смысловое решение, командное подтверждение или решение о границах графа.",
    status: "pending",
    blocking: true,
    requested_at: requestedAt,
    resolved_at: null,
    selected_option_id: null,
    source: changeRequestPath,
  }));
  const decisionIdByArtifact = new Map();
  for (const decision of decisions) {
    for (const artifactPath of decision.affected_artifacts) {
      if (!decisionIdByArtifact.has(artifactPath)) {
        decisionIdByArtifact.set(artifactPath, decision.decision_id);
      }
    }
  }
  return { decisions, decisionIdByArtifact };
}

export function immutableOwnerDecisionShape(decision) {
  const {
    status: ignoredStatus,
    resolved_at: ignoredResolvedAt,
    selected_option_id: ignoredSelectedOptionId,
    ...immutable
  } = decision;
  void ignoredStatus;
  void ignoredResolvedAt;
  void ignoredSelectedOptionId;
  return immutable;
}
