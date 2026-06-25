# ADR-047: Real UAT Operator Handoff

Дата: 2026-06-22
Статус: accepted

## Контекст

G9 MVP acceptance требует настоящую human review/UAT session. Readiness gate и runtime import gate уже подготовлены, но оператору нужен единый handoff: кто участвует, какие preflight checks обязательны, какие действия должны попасть в runtime export и когда сессию нужно остановить.

## Решение

Добавить `docs/product/ux/real-uat-operator-handoff.json`, человекочитаемый guide `docs/product/ux/real-uat-operator-handoff.md`, схему `schemas/real-uat-operator-handoff.schema.json` и validator `scripts/validate-real-uat-operator-handoff.mjs`.

Handoff остается `ready_for_real_operator_run` и не считается доказательством проведенной UAT-сессии.

## Последствия

Запуск real UAT становится воспроизводимым и проверяемым. G9 остается pending до появления `docs/product/ux/human-review-session-real.json`.

## Валидация

- `npm run validate:real-uat-operator-handoff`
- `npm test`
