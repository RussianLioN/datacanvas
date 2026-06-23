# ADR-009: LLM Schema Boundary

Статус: accepted
Дата: 2026-06-22

## Контекст

Следующий этап будет готовить подключение LLM. Нужно заранее ограничить модельный вход и выход схемами и prompt contract.

## Решение

Будущий LLM-вызов разрешен только через `LLMRequest` и `LLMResult`. Успешный результат должен содержать `PresentationSpec`, который затем проходит обычные schema, claim-map, renderer и export checks.

## Последствия

- LLM не получает upstream instructions как инструкции.
- LLM не генерирует HTML/PDF/PNG.
- Любое расширение tool permissions требует ADR/PCR.

