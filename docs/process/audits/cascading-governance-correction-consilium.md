# Консилиум Оценки Фактов И Плана Исправления

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Процесс](../README.md) / Аудиты / Консилиум оценки фактов и плана исправления

Статус: draft
Дата: 2026-07-02
Владелец: Process Owner
Проверка: `npm run validate:cascading-governance`, `npm run validate:schemas`, `npm run validate:traceability-graph`, `npm test`

## Назначение

Артефакт фиксирует оценку собранных фактов и плана исправления проекта через второй консилиум из 12 экспертных перспектив. Консилиум проверял корректность направления исправлений и не принимал отсутствующие business, capacity или Jira decisions.

## Состав Консилиума

| Перспектива | Основной вывод |
|---|---|
| Process Owner | `PROC-038` должен остаться draft до явного решения Process Owner. |
| Product Owner | Product/BMC scope не должен расширяться процессным draft. |
| Release Manager | Release handoff возможен только после generated sync и финального gate. |
| QA/Evals Lead | Negative cases должны оставаться обязательной частью cascade gate. |
| Security/Privacy Lead | Path guards и secret/data leakage gates обязательны перед commit. |
| Schema/API Architect | Общие path/semver/quarter определения должны переиспользоваться в cascade/Jira/capacity schemas. |
| Tooling Engineer | Runner должен создавать blocked dry-run evidence, но не применять edits. |
| Traceability Analyst | `NFR-006` не должен оставаться продуктовым traceability item. |
| Navigation Governance Lead | Новые audit docs должны попасть в `navigation-source.json` и registry. |
| BMC/Product Modeling Expert | Generated BMC outputs должны быть пересобраны из исправленного source. |
| Jira/Delivery Integrations Expert | Jira package не готов без approved mapping или explicit `pending_external`. |
| Risk Manager | Главный residual risk — ложный Done/release-ready при stale generated outputs. |

## Подтвержденные Факты

- План исправления должен выполняться без дублирования product promises.
- `CascadingUpdateRun` не может заявлять Done, пока открыто `DEC-PROCESS-OWNER-ACCEPTANCE`.
- `NFR-006` и `US-004` не являются подтвержденными product-scope requirements.
- Release pointer должен быть синхронизирован с `current_main_commit`.
- `generate:bmc -- --check`, docs navigation check и artifact hashes являются обязательными, потому что изменения затрагивают generated outputs.

## План Исправления

1. Удержать `PROC-038` в состоянии `draft / not_decided` и описать cascade как opt-in scaffold.
2. Убрать cascade claims из ручных product/BMC sources и generated BMC outputs.
3. Перевести cascade run, impact report и decision queue в blocked state без Done claim.
4. Усилить schemas, negative fixtures, linked artifact invariants и safe dry-run runner.
5. Обновить traceability, navigation, artifact registry и hash manifest.
6. Запустить профильные gates, затем полный `npm test`, после чего выполнить commit и push.

## Финальные Gates

- `git diff --check`
- `npm run generate:bmc -- --check`
- `npm run validate:bmc`
- `npm run validate:cascading-governance`
- `npm run validate:schemas`
- `npm run generate:docs-navigation -- --check`
- `npm run validate:doc-links`
- `npm run validate:docs-navigation`
- `npm run validate:doc-stale-status`
- `npm run validate:artifact-registry`
- `npm run validate:artifact-hashes`
- `npm run validate:traceability-graph`
- `npm run scan:secrets`
- `npm run validate:data-leakage`
- `npm test`
