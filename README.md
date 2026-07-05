# DataCanvas

DataCanvas - проект AI-агента, который формирует краткую презентацию на основе данных, подготовленных другим агентом или внешней системой.

## Продукт DataCanvas

| Что нужно | Куда идти |
|---|---|
| Продуктовый вход | [docs/product/README.md](docs/product/README.md) |
| Vision - видение продукта | [docs/product-vision.md](docs/product-vision.md) |
| Stories - пользовательские истории | [docs/stories.md](docs/stories.md) |
| BMC - Business Model Canvas, бизнес-модель продукта | [Markdown-источник](docs/product/bmc/bmc-v0.2.md), [trace source - источник трассировки](docs/product/bmc/bmc-trace.v0.1.json), [PlantUML - текстовая диаграмма](docs/product/bmc/source/derived/datacanvas-bmc.puml), [SVG - векторное изображение](docs/product/bmc/source/derived/datacanvas-bmc.svg), [PNG - растровое изображение](docs/product/bmc/source/derived/datacanvas-bmc.png), [PDF - документ для просмотра](docs/product/bmc/source/derived/datacanvas-bmc.pdf) |
| Business requirements - бизнес-требования | [docs/product/requirements/business-requirements.md](docs/product/requirements/business-requirements.md) |
| Acceptance criteria - критерии приемки | [docs/product/requirements/acceptance-criteria.md](docs/product/requirements/acceptance-criteria.md) |
| BA/SA artifacts - артефакты бизнес-анализа и системного анализа | [docs/product/analysis/README.md](docs/product/analysis/README.md) и [docs/architecture/system-analysis/README.md](docs/architecture/system-analysis/README.md) |
| Specs - спецификации | [docs/product/specs/README.md](docs/product/specs/README.md) |
| Traceability - матрица связей и проверяемости | [docs/product/requirements/traceability-matrix.json](docs/product/requirements/traceability-matrix.json) |
| Product backlog - продуктовый бэклог | [docs/product/backlog/README.md](docs/product/backlog/README.md) |
| Roadmap - дорожная карта | [docs/product/roadmap/README.md](docs/product/roadmap/README.md) |
| Hypotheses - гипотезы | [docs/product/hypotheses/README.md](docs/product/hypotheses/README.md) |

## Техническое Воплощение Ведения Проектной Документации

| Что нужно | Куда идти |
|---|---|
| Общий вход в документацию | [docs/README.md](docs/README.md) |
| Карта слоев проекта | [docs/project-map.md](docs/project-map.md) |
| Методология ведения проектной документации | [docs/process/methodology/README.md](docs/process/methodology/README.md) |
| Глубокие исследования по методологии | [docs/process/methodology/babok-research-source.md](docs/process/methodology/babok-research-source.md) |
| Организация рабочего процесса документации | [docs/process/README.md](docs/process/README.md) |
| Navigation source - ручной источник навигации | [docs/navigation/navigation-source.json](docs/navigation/navigation-source.json) |
| Generated navigation - автоматически созданная навигация | [docs/navigation/navigation-map.md](docs/navigation/navigation-map.md) |
| Process/governance - процесс и управление изменениями | [docs/process/current/process-registry.md](docs/process/current/process-registry.md) |
| ADR - архитектурные решения | [docs/architecture/README.md](docs/architecture/README.md) |
| Schemas - схемы | [schemas/README.md](schemas/README.md) |
| Scripts - скрипты и validators - проверки | [package.json](package.json) |
| Release/evidence/sprint artifacts - релизные, доказательные и спринтовые артефакты | [docs/release/README.md](docs/release/README.md), [docs/knowledge/evidence-index.md](docs/knowledge/evidence-index.md), [docs/sprints/README.md](docs/sprints/README.md) |
| Технические планы документационного контура | [docs/plans/README.md](docs/plans/README.md) |
| Универсальная методика документационного workflow | [docs/process/universal-documentation-workflow/README.md](docs/process/universal-documentation-workflow/README.md) |

## Проверка

```sh
npm test
git diff --check
```

Полный список команд находится в `package.json`.
