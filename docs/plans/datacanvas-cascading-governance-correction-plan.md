# План Исправления Cascade Governance После Консилиумов

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / [Планы](README.md) / Исправление cascade governance

Статус: draft
Владелец: Process Owner
Дата: 2026-07-02
Источник: два консилиума по 12 релевантных экспертов: консилиум валидации проделанной работы и консилиум оценки фактов для плана исправления.
Проверка: `npm run validate:cascading-governance`, `npm run validate:schemas`, `npm run validate:docs-navigation`, `npm run validate:artifact-registry`, `npm run validate:artifact-hashes`

## Краткое Решение

Текущую работу нельзя считать `Done` или release-ready. Профильные проверки проходят, но пропускают расхождение источников истины, неполное evidence и самодекларативные статусы.

`PROC-038` не принимается сейчас. Cascade governance остается подготовительным draft/scaffolding до явного Process Owner acceptance. Product/BMC scope не расширяется без отдельного решения Product Owner.

## Ключевые Исправления

- Создать audit-артефакты двух консилиумов в `docs/process/audits/` и зарегистрировать их в navigation source и artifact registry.
- Убрать неподтвержденные cascade lifecycle claims из Vision, stories, backlog, roadmap, product requirements, `US-004`, `NFR-006`, acceptance и product traceability.
- Убрать cascade claims из BMC generator и regenerated BMC outputs; не обновлять `bmc-trace` под cascade, пока `PROC-038` не принят.
- Оставить `PROC-038` как `draft/not_decided`; в DoR, DoD, passport, registry и process README заменить обязательные формулировки на подготовительный opt-in gate до acceptance.
- Перевести текущий `CascadingUpdateRun` из `complete` в `blocked`: `done_claimed: false`, `all_affected_artifacts_resolved: false`, blocking decision `DEC-PROCESS-OWNER-ACCEPTANCE`.
- Обновить impact report и decision queue так, чтобы они не заявляли завершенный cascade.
- Добавить общий `schemas/common-defs.schema.json` с `repoPath`, `nullableRepoPath`, `semver`, `quarter` и переиспользовать его в cascade/Jira/capacity schemas.
- Усилить `validate-cascading-governance.mjs`: читать связанные DCR, impact report, decision queue, run, capacity/Jira artifacts; сверять `change_request_id`, target, queue decisions, validation plan, affected coverage, Jira readiness и capacity/trade-off decisions.
- Разделить fixtures на `positive`, `negative/schema`, `negative/invariants`; добавить negative cases для false Done, pending affected artifacts, closed queue with pending decision, Jira ready/imported без mapping, capacity null/overrun, path traversal и missing graph target.
- Ограничить runner до safe dry-run: валидировать входы, писать blocked evidence при missing target, строить per-edge decisions, не применять semantic edits, не запускать generators, не закрывать Done.
- Ограничить `--output-dir` каталогом `docs/process/cascading-governance/runs/<run-id>/`; запретить absolute paths, `..`, Windows drive paths, `file://`, NUL и overwrite.
- Исправить `parentReadmeFor` для поиска ближайшего ancestor `README.md` и добавить guard в docs navigation validator.
- Синхронизировать release pack pointer с текущим `current_main_commit`.
- Убрать cascade event metric unlocks или пометить их draft-only.
- Обновить traceability graph только для draft process chain: plan -> `PROC-038` -> `ADR-065` -> schemas/validator/fixtures/evidence.

## Порядок Исполнения

1. Product/BMC rollback: убрать неподтвержденную продуктовую семантику и поправить BMC generator source.
2. Process status: выровнять `PROC-038`, план, ADR, DoR/DoD, passport, registry, changelog, ledger, event log и run/evidence.
3. Validator/schema hardening: усилить схемы, negative fixtures, `validate-json-schema.mjs`, `validate-cascading-governance.mjs` и package scripts.
4. Runner: сделать честный safe dry-run runner, который создает blocked evidence и не применяет semantic edits.
5. Navigation/release/traceability: обновить navigation source, release pointer, traceability graph и artifact registry.
6. Generated artifacts: финально регенерировать BMC, docs navigation, artifact hashes и process metrics snapshots.

## Проверки

Точечные проверки:

```bash
npm run validate:cascading-governance
npm run validate:schemas
npm run validate:bmc
npm run generate:bmc -- --check
npm run generate:docs-navigation -- --check
npm run validate:doc-links
npm run validate:docs-navigation
npm run validate:doc-stale-status
npm run validate:artifact-registry
npm run validate:artifact-hashes
npm run scan:secrets
npm run validate:data-leakage
git diff --check
```

Финальный gate после всех generated artifacts:

```bash
npm test
```

## Оптимизированный Goal Prompt

```text
Создай goal: реализовать план из docs/plans/datacanvas-cascading-governance-correction-plan.md end-to-end без расширения scope. Сначала прочитай этот план, AGENTS.md и текущий git status. Не пересказывай план; выполняй его по разделам, сохраняя PROC-038 как draft/not_decided, не придумывая capacity/Jira/business decisions. После правок запусти указанные gates, обнови generated artifacts только через генераторы, затем подготовь commit и push ветки codex/implement-cascading-doc-governance.
```

## Допущения

- Process Owner и Product Owner acceptance отсутствуют; поэтому `PROC-038` не принимается.
- Capacity values, Jira custom fields, priorities, dates и scope не заполняются без внешнего источника.
- Автоматическое применение semantic edits откладывается.
- PR после исправлений открывается как draft, если `PROC-038` все еще `not_decided`.
- Перед commit явно stage все intended modified и untracked files; не использовать `git commit -am`.
