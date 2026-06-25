# ADR-030: Review UI Fixture

## Статус

Accepted

## Контекст

После G9 UAT result и release-candidate pack у DataCanvas оставался gap: human review был описан контрактом, но не имел проверяемого UI fixture и session artifact. Без этого MVP flow нельзя было удобно проверять как пользовательский процесс.

## Решение

Добавить статический HTML fixture `artifacts/examples/review-ui-fixture.html`, структурный manifest `docs/product/ux/review-ui-fixture.json`, session artifact `docs/product/ux/human-review-session-minimal.json` и проверку `scripts/validate-review-ui-fixture.mjs`.

## Последствия

- Human review становится проверяемым как UI artifact.
- Audit events связаны с `human-review-flow.json`.
- Fixture не подменяет настоящую пользовательскую UAT-сессию; перед pilot нужен `session_kind=real_user` artifact.
