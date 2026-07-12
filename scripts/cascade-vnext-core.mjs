import crypto from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

const sha256Pattern = /^[0-9a-f]{64}$/u;
const gitShaPattern = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;

const transitions = new Map([
  ["planned", new Set(["awaiting_owner", "blocked", "finalized"])],
  ["awaiting_owner", new Set(["blocked", "finalized"])],
  ["finalized", new Set(["profile_verified", "blocked"])],
  ["profile_verified", new Set(["verified", "blocked"])],
  ["blocked", new Set()],
  ["verified", new Set()],
]);

const statusLabels = new Map([
  ["planned", "Каскад запланирован"],
  ["awaiting_owner", "Ожидается решение владельца"],
  ["blocked", "Каскад заблокирован"],
  ["finalized", "Пакет сформирован, завершение не подтверждено"],
  ["profile_verified", "Профильные проверки пройдены, завершение не подтверждено"],
  ["verified", "Каскад завершен и проверен"],
]);

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJson(value[key])]));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sourcePaths(source) {
  return [source.path, source.provenance_manifest].filter(Boolean).map(normalizeRepoPath);
}

export function resolveActualTriggerPaths({
  initialTriggers = [],
  identities = [],
  explicitSourceSelection = false,
  changedPaths = [],
}) {
  const changed = new Set(changedPaths.map(normalizeRepoPath));
  const requested = explicitSourceSelection
    ? identities.flatMap((identity) => [identity.source_path, identity.provenance_path].filter(Boolean))
    : initialTriggers;
  const normalized = [...new Set(requested.map(normalizeRepoPath))].sort();
  const actual = normalized.filter((candidate) => changed.has(candidate));
  if (explicitSourceSelection) {
    if (actual.length === 0) {
      throw new Error("explicit source selection has no Git delta in the declared range");
    }
    return actual;
  }
  const missing = normalized.filter((candidate) => !changed.has(candidate));
  if (missing.length > 0) {
    throw new Error("trigger path has no Git delta in the declared range: " + missing.join(", "));
  }
  if (actual.length === 0) throw new Error("cascade run has no changed trigger path");
  return actual;
}

export function buildCascadeReplayKey(run) {
  const payload = {
    change_request_id: run.change_request_id,
    base_sha: run.base_sha,
    planning_head_sha: run.planning_head_sha,
    replay_inputs: run.replay_inputs,
  };
  return sha256(JSON.stringify(stableJson(payload)));
}

export function assertCascadeReplayKey(run) {
  if (run.replay_key !== buildCascadeReplayKey(run)) {
    throw new Error("cascade replay key mismatch");
  }
}

export function assertCascadeReplayInputs(run, actualInputs) {
  assertCascadeReplayKey(run);
  for (const [key, expected] of Object.entries(run.replay_inputs ?? {})) {
    if (actualInputs[key] !== expected) {
      throw new Error(`cascade replay input mismatch: ${key}`);
    }
  }
}

export function assertRegistryDeltaIntegrity(registryDelta, {
  beforeSha256,
  afterSha256,
  registryChanged,
  beforeRegistry,
  afterRegistry,
}) {
  if (!registryDelta) return;
  if (!registryChanged) throw new Error("source registry delta requires a real Git change");
  if (registryDelta.before_sha256 !== beforeSha256 || registryDelta.after_sha256 !== afterSha256) {
    throw new Error("source registry delta hash mismatch");
  }
  if (beforeSha256 === afterSha256) throw new Error("source registry delta does not change registry content");
  const actualSelectors = deriveRegistryDeltaSelectors(beforeRegistry, afterRegistry);
  const declaredSelectors = [...(registryDelta.source_selectors ?? [])]
    .map(({ source_id, operation }) => ({ source_id, operation }))
    .sort((left, right) => left.source_id.localeCompare(right.source_id));
  if (!isDeepStrictEqual(declaredSelectors, actualSelectors)) {
    throw new Error("source registry delta selectors mismatch");
  }
}

export function deriveRegistryDeltaSelectors(beforeRegistry, afterRegistry) {
  const indexSources = (registry, label) => {
    if (!registry || !Array.isArray(registry.sources)) throw new Error(`${label} source registry is invalid`);
    const indexed = new Map();
    for (const source of registry.sources) {
      if (!source?.source_id || indexed.has(source.source_id)) {
        throw new Error(`${label} source registry has a missing or duplicate source_id`);
      }
      indexed.set(source.source_id, source);
    }
    return indexed;
  };
  const before = indexSources(beforeRegistry, "before");
  const after = indexSources(afterRegistry, "after");
  const sourceIds = [...new Set([...before.keys(), ...after.keys()])].sort();
  return sourceIds.flatMap((sourceId) => {
    if (!before.has(sourceId)) return [{ source_id: sourceId, operation: "add" }];
    if (!after.has(sourceId)) return [{ source_id: sourceId, operation: "remove" }];
    const previous = before.get(sourceId);
    const current = after.get(sourceId);
    if (isDeepStrictEqual(previous, current)) return [];
    return [{
      source_id: sourceId,
      operation: previous.path !== current.path ? "rename" : "update",
    }];
  });
}

export function resolveSourceIdentities({
  sourceRegistry,
  triggerPaths = [],
  explicitSourceIds = [],
  registryDelta = null,
}) {
  const sources = sourceRegistry?.sources ?? [];
  const byId = new Map(sources.map((source) => [source.source_id, source]));
  const normalizedTriggers = triggerPaths.map(normalizeRepoPath);
  const selectedIds = new Set(explicitSourceIds);

  for (const selector of registryDelta?.source_selectors ?? []) {
    if (selector.source_id) selectedIds.add(selector.source_id);
  }

  if (selectedIds.size === 0) {
    for (const source of sources) {
      if (sourcePaths(source).some((candidate) => normalizedTriggers.includes(candidate))) {
        selectedIds.add(source.source_id);
      }
    }
  }

  if (selectedIds.size === 0) {
    throw new Error("source identity cannot be resolved from the source registry");
  }

  const identities = [...selectedIds].map((sourceId) => {
    const source = byId.get(sourceId);
    if (!source) throw new Error(`source identity is unknown: ${sourceId}`);
    return {
      source_id: source.source_id,
      source_path: normalizeRepoPath(source.path),
      provenance_path: source.provenance_manifest ? normalizeRepoPath(source.provenance_manifest) : null,
      resolution: explicitSourceIds.includes(sourceId) ? "explicit" : registryDelta ? "registry_delta" : "deterministic_registry_match",
    };
  }).sort((left, right) => left.source_id.localeCompare(right.source_id));

  if (explicitSourceIds.length === 0 && !registryDelta && identities.length > 1) {
    throw new Error(`source identity is ambiguous: ${identities.map((item) => item.source_id).join(", ")}`);
  }
  return identities;
}

export function assertStateTransition(from, to, command = null) {
  if (!transitions.has(from) || !transitions.has(to)) {
    throw new Error(`unknown cascade state transition: ${from} -> ${to}`);
  }
  if (!transitions.get(from).has(to)) {
    throw new Error(`invalid cascade state transition: ${from} -> ${to}`);
  }
  if (to === "verified" && command !== "cascade:complete") {
    throw new Error("only cascade:complete may produce the verified state");
  }
}

export function canClaimDone(state, command) {
  return state === "verified" && command === "cascade:complete";
}

export function statusLabel(state) {
  const label = statusLabels.get(state);
  if (!label) throw new Error(`unknown cascade state: ${state}`);
  return label;
}

function pathAllowed(candidate, allowedWrites) {
  return allowedWrites.some((allowed) => candidate === allowed || candidate.startsWith(`${allowed}/`));
}

export function expandAllowedWritesForRenames(allowedWrites, entries, authorizedRenames = []) {
  const expanded = new Set(allowedWrites.map(normalizeRepoPath));
  const actualRenameKeys = new Set(entries
    .filter((entry) => String(entry.status).startsWith("R") && entry.old_path)
    .map((entry) => `${normalizeRepoPath(entry.old_path)}\0${normalizeRepoPath(entry.path)}`));
  const authorizedRenameKeys = new Set(authorizedRenames.map((entry) => {
    const key = `${normalizeRepoPath(entry.rename_from_path)}\0${normalizeRepoPath(entry.rename_to_path)}`;
    if (!actualRenameKeys.has(key)) throw new Error("rename authorization does not match Git delta");
    return key;
  }));
  for (const entry of entries) {
    if (!String(entry.status).startsWith("R") || !entry.old_path) continue;
    const currentPath = normalizeRepoPath(entry.path);
    const oldPath = normalizeRepoPath(entry.old_path);
    const currentAllowed = pathAllowed(currentPath, [...expanded]);
    const oldAllowed = pathAllowed(oldPath, [...expanded]);
    if (currentAllowed === oldAllowed) continue;
    if (!authorizedRenameKeys.has(`${oldPath}\0${currentPath}`)) {
      throw new Error(`explicit rename authorization is required: ${oldPath} -> ${currentPath}`);
    }
    expanded.add(currentPath);
    expanded.add(oldPath);
  }
  return [...expanded].sort();
}

export function buildActualDiffManifest({
  baseSha,
  planningHeadSha,
  candidateHeadSha,
  entries = [],
  allowedWrites = [],
  dirty = false,
}) {
  for (const [label, value] of Object.entries({ baseSha, planningHeadSha, candidateHeadSha })) {
    if (!gitShaPattern.test(value)) throw new Error(`${label} must be an immutable Git SHA`);
  }
  const normalizedAllowed = [...new Set(allowedWrites.map(normalizeRepoPath))].sort();
  const normalizedEntries = entries.map((entry) => ({
    status: entry.status,
    path: normalizeRepoPath(entry.path),
    old_path: entry.old_path ? normalizeRepoPath(entry.old_path) : null,
    sha256: entry.sha256 ?? null,
  })).sort((left, right) => left.path.localeCompare(right.path));
  const unexpectedPaths = normalizedEntries
    .flatMap((entry) => [entry.path, entry.old_path].filter(Boolean))
    .filter((candidate) => !pathAllowed(candidate, normalizedAllowed));
  if (unexpectedPaths.length > 0) {
    throw new Error(`unexpected changed paths: ${[...new Set(unexpectedPaths)].join(", ")}`);
  }
  const manifest = {
    version: "1.0.0",
    base_sha: baseSha,
    planning_head_sha: planningHeadSha,
    candidate_head_sha: candidateHeadSha,
    dirty_worktree: Boolean(dirty),
    allowed_write_paths: normalizedAllowed,
    changed_entries: normalizedEntries,
    unexpected_paths: [],
  };
  return { ...manifest, diff_sha256: sha256(JSON.stringify(stableJson(manifest))) };
}

export function verifyAppliedResolution({
  updateStatus,
  changeStatus = "M",
  afterSha256,
  expectedAfterSha256 = null,
  patchDigest = null,
  actualPatchDigest = null,
}) {
  if (updateStatus !== "applied") return;
  if (String(changeStatus).startsWith("D")) {
    if (afterSha256 !== null) throw new Error("deleted artifact must not have an after hash");
    if (!patchDigest) throw new Error("deletion requires an approved patch digest");
    if (!sha256Pattern.test(patchDigest)) throw new Error("approved patch digest must be sha256");
    if (!sha256Pattern.test(actualPatchDigest ?? "") || patchDigest !== actualPatchDigest) {
      throw new Error("approved patch digest does not match the actual Git patch digest");
    }
    return;
  }
  if (!sha256Pattern.test(afterSha256 ?? "")) throw new Error("applied resolution requires a valid after hash");
  if (!expectedAfterSha256 && !patchDigest) {
    throw new Error("applied resolution requires an expected after hash or approved patch digest");
  }
  if (expectedAfterSha256 && afterSha256 !== expectedAfterSha256) {
    throw new Error("expected after hash does not match the actual artifact hash");
  }
  if (patchDigest && !sha256Pattern.test(patchDigest)) {
    throw new Error("approved patch digest must be sha256");
  }
  if (patchDigest && (!sha256Pattern.test(actualPatchDigest ?? "") || patchDigest !== actualPatchDigest)) {
    throw new Error("approved patch digest does not match the actual Git patch digest");
  }
}

export function classifyXlsxChangeSignals(signals = {}) {
  if (signals.noChange) return ["no_change"];
  const classes = [];
  if (signals.estimateChanged) classes.push("estimate_change");
  if (signals.priorityChanged) classes.push("priority_change");
  if (signals.storyTextChanged) classes.push("story_text_change");
  if (signals.rowAddedOrRemoved) classes.push("row_add_remove");
  if (signals.scopeChanged) classes.push("scope_change");
  if (signals.provenanceChanged) classes.push("provenance_only");
  if (signals.formattingChanged) classes.push(classes.length === 0 ? "formatting_only" : "formatting_change");
  if (signals.formulaCacheOnly && classes.length === 0) classes.push("formula_cache_only");
  return [...new Set(classes.length > 0 ? classes : ["mixed_or_ambiguous"])].sort();
}
