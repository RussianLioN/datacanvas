# Evidence Index

Версия процесса: 0.1.0

## Source Artifacts

- `docs/architecture/risks/risk-registry.json`
- `docs/product/requirements/traceability-matrix.json`
- `tests/evals/provider-specific-eval-delta.json`
- `docs/architecture/risks/risk-evidence-map.json`

## Generated Artifacts

- `docs/architecture/risks/risk-traceability.json`
- `docs/architecture/risks/risk-matrix.md`

## Validation

- `npm run generate:golden`
- `npm run validate:risk-traceability`
- `npm run validate:risk-matrix`
- `npm test`
- `git diff --check`
