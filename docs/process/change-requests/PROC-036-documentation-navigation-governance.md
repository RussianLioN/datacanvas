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
- Новый документ должен попасть в navigation source или `ignored_paths` с причиной.
- Generated navigation artifacts обновляются только через `npm run generate:docs-navigation`.
- PR handoff должен указывать affected `ART-*`, affected docs routes, validation commands, evidence links, owner sign-off, release impact и rollback/forward-fix.

## Влияние

- Затронутые роли: Product Owner, Process Owner, Documentation Owner, Delivery/GitOps Lead, Security/Privacy Lead.
- Затронутые артефакты: `README.md`, `docs/README.md`, `docs/navigation/*`, `.github/PULL_REQUEST_TEMPLATE.md`, `AGENTS.md`.
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
