# ADR-039: Artifact Registry Hash Linkage

Дата: 2026-06-22
Статус: accepted

## Контекст

План DataCanvas требует, чтобы каждый артефакт имел hash, owner, статус и sprint link. Owner, status и sprint link находятся в `artifact-registry.json`, а SHA-256 хранится в generated `artifact-hash-manifest.json`. До этого registry не фиксировал явную связь с hash manifest.

## Решение

Добавить в `artifact-registry.json` поля:

- `hash_manifest_path`;
- `hash_algorithm`;
- `snapshot_policy`.

`scripts/validate-artifact-registry.mjs` проверяет, что registry связан с hash manifest, алгоритм совпадает, refresh/validation commands заданы, а каждый зарегистрированный артефакт покрыт hash manifest или явным exclusion.

## Последствия

Registry остается источником owner/status/sprint link, hash manifest остается источником SHA-256. Это избегает самореферентного hash-конфликта registry и сохраняет проверяемость всех артефактов.

## Валидация

- `npm run validate:artifact-registry`
- `npm run validate:artifact-hashes`
- `npm run validate:schemas`
- `npm test`
