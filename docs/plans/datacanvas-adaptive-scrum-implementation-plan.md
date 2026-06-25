# План Имплементации: Адаптивный Scrum-Процесс Для DataCanvas

Дата: 2026-06-22
Статус: рабочий план для имплементации
Назначение: артефакт для запуска реализации процесса разработки DataCanvas и последующей разработки продукта по этому процессу.

## 1. Резюме

Создать не только продукт DataCanvas, но и управляемую систему процесса разработки ИТ-решений на базе адаптируемого Scrum. DataCanvas используется как первый пилотный проект, на котором процесс проектируется, проверяется, версионируется и улучшается.

Цель продукта DataCanvas: AI-агент, который из структурированного пакета данных другого агента генерирует короткую, проверяемую, визуально пригодную презентацию с трассировкой к исходным данным.

Цель процесса DataCanvas: Scrum-based процесс, который позволяет команде менять методологию реализации проекта через версии, process backlog, process change requests, evidence gates и ретроспективные эксперименты без потери качества, безопасности и воспроизводимости.

Базовый ритм: недельные спринты. Длина спринта может быть изменена только через управляемое изменение процесса.

## 2. Scrum Operating Model

Роли:
- Product Owner: отвечает за Product Goal, Product Backlog, приоритеты, приемку ценности.
- Scrum Master: отвечает за прозрачность Scrum, WIP, устранение блокеров, качество ретроспективы.
- Process Owner: отвечает за версию процесса, Process Backlog, Process Change Requests, метрики процесса.
- Development Team: реализует инкременты продукта и процесса.
- QA/Evals Lead: владеет eval backlog, regression packs, quality dashboard.
- Security/Privacy Lead: владеет trust boundaries, data classification, threat model delta, stop rules.
- Delivery/GitOps Lead: владеет repo workflow, PR gates, CI, release evidence.
- SRE/LLM Ops Lead: владеет observability, runbooks, latency/cost/failure metrics.
- UX/Prototype Lead: владеет prototype roadmap, visual acceptance, human-in-the-loop flow.
- Stakeholders: принимают Sprint Review, дают продуктовую и процессную обратную связь.

Недельный цикл:
- Понедельник: Sprint Planning, 60-90 минут.
- Каждый рабочий день: Daily Scrum или async check, до 15 минут.
- Среда: Backlog Refinement, 45-60 минут.
- Пятница: Sprint Review, 60-90 минут.
- Пятница после Review: Sprint Retrospective, 45-60 минут.

В каждом спринте обязательны:
- один Sprint Goal;
- Sprint Backlog;
- проверяемый Increment;
- Sprint Evidence Pack;
- решение по продукту;
- решение по процессу.

Правило изменения scope:
- внутри спринта scope можно менять только если Sprint Goal не разрушается;
- изменение согласует Product Owner;
- изменение фиксируется как scope trade-off в sprint evidence;
- изменение процесса внутри спринта фиксируется как candidate, но вступает в силу после Review/Retro, кроме stop-rule случаев.

Правило изменения длины спринта:
- default: 1 неделя;
- переход на 2 недели допустим, если 2 спринта подряд есть высокий spillover, перегруз review/retro, незавершенная приемка инкремента или системная нехватка времени на QA/evals;
- изменение оформляется через Process Change Request.

## 3. Process Management System

Процесс разрабатывается как отдельный продукт.

Обязательные артефакты процесса:
- `process-passport.md`: цель, область применения, роли, события, артефакты, gates, метрики, правила изменений.
- `process-registry.md`: текущая версия процесса, дата вступления, владелец, активные правила, исключения, эксперименты.
- `process-backlog.md`: backlog изменений процесса.
- `process-changelog.md`: история версий процесса.
- `process-change-request-template.md`: шаблон изменения процесса.
- `process-experiment-template.md`: шаблон эксперимента процесса.
- `process-metrics-dashboard.md`: метрики здоровья процесса.

Версионирование процесса:
- `major`: меняются роли, gates, обязательные артефакты или Scrum cadence;
- `minor`: добавляются события, шаблоны, метрики, проверки;
- `patch`: уточняются формулировки без изменения поведения процесса.

Жизненный цикл Process Change Request:
1. Источник: ретроспектива, дефект, RCA, метрика, stakeholder feedback, security stop-rule.
2. Создать `PROC-*` item.
3. Заполнить проблему, причину, ожидаемый эффект, затронутые роли, артефакты, риски, метрики успеха.
4. Оценить влияние на текущий спринт, roadmap, gates, CI, документацию.
5. Решить: reject, defer, experiment, accept.
6. Если experiment: ограничить сроком 1-2 спринта и одной метрикой успеха.
7. На Retrospective принять решение: оставить, изменить, откатить.
8. Обновить версию процесса, changelog, registry и migration notes.
9. Связать изменение с evidence текущего спринта.

Ограничение: не более одного крупного процессного эксперимента за спринт, если нет stop-rule.

## 4. Структура Репозитория И Артефактов

Создать целевую структуру:

```text
docs/
  process/
    current/
    versions/
    change-requests/
    experiments/
    registry.md
    changelog.md
    process-passport.md
  product/
    vision/
    bmc/
    hypotheses/
    requirements/
    backlog/
    roadmap/
  architecture/
    adr/
    schemas/
    security/
    observability/
  sprints/
    YYYY-WW-sprint-name/
  knowledge/
    glossary.md
    lessons.md
    rca/
    evidence-index.md
schemas/
tests/
  fixtures/
  golden/
  evals/
  security/
  visual/
artifacts/
.github/
  ISSUE_TEMPLATE/
  PULL_REQUEST_TEMPLATE.md
  workflows/
```

Для каждого спринта создавать папку:

```text
docs/sprints/YYYY-WW-name/
  sprint-goal.md
  sprint-backlog.md
  planning.md
  daily-notes.md
  review.md
  retro.md
  decisions.md
  evidence-index.md
  artifact-updates.md
  process-change-candidates.md
  sprint-summary.md
  sprint-evidence-manifest.json
```

Правила документации:
- старые sprint summaries не переписываются;
- старые версии процесса хранятся в `docs/process/versions/`;
- каждый артефакт указывает версию процесса, по которой создан;
- новый термин нельзя использовать в Vision, BMC, БТ, roadmap или acceptance criteria без записи в `docs/knowledge/glossary.md`.

## 5. Backlog Model

Использовать отдельные backlog-контуры:
- Product Backlog: продуктовые возможности DataCanvas.
- Requirements Backlog: Vision, BMC, БТ, НФТ, user stories, acceptance criteria.
- Technical Backlog: архитектура, схемы, renderer, CI, инфраструктура.
- Eval Backlog: eval cases, regression packs, visual checks, UAT.
- Process Backlog: изменения процесса, Scrum cadence, gates, шаблоны, метрики.
- Sprint Backlog: недельный набор работ, выбранный под Sprint Goal.

Стабильные ID:
- `SRC-*`: источник;
- `FACT-*`: факт;
- `REQ-*`: требование;
- `BT-*`: бизнес-требование;
- `NFR-*`: нефункциональное требование;
- `US-*`: пользовательская история;
- `PBI-*`: product backlog item;
- `TECH-*`: техническая задача;
- `EVAL-*`: eval/test case;
- `PROC-*`: изменение процесса;
- `SLIDE-*`: слайд;
- `ART-*`: артефакт;
- `ADR-*`: архитектурное решение;
- `SPRINT-*`: спринт.

Правила приоритизации:
- сначала элементы, снижающие максимальный риск;
- затем элементы, дающие быстрый пользовательский сигнал;
- затем элементы, создающие reusable process capability;
- затем оптимизация, расширение и polish;
- крупный backlog item должен ссылаться на Vision, BMC, гипотезу, риск или пользовательский сценарий.

## 6. Requirements Pipeline

Требования проходят конвейер:

`Input Package -> Discovery Notes -> Vision -> BMC -> Hypothesis Board -> Requirement Map -> БТ/НФТ -> User Stories -> Acceptance Criteria -> Backlog -> Sprint Evidence`.

Обязательные артефакты:
- `vision.md`;
- `bmc.md`;
- `hypothesis-board.md`;
- `business-requirements.md`;
- `non-functional-requirements.md`;
- `user-stories.md`;
- `acceptance-criteria.md`;
- `traceability-matrix.json`;
- `backlog-slicing-rules.md`.

Definition of Ready для требований:
- указан источник;
- указана бизнес-цель;
- указан пользователь;
- есть acceptance criteria;
- отмечено влияние на НФТ;
- заполнена трассировка;
- задача режется на недельный инкремент;
- понятен способ проверки;
- указан риск и владелец.

Definition of Done для требований:
- требование реализовано или явно отложено;
- acceptance criteria проверены;
- тесты/evals связаны;
- traceability обновлена;
- BMC/Vision/roadmap обновлены при влиянии;
- evidence добавлен в Sprint Review.

## 7. Контракты, Схемы И Интерфейсы

Добавить и версионировать схемы:
- `InputPackageSchema`: входной пакет от другого агента.
- `SourceRegistry`: источники, доверие, владелец, ограничения.
- `FactLedger`: атомарные факты, источник, уверенность, конфликт, статус.
- `NormalizedDataSchema`: нормализованные данные.
- `BriefSchema`: краткое задание на презентацию.
- `PresentationSpec`: единственный контракт между AI-частью и renderer.
- `RenderRequest`: запрос на рендеринг.
- `RenderResult`: результат рендера, export paths, hashes, status.
- `EvalCase`: тестовый/eval сценарий.
- `TraceManifest`: трассировка run/source/fact/slide/artifact.
- `SprintEvidenceManifest`: доказательства спринта.
- `ArtifactRegistry`: реестр артефактов, версий, SHA, владельцев, статусов.
- `ProcessChangeRequest`: изменение процесса.
- `ToolAllowlist`: разрешенные инструменты, права, owner, allowed data classes.
- `TraceContract`: обязательные поля трассировки.

Архитектурные правила:
- DataCanvas v1 = один агент-оркестратор с инструментами.
- Multi-agent разрешается только через ADR с измеримой причиной, метриками и rollback path.
- LLM не генерирует финальный HTML/PDF напрямую.
- LLM генерирует только валидируемый `PresentationSpec`.
- Renderer детерминированно строит HTML/PDF/PNG из `PresentationSpec`.
- Memory/RAG выключены по умолчанию.
- Network, publish, deploy и внешние MCP выключены по умолчанию.
- Факты для презентации берутся только из входного пакета и связанных источников.

## 8. Data And Traceability Governance

Создать обязательную цепочку:

`source -> fact -> requirement -> backlog item -> slide spec -> rendered artifact -> test/eval -> sprint decision -> process change`.

Правила:
- требование без источника получает статус `draft` и не попадает в Sprint Backlog;
- факт без источника не может стать утверждением на финальном слайде;
- каждый слайд имеет `claim map`;
- каждый артефакт имеет SHA/hash, owner, статус, sprint link;
- breaking change схемы требует migration note и ADR;
- Sprint Review не закрывается без `sprint-evidence-manifest.json`.

## 9. Security And Trust Boundaries

Входной пакет от другого агента считать недоверенным.

Обязательные security artifacts:
- `security/trust-boundaries.md`;
- `security/data-classification-policy.md`;
- `security/tool-allowlist.yaml`;
- `security/threat-model.md`;
- `security/threat-model-delta.md` в каждом спринте;
- `security/export-sanitization-checklist.md`;
- `security/incident-response.md`.

Security DoR:
- указан data class;
- указан trust boundary impact;
- указаны tool permissions;
- указан export impact;
- описан abuse case;
- есть security acceptance criteria;
- указаны required security evals.

Security DoD:
- secret scan пройден;
- PII/redaction check пройден;
- prompt injection negative test пройден;
- export sanitization check пройден;
- trace/log leakage check пройден;
- threat model delta обновлен.

Security stop rules:
- secret найден в prompt, export, trace, log или evidence;
- PII попала в export без явного разрешения;
- upstream data смогла изменить instructions агента;
- LLM output прошел в renderer без schema validation;
- export содержит raw trace, hidden notes, local path, internal prompt или tool output;
- tool permission расширен без decision record;
- security gate отключен ради скорости.

## 10. QA, Evals И Тестовые Сценарии

Создать Eval Backlog и regression packs:
- Smoke Pack: быстрый PR-прогон.
- Sprint Pack: обязательный перед Sprint Review.
- Release Pack: перед пилотом/релизом.
- Golden Pack: стабильный набор входных пакетов для сравнения качества.

Тестовые сценарии:
- happy path: корректный входной пакет -> краткая презентация -> export -> evidence.
- incomplete input: не хватает данных, агент не выдумывает факты.
- contradictory facts: конфликт фактов фиксируется и не маскируется.
- prompt injection in upstream data: данные не становятся инструкциями.
- PII/secrets: не попадают в prompt, trace, screenshot, export, evidence.
- unsupported claim: утверждение без источника блокируется.
- invalid JSON: repair/fallback не нарушает контракт.
- renderer overflow: текст не выходит за границы слайда.
- export sanitization: нет hidden notes, raw traces, local paths.
- latency/cost regression: превышение бюджета фиксируется.
- human edit: правка пользователя сохраняет claim trace.
- process change: изменение процесса проходит PCR, experiment, review и changelog.

Quality dashboard:
- eval pass rate;
- regression pass rate;
- unsupported claims count;
- factuality failures;
- schema violations;
- visual defect count;
- export failures;
- open quality debt;
- escaped defects after UAT;
- cost per presentation;
- p50/p95 latency.

QA stop rules:
- critical visual overflow;
- отсутствие trace/evidence;
- failure golden case;
- невозможность воспроизвести результат;
- неподтвержденное утверждение в финальном export.

## 11. Observability And LLM Ops

Обязательные trace spans:
- `input_validation`;
- `normalization`;
- `model_call`;
- `presentation_spec_validation`;
- `render`;
- `export`;
- `qa`;
- `handoff`.

Поля каждого span:
- `run_id`;
- `sprint_id`;
- `increment_id`;
- `artifact_id`;
- `status`;
- `duration_ms`;
- `cost_estimate`;
- `model`;
- `error_class`;
- `schema_version`.

Operational Readiness Gate для каждого инкремента:
- трассы есть;
- метрики считаются;
- runbook обновлен;
- failure modes описаны;
- rollback/disable path определен;
- cost/latency impact понятен;
- smoke/synthetic check проходит.

Incident-to-backlog loop:
- дефект или инцидент фиксируется;
- проводится короткий RCA;
- создается backlog item;
- добавляется eval/test/guardrail;
- проверка входит в regression pack;
- результат проверяется на следующем Sprint Review.

## 12. UX И Prototype Track

Prototype Roadmap:
- Sprint 0: карта сценариев, рубрика качества презентации, прототип процессной панели.
- Sprint 1: путь `input package -> brief -> slide outline -> preview`.
- Sprint 2: просмотр источников и трассировка утверждений.
- Sprint 3: первый end-to-end прототип на mock data.
- Sprint 4: review/edit flow.
- Sprint 5: visual acceptance HTML/PDF/PNG.
- Sprint 6: индекс артефактов, версии, export, права доступа.
- Sprint 7: пилотный Sprint Review с пользователями.
- Sprint 8: MVP release candidate.

Human-in-the-loop модель:
- роли: автор, ревьюер, утверждающий, наблюдатель;
- статусы: черновик, на проверке, нужны правки, утверждено, отклонено;
- действия: редактировать, комментировать, перегенерировать, зафиксировать, экспортировать;
- аудит: кто изменил, что изменил, почему, на основании какого источника.

Visual acceptance:
- скриншоты ключевых состояний;
- проверка overflow;
- проверка читаемости таблиц и диаграмм;
- проверка контраста;
- проверка HTML/PDF/PNG export;
- проверка сохранения связи claims с источниками.

## 13. Delivery, GitOps И CI

Sprint 0 обязан создать delivery bootstrap.

Branch/worktree policy:
- `sprint/YYYY-WW-short-name`;
- `feature/DC-012-short-name`;
- `fix/DC-018-short-name`;
- `process/DC-025-short-name`.

PR должен содержать:
- sprint id;
- backlog item id;
- affected artifacts;
- acceptance criteria;
- evidence packet;
- checks result;
- rollback note;
- product/process decision impact.

CI gates:
- blocking: schema validation, tests, secret scan, artifact registry validation, required docs links.
- advisory: cost/latency budget, visual diff, coverage trend, quality trend.
- manual: product acceptance, security exception, process change approval.

Release evidence packet:
- release goal;
- accepted PRs;
- commit SHA;
- CI evidence;
- artifact registry snapshot;
- known risks;
- rollback/forward-fix plan;
- acceptance decision.

## 14. Initial Release Train

Sprint 0: Process And Delivery Bootstrap
- Increment: репозиторий готов к управляемой разработке.
- Артефакты: process passport, process registry, initial DoR/DoD, branch policy, PR template, CI skeleton, sprint folder template.
- Gate: G0 Repo Ready, G1 Process Ready.

Sprint 1: Product And Process Goals
- Increment: утверждены Product Goal и Process Goal.
- Артефакты: Vision v0.1, BMC v0.1, Hypothesis Board, target users, success metrics.
- Gate: G2 Strategy Ready.

Sprint 2: Requirements And Traceability
- Increment: requirements pipeline готов для недельного Scrum.
- Артефакты: БТ, НФТ, user stories, acceptance criteria, traceability matrix, backlog slicing rules.
- Gate: G3 Requirements Ready.

Sprint 3: Input Contract And Data Governance
- Increment: входной пакет валидируется и трассируется.
- Артефакты: InputPackageSchema, SourceRegistry, FactLedger, fixtures, negative cases.
- Gate: G4 Data Contract Ready.

Sprint 4: PresentationSpec And Mock Agent
- Increment: AI-часть генерирует валидный `PresentationSpec` на mock data.
- Артефакты: PresentationSpec, prompt contract, mock outputs, eval cases.
- Gate: G5 AI Contract Ready.

Sprint 5: Renderer And Visual Acceptance
- Increment: deterministic renderer строит HTML/PDF/PNG из `PresentationSpec`.
- Артефакты: RenderRequest, RenderResult, visual checks, export sanitization.
- Gate: G6 Render Ready.

Sprint 6: Real LLM Behind Contract
- Increment: реальный LLM подключен только за JSON/schema boundary.
- Артефакты: repair/fallback rules, LLM eval pack, trace manifest, cost/latency baseline.
- Gate: G7 LLM Controlled.

Sprint 7: Security, QA And Ops Hardening
- Increment: качество, безопасность и эксплуатация встроены в спринт.
- Артефакты: threat model delta, tool allowlist, operational readiness checklist, runbook, regression packs.
- Gate: G8 Quality And Security Ready.

Sprint 8: Human Review And MVP Flow
- Increment: end-to-end MVP: input -> normalized data -> brief -> PresentationSpec -> render -> human review -> export -> evidence.
- Артефакты: UX flow, UAT script, artifact registry, sprint evidence.
- Gate: G9 MVP Accepted.

Sprint 9: Pilot And Process Portability
- Increment: пилотный запуск DataCanvas и проверка переносимости процесса.
- Артефакты: pilot report, process metrics, process changelog, migration notes, reusable templates.
- Gate: G10 Pilot Accepted, G11 Process Version Accepted.

## 15. Метрики

Продуктовые:
- presentation acceptance rate;
- usefulness score;
- human correction rate;
- time from input package to accepted deck.

Качественные:
- factuality failures;
- unsupported claims;
- visual defects;
- schema violations;
- export failures.

Процессные:
- sprint predictability;
- spillover rate;
- cycle time;
- blocked time;
- process change lead time;
- artifact completeness;
- decision latency.

Операционные:
- cost per generated presentation;
- p50/p95 latency;
- retry rate;
- failure rate;
- incident count;
- eval regression trend.

## 16. Definition Of Done Для Всего Плана

План считается реализованным, когда:
- существует принятая версия процесса `DataCanvas Delivery Process v0.1`;
- создан Process Backlog и первый Process Change Request flow;
- недельный Scrum проведен минимум один раз с evidence pack;
- Vision, BMC, БТ, НФТ, backlog, roadmap и prototype связаны трассировкой;
- DataCanvas MVP проходит end-to-end flow;
- все claims в презентации трассируются к источникам;
- security, QA, visual, ops gates встроены в Sprint Review;
- process changelog показывает хотя бы одно управляемое улучшение процесса;
- команда может изменить процесс через PCR без переписывания методологии вручную.

## 17. Допущения И Defaults

- Все человекочитаемые артефакты пишутся на русском.
- Имена схем, API, файлов, JSON-полей и технических контрактов могут быть на английском.
- DataCanvas v1 использует одного агента с инструментами.
- Multi-agent, RAG, memory, network, publish/deploy включаются только через ADR/PCR.
- Вход другого агента считается недоверенным.
- Источник истины для фактов презентации: входной пакет и связанные источники.
- Недельный спринт является default; изменение cadence проходит через Process Change Request.
- DataCanvas является пилотом процесса, но структура процесса должна быть переносимой на другие ИТ-решения.
