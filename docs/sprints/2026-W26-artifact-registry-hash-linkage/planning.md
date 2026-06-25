# Planning

## Scope

Инкремент закрывает registry/hash governance gap. Он не переносит SHA-256 внутрь каждой registry entry, потому что registry сам является registered artifact и при встроенных hashes возник бы самореферентный конфликт.

## Acceptance Criteria

- `artifact-registry.json` явно указывает `artifact-hash-manifest.json`.
- Registry validator проверяет coverage всех registered artifacts.
- Hash manifest остается generated artifact.
- `npm test` проходит после пересборки hash manifest.
