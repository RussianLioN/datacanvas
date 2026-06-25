# ADR-021: Security Foundation Gate

Дата: 2026-06-22
Статус: accepted

## Контекст

План DataCanvas требует security artifacts, Security DoR/DoD, stop rules и secret scan как blocking gate. Часть документов была создана на bootstrap-этапе, но без отдельного manifest и без воспроизводимой проверки полноты security foundation.

## Решение

Добавить `security-foundation-manifest.json`, `threat-model-delta.md`, `scan:secrets` и `validate:security-foundation`.

Скрипты gate:

- `scripts/scan-secrets.mjs`;
- `scripts/validate-security-foundation.mjs`.

Security foundation считается готовым, если:

- все обязательные security artifacts существуют;
- data classification содержит классы `public`, `internal`, `confidential`, `pii`, `secret`;
- threat model содержит базовые риски;
- sprint threat-model delta связан с текущим инкрементом;
- export checklist и incident response содержат stop-rule действия;
- tool allowlist остается deny-by-default;
- secret scan проходит.

## Последствия

- Security foundation входит в `npm test` и CI.
- Новый product increment не должен обходить security gate.
- Внешние provider/network операции остаются запрещенными до отдельного ADR/PCR.
