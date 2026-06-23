# Real UAT Preflight Checklist

## Назначение

Этот checklist проверяет готовность real UAT перед ручной сессией. Он не создает `artifacts/manual/real-uat/review-runtime-state-export.json` и не создает `docs/product/ux/human-review-session-real.json`.

## Preflight

- Проверить `artifacts/examples/review-runtime-interactive.html`.
- Проверить, что runtime содержит `Actor ID`, `Real UAT` и `Сбросить session`.
- Проверить `docs/product/ux/real-uat-operator-handoff.md`.
- Проверить, что `human-review-session-real.json` отсутствует либо уже проходит real UAT validators.
- Проверить, что completion audit остается `blocked_pending_external` до фактического evidence.

## Команды

```bash
npm run validate:real-uat-preflight
npm run validate:real-uat-operator-handoff
npm run validate:real-uat-import
npm run validate:real-uat-session-importer
npm run validate:plan-completion-audit
```

После ручного export:

```bash
npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
```

## Stop Conditions

- Runtime export содержит `TO_BE_FILLED`.
- `actor_id` содержит `fixture`, `template`, `sample`, `placeholder` или `interactive-`.
- Участник не является реальным пользователем или ответственным представителем команды.
- Export не содержит `submit_for_review`, `comment`, `record_decision` и `export`.
- Completion audit меняется на complete до real UAT, pilot report и commit/PR evidence.

## Следующий Шаг

Провести real UAT по `docs/product/ux/real-uat-operator-handoff.md`, сохранить exported state и запустить import validation с явным `--input`.
