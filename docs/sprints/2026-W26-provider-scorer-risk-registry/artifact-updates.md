# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `schemas/risk-registry.schema.json`
- `docs/architecture/risks/risk-registry.json`
- `scripts/score-provider-output.mjs`
- `scripts/validate-provider-scorer.mjs`
- `tests/provider/provider-experiment-result-scored.json`
- `docs/architecture/adr/ADR-016-provider-output-scorer-and-risk-registry.md`
- Sprint 12 evidence pack.

## Изменено

- `package.json`: `score-provider-output.mjs` включен в `generate:golden`; добавлен `validate:provider-scorer`; общий `npm test` расширен.
- `.github/workflows/docs-check.yml`: добавлен provider scorer gate.
- `scripts/validate-json-schema.mjs`: добавлены risk registry, scored result и risk linkage checks.
- `scripts/validate-bootstrap-artifacts.sh`: scorer artifacts стали обязательными.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы Sprint 12 artifacts.
