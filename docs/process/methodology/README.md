# Методика Проектной Документации

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Процесс](../README.md) / Методика проектной документации

Статус: active
Владелец: Process Owner
Проверка: `npm run validate:documentation-methodology`

## Назначение

Этот раздел фиксирует методическую основу для ведения проектной документации DataCanvas. Методика используется как проверяемый контур правил, шаблонов, gates и порядка работы. Она не заменяет Vision, BMC, requirements, backlog, ADR, schemas, release evidence или другие проектные источники содержания.

## Источники И Precedence

| Уровень | Что является источником | Для чего применяется |
|---|---|---|
| 1 | [BABOK research source](babok-research-source.md) и `babok-research-source-index.json` | Методические правила и нормализованные фрагменты исследования |
| 2 | `documentation-methodology-policy.json`, templates и `traceability-model.json` | Правила применения методики, обязательные sections, gates и связи |
| 3 | Product/process/architecture artifacts | Проектное содержание, требования, backlog, architecture decisions, contracts и evidence |
| 4 | Generated navigation/hash/evidence manifests | Проверочные и навигационные производные |

Правило конфликтов:

- проектное содержание берется из product/process/architecture artifacts;
- методическое правило берется из policy и source index;
- generated и mixed artifacts не считаются первичным источником;
- бизнесовые требования нельзя выводить напрямую из BABOK-исследования, ADR, schemas или scripts;
- технические контракты нельзя выводить из BMC, stories или Vision без обновления ADR, schema или contract artifact.

`traceability-model.json` описывает методическую модель трассировки. Он не заменяет существующие project traceability artifacts и не является источником проектных требований.

## Артефакты Раздела

| Тип | Артефакт |
|---|---|
| Manual | [Нормализованный источник BABOK-исследования](babok-research-source.md) |
| Manual | [Исследование процесса разработки ПО с поддержкой ИИ в крупной финтех-корпорации](ai-enabled-software-development-process-research.md) |
| Manual | [Методика ведения проектной документации](project-documentation-methodology.md) |
| Manual | [Протокол PO-опросника Product Change Order](../../product/change-orders/product-change-questionnaire-protocol.md) |
| Machine-readable | `documentation-methodology-policy.json` |
| Machine-readable | `babok-research-source-index.json` |
| Machine-readable | `traceability-model.json` |
| Machine-readable | `methodology-artifact-map.json` |
| Machine-readable | `babok-coverage-map.json` |
| Plan | [План доведения BABOK-методологии до минимально полного контура](babok-methodology-mva-implementation-plan.md) |

Шаблоны находятся в `docs/process/methodology/templates/`:

- [BRD template](templates/brd-template.md)
- [SRS template](templates/srs-template.md)
- [Stakeholder map template](templates/stakeholder-map-template.md)
- [Elicitation log template](templates/elicitation-log-template.md)
- [Change request / impact analysis template](templates/change-request-impact-analysis-template.md)
- [Story readiness report template](templates/story-readiness-report-template.md)
- [Solution evaluation report template](templates/solution-evaluation-report-template.md)

## Как Работать Агенту

Перед изменением проектной документации агент читает:

1. `AGENTS.md`.
2. Этот README.
3. `documentation-methodology-policy.json`.
4. Релевантный product/process/architecture source artifact.
5. Нужный template из `templates/`.

Выбор шаблона:

| Изменение | Шаблон |
|---|---|
| Новая проблема, цель, ценность или бизнес-требование | `brd-template.md` |
| Поведение системы, данные, интеграции, НФТ или ошибки | `srs-template.md` |
| Новый источник требований или владелец решения | `stakeholder-map-template.md` |
| Интервью, уточнение, evidence request или decision capture | `elicitation-log-template.md` |
| Изменение scope, требования, priority, contract или release impact | `change-request-impact-analysis-template.md` |
| Проверка story перед refinement/planning | `story-readiness-report-template.md` |
| Оценка результата после release/pilot | `solution-evaluation-report-template.md` |

Порядок применения:

1. Определить источник проектного содержания.
2. Применить gates из policy по типу artifact.
3. Если данных не хватает, создать open question или evidence request.
4. Если меняется accepted scope, оформить impact analysis.
5. При конфликте источников применить precedence policy и не выводить бизнесовый смысл из generated/machine artifacts.
6. Перед handoff запустить `npm run validate:documentation-methodology`; при изменении navigation также запустить docs navigation gate.

## Минимальные Gates

Business analysis:

- `problem_defined`
- `business_value_measurable`
- `stakeholders_identified`
- `scope_defined`
- `success_metrics_defined`
- `business_rules_recorded`
- `business_requirements_traceable`

System analysis:

- `behavior_defined`
- `data_defined`
- `integrations_defined`
- `nfr_defined`
- `errors_defined`
- `acceptance_criteria_defined`
- `verification_method_defined`

AI-agent solution:

- `agent_goal_defined`
- `tools_defined`
- `permissions_defined`
- `human_approval_defined`
- `traces_defined`
- `evals_defined`
- `guardrails_defined`
- `explainability_defined`

## System Analysis Artifact Pack

SRS должен ссылаться на:

- `system-context`
- `use-case/spec`
- `domain-data-model`
- `interface-contract`
- `nfr-profile`
- `error-catalog`
- `acceptance-verification-map`

Если элемент не применяется, нужен `not_applicable` с `rationale`. System requirements приводят к проверке ADR impact; API/schema/data requirements приводят к проверке contract artifacts; NFR приводят к test strategy или verification evidence; error behavior связывается с acceptance/verification.

## Режим Остановленного Интервью

BA/SA интервью остается `paused`. Новое требование заказчика сначала проходит methodology/change intake и impact analysis. Возобновление интервью возможно только после регистрации методического follow-up и impact analysis; агент задает один вопрос за шаг и не меняет accepted backlog без решения Product Owner.

PO-опросник по Product Change Order ведётся через сохраняемые state/log артефакты. Для `CO-2026-001` активное состояние находится в `docs/product/change-orders/co-2026-001-acceptance-questionnaire-state.json`, журнал - в `docs/product/change-orders/co-2026-001-acceptance-questionnaire-log.md`. При продолжении агент обязан вернуться к вопросу, указанному в state.

## Проверки

Минимальная проверка методики:

```sh
npm run validate:documentation-methodology
```

Если добавлены или изменены документы в `docs/`, дополнительно запускаются:

```sh
npm run generate:docs-navigation -- --check
npm run validate:doc-links
npm run validate:docs-navigation
npm run validate:doc-stale-status
```
