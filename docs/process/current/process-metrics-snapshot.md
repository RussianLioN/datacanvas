# Process Metrics Snapshot

Статус: generated
Период: 2026-W26
Дата генерации: 2026-06-22T00:00:00Z

| Метрика | Значение | Расчет |
|---|---:|---|
| Sprint evidence coverage | 64/64 | sprint_evidence_manifests / sprint_folders |
| Artifact registry size | 328 | count(artifact_registry.artifacts) |
| Accepted process changes | 2 | count(process_change_ledger.entries where status == accepted) |
| Evidence check pass ratio | 491/491 | passed sprint evidence checks / all sprint evidence checks |
| External gate backlog | 1 | count(process quality gates where status == pending_external) |
| Process event log entries | 0 | count(process_event_log.events) |

## Counts

| Count | Value |
|---|---:|
| Sprint folders | 64 |
| Sprint evidence manifests | 64 |
| Artifact registry entries | 328 |
| Accepted process changes | 2 |
| Passed evidence checks | 491 |
| Pending evidence checks | 0 |
| Quality gates passed | 5 |
| Quality gates pending external | 1 |
| Process events | 0 |

## Ограничения

- Snapshot считает только данные, уже зафиксированные в репозитории.
- Sprint predictability, spillover, cycle time и blocked time остаются недоступны без реальных командных timestamps.
- Real user UAT остается pending_external и не может быть закрыт generated snapshot.

## Следующий Безопасный Шаг

После real UAT и первого командного Sprint Review добавить dated events для live delivery metrics.
