import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("исторический аналитический пакет не блокирует принятые БТ до обновления историй", () => {
  const result = spawnSync(
    "node",
    ["scripts/validate-agent-launch-requirements-analysis.mjs"],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /историческ.*целостност/iu);
});
