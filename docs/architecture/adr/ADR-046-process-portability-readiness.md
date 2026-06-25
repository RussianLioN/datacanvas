# ADR-046: Process Portability Readiness

Дата: 2026-06-22
Статус: accepted

## Контекст

Sprint 9 требует проверить переносимость процесса и подготовить `migration notes` и `reusable templates`. До pilot run нельзя утверждать G11, но можно подготовить проверяемый portability pack.

## Решение

Добавить `docs/process/portability/process-portability-pack.json`, migration notes template, reusable templates и validator `scripts/validate-process-portability.mjs`.

Pack остается `ready_for_pilot_validation` и явно зависит от `docs/release/pilot-report.md`.

## Последствия

Процесс становится переносимым как набор шаблонов и правил, но G11 остается pending до реального pilot feedback.

## Валидация

- `npm run validate:process-portability`
- `npm test`
