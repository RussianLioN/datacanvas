# ADR-056: Real UAT Preflight Checklist

Дата: 2026-06-22

## Статус

Принято.

## Контекст

Completion audit остается заблокирован real UAT evidence. У команды уже есть interactive runtime, operator handoff и importer, но перед ручной сессией нужен отдельный machine-checkable preflight, который подтверждает готовность пакета и не создает fake acceptance evidence.

## Решение

Добавить `docs/product/ux/real-uat-preflight-checklist.json`, человекочитаемый checklist, schema и validator `scripts/validate-real-uat-preflight.mjs`.

Validator проверяет:

- наличие runtime, handoff, import contracts и UAT script;
- что initial runtime state остается fixture;
- что importer требует `recorded_real_user` и `real_user`;
- что completion audit остается `blocked_pending_external`;
- что уже существующие external evidence files не содержат unsafe markers.

## Последствия

Real UAT становится более воспроизводимой и менее зависимой от устной инструкции. Preflight не закрывает DOD-005 и не создает `human-review-session-real.json`.

## Проверки

- `npm run validate:real-uat-preflight`
- `npm run validate:real-uat-operator-handoff`
- `npm run validate:plan-completion-audit`
- `npm test`
