# ADR-024: Artifact Hash Manifest

Дата: 2026-06-22
Статус: accepted

## Контекст

План DataCanvas требует, чтобы каждый артефакт имел hash, owner, статус и sprint link. `artifact-registry.json` уже фиксирует owner/status/sprint link, но не проверяет содержимое файлов через SHA/hash.

## Решение

Добавить генерируемый `docs/architecture/schemas/artifact-hash-manifest.json` и проверку `scripts/validate-artifact-hash-manifest.mjs`.

Manifest строится из `artifact-registry.json` и содержит `sha256` для каждого зарегистрированного артефакта, кроме явно исключенного самореферентного hash manifest.

## Последствия

- Изменение зарегистрированного артефакта требует регенерации hash manifest.
- `npm test` проверяет, что hash manifest соответствует текущему registry и файлам.
- Artifact registry остается источником owner/status/sprint link, а hash manifest отвечает за целостность содержимого.
