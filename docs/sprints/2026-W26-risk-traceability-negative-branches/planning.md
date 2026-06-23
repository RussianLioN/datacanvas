# Planning

Версия процесса: 0.1.0

## Контекст

Sprint 13 доказал rollback для unsupported claims. Оставались непокрытые stop-rule branches: prompt-injection leakage, cost budget и latency budget. Также risk linkage оставался встроенным в traceability matrix без отдельного typed contract.

## План

1. Добавить `RiskTraceability` schema.
2. Добавить `risk-traceability.json`.
3. Расширить scorer сценариями metric overrides.
4. Добавить prompt-injection output fixture.
5. Добавить cost и latency scenarios.
6. Сгенерировать rollback results.
7. Подключить проверки к gates.

## Acceptance Criteria

- `RiskTraceability` проходит schema validation.
- Все risks из registry покрыты typed risk traceability.
- Prompt-injection, cost и latency branches дают `decision = rollback`.
- `npm test` проходит.
