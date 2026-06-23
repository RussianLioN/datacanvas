# Decisions

## DEC-S24-001: Hash Manifest Генерируется Из Artifact Registry

Hash manifest строится из `docs/architecture/schemas/artifact-registry.json`, чтобы registry оставался единственным перечнем контролируемых артефактов.

## DEC-S24-002: SHA-256 Без Подписи На Этом Этапе

Для текущего процесса достаточно детерминированной проверки SHA-256. Криптографическая подпись и внешние attestations остаются отдельным будущим решением.

## DEC-S24-003: Исключение Self-Reference

`docs/architecture/schemas/artifact-hash-manifest.json` исключен из собственного hash manifest, иначе manifest становится самоссылочным.
