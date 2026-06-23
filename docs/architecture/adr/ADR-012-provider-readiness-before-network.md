# ADR-012: Provider Readiness До Сетевой Интеграции

Дата: 2026-06-22  
Статус: Accepted  
Версия процесса: 0.1.0

## Контекст

Внешний LLM provider нужен для будущего качества DataCanvas, но раннее включение сети нарушит воспроизводимость, усложнит безопасность и создаст неуправляемую стоимость.

## Решение

До любого сетевого вызова внешнего provider требуется readiness gate:

- `PROC-007` создан и принят командой;
- provider указан в allowlist со статусом `disabled`;
- есть cost/latency budget;
- есть trace requirements для `model_call`;
- есть offline fallback;
- есть provider-specific eval plan;
- `npm run validate:provider` проходит.

## Последствия

Плюсы:

- команда может обсуждать provider integration без скрытого включения сети;
- no-network-by-default остается действующим инвариантом;
- будущий эксперимент будет измеримым.

Ограничения:

- Sprint 8 не подключает реальный provider;
- качество реальной модели остается непроверенным до отдельного controlled experiment.
