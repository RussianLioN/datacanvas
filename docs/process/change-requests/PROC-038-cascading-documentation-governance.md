# PROC-038: Cascading Documentation Governance

ID: `PROC-038`
Статус: draft
Автор: Codex
Дата: 2026-07-02
Целевая версия процесса: 0.2.0

## Проблема

Правка верхнеуровневого или связанного проектного артефакта может оставить downstream документы, backlog, roadmap, capacity, sprint evidence или Jira import package в несогласованном состоянии.

## Причина Изменения

План `docs/plans/datacanvas-cascading-documentation-governance-plan.md` требует строгий контракт каскадного обновления и запрет неподтвержденных смысловых допущений.

## Предлагаемое Изменение

- Ввести `DocumentationChangeRequest` как обязательный вход для значимых правок документации.
- Использовать machine-readable dependency graph для impact analysis.
- Вести `UserDecisionQueue` и блокировать Done при открытых blocking decisions.
- Требовать capacity source и `ReprioritizationImpactReport` при backlog reprioritization.
- Требовать `JiraFieldMappingRequest` для Jira-bound import package.
- Хранить evidence каждого cascade run в `CascadingUpdateRun`.

## Влияние

- Затронутые роли: Product Owner, Process Owner, Scrum Master, Delivery/GitOps Lead, QA/Evals Lead.
- Затронутые артефакты: DoR, DoD, process passport, product docs, schemas, validators, navigation source, artifact registry и evidence.
- Риск для текущего Sprint Goal: средний, потому что добавляется новый gate, но без live integrations и без расширения tool/network permissions.

## Метрика Успеха

`npm run validate:cascading-governance`, docs navigation, artifact registry/hash и полный `npm test` проходят; negative fixture с Done при blocking decisions отклоняется валидатором.

## План Проверки

```bash
npm run validate:cascading-governance
npm run validate:schemas
npm run validate:docs-navigation
npm run validate:artifact-registry
npm run validate:artifact-hashes
npm test
```

## Rollback

Удалить cascade schemas, validators, source artifacts, fixtures, navigation entries, artifact registry entries и DoR/DoD/passport additions; затем регенерировать navigation/hash artifacts и повторить baseline gates.

## Решение

Статус решения: not_decided.
Дата решения: не принято.
Решающий владелец: Process Owner.
