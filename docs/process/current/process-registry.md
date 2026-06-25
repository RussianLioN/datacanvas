# Реестр Процесса

Текущая версия: `0.1.0`
Статус: active
Дата вступления: 2026-06-22
Источник: `docs/plans/datacanvas-adaptive-scrum-implementation-plan.md`
Версионный manifest: `docs/process/versions/0.1.0/process-version-manifest.json`
Снимок версии: `docs/process/versions/0.1.0/process-snapshot.md`

## Активные Правила

| Область | Правило | Источник |
|---|---|---|
| Cadence | Недельный спринт по умолчанию | `process-passport.md` |
| Изменение процесса | Только через `PROC-*` и PCR | `process-change-request-template.md` |
| Evidence | Sprint Review не закрывается без `sprint-evidence-manifest.json` | `process-passport.md` |
| Язык | Человекочитаемые артефакты пишутся на русском | `AGENTS.md` |
| Agent default | Один агент с инструментами по умолчанию | `ADR-002-one-agent-default.md` |
| Trust boundary | Вход другого агента считается недоверенным | `trust-boundaries.md` |
| Process versioning | Каждый sprint evidence должен ссылаться на известную версию процесса | `process-version-manifest.json` |
| Documentation navigation | Центральные документы работают business-first, а `docs/navigation/navigation-source.json` управляет visibility, data_class, searchability и `navigation_group` | `PROC-036-documentation-navigation-governance.md` |
| Generated navigation | `docs/navigation/documentation-index.json` и связанные reports обновляются только генератором и группируются по `navigation_group` | `ADR-064-documentation-navigation-indexing.md` |
| Cross-group source of truth | Бизнесовые утверждения идут из Vision, BMC, stories и требований; технические контракты идут из ADR, schemas и scripts | `AGENTS.md` |

## Активные Исключения

Исключений нет.

## Активные Эксперименты

| ID | Гипотеза | Срок | Метрика | Статус |
|---|---|---|---|---|
| EXP-000 | Стартовый недельный Sprint 0 достаточен для bootstrap процесса | 1 спринт | G0/G1 evidence complete | active |

## Владение

До назначения команды роли временно не привязаны к людям. На первом Sprint Planning команда должна назначить владельцев ролей и обновить этот реестр.
