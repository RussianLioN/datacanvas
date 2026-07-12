# Commit And PR Evidence

Статус: recorded release evidence

## Metadata

- Process version: `0.1.0`
- Evidence date: `2026-06-29T19:16:09Z`
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

- Текущий `origin/main` для stale-status validation: `0fd398698f9041e9e812f02609f9e6728e004518`
- Дата проверки текущего `main`: `2026-07-12T19:44:50Z`

## Evidence по backlog-closure feature branch

- Branch: `feat/backlog-closure-validation`
- Base `origin/main`: `1dee347e1a83c0a67647a67b8ec82d2aa970be6a`
- PR URL: `https://github.com/RussianLioN/datacanvas/pull/6`
- Merge SHA: `f35092ce04df09428c42d2987e59a06be6445e30`
- PR CI run URL: `https://github.com/RussianLioN/datacanvas/actions/runs/28402608407`
- PR CI job URL: `https://github.com/RussianLioN/datacanvas/actions/runs/28402608407/job/84157376421`
- Main push CI run URL: `https://github.com/RussianLioN/datacanvas/actions/runs/28402695336`
- Main push CI status: `failed` до обновления `current_main_commit`; pointer-refresh выполнен в PR #7.
- Local validation scope: `npm test`, `git diff --check`, `git diff --exit-code`

## Evidence по backlog-closure pointer-refresh

- PR URL: `https://github.com/RussianLioN/datacanvas/pull/7`
- Merge SHA: `309f094b8ef7a3dc8d336886ad69f51fefc2d12e`
- PR CI run URL: `https://github.com/RussianLioN/datacanvas/actions/runs/28542431317`
- PR CI job URL: `https://github.com/RussianLioN/datacanvas/actions/runs/28542431317/job/84619340773`
- Main push CI run URL: `https://github.com/RussianLioN/datacanvas/actions/runs/28542491610`
- Main push CI status: `passed`

## Evidence по первому проходу универсального процесса документации

- PR URL: `https://github.com/RussianLioN/datacanvas/pull/18`
- Merge SHA: `40c4281916b1e64648b8b81b83cbd9739b22c4ba`
- PR CI run URL: `https://github.com/RussianLioN/datacanvas/actions/runs/29205172791`
- PR CI job URL: `https://github.com/RussianLioN/datacanvas/actions/runs/29205172791/job/86683248399`
- PR CI status: `passed`
- Проверенный набор: полный `npm test`, актуальность навигации, чистота generated-артефактов и `git diff --check`.

## Evidence по исправлению проверки служебного указателя в каскаде

- PR URL: `https://github.com/RussianLioN/datacanvas/pull/20`
- Merge SHA: `0fd398698f9041e9e812f02609f9e6728e004518`
- PR CI run URL: `https://github.com/RussianLioN/datacanvas/actions/runs/29206251150`
- PR CI job URL: `https://github.com/RussianLioN/datacanvas/actions/runs/29206251150/job/86686087745`
- PR CI status: `passed`
- Исправлено различие между проверкой PR и проверкой временного дочернего коммита двунаправленного каскада.

## Pull Request Evidence

- PR URL or identifier: `https://github.com/RussianLioN/datacanvas/pull/1`
- Review status: `approved`
- CI status: `passed`
- Merge status: `merged`

## Required Verification

```text
git rev-parse origin/main at release cut: 2c6858e4dc541c899b500edb5ebfb1ca9073c29d
git rev-parse origin/main for stale-status validation: 0fd398698f9041e9e812f02609f9e6728e004518
GitHub Actions docs-check main run: https://github.com/RussianLioN/datacanvas/actions/runs/28165040653
GitHub Actions docs-check PR #6 run: https://github.com/RussianLioN/datacanvas/actions/runs/28402608407
GitHub Actions docs-check main run after PR #6 merge: https://github.com/RussianLioN/datacanvas/actions/runs/28402695336
GitHub Actions docs-check PR #7 run: https://github.com/RussianLioN/datacanvas/actions/runs/28542431317
GitHub Actions docs-check main run after PR #7 merge: https://github.com/RussianLioN/datacanvas/actions/runs/28542491610
GitHub Actions docs-check PR #18 run: https://github.com/RussianLioN/datacanvas/actions/runs/29205172791
GitHub Actions docs-check PR #20 run: https://github.com/RussianLioN/datacanvas/actions/runs/29206251150
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
