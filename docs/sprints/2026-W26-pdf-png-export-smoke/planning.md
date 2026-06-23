# Planning

## Цель

Закрыть smoke-level gap по PDF/PNG export без тяжелой зависимости на browser automation.

## Scope

В scope входят generated PDF/PNG smoke artifacts, manifest, schema, generator, validator, ADR, registry, audit и evidence.

## Out Of Scope

- Полноценный PDF renderer.
- Screenshot regression.
- Выбор browser automation toolchain.
- Interactive review UI.

## Done When

- `npm run validate:export-smoke` проходит.
- `npm test` проходит.
- Artifact registry и hash manifest включают PDF/PNG smoke artifacts.
