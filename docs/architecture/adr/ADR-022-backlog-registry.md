# ADR-022: Backlog Registry

Дата: 2026-06-22
Статус: accepted

## Контекст

План DataCanvas требует отдельные backlog-контуры: Product, Requirements, Technical, Eval, Process и Sprint Backlog. До этого часть контуров существовала как Markdown/JSON, но не было единого machine-readable registry и проверки, что каждый контур доступен для Sprint Planning.

## Решение

Добавить `docs/product/backlog/backlog-registry.json` и `scripts/validate-backlog-registry.mjs`.

Backlog registry фиксирует:

- идентификатор контура;
- source path;
- owner role;
- допустимые ID prefixes;
- обязательность для Sprint Planning.

## Последствия

- Sprint Planning получает проверяемый набор backlog-контуров.
- Новый backlog-контур должен быть добавлен в registry.
- Каждый sprint evidence folder должен иметь `sprint-backlog.md`.
