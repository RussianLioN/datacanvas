# Planning

Версия процесса: 0.1.0

## Контекст

Sprint 12 доказал positive scorer path. Оставался gap: scorer не доказывал rollback behavior, а risk registry не был связан с traceability matrix и НФТ.

## План

1. Добавить unsupported provider output fixture.
2. Сделать scorer параметризуемым.
3. Сгенерировать rollback result.
4. Проверять rollback result в validator и schema validation.
5. Добавить risks в traceability matrix.
6. Добавить risk links в НФТ.
7. Обновить evidence.

## Acceptance Criteria

- Negative provider output дает `decision = rollback`.
- Rollback result имеет `quality_score < 0.9`.
- Все risks из registry найдены в traceability matrix.
- `NFR-001`, `NFR-003`, `NFR-004` связаны с provider risks.
- `npm test` проходит.
