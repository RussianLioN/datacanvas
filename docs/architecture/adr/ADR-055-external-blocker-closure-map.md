# ADR-055: External Blocker Closure Map

Дата: 2026-06-22

## Статус

Accepted

## Контекст

Completion audit корректно блокирует завершение плана на внешних evidence: real UAT export/session, pilot report, portability notes и commit/PR evidence. Эти blockers уже имеют отдельные handoffs/templates, но не было единой проверяемой карты их закрытия.

## Решение

Добавить:

- `docs/process/audits/external-blocker-closure-map.json`;
- `docs/process/audits/external-blocker-closure-map.md`;
- `schemas/external-blocker-closure-map.schema.json`;
- `scripts/validate-external-blocker-closure-map.mjs`.

Validator сверяет карту с `plan-completion-audit.json`, проверяет supporting artifacts и не позволяет считать отсутствующие external evidence закрытыми.

## Последствия

Команда получает единый управляемый список оставшихся внешних действий. Goal остается незавершенным до появления фактических evidence.
