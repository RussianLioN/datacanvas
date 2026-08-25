import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("главная цепочка учитывает принятые БТ до отдельного обновления историй и системных требований", () => {
  const result = spawnSync(process.execPath, ["scripts/validate-main-artifact-lifecycle-chain.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /main artifact lifecycle chain validation passed/u);
});
