import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const statePath = new URL(
  "../docs/product/analysis/agent-launch-requirements-analysis/analysis-state.json",
  import.meta.url,
);
const impactMapPath = new URL(
  "../docs/product/analysis/agent-launch-requirements-analysis/requirements-impact-map.json",
  import.meta.url,
);

test("исторический аналитический пакет не блокирует принятые БТ до обновления историй", () => {
  const result = spawnSync(
    "node",
    ["scripts/validate-agent-launch-requirements-analysis.mjs"],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /историческ.*целостност/iu);
});

test("старый аналитический пакет явно помечен историческим снимком", () => {
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const impactMap = JSON.parse(fs.readFileSync(impactMapPath, "utf8"));

  assert.equal(state.analysis_role, "historical_snapshot");
  assert.equal(impactMap.analysis_role, "historical_snapshot");
});
