import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { current2026ScopeConsumerProblems } from "../scripts/lib/current-2026-scope-consumers.mjs";

const registryPath = new URL("../docs/product/sources/product-source-registry.json", import.meta.url);
const traceabilityPath = new URL("../docs/product/requirements/traceability-matrix.json", import.meta.url);
const matrixPath = new URL(
  "../docs/product/analysis/documentation-consistency-audit/consistency-matrix.md",
  import.meta.url,
);

function loadConsumers() {
  return {
    registry: JSON.parse(fs.readFileSync(registryPath, "utf8")),
    traceability: JSON.parse(fs.readFileSync(traceabilityPath, "utf8")),
    matrixText: fs.readFileSync(matrixPath, "utf8"),
  };
}

test("действующие потребители используют только принятую границу 2026 года", () => {
  assert.deepEqual(current2026ScopeConsumerProblems(loadConsumers()), []);
});

test("проверка отклоняет возврат прежней области в метаданные, трассировку и матрицу", () => {
  const consumers = loadConsumers();
  const staleRegistry = structuredClone(consumers.registry);
  staleRegistry.sources.find((source) => source.source_id === "SRC-DC-PRODUCT-BACKLOG").upstream_decision = "CO-2026-002";

  const staleTraceability = structuredClone(consumers.traceability);
  staleTraceability.links.find((link) => link.requirement_id === "BT-019").story_ids.push("DC-ST-31");

  const problems = current2026ScopeConsumerProblems({
    registry: staleRegistry,
    traceability: staleTraceability,
    matrixText: `${consumers.matrixText}\n| obsolete | DC-ST-31 |`,
  });

  assert.ok(problems.some((problem) => problem.includes("SRC-DC-PRODUCT-BACKLOG")));
  assert.ok(problems.some((problem) => problem.includes("DC-ST-31")));
  assert.ok(problems.some((problem) => problem.includes("матрица согласованности")));
});

test("проверка отклоняет исключённую историю в метаданных действующего источника", () => {
  const consumers = loadConsumers();
  const staleRegistry = structuredClone(consumers.registry);
  staleRegistry.sources.find((source) => source.source_id === "SRC-DC-PRODUCT-BACKLOG").notes = (
    "Старый маршрут PBI-008 включает DC-ST-31."
  );

  const problems = current2026ScopeConsumerProblems({
    ...consumers,
    registry: staleRegistry,
  });

  assert.ok(problems.some((problem) => problem.includes("метаданные действующего источника")));
});
