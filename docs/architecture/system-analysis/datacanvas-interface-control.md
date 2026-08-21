# Interface Control DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Архитектура](../README.md) / [Системный анализ](README.md) / Interface control

Статус: draft
Владелец: AI Agent Architect
Проверка: `npm run validate:interface-contracts`

| ID | Interface | Trust Boundary | Schema | Проверка |
|---|---|---|---|---|
| `IF-001` | Lisa launch adapter | trusted_operator_channel | `schemas/input-package.schema.json` | `npm run validate:schemas` |
| `IF-002` | A2A launch envelope | untrusted_upstream_agent | `schemas/input-package.schema.json` | `npm run validate:interface-contracts` |
| `IF-003` | MCP tool context | untrusted_tool_metadata | `schemas/tool-allowlist.schema.json` | `npm run validate:interface-contracts` |
| `IF-004` | Renderer | validated_presentation_spec | `schemas/presentation-spec.schema.json` | `npm run validate:visual` |
| `IF-005` | Evidence storage | internal_evidence | `schemas/artifact-registry.schema.json` | `npm run validate:artifact-registry` |
| `IF-006` | Профиль сотрудника | Внешний контракт ожидает системного анализа | Внешний контракт не зафиксирован | `npm run validate:interface-contracts` |
| `IF-007` | Почтовый сервис | Внешний контракт ожидает системного анализа | Внешний контракт не зафиксирован | `npm run validate:interface-contracts` |
| `IF-008` | Внутренний получатель статуса | Объявленный внутренний получатель | Ссылка на объявленного получателя | `npm run validate:interface-contracts` |
| `IF-009` | Адаптер экрана Лисы | Контракт адаптера ожидает системного анализа | Безопасная модель отображения ожидает уточнения | `npm run validate:interface-contracts` |

## Граница Q4_2026

`IF-006` — интерфейс «Профиль сотрудника» — определяет только функциональную
необходимость получить допустимые адреса SIGMA и OMEGA. Точные API,
аутентификация, протокол и состав ответа не установлены.

`IF-007` — интерфейс почтового сервиса — принимает согласованные `ODT` и `PDF`;
точные API, аутентификация, протокол, подтверждение доставки и внешняя политика
повторов остаются открытыми вопросами.

`IF-008` — интерфейс внутреннего получателя статуса — объявляется в исходном
запросе. Получателем может быть другой агент, Оркестратор или Лиса. Прямой маршрут
DataCanvas в Лису не утвержден.

`IF-009` — адаптер экрана Лисы — показывает только безопасное состояние, полученное
от объявленного внутреннего получателя, в том же чате без системного PUSH. Он не
фиксирует прямую доставку DataCanvas в Лису.
