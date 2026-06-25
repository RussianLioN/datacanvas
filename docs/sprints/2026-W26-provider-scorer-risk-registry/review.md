# Review

Версия процесса: 0.1.0
Статус: pending team acceptance

## Демонстрируемый инкремент

- `scripts/score-provider-output.mjs` считает `quality_score` по frozen/mock output.
- `docs/architecture/risks/risk-registry.json` делает linked risks проверяемыми.
- `scripts/validate-provider-scorer.mjs` проверяет risk linkage и scored result.

## Проверка

```bash
npm run generate:golden
npm run validate:provider-scorer
npm test
```

## Решение

Командная приёмка еще не проведена.
