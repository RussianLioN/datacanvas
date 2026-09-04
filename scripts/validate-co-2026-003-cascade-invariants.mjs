import process from "node:process";

import {
  formatCascadeInvariantCommand,
  runCo2026003CascadeInvariants,
} from "./lib/co-2026-003-cascade-invariants.mjs";

try {
  runCo2026003CascadeInvariants({
    cwd: process.cwd(),
    onCommand(invocation, index, total) {
      console.log(`[${index + 1}/${total}] ${formatCascadeInvariantCommand(invocation)}`);
    },
  });
  console.log("Проверка инвариантов каскада CO-2026-003 завершилась успешно");
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = error.exitCode ?? 1;
}
