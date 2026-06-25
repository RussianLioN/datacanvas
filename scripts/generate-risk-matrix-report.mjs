import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputPath = process.argv[2] ?? "docs/architecture/risks/risk-matrix.md";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeText(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), value);
}

const riskRegistry = readJson("docs/architecture/risks/risk-registry.json");
const riskTraceability = readJson("docs/architecture/risks/risk-traceability.json");
const traceabilityMatrix = readJson("docs/product/requirements/traceability-matrix.json");

const traceByRequirement = new Map(traceabilityMatrix.links.map((link) => [link.requirement_id, link]));
const traceByRisk = new Map(riskTraceability.links.map((link) => [link.risk_id, link]));

const lines = [
  "# Risk Matrix",
  "",
  "Статус: generated",
  "Версия процесса: 0.1.0",
  "Источник: `docs/architecture/risks/risk-registry.json`, `docs/architecture/risks/risk-traceability.json`, `docs/product/requirements/traceability-matrix.json`",
  "",
  "| Risk | Severity | Owner | NFR | Eval | Evidence | Mitigation |",
  "|---|---|---|---|---|---|---|",
];

for (const risk of riskRegistry.risks) {
  const link = traceByRisk.get(risk.id);
  if (!link) {
    throw new Error(`Risk is missing from risk traceability: ${risk.id}`);
  }

  for (const requirementId of link.traceability_requirement_ids) {
    const traceabilityLink = traceByRequirement.get(requirementId);
    if (!traceabilityLink?.risks?.includes(risk.id)) {
      throw new Error(`Traceability matrix does not link ${requirementId} to ${risk.id}`);
    }
  }

  lines.push(
    [
      `\`${risk.id}\` ${risk.title}`,
      risk.severity,
      risk.owner,
      link.nfr_ids.map((id) => `\`${id}\``).join(", "),
      link.eval_case_ids.map((id) => `\`${id}\``).join(", "),
      link.evidence_paths.map((item) => `\`${item}\``).join("<br>"),
      risk.mitigation,
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"),
  );
}

lines.push(
  "",
  "## Проверка",
  "",
  "```bash",
  "npm run validate:risk-matrix",
  "```",
  "",
  "## Ограничения",
  "",
  "- Отчёт генерируется из локальных артефактов и не подтверждает качество реального внешнего provider.",
  "- Риски и связи требуют review команды перед принятием process version выше `0.1.0`.",
);

writeText(outputPath, `${lines.join("\n")}\n`);
console.log(`risk matrix report written: ${outputPath}`);
