# Документация DataCanvas

Навигация: [DataCanvas](../README.md) / Документация

Статус: active
Владелец: Documentation Owner
Проверка: `npm run validate:docs-navigation`

## Бизнесовая Карта Продукта

Маршрут "Понять продукт" идет через:

1. [Продуктовый индекс](product/README.md)
2. [Текущее видение](product-vision.md)
3. [BMC](product/bmc/README.md)
4. [Каталог stories](stories.md)
5. [БТ, пользовательские истории, НФТ и приемку](product/requirements/README.md)
6. [Product backlog](product/backlog/product-backlog.md), [roadmap](product/roadmap/roadmap-v0.1.md) и [гипотезы](product/hypotheses/hypothesis-board.md)

## Производственный Контур

| Задача | Стартовый документ | Следующий документ | Владелец | Проверка |
|---|---|---|---|---|
| Подготовить review/merge | [Release](release/README.md) | [Commit/PR evidence](release/commit-pr-evidence.md) | Delivery/GitOps Lead | `npm test` |
| Найти sprint artifacts | [Sprint artifacts](sprints/README.md) | [Sprint evidence manifest](sprints/2026-W26-process-bootstrap/sprint-evidence-manifest.json) | Scrum Master | `npm run validate:docs-navigation` |
| Найти evidence/release | [Evidence hub](knowledge/evidence-index.md) | [Release evidence pack](release/mvp-release-evidence-pack.json) | Delivery/GitOps Lead | `npm run validate:docs-navigation` |

## Техническая Документация

| Задача | Стартовый документ | Следующий документ | Владелец | Проверка |
|---|---|---|---|---|
| Найти архитектурное решение | [Архитектура](architecture/README.md) | [Schema registry](architecture/schemas/schema-registry.md) | AI Agent Architect | `npm run validate:docs-navigation` |
| Найти технический backlog | [Технический backlog](product/backlog/technical-backlog.md) | [ADR](architecture/README.md) | Development Team | `npm run validate:docs-navigation` |

## Методика И Governance

| Задача | Стартовый документ | Следующий документ | Владелец | Проверка |
|---|---|---|---|---|
| Найти текущий процесс | [Процесс](process/README.md) | [Реестр процесса](process/current/process-registry.md) | Process Owner | `npm run validate:docs-navigation` |
| Найти методику проектной документации | [Методика проектной документации](process/methodology/README.md) | [Методика ведения документации](process/methodology/project-documentation-methodology.md) | Process Owner | `npm run validate:documentation-methodology` |
| Открыть карту проекта | [Карта слоев](project-map.md) | [Generated navigation map](navigation/navigation-map.md) | Documentation Owner | `npm run generate:docs-navigation -- --check` |
| Найти планы | [Планы](plans/README.md) | [Планы навигации](plans/README.md) | Process Owner | `npm run validate:docs-navigation` |

## Управляемые Источники

- Ручной источник навигации: `docs/navigation/navigation-source.json`.
- Generated index: `docs/navigation/documentation-index.json`.
- Generated map: `docs/navigation/navigation-map.md`.
- Artifact registry: `docs/architecture/schemas/artifact-registry.json`.

Новые документы должны попадать в `docs/navigation/navigation-source.json` или в явный ignore с причиной.
