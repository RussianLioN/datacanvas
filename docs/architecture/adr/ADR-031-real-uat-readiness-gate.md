# ADR-031: Real UAT Readiness Gate

## Статус

Accepted

## Контекст

После review UI fixture у DataCanvas есть проверяемый интерфейс и fixture session, но нет настоящей пользовательской UAT-сессии. Ее нельзя сгенерировать без участия человека, но можно убрать ручную неопределенность: подготовить шаблон, правила приемки и readiness gate.

## Решение

Добавить `docs/product/ux/real-uat-gate-readiness.json`, `docs/product/ux/human-review-session-real.template.json`, `docs/product/ux/real-uat-session-guide.md` и валидатор `scripts/validate-real-uat-readiness.mjs`.

## Последствия

- Команда получает воспроизводимый путь для проведения real UAT.
- Template явно не считается evidence проведенной сессии.
- Pilot gate остается открытым до появления `human-review-session-real.json` со `status=recorded_real_user`.
