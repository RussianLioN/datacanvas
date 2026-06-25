# Planning

Версия процесса: 0.1.0

## Контекст

Sprint 7 подготовил eval pack. Следующий риск: внешний provider может быть подключен без управляемого изменения процесса, бюджета, trace coverage и fallback.

## План

1. Создать `PROC-007` как draft.
2. Зафиксировать provider integration plan.
3. Зафиксировать provider allowlist в disabled состоянии.
4. Добавить cost/latency budget.
5. Расширить trace contract.
6. Добавить локальный readiness validator.
7. Подключить validator к `npm test` и CI.

## Acceptance Criteria

- Provider остается disabled.
- Никакие сетевые команды не добавлены в npm scripts.
- `npm run validate:provider` проходит.
- `npm test` включает provider readiness.
- Sprint evidence фиксирует ограничения и следующий безопасный шаг.
