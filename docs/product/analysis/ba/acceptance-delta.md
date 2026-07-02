# Acceptance Delta БА/СА

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Аналитика](../README.md) / Acceptance delta

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:interview-derived-coverage`

| ID | Scenario | Gate |
|---|---|---|
| `AC-BASA-001` | A2A-first request создает validated input envelope, trace и callback/status contract без включения live network | `npm run validate:spec-task-prompt-readiness` |
| `AC-BASA-002` | Недостаточный или недоверенный input блокируется до generation/export и создает clarification | `npm run validate:ba-sa-interview` |
| `AC-BASA-003` | AgentPromptSpec содержит только safe context и не содержит сырые ответы | `npm run validate:spec-task-prompt-readiness` |
| `AC-BASA-004` | Противоречие с Vision/BMC/BT создает open decision, а не перезаписывает источник истины | `npm run validate:ba-spec` |
