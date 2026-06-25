# ADR-043: Real UAT Runtime Import Gate

Дата: 2026-06-22
Статус: accepted

## Контекст

Interactive review runtime уже умеет экспортировать state JSON, но процесс пока не задает проверяемый путь от этого export к `human-review-session-real.json`. Без import gate команда может случайно принять fixture или placeholder как real UAT evidence.

## Решение

Добавить `docs/product/ux/real-uat-runtime-import.json`, guide и validator `scripts/validate-real-uat-import.mjs`.

Validator по умолчанию проверяет readiness. Реальный импорт запускается только с явным `--input` и требует:

- `status=recorded_real_user`;
- `session_kind=real_user`;
- `current_state=approved`;
- `export_allowed=true`;
- actions `submit_for_review`, `comment`, `record_decision`, `export`;
- отсутствие `TO_BE_FILLED`, fixture actors и interactive placeholder actors.

## Последствия

Real UAT остается внешним шагом, но теперь есть контролируемый способ импортировать ее результат в процессный artifact. Цель не считается завершенной, пока реальная сессия не проведена и pilot gate не сформирован.

## Валидация

- `npm run validate:real-uat-import`
- `npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json`
- `npm test`
