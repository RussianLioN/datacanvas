# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `tests/provider/llm-result-unsupported-provider-output.json`
- `tests/provider/provider-experiment-result-rollback.json`
- Sprint 13 evidence pack.

## Изменено

- `scripts/score-provider-output.mjs`: добавлены параметры input/output.
- `scripts/validate-provider-scorer.mjs`: добавлены rollback и risk traceability checks.
- `package.json`: rollback scored result включен в `generate:golden`.
- `scripts/validate-json-schema.mjs`: rollback result и risk traceability включены в schema/cross-artifact checks.
- `scripts/validate-bootstrap-artifacts.sh`: rollback fixture и NFR risk link стали обязательными.
- `docs/product/requirements/traceability-matrix.json`: добавлены links для `NFR-001`, `NFR-003`, `NFR-004`.
- `docs/product/requirements/non-functional-requirements.md`: добавлены risk links.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы Sprint 13 artifacts.
