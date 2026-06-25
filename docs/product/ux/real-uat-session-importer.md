# Real UAT Session Importer

Цель: после реальной UAT-сессии создать `docs/product/ux/human-review-session-real.json` из exported runtime state без ручного копирования и без использования fixture.

## Readiness Check

```bash
npm run validate:real-uat-session-importer
```

Команда проверяет manifest, схемы и обязательные зависимости. Без `--input` она ничего не пишет.

## Import

После реальной UAT-сессии сохранить export в:

```text
artifacts/manual/real-uat/review-runtime-state-export.json
```

Затем выполнить:

```bash
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json
```

## Dry Run

```bash
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
```

## Stop Conditions

- Export не имеет `status=recorded_real_user`.
- Export не имеет `session_kind=real_user`.
- Export содержит `TO_BE_FILLED`.
- `actor_id` содержит `fixture`, `template`, `sample`, `placeholder` или `interactive-`.
- Export не содержит `submit_for_review`, `comment`, `record_decision`, `export`.
- Generated session не проходит `schemas/human-review-session.schema.json`.

## Следующий Шаг

После успешного импорта запустить `npm run validate:real-uat-readiness`, обновить data leakage scan targets, release evidence и pilot gate.
