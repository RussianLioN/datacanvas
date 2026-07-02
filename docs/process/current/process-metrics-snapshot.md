# Process Metrics Snapshot

Статус: generated
Период: 2026-W26
Дата генерации: 2026-06-22T00:00:00Z

| Метрика | Значение | Расчет |
|---|---:|---|
| Sprint evidence coverage | 66/66 | sprint_evidence_manifests / sprint_folders |
| Artifact registry size | 568 | count(artifact_registry.artifacts) |
| Accepted process changes | 3 | count(process_change_ledger.entries where status == accepted) |
| Evidence check pass ratio | 521/521 | passed sprint evidence checks / all sprint evidence checks |
| External gate backlog | 0 | count(process quality gates where status == pending_external) |
| Process event log entries | 0 | count(process_event_log.events) |

## Counts

| Count | Value |
|---|---:|
| Sprint folders | 66 |
| Sprint evidence manifests | 66 |
| Artifact registry entries | 568 |
| Accepted process changes | 3 |
| Passed evidence checks | 521 |
| Pending evidence checks | 0 |
| Quality gates passed | 6 |
| Quality gates pending external | 0 |
| Process events | 0 |

## Ограничения

- Snapshot считает только данные, уже зафиксированные в репозитории.
- Sprint predictability, spillover, cycle time и blocked time остаются недоступны без реальных командных timestamps.

## Следующий Безопасный Шаг

Поддерживать dated events для live delivery metrics после изменений delivery process.
