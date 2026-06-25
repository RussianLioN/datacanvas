# Commit And PR Evidence

Статус: recorded release evidence

## Metadata

- Process version: `0.1.0`
- Evidence date: `2026-06-25T10:53:51Z`
- Release owner: `Delivery/GitOps Lead`

## Commit Evidence

- Commit SHA: `2c6858e4dc541c899b500edb5ebfb1ca9073c29d`
- Commit URL or local verification command: `git rev-parse origin/main`
- Branch: `main`
- Working tree status at release cut:

```text
origin/main at 2c6858e4dc541c899b500edb5ebfb1ca9073c29d
```

## Current Main Pointer

- Current `origin/main` for stale-status validation: `f643dcca1108c0fb92b76753c67b5a0479a0839d`
- Current main verification date: `2026-06-25T13:24:57Z`

## Pull Request Evidence

- PR URL or identifier: `https://github.com/RussianLioN/datacanvas/pull/1`
- Review status: `approved`
- CI status: `passed`
- Merge status: `merged`

## Required Verification

```text
git rev-parse origin/main at release cut: 2c6858e4dc541c899b500edb5ebfb1ca9073c29d
git rev-parse origin/main for stale-status validation: f643dcca1108c0fb92b76753c67b5a0479a0839d
GitHub Actions docs-check main run: https://github.com/RussianLioN/datacanvas/actions/runs/28165040653
npm test: passed before merge on PR #1
npm run validate:pilot-gate: passed
npm run validate:process-portability: passed
npm run validate:plan-completion-audit: passed
npm run generate:bmc -- --check: passed
npm run validate:bmc: passed
```

## Release Evidence Links

- Release evidence pack: `docs/release/mvp-release-evidence-pack.json`
- Pilot report: `docs/release/pilot-report.md`
- Completion audit: `docs/process/audits/plan-completion-audit.json`
- Documentation navigation index: `docs/navigation/documentation-index.json`
