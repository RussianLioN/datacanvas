# Business Rules БА/СА

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Аналитика](../README.md) / Business rules

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:business-rules`

| ID | Область | Правило | Owner | Проверка |
|---|---|---|---|---|
| `BRULE-001` — правило продвижения утверждений в требования | interview_to_requirement | Только подтвержденное утверждение с подтверждающим материалом может стать критерием приемки | Product Owner | `npm run validate:business-rules` |
| `BRULE-002` — правило канала доставки для `BT-012` (бизнес-требование о доставке результата) | delivery_channel | Подтвержденный канал доставки меняет `BT-012` (бизнес-требование о доставке результата): готовый файл отправляется пользователю по электронной почте, а уведомления в Лисе фиксируются отдельно для текущей и будущей реализации | Product Owner | `npm run validate:business-rules` |
| `BRULE-003` — правило доверительной границы | trust_boundary | A2A/MCP payload (данные от внешнего агента или инструмента) считается недоверенными данными до validation | Security/Privacy Lead | `npm run validate:interface-contracts` |
