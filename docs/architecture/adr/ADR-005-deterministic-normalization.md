# ADR-005: Deterministic Normalization

Статус: accepted
Дата: 2026-06-22

## Контекст

DataCanvas получает входной пакет от другого агента, который считается недоверенным. До prompt assembly и будущего LLM-вызова нужен отдельный проверяемый слой нормализации.

## Решение

Нормализация выполняется детерминированным скриптом `scripts/normalize-input-package.mjs`. Скрипт читает `InputPackageSchema`-совместимый пакет, создает `NormalizedDataSchema`-совместимый output и `TraceManifest`.

## Последствия

- Входные `instructions` остаются недоверенными данными и не становятся инструкциями агента.
- TraceManifest связывает input hash и normalized output hash.
- Будущий `PresentationSpec` должен строиться только из validated normalized data.
