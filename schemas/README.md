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

Эти схемы являются базовым контрактом Sprint 0, каскадного ведения документации и prompt-only согласования артефактов проектной документации. JSON Schema validation выполняется через `npm run validate:schemas`, а межартефактные инварианты cascade-контракта проверяет `npm run validate:cascading-governance`.
