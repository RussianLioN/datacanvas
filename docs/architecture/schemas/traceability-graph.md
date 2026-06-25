# Traceability Graph

Статус: draft

Базовая цепочка DataCanvas:

`source -> fact -> requirement -> backlog item -> slide spec -> rendered artifact -> test/eval -> sprint decision -> process change`

## Текущий Bootstrap Trace

| Source | Fact | Requirement/Decision | Artifact |
|---|---|---|---|
| SRC-001 | FACT-001 | ADR-002 | `docs/architecture/adr/ADR-002-one-agent-default.md` |
| SRC-001 | FACT-002 | AGENTS.md / process defaults | `AGENTS.md` |
| SRC-001 | FACT-003 | Security baseline | `docs/architecture/security/trust-boundaries.md` |

## Текущий Data Contract Trace

| Input | Normalized Output | Trace Evidence | Проверка |
|---|---|---|---|
| `tests/fixtures/input-package-minimal.json` | `tests/golden/normalized-data-minimal.json` | `tests/golden/trace-manifest-minimal.json` | `npm test` |
