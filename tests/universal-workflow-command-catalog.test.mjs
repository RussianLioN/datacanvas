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
    "node scripts/generate-artifact-hash-manifest.mjs --check",
    "git diff --check",
  ]), [
    "node scripts/generate-artifact-hash-manifest.mjs --check",
    "git diff --check",
  ]);
});
