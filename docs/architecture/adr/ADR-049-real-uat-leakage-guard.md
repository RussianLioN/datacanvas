# ADR-049: Real UAT Leakage Guard

Дата: 2026-06-22
Статус: accepted

## Контекст

После real UAT появятся новые artifacts: exported runtime state и `human-review-session-real.json`. Они могут содержать данные реального участника, поэтому должны попасть в `data-leakage-manifest.json` до принятия G9/G10.

## Решение

Добавить conditional guard `docs/architecture/security/real-uat-leakage-guard.json` и расширить `scripts/validate-data-leakage.mjs`: если guarded file существует, он обязан быть scan target с `data_class=confidential`.

До появления real artifacts guard не требует добавлять отсутствующие файлы в scan targets.

## Последствия

Процесс не сможет случайно принять real UAT artifacts без leakage coverage. G9/G10 остаются pending до фактической UAT и обновления release evidence.

## Валидация

- `npm run validate:data-leakage`
- `npm test`
