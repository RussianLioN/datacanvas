# Review

Версия процесса: 0.1.0  
Статус: pending team acceptance

## Демонстрируемый инкремент

- `risk-traceability.json` связывает risks с НФТ, traceability requirements, eval cases и evidence.
- Scorer генерирует rollback для prompt-injection, cost и latency branches.

## Проверка

```bash
npm run generate:golden
npm run validate:provider-scorer
npm test
```

## Решение

Командная приёмка еще не проведена.
