# ADR-004: Bootstrap Validator

Статус: accepted
Дата: 2026-06-22

## Контекст

На раннем этапе DataCanvas нет выбранного application stack, но процесс требует воспроизводимой проверки обязательных артефактов, JSON-файлов и ключевых invariants.

## Решение

Использовать `scripts/validate-bootstrap-artifacts.sh` как bootstrap validator. Скрипт опирается на shell и `jq`, проверяет наличие обязательных файлов, JSON parse и базовые process/security/architecture invariants.

## Последствия

- CI и локальная проверка используют один и тот же validator.
- Это не полноценная JSON Schema validation.
- После выбора application stack нужно добавить полноценный schema validator и расширить CI.
