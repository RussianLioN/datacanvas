# Review

Версия процесса: 0.1.0

## Increment

Security foundation переведен из набора документов в проверяемый gate:

- manifest задает обязательные security artifacts и stop rules;
- secret scan включен в `npm test` и CI;
- validator проверяет data classification, threat model, incident response, export checklist и deny-by-default tool allowlist;
- S21 threat-model delta фиксирует изменение security posture.

## Ограничение

Historical threat-model deltas для ранних спринтов не backfilled. Для будущих спринтов нужен отдельный forward rule.
