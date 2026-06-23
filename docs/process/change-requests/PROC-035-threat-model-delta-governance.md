# PROC-035: Threat Model Delta Governance

ID: `PROC-035`  
Статус: accepted  
Автор: Codex  
Дата: 2026-06-22  
Целевая версия процесса: 0.1.0

## Проблема

План DataCanvas требует `threat-model-delta.md` или явную security delta запись в каждом спринте. До S35 это требование не было исполняемым для всех sprint folders.

## Причина Изменения

Без машинной проверки новый sprint может быть закрыт без security impact decision. Это создает риск скрытого расширения trust boundaries, export surface или обработки пользовательских данных.

## Предлагаемое Изменение

Принять `docs/architecture/security/threat-model-delta-manifest.json` как обязательный process gate:

- каждый `docs/sprints/*` должен иметь entry в manifest;
- entry должен иметь `delta_recorded`, `no_security_impact` или `requires_review`;
- каждый entry должен ссылаться на существующие evidence paths;
- новый sprint folder без entry ломает `npm run validate:threat-model-delta`;
- gate включается в `npm test` и CI.

## Влияние

- Затронутые роли: Security/Privacy Lead, Scrum Master, Process Owner, QA/Evals Lead.
- Затронутые артефакты: threat model, sprint evidence, CI, process changelog, artifact registry.
- Затронутые спринты: все существующие и будущие sprint folders.
- Риск для текущего Sprint Goal: низкий, потому что gate использует существующие evidence paths.
- Влияние на CI/evidence: добавляется `npm run validate:threat-model-delta`.

## Метрика Успеха

100% каталогов `docs/sprints/*` имеют coverage entry в `threat-model-delta-manifest.json`, и `npm run validate:threat-model-delta` проходит.

## План Проверки

```bash
npm run validate:threat-model-delta
npm run validate:bootstrap
npm test
```

## Rollback

Удалить `validate:threat-model-delta` из `npm test` и CI, вернуть section 9 plan coverage в `partial`, оставить только S21 explicit `threat-model-delta.md` как обязательный artifact до нового PCR.

## Решение

Статус решения: accepted.  
Дата решения: 2026-06-22.  
Решающий владелец: Process Owner.
