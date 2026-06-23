# Review

## Что Изменено

- Добавлен генерируемый SHA-256 manifest для зарегистрированных артефактов.
- Добавлен валидатор, который сверяет schema, registry, artifact id и фактические hashes.
- Bootstrap и CI расширены новым gate.

## Acceptance Evidence

- `npm run validate:artifact-hashes`
- `npm run validate:artifact-registry`
- `npm run validate:bootstrap`
- `npm test`

## Ограничения

Manifest не доказывает авторство изменения и не заменяет review. Он фиксирует целостность текущего набора файлов.
