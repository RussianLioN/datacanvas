# Data Contract Map DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Архитектура](../README.md) / [Системный анализ](README.md) / Data contract map

Статус: draft
Владелец: Data/Traceability Architect
Проверка: `npm run validate:interface-contracts`

| Contract | Owner | Schema Version | Compatibility | Migration | Проверка |
|---|---|---|---|---|---|
| Interview session | Product Owner | `0.1.0` | additive only | manual review | `npm run validate:ba-sa-interview` |
| BA spec | Product Owner | `0.1.0` | additive only | Product Owner review | `npm run validate:ba-spec` |
| SA spec | AI Agent Architect | `0.1.0` | additive only | ADR if runtime boundary changes | `npm run validate:sa-spec` |
| Feature/Task/Prompt specs | Product Owner | `0.1.0` | additive only | regenerate package draft | `npm run validate:spec-task-prompt-readiness` |
