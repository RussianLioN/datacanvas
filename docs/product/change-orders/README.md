# CO - Заявки На Продуктовые Изменения DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / CO

Статус: active
Владелец: Product Owner
Проверка: `npm run validate:product-change-orders`

## Назначение

`CO-*` - change order, заявка на продуктовое изменение. Такой документ фиксирует изменение приоритета, границы продукта или системного поведения DataCanvas. Процессные изменения остаются в `PROC-*` - change request для процесса.

## Правило

Product Change Order должен содержать источник изменения, причину, прежний и новый приоритет, затронутых пользователей, документы, требования, технические контуры, влияние на ADR - архитектурные решения, влияние на sprint planning - планирование спринта, rollback - способ отката, и validation plan - план проверки.

Если Change Order принимается через PO-опросник, состояние опросника должно сохраняться в JSON и Markdown-журнале после каждого ответа Product Owner.

После принятия Change Order нужно обновить [карту бизнес-утверждений](../requirements/business-claim-map.json) и выполнить каскадную проверку зависимых артефактов. Карта хранит машинную связь между принятым решением и документами, но не заменяет сами бизнесовые тексты.

## Читать Человеку

- [Шаблон Product Change Order](product-change-order-template.md)
- [Протокол PO-опросника Product Change Order](product-change-questionnaire-protocol.md)
- [CO-2026-001: приоритет запуска DataCanvas другим агентом](co-2026-001-a2a-first-priority.md)
- [CO-2026-002: граница P1 и P2 для запуска DataCanvas другим агентом](co-2026-002-agent-launch-delivery-scope.md)
- [CO-2026-003: Q4_2026 — Лиса, Профиль сотрудника и почтовая доставка](co-2026-003-q4-lisa-profile.md) — подтверждённый объём одного заказа, адресов через Профиль сотрудника, `ODT`/`PDF` и статусов в том же чате.
- [Реестр согласованных формулировок CO-2026-003](co-2026-003-authoritative-interview-decision-register.md) — дословные безопасные решения владельца продукта.
- [Карта влияния CO-2026-003](co-2026-003-q4-lisa-profile-impact.md) — куда эти решения внесены в продуктовой документации и пользовательском пути.
- [Пакет итоговой приёмки документации CO-2026-003](../../release/co-2026-003-q4-lisa-profile-acceptance-packet.md) — маршрут просмотра всех связанных документов, договоров, прототипа и доказательств.
- [Журнал PO-опросника CO-2026-001](co-2026-001-acceptance-questionnaire-log.md)

## Машинные Артефакты

Эти файлы используются валидаторами, каскадным workflow и агентами. Они не являются первичным маршрутом чтения для стейкхолдеров.

- `product-change-order-ledger.json`
- `co-2026-001-a2a-first-priority.json`
- `co-2026-001-acceptance-questionnaire-state.json`
- `co-2026-002-agent-launch-delivery-scope.json`
- `co-2026-002-agent-launch-delivery-scope-impact.json`
- `co-2026-003-q4-lisa-profile.json`
- `co-2026-003-q4-lisa-profile-impact.json`
- `co-2026-003-authoritative-interview-decision-register.json`
- `change-impact-assessment.json`
- `../requirements/business-claim-map.json`
