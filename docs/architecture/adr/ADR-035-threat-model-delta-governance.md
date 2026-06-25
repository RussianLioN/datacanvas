# ADR-035: Threat Model Delta Governance

## Статус

Accepted

## Контекст

План DataCanvas требует `threat-model-delta.md` в каждом спринте. После security foundation pack был только один explicit delta, а ранние и последующие спринты не имели единого backfill/forward контроля.

## Решение

Добавить `docs/architecture/security/threat-model-delta-manifest.json`, схему `schemas/threat-model-delta-manifest.schema.json` и валидатор `scripts/validate-threat-model-delta.mjs`.

Валидатор проверяет:

- каждый каталог `docs/sprints/*` имеет coverage entry;
- каждый entry указывает существующие evidence paths;
- `delta_recorded` не может иметь нулевой security impact;
- будущий sprint folder ломает проверку, пока не добавлен в manifest.

## Последствия

- Historical backfill становится явным и проверяемым.
- Для будущих спринтов появляется blocking forward rule.
- Backfill основан на существующих sprint evidence, а не на отдельной исторической security встрече.
