# ADR-052: Pilot Execution Handoff

Дата: 2026-06-22

## Статус

Accepted

## Контекст

Completion audit показывает, что DataCanvas нельзя считать завершенным без real UAT, pilot report, portability notes и commit/PR evidence. Pilot gate readiness фиксирует блокеры, но команде нужен отдельный порядок проведения pilot run после real UAT.

## Решение

Добавить `docs/release/pilot-execution-handoff.json` и человекочитаемый `docs/release/pilot-execution-handoff.md`. Handoff описывает entry criteria, pilot steps, required outputs, stop conditions и validation commands.

Добавить `scripts/validate-pilot-execution-handoff.mjs`, который проверяет:

- handoff соответствует `schemas/pilot-execution-handoff.schema.json`;
- все entry criteria остаются blocking до pilot;
- external pilot evidence отсутствует до реального запуска;
- completion audit остается `blocked_pending_external`;
- handoff не подменяет G10/G11 acceptance.

## Последствия

Pilot run становится воспроизводимым следующим внешним шагом. При этом процесс не закрывает G10/G11 без фактических external artifacts.
