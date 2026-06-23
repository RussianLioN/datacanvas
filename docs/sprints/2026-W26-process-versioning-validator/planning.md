# Planning

Версия процесса: 0.1.0

## Контекст

S18 оставил следующий безопасный шаг: проверить, что `current/`, `versions/` и changelog доказывают, какая версия процесса применялась к каждому новому спринту. До этого `process_version` в sprint evidence был строкой без независимой проверки.

## Scope

В scope входят:

- JSON Schema для manifest версии процесса;
- version manifest `0.1.0`;
- snapshot процесса `0.1.0`;
- validator process versioning;
- подключение к `npm test`, CI, bootstrap и artifact registry;
- sprint evidence.

Вне scope:

- создание новой версии процесса;
- миграция старых спринтов на другую версию;
- автоматическая генерация changelog.
