import assert from "node:assert/strict";
import test from "node:test";

import {
  nonNpmWorkflowPlanCommands,
  uncatalogedWorkflowPlanCommands,
} from "../scripts/lib/workflow-validation-command-policy.mjs";

test("workflow validation plan rejects commands absent from the catalog", () => {
  const missing = uncatalogedWorkflowPlanCommands(
    ["npm run validate:known", "npm run validate:uncataloged"],
    [{ command: "npm run validate:known" }],
  );

  assert.deepEqual(missing, ["npm run validate:uncataloged"]);
});

test("workflow validation plan permits only npm run commands", () => {
  assert.deepEqual(nonNpmWorkflowPlanCommands([
    "npm run validate:known",
    "npm run validate:known -- --changed-from HEAD",
    "npm run generate:known -- --check",
    "node scripts/generate-artifact-hash-manifest.mjs --check",
    "git diff --check",
  ]), [
    "node scripts/generate-artifact-hash-manifest.mjs --check",
    "git diff --check",
  ]);
});

test("workflow validation plan rejects shell tails after an allowed npm prefix", () => {
  const unsafeCommands = [
    "npm run validate:known; rm -rf docs",
    "npm run validate:known > artifacts/out.txt",
    "npm run validate:known $(touch artifacts/out.txt)",
    "npm run validate:known `touch artifacts/out.txt`",
    "npm run validate:known || npm run validate:other",
  ];

  assert.deepEqual(nonNpmWorkflowPlanCommands(unsafeCommands), unsafeCommands);
});
