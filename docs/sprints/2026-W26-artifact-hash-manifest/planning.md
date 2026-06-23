# Planning

## Цель

Сделать контроль целостности артефактов воспроизводимым без ручной сверки.

## Scope

В sprint включены schema, generator, validator, ADR, registry update, bootstrap update и evidence pack.

## Out Of Scope

- Подпись артефактов ключом.
- Удаленное хранилище attestations.
- Полная source -> sprint decision цепочка.

## Done When

- `npm run generate:golden` создает `docs/architecture/schemas/artifact-hash-manifest.json`.
- `npm run validate:artifact-hashes` сверяет SHA-256 для зарегистрированных артефактов.
- `npm test` проходит без регрессий.
