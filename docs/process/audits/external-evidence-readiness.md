# External Evidence Readiness

## Назначение

Этот dashboard показывает, какие внешние evidence всё ещё блокируют completion audit, кто владеет сбором, какие supporting artifacts уже готовы и какие действия запрещены.

Real UAT evidence уже записан. Документ показывает оставшиеся внешние blockers: pilot report, portability notes, commit SHA или PR evidence. Он нужен, чтобы команда не закрыла план fixture/template артефактами.

## Текущие Blockers

| Evidence | Owner | Состояние | Allowed collection |
|---|---|---|---|
| `docs/release/pilot-report.md` | Delivery/GitOps Lead | missing pending external | real pilot after UAT and quality gate |
| `docs/release/pilot-process-portability-notes.md` | Process Owner | missing pending external | real pilot retrospective notes |
| `commit-sha-and-pr-evidence` | Delivery/GitOps Lead | missing pending external | verified commit/PR or release record |

## Controlled Collection Command

После появления commit/PR или явно согласованного release record использовать один recorder:

```bash
npm run pilot:record -- --dry-run --pilot-owner Delivery/GitOps --release-owner Delivery/GitOps --reviewer ProcessOwner --target-reuse-context next-it-project --release-record commit-or-pr-url --follow-up none
npm run pilot:record -- --pilot-owner Delivery/GitOps --release-owner Delivery/GitOps --reviewer ProcessOwner --target-reuse-context next-it-project --release-record commit-or-pr-url --follow-up none
```

Write mode создает `docs/release/pilot-report.md`, `docs/release/pilot-process-portability-notes.md` и `docs/release/commit-pr-evidence.md`. До внешнего release record использовать только dry-run.

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

После commit/PR или согласованного release record выполнить `npm run pilot:record -- --dry-run`, затем write mode и обновить completion audit.
