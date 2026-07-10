# Product Change Orders DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / Product Change Orders

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:product-change-orders`

## Назначение

`CO-*` фиксирует продуктовые изменения приоритета, scope и системного поведения. Процессные изменения остаются в `PROC-*`.

## Правило

Product Change Order должен содержать source, reason, `priority_before`, `priority_after`, affected users, affected artifacts, affected requirements, affected ports/adapters, ADR impact, Sprint impact, rollback и validation plan.

Если Change Order принимается через PO-опросник, состояние опросника должно сохраняться в JSON и Markdown-журнале после каждого ответа Product Owner.

## Артефакты

- [Шаблон Product Change Order](product-change-order-template.md)
- [Протокол PO-опросника Product Change Order](product-change-questionnaire-protocol.md)
- `product-change-order-ledger.json`
- [CO-2026-001: приоритет запуска DataCanvas другим агентом](co-2026-001-a2a-first-priority.md)
- `co-2026-001-a2a-first-priority.json`
- [CO-2026-002: граница P1 и P2 для запуска DataCanvas другим агентом](co-2026-002-agent-launch-delivery-scope.md)
- `co-2026-002-agent-launch-delivery-scope.json`
- `co-2026-002-agent-launch-delivery-scope-impact.json`
- `change-impact-assessment.json`
- [Журнал PO-опросника CO-2026-001](co-2026-001-acceptance-questionnaire-log.md)
- `co-2026-001-acceptance-questionnaire-state.json`
