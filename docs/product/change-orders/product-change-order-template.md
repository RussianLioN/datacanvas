# Product Change Order Template

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / [Product Change Orders](README.md) / Template

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:product-change-orders`

## Поля

- ID: `CO-YYYY-NNN`.
- Статус: draft, accepted, rejected или deferred.
- Source.
- Reason.
- Priority before.
- Priority after.
- Affected users.
- Affected artifacts.
- Affected requirements.
- Affected ports/adapters.
- ADR impact.
- Sprint impact.
- Sprint Goal test.
- Product Owner decision.
- Rollback.
- Validation plan.
- Impact assessment path.

## Правило Решения

`accepted` Change Order должен иметь Product Owner decision, rollback, Sprint Goal test и validation evidence. `draft` Change Order не меняет canonical requirements.
