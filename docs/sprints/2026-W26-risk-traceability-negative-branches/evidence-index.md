# Evidence Index

Версия процесса: 0.1.0

## Артефакты

- `schemas/risk-traceability.schema.json`
- `docs/architecture/risks/risk-traceability.json`
- `tests/provider/llm-result-prompt-injection-output.json`
- `tests/provider/provider-experiment-result-security-rollback.json`
- `tests/provider/provider-experiment-result-cost-rollback.json`
- `tests/provider/provider-experiment-result-latency-rollback.json`
- `tests/provider/scenario-cost-overrun.json`
- `tests/provider/scenario-latency-overrun.json`
- `docs/sprints/2026-W26-risk-traceability-negative-branches/sprint-evidence-manifest.json`

## Проверки

- `npm run generate:golden`
- `npm run validate:provider-scorer`
- `npm run validate:schemas`
- `npm test`
- `git diff --check`
