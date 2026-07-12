import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { planningReadinessProblems } from "./lib/product-document-consistency.mjs";

const root = process.cwd();
const requiredContours = ["product", "requirements", "technical", "eval", "process", "sprint"];
const centralContourIds = new Set(["product", "technical", "eval", "process"]);
const centralItemPattern = /^(PBI|TECH|EVAL|PROC)-\d{3}$/;
const requirementItemPattern = /^(REQ|BT|NFR|US)-\d{3}$/;
const blockedTraceabilityPrefixes = ["QA-", "SEC-", "OPS-"];
const allowedStatuses = new Set(["draft", "ready", "ready_for_team_review", "in_progress", "active", "done"]);
const doneStatuses = new Set(["done"]);

const contourRequirements = {
  product: {
    requiredColumns: ["ID", "Название", "Связь", "Приоритет", "Статус"],
  },
  technical: {
    requiredColumns: ["ID", "Название", "Связь", "Приоритет", "Статус"],
  },
  eval: {
    requiredColumns: ["ID", "Название", "Тип", "Категория", "Связь", "Обязательность", "Статус", "Evidence"],
  },
  process: {
    requiredColumns: ["ID", "Название", "Цель", "Тип", "Приоритет", "Статус"],
  },
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseMarkdownTables(relativePath) {
  const lines = readText(relativePath).split(/\r?\n/);
  const tables = [];

  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerLine = lines[index];
    const separatorLine = lines[index + 1];
    if (!headerLine.trim().startsWith("|") || !isSeparatorRow(separatorLine)) {
      continue;
    }

    const headers = splitTableRow(headerLine);
    const rows = [];
    let rowIndex = index + 2;
    while (rowIndex < lines.length && lines[rowIndex].trim().startsWith("|")) {
      const values = splitTableRow(lines[rowIndex]);
      const row = {};
      headers.forEach((header, cellIndex) => {
        row[header] = values[cellIndex] ?? "";
      });
      rows.push({ row, line: rowIndex + 1 });
      rowIndex += 1;
    }

    tables.push({ headers, rows, line: index + 1 });
    index = rowIndex;
  }

  return tables;
}

function normalizeMarkdownCell(value) {
  return value.replace(/`/g, "").trim();
}

function extractBacktickValues(value) {
  return [...value.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

function validateNpmCommand(command, availableScripts) {
  if (command === "npm test") {
    return;
  }
  if (!command.startsWith("npm run ")) {
    fail(`unsupported validation command format: ${command}`);
  }
  const scriptName = command.slice("npm run ".length).trim();
  if (!(scriptName in availableScripts)) {
    fail(`validation command references missing npm script: ${command}`);
  }
}

function validateClosedItemEvidence(row, relativePath, availableScripts) {
  const itemId = row.ID;
  if (!doneStatuses.has(row["Статус"])) {
    return;
  }

  const relation = normalizeMarkdownCell(row["Связь"] ?? row["Цель"] ?? "");
  if (!relation || relation === "-") {
    fail(`closed backlog item must have requirement or process linkage: ${itemId} in ${relativePath}`);
  }

  const evidenceValues = extractBacktickValues(row.Evidence ?? "");
  if (evidenceValues.length === 0) {
    fail(`closed backlog item must have evidence path: ${itemId} in ${relativePath}`);
  }
  for (const evidencePath of evidenceValues) {
    requireFile(evidencePath);
  }

  const validationCommands = extractBacktickValues(row["Проверка"] ?? "");
  if (validationCommands.length === 0) {
    fail(`closed backlog item must have validation command: ${itemId} in ${relativePath}`);
  }
  for (const command of validationCommands) {
    validateNpmCommand(command, availableScripts);
  }
}

function validateCentralMarkdownContour(contour, availableScripts) {
  const requirement = contourRequirements[contour.id];
  const tables = parseMarkdownTables(contour.source_path);
  if (tables.length === 0) {
    fail(`backlog contour source has no Markdown table: ${contour.source_path}`);
  }

  const rows = [];
  for (const table of tables) {
    for (const requiredColumn of requirement.requiredColumns) {
      if (!table.headers.includes(requiredColumn)) {
        fail(`backlog table is missing required column ${requiredColumn}: ${contour.source_path}:${table.line}`);
      }
    }

    for (const { row, line } of table.rows) {
      if (!row.ID) {
        fail(`backlog row is missing ID: ${contour.source_path}:${line}`);
      }
      if (!contour.item_prefixes.some((prefix) => row.ID.startsWith(prefix))) {
        fail(`backlog row has prefix outside contour ${contour.id}: ${row.ID}`);
      }
      if (!centralItemPattern.test(row.ID)) {
        fail(`central backlog ID must use canonical pattern: ${row.ID}`);
      }
      if (!allowedStatuses.has(row["Статус"])) {
        fail(`backlog row has unsupported status ${row["Статус"]}: ${row.ID}`);
      }
      validateClosedItemEvidence(row, contour.source_path, availableScripts);
      rows.push({ row, line, contour: contour.id, source_path: contour.source_path });
    }
  }

  return rows;
}

function validateSprintBacklog(relativePath) {
  const tables = parseMarkdownTables(relativePath);
  if (tables.length === 0) {
    const hasListItems = readText(relativePath)
      .split(/\r?\n/)
      .some((line) => /^-\s+\S/.test(line.trim()));
    if (!hasListItems) {
      fail(`sprint backlog has no table or list items: ${relativePath}`);
    }
    return;
  }

  for (const table of tables) {
    if (!table.headers.includes("ID")) {
      fail(`sprint backlog table is missing required column ID: ${relativePath}:${table.line}`);
    }
    const hasWorkColumn = ["Item", "Работа", "Название", "Acceptance", "Acceptance Criteria", "Результат"].some((column) =>
      table.headers.includes(column),
    );
    if (!hasWorkColumn) {
      fail(`sprint backlog table is missing work/result column: ${relativePath}:${table.line}`);
    }

    if (table.headers.includes("Статус")) {
      for (const { row, line } of table.rows) {
        if (!allowedStatuses.has(row["Статус"])) {
          fail(`sprint backlog row has unsupported status ${row["Статус"]}: ${relativePath}:${line}`);
        }
      }
    }
  }
}

const registry = readJson("docs/product/backlog/backlog-registry.json");
const schema = readJson("schemas/backlog-registry.schema.json");
const packageJson = readJson("package.json");
const availableScripts = packageJson.scripts ?? {};
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateRegistry = ajv.compile(schema);
if (!validateRegistry(registry)) {
  console.error(JSON.stringify(validateRegistry.errors, null, 2));
  fail("backlog registry does not match schema");
}

const contourIds = new Set(registry.contours.map((contour) => contour.id));
for (const contourId of requiredContours) {
  if (!contourIds.has(contourId)) {
    fail(`backlog registry is missing contour: ${contourId}`);
  }
}

for (const contour of registry.contours) {
  const absolutePath = path.join(root, contour.source_path);
  if (!fs.existsSync(absolutePath)) {
    fail(`backlog contour source path does not exist: ${contour.source_path}`);
  }

  if (contour.required_for_sprint_planning !== true) {
    fail(`backlog contour must be required for sprint planning: ${contour.id}`);
  }
}

const centralRows = [];
for (const contour of registry.contours) {
  if (centralContourIds.has(contour.id)) {
    centralRows.push(...validateCentralMarkdownContour(contour, availableScripts));
  }
}

const centralItems = new Map();
for (const item of centralRows) {
  if (centralItems.has(item.row.ID)) {
    const previous = centralItems.get(item.row.ID);
    fail(`duplicate central backlog ID: ${item.row.ID} in ${previous.source_path} and ${item.source_path}`);
  }
  centralItems.set(item.row.ID, item);
}

const xlsxProvenance = readJson(
  "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json",
);
const planningProblems = planningReadinessProblems({
  teamValidationStatus: xlsxProvenance.workbook.team_validation_status,
  backlogStatuses: Object.fromEntries(
    ["PBI-007", "PBI-008"].map((itemId) => [itemId, centralItems.get(itemId)?.row?.["Статус"]]),
  ),
});
if (planningProblems.length > 0) {
  fail(planningProblems[0]);
}

const traceability = readJson("docs/product/requirements/traceability-matrix.json");
const requirementIds = new Set(traceability.links.map((link) => link.requirement_id));
for (const link of traceability.links) {
  requireFile(link.source);
  for (const sourcePath of link.sources ?? []) {
    requireFile(sourcePath);
  }

  for (const itemId of link.backlog_items ?? []) {
    if (blockedTraceabilityPrefixes.some((prefix) => itemId.startsWith(prefix))) {
      fail(`traceability matrix uses non-canonical dangling backlog prefix: ${itemId}`);
    }
    if (centralItemPattern.test(itemId) && !centralItems.has(itemId)) {
      fail(`traceability matrix references unknown central backlog item: ${itemId}`);
    }
    if (requirementItemPattern.test(itemId) && !requirementIds.has(itemId)) {
      fail(`traceability matrix references unknown requirement item: ${itemId}`);
    }
    if (!centralItemPattern.test(itemId) && !requirementItemPattern.test(itemId)) {
      fail(`traceability matrix references unsupported backlog item ID: ${itemId}`);
    }
  }

  if (link.status === "implemented_baseline" && (!Array.isArray(link.tests) || link.tests.length === 0)) {
    fail(`implemented traceability link must have validation evidence: ${link.requirement_id}`);
  }
}

const sprintRoot = path.join(root, "docs/sprints");
const sprintFolders = fs.readdirSync(sprintRoot).filter((entry) =>
  fs.existsSync(path.join(sprintRoot, entry, "sprint-evidence-manifest.json")),
);

for (const sprintFolder of sprintFolders) {
  const backlogPath = path.join(sprintRoot, sprintFolder, "sprint-backlog.md");
  if (!fs.existsSync(backlogPath)) {
    fail(`sprint evidence folder is missing sprint-backlog.md: ${sprintFolder}`);
  }
  validateSprintBacklog(path.join("docs/sprints", sprintFolder, "sprint-backlog.md"));
}

console.log("backlog registry validation passed");
