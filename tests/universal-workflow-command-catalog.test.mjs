import assert from "node:assert/strict";
import test from "node:test";

import {
  nonNpmWorkflowPlanCommands,
  parseSafeNpmCommand as parsePolicySafeNpmCommand,
  uncatalogedWorkflowPlanCommands,
} from "../scripts/lib/workflow-validation-command-policy.mjs";
import { parseSafeNpmCommand as parseProfileSafeNpmCommand } from "../scripts/cascade-profile-verifier.mjs";

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

test("workflow command policy and profile verifier share strict npm command parsing", () => {
  const checkCommand = "npm run generate:bmc -- --check";
  assert.deepEqual(parsePolicySafeNpmCommand(checkCommand), ["generate:bmc"]);
  assert.deepEqual(parseProfileSafeNpmCommand(checkCommand), ["generate:bmc"]);
  assert.deepEqual(nonNpmWorkflowPlanCommands([checkCommand]), []);

  const unsafeCommands = [
    "npm run generate:bmc -- --check; rm -rf docs",
    "npm run generate:bmc -- --check > artifacts/out.txt",
    "npm run generate:bmc -- --check $(touch artifacts/out.txt)",
  ];
  for (const command of unsafeCommands) {
    assert.throws(() => parsePolicySafeNpmCommand(command), /safe npm run/u);
    assert.throws(() => parseProfileSafeNpmCommand(command), /safe npm run/u);
  }
  assert.deepEqual(nonNpmWorkflowPlanCommands(unsafeCommands), unsafeCommands);
});
