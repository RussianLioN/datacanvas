# Review

Версия процесса: 0.1.0
Статус: pending team acceptance

## Демонстрируемый инкремент

- Provider readiness проверяется через JSON Schema.
- Trace manifest содержит `model_call` span для offline fallback.
- Provider остается disabled и offline.

## Проверка

```bash
npm run validate:schemas
npm run validate:provider
npm test
```

## Решение

Командная приёмка еще не проведена.
