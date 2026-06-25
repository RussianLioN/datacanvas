# Evidence Index

Версия процесса: 0.1.0

## Artifacts

- `schemas/security-foundation-manifest.schema.json`
- `docs/architecture/security/security-foundation-manifest.json`
- `docs/sprints/2026-W26-security-foundation-pack/threat-model-delta.md`
- `scripts/scan-secrets.mjs`
- `scripts/validate-security-foundation.mjs`
- `docs/architecture/adr/ADR-021-security-foundation-gate.md`
- `docs/sprints/2026-W26-security-foundation-pack/sprint-evidence-manifest.json`

## Validation

- `npm run scan:secrets`
- `npm run validate:security-foundation`
- `npm run validate:plan-coverage`
- `npm run validate:process-versioning`
- `npm run validate:artifact-registry`
- `npm run validate:bootstrap`
- `npm run validate:schemas`
- `npm test`
- `git diff --check`
