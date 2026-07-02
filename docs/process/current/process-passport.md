# Паспорт Процесса DataCanvas Delivery Process

Версия процесса: `0.1.0`
Дата вступления: 2026-06-22
Статус: active
Владелец процесса: Process Owner, назначается командой на Sprint Planning
Пилотный проект: DataCanvas

## Цель Процесса

Обеспечить управляемую разработку DataCanvas через адаптированный Scrum с недельными спринтами, обязательными артефактами, evidence gates, контролем изменений процесса и трассировкой решений.

## Область Применения

Процесс применяется к:
- разработке методологии DataCanvas;
- подготовке продуктовых артефактов;
- реализации AI-агента;
- изменениям процесса, требований, архитектуры, безопасности и качества.

## Роли

- Product Owner: управляет Product Goal, Product Backlog и приемкой ценности.
- Scrum Master: поддерживает Scrum cadence, WIP, ретроспективу и прозрачность.
- Process Owner: управляет версией процесса, Process Backlog, PCR и метриками.
- Development Team: поставляет инкременты продукта и процесса.
- QA/Evals Lead: отвечает за eval backlog, regression packs и quality evidence.
- Security/Privacy Lead: отвечает за trust boundaries, data classification и stop rules.
- Delivery/GitOps Lead: отвечает за PR gates, CI, release evidence и rollback notes.
- SRE/LLM Ops Lead: отвечает за traces, runbooks, cost/latency/failure metrics.
- UX/Prototype Lead: отвечает за prototype roadmap и visual acceptance.

## Scrum Cadence

- Sprint length: 1 неделя.
- Sprint Planning: понедельник, 60-90 минут.
- Daily Scrum или async check: каждый рабочий день, до 15 минут.
- Backlog Refinement: среда, 45-60 минут.
- Sprint Review: пятница, 60-90 минут.
- Sprint Retrospective: пятница после Review, 45-60 минут.

## Обязательные Артефакты Спринта

- `sprint-goal.md`
- `sprint-backlog.md`
- `planning.md`
- `daily-notes.md`
- `review.md`
- `retro.md`
- `decisions.md`
- `evidence-index.md`
- `artifact-updates.md`
- `process-change-candidates.md`
- `sprint-summary.md`
- `sprint-evidence-manifest.json`

## Правила Изменения Процесса

Любое изменение процесса оформляется как `PROC-*` item и проходит через Process Change Request. Исключение допускается только при stop-rule, когда текущий процесс создает риск утечки, потери evidence, нарушения безопасности или невоспроизводимости.

## Каскадное Ведение Документации

Значимые изменения проектной документации проходят через `DocumentationChangeRequest`, dependency graph, анализ влияния, очередь пользовательских решений и validation evidence. Правило действует для Vision, BMC, Product Goal, hypotheses, stories, requirements, backlog, roadmap, capacity, sprint artifacts, release evidence и Jira import package.

Процесс запрещает закрывать работу, пока affected artifacts не обновлены или не имеют confirmed `no-change rationale`. DataCanvas не выдумывает за пользователя приоритеты, сроки, ресурсы, scope, регламенты или Jira field mapping; такие вопросы остаются блокирующими решениями.

## Ворота Готовности

- G0 Repo Ready: структура репозитория и базовые инструкции существуют.
- G1 Process Ready: процесс `0.1.0` принят как стартовый.
- G2 Strategy Ready: Product Goal, Process Goal, Vision, BMC и гипотезы созданы.
- G3 Requirements Ready: БТ, НФТ, user stories и acceptance criteria готовы к спринтам.
- G4+ используются для продуктовой реализации согласно плану.
