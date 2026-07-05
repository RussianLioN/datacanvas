# Карта Слоев DataCanvas

Навигация: [DataCanvas](../README.md) / [Документация](README.md) / Карта слоев

Статус: active
Владелец: Documentation Owner
Проверка: `npm run validate:docs-navigation`

## Слои

| Слой | Основной вход | Назначение | Владелец |
|---|---|---|---|
| Продукт | [docs/product/README.md](product/README.md) | Vision, stories, backlog, roadmap и требования. | Product Owner |
| Процесс | [docs/process/README.md](process/README.md) | Scrum-процесс, Definition of Ready/Done, PCR и метрики. | Process Owner |
| Архитектура | [docs/architecture/README.md](architecture/README.md) | ADR, схемы, RAG/LLM/renderer/runtime решения и риски. | AI Agent Architect |
| BMC | [docs/product/bmc/README.md](product/bmc/README.md) | Accepted BMC, source map, derived package и проверки. | Product Owner |
| UX/UAT | [docs/product/ux/](product/ux/) | Review runtime, UAT contracts, operator handoff и real UAT evidence. | QA/UAT Lead |
| Release/evidence | [docs/release/README.md](release/README.md) | Release evidence, PR evidence, pilot handoff и readiness. | Delivery/GitOps Lead |
| Sprint artifacts | [docs/sprints/README.md](sprints/README.md) | Sprint goal, backlog, review, retro и evidence manifests. | Scrum Master |
| Security/trust boundaries | [docs/architecture/security/](architecture/security/) | Trust boundaries, leakage guards, threat model и tool allowlists. | Security/Privacy Lead |
| Generated artifacts | [artifacts/README.md](../artifacts/README.md) | Generated HTML/PDF/PNG и manual evidence exports. | Delivery/GitOps Lead |
| Schemas/scripts/tests | [schemas/README.md](../schemas/README.md) | JSON Schema, generators, validators, fixtures и gates. | Development Team |

## Слой Универсальной Методики

| Уровень | Основной вход | Назначение | Владелец |
|---|---|---|---|
| Универсальная методика | [docs/process/universal-documentation-workflow/README.md](process/universal-documentation-workflow/README.md) | Переносимое ядро workflow без продуктового смысла DataCanvas. | Process Owner |
| Профиль DataCanvas | [datacanvas-profile.json](process/universal-documentation-workflow/datacanvas-profile.json) | Подключение универсальной методики к текущему репозиторию и источникам истины DataCanvas. | Process Owner |
| Экземпляр изменения | [workflow-state.json](process/universal-documentation-workflow/workflow-state.json) | Конкретный `run_id`, состояние, очередь решений, журнал запуска и validation evidence. | Process Owner |

## Правило Индексации

`docs/navigation/navigation-source.json` классифицирует документы по lifecycle, owner, visibility и data class. Неизвестные документы считаются confidential и не попадают в public navigation/search corpus.
