# datacanvas

Initial repository for the datacanvas project.

## Current Bootstrap Artifacts

- Contributor guide: `AGENTS.md`
- Implementation source plan: `docs/plans/datacanvas-adaptive-scrum-implementation-plan.md`
- Active process baseline: `docs/process/current/process-passport.md`
- Sprint 0 evidence: `docs/sprints/2026-W26-process-bootstrap/sprint-evidence-manifest.json`

## Validation

Run the bootstrap artifact check before review:

```sh
scripts/validate-bootstrap-artifacts.sh
npm run scan:secrets
npm run validate:schemas
npm run validate:contracts
npm run validate:llm
npm run validate:data-leakage
npm run validate:evals
npm run validate:provider
npm run validate:backlog-registry
npm run validate:security-foundation
npm run validate:threat-model-delta
npm run validate:ops-readiness
npm run validate:uat-human-review
npm run validate:uat-result
npm run validate:review-ui
npm run validate:review-runtime-state
npm run validate:review-runtime-interactive
npm run validate:real-uat-readiness
npm run validate:release-pack
npm run validate:provider-experiment
npm run validate:provider-evals
npm run validate:provider-scorer
npm run validate:artifact-registry
npm run validate:artifact-hashes
npm run validate:plan-coverage
npm run validate:process-versioning
npm run validate:process-metrics
npm run validate:process-metrics-snapshot
npm run validate:process-change-ledger
npm run validate:traceability-graph
npm run validate:risk-traceability
npm run validate:risk-matrix
npm run validate:export
npm run validate:export-smoke
npm run validate:renderer-regression
npm run validate:visual
npm test
git diff --check
```
