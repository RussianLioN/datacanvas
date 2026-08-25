import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("историческая правка требований не блокирует принятый этап БТ CO-2026-003", () => {
  const output = execFileSync("node", ["scripts/validate-change-set-approval.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.match(output, /change set approval validation passed/u);
});
