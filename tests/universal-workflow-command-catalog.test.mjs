import assert from "node:assert/strict";
import test from "node:test";

import { uncatalogedWorkflowPlanCommands } from "../scripts/lib/workflow-validation-command-policy.mjs";

test("workflow validation plan rejects commands absent from the catalog", () => {
  const missing = uncatalogedWorkflowPlanCommands(
    ["npm run validate:known", "npm run validate:uncataloged"],
    [{ command: "npm run validate:known" }],
  );

  assert.deepEqual(missing, ["npm run validate:uncataloged"]);
});
