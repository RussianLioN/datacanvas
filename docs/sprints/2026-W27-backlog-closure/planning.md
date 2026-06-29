# Planning: 2026-W27 Backlog Closure

Статус: in_progress

## План Работы

1. Зафиксировать baseline: ветка, `origin/main`, `npm test`, diff checks.
2. Закрыть dangling IDs в traceability без добавления новых central contours.
3. Синхронизировать `EVAL-001..006` между backlog, eval cases и validator.
4. Усилить navigation, leakage и artifact hash gates.
5. Создать sprint package и обновить release/process evidence.
6. Запустить генераторы в порядке плана и финальный gate.

## Ограничения

- Не создавать `src/`.
- Не включать live LLM, provider, секреты, publish или deploy.
- Не менять process version без отдельного PCR.
- Не ослаблять security, data leakage или provider gates.

## Узкие Проверки

- `npm run validate:backlog-registry`
- `npm run validate:evals`
- `npm run validate:eval-backlog-sync`
- `npm run validate:docs-navigation`
- `npm run validate:data-leakage`
- `npm run validate:artifact-registry`
