# Sprint Summary: Visual Baseline And LLM Boundary

Статус: produced_pending_team_acceptance

## Сделано

- Создан Sprint 5 evidence-контур.
- Добавлен structural visual baseline checker.
- Зафиксирована PDF/PNG export strategy.
- Добавлены LLM request/result schemas.
- Зафиксирован prompt contract.
- Добавлены ADR-008 и ADR-009.
- `npm test` включает visual baseline.

## Ограничения

- Visual baseline пока structural, без browser screenshot regression.
- PDF/PNG export еще не реализован.
- Реальный LLM еще не подключен.
- Командная приемка Sprint 5 еще не проведена.

## Проверки

- `npm test`: passed.
- `git diff --check`: passed.

## Следующий Безопасный Шаг

Начать Sprint 6: LLM mock adapter behind schema boundary, unsupported-claim negative tests and no-network-by-default guardrails.
