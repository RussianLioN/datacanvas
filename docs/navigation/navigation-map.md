# Карта Навигации Документации

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / Карта навигации

Статус: generated
Источник: `docs/navigation/navigation-source.json`

## Быстрые Маршруты По Контурам

## Продукт DataCanvas

Vision, BMC, stories, требования, backlog, roadmap, hypotheses и traceability продукта.

### Бизнесовая карта продукта

Vision, BMC, stories, требования, backlog, roadmap, гипотезы и traceability.

- [Продукт DataCanvas](../product/README.md) - Product Owner, `active`.
- [Видение продукта DataCanvas](../product-vision.md) - Product Owner, `active`.
- [DataCanvas BMC Package](../product/bmc/README.md) - Product Owner, `accepted`.
- [Каталог пользовательских историй DataCanvas](../product/requirements/user-stories.md) - Product Owner, `active`.
- [Требования DataCanvas](../product/requirements/README.md) - Product Owner, `active`.
- [Бизнес-требования v0.2](../product/requirements/business-requirements.md) - Product Owner, `draft`.
- [Нефункциональные Требования v0.1](../product/requirements/non-functional-requirements.md) - Product Owner, `draft`.
- [Критерии приемки v0.2](../product/requirements/acceptance-criteria.md) - Product Owner, `draft`.
- [Backlog DataCanvas](../product/backlog/README.md) - Product Owner, `active`.
- [Product Backlog](../product/backlog/product-backlog.md) - Product Owner, `draft`.
- [Roadmap DataCanvas](../product/roadmap/README.md) - Product Owner, `active`.
- [Roadmap v0.1](../product/roadmap/roadmap-v0.1.md) - Product Owner, `draft`.
- [Гипотезы DataCanvas](../product/hypotheses/README.md) - Product Owner, `active`.
- [Доска гипотез](../product/hypotheses/hypothesis-board.md) - Product Owner, `draft`.
- [Проверка гипотез](../product/hypotheses/hypothesis-validation.md) - Product Owner, `draft`.
- [Исходные Документы Продукта DataCanvas](../product/sources/README.md) - Product Owner, `draft`.

## Техническое воплощение ведения проектной документации

Методология, процесс, navigation source, generated navigation, ADR, schemas, scripts, validators, release, evidence и sprint artifacts.

### Производственный контур

Sprint, release, UAT, pilot, production/process evidence и PR handoff.

- [Release И Evidence DataCanvas](../release/README.md) - Delivery/GitOps Lead, `active`.
- [Sprint Artifacts DataCanvas](../sprints/README.md) - Scrum Master, `active`.

### Техническая документация

Архитектура, ADR, schemas, scripts, tests, security contracts и technical backlog.

- [Архитектура DataCanvas](../architecture/README.md) - AI Agent Architect, `active`.

### Методика и governance

Процесс документации, PROC, планы, DoR/DoD и методики.

- [Планы DataCanvas](../plans/README.md) - Process Owner, `active`.
- [Нормализованный Источник BABOK-Исследования](../process/methodology/babok-research-source.md) - Process Owner, `active`.
- [Методика Ведения Проектной Документации DataCanvas](../process/methodology/project-documentation-methodology.md) - Process Owner, `active`.
- [Методика Проектной Документации](../process/methodology/README.md) - Process Owner, `active`.
- [Prompt-Only Согласование Артефактов Проектной Документации](../process/prompt-only-artifact-review/README.md) - Process Owner, `active`.
- [Процесс DataCanvas](../process/README.md) - Process Owner, `active`.
- [Универсальный рабочий процесс проектной документации](../process/universal-documentation-workflow/README.md) - Process Owner, `active`.
- [Карта Слоев DataCanvas](../project-map.md) - Documentation Owner, `active`.
- [Документация DataCanvas](../README.md) - Documentation Owner, `active`.
- [DataCanvas](../../README.md) - Documentation Owner, `active`.

### Evidence

Evidence hub и generated/manual evidence exports без raw confidential данных.

- [Evidence Hub DataCanvas](../knowledge/evidence-index.md) - Delivery/GitOps Lead, `active`.
- [Knowledge Base DataCanvas](../knowledge/README.md) - Documentation Owner, `active`.

### Генерируемые артефакты

Автоматически созданные карты, индексы и отчеты проверок; методика и ручные источники остаются в governance.

- [Карта Навигации Документации](navigation-map.md) - Documentation Owner, `generated`.

## Маршруты По Ролям

| ID | Маршрут | Контур | Группа | Старт | Дальше | Владелец | Проверка |
|---|---|---|---|---|---|---|---|
| `role-product-owner` | Product Owner | `product` | `business` | `docs/product/README.md` | `docs/product-vision.md`, `docs/product/bmc/README.md`, `docs/product/requirements/user-stories.md`, `docs/product/requirements/business-requirements.md`, `docs/product/requirements/non-functional-requirements.md`, `docs/product/requirements/acceptance-criteria.md`, `docs/product/sources/README.md`, `docs/product/change-orders/README.md`, `docs/product/revisions/co-2026-001-source-revision/revision-ledger.md`, `docs/product/analysis/README.md`, `docs/product/specs/README.md`, `docs/product/backlog/product-backlog.md`, `docs/product/roadmap/roadmap-v0.1.md`, `docs/product/hypotheses/hypothesis-board.md` | Product Owner | `npm run validate:docs-navigation` |
| `role-business-analyst` | Business Analyst | `product` | `business` | `docs/product/analysis/README.md` | `docs/product/sources/README.md`, `docs/product/change-orders/README.md`, `docs/product/analysis/ba/business-needs.md`, `docs/product/analysis/ba/business-rules.md`, `docs/product/analysis/ba/business-requirements-delta.md`, `docs/product/requirements/business-requirements.md` | Product Owner | `npm run validate:docs-navigation` |
| `role-system-analyst` | System Analyst | `documentation_operations` | `technical` | `docs/architecture/system-analysis/README.md` | `docs/product/sources/README.md`, `docs/product/specs/README.md`, `docs/architecture/system-analysis/srs-v0.1.md`, `docs/architecture/system-analysis/datacanvas-lifecycle-state-model.md`, `docs/architecture/system-analysis/data-contract-map.md`, `docs/architecture/system-analysis/error-taxonomy.md` | AI Agent Architect | `npm run validate:docs-navigation` |
| `role-process-owner` | Process Owner | `documentation_operations` | `governance` | `docs/process/README.md` | `docs/process/current/process-registry.md`, `docs/process/current/definition-of-ready.md`, `docs/process/current/definition-of-done.md`, `docs/process/cascading-governance/README.md`, `docs/process/universal-documentation-workflow/README.md` | Process Owner | `npm run validate:docs-navigation` |
| `role-documentation-architect` | Архитектор документации и методики | `documentation_operations` | `governance` | `docs/process/universal-documentation-workflow/README.md` | `docs/process/universal-documentation-workflow/universal-workflow-core.json`, `docs/process/universal-documentation-workflow/datacanvas-profile.json`, `docs/process/universal-documentation-workflow/artifact-inventory.json`, `docs/process/universal-documentation-workflow/generator-contracts.json`, `docs/navigation/navigation-source.json`, `docs/architecture/schemas/artifact-registry.json` | Process Owner | `npm run validate:universal-documentation-workflow` |
| `role-delivery-lead` | Delivery/GitOps Lead | `documentation_operations` | `delivery` | `docs/release/README.md` | `docs/release/commit-pr-evidence.md`, `docs/release/mvp-release-evidence-pack.md`, `docs/knowledge/evidence-index.md` | Delivery/GitOps Lead | `npm run validate:docs-navigation` |
| `role-agent` | AI systems engineer | `documentation_operations` | `governance` | `AGENTS.md` | `docs/process/methodology/README.md`, `docs/navigation/navigation-source.json`, `docs/project-map.md` | Process Owner | `npm run validate:docs-navigation` |

## Маршруты По Задачам

| ID | Маршрут | Контур | Группа | Старт | Дальше | Владелец | Проверка |
|---|---|---|---|---|---|---|---|
| `task-understand-product` | Понять продукт | `product` | `business` | `docs/product/README.md` | `docs/product-vision.md`, `docs/product/bmc/README.md`, `docs/product/requirements/user-stories.md`, `docs/product/requirements/README.md`, `docs/product/requirements/business-requirements.md`, `docs/product/requirements/non-functional-requirements.md`, `docs/product/requirements/acceptance-criteria.md`, `docs/product/backlog/product-backlog.md`, `docs/product/roadmap/roadmap-v0.1.md`, `docs/product/hypotheses/hypothesis-board.md` | Product Owner | `npm run validate:docs-navigation` |
| `task-find-product-sources` | Найти исходные документы продукта | `product` | `business` | `docs/product/sources/README.md` | `docs/product/sources/product-source-registry.json`, `docs/product/sources/source-audit.md`, `docs/product-vision.md`, `docs/product/change-orders/co-2026-001-a2a-first-priority.md`, `docs/product/requirements/user-stories.md` | Product Owner | `npm run validate:product-sources` |
| `task-review-source-revision` | Проверить ревизию исходных документов | `product` | `business` | `docs/product/revisions/co-2026-001-source-revision/revision-ledger.md` | `docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json`, `docs/product/revisions/co-2026-001-source-revision/revision-approval-state.json`, `docs/product/revisions/co-2026-001-source-revision/revision-approval-log.md`, `docs/product/sources/source-audit.md` | Product Owner | `npm run validate:change-set-approval` |
| `task-approve-proposed-edit` | Согласовать предложенную правку | `product` | `business` | `docs/product/revisions/co-2026-001-source-revision/revision-approval-log.md` | `docs/product/revisions/co-2026-001-source-revision/revision-approval-state.json`, `docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json` | Product Owner | `npm run validate:revision-approval-state` |
| `task-check-accepted-change-order-impact` | Проверить влияние принятого изменения | `product` | `business` | `docs/product/change-orders/co-2026-001-a2a-first-priority.md` | `docs/product/sources/source-audit.md`, `docs/product/revisions/co-2026-001-source-revision/revision-ledger.md`, `docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json` | Product Owner | `npm run validate:accepted-change-order-impact` |
| `task-find-co-2026-001-priority-context` | Найти контекст приоритета CO-2026-001 | `product` | `business` | `docs/product/change-orders/co-2026-001-a2a-first-priority.md` | `docs/product-vision.md`, `docs/product/requirements/user-stories.md`, `docs/product/revisions/co-2026-001-source-revision/revision-ledger.md`, `docs/product/requirements/business-requirements.md` | Product Owner | `npm run validate:accepted-change-order-impact` |
| `task-find-current-source-of-truth` | Найти текущий источник истины | `product` | `business` | `docs/product/sources/README.md` | `docs/product/sources/product-source-registry.json`, `docs/product/change-orders/co-2026-001-a2a-first-priority.md`, `docs/product-vision.md`, `docs/product/requirements/user-stories.md` | Product Owner | `npm run validate:product-source-consistency` |
| `task-find-process` | Найти текущий процесс | `documentation_operations` | `governance` | `docs/process/README.md` | `docs/process/current/process-passport.md`, `docs/process/current/process-registry.md`, `docs/process/cascading-governance/README.md` | Process Owner | `npm run validate:docs-navigation` |
| `task-work-with-bmc` | Работать с BMC | `product` | `business` | `docs/product/bmc/README.md` | `docs/product/bmc/bmc-v0.2.md`, `docs/product/bmc/manifest.json` | Product Owner | `npm run validate:bmc` |
| `task-review-merge` | Подготовить review/merge | `documentation_operations` | `delivery` | `docs/release/README.md` | `.github/PULL_REQUEST_TEMPLATE.md`, `docs/release/commit-pr-evidence.md` | Delivery/GitOps Lead | `npm test` |
| `task-find-evidence` | Найти evidence/release | `documentation_operations` | `evidence` | `docs/knowledge/evidence-index.md` | `docs/release/mvp-release-evidence-pack.json`, `docs/navigation/documentation-index.json` | Delivery/GitOps Lead | `npm run validate:docs-navigation` |
| `task-analyze-agent-launch-requirements` | Анализировать требования запуска другим агентом | `product` | `business` | `docs/product/analysis/agent-launch-requirements-analysis/README.md` | `docs/product/analysis/agent-launch-requirements-analysis/analysis-state.json`, `docs/product/analysis/agent-launch-requirements-analysis/analysis-log.md`, `docs/product/analysis/agent-launch-requirements-analysis/story-requirement-decision-ledger.md`, `docs/product/analysis/agent-launch-requirements-analysis/artifact-review-ledger.md`, `docs/product/analysis/agent-launch-requirements-analysis/requirements-impact-map.json`, `docs/product/requirements/business-requirements.md`, `docs/product/requirements/traceability-matrix.json` | Product Owner / Process Owner | `npm run validate:agent-launch-requirements-analysis` |
| `task-audit-datacanvas-documentation-consistency` | Проверить согласованность документации DataCanvas | `product` | `business` | `docs/product/analysis/documentation-consistency-audit/README.md` | `docs/product/analysis/documentation-consistency-audit/source-of-truth-map.md`, `docs/product/analysis/documentation-consistency-audit/consistency-matrix.md`, `docs/product/analysis/documentation-consistency-audit/owner-decision-queue.md`, `docs/product/analysis/documentation-consistency-audit/po-questionnaire-log.md`, `docs/product/analysis/documentation-consistency-audit/confluence-import-map.md`, `docs/product/analysis/documentation-consistency-audit/sprint-candidate-plan.md`, `docs/product/analysis/documentation-consistency-audit/agent-launch-p1-effort-estimation.md`, `docs/product/sources/product-source-registry.json`, `docs/product/requirements/traceability-matrix.json` | Product Owner / Process Owner | `npm run validate:docs-navigation` |
| `task-find-business-requirements` | Найти бизнес-требования | `product` | `business` | `docs/product/requirements/README.md` | `docs/product/requirements/business-requirements.md`, `docs/product/requirements/user-stories.md`, `docs/product/requirements/non-functional-requirements.md`, `docs/product/requirements/acceptance-criteria.md`, `docs/product/requirements/traceability-matrix.json` | Product Owner | `npm run validate:docs-navigation` |
| `task-plan-product-work` | Планировать продуктовую работу | `product` | `business` | `docs/product/backlog/README.md` | `docs/product/backlog/product-backlog.md`, `docs/product/roadmap/roadmap-v0.1.md`, `docs/product/hypotheses/hypothesis-board.md`, `docs/product/hypotheses/hypothesis-validation.md` | Product Owner | `npm run validate:docs-navigation` |
| `task-find-technical-docs` | Найти техническую документацию | `documentation_operations` | `technical` | `docs/architecture/README.md` | `docs/product/backlog/technical-backlog.md`, `docs/architecture/schemas/schema-registry.md`, `docs/architecture/security/trust-boundaries.md` | AI Agent Architect | `npm run validate:docs-navigation` |
| `task-find-documentation-methodology` | Найти методику документации | `documentation_operations` | `governance` | `docs/process/methodology/README.md` | `docs/process/methodology/project-documentation-methodology.md`, `docs/process/methodology/documentation-methodology-policy.json`, `docs/process/methodology/traceability-model.json` | Process Owner | `npm run validate:docs-navigation` |
| `task-start-documentation-workflow` | Запустить полный рабочий процесс по артефактам документации | `documentation_operations` | `governance` | `docs/process/universal-documentation-workflow/README.md` | `docs/process/universal-documentation-workflow/universal-workflow-runbook.md`, `docs/process/universal-documentation-workflow/workflow-state.json`, `docs/process/universal-documentation-workflow/run-ledger.json`, `docs/process/universal-documentation-workflow/event-log.json`, `docs/process/universal-documentation-workflow/decision-queue.json` | Process Owner | `npm run validate:universal-documentation-workflow` |
| `task-port-documentation-workflow` | Перенести методику на другой ИТ-продукт | `documentation_operations` | `governance` | `docs/process/universal-documentation-workflow/portability-pack.json` | `docs/process/universal-documentation-workflow/product-bootstrap-pack.json`, `docs/process/universal-documentation-workflow/schema-coverage-registry.json`, `docs/process/universal-documentation-workflow/artifact-inventory.json`, `docs/process/universal-documentation-workflow/validation-command-catalog.json` | Process Owner | `npm run validate:documentation-profile` |
| `task-review-change-impact` | Проанализировать влияние изменения на артефакты документации | `documentation_operations` | `governance` | `docs/process/universal-documentation-workflow/artifact-inventory.json` | `docs/process/cascading-governance/artifact-dependency-graph.json`, `docs/process/universal-documentation-workflow/decision-queue.json`, `docs/process/universal-documentation-workflow/acceptance-records.json`, `docs/process/universal-documentation-workflow/run-ledger.json` | Process Owner | `npm run validate:workflow-state-ledger` |
| `task-find-source-of-truth-by-decision-type` | Найти источник истины по типу решения | `documentation_operations` | `governance` | `docs/process/universal-documentation-workflow/universal-workflow-core.json` | `docs/process/universal-documentation-workflow/datacanvas-profile.json`, `docs/process/universal-documentation-workflow/artifact-inventory.json`, `docs/process/universal-documentation-workflow/decision-ledger.json`, `docs/process/universal-documentation-workflow/acceptance-records.json` | Process Owner | `npm run validate:documentation-core` |
| `task-find-generated-artifacts` | Найти генерируемые артефакты | `documentation_operations` | `generated` | `docs/navigation/navigation-map.md` | `docs/navigation/documentation-index.json`, `docs/navigation/orphan-docs-report.md`, `docs/navigation/stale-status-report.md` | Documentation Owner | `npm run generate:docs-navigation -- --check` |
| `task-estimate-effort-from-xlsx-backlog` | Подготовить или проверить ПШЕ по рабочей Excel-версии backlog DataCanvas | `documentation_operations` | `governance` | `docs/process/guides/datacanvas-excel-backlog-sync.md` | `docs/product/sources/README.md`, `docs/product/sources/product-source-registry.json`, `docs/product/analysis/documentation-consistency-audit/agent-launch-p1-effort-estimation.md`, `docs/product/analysis/documentation-consistency-audit/sprint-candidate-plan.md`, `docs/product/analysis/documentation-consistency-audit/validation-evidence.md`, `docs/architecture/schemas/artifact-registry.json` | Product Owner / Implementation Team | `npm run validate:xlsx-backlog` |
| `task-recover-xlsx-opml-jira` | Проверить или восстановить цепочку XLSX -> OPML -> Jira import для DataCanvas | `documentation_operations` | `governance` | `docs/plans/datacanvas-xlsx-opml-jira-recovery-plan.md` | `docs/product/sources/xlsx-opml-jira-recovery-index.json`, `docs/product/sources/product-source-registry.json`, `docs/process/guides/datacanvas-excel-backlog-sync.md`, `docs/process/cascading-governance/jira-field-mapping-request.json`, `docs/process/cascading-governance/jira-import-package-manifest.json`, `docs/product/analysis/documentation-consistency-audit/confluence-import-map.md` | Product Owner / Process Owner / Delivery/GitOps Lead | `npm run validate:xlsx-backlog && npm run validate:jira-field-mapping` |

## Источники Истины

- `docs/navigation/navigation-source.json`
- `docs/architecture/schemas/artifact-registry.json`
- `docs/architecture/schemas/artifact-hash-manifest.json`
- `docs/process/current/process-registry.md`
- `docs/release/mvp-release-evidence-pack.json`

## Текущие Указатели

| Указатель | Значение |
|---|---|
| `current_sprint` | `SPRINT-2026-W26` |
| `current_release` | `RC-2026-W26-G9-MVP-FIXTURE` |
| `current_process_version` | `0.1.0` |
| `current_accepted_bmc` | `docs/product/bmc/bmc-v0.2.md` |
| `current_uat_state` | `accepted_real_uat` |
| `current_main_commit` | `ee7fe4f18ba6f5aec5bb77e0096dcb6b3e0a57eb` |
| `current_release_evidence` | `docs/release/mvp-release-evidence-pack.json` |

## Evidence Hub И Registry

- Evidence hub: `docs/knowledge/evidence-index.md`
- Artifact registry: `docs/architecture/schemas/artifact-registry.json`
- Hash manifest: `docs/architecture/schemas/artifact-hash-manifest.json`
- Documentation index: `docs/navigation/documentation-index.json`
