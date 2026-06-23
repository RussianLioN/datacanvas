# ADR-045: Process Event Log Readiness

Дата: 2026-06-22
Статус: accepted

## Контекст

Метрики `sprint predictability`, `spillover`, `cycle time`, `blocked time`, `process change lead time` и `decision latency` остаются `n/a`, потому что нет журнала реальных событий с timestamps. Без такого журнала команда может начать заполнять delivery metrics вручную и потерять воспроизводимость.

## Решение

Добавить `docs/process/current/process-event-log.json`, schema и validator `scripts/validate-process-event-log.mjs`.

Event log задает обязательные типы событий для будущих измерений, но пока содержит пустой массив `events`. Validator требует, чтобы live metrics оставались `not_available`, пока события не записаны.

## Последствия

Процесс готов к сбору live delivery metrics после real UAT и Sprint Review, но не подделывает измерения до появления фактических timestamps.

## Валидация

- `npm run validate:process-events`
- `npm run validate:process-metrics`
- `npm test`
