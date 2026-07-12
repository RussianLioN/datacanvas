# Методика проектной документации

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Процесс](../README.md) / Методика проектной документации

Статус: active
Владелец: Process Owner
Проверка: `npm run validate:documentation-methodology`

## Назначение

Этот раздел фиксирует методическую основу для ведения проектной документации DataCanvas. Методика используется как проверяемый контур правил, шаблонов, gates и порядка работы. Она не заменяет Vision, BMC, requirements, backlog, ADR, schemas, release evidence или другие проектные источники содержания.

## Источники И Precedence — источники и порядок приоритета

| Уровень | Что является источником | Для чего применяется |
|---|---|---|
| 1 | [Нормализованный источник BABOK-исследования](babok-research-source.md) и `babok-research-source-index.json` | Методические правила и нормализованные фрагменты исследования |
| 2 | `documentation-methodology-policy.json`, шаблоны и `traceability-model.json` | Правила применения методики, обязательные разделы, проверки готовности и связи |
| 3 | Продуктовые, процессные и архитектурные артефакты | Проектное содержание, требования, бэклог, архитектурные решения, контракты и evidence |
| 4 | Сгенерированные navigation/hash/evidence-манифесты | Проверочные и навигационные производные |

Правило конфликтов:

- проектное содержание берется из продуктовых, процессных и архитектурных артефактов;
- методическое правило берется из policy и source index;
- generated и mixed artifacts не считаются первичным источником;
- бизнесовые требования нельзя выводить напрямую из BABOK-исследования, ADR, schemas или scripts;
- технические контракты нельзя выводить из BMC, stories или Vision без обновления ADR, schema или contract artifact.

`traceability-model.json` описывает методическую модель трассировки. Он не заменяет существующие project traceability artifacts и не является источником проектных требований.

## Где что искать

### Методика

| Артефакт | Когда открывать |
|---|---|
| [Методика ведения проектной документации](project-documentation-methodology.md) | Нужны правила жизненного цикла, качества, трассировки и работы агента. |
| [Протокол PO-опросника Product Change Order](../../product/change-orders/product-change-questionnaire-protocol.md) | Нужно вести согласование изменения с Product Owner. |
| [План доведения BABOK-методологии до минимально полного контура](babok-methodology-mva-implementation-plan.md) | Нужно понять историю внедрения методического контура. |

### Исследования

| Артефакт | Когда открывать |
|---|---|
| [Нормализованный источник BABOK-исследования](babok-research-source.md) | Нужна методическая база бизнес-анализа и системного анализа. |
| [Исследование процесса разработки ПО с поддержкой ИИ в крупной финтех-корпорации](ai-enabled-software-development-process-research.md) | Нужно сравнить классический процесс разработки и AI-enabled процесс полного цикла. |

### Машиночитаемые правила

| Артефакт | Когда открывать |
|---|---|
| `documentation-methodology-policy.json` | Нужны проверяемые правила применения методики. |
| `babok-research-source-index.json` | Нужен индекс нормализованного BABOK-источника. |
| `traceability-model.json` | Нужна модель трассировки требований и решений. |
| `methodology-artifact-map.json` | Нужна карта методических артефактов. |
| `babok-coverage-map.json` | Нужно проверить покрытие методики BABOK-источником. |

### Шаблоны

Шаблоны находятся в `docs/process/methodology/templates/`:

- [Шаблон BRD — документа бизнес-требований](templates/brd-template.md)
- [Шаблон SRS — спецификации системных требований](templates/srs-template.md)
- [Шаблон карты стейкхолдеров](templates/stakeholder-map-template.md)
- [Шаблон журнала извлечения требований](templates/elicitation-log-template.md)
- [Шаблон запроса на изменение и анализа влияния](templates/change-request-impact-analysis-template.md)
- [Шаблон отчета о готовности истории](templates/story-readiness-report-template.md)
- [Шаблон отчета об оценке решения](templates/solution-evaluation-report-template.md)

## Как Работать Агенту — инструкция для агента

Перед изменением проектной документации агент читает:

1. `AGENTS.md`.
2. Этот README.
3. `documentation-methodology-policy.json`.
4. Релевантный продуктовый, процессный или архитектурный исходный артефакт.
5. Нужный шаблон из `templates/`.

Выбор шаблона:

| Изменение | Шаблон |
|---|---|
| Новая проблема, цель, ценность или бизнес-требование | `brd-template.md` |
| Поведение системы, данные, интеграции, НФТ или ошибки | `srs-template.md` |
| Новый источник требований или владелец решения | `stakeholder-map-template.md` |
| Интервью, уточнение, запрос evidence или фиксация решения | `elicitation-log-template.md` |
| Изменение scope, требования, приоритета, контракта или влияния на release | `change-request-impact-analysis-template.md` |
| Проверка истории перед refinement/planning | `story-readiness-report-template.md` |
| Оценка результата после release/pilot | `solution-evaluation-report-template.md` |

Порядок применения:

1. Определить источник проектного содержания.
2. Применить проверки готовности из policy по типу артефакта.
3. Если данных не хватает, создать открытый вопрос или запрос evidence.
4. Если меняется accepted scope, оформить анализ влияния.
5. При конфликте источников применить порядок приоритета и не выводить бизнесовый смысл из generated/machine artifacts.
6. Перед handoff запустить `npm run validate:documentation-methodology`; при изменении navigation также запустить docs navigation gate.

## Минимальные проверки готовности

Бизнес-анализ:

- `problem_defined`
- `business_value_measurable`
- `stakeholders_identified`
- `scope_defined`
- `success_metrics_defined`
- `business_rules_recorded`
- `business_requirements_traceable`

Системный анализ:

- `behavior_defined`
- `data_defined`
- `integrations_defined`
- `nfr_defined`
- `errors_defined`
- `acceptance_criteria_defined`
- `verification_method_defined`

Решение на базе AI-агента:

- `agent_goal_defined`
- `tools_defined`
- `permissions_defined`
- `human_approval_defined`
- `traces_defined`
- `evals_defined`
- `guardrails_defined`
- `explainability_defined`

## Пакет артефактов системного анализа

SRS должен ссылаться на:

- `system-context`
- `use-case/spec`
- `domain-data-model`
- `interface-contract`
- `nfr-profile`
- `error-catalog`
- `acceptance-verification-map`

Если элемент не применяется, нужен `not_applicable` с `rationale`. Системные требования приводят к проверке влияния на ADR; требования к API, схемам и данным приводят к проверке контрактных артефактов; НФТ приводят к стратегии тестирования или verification evidence; поведение ошибок связывается с acceptance/verification.

## Режим Остановленного Интервью — правила продолжения интервью

BA/SA интервью остается `paused`. Новое требование заказчика сначала проходит методический intake изменения и анализ влияния. Возобновление интервью возможно только после регистрации методического follow-up и анализа влияния; агент задает один вопрос за шаг и не меняет accepted backlog без решения Product Owner.

PO-опросник по Product Change Order ведётся через сохраняемые state/log артефакты. Для `CO-2026-001` — change order по приоритету запуска другим агентом — активное состояние находится в `docs/product/change-orders/co-2026-001-acceptance-questionnaire-state.json`, журнал - в `docs/product/change-orders/co-2026-001-acceptance-questionnaire-log.md`. При продолжении агент обязан вернуться к вопросу, указанному в state.

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
