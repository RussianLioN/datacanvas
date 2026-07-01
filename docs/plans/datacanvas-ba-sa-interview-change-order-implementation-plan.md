# План имплементации БА/СА interview-driven artifact factory и управляемого изменения приоритетов DataCanvas

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / [Планы](README.md) / БА/СА interview-driven artifact factory

Статус: draft
Дата: 2026-07-02
Владелец: Process Owner
Проверка: `npm test`, `git diff --check`, `git diff --exit-code`

Источник: консилиум по БА/СА interview-driven артефактам, AI spec-driven разработке и циклу управляемого изменения заказа DataCanvas.

## Методологическая Сверка

План сверялся с источниками:

- IIBA BABOK: https://www.iiba.org/career-resources/a-business-analysis-professionals-foundation-for-success/babok/
- IREB CPRE Foundation: https://cpre.ireb.org/en/concept/foundationlevel
- ISO/IEC/IEEE 29148:2018: https://www.iso.org/standard/72089.html
- Scrum Guide: https://scrumguides.org/scrum-guide.html
- A2A specification: https://github.com/a2aproject/A2A/blob/main/docs/specification.md
- MCP documentation: https://modelcontextprotocol.io/docs/getting-started/intro
- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- GitHub Spec Kit: https://github.com/github/spec-kit

Эти источники используются как контрольные ориентиры, а не как обещание сертификации проекта.

## Оценка Исходного Плана

Последний план хорошо усиливал управляемое изменение приоритетов через `CO-*`, impact map, Sprint Goal test и validation evidence, но недостаточно закрывал полный цикл бизнес-анализа и системного анализа через интервью.

| Критерий | Было | Цель после реализации |
|---|---:|---:|
| Полный БА-цикл интервью | 4.8/10 | 9/10 |
| Системный анализ и SRS | 4.6/10 | 8.8/10 |
| Машиночитаемые артефакты | 5/10 | 9/10 |
| Связь интервью с acceptance, UAT и evals | 6/10 | 9/10 |
| AI spec-driven слой `spec -> tasks -> prompts` | 4.5/10 | 8.7/10 |
| Change Order и смена приоритетов | 7/10 | 9/10 |
| Security/privacy для данных интервью | 6.7/10 | 9/10 |
| Delivery, observability и rollback | 6.8/10 | 8.8/10 |

## Что Изменено В Плане

- Добавлена фабрика БА/СА интервью вместо единичного `CO-*` контура.
- Разделены сырые ответы, безопасные резюме, утверждения, evidence, требования и спецификации.
- Добавлены `SRS`, interface control, lifecycle state model, error taxonomy и расширенные NFR как обязательные системно-аналитические выходы.
- Добавлены machine-readable схемы для интервью, ответов, БА/СА спецификаций, coverage, generated package и change impact.
- Добавлено правило продвижения: `confirmed + evidence` может стать требованием; `unconfirmed` идет в гипотезу или evidence request; `assumption` не становится acceptance gate.
- Добавлен AI spec-driven слой: `FeatureSpec`, `TaskSpec`, `AgentPromptSpec`.
- Усилен security-контур: raw interview answers не попадают напрямую в артефакты, нужен `safe_summary`, data class, redaction и allowed downstream use.
- Добавлена observability фабрики: `run_id`, process events, run ledger, generator/validator evidence и rollback signals.
- Уточнен delivery-контур: PR должен ссылаться на `CO-*`, session ID, generated outputs, post-merge freshness и rollback validation.

## 1. Summary

- Ввести повторяемый цикл `интервью -> безопасное резюме -> утверждения -> БА артефакты -> СА артефакты -> спецификации -> задачи -> проверки -> Change Order`.
- Не заменять существующий BMC interview flow; обобщить его паттерн для Vision, БТ, business rules, SRS, интерфейсов, NFR, acceptance, evals и change impact.
- Сохранить бизнесовый источник истины отдельно от технического: Vision/BMC/stories/requirements не выводят технические контракты без ADR/schema/contract artifact.
- Любое изменение приоритетов проводить через `CO-*`, impact map, Product Owner decision, Scrum Goal test и validation evidence.

## 2. Новые Артефакты И Схемы

- Создать `docs/product/interviews/ba-sa/README.md`, `interview-protocol.md`, `question-bank.json`, `active-interview-runtime-state.json`, `interview-results.json`, `evidence-requests.md`, `decision-log.md`, `open-questions.md`.
- Добавить схемы: `interview-session.schema.json`, `interview-answer-set.schema.json`, `ba-spec.schema.json`, `sa-spec.schema.json`, `generated-spec-package-manifest.schema.json`, `interview-derived-coverage.schema.json`, `change-impact-assessment.schema.json`.
- Добавить БА документы: `stakeholder-register.md/json`, `business-needs.md/json`, `business-rules.md/json`, `business-requirements-delta.md`, `acceptance-delta.md`, `open-decisions-ledger.md`.
- Добавить СА документы: `srs-v0.1.md/json`, `datacanvas-interface-control.md`, `data-contract-map.md`, `datacanvas-lifecycle-state-model.md/json`, `error-taxonomy.md/json`, расширенный `non-functional-requirements.md`.
- Добавить spec-driven документы: `feature-spec.schema.json`, `task-spec.schema.json`, `agent-prompt-spec.schema.json`, `docs/product/specs/*`, `interview-to-spec-trace.json`.

## 3. Интервью БА/СА

- Интервью проводить по одному смысловому вопросу за шаг, с режимами `light`, `standard`, `deep`.
- Вопросы покрывают: stakeholders, текущий процесс, целевой результат, ценность, ограничения, политики, исключения, каналы, данные, роли решений, acceptance examples, риски, метрики, откат.
- Для каждого ответа сохранять `answer_id`, `question_id`, `raw_answer_ref`, `safe_summary`, `data_class`, `sensitive_flags`, `redaction_status`, `confirmation_status`, `evidence_refs`, `allowed_downstream_use`.
- Raw answers считать конфиденциальными и недоверенными; generated БА/СА артефакты могут использовать только `safe_summary` или claim object с trust status.
- Если пользовательский ответ противоречит текущим Vision/BMC/BT/stories, фиксировать open decision, а не перезаписывать источник истины.

## 4. Генерация БА Артефактов

- Из интервью формировать цепочку: `stakeholder -> need -> business requirement -> business rule -> acceptance scenario -> decision -> backlog impact`.
- Для каждого `BT-*` требовать источник, stakeholder, value, acceptance, evidence expectation, risk/security impact и trace link.
- Добавить `BRULE-*` для бизнес-правил: область применения, исключения, владелец, источник, проверка, связь с acceptance.
- Добавить stakeholder register с ролью, интересом, болью, полномочиями, правом решения, RACI и interview status.
- Неподтвержденные утверждения не повышать до обязательного требования: `unconfirmed` идет в hypothesis/evidence request, `assumption` идет в research backlog, `contradicted` идет в stop condition или negative eval.

## 5. Генерация СА Артефактов

- Создать `SRS` как единый системный артефакт: purpose, scope, actors, system context, assumptions, dependencies, functional requirements, external interfaces, data requirements, state model, error taxonomy, NFR, verification method.
- Создать interface control для Лисы, Оркестратора, A2A/MCP, source agents, renderer, delivery channel, review UI и evidence storage.
- Расширить data contract map: owner, schema version, compatibility, migration, validation command, fixtures.
- Ввести end-to-end lifecycle: intake, validation, classification, clarification, normalization, description, approval, render/export, delivery, acceptance, repair.
- Error taxonomy связать с trace, acceptance, retry, rollback, user-facing message и redaction rule.
- NFR расширить fit criteria: usability, reliability, auditability, maintainability, privacy, compatibility, retention, latency, cost, observability.

## 6. Product Change Order И Смена Приоритетов

- Создать `docs/product/change-orders/` с `CO-*` шаблоном, ledger и `product-change-order.schema.json`.
- `CO-*` содержит source, reason, priority_before, priority_after, affected users, affected artifacts, affected requirements, affected ports/adapters, ADR impact, sprint impact, rollback, validation plan.
- Для A2A-first создать пример `CO-*`: A2A-запуск презентации становится первым приоритетом, запуск из Лисы остается вторым.
- A2A-first не считать простой перестановкой backlog: он меняет канал запуска, trust boundary, input envelope, status/callback, error taxonomy, trace и evals.
- `PROC-*` использовать только если меняется процесс; продуктовые и системные изменения вести через `CO-*`.

## 7. AI Spec-Driven Контур

- Из подтвержденных БА/СА артефактов генерировать `FeatureSpec`, затем `TaskSpec`, затем безопасный `AgentPromptSpec`.
- `FeatureSpec` содержит source claim IDs, BT/NFR/story IDs, human intent, non-goals, acceptance, eval cases, validation commands, forbidden behaviors.
- `TaskSpec` содержит owned paths, allowed edit scope, dependencies, done_when, rollback/forward-fix, validation commands.
- `AgentPromptSpec` не содержит raw transcript; только безопасный контекст, цель, ограничения, проверки и запреты.
- Валидатор падает, если `unconfirmed/assumption` claim становится `must`, task не имеет eval, prompt содержит raw transcript или P3-P5 scope попал в P1-P2.

## 8. Acceptance, UAT, Evals И Fixtures

- Добавить `interview-derived-coverage.json`: answer/claim -> requirement -> acceptance -> UAT -> eval -> fixture -> gate.
- Добавить UAT сценарии: insufficient input, untrusted A2A/MCP/Lisa input, approval before export, delivery channel mismatch, edit before generation.
- Добавить eval cases для launch, insufficient input, approval gate, conflicting sources, sanitized delivery metadata, unconfirmed channel, regeneration trace.
- Добавить fixtures: BA/SA answers minimal, unconfirmed channel, insufficient input, conflicting sources, interview-derived coverage golden.
- Любой новый `BT-*` не готов, если не связан с acceptance, UAT/eval или явным deferred rationale.

## 9. Security И Trust Boundaries

- Создать `integration-boundary-matrix.md/json` для Лисы, Оркестратора, A2A, MCP, email/chat delivery.
- Для каждого boundary указать actor identity, authn/authz, allowed data classes, tool scopes, retention, audit, replay/rate limits, stop rules.
- A2A/MCP payloads, tool descriptions и upstream agent output считать недоверенными данными.
- До accepted ADR/PCR не включать live network, MCP, provider или расширенный tool allowlist.
- Channel-sensitive требования вроде `BT-012` сделать channel-neutral до принятого решения по email/chat/callback.

## 10. Scrum И Process Integration

- Добавить `PROC-*`: governed BA/SA discovery-to-refinement loop.
- Обновить DoR: item готов только при interview evidence или явном `интервью не требуется`, claim status, open-question owner/date, BA value check, SA contract/security/NFR check.
- Обновить DoD: закрыты или отложены evidence requests, синхронизированы requirements/backlog/acceptance/traceability, Review фиксирует BA/SA evidence delta.
- Refinement принимает interview results, open questions, evidence requests, changed assumptions; выдает DoR-ready candidates, spikes, rejected/deferred items.
- Mid-sprint priority change проводить через Sprint Goal test, Product Owner decision и scope trade-off; если Sprint Goal устарел, Product Owner отменяет Sprint и запускает replanning.

## 11. Observability, Delivery И Rollback

- Расширить process events: `EVT-INTERVIEW-*`, `EVT-EVIDENCE-*`, `EVT-REFINEMENT-DECIDED`, `EVT-DOR-READY`, `EVT-GENERATOR-RUN`, `EVT-VALIDATION-RUN`, `EVT-ROLLBACK-SIGNAL`.
- Добавить `process-run-ledger.json` с `run_id`, command, input paths, output paths, duration, exit code, redacted log hash.
- Generated package manifest должен фиксировать source hashes, generator version, schema refs, validation results, data class, visibility, redaction status.
- PR template расширить полями: `CO-*`, interview session ID, affected BA/SA artifacts, generated outputs, post-merge freshness action, rollback validation command.
- Post-merge freshness сделать отдельным delivery step: refresh pointer, regenerate navigation/hash, run freshness gates, открыть малый PR при необходимости.

## 12. Validators И Gates

- Добавить npm scripts: `validate:ba-sa-interview`, `validate:ba-spec`, `validate:sa-spec`, `validate:business-rules`, `validate:interview-derived-coverage`, `validate:product-change-orders`, `validate:change-impact`, `validate:spec-task-prompt-readiness`, `validate:interface-contracts`, `validate:state-model`, `validate:error-taxonomy`.
- Расширить `validate:schemas`, `validate:traceability-graph`, `validate:artifact-registry`, `validate:artifact-hashes`, `validate:data-leakage`, `validate:process-events`.
- Узкий gate перед PR: schemas, BA/SA interview, product change orders, interview-derived coverage, traceability, eval sync, UAT, secrets, data leakage, docs navigation.
- Финальный gate: `npm test`, `git diff --check`, generated diff check, artifact registry/hash validation.

## 13. Acceptance Criteria

- БА/СА интервью воспроизводимо, продолжабельно и не теряет trust status ответов.
- Сырые ответы не попадают в публичные или generated БА/СА артефакты без redaction и allowed downstream use.
- Каждый accepted `CO-*` имеет impact map, Product Owner decision, Sprint Goal impact, rollback и validation evidence.
- Каждый новый или измененный `BT/NFR/BRULE` имеет source, acceptance, traceability и quality coverage.
- `SRS`, interface control, state model и error taxonomy связаны с требованиями, contracts, evals и fixtures.
- `FeatureSpec`, `TaskSpec`, `AgentPromptSpec` можно безопасно передать агенту без чтения raw интервью.
- Navigation, artifact registry, hash manifest и release evidence синхронизированы генераторами.

## 14. Handoff Prompt

Использовать для новой implementation session:

```text
/goal Реализуй план из docs/plans/datacanvas-ba-sa-interview-change-order-implementation-plan.md.

Сначала проверь pwd, branch, git status, наличие plan artifact и актуальность origin/main. Не пересказывай план. Работай малыми блоками по плану, не расширяй scope. Human-readable артефакты пиши на русском. Не используй raw interview answers как источник требований без safe_summary, trust status, data class и allowed downstream use. Generated artifacts обновляй только штатными генераторами. После каждого блока запускай узкие релевантные gates, в конце полный локальный gate. Не расширяй network, MCP, provider, tool allowlist или security boundaries без accepted ADR/PCR и отдельного approval. Зафиксируй validation evidence, сделай commit/push и подготовь PR/handoff.
```
