export const CURRENT_2026_STORY_IDS = [
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

const CURRENT_CONSUMER_SOURCE_IDS = [
  "SRC-DC-PRODUCT-BACKLOG",
  "SRC-DC-REQUIREMENTS-BUSINESS",
  "SRC-DC-REQUIREMENTS-ACCEPTANCE",
  "SRC-DC-REQUIREMENTS-TRACEABILITY",
  "SRC-DC-BUSINESS-CLAIM-MAP",
];

const HISTORICAL_SOURCE_IDS = [
  "SRC-DC-BACKLOG-AGENT-LAUNCH-CANDIDATES",
  "SRC-DC-SPRINT-CANDIDATE-PLAN",
];

const EXCLUDED_SCOPE_MARKERS = /\b(?:DC-ST-31|DC-ST-32|DC-ST-33|PBI-008)\b/u;

function sameItems(actual, expected) {
  return actual.length === expected.length && expected.every((item) => actual.includes(item));
}

export function current2026ScopeConsumerProblems({ registry, traceability, matrixText }) {
  const problems = [];
  const sources = new Map((registry.sources ?? []).map((source) => [source.source_id, source]));

  for (const sourceId of CURRENT_CONSUMER_SOURCE_IDS) {
    const source = sources.get(sourceId);
    if (!source) {
      problems.push(`отсутствует действующий потребитель области 2026 года: ${sourceId}`);
      continue;
    }
    if (source.upstream_decision !== "CO-2026-003") {
      problems.push(`${sourceId} должен ссылаться на CO-2026-003 как на действующее решение`);
    }
    const metadata = [source.notes, ...(source.allowed_downstream_use ?? [])].filter(Boolean).join("\n");
    if (EXCLUDED_SCOPE_MARKERS.test(metadata)) {
      problems.push(`${sourceId}: метаданные действующего источника не должны включать исключённые истории или PBI-008`);
    }
  }

  for (const sourceId of HISTORICAL_SOURCE_IDS) {
    const source = sources.get(sourceId);
    if (!source) {
      problems.push(`отсутствует исторический источник: ${sourceId}`);
      continue;
    }
    if (
      source.source_role !== "historical_snapshot"
      || source.lifecycle !== "historical"
      || source.trust_level !== "historical"
    ) {
      problems.push(`${sourceId} должен быть помечен только как исторический снимок`);
    }
  }

  const storyIds = [...new Set(
    (traceability.links ?? []).flatMap((link) => link.story_ids ?? []).filter((storyId) => /^DC-ST-\d{2}$/.test(storyId)),
  )];
  if (!sameItems(storyIds, CURRENT_2026_STORY_IDS)) {
    const unexpectedStoryIds = storyIds.filter((storyId) => !CURRENT_2026_STORY_IDS.includes(storyId));
    const missingStoryIds = CURRENT_2026_STORY_IDS.filter((storyId) => !storyIds.includes(storyId));
    problems.push(
      "трассировка должна содержать только действующие истории 2026 года: "
      + `${CURRENT_2026_STORY_IDS.join(", ")}; лишние: ${unexpectedStoryIds.join(", ") || "нет"}; `
      + `отсутствуют: ${missingStoryIds.join(", ") || "нет"}`,
    );
  }

  if (EXCLUDED_SCOPE_MARKERS.test(matrixText)) {
    problems.push("матрица согласованности не должна включать исключённые истории или PBI-008");
  }

  return problems;
}
