# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `tests/provider/scenario-failure-overrun.json`
- `tests/provider/provider-experiment-result-failure-rollback.json`
- Sprint 15 evidence pack.

## Изменено

- `package.json`: failure rollback generation включена в `generate:golden`.
- `docs/architecture/risks/risk-traceability.json`: provider unreliability ссылается на failure rollback evidence.
- `scripts/validate-provider-scorer.mjs`: добавлен failure rollback и cross-check against traceability matrix.
- `scripts/validate-json-schema.mjs`: добавлены failure rollback и traceability cross-check.
- `scripts/validate-bootstrap-artifacts.sh`: failure rollback artifact стал обязательным.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы Sprint 15 artifacts.
