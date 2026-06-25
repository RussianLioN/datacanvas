# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `scripts/generate-risk-matrix-report.mjs`
- `scripts/validate-risk-matrix.mjs`
- `docs/architecture/risks/risk-matrix.md`
- Sprint 16 evidence pack.

## Изменено

- `package.json`: risk matrix generation включена в `generate:golden`, `validate:risk-matrix` включен в `npm test`.
- `.github/workflows/docs-check.yml`: добавлен risk matrix gate.
- `scripts/validate-bootstrap-artifacts.sh`: risk matrix artifacts стали обязательными.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы Sprint 16 artifacts.
