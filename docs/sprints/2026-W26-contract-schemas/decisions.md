# Decisions

Версия процесса: 0.1.0

## DEC-023-001

Недостающие контракты фиксируются как JSON Schema и минимальные fixtures.

Причина: наличие только Markdown/YAML-документа недостаточно для воспроизводимого gate.

## DEC-023-002

ToolAllowlist schema проверяет deny-by-default через JSON fixture, а YAML-документ проверяется на наличие `default_policy: deny`.

Причина: в проекте нет YAML parser dependency, а добавлять зависимость ради одного gate сейчас не требуется.
