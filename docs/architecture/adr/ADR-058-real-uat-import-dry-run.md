# ADR-058: Dry-Run Для Real UAT Import

Дата: 2026-06-22

## Статус

Принято.

## Контекст

Команда `npm run validate:real-uat-import -- --input ...` проверяла exported runtime state и сразу записывала `docs/product/ux/human-review-session-real.json`. Для acceptance evidence это рискованно: оператору нужен предварительный gate без side effect.

## Решение

Добавить флаг `--dry-run` в `scripts/validate-real-uat-import.mjs`.

Новый порядок:

1. Проверить exported runtime state без записи:

```bash
npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
```

2. Проверить будущий session artifact без записи:

```bash
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
```

3. Только после review команды выполнить запись через `prepare:real-uat-session`.

## Последствия

Real UAT acceptance artifact создается отдельным явным шагом. Validation path становится безопаснее для preflight, review и pair-check.

## Проверки

- `npm run validate:real-uat-import`
- `npm run validate:real-uat-operator-handoff`
- `npm run validate:real-uat-preflight`
- `npm test`
