# Product Change Orders DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / Product Change Orders

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:product-change-orders`

## Назначение

`CO-*` фиксирует продуктовые изменения приоритета, scope и системного поведения. Процессные изменения остаются в `PROC-*`.

## Правило

Product Change Order должен содержать source, reason, `priority_before`, `priority_after`, affected users, affected artifacts, affected requirements, affected ports/adapters, ADR impact, Sprint impact, rollback и validation plan.

## Артефакты

- [Шаблон Product Change Order](product-change-order-template.md)
- `product-change-order-ledger.json`
- [CO-2026-001 A2A-first priority](co-2026-001-a2a-first-priority.md)
- `co-2026-001-a2a-first-priority.json`
- `change-impact-assessment.json`
