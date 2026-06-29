# План имплементации: полная валидация, закрытие drift и улучшение DataCanvas

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / [Планы](README.md) / Полная валидация и закрытие drift

Статус: draft
Дата: 2026-06-29
Владелец: Process Owner
Проверка: `npm test`, `git diff --check`, `git diff --exit-code`

Источник: consilium review плана по валидации проекта, закрытию оставшихся задач и улучшению DataCanvas.

## Summary

Цель: закрыть проверяемый drift между backlog, eval, traceability, navigation, release evidence и process evidence, не расширяя runtime scope и не включая внешний LLM.

После реализации:

- backlog IDs имеют единый канонический источник;
- `PBI-*`, `TECH-*`, `EVAL-*` и `PROC-*` не закрываются без связи item -> requirement/process decision -> evidence -> validation command;
- eval backlog, executable eval cases и validators синхронизированы;
- navigation, data leakage и artifact hash gates защищают проект от drift;
- release/audit evidence ссылается на актуальные PR/SHA и не перезаписывает release-cut SHA без явного правила;
- итоговый `main` проходит полный локальный gate и CI-equivalent reproducibility check.

## 1. Baseline и границы

Перед изменениями выполнить baseline:

- `git status --short --branch`
- `git rev-parse HEAD origin/main`
- `npm test`
- `git diff --check`
- `git diff --exit-code`

Scope реализации:

- не создавать runtime v1 в `src/`;
- не включать live LLM, сеть, внешние API, секреты, publish или deploy;
- не принимать `PROC-007`;
- не менять process version без отдельного PCR;
- не редактировать generated artifacts вручную.

Security stop rules:

- остановиться, если для выполнения требуется `network_access`, enabled provider, token/API key, изменение provider/tool allowlist, публикация наружу или ослабление `scan:secrets`/`validate:data-leakage`;
- unknown, raw, source и evidence данные считать `confidential`, пока проектный источник не доказывает обратное;
- `data_class: internal` допустим только после проверки, что артефакт не содержит secrets, PII, raw traces, internal prompts, local paths или tool outputs;
- `visibility: public` означает видимость в навигации репозитория, а не разрешение внешней публикации.

## 2. Backlog и traceability closure

Ввести канон backlog IDs:

- primary contours: `PBI-*`, `TECH-*`, `EVAL-*`, `PROC-*`, requirements IDs;
- `QA-*`, `SEC-*`, `OPS-*` не должны оставаться dangling в `docs/product/requirements/traceability-matrix.json`;
- предпочтение: заменить `QA-*`, `SEC-*`, `OPS-*` на существующие `TECH-*`, `EVAL-*`, `PROC-*`, risk/evidence links или NFR links без расширения registry contours;
- если отдельный contour действительно нужен, добавить его в `docs/product/backlog/backlog-registry.json`, schema, documentation и validator в рамках отдельного decision.

Усилить `scripts/validate-backlog-registry.mjs`:

- парсить Markdown backlog-таблицы product, technical, eval, process и sprint backlogs;
- проверять уникальность ID;
- проверять допустимые prefixes;
- проверять обязательные колонки;
- проверять допустимые статусы;
- проверять все `traceability-matrix.links[].backlog_items`;
- падать на orphan/dangling IDs;
- проверять, что sprint backlog IDs не противоречат central backlog semantics.

Обновить статусы без самообмана:

- `PBI-001..005` оставить `draft`;
- `PBI-006` оставить `in_progress`, пока Product Owner не примет Product Goal evidence;
- `TECH-001` оставить `active` как постоянный gate;
- `TECH-002`, `TECH-003`, `TECH-004` перевести в baseline done при наличии evidence;
- `TECH-005` не закрывать до нормализации смысла ID;
- `PROC-001` синхронизировать с ledger как accepted/done;
- `PROC-002`, `PROC-003` оставить `ready`;
- `PROC-004`, `PROC-005`, `PROC-007` оставить `draft`.

Acceptance:

- нет dangling `PBI-*`, `TECH-*`, `EVAL-*`, `PROC-*` в traceability;
- каждый закрытый item имеет acceptance evidence, validation command и ссылку на requirement или process decision;
- human decision items не переводятся в done без фактического решения.

## 3. Eval и validator hardening

Синхронизировать eval-контур:

- `docs/product/backlog/eval-backlog.md`;
- `tests/evals/eval-cases.json`;
- `docs/architecture/evals/eval-strategy.md`;
- `scripts/validate-eval-pack.mjs`.

Добавить или зафиксировать `EVAL-006` в `eval-backlog.md`.

Сделать `EVAL-*` semantics едиными:

- каждый ID имеет один смысл во всех артефактах;
- required categories покрывают happy path, negative, security, visual и regression;
- unsupported claim, prompt injection, export sanitization и human review trace имеют исполняемые проверки или явную связь с отдельным gate.

Добавить отдельный strict gate:

- script: `scripts/validate-eval-backlog-sync.mjs`;
- npm script: `validate:eval-backlog-sync`;
- проверяет ID, название, тип, статус, required/optional, linked requirement и наличие executable evidence;
- `npm test` должен включать этот gate.

Acceptance:

- `EVAL-001..006` есть в backlog, eval cases и validator;
- смысл каждого `EVAL-*` не расходится;
- `npm run validate:evals` и `npm run validate:eval-backlog-sync` проходят.

## 4. Navigation, leakage и generated integrity

Усилить docs navigation:

- business route targets должны иметь `navigation_group: business`, кроме явных reviewed exceptions;
- `role_routes` и `task_routes` проверяются против configured `navigation_groups`;
- новый `docs/product/**` документ должен быть в `docs/product/README.md`, `docs/navigation/navigation-source.json` или `ignored_paths`.

Добавить mutation negative tests:

- route ведёт на ADR, PROC, schema, script или raw evidence;
- отсутствует `artifact_registry_id`;
- generated map/index stale;
- confidential/raw evidence становится public/reachable;
- путь с `/Users/` попадает в public/searchable surface.

Усилить leakage coverage:

- `validate:data-leakage` должен сверять `sensitive_path_rules` с `docs/architecture/security/data-leakage-manifest.json`;
- каждый sensitive path либо scan target, либо explicit exclusion с причиной;
- public/reachable navigation surface должен попадать в leakage scan;
- новые evidence, runtime, export и trace sinks требуют записи в leakage manifest или явного `not_a_sink` rationale.

Усилить artifact hash integrity:

- `validate:artifact-hashes` проверяет exact set: artifact registry minus allowed exclusions equals hash manifest entries;
- duplicate `artifact_id` и duplicate `path` запрещены;
- entries имеют канонический порядок;
- hash manifest генерируется последним.

Generated artifact rule:

- если generated diff не воспроизводится штатным генератором, остановиться;
- не чинить generated outputs вручную.

## 5. Evidence, sprint package и release sync

Создать полный sprint package:

- `docs/sprints/2026-W27-backlog-closure/sprint-goal.md`;
- `docs/sprints/2026-W27-backlog-closure/sprint-backlog.md`;
- `docs/sprints/2026-W27-backlog-closure/planning.md`;
- `docs/sprints/2026-W27-backlog-closure/daily-notes.md`;
- `docs/sprints/2026-W27-backlog-closure/review.md`;
- `docs/sprints/2026-W27-backlog-closure/retro.md`;
- `docs/sprints/2026-W27-backlog-closure/decisions.md`;
- `docs/sprints/2026-W27-backlog-closure/evidence-index.md`;
- `docs/sprints/2026-W27-backlog-closure/artifact-updates.md`;
- `docs/sprints/2026-W27-backlog-closure/process-change-candidates.md`;
- `docs/sprints/2026-W27-backlog-closure/sprint-summary.md`;
- `docs/sprints/2026-W27-backlog-closure/sprint-evidence-manifest.json`.

В evidence зафиксировать:

- affected artifacts;
- команды и результаты;
- known limitations;
- rollback;
- metrics delta;
- failure-signal matrix.

Синхронизировать release/audit evidence:

- `docs/release/commit-pr-evidence.md`;
- `docs/release/mvp-release-evidence-pack.json`;
- `docs/release/mvp-release-evidence-pack.md`;
- `docs/process/audits/plan-completion-audit.json`;
- `docs/process/audits/plan-completion-audit.md`;
- current main SHA;
- PR URL;
- merge SHA;
- pointer-refresh SHA;
- CI run URL.

Release-cut rule:

- не перезаписывать release-cut SHA без явного правила;
- добавить current-main pointer отдельно, если evidence должен отражать текущий `main`.

Process observability:

- обновить process metrics snapshot через генератор;
- event log либо остаётся пустым с явным rationale, либо получает реальные `EVT-*` записи;
- проверить `npm run validate:process-events`;
- зафиксировать before/after по `artifact_registry_entries`, `accepted_process_changes`, `pending_evidence_checks`, `quality_gates_*`, `process_events`.

## 6. Генерация и проверки

Порядок генераторов:

- `npm run generate:docs-navigation`;
- `node scripts/collect-process-metrics.mjs`;
- все прочие пишущие генераторы, если требуются изменениями;
- `node scripts/generate-artifact-hash-manifest.mjs`.

Узкие проверки:

- `npm run check:docs-navigation`;
- `npm run validate:doc-links`;
- `npm run validate:docs-navigation`;
- `npm run validate:doc-stale-status`;
- `npm run validate:backlog-registry`;
- `npm run validate:evals`;
- `npm run validate:eval-backlog-sync`;
- `npm run validate:traceability-graph`;
- `npm run validate:risk-traceability`;
- `npm run validate:artifact-registry`;
- `npm run validate:artifact-hashes`;
- `npm run validate:process-events`;
- `npm run validate:process-metrics-snapshot`;
- `npm run scan:secrets`;
- `npm run validate:data-leakage`;
- `npm run validate:llm`;
- `npm run validate:provider`;
- `npm run validate:security-foundation`;
- `npm run validate:export`.

Финальный gate:

- `npm test`;
- `git diff --check`;
- `git diff --exit-code`;
- `git status --short --branch`.

## 7. Delivery и rollback

Feature branch/PR:

- менять только source, manual, schema и script files;
- generated outputs обновлять только генераторами;
- PR handoff содержит summary, affected backlog IDs, validation evidence, known limitations и rollback.

Merge:

- мержить только после зелёного PR CI;
- после merge выполнить allowlisted pointer/evidence refresh на `main`, если stale-status или release evidence этого требуют.

Done when:

- strict backlog/eval validators проходят;
- нет dangling backlog IDs;
- release/audit evidence указывает на актуальный PR/SHA;
- generated artifacts воспроизводимы;
- `npm test`, `git diff --check`, `git diff --exit-code` проходят;
- финальный `docs-check` на `main` зелёный;
- worktree/branch cleanup подтверждён.

Rollback:

- до merge: закрыть или переписать PR;
- после merge до pointer refresh: предпочесть forward-fix; при rollback revert merge через отдельный PR;
- после pointer refresh: revert pointer-refresh commit, затем feature merge commit, затем снова прогнать генераторы, evidence sync и полный gate;
- нельзя откатывать через ослабление validators, security gates, leakage rules или provider/network boundaries.
