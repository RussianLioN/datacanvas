# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `schemas/provider-experiment-result.schema.json`
- `docs/architecture/llm/provider-experiment-result-template.json`
- `docs/process/experiments/EXP-001-controlled-llm-provider.md`
- `docs/architecture/adr/ADR-014-provider-experiment-result-contract.md`
- `scripts/validate-provider-experiment.mjs`
- Sprint 10 evidence pack.

## Изменено

- `package.json`: добавлен `validate:provider-experiment`, включен в `npm test`.
- `.github/workflows/docs-check.yml`: добавлен provider experiment contract gate.
- `scripts/validate-json-schema.mjs`: добавлена schema validation experiment result.
- `scripts/validate-bootstrap-artifacts.sh`: новые experiment artifacts стали обязательными.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы Sprint 10 artifacts.
