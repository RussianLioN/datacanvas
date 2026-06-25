# Planning

Версия процесса: 0.1.0

## Контекст

Sprint 6 защитил LLM boundary схемами и guardrails. Следующий риск: внешний provider может быть подключен без базового eval pack, и команда потеряет воспроизводимый критерий качества.

## План

1. Расширить eval taxonomy.
2. Добавить обязательные eval cases.
3. Проверить compact presentation constraints.
4. Проверить отсутствие claims вне normalized facts.
5. Проверить prompt-injection leakage.
6. Подключить eval gate к CI и `npm test`.

## Acceptance Criteria

- `npm run validate:evals` проходит.
- `npm test` включает `validate:evals`.
- Eval strategy описывает ограничения текущего пакета.
- Sprint evidence фиксирует проверки и следующий безопасный шаг.
