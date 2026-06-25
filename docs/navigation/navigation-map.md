# Карта Навигации Документации

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / Карта навигации

Статус: generated
Источник: `docs/navigation/navigation-source.json`

## Быстрые Маршруты

- [Архитектура DataCanvas](../architecture/README.md) - AI Agent Architect, `active`.
- [Evidence Hub DataCanvas](../knowledge/evidence-index.md) - Delivery/GitOps Lead, `active`.
- [Knowledge Base DataCanvas](../knowledge/README.md) - Documentation Owner, `active`.
- [Карта Навигации Документации](navigation-map.md) - Documentation Owner, `generated`.
- [Планы DataCanvas](../plans/README.md) - Process Owner, `active`.
- [Процесс DataCanvas](../process/README.md) - Process Owner, `active`.
- [DataCanvas BMC Package](../product/bmc/README.md) - Product Owner, `accepted`.
- [Продукт DataCanvas](../product/README.md) - Product Owner, `active`.
- [Карта Слоев DataCanvas](../project-map.md) - Documentation Owner, `active`.
- [Документация DataCanvas](../README.md) - Documentation Owner, `active`.
- [Release И Evidence DataCanvas](../release/README.md) - Delivery/GitOps Lead, `active`.
- [Sprint Artifacts DataCanvas](../sprints/README.md) - Scrum Master, `active`.
- [DataCanvas](../../README.md) - Documentation Owner, `active`.

## Маршруты По Ролям

| ID | Маршрут | Старт | Дальше | Владелец | Проверка |
|---|---|---|---|---|---|
| `role-product-owner` | Product Owner | `docs/product/README.md` | `docs/product/bmc/README.md`, `docs/product/vision/vision-v0.1.md`, `docs/stories.md` | Product Owner | `npm run validate:docs-navigation` |
| `role-process-owner` | Process Owner | `docs/process/README.md` | `docs/process/current/process-registry.md`, `docs/process/current/definition-of-ready.md`, `docs/process/current/definition-of-done.md` | Process Owner | `npm run validate:docs-navigation` |
| `role-delivery-lead` | Delivery/GitOps Lead | `docs/release/README.md` | `docs/release/commit-pr-evidence.md`, `docs/release/mvp-release-evidence-pack.md`, `docs/knowledge/evidence-index.md` | Delivery/GitOps Lead | `npm run validate:docs-navigation` |
| `role-agent` | AI systems engineer | `AGENTS.md` | `docs/navigation/navigation-source.json`, `docs/navigation/navigation-map.md`, `docs/project-map.md` | Process Owner | `npm run validate:docs-navigation` |

## Маршруты По Задачам

| ID | Маршрут | Старт | Дальше | Владелец | Проверка |
|---|---|---|---|---|---|
| `task-understand-product` | Понять продукт | `docs/product/README.md` | `docs/product-vision.md`, `docs/product/bmc/README.md`, `docs/stories.md` | Product Owner | `npm run validate:docs-navigation` |
| `task-find-process` | Найти текущий процесс | `docs/process/README.md` | `docs/process/current/process-passport.md`, `docs/process/current/process-registry.md` | Process Owner | `npm run validate:docs-navigation` |
| `task-work-with-bmc` | Работать с BMC | `docs/product/bmc/README.md` | `docs/product/bmc/bmc-v0.2.md`, `docs/product/bmc/manifest.json` | Product Owner | `npm run validate:bmc` |
| `task-review-merge` | Подготовить review/merge | `docs/release/README.md` | `.github/PULL_REQUEST_TEMPLATE.md`, `docs/release/commit-pr-evidence.md` | Delivery/GitOps Lead | `npm test` |
| `task-find-evidence` | Найти evidence/release | `docs/knowledge/evidence-index.md` | `docs/release/mvp-release-evidence-pack.json`, `docs/navigation/documentation-index.json` | Delivery/GitOps Lead | `npm run validate:docs-navigation` |

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
| `current_main_commit` | `f643dcca1108c0fb92b76753c67b5a0479a0839d` |
| `current_release_evidence` | `docs/release/mvp-release-evidence-pack.json` |

## Evidence Hub И Registry

- Evidence hub: `docs/knowledge/evidence-index.md`
- Artifact registry: `docs/architecture/schemas/artifact-registry.json`
- Hash manifest: `docs/architecture/schemas/artifact-hash-manifest.json`
- Documentation index: `docs/navigation/documentation-index.json`
