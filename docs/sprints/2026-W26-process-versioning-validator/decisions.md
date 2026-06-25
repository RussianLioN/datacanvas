# Decisions

Версия процесса: 0.1.0

## DEC-019-001

Каждая версия процесса должна иметь `process-version-manifest.json`.

Причина: sprint evidence должен доказывать не только факт выполнения, но и примененную версию процесса.

## DEC-019-002

Snapshot процесса хранится отдельно от `current/`.

Причина: `current/` может измениться после Process Change Request, а historical evidence должно оставаться воспроизводимым.
