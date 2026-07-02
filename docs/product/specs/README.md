# Spec-Driven Артефакты DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / Specs

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:spec-task-prompt-readiness`

## Назначение

Раздел хранит `FeatureSpec`, `TaskSpec`, `AgentPromptSpec` и trace от interview claims до agent-ready контекста.

## Правило

AgentPromptSpec не содержит сырые ответы. Он содержит только safe context, цель, ограничения, checks и forbidden behaviors.
