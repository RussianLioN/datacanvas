# MVP Release Evidence Pack

## Назначение

Этот пакет фиксирует минимальный release candidate для G9 MVP Accepted. Он не объявляет полноценный релиз продукта, а собирает проверяемое evidence для текущего artifact-first MVP fixture.

## Release Goal

Проверить цепочку `input -> normalized data -> PresentationSpec -> render -> human review -> UAT result -> PDF/PNG smoke export` на детерминированных артефактах.

## Evidence

- UAT result: `docs/product/ux/uat-result-minimal.json`.
- Human review contract: `docs/product/ux/human-review-flow.json`.
- Traceability: `tests/golden/trace-manifest-minimal.json`, `tests/golden/claim-map-minimal.json`.
- Review UI: `artifacts/examples/review-ui-fixture.html`, `docs/product/ux/review-ui-fixture.json`.
- Interactive review runtime: `artifacts/examples/review-runtime-interactive.html`, `docs/product/ux/review-runtime-interactive.json`.
- Real UAT: `docs/product/ux/real-uat-gate-readiness.json`, `artifacts/manual/real-uat/review-runtime-state-export.json`, `docs/product/ux/human-review-session-real.json`.
- Render/export: `artifacts/examples/presentation-minimal.html`, `artifacts/examples/export-smoke-manifest.json`, `artifacts/examples/renderer-regression-manifest.json`.
- Security gates: `docs/architecture/security/data-leakage-manifest.json`.
- Process metrics: `docs/process/current/process-metrics-snapshot.json`.
- Registry snapshot: `docs/architecture/schemas/artifact-registry.json`.
- Hash snapshot: `docs/architecture/schemas/artifact-hash-manifest.json`.
- Commit/PR evidence: `docs/release/commit-pr-evidence.md`.
- Pilot evidence: `docs/release/pilot-report.md`, `docs/release/pilot-process-portability-notes.md`.

## Acceptance Decision

Текущий candidate принят как reviewable PR state: real UAT approved, решение accepted, critical failures 0, unsupported claims 0, export blockers 0, pilot gate accepted, portability review accepted.

## Ограничения

- PR #1 еще не смержен; release evidence фиксирует reviewable PR state.
- Если branch head изменится после pilot evidence, commit/PR evidence нужно обновить.

## Следующий Шаг

Дождаться review и merge PR #1; при изменении branch head обновить commit/PR evidence и release audit.
