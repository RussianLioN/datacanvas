# Evidence Index

Версия процесса: 0.1.0

## Артефакты

- `tests/provider/llm-result-unsupported-provider-output.json`
- `tests/provider/provider-experiment-result-rollback.json`
- `docs/product/requirements/traceability-matrix.json`
- `docs/product/requirements/non-functional-requirements.md`
- `docs/sprints/2026-W26-provider-negative-risk-traceability/sprint-evidence-manifest.json`

## Проверки

- `npm run generate:golden`
- `npm run validate:provider-scorer`
- `npm run validate:schemas`
- `npm test`
- `git diff --check`
