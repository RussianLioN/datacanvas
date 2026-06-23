# Process Change Candidates

Версия процесса: 0.1.0

## Candidate

Добавить в Definition of Done процесса правило: каждый новый `ART-*` должен быть добавлен в artifact registry, иметь существующий путь и ссылаться на sprint evidence.

## Метрика Успеха

`npm run validate:artifact-registry` падает при пропущенном ID, несуществующем пути или неизвестном `sprint_id`.
