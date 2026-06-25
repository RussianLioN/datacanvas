# Review Runtime Browser Smoke

## Назначение

Этот static browser smoke gate фиксирует минимальные browser-readiness assertions для `artifacts/examples/review-runtime-interactive.html` перед реальным UAT.

Проверка остается статической: она читает HTML, CSS и JS как локальный артефакт, сверяет DOM controls, responsive layout, hooks состояния и trust boundary. Она не создает real UAT evidence.

## Что Проверяется

- viewport meta и связь с `review-runtime-browser-matrix.json`;
- наличие mobile, tablet и desktop targets;
- constrained layout, grid tracks, mobile fallback и wrapping toolbar;
- обязательные controls: `actor-id`, `real-uat-mode`, `reset-runtime`, `runtime-state-json`, `review-reason`, `state-json`;
- сохранение состояния через `localStorage`;
- экспорт real-user state только при explicit `Real UAT`;
- отсутствие network URL, iframe, cookie access и `eval`.

## Что Не Проверяется

- реальный browser rendering engine;
- pixel screenshot и визуальные diffs;
- ручная проверка на устройствах;
- фактический экспорт `review-runtime-state-export.json`;
- создание `human-review-session-real.json`.

## Команды

```bash
npm run validate:review-runtime-browser-smoke
npm run validate:review-runtime-browser-matrix
npm run validate:review-runtime-interactive
npm test
```

## Следующий Безопасный Шаг

Открыть interactive runtime на viewport targets из matrix, провести real UAT по operator handoff, экспортировать runtime state JSON и затем выполнить dry-run importer.
