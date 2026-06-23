# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `PROC-007` для controlled external LLM provider.
- Provider integration plan.
- Provider allowlist.
- Provider budget.
- ADR-012.
- Provider readiness validator.
- Sprint 8 evidence pack.

## Изменено

- `package.json`: добавлен `validate:provider`, включен в `npm test`.
- `.github/workflows/docs-check.yml`: добавлен provider readiness gate.
- `docs/architecture/observability/trace-contract.md`: добавлены `provider` и `retry_count`.
- `docs/process/current/process-backlog.md`: добавлен `PROC-007`.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы Sprint 8 artifacts.
