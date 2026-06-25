# Review

## Что Изменено

- Добавлен human review flow с ролями, состояниями и действиями.
- Добавлен UAT script для MVP human review.
- Добавлен validator, который проверяет, что export возможен только после approval.
- Gate подключен к CI и `npm test`.

## Acceptance Evidence

- `npm run validate:uat-human-review`
- `npm run validate:schemas`
- `npm run validate:bootstrap`
- `npm test`

## Ограничения

Это skeleton: интерактивный UI и исполняемый UAT result еще не реализованы.
