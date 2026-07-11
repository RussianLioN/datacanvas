function sorted(values) {
  return [...new Set(values)].sort();
}

function buildIndex(graph) {
  const artifacts = new Map((graph.artifacts ?? []).map((artifact) => [artifact.path, artifact]));
  const inbound = new Map();
  const outbound = new Map();
  for (const edge of graph.dependencies ?? []) {
    inbound.set(edge.downstream_artifact, [...(inbound.get(edge.downstream_artifact) ?? []), edge]);
    outbound.set(edge.upstream_artifact, [...(outbound.get(edge.upstream_artifact) ?? []), edge]);
  }
  return { artifacts, inbound, outbound };
}

function edgeApplies(edge, changeClasses) {
  const declared = edge.applicable_change_classes ?? ["*"];
  return declared.includes("*") || declared.some((candidate) => changeClasses.includes(candidate));
}

function traverse(startPaths, edgesByPath, nextForEdge, changeClasses, predicate = () => true) {
  const visited = new Set(startPaths);
  const queue = [...startPaths];
  const routes = [];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const edge of edgesByPath.get(current) ?? []) {
      if (!edgeApplies(edge, changeClasses) || !predicate(edge)) continue;
      const next = nextForEdge(edge);
      routes.push({ from: current, to: next, edge });
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return { visited, routes };
}

function authorityMatches(artifact, changeClasses) {
  const scopes = artifact.authority_scope ?? [];
  if (scopes.length === 0 || changeClasses.includes("no_change")) return false;
  if (changeClasses.includes("mixed_or_ambiguous")) return true;
  if (scopes.includes("source_data")) return true;
  const expanded = new Set(changeClasses);
  if (expanded.has("estimate_change")) expanded.add("effort_estimate");
  if (expanded.has("row_add_remove")) {
    expanded.add("scope_change");
    expanded.add("story_text_change");
  }
  if (expanded.has("provenance_only")) {
    expanded.add("provenance");
    expanded.add("source_identity");
  }
  return scopes.some((scope) => expanded.has(scope));
}

const mechanicalRelations = new Set([
  "generated",
  "navigation",
  "process",
  "registry_consistency",
  "source_provenance",
  "xlsx_recovery",
]);

export function analyzeSemanticCascade(graph, changedSources) {
  const index = buildIndex(graph);
  const changedPaths = changedSources.map((source) => source.path);
  const changeClasses = sorted(changedSources.flatMap((source) => source.change_classes ?? []));
  for (const changedPath of changedPaths) {
    if (!index.artifacts.has(changedPath)) throw new Error(`uncovered changed path: ${changedPath}`);
  }

  const ownerSensitive = changeClasses.some((candidate) => ![
    "documentation",
    "formatting_only",
    "formula_cache_only",
    "no_change",
    "provenance_only",
  ].includes(candidate));
  const upstream = traverse(ownerSensitive ? changedPaths : [], index.inbound, (edge) => edge.upstream_artifact, changeClasses);
  const diagnosticStart = sorted([...changedPaths, ...upstream.visited]);
  const diagnostic = traverse(diagnosticStart, index.outbound, (edge) => edge.downstream_artifact, changeClasses);
  const authoritativeChanged = changedSources
    .filter((source) => authorityMatches(index.artifacts.get(source.path), source.change_classes ?? []))
    .map((source) => source.path);
  const authoritativeReviewPaths = [...upstream.visited]
    .filter((candidate) => !changedPaths.includes(candidate))
    .filter((candidate) => (index.artifacts.get(candidate)?.authority_scope ?? []).length > 0);
  const downstream = traverse(authoritativeChanged, index.outbound, (edge) => edge.downstream_artifact, changeClasses);
  const mechanical = traverse(
    changedPaths,
    index.outbound,
    (edge) => edge.downstream_artifact,
    changeClasses,
    (edge) => mechanicalRelations.has(edge.relation_type),
  );
  const writeObligations = sorted([...downstream.visited, ...mechanical.visited])
    .filter((candidate) => !changedPaths.includes(candidate));
  const diagnosticClosure = sorted([...changedPaths, ...upstream.visited, ...diagnostic.visited]);
  const classified = diagnosticClosure.map((candidate) => ({
    path: candidate,
    classification: authoritativeReviewPaths.includes(candidate)
      ? "owner_stop"
      : writeObligations.includes(candidate)
        ? "obligated"
        : changedPaths.includes(candidate)
          ? "changed_source"
          : "diagnostic_only",
  }));

  return {
    $schema: "https://datacanvas.local/schemas/v1/cascade-semantic-impact-report.schema.json",
    version: "1.0.0",
    changed_sources: changedSources,
    authoritative_review_paths: sorted(authoritativeReviewPaths),
    write_obligations: sorted(writeObligations),
    diagnostic_closure: diagnosticClosure,
    diagnostic_classifications: classified,
    route_evidence: [...upstream.routes, ...downstream.routes, ...mechanical.routes].map((route) => ({
      from: route.from,
      to: route.to,
      edge_id: route.edge.edge_id ?? null,
      relation_type: route.edge.relation_type,
      validation_command: route.edge.validation_command,
      change_classes: changeClasses,
    })),
  };
}
