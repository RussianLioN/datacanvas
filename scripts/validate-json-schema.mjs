import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const co2026001RunRoot = "docs/process/cascading-governance/runs/2026-07-02-co-2026-001-q3-priority-impact";

const cases = [
  {
    schema: "schemas/input-package.schema.json",
    data: "tests/fixtures/input-package-minimal.json",
  },
  {
    schema: "schemas/presentation-spec.schema.json",
    data: "tests/golden/presentation-spec-minimal.json",
  },
  {
    schema: "schemas/normalized-data.schema.json",
    data: "tests/golden/normalized-data-minimal.json",
  },
  {
    schema: "schemas/trace-manifest.schema.json",
    data: "tests/golden/trace-manifest-minimal.json",
  },
  {
    schema: "schemas/provider-allowlist.schema.json",
    data: "docs/architecture/llm/provider-allowlist.json",
  },
  {
    schema: "schemas/provider-budget.schema.json",
    data: "docs/architecture/llm/provider-budget.json",
  },
  {
    schema: "schemas/provider-experiment-result.schema.json",
    data: "docs/architecture/llm/provider-experiment-result-template.json",
  },
  {
    schema: "schemas/provider-specific-eval-delta.schema.json",
    data: "tests/evals/provider-specific-eval-delta.json",
  },
  {
    schema: "schemas/backlog-registry.schema.json",
    data: "docs/product/backlog/backlog-registry.json",
  },
  {
    schema: "schemas/operational-readiness-manifest.schema.json",
    data: "docs/architecture/observability/operational-readiness-manifest.json",
  },
  {
    schema: "schemas/human-review-flow.schema.json",
    data: "docs/product/ux/human-review-flow.json",
  },
  {
    schema: "schemas/uat-manifest.schema.json",
    data: "docs/product/ux/uat-manifest.json",
  },
  {
    schema: "schemas/uat-result.schema.json",
    data: "docs/product/ux/uat-result-minimal.json",
  },
  {
    schema: "schemas/review-ui-fixture.schema.json",
    data: "docs/product/ux/review-ui-fixture.json",
  },
  {
    schema: "schemas/review-runtime-state.schema.json",
    data: "docs/product/ux/review-runtime-state-fixture.json",
  },
  {
    schema: "schemas/review-runtime-interactive.schema.json",
    data: "docs/product/ux/review-runtime-interactive.json",
  },
  {
    schema: "schemas/review-runtime-browser-matrix.schema.json",
    data: "docs/product/ux/review-runtime-browser-matrix.json",
  },
  {
    schema: "schemas/review-runtime-browser-smoke.schema.json",
    data: "docs/product/ux/review-runtime-browser-smoke.json",
  },
  {
    schema: "schemas/human-review-session.schema.json",
    data: "docs/product/ux/human-review-session-minimal.json",
  },
  {
    schema: "schemas/human-review-session.schema.json",
    data: "docs/product/ux/human-review-session-real.template.json",
  },
  {
    schema: "schemas/real-uat-gate-readiness.schema.json",
    data: "docs/product/ux/real-uat-gate-readiness.json",
  },
  {
    schema: "schemas/real-uat-runtime-import.schema.json",
    data: "docs/product/ux/real-uat-runtime-import.json",
  },
  {
    schema: "schemas/real-uat-operator-handoff.schema.json",
    data: "docs/product/ux/real-uat-operator-handoff.json",
  },
  {
    schema: "schemas/real-uat-preflight-checklist.schema.json",
    data: "docs/product/ux/real-uat-preflight-checklist.json",
  },
  {
    schema: "schemas/real-uat-session-importer.schema.json",
    data: "docs/product/ux/real-uat-session-importer.json",
  },
  {
    schema: "schemas/real-uat-one-command-runner.schema.json",
    data: "docs/product/ux/real-uat-one-command-runner.json",
  },
  {
    schema: "schemas/release-evidence-pack.schema.json",
    data: "docs/release/mvp-release-evidence-pack.json",
  },
  {
    schema: "schemas/pilot-gate-readiness.schema.json",
    data: "docs/release/pilot-gate-readiness.json",
  },
  {
    schema: "schemas/pilot-execution-handoff.schema.json",
    data: "docs/release/pilot-execution-handoff.json",
  },
  {
    schema: "schemas/export-smoke-manifest.schema.json",
    data: "artifacts/examples/export-smoke-manifest.json",
  },
  {
    schema: "schemas/export-png-pixel-smoke.schema.json",
    data: "docs/product/ux/export-png-pixel-smoke.json",
  },
  {
    schema: "schemas/renderer-regression-manifest.schema.json",
    data: "artifacts/examples/renderer-regression-manifest.json",
  },
  {
    schema: "schemas/artifact-hash-manifest.schema.json",
    data: "docs/architecture/schemas/artifact-hash-manifest.json",
  },
  {
    schema: "schemas/security-foundation-manifest.schema.json",
    data: "docs/architecture/security/security-foundation-manifest.json",
  },
  {
    schema: "schemas/threat-model-delta-manifest.schema.json",
    data: "docs/architecture/security/threat-model-delta-manifest.json",
  },
  {
    schema: "schemas/data-leakage-manifest.schema.json",
    data: "docs/architecture/security/data-leakage-manifest.json",
  },
  {
    schema: "schemas/real-uat-leakage-guard.schema.json",
    data: "docs/architecture/security/real-uat-leakage-guard.json",
  },
  {
    schema: "schemas/bmc-question-bank.schema.json",
    data: "docs/product/bmc/bmc-interview-question-bank.json",
  },
  {
    schema: "schemas/bmc-interview-runtime-state.schema.json",
    data: "docs/product/bmc/interviews/active-bmc-interview-runtime-state.json",
  },
  {
    schema: "schemas/bmc-route-decisions.schema.json",
    data: "docs/product/bmc/interviews/active-bmc-route-decisions.json",
  },
  {
    schema: "schemas/bmc-interview-runtime-state.schema.json",
    data: "docs/product/bmc/interviews/2026-W26-bmc-interview-runtime-state.json",
  },
  {
    schema: "schemas/bmc-route-decisions.schema.json",
    data: "docs/product/bmc/interviews/2026-W26-bmc-route-decisions.json",
  },
  {
    schema: "schemas/bmc-interview-answers.schema.json",
    data: "docs/product/bmc/interviews/2026-W26-interview-answers.json",
  },
  {
    schema: "schemas/bmc-user-evidence.schema.json",
    data: "docs/product/bmc/interviews/2026-W26-user-evidence.json",
  },
  {
    schema: "schemas/bmc-interview-results.schema.json",
    data: "docs/product/bmc/interviews/2026-W26-bmc-interview-results.json",
  },
  {
    schema: "schemas/bmc-trace.schema.json",
    data: "docs/product/bmc/bmc-trace.v0.1.json",
  },
  {
    schema: "schemas/bmc-derived-manifest.schema.json",
    data: "docs/product/bmc/bmc-derived-manifest.json",
  },
  {
    schema: "schemas/bmc-package-manifest.schema.json",
    data: "docs/product/bmc/manifest.json",
  },
  {
    schema: "schemas/bmc-visual-acceptance.schema.json",
    data: "docs/product/bmc/evidence/bmc-visual-acceptance.json",
  },
  {
    schema: "schemas/bmc-validation-needs.schema.json",
    data: "docs/product/bmc/bmc-validation-needs.json",
  },
  {
    schema: "schemas/interview-session.schema.json",
    data: "docs/product/interviews/ba-sa/active-interview-runtime-state.json",
  },
  {
    schema: "schemas/interview-answer-set.schema.json",
    data: "docs/product/interviews/ba-sa/interview-answer-set.json",
  },
  {
    schema: "schemas/ba-spec.schema.json",
    data: "docs/product/analysis/ba/ba-spec.json",
  },
  {
    schema: "schemas/sa-spec.schema.json",
    data: "docs/architecture/system-analysis/sa-spec.json",
  },
  {
    schema: "schemas/product-change-order.schema.json",
    data: "docs/product/change-orders/co-2026-001-a2a-first-priority.json",
  },
  {
    schema: "schemas/product-change-order.schema.json",
    data: "docs/product/change-orders/co-2026-002-agent-launch-delivery-scope.json",
  },
  {
    schema: "schemas/product-change-questionnaire-state.schema.json",
    data: "docs/product/change-orders/co-2026-001-acceptance-questionnaire-state.json",
  },
  {
    schema: "schemas/product-change-order.schema.json",
    data: "docs/product/change-orders/co-2026-003-q4-lisa-profile.json",
  },
  {
    schema: "schemas/product-change-questionnaire-state.schema.json",
    data: "docs/product/change-orders/co-2026-003-q4-lisa-profile-questionnaire-state.json",
  },
  {
    schema: "schemas/change-impact-assessment.schema.json",
    data: "docs/product/change-orders/change-impact-assessment.json",
  },
  {
    schema: "schemas/change-impact-assessment.schema.json",
    data: "docs/product/change-orders/co-2026-002-agent-launch-delivery-scope-impact.json",
  },
  {
    schema: "schemas/product-source-registry.schema.json",
    data: "docs/product/sources/product-source-registry.json",
  },
  {
    schema: "schemas/xlsx-backlog-provenance.schema.json",
    data: "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json",
  },
  {
    schema: "schemas/xlsx-opml-jira-recovery-index.schema.json",
    data: "docs/product/sources/xlsx-opml-jira-recovery-index.json",
  },
  {
    schema: "schemas/business-artifact-content-contract.schema.json",
    data: "docs/process/universal-documentation-workflow/business-artifact-content-contract.json",
  },
  {
    schema: "schemas/business-artifact-generation-contract.schema.json",
    data: "docs/process/universal-documentation-workflow/business-artifact-generation-contract.json",
  },
  {
    schema: "schemas/main-artifact-lifecycle-chain.schema.json",
    data: "docs/process/universal-documentation-workflow/main-artifact-lifecycle-chain.json",
  },
  {
    schema: "schemas/product-vision-manifest.schema.json",
    data: "docs/product/vision/manifest.json",
  },
  {
    schema: "schemas/proposed-change-set.schema.json",
    data: "docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json",
  },
  {
    schema: "schemas/revision-approval-state.schema.json",
    data: "docs/product/revisions/co-2026-001-source-revision/revision-approval-state.json",
  },
  {
    schema: "schemas/documentation-change-request.schema.json",
    data: "docs/process/cascading-governance/documentation-change-request.json",
  },
  {
    schema: "schemas/documentation-change-request.schema.json",
    data: `${co2026001RunRoot}/documentation-change-request-2026-07-02-002.json`,
  },
  {
    schema: "schemas/documentation-change-request.schema.json",
    data: "tests/fixtures/cascading-governance/vision-change-request.json",
  },
  {
    schema: "schemas/artifact-dependency-graph.schema.json",
    data: "docs/process/cascading-governance/artifact-dependency-graph.json",
  },
  {
    schema: "schemas/cascade-impact-cone.schema.json",
    data: "tests/fixtures/cascading-governance/cascade-impact-cone.json",
  },
  {
    schema: "schemas/impact-analysis-report.schema.json",
    data: "docs/process/cascading-governance/impact-analysis-report.json",
  },
  {
    schema: "schemas/impact-analysis-report.schema.json",
    data: `${co2026001RunRoot}/impact-analysis-report-2026-07-02-002.json`,
  },
  {
    schema: "schemas/impact-analysis-report.schema.json",
    data: "tests/fixtures/cascading-governance/vision-impact-analysis-report.json",
  },
  {
    schema: "schemas/user-decision-queue.schema.json",
    data: "docs/process/cascading-governance/user-decision-queue.json",
  },
  {
    schema: "schemas/user-decision-queue.schema.json",
    data: `${co2026001RunRoot}/user-decision-queue-2026-07-02-002.json`,
  },
  {
    schema: "schemas/cascade-baseline-manifest.schema.json",
    data: "tests/fixtures/cascading-governance/cascade-baseline-manifest.json",
  },
  {
    schema: "schemas/cascade-resolution-input.schema.json",
    data: "tests/fixtures/cascading-governance/cascade-resolution-input.json",
  },
  {
    schema: "schemas/cascade-verification-evidence.schema.json",
    data: "tests/fixtures/cascading-governance/cascade-verification-evidence.json",
  },
  {
    schema: "schemas/cascade-source-identity.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/source-identity.json",
  },
  {
    schema: "schemas/cascade-source-change-analysis.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/source-change-analysis.json",
  },
  {
    schema: "schemas/cascade-semantic-impact-report.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/semantic-impact-report.json",
  },
  {
    schema: "schemas/cascade-actual-diff-manifest.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/actual-diff-manifest.json",
  },
  {
    schema: "schemas/cascade-validation-manifest.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/validation-manifest.json",
  },
  {
    schema: "schemas/cascade-runtime-manifest.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/runtime-manifest.json",
  },
  {
    schema: "schemas/cascade-owner-question-packet.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/owner-question-packet.json",
  },
  {
    schema: "schemas/cascade-acceptance-authority.schema.json",
    data: "docs/process/cascading-governance/acceptance-authority.json",
  },
  {
    schema: "schemas/cascade-acceptance-vnext.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/acceptance.json",
  },
  {
    schema: "schemas/cascade-vnext-run.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/run.json",
  },
  {
    schema: "schemas/cascade-completion-seal.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/completion-seal.json",
  },
  {
    schema: "schemas/cascade-completion-evidence.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/completion-evidence.json",
  },
  {
    schema: "schemas/cascade-profile-evidence.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/profile-evidence.json",
  },
  {
    schema: "schemas/cascade-resolution-report.schema.json",
    data: "tests/fixtures/cascading-governance/vnext/resolution-report.json",
  },
  {
    schema: "schemas/cascade-supersession-ledger.schema.json",
    data: "docs/process/cascading-governance/supersession-ledger.json",
  },
  {
    schema: "schemas/capacity-plan.schema.json",
    data: "docs/process/cascading-governance/capacity-plan-2026-q3.json",
  },
  {
    schema: "schemas/reprioritization-impact-report.schema.json",
    data: "docs/process/cascading-governance/reprioritization-impact-report.json",
  },
  {
    schema: "schemas/reprioritization-impact-report.schema.json",
    data: `${co2026001RunRoot}/reprioritization-impact-report-2026-07-02-002.json`,
  },
  {
    schema: "schemas/reprioritization-impact-report.schema.json",
    data: "tests/fixtures/cascading-governance/backlog-reprioritization-over-capacity.json",
  },
  {
    schema: "schemas/reprioritization-impact-report.schema.json",
    data: "tests/fixtures/cascading-governance/backlog-reprioritization-enough-capacity.json",
  },
  {
    schema: "schemas/reprioritization-impact-report.schema.json",
    data: "tests/fixtures/cascading-governance/backlog-reprioritization-missing-capacity.json",
  },
  {
    schema: "schemas/reprioritization-impact-report.schema.json",
    data: "tests/fixtures/cascading-governance/user-rejects-story-move.json",
  },
  {
    schema: "schemas/reprioritization-impact-report.schema.json",
    data: "tests/fixtures/cascading-governance/user-confirms-story-move-q4.json",
  },
  {
    schema: "schemas/cascading-update-run.schema.json",
    data: "docs/process/cascading-governance/runs/2026-07-02-cascade-contract/cascading-update-run.json",
  },
  {
    schema: "schemas/cascading-update-run.schema.json",
    data: `${co2026001RunRoot}/cascading-update-run-2026-07-02-002.json`,
  },
  {
    schema: "schemas/xlsx-change-analysis.schema.json",
    data: "tests/fixtures/cascading-governance/xlsx-change-analysis-valid.json",
  },
  {
    schema: "schemas/jira-field-mapping-request.schema.json",
    data: "docs/process/cascading-governance/jira-field-mapping-request.json",
  },
  {
    schema: "schemas/jira-field-mapping-request.schema.json",
    data: "tests/fixtures/cascading-governance/jira-field-mapping-unresolved.json",
  },
  {
    schema: "schemas/jira-story-import-contract.schema.json",
    data: "docs/process/cascading-governance/jira-story-import-contract.json",
  },
  {
    schema: "schemas/jira-import-package-manifest.schema.json",
    data: "docs/process/cascading-governance/jira-import-package-manifest.json",
  },
  {
    schema: "schemas/interview-derived-coverage.schema.json",
    data: "docs/product/analysis/ba-sa/interview-derived-coverage.json",
  },
  {
    schema: "schemas/agent-launch-requirements-analysis-state.schema.json",
    data: "docs/product/analysis/agent-launch-requirements-analysis/analysis-state.json",
  },
  {
    schema: "schemas/agent-launch-requirements-impact-map.schema.json",
    data: "docs/product/analysis/agent-launch-requirements-analysis/requirements-impact-map.json",
  },
  {
    schema: "schemas/prompt-only-artifact-link-catalog.schema.json",
    data: "docs/process/prompt-only-artifact-review/artifact-link-catalog.json",
  },
  {
    schema: "schemas/prompt-only-artifact-review-session-state.schema.json",
    data: "docs/process/prompt-only-artifact-review/artifact-review-session-state.json",
  },
  {
    schema: "schemas/universal-documentation-core.schema.json",
    data: "docs/process/universal-documentation-workflow/universal-workflow-core.json",
  },
  {
    schema: "schemas/datacanvas-documentation-profile.schema.json",
    data: "docs/process/universal-documentation-workflow/datacanvas-profile.json",
  },
  {
    schema: "schemas/documentation-project-profile.schema.json",
    data: "tests/fixtures/universal-documentation-workflow/positive/neutral-project-profile.json",
  },
  {
    schema: "schemas/documentation-product-profile.schema.json",
    data: "tests/fixtures/universal-documentation-workflow/positive/neutral-product-profile.json",
  },
  {
    schema: "schemas/validation-command-catalog.schema.json",
    data: "docs/process/universal-documentation-workflow/validation-command-catalog.json",
  },
  {
    schema: "schemas/validation-command-catalog.schema.json",
    data: "tests/fixtures/universal-documentation-workflow/positive/neutral-validation-command-catalog.json",
  },
  {
    schema: "schemas/documentation-artifact-inventory.schema.json",
    data: "docs/process/universal-documentation-workflow/artifact-inventory.json",
  },
  {
    schema: "schemas/documentation-artifact-inventory.schema.json",
    data: "tests/fixtures/universal-documentation-workflow/positive/neutral-artifact-inventory.json",
  },
  {
    schema: "schemas/generator-contracts.schema.json",
    data: "docs/process/universal-documentation-workflow/generator-contracts.json",
  },
  {
    schema: "schemas/documentation-archive-contract.schema.json",
    data: "docs/process/universal-documentation-workflow/documentation-archive-contract.json",
  },
  {
    schema: "schemas/documentation-archive-contract.schema.json",
    data: "docs/release/co-2026-003-prototype-delivery-archive-contract.json",
  },
  {
    schema: "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-topic-result.schema.json",
    data: "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/delivery-success-message/brainstorming-topic-result.json",
  },
  {
    schema: "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-contract.schema.json",
    data: "docs/product/analysis/presentation-link-lisa-user-journey/source/brainstorming-contract.json",
  },
  {
    schema: "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-topic-result.schema.json",
    data: "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/button-label/brainstorming-topic-result.json",
  },
  {
    schema: "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-topic-result.schema.json",
    data: "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/generation-started-message/brainstorming-topic-result.json",
  },
  {
    schema: "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-topic-result.schema.json",
    data: "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/email-subject/brainstorming-topic-result.json",
  },
  {
    schema: "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-topic-result.schema.json",
    data: "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/email-body/brainstorming-topic-result.json",
  },
  {
    schema: "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/candidate-evidence-registry.schema.json",
    data: "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/candidate-evidence-registry.json",
  },
  {
    schema: "schemas/workflow-state.schema.json",
    data: "docs/process/universal-documentation-workflow/workflow-state.json",
  },
  {
    schema: "schemas/workflow-state.schema.json",
    data: "tests/fixtures/universal-documentation-workflow/positive/neutral-workflow-state.json",
  },
  {
    schema: "schemas/workflow-decision-queue.schema.json",
    data: "docs/process/universal-documentation-workflow/decision-queue.json",
  },
  {
    schema: "schemas/decision-ledger.schema.json",
    data: "docs/process/universal-documentation-workflow/decision-ledger.json",
  },
  {
    schema: "schemas/acceptance-records.schema.json",
    data: "docs/process/universal-documentation-workflow/acceptance-records.json",
  },
  {
    schema: "schemas/run-ledger.schema.json",
    data: "docs/process/universal-documentation-workflow/run-ledger.json",
  },
  {
    schema: "schemas/event-log.schema.json",
    data: "docs/process/universal-documentation-workflow/event-log.json",
  },
  {
    schema: "schemas/schema-coverage-registry.schema.json",
    data: "docs/process/universal-documentation-workflow/schema-coverage-registry.json",
  },
  {
    schema: "schemas/mutation-guard-policy.schema.json",
    data: "docs/process/universal-documentation-workflow/mutation-guard-policy.json",
  },
  {
    schema: "schemas/workflow-portability-pack.schema.json",
    data: "docs/process/universal-documentation-workflow/portability-pack.json",
  },
  {
    schema: "schemas/product-bootstrap-pack.schema.json",
    data: "docs/process/universal-documentation-workflow/product-bootstrap-pack.json",
  },
  {
    schema: "schemas/feature-spec.schema.json",
    data: "docs/product/specs/feature-spec-a2a-launch.json",
  },
  {
    schema: "schemas/task-spec.schema.json",
    data: "docs/product/specs/task-spec-a2a-launch.json",
  },
  {
    schema: "schemas/agent-prompt-spec.schema.json",
    data: "docs/product/specs/agent-prompt-spec-a2a-launch.json",
  },
  {
    schema: "schemas/generated-spec-package-manifest.schema.json",
    data: "docs/product/specs/generated-spec-package-manifest.json",
  },
  {
    schema: "schemas/risk-registry.schema.json",
    data: "docs/architecture/risks/risk-registry.json",
  },
  {
    schema: "schemas/plan-coverage-audit.schema.json",
    data: "docs/process/audits/datacanvas-plan-coverage-audit.json",
  },
  {
    schema: "schemas/plan-completion-audit.schema.json",
    data: "docs/process/audits/plan-completion-audit.json",
  },
  {
    schema: "schemas/external-blocker-closure-map.schema.json",
    data: "docs/process/audits/external-blocker-closure-map.json",
  },
  {
    schema: "schemas/external-evidence-readiness.schema.json",
    data: "docs/process/audits/external-evidence-readiness.json",
  },
  {
    schema: "schemas/process-version-manifest.schema.json",
    data: "docs/process/versions/0.1.0/process-version-manifest.json",
  },
  {
    schema: "schemas/process-metrics-manifest.schema.json",
    data: "docs/process/current/process-metrics-manifest.json",
  },
  {
    schema: "schemas/process-event-log.schema.json",
    data: "docs/process/current/process-event-log.json",
  },
  {
    schema: "schemas/process-portability-pack.schema.json",
    data: "docs/process/portability/process-portability-pack.json",
  },
  {
    schema: "schemas/process-metrics-snapshot.schema.json",
    data: "docs/process/current/process-metrics-snapshot.json",
  },
  {
    schema: "schemas/process-change-ledger.schema.json",
    data: "docs/process/current/process-change-ledger.json",
  },
  {
    schema: "schemas/traceability-graph.schema.json",
    data: "docs/architecture/schemas/traceability-graph.json",
  },
  {
    schema: "schemas/risk-evidence-map.schema.json",
    data: "docs/architecture/risks/risk-evidence-map.json",
  },
  {
    schema: "schemas/risk-traceability.schema.json",
    data: "docs/architecture/risks/risk-traceability.json",
  },
  {
    schema: "schemas/provider-experiment-result.schema.json",
    data: "tests/provider/provider-experiment-result-scored.json",
  },
  {
    schema: "schemas/provider-experiment-result.schema.json",
    data: "tests/provider/provider-experiment-result-rollback.json",
  },
  {
    schema: "schemas/provider-experiment-result.schema.json",
    data: "tests/provider/provider-experiment-result-security-rollback.json",
  },
  {
    schema: "schemas/provider-experiment-result.schema.json",
    data: "tests/provider/provider-experiment-result-cost-rollback.json",
  },
  {
    schema: "schemas/provider-experiment-result.schema.json",
    data: "tests/provider/provider-experiment-result-latency-rollback.json",
  },
  {
    schema: "schemas/provider-experiment-result.schema.json",
    data: "tests/provider/provider-experiment-result-failure-rollback.json",
  },
  {
    schema: "schemas/claim-map.schema.json",
    data: "tests/golden/claim-map-minimal.json",
  },
  {
    schema: "schemas/eval-case.schema.json",
    data: "tests/evals/eval-cases.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-process-bootstrap/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-product-goal-schema-validator/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-llm-mock-guardrails/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-eval-pack/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-provider-readiness/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-structured-provider-readiness/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-provider-experiment-template/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-provider-eval-rubric/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-provider-scorer-risk-registry/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-provider-negative-risk-traceability/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-risk-traceability-negative-branches/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-failure-risk-crosscheck/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-risk-matrix-report/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-generated-risk-traceability/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-artifact-registry-validator/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-process-versioning-validator/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-plan-coverage-audit/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-security-foundation-pack/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-backlog-registry/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-contract-schemas/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-artifact-hash-manifest/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-operational-readiness-gate/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-human-review-uat-gate/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-pdf-png-export-smoke/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-uat-result-fixture/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-release-evidence-pack/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-review-ui-fixture/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-real-uat-readiness/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-process-metrics-manifest/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-traceability-graph/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-review-runtime-state/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-interactive-review-runtime/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-process-metrics-collection/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-artifact-registry-hash-linkage/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-renderer-regression-pack/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-data-leakage-gate/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-release-evidence-current-gates/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-real-uat-runtime-import/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-pilot-gate-readiness/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-process-event-log-readiness/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-process-portability-readiness/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-real-uat-operator-handoff/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-real-uat-session-importer/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-real-uat-leakage-guard/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-release-evidence-real-uat-alignment/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-plan-completion-audit-gate/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-pilot-execution-handoff/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-pilot-report-templates/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-commit-pr-evidence-template/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-external-blocker-closure-map/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-real-uat-preflight-checklist/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-real-uat-runtime-actor-identity/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-real-uat-import-dry-run/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-review-runtime-browser-matrix/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-review-runtime-browser-smoke/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-export-png-pixel-smoke/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-external-evidence-readiness/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-real-uat-one-command-runner/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-threat-model-delta-governance/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-process-change-control-ledger/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W26-bmc-interview/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/artifact-registry.schema.json",
    data: "docs/architecture/schemas/artifact-registry.json",
  },
  {
    schema: "schemas/docs-navigation-source.schema.json",
    data: "docs/navigation/navigation-source.json",
  },
  {
    schema: "schemas/docs-navigation-index.schema.json",
    data: "docs/navigation/documentation-index.json",
  },
  {
    schema: "schemas/documentation-methodology-policy.schema.json",
    data: "docs/process/methodology/documentation-methodology-policy.json",
  },
  {
    schema: "schemas/babok-research-source-index.schema.json",
    data: "docs/process/methodology/babok-research-source-index.json",
  },
  {
    schema: "schemas/methodology-traceability-model.schema.json",
    data: "docs/process/methodology/traceability-model.json",
  },
  {
    schema: "schemas/methodology-artifact-map.schema.json",
    data: "docs/process/methodology/methodology-artifact-map.json",
  },
  {
    schema: "schemas/babok-coverage-map.schema.json",
    data: "docs/process/methodology/babok-coverage-map.json",
  },
  {
    schema: "schemas/sprint-evidence-manifest.schema.json",
    data: "docs/sprints/2026-W27-babok-methodology-mva/sprint-evidence-manifest.json",
  },
  {
    schema: "schemas/render-result.schema.json",
    data: "artifacts/examples/render-result-minimal.json",
  },
  {
    schema: "schemas/llm-request.schema.json",
    data: "tests/fixtures/llm-request-minimal.json",
  },
  {
    schema: "schemas/llm-result.schema.json",
    data: "tests/golden/llm-result-minimal.json",
  },
  {
    schema: "schemas/render-request.schema.json",
    data: "tests/contracts/render-request-minimal.json",
  },
  {
    schema: "schemas/process-change-request.schema.json",
    data: "tests/contracts/process-change-request-minimal.json",
  },
  {
    schema: "schemas/tool-allowlist.schema.json",
    data: "tests/contracts/tool-allowlist-minimal.json",
  },
  {
    schema: "schemas/trace-contract.schema.json",
    data: "tests/contracts/trace-contract-minimal.json",
  },
  {
    schema: "schemas/llm-result.schema.json",
    data: "tests/fixtures/llm-result-unsupported-claim.json",
  },
];

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
});
addFormats(ajv);
ajv.addSchema(readJson("schemas/common-defs.schema.json"));
ajv.addSchema(readJson("schemas/cascade-impact-cone.schema.json"));
ajv.addSchema(readJson("schemas/impact-analysis-report.schema.json"));

let failed = false;
const validators = new Map();

for (const testCase of cases) {
  const data = readJson(testCase.data);
  let validate = validators.get(testCase.schema);

  if (!validate) {
    const schema = readJson(testCase.schema);
    validate = (schema.$id && ajv.getSchema(schema.$id)) || ajv.compile(schema);
    validators.set(testCase.schema, validate);
  }

  const valid = validate(data);

  if (!valid) {
    failed = true;
    console.error(`ERROR: ${testCase.data} does not match ${testCase.schema}`);
    console.error(JSON.stringify(validate.errors, null, 2));
  } else {
    console.log(`schema validation passed: ${testCase.data}`);
  }
}

if (failed) {
  process.exit(1);
}

const validateXlsxProvenance = validators.get("schemas/xlsx-backlog-provenance.schema.json");
const acceptedXlsxProvenance = readJson(
  "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json",
);
for (const [scenario, mutate] of [
  ["missing Jira export authority", (candidate) => delete candidate.downstream_policy.jira_export_authority],
  ["missing Jira export decision", (candidate) => delete candidate.downstream_policy.jira_export_decision_id],
  ["wrong Jira export decision", (candidate) => {
    candidate.downstream_policy.jira_export_decision_id = "UDW-DEC-018";
  }],
  ["Jira export permits sprint backlog updates", (candidate) => {
    candidate.downstream_policy.may_update_sprint_backlog = true;
  }],
  ["Jira export requires a team approval record", (candidate) => {
    candidate.downstream_policy.requires_team_approval_record = true;
  }],
  ["draft_unapproved Jira export", (candidate) => {
    candidate.workbook.approval_status = "draft_unapproved";
  }],
  ["blocked Jira export workbook", (candidate) => {
    candidate.workbook.approval_status = "blocked";
  }],
  ["team_approved Jira export workbook", (candidate) => {
    candidate.workbook.approval_status = "team_approved";
  }],
  ["pending Jira export workbook", (candidate) => {
    candidate.workbook.team_validation_status = "pending_team_review";
  }],
  ["draft_unapproved Jira export row", (candidate) => {
    candidate.rows[0].approval_status = "draft_unapproved";
  }],
  ["blocked Jira export row approval", (candidate) => {
    candidate.rows[0].approval_status = "blocked";
  }],
  ["blocked Jira export row validation", (candidate) => {
    candidate.rows[0].team_validation_status = "blocked";
  }],
  ["pending Jira export row", (candidate) => {
    candidate.rows[0].team_validation_status = "pending_team_review";
  }],
  ["missing Jira export row", (candidate) => {
    candidate.rows.pop();
  }],
]) {
  const candidate = structuredClone(acceptedXlsxProvenance);
  mutate(candidate);
  if (validateXlsxProvenance(candidate)) {
    console.error(`ERROR: XLSX provenance schema accepted negative scenario: ${scenario}`);
    process.exit(1);
  }
}
console.log("XLSX provenance negative schema validation passed");

const inputPackage = readJson("tests/fixtures/input-package-minimal.json");
const normalizedData = readJson("tests/golden/normalized-data-minimal.json");
const traceManifest = readJson("tests/golden/trace-manifest-minimal.json");
const presentationSpec = readJson("tests/golden/presentation-spec-minimal.json");
const claimMap = readJson("tests/golden/claim-map-minimal.json");
const renderResult = readJson("artifacts/examples/render-result-minimal.json");
const llmResult = readJson("tests/golden/llm-result-minimal.json");
const providerAllowlist = readJson("docs/architecture/llm/provider-allowlist.json");
const providerBudget = readJson("docs/architecture/llm/provider-budget.json");
const providerEvalDelta = readJson("tests/evals/provider-specific-eval-delta.json");
const riskRegistry = readJson("docs/architecture/risks/risk-registry.json");
const riskEvidenceMap = readJson("docs/architecture/risks/risk-evidence-map.json");
const riskTraceability = readJson("docs/architecture/risks/risk-traceability.json");
const scoredProviderResult = readJson("tests/provider/provider-experiment-result-scored.json");
const rollbackProviderResult = readJson("tests/provider/provider-experiment-result-rollback.json");
const securityRollbackResult = readJson("tests/provider/provider-experiment-result-security-rollback.json");
const costRollbackResult = readJson("tests/provider/provider-experiment-result-cost-rollback.json");
const latencyRollbackResult = readJson("tests/provider/provider-experiment-result-latency-rollback.json");
const failureRollbackResult = readJson("tests/provider/provider-experiment-result-failure-rollback.json");
const traceabilityMatrix = readJson("docs/product/requirements/traceability-matrix.json");

if (normalizedData.source_package_id !== inputPackage.package_id) {
  console.error("ERROR: normalized data is not linked to the input package");
  process.exit(1);
}

if (!traceManifest.outputs.some((output) => output.path === "tests/golden/normalized-data-minimal.json")) {
  console.error("ERROR: trace manifest does not reference normalized data output");
  process.exit(1);
}

const modelCallSpan = traceManifest.spans.find((span) => span.name === "model_call");
if (!modelCallSpan) {
  console.error("ERROR: trace manifest does not include model_call span");
  process.exit(1);
}

if (modelCallSpan.provider !== "local" || modelCallSpan.model !== "offline_mock_adapter") {
  console.error("ERROR: trace manifest model_call span is not linked to offline provider fallback");
  process.exit(1);
}

console.log("cross-artifact validation passed");

const specClaims = presentationSpec.slides.flatMap((slide) =>
  slide.claims.map((claim) => `${slide.slide_id}:${claim.text}`),
);
const mappedClaims = claimMap.claims.map((claim) => `${claim.slide_id}:${claim.claim_text}`);

for (const specClaim of specClaims) {
  if (!mappedClaims.includes(specClaim)) {
    console.error(`ERROR: PresentationSpec claim is missing from claim map: ${specClaim}`);
    process.exit(1);
  }
}

console.log("claim-map validation passed");

if (renderResult.source_spec_id !== presentationSpec.spec_id) {
  console.error("ERROR: render result is not linked to PresentationSpec");
  process.exit(1);
}

if (!renderResult.outputs.some((output) => output.path === "artifacts/examples/presentation-minimal.html")) {
  console.error("ERROR: render result does not reference HTML export");
  process.exit(1);
}

console.log("render-result validation passed");

const validatePresentationSpec = validators.get("schemas/presentation-spec.schema.json");

if (!validatePresentationSpec(llmResult.presentation_spec)) {
  console.error("ERROR: LLMResult presentation_spec does not match PresentationSpec schema");
  console.error(JSON.stringify(validatePresentationSpec.errors, null, 2));
  process.exit(1);
}

console.log("llm-result nested PresentationSpec validation passed");

const provider = providerAllowlist.providers[0];
if (provider.status !== "disabled" || provider.network_access !== false) {
  console.error("ERROR: provider allowlist must keep provider disabled and offline");
  process.exit(1);
}

if (providerBudget.fallback.command !== "npm run generate:golden") {
  console.error("ERROR: provider budget fallback command is not linked to golden generation");
  process.exit(1);
}

console.log("provider readiness schema linkage validation passed");

const riskIds = new Set(riskRegistry.risks.map((risk) => risk.id));
const riskEvidenceIds = new Set(riskEvidenceMap.items.map((item) => item.risk_id));
for (const riskId of riskIds) {
  if (!riskEvidenceIds.has(riskId)) {
    console.error(`ERROR: risk is missing from risk evidence map: ${riskId}`);
    process.exit(1);
  }
}

for (const testCase of providerEvalDelta.cases) {
  if (!riskIds.has(testCase.linked_risk)) {
    console.error(`ERROR: provider eval case references unknown risk: ${testCase.linked_risk}`);
    process.exit(1);
  }
}

if (scoredProviderResult.metrics.quality_score < 0.9) {
  console.error("ERROR: scored provider result does not meet quality threshold");
  process.exit(1);
}

if (rollbackProviderResult.decision !== "rollback" || rollbackProviderResult.metrics.quality_score >= 0.9) {
  console.error("ERROR: rollback provider result does not demonstrate rollback decision below threshold");
  process.exit(1);
}

for (const [label, result] of [
  ["security", securityRollbackResult],
  ["cost", costRollbackResult],
  ["latency", latencyRollbackResult],
  ["failure", failureRollbackResult],
]) {
  if (result.decision !== "rollback" || result.metrics.quality_score >= 0.9) {
    console.error(`ERROR: ${label} rollback provider result does not demonstrate rollback decision below threshold`);
    process.exit(1);
  }
}

const traceabilityText = JSON.stringify(traceabilityMatrix);
for (const riskId of riskIds) {
  if (!traceabilityText.includes(riskId)) {
    console.error(`ERROR: risk is missing from traceability matrix: ${riskId}`);
    process.exit(1);
  }
}

const riskTraceabilityIds = new Set(riskTraceability.links.map((link) => link.risk_id));
for (const riskId of riskIds) {
  if (!riskTraceabilityIds.has(riskId)) {
    console.error(`ERROR: risk is missing from typed risk traceability: ${riskId}`);
    process.exit(1);
  }
}

const traceabilityByRequirement = new Map(traceabilityMatrix.links.map((link) => [link.requirement_id, link]));
for (const link of riskTraceability.links) {
  for (const requirementId of link.traceability_requirement_ids) {
    const traceabilityLink = traceabilityByRequirement.get(requirementId);
    if (!traceabilityLink?.risks?.includes(link.risk_id)) {
      console.error(`ERROR: traceability matrix does not link ${requirementId} to risk ${link.risk_id}`);
      process.exit(1);
    }
  }
}

console.log("provider scorer risk linkage validation passed");
