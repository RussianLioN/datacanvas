# Artifact Updates: 2026-W27 Backlog Closure

| Artifact | Change | Validation |
|---|---|---|
| `docs/product/requirements/traceability-matrix.json` | Removed dangling `QA-*`, `SEC-*`, `OPS-*`, `TECH-006`; added `NFR-005` visual link | `npm run validate:backlog-registry`, `npm run validate:traceability-graph` |
| `docs/product/backlog/eval-backlog.md` | Synced `EVAL-001..006` with executable cases | `npm run validate:eval-backlog-sync` |
| `tests/evals/eval-cases.json` | Added structured title/category/status/required/requirement/evidence metadata | `npm run validate:schemas`, `npm run validate:evals` |
| `scripts/validate-backlog-registry.mjs` | Added Markdown backlog parsing and traceability ID checks | `npm run validate:backlog-registry` |
| `scripts/validate-docs-navigation.mjs` | Added route-group, business route and product route guards | `npm run validate:docs-navigation` |
| `scripts/validate-data-leakage.mjs` | Added sensitive rule coverage and public surface scan | `npm run validate:data-leakage` |
| `scripts/validate-artifact-hash-manifest.mjs` | Added exact-set, duplicate and canonical-order checks | `npm run validate:artifact-hashes` after generator |
| `docs/sprints/2026-W27-backlog-closure/*` | Added complete sprint package | `npm run validate:schemas`, `npm run validate:process-metrics-snapshot` after generator |
