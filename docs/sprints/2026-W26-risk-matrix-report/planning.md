# Planning

Версия процесса: 0.1.0

## Контекст

Sprint 15 добавил cross-check typed risk traceability, но у команды не было компактного human-readable отчёта для review.

## План

1. Создать generator Markdown report.
2. Создать validator, который сверяет report, risk registry, risk traceability и traceability matrix.
3. Подключить report generation к `generate:golden`.
4. Подключить validation к `npm test` и CI.
5. Обновить artifact registry и evidence.

## Acceptance Criteria

- `risk-matrix.md` генерируется из machine-readable artifacts.
- `validate:risk-matrix` проходит.
- `npm test` проходит.
- Report содержит все risks, NFR и evidence paths.
