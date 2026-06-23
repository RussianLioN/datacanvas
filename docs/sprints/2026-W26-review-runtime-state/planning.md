# Planning

Версия процесса: 0.1.0

## Scope

Инкремент добавляет persisted state contract для review flow. Он не создает real user UAT session и не объявляет pilot gate закрытым.

## Acceptance

- Runtime state fixture проходит JSON Schema.
- Все переходы соответствуют `human-review-flow.json`.
- Export разрешается только после `approved`.
- Проверка включена в `npm test`.
