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

function traverse(startPaths, edgesByPath, nextForEdge) {
  const visited = new Set(startPaths);
  const queue = [...startPaths];
  const routes = [];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const edge of edgesByPath.get(current) ?? []) {
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

export function analyzeSemanticCascade(graph, changedSources) {
  const index = buildIndex(graph);
  const changedPaths = changedSources.map((source) => source.path);
  for (const changedPath of changedPaths) {
    if (!index.artifacts.has(changedPath)) throw new Error(`uncovered changed path: ${changedPath}`);
  }

  const upstream = traverse(changedPaths, index.inbound, (edge) => edge.upstream_artifact);
  const diagnostic = traverse([...upstream.visited], index.outbound, (edge) => edge.downstream_artifact);
  const authoritativeChanged = changedPaths.filter(
    (candidate) => (index.artifacts.get(candidate).authority_scope ?? []).length > 0,
  );
  const authoritativeReviewPaths = [...upstream.visited]
    .filter((candidate) => !changedPaths.includes(candidate))
    .filter((candidate) => (index.artifacts.get(candidate)?.authority_scope ?? []).length > 0);
  const downstream = traverse(authoritativeChanged, index.outbound, (edge) => edge.downstream_artifact);
  const writeObligations = [...downstream.visited].filter((candidate) => !authoritativeChanged.includes(candidate));
  const diagnosticClosure = sorted([...upstream.visited, ...diagnostic.visited]);
  const classified = diagnosticClosure.map((candidate) => ({
    path: candidate,
    classification: writeObligations.includes(candidate)
      ? "obligated"
      : authoritativeReviewPaths.includes(candidate)
        ? "owner_stop"
        : changedPaths.includes(candidate)
          ? "changed_source"
          : "diagnostic_only",
  }));

  return {
    version: "1.0.0",
    changed_sources: changedSources,
    authoritative_review_paths: sorted(authoritativeReviewPaths),
    write_obligations: sorted(writeObligations),
    diagnostic_closure: diagnosticClosure,
    diagnostic_classifications: classified,
    route_evidence: [...upstream.routes, ...downstream.routes].map((route) => ({
      from: route.from,
      to: route.to,
      edge_id: route.edge.edge_id ?? null,
      relation_type: route.edge.relation_type,
      validation_command: route.edge.validation_command,
    })),
  };
}
