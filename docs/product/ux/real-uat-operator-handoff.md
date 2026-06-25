# Real UAT Operator Handoff

Цель: провести настоящую UAT-сессию DataCanvas в interactive review runtime и получить evidence, пригодный для G9 MVP acceptance.

## Preflight

- Предпочтительный запуск: `npm run uat:real`.
- Проверить `artifacts/examples/review-runtime-interactive.html`.
- Проверить, что runtime содержит `Actor ID`, `Real UAT` и `Сбросить session`.
- Проверить `docs/product/ux/real-uat-runtime-import.json`.
- Проверить `docs/product/ux/uat-script.md`.
- Проверить, что `docs/product/ux/human-review-session-real.json` еще не создан из fixture.
- Запустить `npm run validate:real-uat-operator-handoff`.

## Участник

Участник должен быть реальным пользователем или ответственным представителем команды. Нельзя использовать `fixture`, `template`, `sample`, `placeholder` или `TO_BE_FILLED` в `actor_id`.

## Проведение

### Автоматизированный Путь

1. Запустить:

```bash
npm run uat:real
```

2. В открытой странице нажать `Сбросить session`, включить `Real UAT` и указать реальный `Actor ID`.
3. Выполнить `submit_for_review`, `comment`, `record_decision approved`, `export`.
4. Дождаться сообщения runner, что сохранены:
   - `artifacts/manual/real-uat/review-runtime-state-export.json`;
   - `docs/product/ux/human-review-session-real.json`.

### Ручной Fallback

1. Открыть `artifacts/examples/review-runtime-interactive.html`.
2. Нажать `Сбросить session`, включить `Real UAT` и указать реальный `Actor ID`.
3. Выполнить `submit_for_review`.
4. Записать комментарий участника по краткости, полезности и трассируемости.
5. Зафиксировать решение через `record_decision`.
6. Экспортировать runtime state в `artifacts/manual/real-uat/review-runtime-state-export.json`.
7. Проверить экспорт без записи acceptance artifact:

```bash
npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
```

8. После review команды создать session artifact отдельной командой:

```bash
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json
```

## Выходные Артефакты

- `artifacts/manual/real-uat/review-runtime-state-export.json`
- `docs/product/ux/human-review-session-real.json`
- обновленный `docs/release/mvp-release-evidence-pack.json`
- обновленный `docs/release/pilot-gate-readiness.json`

## Stop Conditions

- Участник не является реальным участником UAT.
- Export содержит placeholders.
- Нет `comment`, `record_decision` или `export`.
- Участник не принимает MVP flow.
- `validate:real-uat-import -- --input ... --dry-run` не проходит.

## Следующий Шаг

После успешной UAT-сессии добавить real session artifact в data leakage scan targets, обновить release evidence и перейти к pilot gate cut.
