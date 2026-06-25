# ADR-038: Process Metrics Collection

Дата: 2026-06-22
Статус: accepted

## Контекст

В процессе DataCanvas есть baseline metrics manifest, но часть метрик была доступна только вручную. Для управляемого Scrum-процесса нужен воспроизводимый snapshot, который показывает фактическое состояние артефактов процесса без ручного подсчета.

## Решение

Добавить collector `scripts/collect-process-metrics.mjs`, который формирует:

- `docs/process/current/process-metrics-snapshot.json`;
- `docs/process/current/process-metrics-snapshot.md`.

Snapshot считает только проверяемые данные из репозитория: sprint folders, sprint evidence manifests, artifact registry entries, accepted process changes, evidence checks и pending external gates.

Проверка выполняется через `scripts/validate-process-metrics-snapshot.mjs`.

## Последствия

Процесс получает автоматический metrics snapshot, пригодный для Sprint Review и Retrospective. Реальные delivery metrics остаются недоступны до появления dated командных событий и real UAT evidence.

## Валидация

- `node scripts/collect-process-metrics.mjs`
- `npm run validate:process-metrics-snapshot`
- `npm run validate:schemas`
- `npm test`
