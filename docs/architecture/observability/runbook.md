# Operational Runbook

## Назначение

Runbook описывает минимальные эксплуатационные действия для инкрементов DataCanvas до появления production runtime.

## Smoke Check

Базовая команда:

```bash
npm test
```

Для узкой проверки operational readiness:

```bash
npm run validate:ops-readiness
```

## Failure Modes

- Schema mismatch: остановить инкремент, исправить schema или fixture, повторить `npm run validate:schemas`.
- Неподдержанное утверждение в презентации: остановить export, проверить claim map и risk traceability, добавить eval case.
- Provider quality ниже порога: оставить provider disabled или выполнить rollback по provider experiment result.
- Cost/latency overrun: остановить provider experiment, обновить budget и backlog item.
- Secret или sensitive data в export: остановить публикацию, выполнить `npm run scan:secrets`, добавить regression check.

## Rollback/Disable Path

- Для process artifact: вернуть последний green evidence pack и повторить `npm run validate:bootstrap`.
- Для provider: оставить `status: disabled` в allowlist или откатить experiment result к `decision: rollback`.
- Для generated artifact: перегенерировать deterministic chain через `npm run generate:golden`.
- Для export: удалить опубликованный artifact из release candidate и повторить export sanitization.

## Incident-To-Backlog Loop

Каждый инцидент фиксируется как короткий RCA, затем создается backlog item и regression check. Минимальная цепочка:

1. Описать симптом, impact и affected artifact.
2. Найти root cause или явно зафиксировать unknown.
3. Добавить backlog item с owner role.
4. Добавить eval/test/guardrail.
5. Проверить результат на следующем Sprint Review.

## Escalation

Если инцидент затрагивает безопасность, секреты, внешние provider calls или пользовательские данные, stop rule: не продолжать export/provider работу до security review и нового evidence pack.
