# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `schemas/risk-traceability.schema.json`
- `docs/architecture/risks/risk-traceability.json`
- `tests/provider/llm-result-prompt-injection-output.json`
- `tests/provider/provider-experiment-result-security-rollback.json`
- `tests/provider/provider-experiment-result-cost-rollback.json`
- `tests/provider/provider-experiment-result-latency-rollback.json`
- `tests/provider/scenario-cost-overrun.json`
- `tests/provider/scenario-latency-overrun.json`
- Sprint 14 evidence pack.

## Изменено

- `scripts/score-provider-output.mjs`: добавлен optional scenario file.
- `scripts/validate-provider-scorer.mjs`: проверяет typed risk traceability и новые rollback branches.
- `package.json`: новые scorer branches включены в `generate:golden`.
- `scripts/validate-json-schema.mjs`: добавлены RiskTraceability и rollback branch checks.
- `scripts/validate-bootstrap-artifacts.sh`: новые branches стали обязательными.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы Sprint 14 artifacts.
