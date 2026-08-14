import process from "node:process";
import {
  buildSevenScreenPrototype,
  compareSevenScreenRuntime,
  compareSevenScreenPrototype,
  publishSevenScreenRuntime,
  publishSevenScreenPrototype,
  validateSavedSevenScreenPrototype,
} from "./lib/presentation-link-lisa-seven-screen-prototype.mjs";

function parseArguments(args) {
  const allowed = new Set(["--check", "--html-only"]);
  const unknown = args.filter((argument) => !allowed.has(argument));
  if (unknown.length > 0) throw new Error(`неизвестные аргументы: ${unknown.join(", ")}`);
  return { check: args.includes("--check"), htmlOnly: args.includes("--html-only") };
}

try {
  const mode = parseArguments(process.argv.slice(2));
  const root = process.cwd();
  const built = await buildSevenScreenPrototype(root, { writeRasters: !mode.check && !mode.htmlOnly });
  if (mode.check) {
    const issues = mode.htmlOnly
      ? compareSevenScreenRuntime(root, built)
      : [...compareSevenScreenPrototype(root, built), ...validateSavedSevenScreenPrototype(root)];
    if (issues.length > 0) throw new Error(`пакет устарел или повреждён:\n- ${issues.join("\n- ")}`);
    process.stdout.write(mode.htmlOnly
      ? "HTML-часть автономного прототипа из десяти состояний актуальна.\n"
      : "Автономный прототип из десяти состояний и переносимый архив актуальны.\n");
  } else {
    if (mode.htmlOnly) publishSevenScreenRuntime(root, built);
    else publishSevenScreenPrototype(root, built);
    const issues = mode.htmlOnly ? compareSevenScreenRuntime(root, built) : validateSavedSevenScreenPrototype(root);
    if (issues.length > 0) throw new Error(`опубликованный пакет не прошёл самопроверку:\n- ${issues.join("\n- ")}`);
    process.stdout.write(mode.htmlOnly
      ? "HTML-часть автономного прототипа из десяти состояний опубликована.\n"
      : `Автономный прототип из десяти состояний опубликован; файлов в архиве: ${built.archiveEntries.length}.\n`);
  }
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "сборка не выполнена"}\n`);
  process.exitCode = 1;
}
