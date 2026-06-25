# ADR-051: Plan Completion Audit Gate

Дата: 2026-06-22
Статус: accepted

## Контекст

План DataCanvas содержит Definition of Done для всего процесса. Без отдельного machine-readable audit gate есть риск закрыть цель по частичным артефактам, не доказав real UAT, pilot acceptance и process portability acceptance.

## Решение

Добавить:

- `docs/process/audits/plan-completion-audit.json`
- `docs/process/audits/plan-completion-audit.md`
- `schemas/plan-completion-audit.schema.json`
- `scripts/validate-plan-completion-audit.mjs`

Audit остается `blocked_pending_external`, пока отсутствуют real UAT export, `human-review-session-real.json`, pilot report, portability notes и commit/PR evidence.

## Последствия

Закрытие цели становится проверяемым requirement-by-requirement, а не основанным на общем ощущении прогресса.

## Валидация

- `npm run validate:plan-completion-audit`
- `npm test`
