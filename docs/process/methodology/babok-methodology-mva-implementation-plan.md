# План Доведения BABOK-Методологии До Минимально Полного Контура

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Процесс](../README.md) / [Методика проектной документации](README.md) / План доведения BABOK-методологии до минимально полного контура

Статус: active
Владелец: Process Owner
Проверка: `npm run validate:documentation-methodology`

## Summary

Доработать текущий методический слой DataCanvas так, чтобы BABOK-исследование стало проверяемой, машинно читаемой и практически применимой методикой управления проектной документацией. Итоговый контур должен покрывать бизнес-анализ, системный анализ, трассируемость, change control, architecture handoff, backlog readiness, release/evidence и операционную оценку результата.

Методология не должна становиться параллельным источником проектных требований. Она задает правила, шаблоны, gates и порядок работы; сами требования, backlog, архитектурные решения, схемы, evidence и release artifacts остаются в существующих проектных разделах.

## Источники Истины И Precedence

- Зафиксировать в `docs/process/methodology/README.md` и машинной policy иерархию источников:
  - BABOK research и локальный source index - методический источник правил;
  - methodology policy, templates и traceability model - правила применения методики;
  - product/process/architecture artifacts - источники проектного содержания;
  - generated navigation/hash/evidence manifests - проверочные и навигационные производные.
- Уточнить, что бизнесовые требования нельзя выводить напрямую из BABOK-исследования, ADR, schemas или scripts.
- Уточнить, что `traceability-model.json` описывает методическую модель трассировки и не заменяет существующие project traceability artifacts.
- Описать правило конфликтов:
  - проектное содержание берется из product/process/architecture artifacts;
  - методическое правило берется из methodology policy;
  - generated/mixed artifacts не считаются первичным источником.

## Методические Machine Artifacts

- Расширить `documentation-methodology-policy.json` и schema:
  - добавить `requirement_schema`;
  - добавить `artifact_state_model`;
  - добавить `requirement_state_model`;
  - добавить `traceability_policy`;
  - добавить `source_index_policy`;
  - добавить `validation_levels`: `baseline`, `advisory`, `strict`;
  - добавить `gate_severity`: `error`, `warning`, `advisory`;
  - добавить `not_applicable` только с обязательным `rationale`.
- Включить полный обязательный набор gates из плана и исследования:
  - business analysis: `problem_defined`, `business_value_measurable`, `stakeholders_identified`, `scope_defined`, `success_metrics_defined`, `business_rules_recorded`, `business_requirements_traceable`;
  - system analysis: `behavior_defined`, `data_defined`, `integrations_defined`, `nfr_defined`, `errors_defined`, `acceptance_criteria_defined`, `verification_method_defined`;
  - AI-agent solution: `agent_goal_defined`, `tools_defined`, `permissions_defined`, `human_approval_defined`, `traces_defined`, `evals_defined`, `guardrails_defined`, `explainability_defined`.
- Добавить `babok-research-source-index.json`:
  - `source_id`;
  - `section_id`;
  - `section_title`;
  - `topic`;
  - `applies_to`;
  - `rule_summary`;
  - `locator`;
  - `content_hash`;
  - `source_file_reference`;
  - `source_date_or_version`, если доступно.
- Не коммитить raw-файлы из `Downloads`; в проект добавлять только нормализованный индекс, краткие тезисы и проверяемые правила.

## BABOK Coverage Map

- Добавить карту соответствия `BABOK knowledge area -> DataCanvas artifact -> policy section -> validator check`.
- Минимально покрыть:
  - Business Analysis Planning & Monitoring;
  - Elicitation & Collaboration;
  - Requirements Life Cycle Management;
  - Strategy Analysis;
  - Requirements Analysis & Design Definition;
  - Solution Evaluation.
- Для каждой области указать:
  - обязательные артефакты;
  - применимые gates;
  - ожидаемый evidence;
  - уровень проверки на первом внедрении: `baseline`, `advisory` или `strict`.

## Artifact Map И Навигация

- Добавить или расширить machine artifact map для классификации:
  - `manual`;
  - `machine_readable`;
  - `template`;
  - `generated`;
  - `evidence`;
  - `reference`.
- Явно указать entrypoint:
  - основной entrypoint: `docs/process/methodology/README.md`;
  - шаблоны: `docs/process/methodology/templates/`;
  - machine support artifacts: policy, source index, traceability model, artifact map.
- Обновить `docs/navigation/navigation-source.json`:
  - добавить новые ручные entrypoints;
  - для machine support artifacts выбрать либо navigation entries, либо `ignored_paths` с причиной;
  - generated navigation files обновлять только генератором.
- Для новых ручных Markdown entrypoints добавить breadcrumb в начале документа.

## Шаблоны BABOK-Методологии

- Добавить BRD template с обязательными разделами:
  - проблема и контекст;
  - бизнес-цель;
  - измеримая ценность;
  - заинтересованные стороны;
  - границы;
  - бизнес-правила;
  - метрики успеха;
  - бизнес-требования;
  - предположения и ограничения;
  - открытые вопросы;
  - traceability links.
- Добавить SRS template с обязательными разделами:
  - системный контекст;
  - сценарии и поведение;
  - функциональные требования;
  - данные и доменная модель;
  - интеграции и интерфейсы;
  - API/schema impact;
  - NFR с метриками;
  - ошибки и edge cases;
  - acceptance criteria;
  - verification method;
  - architecture handoff;
  - traceability links.
- Добавить stakeholder map template:
  - stakeholder id;
  - роль;
  - интерес;
  - влияние;
  - источник требований;
  - способ подтверждения решений.
- Добавить elicitation log/template:
  - источник требования;
  - дата;
  - вопрос;
  - ответ или решение;
  - предположение;
  - unresolved clarification;
  - связанный requirement/backlog id.
- Добавить change request / impact analysis template:
  - источник изменения;
  - затронутые требования;
  - затронутые backlog items;
  - затронутые architecture/schema/test/release artifacts;
  - оценка влияния;
  - решение;
  - baseline/change status.
- Добавить story readiness report template:
  - связанный business requirement;
  - связанный system requirement;
  - acceptance criteria;
  - verification method;
  - dependency/blocked status;
  - readiness verdict;
  - missing gates.
- Добавить solution evaluation report template:
  - реализованная capability;
  - ожидаемая бизнес-ценность;
  - фактический сигнал или метрика;
  - release evidence;
  - telemetry или feedback;
  - gap/improvement item.

## System Analysis Artifact Pack

- Ввести минимальный SA artifact pack как часть методологии:
  - `system-context`;
  - `use-case/spec`;
  - `domain-data-model`;
  - `interface-contract`;
  - `nfr-profile`;
  - `error-catalog`;
  - `acceptance-verification-map`.
- Зафиксировать, что SRS должен ссылаться на эти элементы или явно отмечать `not_applicable` с rationale.
- Добавить правила architecture handoff:
  - system requirements должны приводить к проверке ADR impact;
  - API/schema/data requirements должны приводить к проверке contract artifacts;
  - NFR должны приводить к test strategy или verification evidence;
  - error behavior должен быть связан с acceptance/verification.
- Добавить проверки orphan cases:
  - требование без источника;
  - system requirement без business trace;
  - backlog item без requirement trace;
  - API/interface change без acceptance criteria;
  - NFR без метрики;
  - architecture decision без связанного requirement или rationale.

## Traceability Model И Coverage

- Добавить `traceability-model.json` с методической цепочкой:
  - `business_goal -> stakeholder_need -> business_requirement -> system_requirement -> interface/data/nfr/error requirement -> backlog_item -> acceptance_test -> evidence -> release_record -> telemetry_or_feedback -> improvement_item`.
- Описать типы связей:
  - `derives_from`;
  - `satisfies`;
  - `verifies`;
  - `implements`;
  - `impacts`;
  - `supersedes`;
  - `monitors`.
- Описать уровни gates:
  - artifact-level;
  - requirement-level;
  - backlog-item-level;
  - release-level.
- Добавить coverage report expectations:
  - доля требований с business trace;
  - доля требований с system trace;
  - доля backlog items с requirement trace;
  - доля requirements с acceptance criteria;
  - доля requirements с verification method;
  - доля released requirements с evidence;
  - список orphan/stale/missing links.
- Не требовать 100% покрытия для legacy artifacts на первом этапе; для новых или существенно измененных артефактов включать strict-проверку после advisory phase.

## Agent Usage Contract

- Добавить agent-facing раздел в methodology README:
  - порядок чтения артефактов перед изменением проектной документации;
  - как выбрать шаблон по типу изменения;
  - как применить gates;
  - как фиксировать вопросы к пользователю;
  - как оформлять impact analysis;
  - как действовать при конфликте источников;
  - какие проверки запускать перед handoff.
- Зафиксировать режим остановленного интервью:
  - интервью остается paused;
  - новое требование заказчика сначала проходит methodology/change intake;
  - возобновление интервью возможно только после регистрации методического follow-up и impact analysis.

## Validator И Schema Changes

- Усилить `scripts/validate-documentation-methodology.mjs`:
  - проверять точный набор обязательных gates;
  - проверять schema для policy, source index, traceability model и artifact map;
  - проверять наличие и минимальные разделы шаблонов;
  - проверять navigation/source registration;
  - проверять source index на пустые или неполные fragments;
  - проверять, что exceptions живут в policy, а не захардкожены в validator;
  - выдавать diagnostic report с severity, artifact path, missing gate, broken link и remediation hint.
- Разделить проверки:
  - JSON Schema проверяет форму;
  - custom validator проверяет gates, traceability, templates, navigation и coverage;
  - документационный review checklist остается для смыслового качества.
- Добавить режимы:
  - `baseline`: проверяет наличие обязательного методического каркаса;
  - `advisory`: показывает предупреждения для legacy/project artifacts;
  - `strict`: падает на нарушениях для methodology artifacts и новых/существенно измененных product/process artifacts.

## Test Fixtures И Negative Tests

- Добавить fixtures для валидатора:
  - валидная policy;
  - валидный source index;
  - валидный traceability model;
  - валидный BRD/SRS/readiness template sample;
  - невалидная policy без `success_metrics_defined`;
  - невалидная policy без `acceptance_criteria_defined`;
  - пустой source index;
  - traceability chain с пропущенным обязательным звеном;
  - SRS template без acceptance criteria;
  - NFR без метрики;
  - story readiness sample без requirement trace.
- Добавить golden diagnostic report для ожидаемых ошибок.
- Проверить, что валидатор не требует всех gates для каждого артефакта, а применяет правила по artifact type.

## Process Backlog И Rollout

- Оставить `PROC-039` как завершенный baseline интеграции методологии.
- Добавить отдельные follow-up process items:
  - BABOK methodology MVA completion;
  - SA artifact pack;
  - traceability validator and coverage report;
  - architecture handoff rules;
  - legacy artifact alignment;
  - strict validation rollout.
- В process evidence зафиксировать, что текущий этап не меняет бизнес-содержание требований, а добавляет методику, шаблоны и проверки.
- Ввести phased rollout:
  - Phase 1: добавить артефакты, schema, templates, advisory diagnostics;
  - Phase 2: включить strict checks для methodology artifacts;
  - Phase 3: распространить strict checks на новые и существенно измененные product/process artifacts;
  - Phase 4: провести отдельную миграцию legacy artifacts по coverage report.

## Acceptance Criteria

- Все обязательные gates из BABOK-плана и исследования представлены в policy, schema и validator checks.
- `babok-research-source-index.json` содержит стабильные fragment ids, применимость, locator и hash/summary без raw research copy.
- `traceability-model.json` покрывает цепочку от business goal до telemetry/improvement item.
- BRD, SRS, stakeholder map, elicitation log, change request, story readiness report и solution evaluation report доступны как шаблоны.
- Новый агент без контекста может открыть methodology README и понять:
  - какие документы читать;
  - какой шаблон использовать;
  - какие gates применить;
  - какие проверки запустить;
  - как оформить конфликт или missing clarification.
- Валидатор падает на контрольных negative fixtures и проходит на valid fixtures.
- Navigation, artifact registry и hash manifest находятся в воспроизводимом состоянии после генераторов.
- `PROC-039` не используется как доказательство полного MVA; недостающая работа отражена отдельными process items.

## Test Plan

- Узкие проверки:
  - `npm run validate:documentation-methodology`
  - `npm run validate:schemas`
  - `npm run generate:docs-navigation -- --check`
  - `npm run validate:docs-navigation`
  - `npm run validate:doc-links`
  - `npm run validate:doc-stale-status`
- Процессные и safety checks:
  - `npm run validate:ba-sa`
  - `npm run validate:backlog-registry`
  - `npm run scan:secrets`
  - `npm run validate:data-leakage`
- Проверки воспроизводимости:
  - `npm run validate:artifact-registry`
  - `npm run validate:artifact-hashes`
  - `git diff --check`
- Финальный gate:
  - `npm test`
- После генерации проверить, что нет ручных правок generated navigation files и что все новые документы либо зарегистрированы в `docs/navigation/navigation-source.json`, либо добавлены в `ignored_paths` с причиной.

## Assumptions

- Raw-файлы из `/Users/s060874gmail.com/Downloads` не добавляются в репозиторий.
- Структура остается в `docs/process/methodology/`, без создания параллельного `/docs/00_methodology`.
- Новые человекочитаемые артефакты создаются на русском языке.
- Идентификаторы `REQ-*`, `PBI-*`, `PROC-*`, `ADR-*` сохраняются и не переиспользуются.
- Существующее бизнес-содержание не мигрируется в рамках этой доработки; legacy alignment выполняется отдельным follow-up после появления coverage report.
