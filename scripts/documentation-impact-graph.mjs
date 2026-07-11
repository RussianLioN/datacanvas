import path from "node:path";

const repoProtocolPattern = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//u;

export function normalizeRepoPath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    /^[A-Za-z]:[\\/]/u.test(value) ||
    repoProtocolPattern.test(value) ||
    value.includes("\\")
  ) {
    throw new Error(`unsafe repo path: ${value}`);
  }
  const normalized = path.posix.normalize(value);
  if (normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`unsafe repo path: ${value}`);
  }
  return normalized;
}

function sortedEntries(map) {
  for (const values of map.values()) {
    values.sort((left, right) => {
      const leftKey = `${left.upstream_artifact}\u0000${left.downstream_artifact}`;
      const rightKey = `${right.upstream_artifact}\u0000${right.downstream_artifact}`;
      return leftKey.localeCompare(rightKey);
    });
  }
  return map;
}

function stronglyConnectedComponents(paths, outboundByPath) {
  let nextIndex = 0;
  const stack = [];
  const onStack = new Set();
  const indexes = new Map();
  const lowLinks = new Map();
  const components = [];

  function visit(current) {
    indexes.set(current, nextIndex);
    lowLinks.set(current, nextIndex);
    nextIndex += 1;
    stack.push(current);
    onStack.add(current);

    for (const edge of outboundByPath.get(current) ?? []) {
      const next = edge.downstream_artifact;
      if (!indexes.has(next)) {
        visit(next);
        lowLinks.set(current, Math.min(lowLinks.get(current), lowLinks.get(next)));
      } else if (onStack.has(next)) {
        lowLinks.set(current, Math.min(lowLinks.get(current), indexes.get(next)));
      }
    }

    if (lowLinks.get(current) !== indexes.get(current)) {
      return;
    }

    const component = [];
    let member;
    do {
      member = stack.pop();
      onStack.delete(member);
      component.push(member);
    } while (member !== current);
    components.push(component.sort());
  }

  for (const artifactPath of [...paths].sort()) {
    if (!indexes.has(artifactPath)) {
      visit(artifactPath);
    }
  }
  return components.sort((left, right) => left[0].localeCompare(right[0]));
}

export function buildDependencyIndex(graph) {
  if (!graph || !Array.isArray(graph.artifacts) || !Array.isArray(graph.dependencies)) {
    throw new Error("dependency graph must contain artifacts and dependencies arrays");
  }

  const artifactsByPath = new Map();
  const outboundByPath = new Map();
  const inboundByPath = new Map();
  for (const artifact of graph.artifacts) {
    const artifactPath = normalizeRepoPath(artifact.path);
    if (artifactsByPath.has(artifactPath)) {
      throw new Error(`duplicate graph artifact path: ${artifactPath}`);
    }
    artifactsByPath.set(artifactPath, artifact);
    outboundByPath.set(artifactPath, []);
    inboundByPath.set(artifactPath, []);
  }

  const edgeKeys = new Set();
  for (const dependency of graph.dependencies) {
    const upstream = normalizeRepoPath(dependency.upstream_artifact);
    const downstream = normalizeRepoPath(dependency.downstream_artifact);
    if (!artifactsByPath.has(upstream) || !artifactsByPath.has(downstream)) {
      throw new Error(`dependency edge references undeclared artifact: ${upstream} -> ${downstream}`);
    }
    const edgeKey = `${upstream}\u0000${downstream}\u0000${dependency.relation_type}`;
    if (edgeKeys.has(edgeKey)) {
      throw new Error(`duplicate dependency edge: ${upstream} -> ${downstream}/${dependency.relation_type}`);
    }
    edgeKeys.add(edgeKey);
    outboundByPath.get(upstream).push(dependency);
    inboundByPath.get(downstream).push(dependency);
  }

  sortedEntries(outboundByPath);
  sortedEntries(inboundByPath);
  return {
    artifactsByPath,
    outboundByPath,
    inboundByPath,
    components: stronglyConnectedComponents(artifactsByPath.keys(), outboundByPath),
    declaredCycleGroups: graph.declared_cycle_groups ?? [],
  };
}

function sameMembers(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export function validateDeclaredCycles(index, declaredCycleGroups = index.declaredCycleGroups) {
  for (const [artifactPath, edges] of index.outboundByPath) {
    if (edges.some((edge) => edge.downstream_artifact === artifactPath)) {
      throw new Error(`dependency graph contains a forbidden self-loop: ${artifactPath}`);
    }
  }

  const declaredByMembers = new Map();
  const declaredIds = new Set();
  for (const group of declaredCycleGroups) {
    if (declaredIds.has(group.cycle_id)) {
      throw new Error(`duplicate declared cycle id: ${group.cycle_id}`);
    }
    declaredIds.add(group.cycle_id);
    const members = group.member_paths.map(normalizeRepoPath).sort();
    const key = members.join("\u0000");
    if (declaredByMembers.has(key)) {
      throw new Error(`duplicate declared dependency cycle: ${members.join(", ")}`);
    }
    declaredByMembers.set(key, { ...group, member_paths: members });
  }

  const observedCycleIds = [];
  for (const component of index.components.filter((members) => members.length > 1)) {
    const declaration = declaredByMembers.get(component.join("\u0000"));
    if (!declaration) {
      throw new Error(`undeclared dependency cycle: ${component.join(", ")}`);
    }
    observedCycleIds.push(declaration.cycle_id);
  }

  const observedComponents = index.components.filter((members) => members.length > 1);
  for (const declaration of declaredByMembers.values()) {
    if (!observedComponents.some((component) => sameMembers(component, declaration.member_paths))) {
      throw new Error(`declared dependency cycle is not observed: ${declaration.cycle_id}`);
    }
  }

  return { observed_cycle_ids: observedCycleIds.sort() };
}

export function buildGeneratedOutputLookup(generatorContracts) {
  const exactOutputs = new Map();
  const rootedOutputs = [];
  for (const contract of generatorContracts.contracts ?? []) {
    for (const output of contract.outputs ?? []) {
      exactOutputs.set(normalizeRepoPath(output), contract);
    }
    for (const outputRoot of contract.output_roots ?? []) {
      rootedOutputs.push({ root: normalizeRepoPath(outputRoot), contract });
    }
  }
  rootedOutputs.sort((left, right) => right.root.length - left.root.length || left.root.localeCompare(right.root));

  function get(candidatePath) {
    const normalized = normalizeRepoPath(candidatePath);
    const exact = exactOutputs.get(normalized);
    if (exact) {
      return exact;
    }
    return rootedOutputs.find(({ root }) => normalized.startsWith(`${root}/`))?.contract;
  }

  return {
    get,
    has: (candidatePath) => Boolean(get(candidatePath)),
    keys: () => exactOutputs.keys(),
  };
}

export function ownerConfirmationRequired(policy, changeClass) {
  if (policy === "always") return true;
  if (policy === "never") return false;
  if (policy === "semantic_change") {
    return [
      "business_meaning",
      "semantic_product_change",
      "process_structure_change",
      "process_rule",
      "architecture_contract",
      "security_boundary",
      "mixed_or_ambiguous",
    ].includes(changeClass);
  }
  if (policy === "when_capacity_or_priority_changes") {
    return ["estimate_evidence", "resource", "priority_change", "mixed_or_ambiguous"].includes(changeClass);
  }
  if (policy === "when_jira_mapping_changes") {
    return ["jira_mapping", "mixed_or_ambiguous"].includes(changeClass);
  }
  return false;
}

export function sourceChangeClassesForPath(relativePath) {
  const normalized = normalizeRepoPath(relativePath);
  if (normalized.endsWith(".provenance.json")) {
    return ["source_provenance_change", "provenance_only"];
  }
  if (normalized.endsWith("product-source-registry.json")) {
    return ["registry_consistency_change"];
  }
  if (normalized.endsWith("xlsx-opml-jira-recovery-index.json")) {
    return ["source_provenance_change"];
  }
  if (normalized.endsWith(".xlsx")) {
    return ["estimate_evidence"];
  }
  return ["mixed_or_ambiguous"];
}

export function changedSourceSetFromProductSourceRegistry(sourceRegistry, sourceId) {
  const source = sourceRegistry.sources?.find((candidate) => candidate.source_id === sourceId);
  if (!source) {
    throw new Error(`unknown product source id: ${sourceId}`);
  }
  const paths = [source.path, source.provenance_manifest].filter(Boolean).map(normalizeRepoPath);
  return {
    source,
    changed_source_set: paths.map((sourcePath) => ({
      path: sourcePath,
      change_class: sourceChangeClassesForPath(sourcePath)[0],
    })),
  };
}

function traverse(index, sourcePath, direction, collect) {
  const queue = [sourcePath];
  const visited = new Set([sourcePath]);
  while (queue.length > 0) {
    const current = queue.shift();
    const edges = direction === "downstream" ? index.outboundByPath.get(current) : index.inboundByPath.get(current);
    for (const edge of edges ?? []) {
      const next = direction === "downstream" ? edge.downstream_artifact : edge.upstream_artifact;
      collect(next, edge, direction);
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
}

export function analyzeImpactCone(index, changedSourceSet) {
  const normalizedSources = [...new Map(changedSourceSet.map((source) => {
    const sourcePath = normalizeRepoPath(source.path);
    return [sourcePath, { path: sourcePath, change_class: source.change_class }];
  })).values()].sort((left, right) => left.path.localeCompare(right.path));
  const changedPaths = new Set(normalizedSources.map((source) => source.path));
  const uncoveredChangedPaths = normalizedSources
    .filter((source) => !index.artifactsByPath.has(source.path))
    .map((source) => source.path);
  const impacts = new Map();

  function collectFor(source) {
    return (targetPath, edge, direction) => {
      if (changedPaths.has(targetPath)) {
        return;
      }
      const current = impacts.get(targetPath) ?? {
        path: targetPath,
        directions: new Set(),
        triggers: new Set(),
        ownerGateRequired: false,
        resolutionRequired: false,
      };
      current.directions.add(direction);
      current.triggers.add(source.path);
      current.ownerGateRequired ||= ownerConfirmationRequired(edge.user_confirmation_required, source.change_class);
      current.resolutionRequired ||= edge.resolution_required === "changed_or_no_change_rationale";
      impacts.set(targetPath, current);
    };
  }

  for (const source of normalizedSources) {
    if (!index.artifactsByPath.has(source.path)) {
      continue;
    }
    const collect = collectFor(source);
    traverse(index, source.path, "downstream", collect);
    traverse(index, source.path, "upstream", collect);
  }

  const impactItems = [...impacts.values()]
    .map((item) => ({
      path: item.path,
      impact_directions: [...item.directions].sort(),
      trigger_paths: [...item.triggers].sort(),
      review_obligation: item.ownerGateRequired ? "owner_decision" : "update_or_no_change",
      owner_gate_required: item.ownerGateRequired,
      resolution_required: item.resolutionRequired,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const cycleValidation = validateDeclaredCycles(index);

  return {
    version: "0.2.0",
    analysis_mode: "full_impact_cone",
    changed_source_set: normalizedSources,
    impacted_artifacts: impactItems,
    observed_cycle_ids: cycleValidation.observed_cycle_ids,
    uncovered_changed_paths: uncoveredChangedPaths,
  };
}

export function classifyImpactObligations(cone, context) {
  const changeClass = context.changeClass ?? cone.changed_source_set[0]?.change_class ?? "documentation";
  return {
    ...cone,
    uncovered_changed_paths: context.coveredPaths
      ? cone.uncovered_changed_paths.filter(
          (artifactPath) => !context.coveredPaths.has(artifactPath) && !context.generatedOutputs?.has(artifactPath),
        )
      : cone.uncovered_changed_paths,
    impacted_artifacts: cone.impacted_artifacts.map((item) => {
      const isGenerated = context.generatedOutputs?.has(item.path) ?? false;
      const upstreamBusinessReview = item.impact_directions.includes("upstream") && changeClass === "business_meaning";
      return {
        ...item,
        review_obligation: isGenerated
          ? "regenerate"
          : upstreamBusinessReview || item.owner_gate_required
            ? "owner_decision"
            : item.resolution_required
              ? "update_or_no_change"
              : "validate_only",
        owner_gate_required: upstreamBusinessReview || item.owner_gate_required,
      };
    }),
  };
}
