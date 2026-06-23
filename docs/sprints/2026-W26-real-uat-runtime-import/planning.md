# Planning

## Цель

Снять процессный риск между browser export и real UAT artifact.

## Ограничения

- Не создавать `human-review-session-real.json` без реального `--input`.
- Не принимать fixture state.
- Не подменять pilot gate локальным readiness artifact.

## Definition Of Done

- Readiness validation проходит без real input.
- Import validation требует явный `--input`.
- Full quality gate проходит.
