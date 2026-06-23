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
- Real UAT readiness: `docs/product/ux/real-uat-gate-readiness.json`, `docs/product/ux/human-review-session-real.template.json`.
- Render/export: `artifacts/examples/presentation-minimal.html`, `artifacts/examples/export-smoke-manifest.json`, `artifacts/examples/renderer-regression-manifest.json`.
- Security gates: `docs/architecture/security/data-leakage-manifest.json`.
- Process metrics: `docs/process/current/process-metrics-snapshot.json`.
- Registry snapshot: `docs/architecture/schemas/artifact-registry.json`.
- Hash snapshot: `docs/architecture/schemas/artifact-hash-manifest.json`.

## Acceptance Decision

Текущий candidate принят только как pre-commit fixture: UAT approved, решение accepted, critical failures 0, unsupported claims 0, export blockers 0.

## Ограничения

- Нет реальной пользовательской UAT-сессии.
- Interactive review runtime готов как локальный fixture, но нет real user runtime session.
- Real UAT readiness готов, но `human-review-session-real.json` еще не создан.
- PR и commit SHA должны быть заполнены перед настоящим release tag.

## Следующий Шаг

Провести real user UAT session и сохранить `human-review-session-real.json` перед pilot gate.
