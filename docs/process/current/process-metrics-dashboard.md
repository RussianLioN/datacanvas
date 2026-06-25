# Process Metrics Dashboard

Статус: baseline
Период: Sprint 0

| Метрика | Значение | Цель | Комментарий |
|---|---:|---:|---|
| Sprint predictability | n/a | >= 80% | Появится после первого завершенного спринта |
| Spillover rate | n/a | <= 20% | Появится после первого завершенного спринта |
| Cycle time | n/a | trend down | Нужны backlog items |
| Blocked time | n/a | trend down | Нужны daily notes |
| Process change lead time | n/a | <= 1 sprint | Нужны PCR |
| Artifact completeness | Sprint 0 produced | 100% для Sprint 0 | Проверяется по sprint evidence и validator |
| Decision latency | n/a | <= 1 sprint | Нужны decisions |
| Repository-derived metrics snapshot | generated | snapshot regenerated before review | Считается через `scripts/collect-process-metrics.mjs` |
| Process event log entries | 0 | > 0 после Sprint Review | Журнал готов, реальные events пока не записаны |

## Правило Обновления

Dashboard обновляется перед Sprint Review. Если метрика недоступна, указывается `n/a` и причина отсутствия данных.

## Sprint 1 Update

- Добавлен bootstrap validator как первый executable process check.
- Добавлен AJV schema validator и `npm test` как combined validation command.
- `Process change lead time` станет измеримым после первого полного PCR цикла.
- `Artifact completeness` теперь проверяется через `scripts/validate-bootstrap-artifacts.sh`.

## Structured Metrics Manifest

- Baseline manifest: `docs/process/current/process-metrics-manifest.json`.
- Проверка: `npm run validate:process-metrics`.
- `Quality gate pass rate` считается derived metric на основе текущих blocking gates.
- `Repository-derived metrics snapshot`: `docs/process/current/process-metrics-snapshot.md`.
- `Process event log`: `docs/process/current/process-event-log.json`.
- Проверка event log: `npm run validate:process-events`.
- `Real user UAT session` закрыт после появления `docs/product/ux/human-review-session-real.json`.
