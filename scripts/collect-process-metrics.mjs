import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const metricsManifestPath = "docs/process/current/process-metrics-manifest.json";
const snapshotJsonPath = "docs/process/current/process-metrics-snapshot.json";
const snapshotMdPath = "docs/process/current/process-metrics-snapshot.md";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeText(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content);
}

function listSprintFolders() {
  const sprintsRoot = path.join(root, "docs/sprints");
  return fs
    .readdirSync(sprintsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join("docs/sprints", entry.name))
    .sort();
}

const metricsManifest = readJson(metricsManifestPath);
const processEventLog = readJson("docs/process/current/process-event-log.json");
const artifactRegistry = readJson("docs/architecture/schemas/artifact-registry.json");
const processChangeLedger = readJson("docs/process/current/process-change-ledger.json");
const sprintFolders = listSprintFolders();
const sprintEvidenceManifestPaths = sprintFolders
  .map((folder) => path.join(folder, "sprint-evidence-manifest.json"))
  .filter((relativePath) => fs.existsSync(path.join(root, relativePath)));
const sprintEvidenceManifests = sprintEvidenceManifestPaths.map(readJson);

const allEvidenceChecks = sprintEvidenceManifests.flatMap((manifest) => manifest.checks ?? []);
const passedEvidenceChecks = allEvidenceChecks.filter((check) => check.status === "passed").length;
const pendingEvidenceChecks = allEvidenceChecks.filter((check) => check.status !== "passed").length;
const acceptedProcessChanges = processChangeLedger.entries.filter((entry) => entry.status === "accepted").length;
const qualityGatesPassed = metricsManifest.quality_gates.filter((gate) => gate.status === "passed").length;
const qualityGatesPendingExternal = metricsManifest.quality_gates.filter((gate) => gate.status === "pending_external").length;

const snapshot = {
  version: "0.1.0",
  status: "generated",
  period: metricsManifest.period,
  generated_at: "2026-06-22T00:00:00Z",
  source_paths: [
    metricsManifestPath,
    "docs/sprints",
    "docs/process/current/process-event-log.json",
    "docs/architecture/schemas/artifact-registry.json",
    "docs/process/current/process-change-ledger.json"
  ],
  counts: {
    sprint_folders: sprintFolders.length,
    sprint_evidence_manifests: sprintEvidenceManifestPaths.length,
    artifact_registry_entries: artifactRegistry.artifacts.length,
    accepted_process_changes: acceptedProcessChanges,
    passed_evidence_checks: passedEvidenceChecks,
    pending_evidence_checks: pendingEvidenceChecks,
    quality_gates_passed: qualityGatesPassed,
    quality_gates_pending_external: qualityGatesPendingExternal,
    process_events: processEventLog.events.length
  },
  derived_metrics: [
    {
      id: "DPM-001",
      name: "Sprint evidence coverage",
      value: `${sprintEvidenceManifestPaths.length}/${sprintFolders.length}`,
      calculation: "sprint_evidence_manifests / sprint_folders",
      evidence_paths: ["docs/sprints"]
    },
    {
      id: "DPM-002",
      name: "Artifact registry size",
      value: String(artifactRegistry.artifacts.length),
      calculation: "count(artifact_registry.artifacts)",
      evidence_paths: ["docs/architecture/schemas/artifact-registry.json"]
    },
    {
      id: "DPM-003",
      name: "Accepted process changes",
      value: String(acceptedProcessChanges),
      calculation: "count(process_change_ledger.entries where status == accepted)",
      evidence_paths: ["docs/process/current/process-change-ledger.json"]
    },
    {
      id: "DPM-004",
      name: "Evidence check pass ratio",
      value: `${passedEvidenceChecks}/${allEvidenceChecks.length}`,
      calculation: "passed sprint evidence checks / all sprint evidence checks",
      evidence_paths: sprintEvidenceManifestPaths
    },
    {
      id: "DPM-005",
      name: "External gate backlog",
      value: String(qualityGatesPendingExternal),
      calculation: "count(process quality gates where status == pending_external)",
      evidence_paths: [metricsManifestPath]
    },
    {
      id: "DPM-006",
      name: "Process event log entries",
      value: String(processEventLog.events.length),
      calculation: "count(process_event_log.events)",
      evidence_paths: ["docs/process/current/process-event-log.json"]
    }
  ],
  known_limitations: [
    "Snapshot считает только данные, уже зафиксированные в репозитории.",
    "Sprint predictability, spillover, cycle time и blocked time остаются недоступны без реальных командных timestamps."
  ],
  next_safe_step: "Поддерживать dated events для live delivery metrics после изменений delivery process."
};

const markdown = `# Process Metrics Snapshot

Статус: generated
Период: ${snapshot.period}
Дата генерации: ${snapshot.generated_at}

| Метрика | Значение | Расчет |
|---|---:|---|
${snapshot.derived_metrics.map((metric) => `| ${metric.name} | ${metric.value} | ${metric.calculation} |`).join("\n")}

## Counts

| Count | Value |
|---|---:|
| Sprint folders | ${snapshot.counts.sprint_folders} |
| Sprint evidence manifests | ${snapshot.counts.sprint_evidence_manifests} |
| Artifact registry entries | ${snapshot.counts.artifact_registry_entries} |
| Accepted process changes | ${snapshot.counts.accepted_process_changes} |
| Passed evidence checks | ${snapshot.counts.passed_evidence_checks} |
| Pending evidence checks | ${snapshot.counts.pending_evidence_checks} |
| Quality gates passed | ${snapshot.counts.quality_gates_passed} |
| Quality gates pending external | ${snapshot.counts.quality_gates_pending_external} |
| Process events | ${snapshot.counts.process_events} |

## Ограничения

${snapshot.known_limitations.map((item) => `- ${item}`).join("\n")}

## Следующий Безопасный Шаг

${snapshot.next_safe_step}
`;

writeText(snapshotJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`);
writeText(snapshotMdPath, markdown);

console.log(`process metrics snapshot written: ${snapshotJsonPath}`);
console.log(`process metrics snapshot report written: ${snapshotMdPath}`);
