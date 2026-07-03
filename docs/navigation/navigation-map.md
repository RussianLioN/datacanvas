# Карта Навигации Документации

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / Карта навигации

Статус: generated
Источник: `docs/navigation/navigation-source.json`

## Быстрые Маршруты

### Бизнесовая карта продукта

Vision, BMC, stories, требования, backlog, roadmap, гипотезы и traceability.

- [Продукт DataCanvas](../product/README.md) - Product Owner, `active`.
- [Видение продукта DataCanvas](../product-vision.md) - Product Owner, `active`.
- [DataCanvas BMC Package](../product/bmc/README.md) - Product Owner, `accepted`.
- [Каталог пользовательских историй DataCanvas](../stories.md) - Product Owner, `active`.
- [Требования DataCanvas](../product/requirements/README.md) - Product Owner, `active`.
- [Бизнес-требования v0.2](../product/requirements/business-requirements.md) - Product Owner, `draft`.
- [Пользовательские истории v0.1](../product/requirements/user-stories.md) - Product Owner, `draft`.
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
- [Процесс DataCanvas](../process/README.md) - Process Owner, `active`.
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

| ID | Маршрут | Группа | Старт | Дальше | Владелец | Проверка |
|---|---|---|---|---|---|---|
| `role-product-owner` | Product Owner | `business` | `docs/product/README.md` | `docs/product-vision.md`, `docs/product/bmc/README.md`, `docs/stories.md`, `docs/product/requirements/business-requirements.md`, `docs/product/requirements/non-functional-requirements.md`, `docs/product/requirements/acceptance-criteria.md`, `docs/product/sources/README.md`, `docs/product/change-orders/README.md`, `docs/product/revisions/co-2026-001-source-revision/revision-ledger.md`, `docs/product/analysis/README.md`, `docs/product/specs/README.md`, `docs/product/backlog/product-backlog.md`, `docs/product/roadmap/roadmap-v0.1.md`, `docs/product/hypotheses/hypothesis-board.md` | Product Owner | `npm run validate:docs-navigation` |
| `role-business-analyst` | Business Analyst | `business` | `docs/product/analysis/README.md` | `docs/product/sources/README.md`, `docs/product/change-orders/README.md`, `docs/product/analysis/ba/business-needs.md`, `docs/product/analysis/ba/business-rules.md`, `docs/product/analysis/ba/business-requirements-delta.md`, `docs/product/requirements/business-requirements.md` | Product Owner | `npm run validate:docs-navigation` |
| `role-system-analyst` | System Analyst | `technical` | `docs/architecture/system-analysis/README.md` | `docs/product/sources/README.md`, `docs/product/specs/README.md`, `docs/architecture/system-analysis/srs-v0.1.md`, `docs/architecture/system-analysis/datacanvas-lifecycle-state-model.md`, `docs/architecture/system-analysis/data-contract-map.md`, `docs/architecture/system-analysis/error-taxonomy.md` | AI Agent Architect | `npm run validate:docs-navigation` |
| `role-process-owner` | Process Owner | `governance` | `docs/process/README.md` | `docs/process/current/process-registry.md`, `docs/process/current/definition-of-ready.md`, `docs/process/current/definition-of-done.md`, `docs/process/cascading-governance/README.md` | Process Owner | `npm run validate:docs-navigation` |
| `role-delivery-lead` | Delivery/GitOps Lead | `delivery` | `docs/release/README.md` | `docs/release/commit-pr-evidence.md`, `docs/release/mvp-release-evidence-pack.md`, `docs/knowledge/evidence-index.md` | Delivery/GitOps Lead | `npm run validate:docs-navigation` |
| `role-agent` | AI systems engineer | `governance` | `AGENTS.md` | `docs/process/methodology/README.md`, `docs/navigation/navigation-source.json`, `docs/project-map.md` | Process Owner | `npm run validate:docs-navigation` |

## Маршруты По Задачам

| ID | Маршрут | Группа | Старт | Дальше | Владелец | Проверка |
|---|---|---|---|---|---|---|
| `task-understand-product` | Понять продукт | `business` | `docs/product/README.md` | `docs/product-vision.md`, `docs/product/bmc/README.md`, `docs/stories.md`, `docs/product/requirements/README.md`, `docs/product/requirements/business-requirements.md`, `docs/product/requirements/non-functional-requirements.md`, `docs/product/requirements/acceptance-criteria.md`, `docs/product/backlog/product-backlog.md`, `docs/product/roadmap/roadmap-v0.1.md`, `docs/product/hypotheses/hypothesis-board.md` | Product Owner | `npm run validate:docs-navigation` |
| `task-find-product-sources` | Найти исходные документы продукта | `business` | `docs/product/sources/README.md` | `docs/product/sources/product-source-registry.json`, `docs/product/sources/source-audit.md`, `docs/product-vision.md`, `docs/product/change-orders/co-2026-001-a2a-first-priority.md`, `docs/stories.md` | Product Owner | `npm run validate:product-sources` |
| `task-review-source-revision` | Проверить ревизию исходных документов | `business` | `docs/product/revisions/co-2026-001-source-revision/revision-ledger.md` | `docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json`, `docs/product/revisions/co-2026-001-source-revision/revision-approval-state.json`, `docs/product/revisions/co-2026-001-source-revision/revision-approval-log.md`, `docs/product/sources/source-audit.md` | Product Owner | `npm run validate:change-set-approval` |
| `task-approve-proposed-edit` | Согласовать предложенную правку | `business` | `docs/product/revisions/co-2026-001-source-revision/revision-approval-log.md` | `docs/product/revisions/co-2026-001-source-revision/revision-approval-state.json`, `docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json` | Product Owner | `npm run validate:revision-approval-state` |
| `task-check-accepted-change-order-impact` | Проверить влияние принятого изменения | `business` | `docs/product/change-orders/co-2026-001-a2a-first-priority.md` | `docs/product/sources/source-audit.md`, `docs/product/revisions/co-2026-001-source-revision/revision-ledger.md`, `docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json` | Product Owner | `npm run validate:accepted-change-order-impact` |
| `task-find-co-2026-001-priority-context` | Найти контекст приоритета CO-2026-001 | `business` | `docs/product/change-orders/co-2026-001-a2a-first-priority.md` | `docs/product-vision.md`, `docs/stories.md`, `docs/product/revisions/co-2026-001-source-revision/revision-ledger.md`, `docs/product/requirements/business-requirements.md` | Product Owner | `npm run validate:accepted-change-order-impact` |
| `task-find-current-source-of-truth` | Найти текущий источник истины | `business` | `docs/product/sources/README.md` | `docs/product/sources/product-source-registry.json`, `docs/product/change-orders/co-2026-001-a2a-first-priority.md`, `docs/product-vision.md`, `docs/stories.md` | Product Owner | `npm run validate:product-source-consistency` |
| `task-find-process` | Найти текущий процесс | `governance` | `docs/process/README.md` | `docs/process/current/process-passport.md`, `docs/process/current/process-registry.md`, `docs/process/cascading-governance/README.md` | Process Owner | `npm run validate:docs-navigation` |
| `task-work-with-bmc` | Работать с BMC | `business` | `docs/product/bmc/README.md` | `docs/product/bmc/bmc-v0.2.md`, `docs/product/bmc/manifest.json` | Product Owner | `npm run validate:bmc` |
| `task-review-merge` | Подготовить review/merge | `delivery` | `docs/release/README.md` | `.github/PULL_REQUEST_TEMPLATE.md`, `docs/release/commit-pr-evidence.md` | Delivery/GitOps Lead | `npm test` |
| `task-find-evidence` | Найти evidence/release | `evidence` | `docs/knowledge/evidence-index.md` | `docs/release/mvp-release-evidence-pack.json`, `docs/navigation/documentation-index.json` | Delivery/GitOps Lead | `npm run validate:docs-navigation` |
| `task-find-business-requirements` | Найти бизнес-требования | `business` | `docs/product/requirements/README.md` | `docs/product/requirements/business-requirements.md`, `docs/product/requirements/user-stories.md`, `docs/product/requirements/non-functional-requirements.md`, `docs/product/requirements/acceptance-criteria.md`, `docs/product/requirements/traceability-matrix.json` | Product Owner | `npm run validate:docs-navigation` |
| `task-plan-product-work` | Планировать продуктовую работу | `business` | `docs/product/backlog/README.md` | `docs/product/backlog/product-backlog.md`, `docs/product/roadmap/roadmap-v0.1.md`, `docs/product/hypotheses/hypothesis-board.md`, `docs/product/hypotheses/hypothesis-validation.md` | Product Owner | `npm run validate:docs-navigation` |
| `task-find-technical-docs` | Найти техническую документацию | `technical` | `docs/architecture/README.md` | `docs/product/backlog/technical-backlog.md`, `docs/architecture/schemas/schema-registry.md`, `docs/architecture/security/trust-boundaries.md` | AI Agent Architect | `npm run validate:docs-navigation` |
| `task-find-documentation-methodology` | Найти методику документации | `governance` | `docs/process/methodology/README.md` | `docs/process/methodology/project-documentation-methodology.md`, `docs/process/methodology/documentation-methodology-policy.json`, `docs/process/methodology/traceability-model.json` | Process Owner | `npm run validate:docs-navigation` |
| `task-find-generated-artifacts` | Найти генерируемые артефакты | `generated` | `docs/navigation/navigation-map.md` | `docs/navigation/documentation-index.json`, `docs/navigation/orphan-docs-report.md`, `docs/navigation/stale-status-report.md` | Documentation Owner | `npm run generate:docs-navigation -- --check` |

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
| `current_main_commit` | `f4d2c59558c0387614cc7d1e1c65071ed0a61c05` |
| `current_release_evidence` | `docs/release/mvp-release-evidence-pack.json` |

## Evidence Hub И Registry

- Evidence hub: `docs/knowledge/evidence-index.md`
- Artifact registry: `docs/architecture/schemas/artifact-registry.json`
- Hash manifest: `docs/architecture/schemas/artifact-hash-manifest.json`
- Documentation index: `docs/navigation/documentation-index.json`
