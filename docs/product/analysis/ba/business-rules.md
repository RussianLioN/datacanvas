# Business Rules БА/СА

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Аналитика](../README.md) / Business rules

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:business-rules`

`BRULE-004`–`BRULE-008` используют `CO3-DEC-003`, `CO3-DEC-004`, `CO3-DEC-006`, `CO3-DEC-007` и `CO3-MSG-001`–`CO3-MSG-005` [реестра интервью](../../change-orders/co-2026-003-authoritative-interview-decision-register.md), равноправного очищенной рабочей книге.

| ID | Область | Правило | Owner | Проверка |
|---|---|---|---|---|
| `BRULE-001` — правило продвижения утверждений в требования | interview_to_requirement | Только подтвержденное утверждение с подтверждающим материалом может стать критерием приемки | Product Owner | `npm run validate:business-rules` |
| `BRULE-002` — правило канала доставки для `BT-012` (бизнес-требование о доставке результата) | delivery_channel | Подтвержденный канал доставки меняет `BT-012` (бизнес-требование о доставке результата): готовый файл отправляется пользователю по электронной почте, а уведомления в Лисе фиксируются отдельно для текущей и будущей реализации | Product Owner | `npm run validate:business-rules` |
| `BRULE-003` — правило доверительной границы | trust_boundary | A2A/MCP payload (данные от внешнего агента или инструмента) считается недоверенными данными до validation | Security/Privacy Lead | `npm run validate:interface-contracts` |
| `BRULE-004` — правило определения адресов | profile_addresses | Адреса получателей результата определяются только через сервис «Профиль сотрудника»; произвольный адрес из запроса не используется | Product Owner | `npm run validate:business-rules` |
| `BRULE-005` — правило одного заказа | one_order_per_session_user | Для пары идентификаторов сеанса и пользователя допускается один заказ; повтор возможен только до принятия запроса | Product Owner | `npm run validate:business-rules` |
| `BRULE-006` — правило безопасного состояния | safe_lisa_status | Пользователь видит в том же чате Лисы только дословно согласованное безопасное состояние заказа; личные сведения и содержание запроса не показываются | Security/Privacy Lead | `npm run validate:business-rules` |
| `BRULE-007` — правило границы Q4_2026 | q4_scope_boundary | В Q4_2026 входят адреса через «Профиль сотрудника», `ODT`/`PDF`, почта и состояние в том же чате; ссылка, хранилище, PUSH и расширенное редактирование структуры относятся к будущему объему | Product Owner | `npm run validate:business-rules` |
| `BRULE-008` — правило закрытия сеанса после проблемы доставки | closed_session_after_delivery_problem | После задержанной, частичной или неподтвержденной доставки принятый заказ не дублируется: сеанс переходит на сопровождение, закрывается и не принимает новый заказ | Product Owner | `npm run validate:business-rules` |
