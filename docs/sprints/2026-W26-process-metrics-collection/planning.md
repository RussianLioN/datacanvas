# Planning

## Scope

Инкремент автоматизирует только те метрики, которые можно вывести из текущих файлов репозитория. Он не создает искусственные значения для sprint predictability, spillover, cycle time или blocked time.

## Acceptance Criteria

- Snapshot пересчитывается командой `node scripts/collect-process-metrics.mjs`.
- Validator падает, если counts устарели.
- `real user UAT session` остается `pending_external`.
- Snapshot включен в schema validation и full test suite.
