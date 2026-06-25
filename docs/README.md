# Документация DataCanvas

Навигация: [DataCanvas](../README.md) / Документация

Статус: active
Владелец: Documentation Owner
Проверка: `npm run validate:docs-navigation`

## Маршруты

| Задача пользователя | Стартовый документ | Следующий документ | Владелец | Проверка |
|---|---|---|---|---|
| Понять продукт | [Продукт](product/README.md) | [BMC](product/bmc/README.md) | Product Owner | `npm run validate:docs-navigation` |
| Найти текущий процесс | [Процесс](process/README.md) | [Реестр процесса](process/current/process-registry.md) | Process Owner | `npm run validate:docs-navigation` |
| Работать с BMC | [BMC package](product/bmc/README.md) | [BMC v0.2](product/bmc/bmc-v0.2.md) | Product Owner | `npm run validate:bmc` |
| Подготовить review/merge | [Release](release/README.md) | [Commit/PR evidence](release/commit-pr-evidence.md) | Delivery/GitOps Lead | `npm test` |
| Найти evidence/release | [Evidence hub](knowledge/evidence-index.md) | [Release evidence pack](release/mvp-release-evidence-pack.json) | Delivery/GitOps Lead | `npm run validate:docs-navigation` |
| Открыть карту проекта | [Карта слоев](project-map.md) | [Generated navigation map](navigation/navigation-map.md) | Documentation Owner | `npm run generate:docs-navigation -- --check` |
| Найти архитектурное решение | [Архитектура](architecture/README.md) | [Schema registry](architecture/schemas/schema-registry.md) | AI Agent Architect | `npm run validate:docs-navigation` |
| Найти sprint artifacts | [Sprint artifacts](sprints/README.md) | [Sprint evidence manifest](sprints/2026-W26-process-bootstrap/sprint-evidence-manifest.json) | Scrum Master | `npm run validate:docs-navigation` |
| Найти планы | [Планы](plans/README.md) | [Documentation navigation plan](plans/datacanvas-documentation-navigation-indexing-plan.md) | Process Owner | `npm run validate:docs-navigation` |
| Найти lessons/RCA | [Knowledge base](knowledge/README.md) | [RCA index](knowledge/rca/README.md) | Documentation Owner | `npm run validate:docs-navigation` |

## Управляемые Источники

- Ручной источник навигации: `docs/navigation/navigation-source.json`.
- Generated index: `docs/navigation/documentation-index.json`.
- Generated map: `docs/navigation/navigation-map.md`.
- Artifact registry: `docs/architecture/schemas/artifact-registry.json`.

Новые документы должны попадать в `docs/navigation/navigation-source.json` или в явный ignore с причиной.
