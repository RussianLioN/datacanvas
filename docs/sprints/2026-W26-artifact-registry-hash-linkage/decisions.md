# Decisions

## DEC-S39-001

Per-artifact SHA-256 хранится в `artifact-hash-manifest.json`, а registry хранит ссылку на manifest и snapshot policy.

## DEC-S39-002

`validate-artifact-registry` проверяет hash coverage, но фактическую сверку SHA-256 оставляет `validate-artifact-hash-manifest`.
