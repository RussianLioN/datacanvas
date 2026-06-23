# Decisions

Версия процесса: 0.1.0

## DEC-S9-001

Решение: `provider-allowlist.json` является каноническим machine-readable provider allowlist.

Причина: текущий проект уже использует AJV и JSON Schema, а дополнительная YAML-зависимость не нужна.

## DEC-S9-002

Решение: offline path должен оставлять `model_call` span со статусом `skipped`.

Причина: trace manifest должен показывать, что внешняя модель сознательно не вызывалась, а не просто отсутствует из трассировки.
