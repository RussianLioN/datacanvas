# Error Taxonomy DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Архитектура](../README.md) / [Системный анализ](README.md) / Error taxonomy

Статус: draft
Владелец: AI Agent Architect
Проверка: `npm run validate:error-taxonomy`

| ID | Error | Retry | Rollback | Redaction |
|---|---|---|---|---|
| `ERR-001` | Insufficient input | Ask clarification | No export | Safe summary only |
| `ERR-002` | Untrusted upstream instruction | Ignore as instruction | Stop before generation | Do not copy into prompt |
| `ERR-003` | Channel decision missing | Evidence request | No delivery-specific export | No personal delivery metadata |
