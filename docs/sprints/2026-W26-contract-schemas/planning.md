# Planning

Версия процесса: 0.1.0

## Контекст

S22 оставил следующий безопасный шаг: добавить недостающие contract schemas. План требует версионировать контракты, а audit показывал gap по `RenderRequest`, `ProcessChangeRequest`, `ToolAllowlist` и `TraceContract`.

## Scope

В scope входят:

- четыре JSON Schema;
- минимальные fixtures;
- validator;
- ADR;
- подключение к gates, registry, audit и process versioning.

Вне scope:

- runtime implementation новых API;
- YAML parser для полного `tool-allowlist.yaml`;
- генерация trace contract из Markdown.
