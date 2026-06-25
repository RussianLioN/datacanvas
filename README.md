# DataCanvas

DataCanvas - проект AI-агента, который формирует краткую презентацию на основе данных, подготовленных другим агентом или внешней системой. Репозиторий содержит продуктовые документы, адаптируемый процесс разработки, контракты, BMC-артефакты, проверки и evidence для подготовки продукта к review и pilot.

## Ключевые документы

### Продукт

- [Видение продукта DataCanvas](docs/product-vision.md)
- [Каталог stories DataCanvas](docs/stories.md)
- [План имплементации документации DataCanvas](docs/datacanvas-documentation-implementation-plan.md)
- [Актуальное видение](docs/product/vision/vision-v0.1.md)
- [Пользовательские истории](docs/product/requirements/user-stories.md)
- [Product backlog](docs/product/backlog/product-backlog.md)

### Процесс

- [Инструкции агента](AGENTS.md)
- [План адаптивного Scrum-процесса](docs/plans/datacanvas-adaptive-scrum-implementation-plan.md)
- [План умного слияния project docs](docs/plans/datacanvas-smart-docs-merge-plan.md)
- [Паспорт текущего процесса](docs/process/current/process-passport.md)
- [Definition of Ready](docs/process/current/definition-of-ready.md)
- [Definition of Done](docs/process/current/definition-of-done.md)

### BMC и визуальные артефакты

- [BMC package](docs/product/bmc/README.md)
- [BMC v0.2](docs/product/bmc/bmc-v0.2.md)
- [План генерации классического BMC](docs/plans/datacanvas-bmc-classic-generation-contract-plan.md)
- [Visual review](docs/product/bmc/evidence/visual-review.md)

### Evidence и release

- [Sprint evidence manifest](docs/sprints/2026-W26-process-bootstrap/sprint-evidence-manifest.json)
- [Release evidence pack](docs/release/mvp-release-evidence-pack.md)
- [Commit and PR evidence](docs/release/commit-pr-evidence.md)
- [Plan completion audit](docs/process/audits/plan-completion-audit.md)

## Проверка перед review

Quick gate для документационных изменений:

```sh
scripts/validate-bootstrap-artifacts.sh
git diff --check
```

BMC gate для изменений в BMC и визуальных артефактах:

```sh
npm run generate:bmc -- --check
npm run validate:bmc
```

Full gate перед merge:

```sh
npm test
git diff --exit-code
```

Полный список команд находится в `package.json`.

## Структура репозитория

- `docs/` - продуктовая, процессная, архитектурная, sprint и release документация.
- `schemas/` - JSON Schema и контракты артефактов.
- `scripts/` - генераторы, валидаторы, UAT и release utilities.
- `tests/` - fixtures, golden outputs, eval, provider, security и visual проверки.
- `artifacts/` - generated outputs и ручные evidence exports.
