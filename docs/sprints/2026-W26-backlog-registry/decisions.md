# Decisions

Версия процесса: 0.1.0

## DEC-022-001

Backlog contours управляются через `backlog-registry.json`.

Причина: Sprint Planning должен видеть все источники работы, а не только Product Backlog.

## DEC-022-002

Registry проверяет существование источников, но не парсит каждую Markdown-таблицу.

Причина: текущий инкремент закрывает управляемость контуров; item-level backlog validation выделяется в будущий шаг.
