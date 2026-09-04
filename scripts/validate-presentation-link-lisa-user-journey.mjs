import process from "node:process";
import { assertCo2026003ActiveVisualRoute } from "./lib/co-2026-003-active-visual-route.mjs";

function parseArguments(arguments_) {
  const allowed = new Set(["--saved-only"]);
  const unknown = arguments_.filter((argument) => !allowed.has(argument));
  if (unknown.length > 0) throw new Error(`неизвестные аргументы: ${unknown.join(", ")}`);
}

try {
  parseArguments(process.argv.slice(2));
  assertCo2026003ActiveVisualRoute(process.cwd());
  process.stdout.write("Исторический 13-кадровый пакет не публикуется; действующий browser-native маршрут проверен.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка не выполнена"}\n`);
  process.exitCode = 1;
}
