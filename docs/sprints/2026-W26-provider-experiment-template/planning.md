# Planning

Версия процесса: 0.1.0

## Контекст

Sprint 9 сделал provider readiness структурным. Следующий риск: controlled experiment может быть запущен без заранее определенного формата результата, rollback decision и evidence.

## План

1. Создать schema результата эксперимента.
2. Создать planned template с нулевыми метриками.
3. Создать process experiment `EXP-001`.
4. Добавить validator.
5. Подключить validator к `npm test`.
6. Зафиксировать ADR.

## Acceptance Criteria

- `ProviderExperimentResult` template проходит schema validation.
- Result остается `planned` и `not_started`.
- Rollback доступен и связан с offline fallback.
- Quality/security evidence paths существуют.
- `npm test` проходит.
