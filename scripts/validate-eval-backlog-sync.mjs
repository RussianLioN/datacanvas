import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const backlogPath = "docs/product/backlog/eval-backlog.md";
const evalCasesPath = "tests/evals/eval-cases.json";
const requiredEvalIds = ["EVAL-001", "EVAL-002", "EVAL-003", "EVAL-004", "EVAL-005", "EVAL-006"];
const requiredCategories = ["happy_path", "negative", "security", "visual", "regression"];
const requiredColumns = ["ID", "Название", "Тип", "Категория", "Связь", "Обязательность", "Статус", "Evidence"];

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
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

function parseFirstMarkdownTable(relativePath) {
  const lines = readText(relativePath).split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].trim().startsWith("|") || !isSeparatorRow(lines[index + 1])) {
      continue;
    }

    const headers = splitTableRow(lines[index]);
    const rows = [];
    let rowIndex = index + 2;
    while (rowIndex < lines.length && lines[rowIndex].trim().startsWith("|")) {
      const values = splitTableRow(lines[rowIndex]);
      const row = {};
      headers.forEach((header, cellIndex) => {
        row[header] = values[cellIndex] ?? "";
      });
      rows.push(row);
      rowIndex += 1;
    }
    return { headers, rows };
  }

  fail(`missing Markdown table: ${relativePath}`);
}

function normalizeText(value) {
  return value.replace(/`/g, "").replace(/\s+/g, " ").trim();
}

function normalizeEvidence(value) {
  return value
    .split(/<br\s*\/?>|,/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function validateEvidence(evidenceValue, packageScripts) {
  const evidence = normalizeEvidence(evidenceValue);
  if (evidence.length === 0) {
    fail("eval backlog row has no executable evidence");
  }

  for (const item of evidence) {
    if (item === "npm test") {
      continue;
    }
    if (item.startsWith("npm run ")) {
      const scriptName = item.slice("npm run ".length).trim();
      if (!(scriptName in packageScripts)) {
        fail(`eval evidence references missing npm script: ${item}`);
      }
      continue;
    }
    requireFile(item);
  }

  return evidence;
}

const table = parseFirstMarkdownTable(backlogPath);
for (const requiredColumn of requiredColumns) {
  if (!table.headers.includes(requiredColumn)) {
    fail(`eval backlog is missing required column: ${requiredColumn}`);
  }
}

const cases = readJson(evalCasesPath).cases;
const packageJson = readJson("package.json");
const packageScripts = packageJson.scripts ?? {};
const traceability = readJson("docs/product/requirements/traceability-matrix.json");
const knownRequirementIds = new Set(traceability.links.map((link) => link.requirement_id));

const casesById = new Map(cases.map((testCase) => [testCase.id, testCase]));
const backlogRowsById = new Map(table.rows.map((row) => [row.ID, row]));

for (const requiredId of requiredEvalIds) {
  if (!backlogRowsById.has(requiredId)) {
    fail(`eval backlog is missing required ID: ${requiredId}`);
  }
  if (!casesById.has(requiredId)) {
    fail(`eval cases are missing required ID: ${requiredId}`);
  }
}

for (const row of table.rows) {
  if (!/^EVAL-\d{3}$/.test(row.ID)) {
    fail(`eval backlog has invalid ID: ${row.ID}`);
  }
  const testCase = casesById.get(row.ID);
  if (!testCase) {
    fail(`eval backlog ID has no executable case: ${row.ID}`);
  }
  if (normalizeText(row["Название"]) !== normalizeText(testCase.title)) {
    fail(`eval title drift for ${row.ID}`);
  }
  if (row["Тип"] !== testCase.type) {
    fail(`eval type drift for ${row.ID}`);
  }
  if (row["Категория"] !== testCase.category) {
    fail(`eval category drift for ${row.ID}`);
  }
  if (row["Статус"] !== testCase.status) {
    fail(`eval status drift for ${row.ID}`);
  }
  const isRequired = row["Обязательность"] === "required";
  if (isRequired !== testCase.required) {
    fail(`eval required/optional drift for ${row.ID}`);
  }
  if (row["Связь"] !== testCase.requirement_id) {
    fail(`eval requirement link drift for ${row.ID}`);
  }
  if (!knownRequirementIds.has(testCase.requirement_id)) {
    fail(`eval case references unknown requirement: ${row.ID} -> ${testCase.requirement_id}`);
  }

  const backlogEvidence = validateEvidence(row.Evidence, packageScripts);
  for (const evidence of testCase.executable_evidence) {
    validateEvidence(evidence, packageScripts);
  }
  if (!backlogEvidence.includes(evalCasesPath)) {
    fail(`eval backlog evidence must include executable cases file: ${row.ID}`);
  }
}

for (const category of requiredCategories) {
  if (!cases.some((testCase) => testCase.required === true && testCase.category === category)) {
    fail(`missing required eval category: ${category}`);
  }
}

console.log("eval backlog sync validation passed");
