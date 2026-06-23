# ADR-023: Contract Schemas

Дата: 2026-06-22
Статус: accepted

## Контекст

План DataCanvas требует версионировать контракты `RenderRequest`, `ProcessChangeRequest`, `ToolAllowlist` и `TraceContract`. Часть контрактов была описана документами, но без JSON Schema и исполняемой проверки.

## Решение

Добавить схемы:

- `schemas/render-request.schema.json`;
- `schemas/process-change-request.schema.json`;
- `schemas/tool-allowlist.schema.json`;
- `schemas/trace-contract.schema.json`.

Добавить минимальные fixtures в `tests/contracts/` и validator `scripts/validate-contract-schemas.mjs`.

## Последствия

- Contract boundary становится проверяемым gate.
- Tool allowlist сохраняет `default_policy: deny`.
- Trace contract проверяется на совпадение с обязательными spans и fields из документации.
