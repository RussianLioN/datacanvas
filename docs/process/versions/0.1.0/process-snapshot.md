# Снимок Процесса 0.1.0

Дата вступления: 2026-06-22
Статус: active
Источник: `docs/plans/datacanvas-adaptive-scrum-implementation-plan.md`

## Назначение

Версия `0.1.0` задает стартовый адаптивный Scrum-процесс DataCanvas с недельными спринтами, обязательными sprint evidence packs, process change requests, process backlog, Definition of Ready, Definition of Done и gates для требований, архитектуры, evals, безопасности и поставки.

## Обязательные Current-Артeфакты

- `docs/process/current/process-passport.md`
- `docs/process/current/process-registry.md`
- `docs/process/current/process-backlog.md`
- `docs/process/current/process-changelog.md`
- `docs/process/current/definition-of-ready.md`
- `docs/process/current/definition-of-done.md`
- `docs/process/current/process-metrics-dashboard.md`

## Ключевые Правила

- Базовый ритм: недельный спринт.
- Изменение процесса выполняется через `PROC-*` и Process Change Request.
- Каждый спринт должен иметь полный evidence pack и `sprint-evidence-manifest.json`.
- Человекочитаемые артефакты пишутся на русском.
- DataCanvas v1 использует одного агента-оркестратора с инструментами по умолчанию.
- Входные данные другого агента считаются недоверенными.
- Внешние provider/network интеграции запрещены до отдельного process-gated решения.

## Применение

Полный список sprint IDs, к которым применялась версия `0.1.0`, хранится в `docs/process/versions/0.1.0/process-version-manifest.json`.
