import { spawnSync } from "node:child_process";
import process from "node:process";

function parseArguments(arguments_) {
  const allowed = new Set(["--check"]);
  const unknown = arguments_.filter((argument) => !allowed.has(argument));
  if (unknown.length > 0) throw new Error(`неизвестные аргументы: ${unknown.join(", ")}`);
  return { checkMode: arguments_.includes("--check") };
}

function validateCurrentRoute() {
  const result = spawnSync(process.execPath, ["scripts/validate-co-2026-003-active-visual-route.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.error) throw new Error(`не удалось проверить активный маршрут: ${result.error.message}`);
  if (result.status !== 0) {
    const details = `${result.stdout}${result.stderr}`.trim();
    throw new Error(`активный browser-native маршрут не прошёл проверку${details ? `:\n${details}` : ""}`);
  }
}

try {
  const { checkMode } = parseArguments(process.argv.slice(2));
  if (!checkMode) {
    throw new Error(
      "исторический 13-кадровый генератор выведен из публикации; финальный выпуск проверяется и собирается только browser-native командами",
    );
  }
  validateCurrentRoute();
  process.stdout.write("Исторический 13-кадровый пакет не публикуется; активный browser-native маршрут проверен.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "сборка не выполнена"}\n`);
  process.exitCode = 1;
}
