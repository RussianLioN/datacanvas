# External Evidence Readiness

## Назначение

Этот dashboard показывает, какие внешние evidence закрыли completion audit, кто владел сбором и какой recorder использовался.

Real UAT evidence, pilot report, portability notes и commit/PR evidence уже записаны. Документ нужен, чтобы сохранить audit trail и не потерять правило обновления evidence при изменении product/runtime artifacts.

## Собранные Evidence

| Evidence | Owner | Состояние | Collection |
|---|---|---|---|
| `docs/release/pilot-report.md` | Delivery/GitOps Lead | collected | `npm run pilot:record` |
| `docs/release/pilot-process-portability-notes.md` | Process Owner | collected | `npm run pilot:record` |
| `docs/release/commit-pr-evidence.md` | Delivery/GitOps Lead | collected | current main `2c6858e4dc541c899b500edb5ebfb1ca9073c29d` |

## Controlled Collection Command

После появления commit/PR или явно согласованного release record использовать один recorder:

```bash
npm run pilot:record -- --dry-run --pilot-owner Delivery/GitOps --release-owner Delivery/GitOps --reviewer ProcessOwner --target-reuse-context next-it-project --release-record commit-or-pr-url --follow-up none
npm run pilot:record -- --pilot-owner Delivery/GitOps --release-owner Delivery/GitOps --reviewer ProcessOwner --target-reuse-context next-it-project --release-record commit-or-pr-url --follow-up none
```

Write mode создал `docs/release/pilot-report.md`, `docs/release/pilot-process-portability-notes.md` и `docs/release/commit-pr-evidence.md`.

## Stop Rules

- Не использовать fixture, template, sample или placeholder как completion evidence.
- Не создавать `human-review-session-real.json` вручную.
- Не заполнять pilot report до real UAT.
- Не закрывать G11 portability без pilot feedback.
- Не принимать commit/PR evidence без проверяемого repository state и quality gate.

## Команды

```bash
npm run validate:real-uat-one-command-runner
npm run validate:external-evidence-readiness
npm run validate:external-blocker-closure-map
npm run validate:plan-completion-audit
npm run validate:pilot-evidence-recorder
npm test
```

## Следующий Безопасный Шаг

Поддерживать `docs/release/commit-pr-evidence.md`, release pack и navigation index при изменении product/runtime artifacts.
