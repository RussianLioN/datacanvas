# Process Change Candidates

Версия процесса: 0.1.0

## Candidate

Добавить в процесс обязательное правило: перед закрытием спринта его `sprint_id` должен быть добавлен в manifest активной версии процесса.

## Метрика Успеха

`npm run validate:process-versioning` падает, если новый sprint evidence отсутствует в `applied_sprint_ids`.
