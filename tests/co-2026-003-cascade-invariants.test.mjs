import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  CO_2026_003_CASCADE_INVARIANT_COMMANDS,
  formatCascadeInvariantCommand,
  runCo2026003CascadeInvariants,
} from "../scripts/lib/co-2026-003-cascade-invariants.mjs";

const expectedCommands = [
  ["npm", ["run", "validate:co-2026-003-prototype-revision"]],
  ["npm", ["run", "validate:co-2026-003-bt-interview"]],
  [
    "node",
    [
      "--test",
      "tests/co-2026-003-current-user-stories.test.mjs",
      "tests/co-2026-003-business-requirements.test.mjs",
      "tests/co-2026-003-approved-text-cascade.test.mjs",
      "tests/co-2026-003-cascade-freshness.test.mjs",
      "tests/current-2026-scope-consumers.test.mjs",
    ],
  ],
  ["npm", ["run", "validate:docs-navigation"]],
  ["npm", ["run", "validate:co-2026-003-delivery-archive"]],
  ["npm", ["run", "validate:co-2026-003-browser-native-phone-prototype-archive"]],
  ["npm", ["run", "validate:artifact-hashes"]],
];

const repositoryRoot = path.resolve(import.meta.dirname, "..");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

test("набор проверок каскада CO-2026-003 содержит точные команды в требуемом порядке", () => {
  assert.deepEqual(
    CO_2026_003_CASCADE_INVARIANT_COMMANDS.map(({ command, args }) => [command, args]),
    expectedCommands,
  );
});

test("общий качественный шлюз вызывает оркестратор один раз вместо повторов его профилей", () => {
  const scripts = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")).scripts;
  const fullGate = scripts.test;

  assert.match(fullGate, /npm run validate:co-2026-003-cascade-invariants/u);
  for (const command of CO_2026_003_CASCADE_INVARIANT_COMMANDS) {
    const nested = formatCascadeInvariantCommand(command);
    if (nested === "npm run validate:co-2026-003-cascade-invariants") continue;
    assert.doesNotMatch(fullGate, new RegExp(escapeRegExp(nested), "u"));
  }
});

test("docs-check устанавливает Chromium и WebKit сразу после npm ci", () => {
  const workflowPath = path.join(repositoryRoot, ".github/workflows/docs-check.yml");
  const lines = fs.readFileSync(workflowPath, "utf8").split("\n");
  const npmCiIndex = lines.findIndex((line) => line.trim() === "run: npm ci");
  const playwrightInstallIndexes = lines.flatMap((line, index) =>
    /playwright install/.test(line) ? [index] : [],
  );
  const npmTestIndex = lines.findIndex((line) => line.trim() === "run: npm test");

  assert.notEqual(npmCiIndex, -1, "workflow должен устанавливать зависимости npm");
  assert.equal(playwrightInstallIndexes.length, 1, "workflow должен устанавливать браузеры Playwright ровно один раз");
  assert.match(lines[playwrightInstallIndexes[0]], /playwright install(?: --with-deps)? chromium webkit/);
  assert.equal(playwrightInstallIndexes[0], npmCiIndex + 2);
  assert.notEqual(npmTestIndex, -1, "workflow должен запускать npm test");
  assert.ok(playwrightInstallIndexes[0] < npmTestIndex);
});

test("набор проверок каскада CO-2026-003 не содержит повторов", () => {
  const commandKeys = CO_2026_003_CASCADE_INVARIANT_COMMANDS.map(({ command, args }) =>
    JSON.stringify([command, args]),
  );

  assert.equal(new Set(commandKeys).size, commandKeys.length);
});

test("оркестратор запускает каждую команду один раз в заданном порядке", () => {
  const calls = [];
  const run = (command, args, options) => {
    calls.push({ command, args, options });
    return { status: 0 };
  };

  runCo2026003CascadeInvariants({ cwd: "/repo", run });

  assert.deepEqual(
    calls.map(({ command, args }) => [command, args]),
    expectedCommands,
  );
  assert.ok(calls.every(({ options }) => options.cwd === "/repo"));
  assert.ok(calls.every(({ options }) => options.stdio === "inherit"));
});

test("оркестратор останавливается на первой ошибке", () => {
  const calls = [];
  const run = (command, args) => {
    calls.push([command, args]);
    return { status: calls.length === 3 ? 27 : 0 };
  };

  assert.throws(
    () => runCo2026003CascadeInvariants({ cwd: "/repo", run }),
    (error) => {
      assert.equal(error.exitCode, 27);
      assert.match(error.message, /co-2026-003-current-user-stories/u);
      return true;
    },
  );
  assert.deepEqual(calls, expectedCommands.slice(0, 3));
});

test("оркестратор не продолжает работу при ошибке запуска процесса", () => {
  const calls = [];
  const cause = new Error("spawn failed");
  const run = (command, args) => {
    calls.push([command, args]);
    return calls.length === 2 ? { status: null, error: cause } : { status: 0 };
  };

  assert.throws(
    () => runCo2026003CascadeInvariants({ cwd: "/repo", run }),
    (error) => {
      assert.equal(error.exitCode, 1);
      assert.equal(error.cause, cause);
      return true;
    },
  );
  assert.deepEqual(calls, expectedCommands.slice(0, 2));
});
