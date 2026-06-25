# Planning

## Scope

- Обновить interactive runtime для real UAT actor identity.
- Не создавать real UAT export.
- Не создавать `human-review-session-real.json`.

## Done When

- Runtime может экспортировать `recorded_real_user` только при явном `Real UAT`.
- Fixture default сохраняется.
- Import/preflight validators продолжают блокировать unsafe markers.
