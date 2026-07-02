# Lifecycle State Model DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Архитектура](../README.md) / [Системный анализ](README.md) / Lifecycle state model

Статус: draft
Владелец: AI Agent Architect
Проверка: `npm run validate:state-model`

## States

`intake -> validation -> clarification -> normalization -> description -> approval -> render_export -> delivery_acceptance`

`delivery_acceptance` остается blocked, если channel decision не принят.
