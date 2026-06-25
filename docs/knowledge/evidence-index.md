# Evidence Hub DataCanvas

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / [Knowledge](README.md) / Evidence hub

Статус: active
Владелец: Delivery/GitOps Lead
Проверка: `npm run validate:docs-navigation`

## Current Pointers

| Указатель | Значение | Currentness marker |
|---|---|---|
| Текущий sprint | `SPRINT-2026-W26` | current на 2026-06-25 |
| Текущий release | `RC-2026-W26-G9-MVP-FIXTURE` | current main `2c6858e4dc541c899b500edb5ebfb1ca9073c29d` |
| Текущая версия процесса | `0.1.0` | active |
| Текущий accepted BMC | `docs/product/bmc/bmc-v0.2.md` | accepted package |
| Текущий UAT state | `accepted_real_uat` | real UAT evidence recorded |

## Evidence Index

| Evidence | Область | Владелец | Статус | Date/currentness marker |
|---|---|---|---|---|
| `docs/sprints/2026-W26-process-bootstrap/sprint-evidence-manifest.json` | sprint evidence manifests | Scrum Master | active | current process baseline |
| `docs/release/mvp-release-evidence-pack.json` | release evidence | Delivery/GitOps Lead | release_candidate | current main `2c6858e4dc541c899b500edb5ebfb1ca9073c29d` |
| `docs/release/commit-pr-evidence.md` | PR evidence | Delivery/GitOps Lead | merged | PR #1 merged to `main` |
| `docs/product/ux/human-review-session-real.json` | UAT evidence | QA/UAT Lead | accepted | confidential, metadata-only navigation |
| `docs/architecture/schemas/artifact-hash-manifest.json` | artifact hash manifest | Delivery/GitOps Lead | generated | refresh through `npm run generate:golden` |
| `docs/navigation/documentation-index.json` | navigation index | Documentation Owner | generated | refresh through `npm run generate:docs-navigation` |
| `docs/process/audits/plan-completion-audit.json` | completion audit | Process Owner | complete | post-merge status synchronized |

## Проверки

- `npm run validate:docs-navigation`
- `npm run validate:doc-stale-status`
- `npm run validate:artifact-hashes`
- `npm test`
