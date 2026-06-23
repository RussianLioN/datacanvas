# Real UAT Session Guide

## Цель

Провести настоящую human review/UAT session для G9 MVP Gate и сохранить проверяемый артефакт `docs/product/ux/human-review-session-real.json`.

## Перед Сессией

- Открыть `artifacts/examples/review-ui-fixture.html`.
- Подготовить `docs/product/ux/human-review-session-real.template.json`.
- Проверить, что `npm run validate:review-ui` проходит.

## Во Время Сессии

- Зафиксировать реальный `actor_id`.
- Записать действия `submit_for_review`, `comment`, `record_decision`, `export`.
- Для каждого действия указать роль, источник, причину и timestamp.
- Не использовать placeholder `TO_BE_FILLED`.

## После Сессии

- Сохранить файл как `docs/product/ux/human-review-session-real.json`.
- Установить `status=recorded_real_user` и `session_kind=real_user`.
- Запустить `npm run validate:real-uat-readiness` и `npm test`.

## Stop Rules

- Не принимать session artifact, если участник не является реальным человеком.
- Не принимать session artifact с placeholder-полями.
- Не принимать G9, если `review_state` не `approved` или `decision` не `accepted`.
