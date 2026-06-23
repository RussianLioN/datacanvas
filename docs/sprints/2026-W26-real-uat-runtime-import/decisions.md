# Decisions

## DEC-001

Validator по умолчанию проверяет только readiness, чтобы `npm test` не требовал отсутствующего real UAT input.

## DEC-002

Генерация `human-review-session-real.json` доступна только с явным `--input` и только для `recorded_real_user`.
