# ADR-057: Actor Identity В Real UAT Runtime

Дата: 2026-06-22

## Статус

Принято.

## Контекст

Interactive review runtime позволял экспортировать JSON, но события получали `actor_id` вида `interactive-*`. Import gate и session importer правильно запрещают такие маркеры, поэтому real UAT export нельзя было получить без ручного редактирования JSON.

## Решение

Добавить в `artifacts/examples/review-runtime-interactive.html`:

- поле `Actor ID`;
- явный переключатель `Real UAT`;
- кнопку сброса локальной session;
- проверку actor id на `fixture`, `template`, `sample`, `placeholder`, `interactive-` и `TO_BE_FILLED`;
- экспорт `status=recorded_real_user` и `session_kind=real_user` только при включенном `Real UAT`.

Fixture-режим остается дефолтным и не является acceptance evidence.

## Последствия

Оператор может провести real UAT без ручной правки exported JSON. Importer по-прежнему блокирует fixture/template/sample/placeholder markers.

## Проверки

- `npm run validate:review-runtime-interactive`
- `npm run validate:real-uat-preflight`
- `npm run validate:real-uat-import`
- `npm test`
