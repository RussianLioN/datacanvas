import assert from "node:assert/strict";
import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  analyzeImpactCone,
  buildDependencyIndex,
  buildGeneratedOutputLookup,
  classifyImpactObligations,
  validateDeclaredCycles,
} from "./documentation-impact-graph.mjs";

function artifact(path) {
  return {
    path,
    owner_role: "Documentation Owner",
    validation_command: "npm run validate:cascade-impact",
  };
}

function dependency(upstream, downstream, overrides = {}) {
  return {
    upstream_artifact: upstream,
    downstream_artifact: downstream,
    relation_type: "semantic",
    user_confirmation_required: "semantic_change",
    resolution_required: "changed_or_no_change_rationale",
    ...overrides,
  };
}

const acyclicGraph = {
  artifacts: ["vision", "stories", "backlog", "sprint"].map((name) => artifact(`docs/${name}.md`)),
  dependencies: [
    dependency("docs/vision.md", "docs/stories.md"),
    dependency("docs/stories.md", "docs/backlog.md"),
    dependency("docs/backlog.md", "docs/sprint.md"),
  ],
  declared_cycle_groups: [],
};

const acyclicIndex = buildDependencyIndex(acyclicGraph);
const middleCone = analyzeImpactCone(acyclicIndex, [
  { path: "docs/stories.md", change_class: "business_meaning" },
]);
const processCone = analyzeImpactCone(acyclicIndex, [
  { path: "docs/stories.md", change_class: "documentation" },
]);
assert.equal(
  processCone.impacted_artifacts.some((item) => item.owner_gate_required),
  false,
  "semantic_change edge policy must not require an owner decision for a mechanical documentation change",
);
const processMeaningCone = analyzeImpactCone(acyclicIndex, [
  { path: "docs/stories.md", change_class: "process_structure_change" },
]);
assert.equal(
  processMeaningCone.impacted_artifacts.every((item) => item.owner_gate_required),
  true,
  "a semantic process change must retain the Process Owner gate",
);

assert.deepEqual(middleCone.changed_source_set, [
  { path: "docs/stories.md", change_class: "business_meaning" },
]);
assert.deepEqual(
  middleCone.impacted_artifacts.map((item) => [item.path, item.impact_directions]),
  [
    ["docs/backlog.md", ["downstream"]],
    ["docs/sprint.md", ["downstream"]],
    ["docs/vision.md", ["upstream"]],
  ],
);

const cyclicGraph = {
  artifacts: ["stories", "backlog", "xlsx"].map((name) => artifact(`docs/${name}.md`)),
  dependencies: [
    dependency("docs/stories.md", "docs/backlog.md"),
    dependency("docs/backlog.md", "docs/xlsx.md"),
    dependency("docs/xlsx.md", "docs/stories.md", { relation_type: "estimate_evidence" }),
  ],
  declared_cycle_groups: [
    {
      cycle_id: "CYCLE-STORIES-XLSX",
      member_paths: ["docs/backlog.md", "docs/stories.md", "docs/xlsx.md"],
      purpose: "reconciliation",
      rationale: "Проверка согласованности каталога историй и рабочей оценки.",
      owner_role: "Product Owner / Documentation Owner",
    },
  ],
};

const cyclicIndex = buildDependencyIndex(cyclicGraph);
const cycleValidation = validateDeclaredCycles(cyclicIndex, cyclicGraph.declared_cycle_groups);
assert.deepEqual(cycleValidation.observed_cycle_ids, ["CYCLE-STORIES-XLSX"]);

const cyclicCone = analyzeImpactCone(cyclicIndex, [
  { path: "docs/stories.md", change_class: "business_meaning" },
]);
assert.equal(cyclicCone.impacted_artifacts.some((item) => item.path === "docs/stories.md"), false);
assert.deepEqual(
  cyclicCone.impacted_artifacts.map((item) => [item.path, item.impact_directions]),
  [
    ["docs/backlog.md", ["downstream", "upstream"]],
    ["docs/xlsx.md", ["downstream", "upstream"]],
  ],
);

assert.throws(
  () => validateDeclaredCycles(buildDependencyIndex({ ...cyclicGraph, declared_cycle_groups: [] }), []),
  /undeclared dependency cycle/u,
);

assert.throws(
  () =>
    validateDeclaredCycles(
      buildDependencyIndex({
        artifacts: [artifact("docs/self.md")],
        dependencies: [dependency("docs/self.md", "docs/self.md")],
        declared_cycle_groups: [],
      }),
      [],
    ),
  /self-loop/u,
);

const classifiedCone = classifyImpactObligations(middleCone, {
  artifactByPath: new Map(acyclicGraph.artifacts.map((item) => [item.path, item])),
  generatedOutputs: new Map([["docs/sprint.md", { generator_id: "sprint-generator" }]]),
  changeClass: "business_meaning",
});
assert.equal(
  classifiedCone.impacted_artifacts.find((item) => item.path === "docs/sprint.md").review_obligation,
  "regenerate",
);
assert.equal(
  classifiedCone.impacted_artifacts.find((item) => item.path === "docs/vision.md").review_obligation,
  "owner_decision",
);

const generatedLookup = buildGeneratedOutputLookup({
  contracts: [
    {
      generator_id: "cascade-evidence",
      outputs: ["docs/generated/static.json"],
      output_roots: ["docs/process/cascading-governance/runs"],
    },
  ],
});
assert.equal(generatedLookup.has("docs/generated/static.json"), true);
assert.equal(
  generatedLookup.has("docs/process/cascading-governance/runs/RUN-001/impact-analysis-report.json"),
  true,
);
assert.equal(generatedLookup.has("docs/process/cascading-governance/impact-analysis-report.json"), false);

const activeGraph = JSON.parse(
  fs.readFileSync("docs/process/cascading-governance/artifact-dependency-graph.json", "utf8"),
);
assert.equal(activeGraph.version, "0.2.0", "active dependency graph must use the bidirectional cascade contract");
assert.equal(
  activeGraph.dependencies.every(
    (edge) => edge.resolution_required === "changed_or_no_change_rationale",
  ),
  true,
  "every active dependency must require update or no-change resolution",
);
const activeCycleValidation = validateDeclaredCycles(
  buildDependencyIndex(activeGraph),
  activeGraph.declared_cycle_groups,
);
assert.equal(activeCycleValidation.observed_cycle_ids.length > 0, true);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(JSON.parse(fs.readFileSync("schemas/common-defs.schema.json", "utf8")));
const validateCone = ajv.compile(
  JSON.parse(fs.readFileSync("schemas/cascade-impact-cone.schema.json", "utf8")),
);
assert.equal(validateCone(classifiedCone), true, JSON.stringify(validateCone.errors, null, 2));
const fixtureCone = JSON.parse(
  fs.readFileSync("tests/fixtures/cascading-governance/cascade-impact-cone.json", "utf8"),
);
assert.equal(validateCone(fixtureCone), true, JSON.stringify(validateCone.errors, null, 2));

console.log("cascade impact validation passed");
