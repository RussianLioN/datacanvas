# ADR-032: Process Metrics Manifest

## Статус

Accepted

## Контекст

План DataCanvas требует quality dashboard и метрики процесса. Был Markdown dashboard, но не было структурного manifest и validation gate, поэтому метрики нельзя было проверять автоматически.

## Решение

Добавить `docs/process/current/process-metrics-manifest.json`, схему `schemas/process-metrics-manifest.schema.json` и валидатор `scripts/validate-process-metrics.mjs`.

## Последствия

- Process metrics становятся проверяемым артефактом.
- Недоступные метрики обязаны иметь причину.
- Live dashboard все еще требует будущего автоматического сбора timestamps из backlog, sprint и UAT artifacts.
