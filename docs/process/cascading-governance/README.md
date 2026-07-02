# Каскадное Ведение Документации

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Процесс](../README.md) / Каскадное ведение документации

Статус: draft
Владелец: Process Owner
Проверка: `npm run validate:cascading-governance`

## Назначение

Этот каталог хранит подготовительные контракты и evidence для управляемого изменения проектной документации DataCanvas. `PROC-038` имеет статус draft / not_decided, поэтому каталог работает как opt-in проверочная заготовка и не заменяет принятое правило процесса.

## Контракт

- Opt-in проверка значимой правки Vision, BMC, stories, requirements, backlog, capacity, sprint artifacts, roadmap или Jira import package начинается с `DocumentationChangeRequest`.
- Impact analysis строится по `artifact-dependency-graph.json` и не принимает бизнесовые решения за пользователя.
- `user-decision-queue.json` блокирует Done claim внутри opt-in запуска, пока есть blocking decision со статусом `pending` или `deferred`.
- Capacity и reprioritization фиксируются отдельно; конкретная емкость команды не заполняется без пользовательского или внешнего источника.
- Jira custom fields согласуются через отдельный `JiraFieldMappingRequest`; import package не считается готовым без approved mapping или явного `pending_external`.
- Generated navigation и hash artifacts обновляются только генераторами.

## Исходные Артефакты

- [artifact-dependency-graph.json](artifact-dependency-graph.json)
- [documentation-change-request.json](documentation-change-request.json)
- [impact-analysis-report.json](impact-analysis-report.json)
- [user-decision-queue.json](user-decision-queue.json)
- [capacity-plan-2026-q3.json](capacity-plan-2026-q3.json)
- [reprioritization-impact-report.json](reprioritization-impact-report.json)
- [jira-field-mapping-request.json](jira-field-mapping-request.json)
- [jira-import-package-manifest.json](jira-import-package-manifest.json)
- [runs/2026-07-02-cascade-contract/cascading-update-run.json](runs/2026-07-02-cascade-contract/cascading-update-run.json)
- [runs/2026-07-02-co-2026-001-q3-priority-impact/cascading-update-run-2026-07-02-002.json](runs/2026-07-02-co-2026-001-q3-priority-impact/cascading-update-run-2026-07-02-002.json)

## Проверки

Основной gate:

```bash
npm run validate:cascading-governance
```

Профильные gates доступны отдельно: `validate:documentation-change-request`, `validate:artifact-dependency-graph`, `validate:impact-analysis`, `validate:decision-queue`, `validate:capacity-plan`, `validate:reprioritization-impact`, `validate:cascading-update` и `validate:jira-field-mapping`.
