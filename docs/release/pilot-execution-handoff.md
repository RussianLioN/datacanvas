# Pilot Execution Handoff

Статус: `ready_for_pilot_run_after_real_uat`

Этот handoff описывает, как проводить pilot run DataCanvas после real UAT. Он не является acceptance G10/G11 и не заменяет `pilot-report.md`.

## Entry Criteria

- Есть `artifacts/manual/real-uat/review-runtime-state-export.json` со статусом `recorded_real_user`.
- Есть `docs/product/ux/human-review-session-real.json`, созданный через importer.
- `docs/release/mvp-release-evidence-pack.json` обновлен после real UAT.
- `docs/architecture/security/data-leakage-manifest.json` включает real UAT artifacts после их появления.
- Есть commit SHA и PR evidence.
- Для заполнения commit/PR evidence использовать `docs/release/templates/commit-pr-evidence-template.md`.
- `docs/process/portability/process-portability-pack.json` готов к проверке переносимости.

## Pilot Steps

1. Провести Sprint Review с release evidence pack, real UAT session и exported runtime state.
2. Проверить end-to-end flow: input package, normalized data, `PresentationSpec`, renderer exports, trace manifest и human review decision.
3. Провести process portability review для `DataCanvas Delivery Process v0.1`.
4. После появления commit/PR или явно согласованного release record выполнить recorder:

```bash
npm run pilot:record -- --dry-run --pilot-owner "Delivery/GitOps Lead" --release-owner "Delivery/GitOps Lead" --reviewer "Process Owner" --target-reuse-context "следующий ИТ-проект" --release-record "TO_BE_FILLED_RELEASE_RECORD" --follow-up "TO_BE_FILLED_FOLLOW_UP"
npm run pilot:record -- --pilot-owner "Delivery/GitOps Lead" --release-owner "Delivery/GitOps Lead" --reviewer "Process Owner" --target-reuse-context "следующий ИТ-проект" --release-record "TO_BE_FILLED_RELEASE_RECORD" --follow-up "TO_BE_FILLED_FOLLOW_UP"
```

5. Проверить `docs/release/pilot-report.md`, `docs/release/pilot-process-portability-notes.md` и `docs/release/commit-pr-evidence.md`.
6. Обновить completion audit только по фактическим результатам pilot.

## Required Outputs

- `docs/release/pilot-report.md`
- `docs/release/pilot-process-portability-notes.md`
- `docs/release/commit-pr-evidence.md`
- обновленный `docs/process/audits/plan-completion-audit.json`
- обновленный `docs/process/current/process-changelog.md`, если pilot изменил процесс

## Templates

- `docs/release/templates/pilot-report-template.md`
- `docs/release/templates/pilot-process-portability-notes-template.md`
- `docs/release/templates/commit-pr-evidence-template.md`

Шаблоны помогают заполнить реальные outputs после pilot run, но не являются evidence для G10/G11.

## Stop Conditions

- Real UAT artifacts отсутствуют или выглядят как fixture/template/sample.
- Commit SHA или PR evidence отсутствуют.
- Pilot report пытается принять G10 без real UAT и leakage re-scan.
- Portability notes не содержат фактический feedback после pilot.
- Любой quality gate из handoff не проходит.

## Validation

Перед acceptance выполнить:

```bash
npm run validate:pilot-execution-handoff
npm run validate:pilot-evidence-recorder
npm run validate:pilot-report-templates
npm run validate:commit-pr-evidence-template
npm run validate:pilot-gate
npm run validate:process-portability
npm run validate:plan-completion-audit
npm test
```

До появления внешних evidence `validate:pilot-gate` должен оставаться в состоянии readiness, а не acceptance.
