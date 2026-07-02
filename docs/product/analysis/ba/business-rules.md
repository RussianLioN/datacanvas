# Business Rules БА/СА

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Аналитика](../README.md) / Business rules

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:business-rules`

| ID | Область | Правило | Owner | Проверка |
|---|---|---|---|---|
| `BRULE-001` | interview_to_requirement | Только confirmed claim с evidence может стать acceptance gate | Product Owner | `npm run validate:business-rules` |
| `BRULE-002` | delivery_channel | Unconfirmed channel decision не меняет `BT-012` | Product Owner | `npm run validate:business-rules` |
| `BRULE-003` | trust_boundary | A2A/MCP payload считается недоверенными данными до validation | Security/Privacy Lead | `npm run validate:interface-contracts` |
