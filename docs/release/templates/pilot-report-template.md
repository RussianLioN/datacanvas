# Pilot Report Template

Статус: template only

Этот шаблон нельзя считать `docs/release/pilot-report.md`. Он нужен для заполнения реального pilot report после real UAT и pilot run.

## Metadata

- Process version: `0.1.0`
- Pilot date: `TO_BE_FILLED_AFTER_PILOT`
- Pilot owner: `TO_BE_FILLED_AFTER_PILOT`
- Commit SHA: `TO_BE_FILLED_AFTER_PILOT`
- PR evidence: `TO_BE_FILLED_AFTER_PILOT`

## Review Evidence

- Real UAT runtime export: `artifacts/manual/real-uat/review-runtime-state-export.json`
- Real human review session: `docs/product/ux/human-review-session-real.json`
- Release evidence pack: `docs/release/mvp-release-evidence-pack.json`
- Data leakage manifest after real UAT: `docs/architecture/security/data-leakage-manifest.json`
- Process portability notes: `docs/release/pilot-process-portability-notes.md`

## Gate Decisions

| Gate | Decision | Evidence | Notes |
| --- | --- | --- | --- |
| G1 Input Package | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |
| G2 Normalization | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |
| G3 PresentationSpec | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |
| G4 Renderer Export | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |
| G5 Traceability | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |
| G6 Security | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |
| G7 Quality/Evals | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |
| G8 Ops Readiness | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |
| G9 Real UAT | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |
| G10 Pilot Gate | `accepted/rejected` | `TO_BE_FILLED_AFTER_PILOT` | `TO_BE_FILLED_AFTER_PILOT` |

## Quality Gate Results

```text
npm test: TO_BE_FILLED_AFTER_PILOT
npm run validate:pilot-gate: TO_BE_FILLED_AFTER_PILOT
npm run validate:process-portability: TO_BE_FILLED_AFTER_PILOT
npm run validate:plan-completion-audit: TO_BE_FILLED_AFTER_PILOT
```

## Pilot Outcome

- Decision: `accepted/rejected`
- Blocking issues: `TO_BE_FILLED_AFTER_PILOT`
- Required follow-up: `TO_BE_FILLED_AFTER_PILOT`

## Completion Audit Update

Опиши, какие поля `docs/process/audits/plan-completion-audit.json` были обновлены после pilot и почему.
