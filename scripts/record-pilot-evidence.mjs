import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const outputPaths = {
  pilotReport: "docs/release/pilot-report.md",
  portabilityNotes: "docs/release/pilot-process-portability-notes.md",
  commitPrEvidence: "docs/release/commit-pr-evidence.md",
};

const requiredFiles = [
  "artifacts/manual/real-uat/review-runtime-state-export.json",
  "docs/product/ux/human-review-session-real.json",
  "docs/release/mvp-release-evidence-pack.json",
  "docs/architecture/security/data-leakage-manifest.json",
  "docs/process/portability/process-portability-pack.json",
  "docs/process/audits/plan-completion-audit.json",
];

const qualityGateCommands = [
  ["npm", ["test"]],
  ["npm", ["run", "validate:pilot-gate"]],
  ["npm", ["run", "validate:process-portability"]],
  ["npm", ["run", "validate:plan-completion-audit"]],
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function writeText(relativePath, content) {
  fs.mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
  fs.writeFileSync(path.join(root, relativePath), content);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    skipChecks: false,
    decision: "accepted",
    ciStatus: "passed",
    reviewStatus: "pending_review",
    mergeStatus: "not_merged",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--skip-checks") {
      args.skipChecks = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        fail(`missing value for ${arg}`);
      }
      args[key] = value;
      i += 1;
    } else {
      fail(`unknown argument: ${arg}`);
    }
  }
  return args;
}

function requireArg(args, key, flag) {
  if (!args[key] || String(args[key]).trim() === "") {
    fail(`required argument is missing: ${flag}`);
  }
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.status !== 0) {
    fail(`command failed: ${[command, ...commandArgs].join(" ")}`);
  }
  return options.capture ? result.stdout.trim() : "";
}

function runQualityGates(skipChecks) {
  if (skipChecks) {
    return qualityGateCommands.map(([command, commandArgs]) => ({
      command: [command, ...commandArgs].join(" "),
      status: "skipped_by_operator_flag",
    }));
  }
  return qualityGateCommands.map(([command, commandArgs]) => {
    run(command, commandArgs);
    return {
      command: [command, ...commandArgs].join(" "),
      status: "passed",
    };
  });
}

function assertRealUatArtifacts() {
  for (const filePath of requiredFiles) {
    if (!exists(filePath)) {
      fail(`required file does not exist: ${filePath}`);
    }
  }

  const runtimeState = readJson("artifacts/manual/real-uat/review-runtime-state-export.json");
  const realSession = readJson("docs/product/ux/human-review-session-real.json");
  const unsafeActorPattern = /fixture|template|sample|placeholder|interactive-|TO_BE_FILLED/i;

  if (runtimeState.status !== "recorded_real_user" || runtimeState.session_kind !== "real_user") {
    fail("runtime state must be recorded_real_user and real_user");
  }
  if (runtimeState.current_state !== "approved") {
    fail("runtime state must be approved before pilot evidence recording");
  }
  if (realSession.status !== "recorded_real_user" || realSession.session_kind !== "real_user") {
    fail("human review session must be recorded_real_user and real_user");
  }
  if (realSession.review_state !== "approved" || realSession.decision !== "accepted") {
    fail("human review session must be approved and accepted");
  }
  if (JSON.stringify(runtimeState).includes("TO_BE_FILLED") || JSON.stringify(realSession).includes("TO_BE_FILLED")) {
    fail("real UAT evidence contains TO_BE_FILLED placeholder");
  }
  if (unsafeActorPattern.test(realSession.actor.actor_id)) {
    fail(`real UAT session contains unsafe actor_id marker: ${realSession.actor.actor_id}`);
  }
  for (const event of realSession.audit_events) {
    if (unsafeActorPattern.test(event.actor_id)) {
      fail(`real UAT session contains unsafe actor_id marker: ${event.actor_id}`);
    }
  }
}

function renderCommitPrEvidence(context) {
  return `# Commit And PR Evidence

Статус: recorded release evidence

## Metadata

- Process version: \`0.1.0\`
- Evidence date: \`${context.timestamp}\`
- Release owner: \`${context.releaseOwner}\`

## Commit Evidence

- Commit SHA: \`${context.gitSha}\`
- Commit URL or local verification command: \`${context.releaseRecord}\`
- Branch: \`${context.gitBranchStatus.split("\n")[0]}\`
- Working tree status at release cut:

\`\`\`text
${context.gitBranchStatus}
\`\`\`

## Pull Request Evidence

- PR URL or identifier: \`${context.prUrl || context.releaseRecord}\`
- Review status: \`${context.reviewStatus}\`
- CI status: \`${context.ciStatus}\`
- Merge status: \`${context.mergeStatus}\`

## Required Verification

\`\`\`text
git rev-parse HEAD: ${context.gitSha}
git status --short --branch:
${context.gitBranchStatus}
${context.gateResults.map((item) => `${item.command}: ${item.status}`).join("\n")}
\`\`\`

## Release Evidence Links

- Release evidence pack: \`docs/release/mvp-release-evidence-pack.json\`
- Pilot report: \`docs/release/pilot-report.md\`
- Completion audit: \`docs/process/audits/plan-completion-audit.json\`
`;
}

function renderPilotReport(context) {
  const gateEvidence = {
    G1: "tests/fixtures/input-package-minimal.json",
    G2: "tests/golden/normalized-data-minimal.json",
    G3: "tests/golden/presentation-spec-minimal.json",
    G4: "artifacts/examples/render-result-minimal.json",
    G5: "tests/golden/trace-manifest-minimal.json",
    G6: "docs/architecture/security/data-leakage-manifest.json",
    G7: "tests/evals/eval-cases.json",
    G8: "docs/architecture/observability/operational-readiness-manifest.json",
    G9: "docs/product/ux/human-review-session-real.json",
    G10: "docs/release/commit-pr-evidence.md",
  };

  return `# Pilot Report

Статус: recorded pilot result

## Metadata

- Process version: \`0.1.0\`
- Pilot date: \`${context.timestamp}\`
- Pilot owner: \`${context.pilotOwner}\`
- Commit SHA: \`${context.gitSha}\`
- PR evidence: \`${context.prUrl || context.releaseRecord}\`

## Review Evidence

- Real UAT runtime export: \`artifacts/manual/real-uat/review-runtime-state-export.json\`
- Real human review session: \`docs/product/ux/human-review-session-real.json\`
- Release evidence pack: \`docs/release/mvp-release-evidence-pack.json\`
- Data leakage manifest after real UAT: \`docs/architecture/security/data-leakage-manifest.json\`
- Process portability notes: \`docs/release/pilot-process-portability-notes.md\`
- Commit/PR evidence: \`docs/release/commit-pr-evidence.md\`

## Gate Decisions

| Gate | Decision | Evidence | Notes |
| --- | --- | --- | --- |
| G1 Input Package | \`${context.decision}\` | \`${gateEvidence.G1}\` | Минимальный входной пакет проходит contract gate. |
| G2 Normalization | \`${context.decision}\` | \`${gateEvidence.G2}\` | Нормализация воспроизводится golden-командой. |
| G3 PresentationSpec | \`${context.decision}\` | \`${gateEvidence.G3}\` | PresentationSpec валидируется схемой. |
| G4 Renderer Export | \`${context.decision}\` | \`${gateEvidence.G4}\` | Renderer export связан с HTML/PDF/PNG smoke evidence. |
| G5 Traceability | \`${context.decision}\` | \`${gateEvidence.G5}\` | Trace manifest связывает run/source/fact/slide/artifact. |
| G6 Security | \`${context.decision}\` | \`${gateEvidence.G6}\` | Secret scan и data leakage gate включены в quality gate. |
| G7 Quality/Evals | \`${context.decision}\` | \`${gateEvidence.G7}\` | Eval pack и regression checks включены в npm test. |
| G8 Ops Readiness | \`${context.decision}\` | \`${gateEvidence.G8}\` | Operational readiness manifest проходит проверку. |
| G9 Real UAT | \`${context.decision}\` | \`${gateEvidence.G9}\` | Real UAT записан как recorded_real_user и accepted. |
| G10 Pilot Gate | \`${context.decision}\` | \`${gateEvidence.G10}\` | Pilot decision связан с release record и quality gate. |

## Quality Gate Results

\`\`\`text
${context.gateResults.map((item) => `${item.command}: ${item.status}`).join("\n")}
\`\`\`

## Pilot Outcome

- Decision: \`${context.decision}\`
- Blocking issues: \`${context.decision === "accepted" ? "none_recorded" : "see_follow_up"}\`
- Required follow-up: \`${context.followUp}\`

## Completion Audit Update

После записи этого отчета completion audit должен быть обновлен только если одновременно существуют \`docs/release/pilot-process-portability-notes.md\`, \`docs/release/commit-pr-evidence.md\` и подтвержденный quality gate.
`;
}

function renderPortabilityNotes(context) {
  return `# Pilot Process Portability Notes

Статус: recorded portability review

## Metadata

- Process version: \`0.1.0\`
- Pilot date: \`${context.timestamp}\`
- Reviewer: \`${context.reviewer}\`
- Target reuse context: \`${context.targetReuseContext}\`

## Reusable Parts

- Scrum cadence: недельный sprint cadence можно переносить как default с управляемым PCR для изменения длины.
- Process Change Request flow: PCR flow переносим без изменений при наличии Process Owner.
- Sprint evidence pack: структура sprint evidence pack переносима для проектов с artifact-driven delivery.
- Artifact registry and hash manifest: переносимы как контроль воспроизводимости и ownership.
- Quality gates: переносимы как принцип, но список команд адаптируется под стек проекта.
- Completion audit: переносим как финальный guardrail против закрытия плана без evidence.

## Project-Specific Parts

- Product-specific UX/UAT flow: review runtime и human-review session завязаны на DataCanvas.
- Presentation renderer artifacts: HTML/PDF/PNG renderer относится к DataCanvas.
- DataCanvas-specific schemas: PresentationSpec, RenderResult и trace fields нужно адаптировать под домен.
- Domain-specific risks: unsupported claims, visual defects и source traceability завязаны на презентации.

## Migration Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Перенос без адаптации quality gates | Gate будет проверять чужие артефакты | Создать project-specific gate map перед Sprint 0 |
| Нет Process Owner | PCR flow станет формальностью | Назначить владельца процесса до первого sprint planning |
| Нет artifact registry | Completion audit потеряет проверяемость | Включить registry и hash manifest в bootstrap |

## Required Adaptations

- Заменить DataCanvas-specific schemas на схемы целевого продукта.
- Переписать UAT flow под реальные роли и пользовательские действия целевого продукта.
- Обновить quality gate commands под runtime, test framework и release workflow целевого проекта.
- Зафиксировать новый threat model delta и tool allowlist.

## Process Change Candidates

- Добавить \`pilot:record\` как стандартный recorder для external evidence.
- Разделить pre-pilot readiness validators и post-pilot acceptance validators.

## G11 Decision

- Decision: \`${context.decision}\`
- Evidence: \`docs/release/pilot-report.md\`, \`docs/release/commit-pr-evidence.md\`, \`docs/process/portability/process-portability-pack.json\`
- Follow-up: \`${context.followUp}\`
`;
}

const args = parseArgs(process.argv.slice(2));
requireArg(args, "pilotOwner", "--pilot-owner");
requireArg(args, "releaseOwner", "--release-owner");
requireArg(args, "reviewer", "--reviewer");
requireArg(args, "targetReuseContext", "--target-reuse-context");
requireArg(args, "releaseRecord", "--release-record");
requireArg(args, "followUp", "--follow-up");

if (!["accepted", "rejected"].includes(args.decision)) {
  fail("--decision must be accepted or rejected");
}
if (args.dryRun === false) {
  for (const outputPath of Object.values(outputPaths)) {
    if (exists(outputPath)) {
      fail(`refusing to overwrite existing pilot evidence: ${outputPath}`);
    }
  }
}

assertRealUatArtifacts();

const context = {
  timestamp: new Date().toISOString(),
  pilotOwner: args.pilotOwner,
  releaseOwner: args.releaseOwner,
  reviewer: args.reviewer,
  targetReuseContext: args.targetReuseContext,
  releaseRecord: args.releaseRecord,
  prUrl: args.prUrl || "",
  ciStatus: args.ciStatus,
  reviewStatus: args.reviewStatus,
  mergeStatus: args.mergeStatus,
  decision: args.decision,
  followUp: args.followUp,
  gitSha: run("git", ["rev-parse", "HEAD"], { capture: true }),
  gitBranchStatus: run("git", ["status", "--short", "--branch"], { capture: true }),
  gateResults: runQualityGates(args.skipChecks),
};

const rendered = {
  [outputPaths.commitPrEvidence]: renderCommitPrEvidence(context),
  [outputPaths.pilotReport]: renderPilotReport(context),
  [outputPaths.portabilityNotes]: renderPortabilityNotes(context),
};

if (args.dryRun) {
  console.log("pilot evidence dry-run passed; files were not written");
  for (const outputPath of Object.keys(rendered)) {
    console.log(`would write: ${outputPath}`);
  }
} else {
  for (const [outputPath, content] of Object.entries(rendered)) {
    writeText(outputPath, content);
    console.log(`written: ${outputPath}`);
  }
  console.log("pilot evidence recorded; update completion audit after reviewing generated files");
}
