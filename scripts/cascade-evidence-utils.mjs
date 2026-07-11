import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function absoluteRepoPath(root, relativePath) {
  const normalized = normalizeRepoPath(relativePath);
  const rootAbsolute = path.resolve(root);
  const rootReal = fs.realpathSync(rootAbsolute);
  if (rootReal !== rootAbsolute) {
    throw new Error(`repository root must not resolve through a symbolic link: ${root}`);
  }
  const absolutePath = path.resolve(rootAbsolute, normalized);
  if (absolutePath !== rootAbsolute && !absolutePath.startsWith(`${rootAbsolute}${path.sep}`)) {
    throw new Error(`unsafe repo path: ${relativePath}`);
  }

  let currentPath = rootAbsolute;
  for (const segment of normalized.split("/")) {
    currentPath = path.join(currentPath, segment);
    if (!fs.existsSync(currentPath)) {
      break;
    }
    if (fs.lstatSync(currentPath).isSymbolicLink()) {
      throw new Error(`repo path contains a symbolic link: ${relativePath}`);
    }
    const currentReal = fs.realpathSync(currentPath);
    if (currentReal !== rootReal && !currentReal.startsWith(`${rootReal}${path.sep}`)) {
      throw new Error(`repo path escapes repository root: ${relativePath}`);
    }
  }
  return absolutePath;
}

export function writeJsonExclusive(root, relativePath, data) {
  const absolutePath = absoluteRepoPath(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`, { flag: "wx" });
}

export function writeTextExclusive(root, relativePath, data) {
  const absolutePath = absoluteRepoPath(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, data, { flag: "wx" });
}

export function hashRepoPath(root, relativePath) {
  const absolutePath = absoluteRepoPath(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  const stat = fs.lstatSync(absolutePath);
  if (stat.isSymbolicLink()) {
    throw new Error(`baseline path must not be a symbolic link: ${relativePath}`);
  }
  const hash = crypto.createHash("sha256");
  if (stat.isDirectory()) {
    const files = [];
    const visit = (directory, prefix = "") => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const childPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
        const childPath = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(childPath, childPrefix);
        else if (entry.isFile()) files.push([childPrefix, fs.readFileSync(childPath)]);
        else throw new Error(`baseline directory contains unsupported entry: ${relativePath}/${childPrefix}`);
      }
    };
    visit(absolutePath);
    for (const [name, content] of files) {
      hash.update(name);
      hash.update("\u0000");
      hash.update(content);
    }
  } else {
    hash.update(fs.readFileSync(absolutePath));
  }
  return hash.digest("hex");
}

export function hashJsonDocument(data) {
  return sha256(`${JSON.stringify(data, null, 2)}\n`);
}

export function hashTextDocument(data) {
  return sha256(data);
}

export function expectedDryRunEvidencePaths(run) {
  return [
    run.impact_report_path,
    run.decision_queue_path,
    run.baseline_manifest_path,
    run.human_report_path,
    run.xlsx_change_analysis_path,
  ].filter(Boolean).map(normalizeRepoPath);
}

export function evidenceHashProblems(root, evidenceHashes, requiredPaths) {
  const problems = [];
  const normalizedRequiredPaths = requiredPaths.map(normalizeRepoPath);
  const requiredPathSet = new Set(normalizedRequiredPaths);
  const evidenceHashPaths = evidenceHashes.map((entry) => normalizeRepoPath(entry.path));
  const evidenceHashPathSet = new Set(evidenceHashPaths);

  if (requiredPathSet.size !== normalizedRequiredPaths.length) {
    problems.push("required dry-run evidence paths contain duplicates");
  }
  if (evidenceHashPathSet.size !== evidenceHashPaths.length) {
    problems.push("dry-run evidence hashes contain duplicate paths");
  }
  for (const requiredPath of requiredPathSet) {
    if (!evidenceHashPathSet.has(requiredPath)) {
      problems.push(`dry-run evidence hash is missing: ${requiredPath}`);
    }
  }
  for (const evidencePath of evidenceHashPathSet) {
    if (!requiredPathSet.has(evidencePath)) {
      problems.push(`unexpected dry-run evidence hash: ${evidencePath}`);
    }
  }
  for (const evidenceHash of evidenceHashes) {
    if (hashRepoPath(root, evidenceHash.path) !== evidenceHash.sha256) {
      problems.push(`dry-run evidence hash mismatch: ${evidenceHash.path}`);
    }
  }
  return problems;
}

export function renderImpactMarkdown(report, reportDirectory) {
  const rows = report.impact_cone.impacted_artifacts.map((artifact) =>
    `| [${artifact.path}](${path.posix.relative(reportDirectory, artifact.path)}) | ${artifact.impact_directions.join(", ")} | ${artifact.review_obligation} |`,
  );
  return [
    "# Отчет о каскадном влиянии",
    "",
    "Служебный отчет процесса. Источником проверяемых данных является соседний JSON-отчет.",
    "",
    `Измененный источник: [${report.target_artifact}](${path.posix.relative(reportDirectory, report.target_artifact)})`,
    "",
    "| Артефакт | Направление проверки | Требуемое действие |",
    "| --- | --- | --- |",
    ...rows,
    "",
    `Открытых решений владельца: ${report.blocking_user_decisions.length}.`,
    `Статус: ${report.completion_status}.`,
    "",
  ].join("\n");
}

export function renderVerificationMarkdown(evidence, reportDirectory) {
  const rows = evidence.artifact_resolution_refs.map((artifact) =>
    `| [${artifact.path}](${path.posix.relative(reportDirectory, artifact.path)}) | ${artifact.verification_status} |`,
  );
  return [
    "# Проверка завершения каскада",
    "",
    "Служебный evidence-отчет. Продуктовый смысл хранится в исходных бизнесовых артефактах.",
    "",
    `Статус: ${evidence.status}.`,
    "",
    "| Артефакт | Проверка |",
    "| --- | --- |",
    ...rows,
    "",
    `Проверок выполнено: ${evidence.validation_results.length}.`,
    `Блокирующих причин: ${evidence.blocking_reasons.length}.`,
    "",
  ].join("\n");
}
