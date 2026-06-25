# Decisions

- `validate-real-uat-import -- --input ... --dry-run` является проверкой без записи.
- Запись `human-review-session-real.json` выполняется через `prepare:real-uat-session` отдельным явным шагом.
- Dry-run не закрывает completion audit и не заменяет real UAT.
