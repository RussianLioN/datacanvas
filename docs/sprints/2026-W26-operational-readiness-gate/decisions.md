# Decisions

## DEC-S25-001: Operational Readiness Как Manifest-Gate

Operational readiness фиксируется JSON manifest, чтобы gate можно было валидировать автоматически и ссылаться на него из evidence packs.

## DEC-S25-002: Pre-MVP Runbook

Runbook покрывает artifact-first режим до production runtime. Production on-call инструкции будут отдельным инкрементом после появления runtime.

## DEC-S25-003: Smoke Check По Умолчанию

Базовый smoke check для текущего состояния проекта — `npm test`, потому что он запускает deterministic generation и все validation gates.
