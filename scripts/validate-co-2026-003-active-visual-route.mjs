import path from "node:path";
import process from "node:process";

import { assertCo2026003ActiveVisualRoute } from "./lib/co-2026-003-active-visual-route.mjs";

function parseArguments(args) {
  if (args.length === 0) return { root: process.cwd() };
  if (args.length === 2 && args[0] === "--root") return { root: path.resolve(args[1]) };
  throw new Error("использование: node scripts/validate-co-2026-003-active-visual-route.mjs [--root <путь>]");
}

try {
  const { root } = parseArguments(process.argv.slice(2));
  const result = assertCo2026003ActiveVisualRoute(root);
  process.stdout.write(`Активный browser-native маршрут CO-2026-003 из ${result.frameIds.length} кадров проверен.\n`);
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка не выполнена"}\n`);
  process.exitCode = 1;
}
