#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "AGENTS.md"
  "docs/plans/datacanvas-adaptive-scrum-implementation-plan.md"
  "docs/process/current/process-passport.md"
  "docs/process/current/process-registry.md"
  "docs/process/current/process-backlog.md"
  "docs/process/current/process-changelog.md"
  "docs/process/current/process-change-ledger.json"
  "docs/process/current/definition-of-ready.md"
  "docs/process/current/definition-of-done.md"
  "docs/product/vision/vision-v0.1.md"
  "docs/product/bmc/bmc-v0.1.md"
  "docs/product/hypotheses/hypothesis-board.md"
  "docs/product/backlog/product-backlog.md"
  "docs/product/backlog/backlog-registry.json"
  "docs/product/backlog/technical-backlog.md"
  "docs/product/backlog/eval-backlog.md"
  "docs/product/requirements/business-requirements.md"
  "docs/product/requirements/non-functional-requirements.md"
  "docs/product/requirements/user-stories.md"
  "docs/product/requirements/acceptance-criteria.md"
  "docs/product/requirements/traceability-matrix.json"
  "docs/product/roadmap/roadmap-v0.1.md"
  "docs/architecture/adr/ADR-001-weekly-scrum-process.md"
  "docs/architecture/adr/ADR-002-one-agent-default.md"
  "docs/architecture/adr/ADR-003-presentation-spec-boundary.md"
  "docs/architecture/adr/ADR-004-bootstrap-validator.md"
  "docs/architecture/adr/ADR-005-deterministic-normalization.md"
  "docs/architecture/adr/ADR-006-mock-presentation-spec-generator.md"
  "docs/architecture/adr/ADR-007-html-renderer-baseline.md"
  "docs/architecture/adr/ADR-008-structural-visual-baseline.md"
  "docs/architecture/adr/ADR-009-llm-schema-boundary.md"
  "docs/architecture/adr/ADR-010-llm-mock-guardrails.md"
  "docs/architecture/adr/ADR-011-eval-pack-before-provider.md"
  "docs/architecture/adr/ADR-012-provider-readiness-before-network.md"
  "docs/architecture/adr/ADR-013-structured-provider-readiness.md"
  "docs/architecture/adr/ADR-014-provider-experiment-result-contract.md"
  "docs/architecture/adr/ADR-015-provider-specific-eval-delta.md"
  "docs/architecture/adr/ADR-016-provider-output-scorer-and-risk-registry.md"
  "docs/architecture/adr/ADR-017-generated-risk-traceability.md"
  "docs/architecture/adr/ADR-018-artifact-registry-validation.md"
  "docs/architecture/adr/ADR-019-process-versioning-validation.md"
  "docs/architecture/adr/ADR-020-plan-coverage-audit.md"
  "docs/architecture/adr/ADR-021-security-foundation-gate.md"
  "docs/architecture/adr/ADR-022-backlog-registry.md"
  "docs/architecture/adr/ADR-023-contract-schemas.md"
  "docs/architecture/adr/ADR-024-artifact-hash-manifest.md"
  "docs/architecture/adr/ADR-025-operational-readiness-gate.md"
  "docs/architecture/adr/ADR-026-human-review-uat-gate.md"
  "docs/architecture/adr/ADR-027-pdf-png-export-smoke.md"
  "docs/architecture/adr/ADR-028-uat-result-fixture.md"
  "docs/architecture/adr/ADR-029-release-evidence-pack.md"
  "docs/architecture/adr/ADR-030-review-ui-fixture.md"
  "docs/architecture/adr/ADR-031-real-uat-readiness-gate.md"
  "docs/architecture/adr/ADR-032-process-metrics-manifest.md"
  "docs/architecture/adr/ADR-033-traceability-graph-validation.md"
  "docs/architecture/adr/ADR-034-review-runtime-state.md"
  "docs/architecture/adr/ADR-035-threat-model-delta-governance.md"
  "docs/architecture/adr/ADR-036-process-change-ledger.md"
  "docs/architecture/adr/ADR-037-interactive-review-runtime.md"
  "docs/architecture/adr/ADR-038-process-metrics-collection.md"
  "docs/architecture/adr/ADR-039-artifact-registry-hash-linkage.md"
  "docs/architecture/adr/ADR-040-renderer-regression-pack.md"
  "docs/architecture/adr/ADR-041-data-leakage-gate.md"
  "docs/architecture/adr/ADR-042-release-evidence-current-gates.md"
  "docs/architecture/adr/ADR-043-real-uat-runtime-import-gate.md"
  "docs/architecture/adr/ADR-044-pilot-gate-readiness.md"
  "docs/architecture/adr/ADR-045-process-event-log-readiness.md"
  "docs/architecture/adr/ADR-046-process-portability-readiness.md"
  "docs/architecture/adr/ADR-047-real-uat-operator-handoff.md"
  "docs/architecture/adr/ADR-048-real-uat-session-importer.md"
  "docs/architecture/adr/ADR-049-real-uat-leakage-guard.md"
  "docs/architecture/adr/ADR-050-release-evidence-real-uat-alignment.md"
  "docs/architecture/adr/ADR-051-plan-completion-audit-gate.md"
  "docs/architecture/adr/ADR-052-pilot-execution-handoff.md"
  "docs/architecture/adr/ADR-053-pilot-report-templates.md"
  "docs/architecture/adr/ADR-054-commit-pr-evidence-template.md"
  "docs/architecture/adr/ADR-055-external-blocker-closure-map.md"
  "docs/architecture/adr/ADR-056-real-uat-preflight-checklist.md"
  "docs/architecture/adr/ADR-057-real-uat-runtime-actor-identity.md"
  "docs/architecture/adr/ADR-058-real-uat-import-dry-run.md"
  "docs/architecture/adr/ADR-059-review-runtime-browser-matrix.md"
  "docs/architecture/evals/eval-strategy.md"
  "docs/architecture/evals/provider-quality-scoring-rubric.md"
  "docs/architecture/risks/risk-registry.json"
  "docs/architecture/risks/risk-evidence-map.json"
  "docs/architecture/risks/risk-traceability.json"
  "docs/architecture/risks/risk-matrix.md"
  "docs/architecture/llm/provider-integration-plan.md"
  "docs/architecture/llm/provider-allowlist.json"
  "docs/architecture/llm/provider-allowlist.yaml"
  "docs/architecture/llm/provider-budget.json"
  "docs/architecture/llm/provider-experiment-result-template.json"
  "docs/architecture/security/trust-boundaries.md"
  "docs/architecture/security/security-foundation-manifest.json"
  "docs/architecture/security/data-leakage-manifest.json"
  "docs/architecture/security/real-uat-leakage-guard.json"
  "docs/architecture/security/threat-model-delta-manifest.json"
  "docs/architecture/security/tool-allowlist.yaml"
  "docs/architecture/security/no-network-by-default.md"
  "docs/architecture/observability/trace-contract.md"
  "docs/architecture/observability/operational-readiness-checklist.md"
  "docs/architecture/observability/operational-readiness-manifest.json"
  "docs/architecture/observability/runbook.md"
  "docs/product/ux/human-review-flow.md"
  "docs/product/ux/human-review-flow.json"
  "docs/product/ux/uat-script.md"
  "docs/product/ux/uat-manifest.json"
  "docs/product/ux/uat-result.md"
  "docs/product/ux/uat-result-minimal.json"
  "docs/product/ux/review-ui-fixture.md"
  "docs/product/ux/review-ui-fixture.json"
  "docs/product/ux/review-runtime-state.md"
  "docs/product/ux/review-runtime-state-fixture.json"
  "docs/product/ux/review-runtime-interactive.json"
  "docs/product/ux/review-runtime-browser-matrix.json"
  "docs/product/ux/review-runtime-browser-matrix.md"
  "docs/product/ux/human-review-session-minimal.json"
  "docs/product/ux/human-review-session-real.template.json"
  "docs/product/ux/real-uat-gate-readiness.json"
  "docs/product/ux/real-uat-session-guide.md"
  "docs/product/ux/real-uat-runtime-import.json"
  "docs/product/ux/real-uat-runtime-import-guide.md"
  "docs/product/ux/real-uat-operator-handoff.json"
  "docs/product/ux/real-uat-operator-handoff.md"
  "docs/product/ux/real-uat-preflight-checklist.json"
  "docs/product/ux/real-uat-preflight-checklist.md"
  "docs/product/ux/real-uat-session-importer.json"
  "docs/product/ux/real-uat-session-importer.md"
  "docs/release/mvp-release-evidence-pack.md"
  "docs/release/mvp-release-evidence-pack.json"
  "docs/release/pilot-gate-readiness.json"
  "docs/release/pilot-execution-handoff.json"
  "docs/release/pilot-execution-handoff.md"
  "docs/release/templates/pilot-report-template.md"
  "docs/release/templates/pilot-process-portability-notes-template.md"
  "docs/release/templates/commit-pr-evidence-template.md"
  "artifacts/examples/review-ui-fixture.html"
  "artifacts/examples/review-runtime-interactive.html"
  "artifacts/examples/presentation-smoke.pdf"
  "artifacts/examples/presentation-smoke.png"
  "artifacts/examples/export-smoke-manifest.json"
  "artifacts/examples/renderer-regression-manifest.json"
  "docs/process/audits/datacanvas-plan-coverage-audit.json"
  "docs/process/audits/datacanvas-plan-coverage-report.md"
  "docs/process/audits/plan-completion-audit.json"
  "docs/process/audits/plan-completion-audit.md"
  "docs/process/audits/external-blocker-closure-map.json"
  "docs/process/audits/external-blocker-closure-map.md"
  "docs/process/current/process-metrics-manifest.json"
  "docs/process/current/process-event-log.json"
  "docs/process/portability/process-portability-pack.json"
  "docs/process/portability/migration-notes-template.md"
  "docs/process/templates/sprint-folder-template.md"
  "docs/process/templates/release-evidence-template.md"
  "docs/process/templates/pilot-readiness-template.md"
  "docs/process/templates/process-event-log-template.md"
  "docs/process/current/process-metrics-snapshot.json"
  "docs/process/current/process-metrics-snapshot.md"
  "docs/architecture/schemas/traceability-graph.json"
  "docs/process/versions/0.1.0/process-version-manifest.json"
  "docs/process/versions/0.1.0/process-snapshot.md"
  "docs/architecture/schemas/artifact-hash-manifest.json"
  "schemas/input-package.schema.json"
  "schemas/normalized-data.schema.json"
  "schemas/presentation-spec.schema.json"
  "schemas/trace-manifest.schema.json"
  "schemas/claim-map.schema.json"
  "schemas/eval-case.schema.json"
  "schemas/sprint-evidence-manifest.schema.json"
  "schemas/artifact-registry.schema.json"
  "schemas/render-result.schema.json"
  "schemas/render-request.schema.json"
  "schemas/process-change-request.schema.json"
  "schemas/tool-allowlist.schema.json"
  "schemas/trace-contract.schema.json"
  "schemas/llm-request.schema.json"
  "schemas/llm-result.schema.json"
  "schemas/backlog-registry.schema.json"
  "schemas/provider-allowlist.schema.json"
  "schemas/provider-budget.schema.json"
  "schemas/provider-experiment-result.schema.json"
  "schemas/provider-specific-eval-delta.schema.json"
  "schemas/security-foundation-manifest.schema.json"
  "schemas/threat-model-delta-manifest.schema.json"
  "schemas/data-leakage-manifest.schema.json"
  "schemas/real-uat-leakage-guard.schema.json"
  "schemas/plan-coverage-audit.schema.json"
  "schemas/plan-completion-audit.schema.json"
  "schemas/external-blocker-closure-map.schema.json"
  "schemas/process-change-ledger.schema.json"
  "schemas/process-version-manifest.schema.json"
  "schemas/process-change-ledger.schema.json"
  "schemas/risk-registry.schema.json"
  "schemas/risk-evidence-map.schema.json"
  "schemas/risk-traceability.schema.json"
  "schemas/artifact-hash-manifest.schema.json"
  "schemas/operational-readiness-manifest.schema.json"
  "schemas/human-review-flow.schema.json"
  "schemas/uat-manifest.schema.json"
  "schemas/export-smoke-manifest.schema.json"
  "schemas/renderer-regression-manifest.schema.json"
  "schemas/uat-result.schema.json"
  "schemas/traceability-graph.schema.json"
  "schemas/review-runtime-state.schema.json"
  "schemas/review-runtime-interactive.schema.json"
  "schemas/review-runtime-browser-matrix.schema.json"
  "schemas/release-evidence-pack.schema.json"
  "schemas/review-ui-fixture.schema.json"
  "schemas/review-runtime-state.schema.json"
  "schemas/human-review-session.schema.json"
  "schemas/real-uat-gate-readiness.schema.json"
  "schemas/real-uat-runtime-import.schema.json"
  "schemas/real-uat-operator-handoff.schema.json"
  "schemas/real-uat-preflight-checklist.schema.json"
  "schemas/real-uat-session-importer.schema.json"
  "schemas/pilot-gate-readiness.schema.json"
  "schemas/pilot-execution-handoff.schema.json"
  "schemas/process-metrics-manifest.schema.json"
  "schemas/process-event-log.schema.json"
  "schemas/process-portability-pack.schema.json"
  "schemas/process-metrics-snapshot.schema.json"
  "schemas/traceability-graph.schema.json"
  "tests/fixtures/input-package-minimal.json"
  "tests/golden/normalized-data-minimal.json"
  "tests/golden/trace-manifest-minimal.json"
  "tests/golden/presentation-spec-minimal.json"
  "tests/golden/claim-map-minimal.json"
  "tests/evals/eval-cases.json"
  "tests/evals/provider-specific-eval-delta.json"
  "tests/provider/provider-experiment-result-scored.json"
  "tests/provider/provider-experiment-result-rollback.json"
  "tests/provider/llm-result-unsupported-provider-output.json"
  "tests/provider/llm-result-prompt-injection-output.json"
  "tests/provider/provider-experiment-result-security-rollback.json"
  "tests/provider/provider-experiment-result-cost-rollback.json"
  "tests/provider/provider-experiment-result-latency-rollback.json"
  "tests/provider/provider-experiment-result-failure-rollback.json"
  "tests/provider/scenario-cost-overrun.json"
  "tests/provider/scenario-latency-overrun.json"
  "tests/provider/scenario-failure-overrun.json"
  "artifacts/examples/presentation-minimal.html"
  "artifacts/examples/render-result-minimal.json"
  "docs/architecture/renderer/pdf-png-export-strategy.md"
  "docs/architecture/llm/prompt-contract.md"
  "tests/fixtures/llm-request-minimal.json"
  "tests/golden/llm-result-minimal.json"
  "tests/contracts/render-request-minimal.json"
  "tests/contracts/process-change-request-minimal.json"
  "tests/contracts/tool-allowlist-minimal.json"
  "tests/contracts/trace-contract-minimal.json"
  "tests/fixtures/llm-result-unsupported-claim.json"
  "scripts/llm-mock-adapter.mjs"
  "scripts/scan-secrets.mjs"
  "scripts/validate-contract-schemas.mjs"
  "scripts/validate-llm-guardrails.mjs"
  "scripts/validate-eval-pack.mjs"
  "scripts/validate-provider-readiness.mjs"
  "scripts/validate-backlog-registry.mjs"
  "scripts/validate-security-foundation.mjs"
  "scripts/validate-data-leakage.mjs"
  "scripts/validate-threat-model-delta.mjs"
  "scripts/validate-provider-experiment.mjs"
  "scripts/validate-provider-eval-delta.mjs"
  "scripts/score-provider-output.mjs"
  "scripts/validate-provider-scorer.mjs"
  "scripts/validate-artifact-registry.mjs"
  "scripts/validate-plan-coverage.mjs"
  "scripts/validate-process-versioning.mjs"
  "scripts/validate-process-metrics.mjs"
  "scripts/validate-process-event-log.mjs"
  "scripts/validate-process-portability.mjs"
  "scripts/collect-process-metrics.mjs"
  "scripts/validate-process-metrics-snapshot.mjs"
  "scripts/validate-process-change-ledger.mjs"
  "scripts/validate-traceability-graph.mjs"
  "scripts/generate-risk-traceability.mjs"
  "scripts/validate-risk-traceability.mjs"
  "scripts/generate-risk-matrix-report.mjs"
  "scripts/validate-risk-matrix.mjs"
  "scripts/generate-artifact-hash-manifest.mjs"
  "scripts/validate-artifact-hash-manifest.mjs"
  "scripts/validate-operational-readiness.mjs"
  "scripts/validate-uat-human-review.mjs"
  "scripts/validate-uat-result.mjs"
  "scripts/validate-review-ui-fixture.mjs"
  "scripts/validate-review-runtime-state.mjs"
  "scripts/validate-review-runtime-interactive.mjs"
  "scripts/validate-review-runtime-browser-matrix.mjs"
  "scripts/validate-real-uat-readiness.mjs"
  "scripts/validate-real-uat-import.mjs"
  "scripts/validate-real-uat-operator-handoff.mjs"
  "scripts/validate-real-uat-preflight.mjs"
  "scripts/prepare-real-uat-session.mjs"
  "scripts/validate-real-uat-session-importer.mjs"
  "scripts/validate-plan-completion-audit.mjs"
  "scripts/validate-external-blocker-closure-map.mjs"
  "scripts/validate-release-evidence-pack.mjs"
  "scripts/validate-pilot-gate-readiness.mjs"
  "scripts/validate-pilot-execution-handoff.mjs"
  "scripts/validate-pilot-report-templates.mjs"
  "scripts/validate-commit-pr-evidence-template.mjs"
  "scripts/generate-export-smoke-fixtures.mjs"
  "scripts/validate-export-smoke.mjs"
  "scripts/generate-renderer-regression-manifest.mjs"
  "scripts/validate-renderer-regression.mjs"
  "docs/process/experiments/EXP-001-controlled-llm-provider.md"
  "docs/sprints/2026-W26-process-bootstrap/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-llm-mock-guardrails/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-eval-pack/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-readiness/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-structured-provider-readiness/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-experiment-template/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-eval-rubric/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-scorer-risk-registry/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-negative-risk-traceability/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-risk-traceability-negative-branches/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-failure-risk-crosscheck/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-risk-matrix-report/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-generated-risk-traceability/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-artifact-registry-validator/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-process-versioning-validator/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-plan-coverage-audit/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-security-foundation-pack/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-backlog-registry/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-contract-schemas/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-artifact-hash-manifest/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-operational-readiness-gate/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-human-review-uat-gate/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-pdf-png-export-smoke/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-uat-result-fixture/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-release-evidence-pack/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-review-ui-fixture/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-real-uat-readiness/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-process-metrics-manifest/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-traceability-graph/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-review-runtime-state/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-interactive-review-runtime/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-process-metrics-collection/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-artifact-registry-hash-linkage/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-renderer-regression-pack/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-data-leakage-gate/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-release-evidence-current-gates/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-real-uat-runtime-import/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-pilot-gate-readiness/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-pilot-execution-handoff/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-pilot-report-templates/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-commit-pr-evidence-template/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-external-blocker-closure-map/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-real-uat-preflight-checklist/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-real-uat-runtime-actor-identity/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-real-uat-import-dry-run/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-review-runtime-browser-matrix/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-process-event-log-readiness/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-process-portability-readiness/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-threat-model-delta-governance/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-process-change-control-ledger/sprint-evidence-manifest.json"
)

json_files=(
  "schemas/input-package.schema.json"
  "schemas/normalized-data.schema.json"
  "schemas/presentation-spec.schema.json"
  "schemas/trace-manifest.schema.json"
  "schemas/claim-map.schema.json"
  "schemas/eval-case.schema.json"
  "schemas/sprint-evidence-manifest.schema.json"
  "schemas/artifact-registry.schema.json"
  "schemas/render-result.schema.json"
  "schemas/render-request.schema.json"
  "schemas/process-change-request.schema.json"
  "schemas/tool-allowlist.schema.json"
  "schemas/trace-contract.schema.json"
  "schemas/llm-request.schema.json"
  "schemas/llm-result.schema.json"
  "schemas/security-foundation-manifest.schema.json"
  "schemas/threat-model-delta-manifest.schema.json"
  "schemas/plan-coverage-audit.schema.json"
  "schemas/process-version-manifest.schema.json"
  "schemas/artifact-hash-manifest.schema.json"
  "schemas/operational-readiness-manifest.schema.json"
  "schemas/human-review-flow.schema.json"
  "schemas/uat-manifest.schema.json"
  "schemas/export-smoke-manifest.schema.json"
  "schemas/uat-result.schema.json"
  "schemas/review-runtime-interactive.schema.json"
  "tests/fixtures/input-package-minimal.json"
  "tests/golden/normalized-data-minimal.json"
  "tests/golden/trace-manifest-minimal.json"
  "tests/golden/presentation-spec-minimal.json"
  "tests/golden/claim-map-minimal.json"
  "tests/evals/eval-cases.json"
  "artifacts/examples/render-result-minimal.json"
  "tests/fixtures/llm-request-minimal.json"
  "tests/golden/llm-result-minimal.json"
  "tests/contracts/render-request-minimal.json"
  "tests/contracts/process-change-request-minimal.json"
  "tests/contracts/tool-allowlist-minimal.json"
  "tests/contracts/trace-contract-minimal.json"
  "tests/fixtures/llm-result-unsupported-claim.json"
  "docs/sprints/2026-W26-process-bootstrap/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-product-goal-schema-validator/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-llm-mock-guardrails/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-eval-pack/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-readiness/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-structured-provider-readiness/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-experiment-template/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-eval-rubric/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-scorer-risk-registry/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-provider-negative-risk-traceability/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-risk-traceability-negative-branches/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-failure-risk-crosscheck/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-risk-matrix-report/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-generated-risk-traceability/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-artifact-registry-validator/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-process-versioning-validator/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-plan-coverage-audit/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-security-foundation-pack/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-backlog-registry/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-contract-schemas/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-artifact-hash-manifest/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-operational-readiness-gate/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-human-review-uat-gate/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-pdf-png-export-smoke/sprint-evidence-manifest.json"
  "docs/sprints/2026-W26-uat-result-fixture/sprint-evidence-manifest.json"
  "docs/product/requirements/traceability-matrix.json"
  "docs/architecture/schemas/artifact-registry.json"
  "docs/architecture/schemas/source-registry.json"
  "docs/architecture/schemas/fact-ledger.json"
  "docs/architecture/schemas/slide-trace-map.json"
  "docs/architecture/schemas/artifact-hash-manifest.json"
  "docs/architecture/observability/operational-readiness-manifest.json"
  "docs/product/ux/human-review-flow.json"
  "docs/product/ux/uat-manifest.json"
  "docs/product/ux/uat-result-minimal.json"
  "docs/product/ux/review-ui-fixture.json"
  "docs/product/ux/review-runtime-state-fixture.json"
  "docs/product/ux/review-runtime-interactive.json"
  "docs/product/ux/human-review-session-minimal.json"
  "docs/product/ux/human-review-session-real.template.json"
  "docs/product/ux/real-uat-gate-readiness.json"
  "docs/release/mvp-release-evidence-pack.json"
  "docs/process/current/process-metrics-manifest.json"
  "docs/process/current/process-metrics-snapshot.json"
  "docs/architecture/schemas/traceability-graph.json"
  "artifacts/examples/export-smoke-manifest.json"
  "artifacts/examples/renderer-regression-manifest.json"
  "docs/process/audits/datacanvas-plan-coverage-audit.json"
  "docs/process/current/process-change-ledger.json"
  "docs/process/versions/0.1.0/process-version-manifest.json"
  "docs/architecture/llm/provider-budget.json"
  "docs/architecture/llm/provider-allowlist.json"
  "docs/architecture/llm/provider-experiment-result-template.json"
  "docs/product/backlog/backlog-registry.json"
  "docs/architecture/security/security-foundation-manifest.json"
  "docs/architecture/security/data-leakage-manifest.json"
  "docs/architecture/security/threat-model-delta-manifest.json"
  "tests/evals/provider-specific-eval-delta.json"
  "docs/architecture/risks/risk-registry.json"
  "docs/architecture/risks/risk-evidence-map.json"
  "docs/architecture/risks/risk-traceability.json"
  "tests/provider/provider-experiment-result-scored.json"
  "tests/provider/provider-experiment-result-rollback.json"
  "tests/provider/llm-result-unsupported-provider-output.json"
  "tests/provider/llm-result-prompt-injection-output.json"
  "tests/provider/provider-experiment-result-security-rollback.json"
  "tests/provider/provider-experiment-result-cost-rollback.json"
  "tests/provider/provider-experiment-result-latency-rollback.json"
  "tests/provider/provider-experiment-result-failure-rollback.json"
  "tests/provider/scenario-cost-overrun.json"
  "tests/provider/scenario-latency-overrun.json"
  "tests/provider/scenario-failure-overrun.json"
)

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

require_command jq

for path in "${required_files[@]}"; do
  [[ -f "$path" ]] || fail "missing required file: $path"
done

for path in "${json_files[@]}"; do
  [[ -f "$path" ]] || fail "missing JSON file: $path"
  jq empty "$path" >/dev/null
done

jq -e '.status == "produced_pending_team_acceptance"' \
  docs/sprints/2026-W26-process-bootstrap/sprint-evidence-manifest.json >/dev/null \
  || fail "Sprint 0 evidence status is not produced_pending_team_acceptance"

jq -e '.sources[] | select(.id == "SRC-001")' \
  docs/architecture/schemas/source-registry.json >/dev/null \
  || fail "SRC-001 is missing from source registry"

jq -e '.facts[] | select(.id == "FACT-003" and (.claim | test("untrusted"; "i")))' \
  docs/architecture/schemas/fact-ledger.json >/dev/null \
  || fail "FACT-003 untrusted-input fact is missing"

grep -q 'Входной пакет от другого агента считается недоверенным' \
  docs/architecture/security/trust-boundaries.md \
  || fail "trust boundary invariant is missing"

grep -q 'DataCanvas v1 реализуется как один агент-оркестратор' \
  docs/architecture/adr/ADR-002-one-agent-default.md \
  || fail "one-agent default ADR invariant is missing"

grep -q 'PresentationSpec' docs/architecture/adr/ADR-003-presentation-spec-boundary.md \
  || fail "PresentationSpec boundary ADR invariant is missing"

grep -q 'scripts/validate-bootstrap-artifacts.sh' docs/architecture/adr/ADR-004-bootstrap-validator.md \
  || fail "bootstrap validator ADR invariant is missing"

grep -q 'scripts/normalize-input-package.mjs' docs/architecture/adr/ADR-005-deterministic-normalization.md \
  || fail "deterministic normalization ADR invariant is missing"

grep -q 'scripts/generate-presentation-spec.mjs' docs/architecture/adr/ADR-006-mock-presentation-spec-generator.md \
  || fail "mock PresentationSpec generator ADR invariant is missing"

grep -q 'scripts/render-presentation.mjs' docs/architecture/adr/ADR-007-html-renderer-baseline.md \
  || fail "HTML renderer ADR invariant is missing"

grep -q 'scripts/validate-visual-baseline.mjs' docs/architecture/adr/ADR-008-structural-visual-baseline.md \
  || fail "structural visual baseline ADR invariant is missing"

grep -q 'LLMRequest' docs/architecture/adr/ADR-009-llm-schema-boundary.md \
  || fail "LLM schema boundary ADR invariant is missing"

grep -q 'scripts/validate-llm-guardrails.mjs' docs/architecture/adr/ADR-010-llm-mock-guardrails.md \
  || fail "LLM guardrails ADR invariant is missing"

grep -q 'default_policy: deny' docs/architecture/security/tool-allowlist.yaml \
  || fail "tool allowlist default deny invariant is missing"

grep -q 'DataCanvas не выполняет сетевые вызовы' docs/architecture/security/no-network-by-default.md \
  || fail "no-network-by-default invariant is missing"

grep -q 'scripts/validate-eval-pack.mjs' docs/architecture/adr/ADR-011-eval-pack-before-provider.md \
  || fail "eval pack ADR invariant is missing"

grep -q 'EVAL-006' docs/architecture/evals/eval-strategy.md \
  || fail "eval strategy prompt-injection invariant is missing"

grep -q 'npm run validate:provider' docs/architecture/adr/ADR-012-provider-readiness-before-network.md \
  || fail "provider readiness ADR invariant is missing"

grep -q 'status: disabled' docs/architecture/llm/provider-allowlist.yaml \
  || fail "provider allowlist must keep provider disabled"

jq -e '.providers[] | select(.status == "disabled" and .network_access == false)' \
  docs/architecture/llm/provider-allowlist.json >/dev/null \
  || fail "structured provider allowlist must keep provider disabled and offline"

grep -q 'schemas/provider-allowlist.schema.json' docs/architecture/adr/ADR-013-structured-provider-readiness.md \
  || fail "structured provider readiness ADR invariant is missing"

grep -q 'schemas/provider-experiment-result.schema.json' docs/architecture/adr/ADR-014-provider-experiment-result-contract.md \
  || fail "provider experiment result ADR invariant is missing"

jq -e '.status == "planned" and .decision == "not_started" and .rollback.available == true' \
  docs/architecture/llm/provider-experiment-result-template.json >/dev/null \
  || fail "provider experiment template must remain planned with rollback available"

grep -q 'quality_score >= 0.90' docs/architecture/evals/provider-quality-scoring-rubric.md \
  || fail "provider quality scoring threshold is missing"

jq -e '([.cases[].score_weight] | add) == 1' \
  tests/evals/provider-specific-eval-delta.json >/dev/null \
  || fail "provider-specific eval delta weights must sum to 1"

jq -e '.risks[] | select(.id == "unsupported_claims")' \
  docs/architecture/risks/risk-registry.json >/dev/null \
  || fail "risk registry must include unsupported_claims"

grep -q 'scripts/generate-risk-traceability.mjs' docs/architecture/adr/ADR-017-generated-risk-traceability.md \
  || fail "generated risk traceability ADR invariant is missing"

jq -e '.artifacts[] | select(.id == "ART-072" and .path == "scripts/validate-artifact-registry.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-072 validate-artifact-registry"

grep -q 'scripts/validate-artifact-registry.mjs' docs/architecture/adr/ADR-018-artifact-registry-validation.md \
  || fail "artifact registry validation ADR invariant is missing"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S19")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S19"

grep -q 'scripts/validate-process-versioning.mjs' docs/architecture/adr/ADR-019-process-versioning-validation.md \
  || fail "process versioning ADR invariant is missing"

jq -e '.next_safe_step | test("review.*merge PR #1|commit/PR evidence|release audit|process metrics snapshot")' \
  docs/process/audits/datacanvas-plan-coverage-audit.json >/dev/null \
  || fail "completed plan coverage audit must expose PR review/merge and evidence refresh as next safe step"

grep -q 'scripts/validate-plan-coverage.mjs' docs/architecture/adr/ADR-020-plan-coverage-audit.md \
  || fail "plan coverage audit ADR invariant is missing"

jq -e '.contours[] | select(.id == "technical" and .source_path == "docs/product/backlog/technical-backlog.md")' \
  docs/product/backlog/backlog-registry.json >/dev/null \
  || fail "backlog registry must include technical contour"

grep -q 'scripts/validate-backlog-registry.mjs' docs/architecture/adr/ADR-022-backlog-registry.md \
  || fail "backlog registry ADR invariant is missing"

grep -q 'scripts/validate-contract-schemas.mjs' docs/architecture/adr/ADR-023-contract-schemas.md \
  || fail "contract schemas ADR invariant is missing"

grep -q 'scripts/validate-artifact-hash-manifest.mjs' docs/architecture/adr/ADR-024-artifact-hash-manifest.md \
  || fail "artifact hash manifest ADR invariant is missing"

jq -e '.algorithm == "sha256" and (.entries | length > 0)' \
  docs/architecture/schemas/artifact-hash-manifest.json >/dev/null \
  || fail "artifact hash manifest must use sha256 and include entries"

jq -e '.artifacts[] | select(.id == "ART-111" and .path == "scripts/validate-artifact-hash-manifest.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-111 validate-artifact-hash-manifest"

grep -q 'scripts/validate-operational-readiness.mjs' docs/architecture/adr/ADR-025-operational-readiness-gate.md \
  || fail "operational readiness ADR invariant is missing"

jq -e '.gate_id == "G8" and .smoke_check.command == "npm test"' \
  docs/architecture/observability/operational-readiness-manifest.json >/dev/null \
  || fail "operational readiness manifest must expose G8 and npm test smoke check"

jq -e '.artifacts[] | select(.id == "ART-118" and .path == "scripts/validate-operational-readiness.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-118 validate-operational-readiness"

grep -q 'scripts/validate-uat-human-review.mjs' docs/architecture/adr/ADR-026-human-review-uat-gate.md \
  || fail "human review UAT ADR invariant is missing"

jq -e '.gate_id == "G9" and .acceptance_thresholds.unsupported_claims == 0' \
  docs/product/ux/uat-manifest.json >/dev/null \
  || fail "UAT manifest must expose G9 and unsupported_claims threshold"

jq -e '.transitions[] | select(.from == "approved" and .action == "export")' \
  docs/product/ux/human-review-flow.json >/dev/null \
  || fail "human review flow must include approved export transition"

jq -e '.artifacts[] | select(.id == "ART-127" and .path == "scripts/validate-uat-human-review.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-127 validate-uat-human-review"

grep -q 'scripts/validate-export-smoke.mjs' docs/architecture/adr/ADR-027-pdf-png-export-smoke.md \
  || fail "PDF/PNG export smoke ADR invariant is missing"

jq -e '([.outputs[].format] | index("pdf") and index("png"))' \
  artifacts/examples/export-smoke-manifest.json >/dev/null \
  || fail "export smoke manifest must include pdf and png outputs"

jq -e '.artifacts[] | select(.id == "ART-132" and .path == "scripts/validate-export-smoke.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-132 validate-export-smoke"

grep -q 'scripts/validate-uat-result.mjs' docs/architecture/adr/ADR-028-uat-result-fixture.md \
  || fail "UAT result ADR invariant is missing"

jq -e '.review_state == "approved" and .decision == "accepted" and .metrics.unsupported_claims == 0' \
  docs/product/ux/uat-result-minimal.json >/dev/null \
  || fail "UAT result fixture must be approved, accepted, and have zero unsupported claims"

jq -e '.artifacts[] | select(.id == "ART-141" and .path == "scripts/validate-uat-result.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-141 validate-uat-result"

grep -q 'scripts/validate-release-evidence-pack.mjs' docs/architecture/adr/ADR-029-release-evidence-pack.md \
  || fail "release evidence pack ADR invariant is missing"

jq -e '.gate_id == "G9" and .status == "release_candidate" and .acceptance_decision.decision == "accepted_for_candidate"' \
  docs/release/mvp-release-evidence-pack.json >/dev/null \
  || fail "release evidence pack must expose G9 release candidate acceptance"

jq -e '.artifacts[] | select(.id == "ART-147" and .path == "scripts/validate-release-evidence-pack.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-147 validate-release-evidence-pack"

grep -q 'scripts/validate-review-ui-fixture.mjs' docs/architecture/adr/ADR-030-review-ui-fixture.md \
  || fail "review UI fixture ADR invariant is missing"

jq -e '.gate_id == "G9" and .html_path == "artifacts/examples/review-ui-fixture.html"' \
  docs/product/ux/review-ui-fixture.json >/dev/null \
  || fail "review UI fixture must expose G9 and HTML fixture path"

jq -e '.session_kind == "fixture" and .review_state == "approved" and .decision == "accepted"' \
  docs/product/ux/human-review-session-minimal.json >/dev/null \
  || fail "human review session fixture must be approved and accepted fixture"

jq -e '.artifacts[] | select(.id == "ART-155" and .path == "scripts/validate-review-ui-fixture.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-155 validate-review-ui-fixture"

grep -q 'scripts/validate-real-uat-readiness.mjs' docs/architecture/adr/ADR-031-real-uat-readiness-gate.md \
  || fail "real UAT readiness ADR invariant is missing"

jq -e '.gate_id == "G9" and .status == "ready_for_real_session"' \
  docs/product/ux/real-uat-gate-readiness.json >/dev/null \
  || fail "real UAT readiness must expose G9 ready_for_real_session"

jq -e '.status == "template" and .session_kind == "real_user"' \
  docs/product/ux/human-review-session-real.template.json >/dev/null \
  || fail "real UAT session template must be template real_user"

grep -q 'TO_BE_FILLED' docs/product/ux/human-review-session-real.template.json \
  || fail "real UAT session template must keep TO_BE_FILLED placeholders"

jq -e '.artifacts[] | select(.id == "ART-162" and .path == "scripts/validate-real-uat-readiness.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-162 validate-real-uat-readiness"

grep -q 'scripts/validate-process-metrics.mjs' docs/architecture/adr/ADR-032-process-metrics-manifest.md \
  || fail "process metrics ADR invariant is missing"

jq -e '.metrics[] | select(.id == "MET-008" and .measurement_status == "derived")' \
  docs/process/current/process-metrics-manifest.json >/dev/null \
  || fail "process metrics manifest must include derived quality gate pass rate"

jq -e '.quality_gates[] | select(.command == "real user UAT session" and .status == "passed")' \
  docs/process/current/process-metrics-manifest.json >/dev/null \
  || fail "process metrics manifest must mark real user UAT passed"

jq -e '.artifacts[] | select(.id == "ART-167" and .path == "scripts/validate-process-metrics.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-167 validate-process-metrics"

grep -q 'scripts/validate-traceability-graph.mjs' docs/architecture/adr/ADR-033-traceability-graph-validation.md \
  || fail "traceability graph ADR invariant is missing"

jq -e '.required_chains[] | select(.id == "CHAIN-001" and .status == "covered" and (.ordered_node_ids[] == "PROC-007"))' \
  docs/architecture/schemas/traceability-graph.json >/dev/null \
  || fail "traceability graph must include covered CHAIN-001 ending in PROC-007"

jq -e '.nodes[] | select(.id == "DEC-S8-001" and .type == "sprint_decision")' \
  docs/architecture/schemas/traceability-graph.json >/dev/null \
  || fail "traceability graph must include sprint decision DEC-S8-001"

jq -e '.artifacts[] | select(.id == "ART-172" and .path == "scripts/validate-traceability-graph.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-172 validate-traceability-graph"

grep -q 'scripts/validate-review-runtime-state.mjs' docs/architecture/adr/ADR-034-review-runtime-state.md \
  || fail "review runtime state ADR invariant is missing"

jq -e '(.current_state == "approved" and .export_allowed == true) and any(.transition_history[]; .action == "export" and .from == "approved")' \
  docs/product/ux/review-runtime-state-fixture.json >/dev/null \
  || fail "review runtime state fixture must allow export only from approved state"

jq -e '.artifacts[] | select(.id == "ART-178" and .path == "scripts/validate-review-runtime-state.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-178 validate-review-runtime-state"

grep -q 'scripts/validate-review-runtime-interactive.mjs' docs/architecture/adr/ADR-037-interactive-review-runtime.md \
  || fail "interactive review runtime ADR invariant is missing"

jq -e '.gate_id == "G9" and .html_path == "artifacts/examples/review-runtime-interactive.html" and .state_storage.mechanism == "localStorage"' \
  docs/product/ux/review-runtime-interactive.json >/dev/null \
  || fail "interactive review runtime manifest must expose G9 HTML path and localStorage storage"

grep -q 'localStorage.setItem(storageKey' artifacts/examples/review-runtime-interactive.html \
  || fail "interactive review runtime HTML must persist state to localStorage"

grep -q 'download="review-runtime-state-export.json"' artifacts/examples/review-runtime-interactive.html \
  || fail "interactive review runtime HTML must expose runtime state JSON download"

jq -e '.artifacts[] | select(.id == "ART-195" and .path == "scripts/validate-review-runtime-interactive.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-195 validate-review-runtime-interactive"

grep -q 'scripts/validate-threat-model-delta.mjs' docs/architecture/adr/ADR-035-threat-model-delta-governance.md \
  || fail "threat model delta governance ADR invariant is missing"

jq -e '(.policy.require_entry_for_every_sprint == true) and any(.coverage[]; .sprint_id == "SPRINT-2026-W26-S35" and .delta_status == "delta_recorded")' \
  docs/architecture/security/threat-model-delta-manifest.json >/dev/null \
  || fail "threat model delta manifest must include S35 governance delta and forward rule"

jq -e '.coverage[] | select(.evidence_paths[] == "docs/sprints/2026-W26-security-foundation-pack/threat-model-delta.md")' \
  docs/architecture/security/threat-model-delta-manifest.json >/dev/null \
  || fail "threat model delta manifest must include explicit S21 threat-model-delta evidence"

jq -e '.artifacts[] | select(.id == "ART-183" and .path == "scripts/validate-threat-model-delta.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-183 validate-threat-model-delta"

grep -q 'scripts/validate-process-change-ledger.mjs' docs/architecture/adr/ADR-036-process-change-ledger.md \
  || fail "process change ledger ADR invariant is missing"

jq -e '.entries[] | select(.process_change_id == "PROC-035" and .status == "accepted" and (.validation_commands[] == "npm run validate:threat-model-delta"))' \
  docs/process/current/process-change-ledger.json >/dev/null \
  || fail "process change ledger must include accepted PROC-035 with threat-model-delta validation"

grep -q 'PROC-035' docs/process/current/process-changelog.md \
  || fail "process changelog must include PROC-035 managed improvement"

jq -e '.artifacts[] | select(.id == "ART-189" and .path == "scripts/validate-process-change-ledger.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-189 validate-process-change-ledger"

grep -q 'scripts/validate-process-metrics-snapshot.mjs' docs/architecture/adr/ADR-038-process-metrics-collection.md \
  || fail "process metrics collection ADR invariant is missing"

jq -e '.status == "generated" and .counts.sprint_evidence_manifests >= 1 and .counts.quality_gates_pending_external == 0' \
  docs/process/current/process-metrics-snapshot.json >/dev/null \
  || fail "process metrics snapshot must be generated and show no pending external gates"

grep -q 'scripts/validate-process-event-log.mjs' docs/architecture/adr/ADR-045-process-event-log-readiness.md \
  || fail "process event log readiness ADR invariant is missing"

jq -e '.status == "ready_for_live_events" and (.events | length == 0) and any(.derived_metric_unlocks[]; .metric_id == "MET-001" and .status == "pending_events")' \
  docs/process/current/process-event-log.json >/dev/null \
  || fail "process event log must remain ready_for_live_events with pending metric unlocks"

jq -e '.metrics[] | select(.id == "MET-001" and .measurement_status == "not_available" and (.evidence_paths[] == "docs/process/current/process-event-log.json"))' \
  docs/process/current/process-metrics-manifest.json >/dev/null \
  || fail "process metrics manifest must link MET-001 to process event log"

jq -e '.counts.process_events == 0 and (.derived_metrics[] | select(.id == "DPM-006" and .value == "0"))' \
  docs/process/current/process-metrics-snapshot.json >/dev/null \
  || fail "process metrics snapshot must include process event count"

grep -q 'scripts/validate-process-portability.mjs' docs/architecture/adr/ADR-046-process-portability-readiness.md \
  || fail "process portability readiness ADR invariant is missing"

jq -e '.status == "accepted_after_pilot" and .gate_id == "G11" and .pilot_dependency.status == "satisfied"' \
  docs/process/portability/process-portability-pack.json >/dev/null \
  || fail "process portability pack must be accepted after pilot"

jq -e '(.reusable_templates | length) >= 5 and any(.reusable_templates[]; .path == "docs/process/templates/sprint-folder-template.md")' \
  docs/process/portability/process-portability-pack.json >/dev/null \
  || fail "process portability pack must include reusable templates"

grep -q 'Sprint evidence coverage' docs/process/current/process-metrics-snapshot.md \
  || fail "process metrics snapshot report must include sprint evidence coverage"

jq -e '.artifacts[] | select(.id == "ART-202" and .path == "scripts/validate-process-metrics-snapshot.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-202 validate-process-metrics-snapshot"

grep -q 'scripts/validate-artifact-registry.mjs' docs/architecture/adr/ADR-039-artifact-registry-hash-linkage.md \
  || fail "artifact registry hash linkage ADR invariant is missing"

jq -e '.hash_manifest_path == "docs/architecture/schemas/artifact-hash-manifest.json" and .hash_algorithm == "sha256" and .snapshot_policy.validation_command == "npm run validate:artifact-hashes"' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include hash manifest linkage and snapshot validation policy"

jq -e '.artifacts[] | select(.id == "ART-205" and .path == "docs/architecture/adr/ADR-039-artifact-registry-hash-linkage.md")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-205 artifact registry hash linkage ADR"

grep -q 'scripts/validate-renderer-regression.mjs' docs/architecture/adr/ADR-040-renderer-regression-pack.md \
  || fail "renderer regression pack ADR invariant is missing"

jq -e '(.cases | map(.format) | index("html") and index("pdf") and index("png")) and (.required_gates[] == "npm run validate:renderer-regression")' \
  artifacts/examples/renderer-regression-manifest.json >/dev/null \
  || fail "renderer regression manifest must include html/pdf/png cases and validation gate"

jq -e '.artifacts[] | select(.id == "ART-210" and .path == "scripts/validate-renderer-regression.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-210 validate-renderer-regression"

grep -q 'scripts/validate-data-leakage.mjs' docs/architecture/adr/ADR-041-data-leakage-gate.md \
  || fail "data leakage gate ADR invariant is missing"

jq -e '(.forbidden_classes | index("secret") and index("pii") and index("local_path")) and any(.required_gates[]; . == "npm run validate:data-leakage")' \
  docs/architecture/security/data-leakage-manifest.json >/dev/null \
  || fail "data leakage manifest must include forbidden classes and validation gate"

jq -e '.required_gates[] | select(. == "npm run validate:data-leakage")' \
  docs/architecture/security/security-foundation-manifest.json >/dev/null \
  || fail "security foundation manifest must require data leakage validation"

jq -e '.artifacts[] | select(.id == "ART-215" and .path == "scripts/validate-data-leakage.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-215 validate-data-leakage"

grep -q 'scripts/validate-release-evidence-pack.mjs' docs/architecture/adr/ADR-042-release-evidence-current-gates.md \
  || fail "release evidence current gates ADR invariant is missing"

jq -e '([.ci_evidence[].command] | index("npm run validate:review-runtime-interactive") and index("npm run validate:renderer-regression") and index("npm run validate:data-leakage") and index("npm run validate:process-metrics-snapshot"))' \
  docs/release/mvp-release-evidence-pack.json >/dev/null \
  || fail "release evidence pack must include current gate commands"

jq -e '([.evidence_paths[]] | index("artifacts/examples/review-runtime-interactive.html") and index("artifacts/examples/renderer-regression-manifest.json") and index("docs/architecture/security/data-leakage-manifest.json") and index("docs/process/current/process-metrics-snapshot.json"))' \
  docs/release/mvp-release-evidence-pack.json >/dev/null \
  || fail "release evidence pack must include current gate evidence paths"

jq -e 'all(.known_risks[]; .risk_id != "no-interactive-review-ui") and any(.known_risks[]; .risk_id == "not-real-user-runtime-session")' \
  docs/release/mvp-release-evidence-pack.json >/dev/null \
  || fail "release evidence pack must replace stale review UI risk with real runtime session risk"

jq -e '.artifacts[] | select(.id == "ART-218" and .path == "docs/architecture/adr/ADR-042-release-evidence-current-gates.md")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-218 release evidence current gates ADR"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S42")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S42"

grep -q 'scripts/validate-real-uat-import.mjs' docs/architecture/adr/ADR-043-real-uat-runtime-import-gate.md \
  || fail "real UAT runtime import ADR invariant is missing"

jq -e '.status == "ready_for_real_runtime_import" and .runtime_export_contract.expected_status == "recorded_real_user" and .runtime_export_contract.expected_session_kind == "real_user"' \
  docs/product/ux/real-uat-runtime-import.json >/dev/null \
  || fail "real UAT runtime import manifest must require recorded real user runtime state"

jq -e '([.required_runtime_actions[]] | index("submit_for_review") and index("comment") and index("record_decision") and index("export"))' \
  docs/product/ux/real-uat-runtime-import.json >/dev/null \
  || fail "real UAT runtime import manifest must require review, comment, decision and export actions"

jq -e '.artifacts[] | select(.id == "ART-223" and .path == "scripts/validate-real-uat-import.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-223 validate-real-uat-import"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S43")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S43"

grep -q 'scripts/validate-real-uat-operator-handoff.mjs' docs/architecture/adr/ADR-047-real-uat-operator-handoff.md \
  || fail "real UAT operator handoff ADR invariant is missing"

jq -e '.status == "ready_for_real_operator_run" and .gate_id == "G9"' \
  docs/product/ux/real-uat-operator-handoff.json >/dev/null \
  || fail "real UAT operator handoff must be ready for real operator run and linked to G9"

jq -e '([.validation_commands[]] | index("npm run validate:real-uat-operator-handoff") and index("npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run") and index("npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run") and index("npm test"))' \
  docs/product/ux/real-uat-operator-handoff.json >/dev/null \
  || fail "real UAT operator handoff must include validation commands"

jq -e '([.required_outputs[].path] | index("artifacts/manual/real-uat/review-runtime-state-export.json") and index("docs/product/ux/human-review-session-real.json") and index("docs/release/mvp-release-evidence-pack.json"))' \
  docs/product/ux/real-uat-operator-handoff.json >/dev/null \
  || fail "real UAT operator handoff must require runtime export, real session and release evidence outputs"

jq -e '.artifacts[] | select(.id == "ART-245" and .path == "scripts/validate-real-uat-operator-handoff.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-245 validate-real-uat-operator-handoff"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S47")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S47"

grep -q 'scripts/prepare-real-uat-session.mjs' docs/architecture/adr/ADR-048-real-uat-session-importer.md \
  || fail "real UAT session importer ADR invariant is missing"

jq -e '.status == "ready_for_real_export" and .gate_id == "G9"' \
  docs/product/ux/real-uat-session-importer.json >/dev/null \
  || fail "real UAT session importer must be ready for real export and linked to G9"

jq -e '.input_contract.required_status == "recorded_real_user" and .input_contract.required_session_kind == "real_user" and .output_contract.required_status == "recorded_real_user" and .output_contract.required_session_kind == "real_user"' \
  docs/product/ux/real-uat-session-importer.json >/dev/null \
  || fail "real UAT session importer must require real input and real output"

jq -e '([.validation_commands[]] | index("npm run validate:real-uat-session-importer") and index("npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json") and index("npm test"))' \
  docs/product/ux/real-uat-session-importer.json >/dev/null \
  || fail "real UAT session importer must include validation and prepare commands"

jq -e '.artifacts[] | select(.id == "ART-251" and .path == "scripts/prepare-real-uat-session.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-251 prepare-real-uat-session"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S48")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S48"

grep -q 'scripts/validate-data-leakage.mjs' docs/architecture/adr/ADR-049-real-uat-leakage-guard.md \
  || fail "real UAT leakage guard ADR invariant is missing"

jq -e '.status == "active_conditional_guard" and ([.conditional_targets[].path] | index("artifacts/manual/real-uat/review-runtime-state-export.json") and index("docs/product/ux/human-review-session-real.json"))' \
  docs/architecture/security/real-uat-leakage-guard.json >/dev/null \
  || fail "real UAT leakage guard must cover runtime export and real session artifact"

jq -e 'all(.conditional_targets[]; .required_when_exists == true and .data_class == "confidential")' \
  docs/architecture/security/real-uat-leakage-guard.json >/dev/null \
  || fail "real UAT leakage guard targets must be conditional confidential targets"

jq -e '.artifacts[] | select(.id == "ART-256" and .path == "docs/architecture/security/real-uat-leakage-guard.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-256 real UAT leakage guard"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S49")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S49"

grep -q 'scripts/validate-release-evidence-pack.mjs' docs/architecture/adr/ADR-050-release-evidence-real-uat-alignment.md \
  || fail "release evidence real UAT alignment ADR invariant is missing"

jq -e '([.ci_evidence[].command] | index("npm run validate:real-uat-operator-handoff") and index("npm run validate:real-uat-session-importer"))' \
  docs/release/mvp-release-evidence-pack.json >/dev/null \
  || fail "release evidence pack must include real UAT handoff/importer validation commands"

jq -e '([.evidence_paths[]] | index("docs/product/ux/real-uat-operator-handoff.json") and index("docs/product/ux/real-uat-session-importer.json") and index("docs/architecture/security/real-uat-leakage-guard.json"))' \
  docs/release/mvp-release-evidence-pack.json >/dev/null \
  || fail "release evidence pack must include real UAT readiness evidence paths"

jq -e '.artifacts[] | select(.id == "ART-259" and .path == "docs/architecture/adr/ADR-050-release-evidence-real-uat-alignment.md")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-259 release evidence real UAT alignment ADR"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S50")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S50"

grep -q 'scripts/validate-plan-completion-audit.mjs' docs/architecture/adr/ADR-051-plan-completion-audit-gate.md \
  || fail "plan completion audit ADR invariant is missing"

jq -e '.status == "complete" and (.blocking_external_evidence | length == 0)' \
  docs/process/audits/plan-completion-audit.json >/dev/null \
  || fail "plan completion audit must be complete after pilot and commit evidence"

jq -e 'any(.completion_requirements[]; .id == "DOD-005" and .status == "met") and any(.completion_requirements[]; .id == "DOD-010" and .status == "met")' \
  docs/process/audits/plan-completion-audit.json >/dev/null \
  || fail "plan completion audit must mark MVP and pilot DoD met"

jq -e '.artifacts[] | select(.id == "ART-263" and .path == "docs/process/audits/plan-completion-audit.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-263 plan completion audit"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S51")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S51"

grep -q 'scripts/validate-pilot-execution-handoff.mjs' docs/architecture/adr/ADR-052-pilot-execution-handoff.md \
  || fail "pilot execution handoff ADR invariant is missing"

jq -e '.status == "ready_for_pilot_run_after_real_uat" and .gate_id == "G10" and .depends_on_gate_id == "G9"' \
  docs/release/pilot-execution-handoff.json >/dev/null \
  || fail "pilot execution handoff must remain readiness for G10 after G9"

jq -e '([.validation_commands[]] | index("npm run validate:pilot-execution-handoff") and index("npm run validate:pilot-gate") and index("npm test"))' \
  docs/release/pilot-execution-handoff.json >/dev/null \
  || fail "pilot execution handoff must include required validation commands"

jq -e 'any(.required_outputs[]; .path == "docs/release/pilot-report.md") and any(.required_outputs[]; .path == "docs/release/pilot-process-portability-notes.md")' \
  docs/release/pilot-execution-handoff.json >/dev/null \
  || fail "pilot execution handoff must require pilot report and portability notes"

jq -e 'any(.required_evidence[]; .id == "PGR-008" and .path == "docs/release/pilot-execution-handoff.json" and .status == "available")' \
  docs/release/pilot-gate-readiness.json >/dev/null \
  || fail "pilot gate readiness must include pilot execution handoff evidence"

jq -e '.artifacts[] | select(.id == "ART-270" and .path == "docs/release/pilot-execution-handoff.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-270 pilot execution handoff"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S52")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S52"

grep -q 'scripts/validate-pilot-report-templates.mjs' docs/architecture/adr/ADR-053-pilot-report-templates.md \
  || fail "pilot report templates ADR invariant is missing"

grep -q 'Статус: template only' docs/release/templates/pilot-report-template.md \
  || fail "pilot report template must be marked template only"

grep -q 'G11 Decision' docs/release/templates/pilot-process-portability-notes-template.md \
  || fail "pilot process portability notes template must include G11 decision"

jq -e '([.validation_commands[]] | index("npm run validate:pilot-report-templates"))' \
  docs/release/pilot-execution-handoff.json >/dev/null \
  || fail "pilot execution handoff must require pilot report templates validation"

jq -e '.artifacts[] | select(.id == "ART-273" and .path == "docs/release/templates/pilot-report-template.md")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-273 pilot report template"

jq -e '.artifacts[] | select(.id == "ART-274" and .path == "docs/release/templates/pilot-process-portability-notes-template.md")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-274 pilot portability template"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S53")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S53"

grep -q 'scripts/validate-commit-pr-evidence-template.mjs' docs/architecture/adr/ADR-054-commit-pr-evidence-template.md \
  || fail "commit/PR evidence template ADR invariant is missing"

grep -q 'Статус: template only' docs/release/templates/commit-pr-evidence-template.md \
  || fail "commit/PR evidence template must be marked template only"

jq -e '([.validation_commands[]] | index("npm run validate:commit-pr-evidence-template"))' \
  docs/release/pilot-execution-handoff.json >/dev/null \
  || fail "pilot execution handoff must require commit/PR evidence template validation"

jq -e '.commit_sha.status == "captured"' \
  docs/release/mvp-release-evidence-pack.json >/dev/null \
  || fail "release evidence pack must capture commit SHA"

release_commit_sha="$(jq -r '.commit_sha.value' docs/release/mvp-release-evidence-pack.json)"
[[ "$release_commit_sha" =~ ^[0-9a-f]{40}$ ]] \
  || fail "release evidence pack must capture real commit SHA"

grep -q "$release_commit_sha" docs/release/commit-pr-evidence.md \
  || fail "commit/PR evidence must include captured release commit SHA"

jq -e '.artifacts[] | select(.id == "ART-278" and .path == "docs/release/templates/commit-pr-evidence-template.md")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-278 commit/PR evidence template"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S54")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S54"

grep -q 'scripts/validate-external-blocker-closure-map.mjs' docs/architecture/adr/ADR-055-external-blocker-closure-map.md \
  || fail "external blocker closure map ADR invariant is missing"

jq -e '.status == "external_evidence_collected" and .source_audit_path == "docs/process/audits/plan-completion-audit.json"' \
  docs/process/audits/external-blocker-closure-map.json >/dev/null \
  || fail "external blocker closure map must link to plan completion audit"

jq -e '([.blockers[].blocking_evidence] | index("docs/release/pilot-report.md") and index("docs/release/pilot-process-portability-notes.md") and index("commit-sha-and-pr-evidence"))' \
  docs/process/audits/external-blocker-closure-map.json >/dev/null \
  || fail "external blocker closure map must include closed completion audit blockers"

jq -e 'all(.blockers[]; .status == "closed")' \
  docs/process/audits/external-blocker-closure-map.json >/dev/null \
  || fail "external blocker closure map blockers must be closed"

jq -e '.artifacts[] | select(.id == "ART-283" and .path == "docs/process/audits/external-blocker-closure-map.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-283 external blocker closure map"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S55")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S55"

grep -q 'scripts/validate-real-uat-preflight.mjs' docs/architecture/adr/ADR-056-real-uat-preflight-checklist.md \
  || fail "real UAT preflight ADR invariant is missing"

jq -e '.status == "ready_before_real_session" and .gate_id == "G9"' \
  docs/product/ux/real-uat-preflight-checklist.json >/dev/null \
  || fail "real UAT preflight checklist must stay ready before real session"

jq -e '([.validation_commands[]] | index("npm run validate:real-uat-preflight") and index("npm run validate:real-uat-import") and index("npm run validate:plan-completion-audit") and index("npm test"))' \
  docs/product/ux/real-uat-preflight-checklist.json >/dev/null \
  || fail "real UAT preflight checklist must include required validation commands"

jq -e '([.external_evidence_policy.must_not_create[]] | index("artifacts/manual/real-uat/review-runtime-state-export.json") and index("docs/product/ux/human-review-session-real.json"))' \
  docs/product/ux/real-uat-preflight-checklist.json >/dev/null \
  || fail "real UAT preflight checklist must not create external evidence"

jq -e '.artifacts[] | select(.id == "ART-290" and .path == "docs/product/ux/real-uat-preflight-checklist.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-290 real UAT preflight checklist"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S56")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S56"

grep -q 'artifacts/examples/review-runtime-interactive.html' docs/architecture/adr/ADR-057-real-uat-runtime-actor-identity.md \
  || fail "real UAT runtime actor identity ADR invariant is missing"

grep -q 'id="actor-id"' artifacts/examples/review-runtime-interactive.html \
  || fail "interactive runtime must include actor id input"

grep -q 'id="real-uat-mode"' artifacts/examples/review-runtime-interactive.html \
  || fail "interactive runtime must include real UAT mode toggle"

grep -q 'id="reset-runtime"' artifacts/examples/review-runtime-interactive.html \
  || fail "interactive runtime must include reset control"

if grep -q 'interactive-approver\|interactive-${transition.role}' artifacts/examples/review-runtime-interactive.html; then
  fail "interactive runtime must not generate interactive-* actor ids"
fi

jq -e '.actor_controls.actor_input_id == "actor-id" and .actor_controls.real_uat_toggle_id == "real-uat-mode" and .actor_controls.reset_control_id == "reset-runtime"' \
  docs/product/ux/review-runtime-interactive.json >/dev/null \
  || fail "review runtime interactive manifest must include actor controls"

jq -e '.artifacts[] | select(.id == "ART-294" and .path == "docs/architecture/adr/ADR-057-real-uat-runtime-actor-identity.md")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-294 real UAT runtime actor identity ADR"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S57")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S57"

grep -q 'scripts/validate-real-uat-import.mjs' docs/architecture/adr/ADR-058-real-uat-import-dry-run.md \
  || fail "real UAT import dry-run ADR invariant is missing"

grep -q 'hasArg("--dry-run")' scripts/validate-real-uat-import.mjs \
  || fail "real UAT import validator must support --dry-run"

jq -e '([.required_validation_commands[]] | index("npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run") and index("npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run"))' \
  docs/product/ux/real-uat-runtime-import.json >/dev/null \
  || fail "real UAT runtime import manifest must require dry-run commands"

jq -e '.artifacts[] | select(.id == "ART-296" and .path == "docs/architecture/adr/ADR-058-real-uat-import-dry-run.md")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-296 real UAT import dry-run ADR"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S58")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S58"

grep -q 'scripts/validate-review-runtime-browser-matrix.mjs' docs/architecture/adr/ADR-059-review-runtime-browser-matrix.md \
  || fail "review runtime browser matrix ADR invariant is missing"

jq -e '.status == "ready_for_static_browser_matrix" and .gate_id == "G9" and ([.validation_commands[]] | index("npm run validate:review-runtime-browser-matrix") and index("npm run validate:review-runtime-interactive") and index("npm test"))' \
  docs/product/ux/review-runtime-browser-matrix.json >/dev/null \
  || fail "review runtime browser matrix must include required validation commands"

jq -e '([.viewport_targets[].class] | index("mobile") and index("tablet") and index("desktop"))' \
  docs/product/ux/review-runtime-browser-matrix.json >/dev/null \
  || fail "review runtime browser matrix must include mobile/tablet/desktop targets"

jq -e '.artifacts[] | select(.id == "ART-299" and .path == "docs/product/ux/review-runtime-browser-matrix.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-299 review runtime browser matrix"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S59")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S59"

grep -q 'scripts/validate-review-runtime-browser-smoke.mjs' docs/architecture/adr/ADR-060-review-runtime-browser-smoke.md \
  || fail "review runtime browser smoke ADR invariant is missing"

jq -e '.status == "ready_for_static_browser_smoke" and .gate_id == "G9" and .browser_matrix_path == "docs/product/ux/review-runtime-browser-matrix.json" and ([.validation_commands[]] | index("npm run validate:review-runtime-browser-smoke") and index("npm run validate:review-runtime-browser-matrix") and index("npm run validate:review-runtime-interactive") and index("npm test"))' \
  docs/product/ux/review-runtime-browser-smoke.json >/dev/null \
  || fail "review runtime browser smoke must include required validation commands"

jq -e '([.required_dom_ids[]] | index("actor-id") and index("real-uat-mode") and index("runtime-state-json") and index("state-json"))' \
  docs/product/ux/review-runtime-browser-smoke.json >/dev/null \
  || fail "review runtime browser smoke must include required DOM controls"

jq -e '.artifacts[] | select(.id == "ART-305" and .path == "docs/product/ux/review-runtime-browser-smoke.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-305 review runtime browser smoke"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S60")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S60"

grep -q 'scripts/validate-export-png-pixel-smoke.mjs' docs/architecture/adr/ADR-061-export-png-pixel-smoke.md \
  || fail "export PNG pixel smoke ADR invariant is missing"

jq -e '.status == "ready_for_pixel_smoke" and .png_path == "artifacts/examples/presentation-smoke.png" and .expected_png.width == 1 and .expected_png.height == 1 and .expected_png.bit_depth == 8 and .expected_png.color_type == 6 and ([.expected_png.first_pixel_rgba[]] == [37,99,235,255])' \
  docs/product/ux/export-png-pixel-smoke.json >/dev/null \
  || fail "export PNG pixel smoke manifest must keep expected PNG metadata"

jq -e '([.validation_commands[]] | index("npm run validate:export-smoke") and index("npm run validate:export-png-pixel-smoke") and index("npm test"))' \
  docs/product/ux/export-png-pixel-smoke.json >/dev/null \
  || fail "export PNG pixel smoke manifest must include required validation commands"

jq -e '.artifacts[] | select(.id == "ART-311" and .path == "docs/product/ux/export-png-pixel-smoke.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-311 export PNG pixel smoke"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S61")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S61"

grep -q 'scripts/validate-external-evidence-readiness.mjs' docs/architecture/adr/ADR-062-external-evidence-readiness.md \
  || fail "external evidence readiness ADR invariant is missing"

jq -e '.status == "external_evidence_collected" and .source_audit_path == "docs/process/audits/plan-completion-audit.json" and .source_closure_map_path == "docs/process/audits/external-blocker-closure-map.json"' \
  docs/process/audits/external-evidence-readiness.json >/dev/null \
  || fail "external evidence readiness manifest must target completion audit and closure map"

jq -e '([.blockers[].blocking_evidence] | index("docs/release/pilot-report.md") and index("docs/release/pilot-process-portability-notes.md") and index("commit-sha-and-pr-evidence")) and all(.blockers[]; .current_state == "collected")' \
  docs/process/audits/external-evidence-readiness.json >/dev/null \
  || fail "external evidence readiness must include collected completion evidence"

jq -e '([.validation_commands[]] | index("npm run validate:external-evidence-readiness") and index("npm run validate:external-blocker-closure-map") and index("npm run validate:plan-completion-audit") and index("npm test"))' \
  docs/process/audits/external-evidence-readiness.json >/dev/null \
  || fail "external evidence readiness must include required validation commands"

jq -e '.artifacts[] | select(.id == "ART-317" and .path == "docs/process/audits/external-evidence-readiness.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-317 external evidence readiness"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S62")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S62"

grep -q 'npm run uat:real' docs/architecture/adr/ADR-063-real-uat-one-command-runner.md \
  || fail "real UAT one-command runner ADR invariant is missing"

jq -e '.status == "ready_for_single_command_real_uat" and .command == "npm run uat:real" and .server.host == "127.0.0.1" and .input_runtime_path == "artifacts/manual/real-uat/review-runtime-state-export.json" and .output_session_path == "docs/product/ux/human-review-session-real.json"' \
  docs/product/ux/real-uat-one-command-runner.json >/dev/null \
  || fail "real UAT one-command runner manifest must keep command, host and evidence paths"

jq -e '([.post_export_commands[]] | index("npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run") and index("npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run") and index("npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json"))' \
  docs/product/ux/real-uat-one-command-runner.json >/dev/null \
  || fail "real UAT one-command runner must include post-export import commands"

jq -e '.artifacts[] | select(.id == "ART-323" and .path == "docs/product/ux/real-uat-one-command-runner.json")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-323 real UAT one-command runner"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S63")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S63"

grep -q 'scripts/validate-pilot-gate-readiness.mjs' docs/architecture/adr/ADR-044-pilot-gate-readiness.md \
  || fail "pilot gate readiness ADR invariant is missing"

jq -e '.status == "accepted" and .gate_id == "G10" and .depends_on_gate_id == "G9"' \
  docs/release/pilot-gate-readiness.json >/dev/null \
  || fail "pilot gate readiness must be accepted and depend on G9"

jq -e 'any(.required_evidence[]; .id == "PGR-002" and .status == "available" and .path == "docs/product/ux/human-review-session-real.json")' \
  docs/release/pilot-gate-readiness.json >/dev/null \
  || fail "pilot gate readiness must mark real human review session available"

jq -e 'any(.required_evidence[]; .id == "PGR-006" and .status == "available" and .path == "docs/release/commit-pr-evidence.md")' \
  docs/release/pilot-gate-readiness.json >/dev/null \
  || fail "pilot gate readiness must mark commit/PR evidence available"

jq -e '.artifacts[] | select(.id == "ART-228" and .path == "scripts/validate-pilot-gate-readiness.mjs")' \
  docs/architecture/schemas/artifact-registry.json >/dev/null \
  || fail "artifact registry must include ART-228 validate-pilot-gate"

jq -e '.applied_sprint_ids[] | select(. == "SPRINT-2026-W26-S44")' \
  docs/process/versions/0.1.0/process-version-manifest.json >/dev/null \
  || fail "process version manifest must include S44"

jq -e '.required_gates[] | select(. == "npm run scan:secrets")' \
  docs/architecture/security/security-foundation-manifest.json >/dev/null \
  || fail "security foundation manifest must require secret scan"

grep -q 'scripts/validate-security-foundation.mjs' docs/architecture/adr/ADR-021-security-foundation-gate.md \
  || fail "security foundation ADR invariant is missing"

jq -e '.items[] | select(.risk_id == "prompt_injection_or_secret_leak" and (.evidence_paths[] == "tests/provider/provider-experiment-result-security-rollback.json"))' \
  docs/architecture/risks/risk-evidence-map.json >/dev/null \
  || fail "risk evidence map must link prompt_injection_or_secret_leak to security rollback evidence"

jq -e '.status == "completed" and .metrics.quality_score >= 0.9' \
  tests/provider/provider-experiment-result-scored.json >/dev/null \
  || fail "scored provider result must be completed and above threshold"

jq -e '.decision == "rollback" and .metrics.quality_score < 0.9' \
  tests/provider/provider-experiment-result-rollback.json >/dev/null \
  || fail "rollback provider result must demonstrate rollback decision below threshold"

for path in \
  tests/provider/provider-experiment-result-security-rollback.json \
  tests/provider/provider-experiment-result-cost-rollback.json \
  tests/provider/provider-experiment-result-latency-rollback.json \
  tests/provider/provider-experiment-result-failure-rollback.json; do
  jq -e '.decision == "rollback" and .metrics.quality_score < 0.9' "$path" >/dev/null \
    || fail "$path must demonstrate rollback decision below threshold"
done

jq -e '.links[] | select(.requirement_id == "NFR-001" and (.risks[] == "unsupported_claims"))' \
  docs/product/requirements/traceability-matrix.json >/dev/null \
  || fail "traceability matrix must link NFR-001 to unsupported_claims"

jq -e '.links[] | select(.risk_id == "prompt_injection_or_secret_leak" and (.nfr_ids[] == "NFR-003"))' \
  docs/architecture/risks/risk-traceability.json >/dev/null \
  || fail "risk traceability must link prompt_injection_or_secret_leak to NFR-003"

jq -e '.links[] | select(.risk_id == "provider_unreliability" and (.evidence_paths[] == "tests/provider/provider-experiment-result-failure-rollback.json"))' \
  docs/architecture/risks/risk-traceability.json >/dev/null \
  || fail "risk traceability must link provider_unreliability to failure rollback evidence"

grep -q 'Risk Matrix' docs/architecture/risks/risk-matrix.md \
  || fail "risk matrix report title is missing"

grep -q 'provider_unreliability' docs/architecture/risks/risk-matrix.md \
  || fail "risk matrix report must include provider_unreliability"

printf 'bootstrap artifact validation passed\n'
