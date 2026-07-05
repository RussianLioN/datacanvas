# Schemas

Здесь будут храниться JSON-схемы контрактов DataCanvas.

Стартовые схемы:
- `input-package.schema.json`
- `normalized-data.schema.json`
- `presentation-spec.schema.json`
- `trace-manifest.schema.json`
- `sprint-evidence-manifest.schema.json`
- `artifact-registry.schema.json`
- `claim-map.schema.json`
- `eval-case.schema.json`
- `render-result.schema.json`
- `llm-request.schema.json`
- `llm-result.schema.json`
- `documentation-change-request.schema.json`
- `artifact-dependency-graph.schema.json`
- `impact-analysis-report.schema.json`
- `user-decision-queue.schema.json`
- `capacity-plan.schema.json`
- `reprioritization-impact-report.schema.json`
- `cascading-update-run.schema.json`
- `jira-field-mapping-request.schema.json`
- `jira-import-package-manifest.schema.json`
- `agent-launch-requirements-analysis-state.schema.json`
- `agent-launch-requirements-impact-map.schema.json`
- `prompt-only-artifact-link-catalog.schema.json`
- `prompt-only-artifact-review-session-state.schema.json`
- `universal-documentation-core.schema.json`
- `datacanvas-documentation-profile.schema.json`
- `documentation-project-profile.schema.json`
- `documentation-product-profile.schema.json`
- `documentation-artifact-inventory.schema.json`
- `validation-command-catalog.schema.json`
- `workflow-state.schema.json`
- `workflow-decision-queue.schema.json`
- `decision-ledger.schema.json`
- `acceptance-records.schema.json`
- `run-ledger.schema.json`
- `event-log.schema.json`
- `generator-contracts.schema.json`
- `schema-coverage-registry.schema.json`
- `mutation-guard-policy.schema.json`
- `workflow-portability-pack.schema.json`
- `product-bootstrap-pack.schema.json`

Эти схемы являются базовым контрактом Sprint 0, каскадного ведения документации, prompt-only согласования артефактов проектной документации и универсального документационного workflow. JSON Schema validation выполняется через `npm run validate:schemas`, межартефактные инварианты cascade-контракта проверяет `npm run validate:cascading-governance`, а универсальный workflow проверяет `npm run validate:universal-documentation-workflow`.
