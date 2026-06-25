# Real UAT Runtime Import Guide

## Назначение

Этот guide описывает, как превратить exported runtime state из `artifacts/examples/review-runtime-interactive.html` в `docs/product/ux/human-review-session-real.json`.

## Правила

- Использовать только реальную UAT-сессию с участником команды или заказчиком.
- Не использовать fixture state и actor id вида `fixture-*` или `interactive-*`.
- Не оставлять `TO_BE_FILLED`.
- Перед pilot gate сохранить исходный runtime export в `artifacts/manual/real-uat/review-runtime-state-export.json`.
- Создавать `human-review-session-real.json` только через проверенный import gate.

## Команды

```bash
npm run validate:real-uat-import
npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
```

Первая команда проверяет readiness. Вторая команда проверяет реальный exported state без записи `human-review-session-real.json`. Третья команда проверяет будущий session artifact без записи. Запись acceptance artifact выполняется отдельным явным шагом после review команды.

```bash
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json
```

## Acceptance

Импорт разрешен только если runtime export имеет:

- `status=recorded_real_user`;
- `session_kind=real_user`;
- `current_state=approved`;
- `export_allowed=true`;
- actions `submit_for_review`, `comment`, `record_decision`, `export`;
- отсутствует `TO_BE_FILLED`;
- отсутствуют fixture/template/sample/placeholder/interactive markers в `actor_id`.
