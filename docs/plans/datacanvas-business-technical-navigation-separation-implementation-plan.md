# План имплементации: разделение бизнесовой и технической навигации DataCanvas

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / [Планы](README.md) / Разделение бизнесовой и технической навигации

Статус: draft
Дата: 2026-06-25
Владелец: Process Owner
Проверка: `npm run validate:docs-navigation`, `npm test`

Источник: консилиумный пересмотр плана разделения бизнесовой и технической навигации DataCanvas.

## Summary

Цель: сделать верхний уровень документации DataCanvas бизнес-first и закрепить это как проверяемый контракт ведения проектной документации.

После реализации:

- `README.md` сначала ведёт к бизнесовым артефактам DataCanvas: Vision, BMC, stories, БТ, пользовательские истории, NFR, acceptance criteria, product backlog, roadmap, hypotheses и traceability.
- `docs/README.md` разделяет бизнесовую навигацию, производственный контур, техническую документацию и методику/governance.
- `docs/product/README.md` становится каноническим Product Owner index.
- `docs/navigation/navigation-source.json`, schemas, generated navigation, artifact registry и validators согласованно отражают это разделение.
- Технические планы, ADR, schemas, scripts, tests, CI/evidence и методики остаются доступны, но не подменяют бизнесовую карту продукта.

## 1. Preflight

Перед изменениями выполнить read-only preflight:

- `git status --short --branch`
- `git rev-parse HEAD origin/main`
- определить текущий максимальный `ART-*` в `docs/architecture/schemas/artifact-registry.json`
- проверить, какие бизнесовые документы уже имеют `artifact_registry_id`
- проверить текущий `current_main_commit` в `docs/navigation/navigation-source.json`
- проверить, что `.github/workflows/docs-check.yml` менять не нужно, если не добавляется новый npm gate

## 2. Навигационная таксономия и контракт

Расширить `schemas/docs-navigation-source.schema.json` и `schemas/docs-navigation-index.schema.json`:

- добавить обязательное поле `navigation_group` для managed entries, role routes, task routes и generated index entries;
- допустимые значения:
  - `business`
  - `delivery`
  - `technical`
  - `governance`
  - `evidence`
  - `generated`
- добавить `navigation_groups` как упорядоченный справочник с русскими заголовками для generated map.

Закрепить смысл групп:

- `business`: Vision, BMC, stories, требования, backlog, roadmap, hypotheses, traceability;
- `delivery`: sprint, release, UAT, pilot, production/process evidence;
- `technical`: architecture, ADR, schemas, scripts, tests, security contracts, technical backlog;
- `governance`: процесс документации, PROC, планы, DoR/DoD, методики;
- `evidence`: evidence hub и generated/manual evidence exports;
- `generated`: generated navigation и отчёты генераторов.

Отдельно закрепить:

- `visibility: public` означает видимый маршрут в навигации репозитория;
- `data_class: public` означает возможность внешней публикации;
- для draft бизнесовых документов по умолчанию использовать `data_class: internal`, пока нет отдельного privacy/sanitization review.

## 3. Ручные входы навигации

Обновить `README.md`:

- первым содержательным блоком сделать “Бизнесовые артефакты DataCanvas”;
- включить прямые ссылки на:
  - `docs/product/README.md`
  - `docs/product-vision.md`
  - `docs/product/bmc/README.md`
  - `docs/stories.md`
  - `docs/product/requirements/README.md`
  - `docs/product/backlog/product-backlog.md`
  - `docs/product/roadmap/roadmap-v0.1.md`
  - `docs/product/hypotheses/hypothesis-board.md`
- ниже добавить “Производственный контур”;
- последним блоком добавить “Техническая документация и методики”;
- убрать plans/PROC/ADR/generator links с первого смыслового экрана.

Обновить `docs/README.md`:

- заменить смешанную таблицу на группы:
  - “Бизнесовая карта продукта”
  - “Производственный контур”
  - “Техническая документация”
  - “Методика и governance”
- маршрут “Понять продукт” должен вести через Vision -> BMC -> stories -> БТ/NFR -> acceptance -> backlog/roadmap/hypotheses;
- сохранить ссылки на generated navigation и source-of-truth блок.

Обновить `docs/product/README.md`:

- явно назвать документ каноническим бизнесовым индексом продукта;
- задать порядок чтения: Vision -> stories -> BMC -> БТ -> user stories -> NFR -> acceptance criteria -> backlog -> roadmap -> hypotheses -> traceability;
- отделить product backlog от technical backlog, eval backlog и process backlog;
- объяснить:
  - `docs/product-vision.md` — текущий обзорный Vision;
  - `docs/product/vision/vision-v0.1.md` — версионированный snapshot;
  - `docs/stories.md` — каталог исходных stories;
  - `docs/product/requirements/user-stories.md` — формализованные пользовательские истории.

Создать локальные индексы:

- `docs/product/requirements/README.md`
- `docs/product/backlog/README.md`
- `docs/product/roadmap/README.md`
- `docs/product/hypotheses/README.md`

Каждый индекс должен иметь breadcrumb, статус, владельца, проверку, назначение и ссылки на документы своего слоя.

## 4. Navigation Source и Generated Navigation

Обновить `docs/navigation/navigation-source.json`:

- добавить managed entries для ключевых бизнесовых документов;
- для business entries использовать `navigation_group: business`;
- для draft бизнесовых документов использовать `data_class: internal`;
- для безопасных бизнесовых маршрутов использовать `visibility: public`, `searchable: true`, `navigable: true`;
- для `traceability-matrix.json` оставить searchable/managed, но не обязательно делать top-level navigable;
- `docs/product/backlog/technical-backlog.md` явно классифицировать как `technical`;
- `docs/datacanvas-documentation-implementation-plan.md` классифицировать как archived governance/plan artifact или добавить в `ignored_paths` с причиной;
- raw BMC interviews, raw evidence, real UAT runtime state и security leakage inventories не делать public/navigable.

Обновить role/task routes:

- `role-product-owner`: product index, Vision, BMC, stories, БТ, NFR, acceptance, backlog, roadmap, hypotheses;
- `task-understand-product`: стартует с `docs/product/README.md`;
- добавить `task-find-business-requirements`;
- добавить `task-plan-product-work`;
- добавить `task-find-technical-docs`;
- добавить `task-find-documentation-methodology`.

Обновить `scripts/generate-docs-navigation.mjs`:

- переносить `navigation_group` в generated index;
- строить `docs/navigation/navigation-map.md` группами из `navigation_groups`;
- business-группу выводить первой;
- порядок внутри business-группы: product index, Vision, BMC, stories, requirements, backlog, roadmap, hypotheses, traceability;
- сохранить deterministic generation без дат, `mtime`, абсолютных путей и сетевых данных.

Generated files вручную не редактировать:

- `docs/navigation/documentation-index.json`
- `docs/navigation/navigation-map.md`
- `docs/navigation/orphan-docs-report.md`
- `docs/navigation/stale-status-report.md`

## 5. Artifact Registry и Hash Manifest

Обновить `docs/architecture/schemas/artifact-registry.json`.

Если текущий максимум остаётся `ART-423`, добавить:

- `ART-424` — `docs/product-vision.md`
- `ART-425` — `docs/stories.md`
- `ART-426` — `docs/product/requirements/README.md`
- `ART-427` — `docs/product/requirements/business-requirements.md`
- `ART-428` — `docs/product/requirements/user-stories.md`
- `ART-429` — `docs/product/requirements/non-functional-requirements.md`
- `ART-430` — `docs/product/requirements/acceptance-criteria.md`
- `ART-431` — `docs/product/requirements/traceability-matrix.json`
- `ART-432` — `docs/product/backlog/README.md`
- `ART-433` — `docs/product/backlog/product-backlog.md`
- `ART-434` — `docs/product/roadmap/README.md`
- `ART-435` — `docs/product/roadmap/roadmap-v0.1.md`
- `ART-436` — `docs/product/hypotheses/README.md`
- `ART-437` — `docs/product/hypotheses/hypothesis-board.md`
- `ART-438` — `docs/product/hypotheses/hypothesis-validation.md`

Если какие-то ID уже заняты, использовать следующий непрерывный свободный диапазон.

Для новых бизнесовых entries:

- `owner_role: Product Owner`;
- draft documents оставить `status: draft`;
- entrypoint indexes использовать `status: active`;
- не дублировать существующие BMC registry entries, если они уже зарегистрированы.

После registry changes обновить hash manifest:

- `node scripts/generate-artifact-hash-manifest.mjs`

## 6. Методика и Процесс

Обновить `docs/process/change-requests/PROC-036-documentation-navigation-governance.md`:

- зафиксировать business-first правило для root README, docs README и product README;
- описать `navigation_group`;
- закрепить, что новый бизнесовый документ обязан попасть в product index и business route либо иметь явное исключение;
- запретить выводить plans, PROC, ADR, schemas, scripts и raw evidence как первичный бизнесовый маршрут.

Обновить `docs/architecture/adr/ADR-064-documentation-navigation-indexing.md`:

- добавить решение о grouped generated navigation;
- закрепить `navigation_group` как часть контракта;
- уточнить различие `visibility` и `data_class`;
- зафиксировать, что generator/validator проверяют не только reachability, но и смысловую группу маршрута.

Обновить процессные артефакты:

- `docs/process/current/process-change-ledger.json`
- `docs/process/current/process-changelog.md`
- `docs/process/current/process-registry.md`
- `docs/process/current/definition-of-ready.md`
- `docs/process/current/definition-of-done.md`
- `docs/process/current/process-metrics-snapshot.md`
- `docs/process/current/process-metrics-snapshot.json`

Обновить `AGENTS.md`:

- бизнесовые утверждения нельзя выводить из ADR/schema/scripts как из первичного источника;
- технические контракты нельзя выводить из BMC/stories без ADR/schema/contract update;
- mixed/generated routes не являются источником истины.

Обновить `.github/PULL_REQUEST_TEMPLATE.md`:

- добавить `Business navigation impact`;
- добавить `Technical/process navigation impact`;
- добавить `Cross-group source-of-truth impact`;
- добавить checklist для registry/hash/generated navigation;
- добавить rollback checklist для navigation/schema/generator changes.

## 7. Validators и Tests

Расширить `scripts/validate-docs-navigation.mjs`:

- проверять наличие `navigation_group`;
- проверять, что все `start_path` и `next_paths` существуют;
- проверять, что route targets есть в generated index;
- запрещать business routes на restricted/confidential/sensitive/ignored paths;
- запрещать technical/governance docs использовать business group;
- требовать `artifact_registry_id` для public navigable business entries;
- проверять, что generated map содержит все configured groups;
- проверять, что business docs доступны из root максимум за 2 перехода;
- проверять, что public-reachable docs не содержат `/Users/`, `file://`, raw UAT paths, raw interview/evidence paths.

Подключить executable fixture checks:

- использовать существующие `tests/docs-navigation/positive/cases.json` и `tests/docs-navigation/negative/cases.json`;
- если текущий validator не исполняет эти cases, добавить harness и включить его в `npm test`.

Positive cases:

- business route ведёт к БТ без перехода через technical plan;
- product index содержит все канонические бизнесовые артефакты;
- generated navigation grouped by `navigation_group`;
- restricted evidence не становится business route.

Negative cases:

- business route указывает на `docs/plans/*implementation-plan.md`;
- business route указывает на `schemas/` или `scripts/` как primary product source;
- public business entry не имеет `artifact_registry_id`;
- `technical-backlog.md` классифицирован как business;
- public-reachable doc содержит `/Users/...`;
- generated map устарел после изменения source.

## 8. Validation

После ручных правок и генерации выполнить:

1. `npm run generate:docs-navigation`
2. `npm run check:docs-navigation`
3. `node scripts/generate-artifact-hash-manifest.mjs`
4. `node scripts/collect-process-metrics.mjs`
5. `npm run validate:doc-links`
6. `npm run validate:docs-navigation`
7. `npm run validate:doc-stale-status`
8. `npm run validate:artifact-registry`
9. `npm run validate:artifact-hashes`
10. `npm run validate:process-change-ledger`
11. `npm run validate:process-metrics`
12. `npm run validate:process-metrics-snapshot`
13. `npm run scan:secrets`
14. `npm run validate:data-leakage`
15. `npm test`
16. `git diff --check`

После повторного запуска генераторов проверить, что generated state воспроизводим.

## 9. Delivery Model

Использовать двухфазную delivery-модель.

Фаза 1: implementation PR

- изменить README/docs/product/navigation/schema/generator/validator/registry/process artifacts;
- не пытаться поставить `current_main_commit` на будущий merge commit;
- добиться зелёного локального gate и CI на PR.

Фаза 2: pointer-refresh после merge в `main`

- отдельным коротким commit обновить только allowlisted pointer-refresh paths:
  - `docs/navigation/navigation-source.json`
  - generated navigation outputs
  - `docs/release/commit-pr-evidence.md`
  - hash manifest при необходимости
- затем запустить final gate;
- дождаться зелёного `docs-check` на финальном `main`.

## 10. Acceptance Criteria

Готово, когда:

- `README.md` первым показывает бизнесовые артефакты DataCanvas;
- `docs/README.md` явно разделяет business, delivery, technical, governance/evidence;
- `docs/product/README.md` является рабочим Product Owner index;
- БТ доступны из root README максимум за 2 перехода;
- `docs/navigation/navigation-map.md` генерируется группами, а не плоским списком;
- все critical business docs имеют `ART-*`;
- `technical-backlog.md` не классифицируется как business;
- plans/PROC/ADR/schemas/scripts не появляются как первичный business route;
- sensitive/raw evidence не становится public/searchable/navigable;
- `PROC-036`, `ADR-064`, registry, hash manifest и process metrics согласованы;
- `npm test`, docs navigation gates, security gates и artifact gates проходят.

## Assumptions

- `docs/product-vision.md` является текущим обзорным Vision.
- `docs/product/vision/vision-v0.1.md` является версионированным snapshot.
- `docs/stories.md` является каталогом исходных stories.
- `docs/product/requirements/user-stories.md` является формализованными пользовательскими историями.
- Draft business documents могут быть видимыми в repo navigation, но это не означает утверждение содержания.
- Внешняя публикация требует отдельного review по `data_class`, secrets и leakage.
