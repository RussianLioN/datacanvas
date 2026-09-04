import { spawnSync } from "node:child_process";

export const CO_2026_003_CASCADE_INVARIANT_COMMANDS = Object.freeze([
  Object.freeze({
    command: "npm",
    args: Object.freeze(["run", "validate:co-2026-003-prototype-revision"]),
  }),
  Object.freeze({
    command: "npm",
    args: Object.freeze(["run", "validate:co-2026-003-bt-interview"]),
  }),
  Object.freeze({
    command: "node",
    args: Object.freeze([
      "--test",
      "tests/co-2026-003-current-user-stories.test.mjs",
      "tests/co-2026-003-business-requirements.test.mjs",
      "tests/co-2026-003-approved-text-cascade.test.mjs",
      "tests/co-2026-003-cascade-freshness.test.mjs",
      "tests/current-2026-scope-consumers.test.mjs",
    ]),
  }),
  Object.freeze({
    command: "npm",
    args: Object.freeze(["run", "validate:docs-navigation"]),
  }),
  Object.freeze({
    command: "npm",
    args: Object.freeze(["run", "validate:co-2026-003-delivery-archive"]),
  }),
  Object.freeze({
    command: "npm",
    args: Object.freeze([
      "run",
      "validate:co-2026-003-browser-native-phone-prototype-archive",
    ]),
  }),
  Object.freeze({
    command: "npm",
    args: Object.freeze(["run", "validate:artifact-hashes"]),
  }),
]);

export function formatCascadeInvariantCommand({ command, args }) {
  return [command, ...args].join(" ");
}

export function runCo2026003CascadeInvariants({
  cwd,
  run = spawnSync,
  onCommand = () => {},
} = {}) {
  for (const [index, invocation] of CO_2026_003_CASCADE_INVARIANT_COMMANDS.entries()) {
    onCommand(invocation, index, CO_2026_003_CASCADE_INVARIANT_COMMANDS.length);

    const result = run(invocation.command, invocation.args, {
      cwd,
      stdio: "inherit",
    });

    if (result.error || result.status !== 0) {
      const exitCode = Number.isInteger(result.status) ? result.status : 1;
      const error = new Error(
        `Проверка завершилась с ошибкой: ${formatCascadeInvariantCommand(invocation)}`,
        result.error ? { cause: result.error } : undefined,
      );
      error.exitCode = exitCode;
      throw error;
    }
  }
}
