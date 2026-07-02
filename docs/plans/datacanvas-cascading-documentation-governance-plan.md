# План Имплементации: Контракт Каскадного Ведения Проектной Документации DataCanvas

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / [Планы](README.md) / Контракт каскадного ведения проектной документации

Статус: implemented
Владелец: Process Owner
Дата: 2026-07-02
Проверка: `npm run validate:cascading-governance`, `npm run validate:docs-navigation`, `npm run validate:artifact-registry`, `npm run validate:artifact-hashes`
Источник: пользовательское решение о строгом каскадном обновлении созависимых проектных артефактов и запрете неподтвержденных смысловых допущений.

## Summary

Реализовать в DataCanvas систему управляемого изменения проектной документации: любой запрос пользователя на правку верхнеуровневого или связанного артефакта запускает impact analysis, определяет созависимые артефакты, готовит план каскадных правок, выявляет решения пользователя, пересчитывает ресурсы/сроки при изменении backlog и блокирует завершение работы до закрытия всех обязательных решений.

Строгий принцип: DataCanvas не выдумывает бизнесовые решения, приоритеты, ресурсы, сроки, регламенты или Jira mapping. Система может выполнить логическую раскрутку, декомпозицию, расчет последствий и предложить варианты, но каждое смысловое решение должно быть явно подтверждено пользователем.

## Core Contract

- Ввести `DocumentationChangeRequest` как обязательный вход для правки проектной документации.
- Любая правка Vision, BMC, roadmap, stories, requirements, backlog, capacity, sprint или Jira import package проходит через этот контракт.
- Контракт должен содержать:
  - `change_request_id`;
  - инициатора;
  - целевой артефакт;
  - описание желаемого изменения;
  - источник изменения;
  - уровень влияния;
  - затронутый период;
  - затронутые backlog/story IDs;
  - известные ограничения;
  - статус пользовательского подтверждения.
- Без `DocumentationChangeRequest` нельзя запускать каскадные смысловые правки.
- Изменение не может считаться завершенным, пока все affected artifacts либо обновлены, либо имеют подтвержденный пользователем `no-change rationale`.

## Dependency Graph

- Создать machine-readable dependency graph для проектных артефактов.
- Зафиксировать уровни зависимости:
  - Vision;
  - BMC;
  - Product Goal;
  - hypotheses;
  - stories;
  - business requirements;
  - NFR;
  - acceptance criteria;
  - product backlog;
  - technical/eval/process backlog;
  - roadmap;
  - capacity plan;
  - sprint artifacts;
  - release evidence;
  - Jira import package.
- Для каждой связи указать:
  - upstream artifact;
  - downstream artifact;
  - relation type;
  - update rule;
  - validation command;
  - owner role;
  - when user confirmation is required.
- Vision считается high-impact source: изменение Vision всегда запускает проверку всех нижележащих бизнесовых, backlog, roadmap, traceability и evidence артефактов.

## Impact Analysis

- Добавить `ImpactAnalysisReport`.
- Для каждого change request автоматически формировать:
  - список affected artifacts;
  - тип влияния: semantic, traceability, navigation, resource, Jira, evidence, generated;
  - обязательные правки;
  - возможные правки;
  - blocking user decisions;
  - derived facts;
  - assumptions forbidden list;
  - validation plan.
- Impact analysis не должен сам принимать решения.
- Любое предложение системы маркируется как:
  - `derived_from_sources`;
  - `requires_user_confirmation`;
  - `blocked_missing_input`;
  - `not_applicable`.
- Если пользователь не подтвердил смысловую правку, она остается в decision queue и блокирует Done.

## User Decision Queue

- Ввести `UserDecisionQueue` для незакрытых решений.
- Queue должна хранить:
  - вопрос;
  - affected artifacts;
  - варианты решения;
  - рекомендованный вариант, если он логически следует из источников;
  - последствия каждого варианта;
  - статус;
  - дату запроса;
  - ссылку на change request.
- Система обязана возвращать пользователя к queue при каждом продолжении работы, пока есть blocking decisions.
- Запрещено подменять отсутствие ответа допущением для смысловых решений.
- Допущения допустимы только для технических defaults, не влияющих на бизнес-смысл, scope, ресурсы, сроки, приоритеты или регламенты.

## Capacity And Reprioritization

- Создать `CapacityPlan` как источник ресурсных ограничений.
- Capacity plan должен содержать:
  - квартал;
  - доступную емкость команды в ПШЕ;
  - роль или командный контур;
  - known absences/constraints;
  - committed items;
  - reserved buffer;
  - источник данных.
- Создать `ReprioritizationImpactReport`.
- При изменении приоритетов backlog система должна:
  - пересчитать сумму ПШЕ по кварталу;
  - сравнить с доступной емкостью;
  - показать дефицит или резерв;
  - выявить зависимости между stories;
  - предложить варианты trade-off;
  - явно запросить решение пользователя.
- Если ресурсов не хватает, система предлагает, но не утверждает:
  - перенести story на следующий квартал;
  - разбить story;
  - снизить scope;
  - увеличить емкость команды;
  - перенести менее приоритетные stories.
- Любой перенос story между кварталами требует явного подтверждения пользователя.
- Нельзя автоматически менять оценку ПШЕ без нового источника или подтверждения пользователя.

## Cascading Update Runner

- Реализовать автоматизированный запуск каскадных правок после подтверждения change plan.
- Runner должен выполнять этапы:
  - read dependency graph;
  - build impact report;
  - create decision queue;
  - stop if blocking decisions exist;
  - apply confirmed edits;
  - update traceability;
  - update backlog/resource artifacts;
  - update roadmap;
  - update navigation source;
  - regenerate generated artifacts;
  - run validators;
  - produce evidence.
- Runner не должен редактировать generated artifacts вручную.
- Runner не должен применять semantic edits со статусом `requires_user_confirmation`.
- Для каждого skipped artifact требуется подтвержденный `no-change rationale`.

## Artifact Update Rules

- Vision change triggers review of:
  - BMC;
  - stories;
  - business requirements;
  - NFR;
  - acceptance criteria;
  - product backlog;
  - roadmap;
  - traceability matrix;
  - capacity plan;
  - Jira import packages;
  - release/sprint evidence.
- Backlog priority change triggers review of:
  - roadmap;
  - capacity plan;
  - sprint planning;
  - traceability;
  - Jira import package;
  - release notes if affected.
- Capacity change triggers review of:
  - committed quarter scope;
  - spillover;
  - roadmap;
  - sprint backlog;
  - risk register.
- Jira import package change triggers field mapping process, not universal field assumptions.
- Regulation change triggers compliance checklist update and artifact completeness validation.

## Jira Custom Field Process

- Jira field mapping is not global and not pre-guessed.
- For each import package create `JiraFieldMappingRequest`.
- Mapping request must capture:
  - target project;
  - issue types;
  - required custom fields;
  - allowed values;
  - CSV columns;
  - Jira field mapping;
  - unresolved fields;
  - approving stakeholder;
  - import readiness status.
- A Jira CSV package cannot be marked ready without approved mapping or explicit `pending_external` status.
- MCP Atlassian handoff package can be prepared for another corporate agent, but it must not claim import completion.

## Schemas

- Add or update schemas:
  - `documentation-change-request.schema.json`;
  - `artifact-dependency-graph.schema.json`;
  - `impact-analysis-report.schema.json`;
  - `user-decision-queue.schema.json`;
  - `capacity-plan.schema.json`;
  - `reprioritization-impact-report.schema.json`;
  - `cascading-update-run.schema.json`;
  - `jira-field-mapping-request.schema.json`;
  - `jira-import-package-manifest.schema.json`.
- Add fixtures:
  - Vision change impacting all downstream artifacts;
  - backlog reprioritization with Q3 over capacity;
  - backlog reprioritization with enough capacity;
  - missing capacity data;
  - unresolved Jira custom fields;
  - user rejects proposed story move;
  - user confirms story move to Q4.

## Validators

- Add validators:
  - validate change request;
  - validate dependency graph;
  - validate impact report;
  - validate decision queue;
  - validate capacity plan;
  - validate reprioritization impact;
  - validate cascading update completeness;
  - validate Jira field mapping.
- Validators must fail if:
  - affected artifact is missing from impact report;
  - semantic update applied without user confirmation;
  - capacity overrun exists without confirmed trade-off;
  - generated artifacts are stale;
  - Jira import package lacks field mapping status;
  - Done claimed while decision queue has blocking items;
  - no-change rationale is absent or unconfirmed.

## Documentation Updates

- Update Vision/BMC/stories/requirements/backlog/roadmap to state that DataCanvas manages documentation lifecycle and change propagation.
- Update DoR:
  - change request required for meaningful artifact edits;
  - impact analysis required for upstream artifacts;
  - capacity source required for backlog reprioritization;
  - Jira field mapping request required for Jira-bound packages.
- Update DoD:
  - all affected artifacts updated or explicitly waived;
  - decision queue closed;
  - validation passed;
  - evidence recorded;
  - resource impact resolved.
- Update process passport with cascading documentation governance.
- Add a plan or ADR/PCR for the cascade contract.
- Register new docs in navigation source and artifact registry.

## Evidence

- Every cascade run must produce evidence:
  - change request;
  - impact analysis report;
  - decision queue;
  - confirmed decisions;
  - changed artifacts list;
  - no-change rationales;
  - capacity/reprioritization report;
  - validation commands and results.
- Sprint evidence must reference the cascade run when it changes sprint/backlog/roadmap artifacts.
- Release evidence must not be updated as accepted unless all blocking decisions are closed.

## Test Plan

- Baseline:
  - `git status --short --branch`;
  - `git diff --check`.
- Existing gates:
  - `npm run validate:schemas`;
  - `npm run validate:contracts`;
  - `npm run validate:backlog-registry`;
  - `npm run validate:traceability-graph`;
  - `npm run validate:docs-navigation`;
  - `npm run validate:artifact-registry`;
  - `npm run validate:artifact-hashes`;
  - `npm run scan:secrets`;
  - `npm run validate:data-leakage`.
- New gates:
  - validate documentation change request;
  - validate impact analysis;
  - validate decision queue;
  - validate capacity plan;
  - validate reprioritization report;
  - validate cascading update completeness;
  - validate Jira field mapping request.
- Final:
  - regenerate required artifacts through generators;
  - `npm test`.

## Acceptance Criteria

- Любая правка Vision запускает impact analysis по всем downstream artifacts.
- Любая реприоритизация backlog пересчитывает capacity по кварталу.
- Если квартальная емкость превышена, система предлагает trade-off и блокирует завершение до решения пользователя.
- Пользовательские решения фиксируются явно.
- Система не выдумывает за пользователя сроки, ресурсы, приоритеты, scope или Jira mapping.
- Все созависимые артефакты обновлены или имеют подтвержденный no-change rationale.
- Decision queue блокирует Done, если есть незакрытые вопросы.
- Validators ловят незавершенные cascade updates.
- Jira custom fields согласуются отдельно для каждого import package.
- Existing PR #6 gates сохранены и расширены.

## Assumptions

- Источник capacity может быть создан как отдельный проектный артефакт, но конкретные значения емкости команды должны быть предоставлены или подтверждены пользователем.
- Логические предложения DataCanvas являются draft recommendations до явного подтверждения.
- Регламенты и Jira custom fields предоставляются при конкретном запросе или остаются `pending_external`.
