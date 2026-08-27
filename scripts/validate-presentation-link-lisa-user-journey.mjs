import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import {
  PACKAGE_PATH,
  compareSevenScreenPrototype,
  buildSevenScreenPrototype,
  validateSavedSevenScreenPrototype,
} from "./lib/presentation-link-lisa-seven-screen-prototype.mjs";

function readJson(target) {
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"}: ${error.message}`).join("; ");
}

function validateActiveContracts(root) {
  const issues = [];
  const registryPath = path.join(root, PACKAGE_PATH, "source/active-contracts.json");
  let registry;
  try {
    registry = readJson(registryPath);
  } catch (error) {
    return [`реестр активных договоров не прочитан: ${error instanceof Error ? error.message : "неизвестная ошибка"}`];
  }
  const descriptors = [
    { path: "source/active-contracts.json", schema: "source/schemas/active-contracts.schema.json" },
    ...(Array.isArray(registry.active_contracts) ? registry.active_contracts : []),
  ];
  for (const descriptor of descriptors) {
    try {
      const schema = readJson(path.join(root, PACKAGE_PATH, descriptor.schema));
      const data = readJson(path.join(root, PACKAGE_PATH, descriptor.path));
      const ajv = new Ajv2020({ allErrors: true, strict: true });
      const validate = ajv.compile(schema);
      if (!validate(data)) issues.push(`${descriptor.path}: ${formatAjvErrors(validate.errors)}`);
      const text = JSON.stringify(data);
      if (/\/Users\/|file:\/\/|\\\\(?:Users|home)\\/u.test(text)) issues.push(`${descriptor.path}: найден локальный абсолютный путь`);
    } catch (error) {
      issues.push(`${descriptor.path}: договор или схема не проверены (${error instanceof Error ? error.message : "неизвестная ошибка"})`);
    }
  }
  return issues;
}

function parseArguments(args) {
  if (args.length === 0) return { savedOnly: false };
  if (args.length === 1 && args[0] === "--saved-only") return { savedOnly: true };
  throw new Error("использование: node scripts/validate-presentation-link-lisa-user-journey.mjs [--saved-only]");
}

try {
  const mode = parseArguments(process.argv.slice(2));
  const root = process.cwd();
  const issues = [...validateActiveContracts(root), ...validateSavedSevenScreenPrototype(root)];
  if (!mode.savedOnly) {
    const built = await buildSevenScreenPrototype(root, { writeRasters: false });
    issues.push(...compareSevenScreenPrototype(root, built));
  }
  if (issues.length > 0) throw new Error(`проверка не пройдена:\n- ${issues.join("\n- ")}`);
  process.stdout.write(mode.savedOnly
    ? "Проверка сохранённого пакета из десяти исходных экранов и трёх экранов статусов пройдена.\n"
    : "Проверка пакета из десяти исходных экранов, трёх экранов статусов и исходных растров пройдена.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка не выполнена"}\n`);
  process.exitCode = 1;
}
