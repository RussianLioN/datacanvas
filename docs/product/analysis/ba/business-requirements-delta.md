# Business Requirements Delta БА/СА

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Аналитика](../README.md) / Business requirements delta

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:ba-spec`

| ID | Delta | Source Claims | Coverage |
|---|---|---|---|
| `BT-015` | Запуск другим агентом получает отдельный прием запроса и проверяемую заявку до входного пакета | `BASA-CLM-003` | `AC-BASA-001` |
| `BT-016` | Запуск другим агентом получает отдельный входной пакет с задачей, источником запроса и параметрами презентации | `BASA-CLM-003` | `AC-BASA-001` |
| `BT-017` | Недоверенный или недостаточный вход от другого агента останавливается до генерации | `BASA-CLM-005` | `AC-BASA-002` |
| `BT-018` | Запуск другим агентом получает отдельные статусы обработки и сведения о результате без утверждения реальной callback-интеграции | `BASA-CLM-003`, `BASA-CLM-009` | `AC-BASA-004` |
| `NFR-003-DELTA` | Spec/prompt package не содержит сырых ответов и не расширяет boundaries | `BASA-CLM-004`, `BASA-CLM-006` | `AC-BASA-003` |

Эти delta entries не заменяют canonical requirements до Product Owner review и traceability update.
