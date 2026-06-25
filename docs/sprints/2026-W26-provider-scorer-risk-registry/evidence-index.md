# Evidence Index

Версия процесса: 0.1.0

## Артефакты

- `schemas/risk-registry.schema.json`
- `docs/architecture/risks/risk-registry.json`
- `scripts/score-provider-output.mjs`
- `scripts/validate-provider-scorer.mjs`
- `tests/provider/provider-experiment-result-scored.json`
- `docs/architecture/adr/ADR-016-provider-output-scorer-and-risk-registry.md`
- `docs/sprints/2026-W26-provider-scorer-risk-registry/sprint-evidence-manifest.json`

## Проверки

- `npm run generate:golden`
- `npm run validate:provider-scorer`
- `npm run validate:schemas`
- `npm test`
- `git diff --check`
