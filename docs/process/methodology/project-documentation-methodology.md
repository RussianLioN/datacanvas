# Методика Ведения Проектной Документации DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Процесс](../README.md) / [Методика проектной документации](README.md) / Методика ведения проектной документации

Статус: active
Владелец: Process Owner
Проверка: `npm run validate:documentation-methodology`

## Принцип

DataCanvas ведет документацию как живой контур, а не как набор разрозненных файлов. Любое существенное изменение проходит путь от проблемы и источника ценности до проверяемого требования, backlog item, acceptance, теста, release evidence и эксплуатационного сигнала.

Backlog не подменяет анализ. Backlog отражает принятое решение и порядок реализации, но сам выводится из Vision, BMC, stories, требований, гипотез, системного анализа, архитектуры, НФТ и traceability.

## Lifecycle

| Стадия | Назначение | Выход | Gate |
|---|---|---|---|
| `idea` | Зафиксировать проблему, возможность или обязательство | Idea brief или change signal | Есть владелец, стейкхолдер и гипотеза ценности |
| `discovery` | Проверить наличие проблемы и смысл инвестиций | Evidence, интервью, гипотезы | Есть подтверждение, open question или решение остановить |
| `business_analysis` | Описать ценность, процесс, правила, границы и требования | Business need, `BT-*`, business rules | Требования атомарны, проверяемы и имеют источник |
| `system_analysis` | Превратить бизнесовый смысл в поведение системы | SRS, interface control, data/error/state models | Есть сценарии, данные, интеграции, ошибки, НФТ и verification |
| `architecture` | Зафиксировать структуру решения и границы ответственности | ADR, C4, sequence, contract views | Ключевые риски и trust boundaries рассмотрены |
| `backlog` | Упорядочить реализацию принятого scope | Product/technical/eval/process backlog | Каждый item связан с требованием, гипотезой, риском или процессным решением |
| `delivery` | Реализовать и проверить инкремент | Code, docs, generated outputs, evidence | DoD выполнен, нет blocking stop rules |
| `testing` | Доказать соответствие требованиям и НФТ | Test/eval/UAT evidence | Acceptance, evals и security checks покрывают изменение |
| `release` | Передать инкремент с rollback и evidence | Release pack, handoff, notes | Есть rollback, validation evidence и ответственные |
| `operations` | Оценить фактическую ценность и устойчивость | Telemetry, metrics, incident/RCA | Есть сигнал для keep/improve/rollback/retire |
| `change_management` | Управляемо изменить требования, scope или процесс | `CO-*`, `PROC-*`, cascade run | Есть impact analysis и закрытые решения пользователя |

## Artifact Policy

| Артефакт | Когда обязателен | Источник | Необходимая связь |
|---|---|---|---|
| Vision / BMC / stories | Новый или измененный продуктовый scope | Product Owner | Product goal, segment, value, hypotheses |
| Business requirements | Любое новое бизнесовое обязательство | Vision, BMC, stories, confirmed interview claim | Stakeholder, value, acceptance, traceability |
| SRS / system analysis | Требование меняет поведение системы, данные, интеграции или НФТ | Confirmed `BT-*`, `NFR-*`, accepted `CO-*` | Interface, data, state, error, verification |
| Product backlog | Scope готов к упорядочиванию | Requirements, hypotheses, roadmap | `PBI-*` -> requirement/hypothesis |
| Technical backlog | Нужно инженерное изменение без прямой бизнесовой формулировки | ADR, contract, NFR, process gate | `TECH-*` -> requirement, NFR или ADR |
| Eval backlog | Поведение AI, renderer, security или regression требует проверки | Requirement, risk, quality gate | `EVAL-*` -> eval case, fixture, risk |
| Acceptance criteria | Любое требование или story перед delivery | Requirement/story | Проверяемый сценарий и testability |
| Test/eval case | Любой реализуемый item с acceptance или NFR | Acceptance, risk, NFR | Requirement -> test/eval -> evidence |
| Release evidence | Любая передача результата | Done increment | Commit/PR, gates, rollback, known limitations |
| Telemetry / metrics | Production или pilot behavior | Release/UAT/operations | KPI, SLO/SLI, DORA или product metric |
| AI-agent policy | Любая агентная автономия, tool use или model behavior | Security, ADR, prompt/spec docs | Tool permissions, human approval, guardrails, traces, evals |

## Traceability Policy

Обязательная методическая цепочка:

```text
business goal
-> stakeholder need
-> business requirement
-> system requirement
-> interface/data/nfr/error requirement
-> backlog item
-> acceptance test
-> evidence
-> release record
-> telemetry or feedback
-> improvement item
```

`traceability-model.json` описывает эту цепочку как методическую модель. Проектные traceability artifacts остаются источником фактических связей и не заменяются методическим файлом.

Если связь отсутствует, агент не должен делать вид, что item готов. Нужно создать open question, evidence request, hypothesis или deferred rationale.

## Quality Gates

### Бизнес-Анализ

Обязательные gate id:

- `problem_defined`
- `business_value_measurable`
- `stakeholders_identified`
- `scope_defined`
- `success_metrics_defined`
- `business_rules_recorded`
- `business_requirements_traceable`

- Реальная проблема или возможность описана отдельно от решения.
- Пользователь, stakeholder и decision owner известны.
- Ценность измерима хотя бы целевой метрикой или проверяемым качественным evidence.
- Scope и out of scope явно разделены.
- Бизнес-правила, ограничения и исключения зафиксированы.
- Каждое бизнес-требование связано с источником и downstream backlog/acceptance.

### Системный Анализ

Обязательные gate id:

- `behavior_defined`
- `data_defined`
- `integrations_defined`
- `nfr_defined`
- `errors_defined`
- `acceptance_criteria_defined`
- `verification_method_defined`

- Описаны основной сценарий, альтернативы, ошибки и stop rules.
- Данные имеют владельца, класс, lifecycle и контракт проверки.
- Интеграции имеют boundary, actor identity, authn/authz, timeout/retry/failure mode.
- НФТ покрывают security, privacy, observability, reliability, performance, supportability и data quality.
- Для каждого системного требования указан метод verification: review, test, analysis, inspection, monitoring или evaluation.

SRS ссылается на `system-context`, `use-case/spec`, `domain-data-model`, `interface-contract`, `nfr-profile`, `error-catalog` и `acceptance-verification-map` либо явно отмечает `not_applicable` с rationale.

### AI-Агентные Решения

Обязательные gate id:

- `agent_goal_defined`
- `tools_defined`
- `permissions_defined`
- `human_approval_defined`
- `traces_defined`
- `evals_defined`
- `guardrails_defined`
- `explainability_defined`

- Цель агента выражена как бизнесовая задача, а не как общая способность отвечать.
- Tool policy и permission matrix ограничивают действия агента.
- Human approval gates обязательны для необратимых действий, публикации, отправки, удаления, изменения приоритетов и закрытия вопросов.
- Prompt, memory, retrieval, trace, eval, guardrails, failure modes и explainability описаны до расширения autonomy.
- Нельзя расширять network, MCP, provider или tool allowlist без принятого ADR/PCR и security review.

## Режимы Работы Агента

| Режим | Вход | Выход |
|---|---|---|
| Новый пакет документации | Идея, инициатива, проблема | Idea/discovery brief, BRD/SRS, backlog mapping, acceptance, tests, risks, traceability |
| Анализ story | `PBI-*`, feature, Jira issue или сырая story | Диагноз ready/needs analysis/split/reject, gaps, questions, risks |
| Обновление документации | `CO-*`, `PROC-*`, инцидент, новая интеграция, изменение scope | Impact analysis, affected artifacts, decisions, traceability updates |
| Проверка целостности | Текущий `docs/` или выбранный контур | Несвязанные требования, orphan stories, gaps in tests/NFR/telemetry, contradictions |
| Подготовка к delivery | Candidate item перед sprint planning | DoR report, acceptance/test plan, risks, open blockers |

## Права Агента

| Действие | Агент может сам | Нужно подтверждение человека |
|---|---:|---:|
| Создать черновик BRD/SRS/traceability report | Да | Нет |
| Создать evidence request, open question или quality report | Да | Нет |
| Обновить draft documentation artifact | Да, если есть источник и traceability | Нет |
| Изменить accepted requirement, BMC, ADR или process rule | Нет | Да |
| Изменить приоритет product backlog | Нет | Да |
| Удалить требование или закрыть open question | Нет | Да |
| Расширить tool/network/provider boundary | Нет | Да, через ADR/PCR |

## Возобновление Остановленного Интервью

Перед продолжением интервью о новом требовании заказчика и переоприоритезации backlog агент должен:

1. Проверить `documentation-methodology-policy.json`.
2. Сформировать вопрос только для одного решения за шаг.
3. Разделять факт, подтвержденный claim, предположение и open question.
4. Не менять канонический backlog до accepted Product Change Order и закрытых blocking decisions.
5. После интервью синхронизировать requirements, backlog, roadmap, acceptance, traceability и evidence либо зафиксировать confirmed `no-change rationale`.
