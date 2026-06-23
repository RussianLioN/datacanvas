# Evidence Index

Версия процесса: 0.1.0

## Artifacts

- `schemas/render-request.schema.json`
- `schemas/process-change-request.schema.json`
- `schemas/tool-allowlist.schema.json`
- `schemas/trace-contract.schema.json`
- `tests/contracts/render-request-minimal.json`
- `tests/contracts/process-change-request-minimal.json`
- `tests/contracts/tool-allowlist-minimal.json`
- `tests/contracts/trace-contract-minimal.json`
- `scripts/validate-contract-schemas.mjs`
- `docs/architecture/adr/ADR-023-contract-schemas.md`

## Validation

- `npm run validate:contracts`
- `npm run validate:schemas`
- `npm run validate:plan-coverage`
- `npm run validate:process-versioning`
- `npm run validate:artifact-registry`
- `npm run validate:bootstrap`
- `npm test`
- `git diff --check`
