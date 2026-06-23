# ADR-006: Mock PresentationSpec Generator

Статус: accepted
Дата: 2026-06-22

## Контекст

До подключения LLM нужно проверить контракт `PresentationSpec`, claim map и eval cases детерминированно.

## Решение

Использовать `scripts/generate-presentation-spec.mjs` для mock generation из normalized data. Скрипт создает `tests/golden/presentation-spec-minimal.json` и `tests/golden/claim-map-minimal.json`.

## Последствия

- `PresentationSpec` contract проверяется до LLM.
- Каждый claim в mock spec связан с `FACT-*`.
- Будущий LLM должен проходить те же schema и claim-map проверки.

