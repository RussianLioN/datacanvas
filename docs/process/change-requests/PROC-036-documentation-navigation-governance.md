# PROC-036: Documentation Navigation Governance

ID: `PROC-036`
Статус: accepted
Автор: Codex
Дата: 2026-06-25
Целевая версия процесса: `0.1.0`

## Проблема

Документация DataCanvas стала широкой: продукт, процесс, архитектура, BMC, sprint evidence, release evidence и UAT artifacts живут в разных ветках дерева. Без единого navigation source новые документы могут не попасть в маршруты или случайно стать публично индексируемыми.

## Причина Изменения

Текущий процесс требовал обновлять связанные документы, но не задавал проверяемое правило для navigation/search visibility и sensitive evidence.

## Предлагаемое Изменение

- `docs/navigation/navigation-source.json` становится источником истины для docs routes, owner, lifecycle, visibility, data class и update trigger.
- Root `README.md`, `docs/README.md` и `docs/product/README.md` должны быть business-first: первый смысловой маршрут ведет к Vision, BMC, stories, БТ, пользовательским историям, НФТ, acceptance criteria, product backlog, roadmap, hypotheses и traceability.
- `navigation_group` становится обязательной частью navigation contract. Допустимые группы: `business`, `delivery`, `technical`, `governance`, `evidence`, `generated`.
- `visibility: public` означает видимый маршрут в навигации репозитория. `data_class: public` означает возможность внешней публикации. Draft business documents по умолчанию получают `data_class: internal`, пока нет отдельного privacy/sanitization review.
- Новый документ должен попасть в navigation source или `ignored_paths` с причиной.
- Новый бизнесовый документ должен попасть в product index и business route либо иметь явное исключение с причиной.
- Generated navigation artifacts обновляются только через `npm run generate:docs-navigation`.
- Plans, PROC, ADR, schemas, scripts, tests и raw evidence не должны становиться первичным business route.
- PR handoff должен указывать affected `ART-*`, affected docs routes, validation commands, evidence links, owner sign-off, release impact и rollback/forward-fix.

## Влияние

- Затронутые роли: Product Owner, Process Owner, Documentation Owner, Delivery/GitOps Lead, Security/Privacy Lead.
- Затронутые артефакты: `README.md`, `docs/README.md`, `docs/navigation/*`, `.github/PULL_REQUEST_TEMPLATE.md`, `AGENTS.md`.
- Затронутые контракты: `schemas/docs-navigation-source.schema.json`, `schemas/docs-navigation-index.schema.json`, `scripts/generate-docs-navigation.mjs`, `scripts/validate-docs-navigation.mjs`.
- Затронутые спринты: `SPRINT-2026-W26`.
- Риск для текущего Sprint Goal: низкий; изменение добавляет проверяемый docs gate.
- Влияние на CI/evidence: `npm test` включает docs link, navigation и stale status validation.

## Метрика Успеха

`npm run validate:docs-navigation`, `npm run validate:doc-links`, `npm run validate:doc-stale-status` и `npm test` проходят без ослабления security/data-leakage checks.

## План Проверки

Проверять при каждом PR, который меняет docs, schemas, scripts, release evidence или artifact registry.

## Rollback

Откатить navigation source, generated outputs, validators, package scripts и PR template одним PR; public indexing за пределы репозитория не выполняется.

## Решение

Статус решения: accepted.
Дата решения: 2026-06-25.
Решающий владелец: Process Owner.
