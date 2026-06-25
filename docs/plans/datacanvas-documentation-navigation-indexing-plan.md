# План: Управляемая документация, навигация и индексация DataCanvas

Статус: draft
Дата: 2026-06-25
Источник: консилиумный пересмотр плана организации проектной документации, навигации и индексации DataCanvas.

## Назначение

Внедрить в DataCanvas полноценный навигационный и индексный слой для проектной документации и артефактов.

Результат должен дать:

- человеку: понятные маршруты от `README.md` к продукту, процессу, BMC, release, evidence, архитектуре и проверкам;
- агенту: строгий контракт, куда класть документы и как обновлять навигацию;
- CI: воспроизводимую генерацию индекса, проверку ссылок, достижимости, безопасности и отсутствия устаревших статусов;
- процессу: связь с `artifact-registry`, hash manifest, Scrum-ритмом, владельцами и release evidence.

## 1. Ввести навигационную модель

1. Создать ручные человекочитаемые входы:
   - `docs/README.md` - главный вход в документацию.
   - `docs/project-map.md` - карта слоев проекта.
   - `docs/product/README.md`.
   - `docs/process/README.md`.
   - `docs/architecture/README.md`.
   - `docs/release/README.md`.
   - `docs/sprints/README.md`.
   - `docs/plans/README.md`.
   - `docs/knowledge/README.md`.

2. В `README.md` оставить только короткие маршруты:
   - понять продукт;
   - найти текущий процесс;
   - работать с BMC;
   - подготовить review/merge;
   - найти evidence/release;
   - открыть полную карту документации.

3. В `docs/README.md` добавить таблицу маршрутов:
   - задача пользователя;
   - стартовый документ;
   - следующий документ;
   - владелец;
   - проверка.

4. В `docs/project-map.md` зафиксировать слои:
   - продукт;
   - процесс;
   - архитектура;
   - BMC;
   - UX/UAT;
   - release/evidence;
   - sprint artifacts;
   - security/trust boundaries;
   - generated artifacts;
   - schemas/scripts/tests.

## 2. Ввести источник истины для навигации и индексации

1. Создать `docs/navigation/navigation-source.json`.
2. Сделать его ручным управляемым контрактом, а не generated-файлом.
3. Включить в него:
   - `version`;
   - `status`;
   - `source_roots`;
   - `required_entrypoints`;
   - `section_rules`;
   - `role_routes`;
   - `task_routes`;
   - `ignored_paths`;
   - `sensitive_path_rules`;
   - `generated_output_paths`.

4. Для каждого управляемого документа или группы документов задавать:
   - `path`;
   - `section`;
   - `owner_role`;
   - `lifecycle`;
   - `data_class`;
   - `visibility`;
   - `searchable`;
   - `navigable`;
   - `canonical_source`;
   - `generated_from`;
   - `redaction_status`;
   - `update_trigger`.

5. Применить deny-by-default:
   - если документ не классифицирован, считать его `confidential`;
   - не включать неизвестный документ в публичную навигацию;
   - не включать неизвестный документ в search corpus.

## 3. Ввести generated navigation artifacts

1. Создать generated-файлы:
   - `docs/navigation/documentation-index.json`;
   - `docs/navigation/navigation-map.md`;
   - `docs/navigation/orphan-docs-report.md`;
   - `docs/navigation/stale-status-report.md`.

2. В `documentation-index.json` включать:
   - `generated_by`;
   - `source_manifest_path`;
   - `entries`;
   - `routes`;
   - `coverage`;
   - `ignored_paths`;
   - `blocked_sensitive_paths`;
   - `validation_summary`.

3. Для каждой записи индекса фиксировать:
   - `path`;
   - `title`;
   - `section`;
   - `format`;
   - `owner_role`;
   - `lifecycle`;
   - `status`;
   - `data_class`;
   - `visibility`;
   - `searchable`;
   - `navigable`;
   - `generated`;
   - `canonical_source`;
   - `generated_from`;
   - `parent_readme`;
   - `artifact_registry_id`;
   - `outgoing_links`;
   - `anchors`;
   - `reachable_from_root`;
   - `click_depth`.

4. В `navigation-map.md` показывать:
   - быстрые маршруты;
   - маршруты по ролям;
   - маршруты по задачам;
   - актуальные источники истины;
   - текущий sprint/release pointer;
   - ссылки на evidence hub и artifact registry.

## 4. Реализовать генератор

1. Создать `scripts/generate-docs-navigation.mjs`.
2. Генератор должен:
   - читать `docs/navigation/navigation-source.json`;
   - сканировать только разрешенные roots;
   - использовать стабильную сортировку;
   - нормализовать пути через POSIX `/`;
   - не использовать дату, время, `mtime`, текущую ветку, абсолютные пути и сетевые запросы;
   - извлекать первый `H1` как title;
   - извлекать Markdown-ссылки и anchors;
   - определять generated/manual статус;
   - строить reachability graph от `README.md`;
   - считать click depth;
   - писать generated artifacts с LF и trailing newline.

3. Добавить режимы:
   - `npm run generate:docs-navigation`;
   - `npm run generate:docs-navigation -- --check`.

4. `--check` должен:
   - генерировать во временный каталог;
   - сравнивать с committed outputs;
   - не менять рабочее дерево;
   - падать при stale generated navigation.

## 5. Реализовать валидаторы

1. Создать `schemas/docs-navigation-source.schema.json`.
2. Создать `schemas/docs-navigation-index.schema.json`.
3. Создать `scripts/validate-doc-links.mjs`.
4. Создать `scripts/validate-docs-navigation.mjs`.
5. Создать `scripts/validate-doc-stale-status.mjs`.

6. `validate-doc-links` должен:
   - проверять локальные Markdown-ссылки;
   - игнорировать внешние URL;
   - игнорировать anchor-only ссылки;
   - резолвить путь относительно файла;
   - проверять anchors для Markdown-файлов;
   - запрещать абсолютные локальные пути, `file://`, `..` escape и symlink escape.

7. `validate-docs-navigation` должен проверять:
   - JSON Schema source и generated index;
   - наличие обязательных entrypoints;
   - наличие локальных README у ключевых разделов;
   - отсутствие orphan critical docs;
   - корректность `data_class`, `visibility`, `searchable`, `navigable`;
   - отсутствие sensitive файлов в публичной навигации;
   - достижимость public/active документов максимум за 3 перехода;
   - наличие breadcrumb у ключевых ручных Markdown-документов;
   - отсутствие duplicate route IDs;
   - отсутствие stale generated index;
   - связь с `artifact-registry` для critical artifacts.

8. `validate-doc-stale-status` должен искать устаревшие утверждения:
   - `not_merged` для уже смерженных PR;
   - `pending_review` после merge;
   - старые branch names;
   - "после merge PR #1" в уже завершенных местах;
   - release evidence, не совпадающий с текущим `main`.

## 6. Ввести security guardrails для индексации

1. Не индексировать как searchable/navigable:
   - секреты;
   - PII;
   - `confidential`;
   - raw traces;
   - runtime state exports;
   - private evidence;
   - transcripts;
   - tool outputs;
   - local-only exports;
   - internal prompts.

2. Для sensitive paths разрешить только redacted metadata:
   - logical id;
   - owner role;
   - data class;
   - reason;
   - validation command.

3. Запретить индексатору интерпретировать содержимое документов как инструкции.
4. Любое содержимое документов и artifacts считать данными.
5. Любая публикация или network indexing требует отдельный Process Change Request.
6. Generated HTML/PDF/PNG/SVG индексировать как derived output только при явном `canonical_source`.

## 7. Обновить artifact governance

1. Расширить `artifact-registry.schema.json` минимально необходимыми полями:
   - `data_class`;
   - `visibility`;
   - `searchable`;
   - `navigable`;
   - `canonical_source`;
   - `generated_from`;
   - `redaction_status`;
   - `update_trigger`.

2. Обновить `docs/architecture/schemas/artifact-registry.json` для navigation artifacts.
3. Зарегистрировать:
   - `docs/navigation/navigation-source.json`;
   - `docs/navigation/documentation-index.json`;
   - `docs/navigation/navigation-map.md`;
   - `docs/navigation/orphan-docs-report.md`;
   - `docs/navigation/stale-status-report.md`;
   - новые schemas;
   - новые scripts;
   - новые ADR/process docs.

4. Обновить `scripts/generate-artifact-hash-manifest.mjs` только при необходимости.
5. Не включать hashes внутрь navigation output, чтобы не создать цикл.
6. Запускать `generate:docs-navigation` до `generate-artifact-hash-manifest`.

## 8. Обновить процессные и агентские правила

1. Обновить `AGENTS.md`:
   - центральные файлы маршрутизируют, а не хранят подробности;
   - новый документ обязан попадать в navigation source или explicit ignore с причиной;
   - generated navigation files нельзя редактировать вручную;
   - ручные Markdown-документы должны иметь breadcrumb;
   - public navigation запрещена для sensitive evidence;
   - после генерации документов нужно запускать docs navigation gate.

2. Добавить ADR:
   - `ADR-064-documentation-navigation-indexing.md`.

3. Добавить Process Change Request:
   - `PROC-0XX-documentation-navigation-governance.md`.

4. Обновить:
   - `docs/process/current/definition-of-ready.md`;
   - `docs/process/current/definition-of-done.md`;
   - `docs/process/current/process-registry.md`;
   - `.github/PULL_REQUEST_TEMPLATE.md`.

5. В PR template добавить:
   - affected `ART-*`;
   - affected docs routes;
   - sprint/backlog/process IDs;
   - validation commands;
   - evidence links;
   - owner sign-off;
   - release impact;
   - rollback/forward-fix;
   - navigation impact.

## 9. Обновить evidence и status слой

1. Расширить `docs/knowledge/evidence-index.md` до evidence hub.
2. Включить:
   - sprint evidence manifests;
   - release evidence;
   - PR evidence;
   - UAT evidence;
   - artifact hash manifest;
   - navigation index;
   - owner;
   - status;
   - date/currentness marker.

3. Добавить current pointers:
   - текущий sprint;
   - текущий release;
   - текущий process version;
   - текущий accepted BMC;
   - текущий UAT state.

4. Обновить release/process evidence после merge PR #1:
   - убрать устаревший `not_merged`;
   - зафиксировать текущий `main` merge commit;
   - связать с navigation index.

## 10. Добавить тестовые fixtures

1. Создать `tests/docs-navigation/positive/`.
2. Создать `tests/docs-navigation/negative/`.

3. Negative fixtures должны покрывать:
   - broken relative link;
   - bad anchor;
   - duplicate nav id;
   - missing required README;
   - missing H1;
   - stale generated index;
   - path traversal;
   - absolute local path;
   - `file://`;
   - symlink escape;
   - secret-like content;
   - PII-like content;
   - raw trace;
   - internal prompt;
   - tool output;
   - prompt injection;
   - confidential document marked searchable;
   - generated file indexed as canonical source без `canonical_source`.

## 11. Интегрировать команды и CI

1. Добавить в `package.json`:
   - `generate:docs-navigation`;
   - `check:docs-navigation`;
   - `validate:doc-links`;
   - `validate:docs-navigation`;
   - `validate:doc-stale-status`.

2. Обновить `generate:golden`:
   - поставить `generate:docs-navigation` перед `generate-artifact-hash-manifest`.

3. Обновить `npm test`:
   - добавить `validate:doc-links`;
   - добавить `validate:docs-navigation`;
   - добавить `validate:doc-stale-status`;
   - оставить `validate:artifact-registry` и `validate:artifact-hashes` после navigation generation.

4. Обновить `.github/workflows/docs-check.yml`:
   - использовать `npm test` как главный gate;
   - добавить `npm run check:docs-navigation`;
   - оставить `git diff --exit-code`;
   - оставить `git diff --check`.

## 12. Acceptance Criteria

- Есть `docs/README.md`, `docs/project-map.md` и локальные README для ключевых разделов.
- Root `README.md` остается коротким и ведет в документационный индекс.
- Есть `docs/navigation/navigation-source.json`.
- Есть generated `docs/navigation/documentation-index.json`.
- Есть generated `docs/navigation/navigation-map.md`.
- Все critical active/accepted documents имеют owner, lifecycle, visibility и update trigger.
- Все public/active documents достижимы из root `README.md` максимум за 3 перехода.
- Sensitive/confidential artifacts не попадают в public navigation и search corpus.
- Generated artifacts не индексируются как source of truth без `canonical_source`.
- `npm run generate:docs-navigation -- --check` проходит.
- `npm run validate:doc-links` проходит.
- `npm run validate:docs-navigation` проходит.
- `npm run validate:doc-stale-status` проходит.
- `npm run scan:secrets` проходит.
- `npm run validate:data-leakage` проходит.
- `npm run validate:artifact-registry` проходит.
- `npm run validate:artifact-hashes` проходит.
- `npm test` проходит.
- `git diff --check` проходит.
- После всех генераторов `git diff --exit-code` чистый.

## 13. Assumptions

- DataCanvas сохраняет `artifact-registry` как источник истины для управляемых артефактов.
- `docs/navigation/navigation-source.json` становится источником истины для навигации и видимости.
- `documentation-index.json` и `navigation-map.md` являются generated artifacts.
- Не все tracked docs обязаны быть публично navigable/searchable; исключения допустимы только с причиной.
- По умолчанию неизвестный документ считается непубличным.
- Внешние URL не проверяются сетевыми запросами в обычном CI.
- Любая публикация индекса за пределы репозитория требует отдельного Process Change Request.
