# Документация DataCanvas

Навигация: [DataCanvas](../README.md) / Документация

Статус: active
Владелец: Documentation Owner
Проверка: `npm run validate:docs-navigation`

## Продукт DataCanvas

| Область | Источники |
|---|---|
| Vision - видение продукта | [docs/product-vision.md](product-vision.md) |
| Stories - пользовательские истории | [docs/stories.md](stories.md) |
| BMC - Business Model Canvas, бизнес-модель продукта | [Markdown-источник](product/bmc/bmc-v0.2.md), [trace source - источник трассировки](product/bmc/bmc-trace.v0.1.json), [PlantUML - текстовая диаграмма](product/bmc/source/derived/datacanvas-bmc.puml), [SVG - векторное изображение](product/bmc/source/derived/datacanvas-bmc.svg), [PNG - растровое изображение](product/bmc/source/derived/datacanvas-bmc.png), [PDF - документ для просмотра](product/bmc/source/derived/datacanvas-bmc.pdf) |
| Business requirements - бизнес-требования | [docs/product/requirements/business-requirements.md](product/requirements/business-requirements.md) |
| Acceptance criteria - критерии приемки | [docs/product/requirements/acceptance-criteria.md](product/requirements/acceptance-criteria.md) |
| BA/SA artifacts - артефакты бизнес-анализа и системного анализа | [docs/product/analysis/README.md](product/analysis/README.md) и [docs/architecture/system-analysis/README.md](architecture/system-analysis/README.md) |
| Specs - спецификации | [docs/product/specs/README.md](product/specs/README.md) |
| Traceability - матрица связей и проверяемости | [docs/product/requirements/traceability-matrix.json](product/requirements/traceability-matrix.json) |
| Product backlog - продуктовый бэклог | [docs/product/backlog/README.md](product/backlog/README.md) |
| Roadmap - дорожная карта | [docs/product/roadmap/README.md](product/roadmap/README.md) |
| Hypotheses - гипотезы | [docs/product/hypotheses/README.md](product/hypotheses/README.md) |

## Техническое Воплощение Ведения Проектной Документации

| Подгруппа | Стартовый документ | Что хранит |
|---|---|---|
| Карта слоев проекта | [docs/project-map.md](project-map.md) | Связь верхних областей репозитория и источников документации. |
| Методология ведения проектной документации | [Методика проектной документации](process/methodology/README.md) | Правила жизненного цикла, качества, трассировки и работы агента. |
| Глубокие исследования по методологии | [Источник исследования BABOK](process/methodology/babok-research-source.md) | Исследовательская база для методики документации. |
| Организация рабочего процесса документации | [Процесс](process/README.md) | Текущий процесс, реестр процесса, управление изменениями и правила работы. |
| Navigation source - ручной источник навигации | [docs/navigation/navigation-source.json](navigation/navigation-source.json) | Единственный ручной источник generated navigation — автоматически созданной навигации. |
| Generated navigation - автоматически созданная навигация | [Карта навигации](navigation/navigation-map.md) | Сгенерированный индекс, карта, отчет об orphan docs — документах без маршрута — и отчет об устаревших статусах. |
| Process/governance - процесс и управление изменениями | [Реестр процесса](process/current/process-registry.md) | Управленческие правила, события, версии и проверки процесса. |
| ADR - архитектурные решения | [Архитектура](architecture/README.md) | Архитектурные решения, системный анализ, безопасность и границы доверия. |
| Schemas - схемы | [Реестр схем](architecture/schemas/schema-registry.md) | JSON Schema, контракты и машинные структуры проектного контура. |
| Scripts - скрипты и validators - проверки | [package.json](../package.json) | Команды генерации, проверки, security scan — проверки безопасности — и полный gate. |
| Delivery - поставочный контур | [Release](release/README.md) | Release, PR evidence — доказательства для PR, pilot и handoff. |
| Evidence - доказательный контур | [Evidence hub](knowledge/evidence-index.md) | Ручные и generated evidence без raw confidential данных. |
| Sprint artifacts - спринтовые артефакты | [Sprint artifacts](sprints/README.md) | Планы, доказательства и манифесты спринтов. |
| Технические планы документационного контура | [Планы](plans/README.md) | Планы работ по документации, методологии и проверкам. |

## Откуда Обновляется Навигация

- Ручной источник навигации: `docs/navigation/navigation-source.json`.
- Автоматически созданный индекс: `docs/navigation/documentation-index.json`.
- Автоматически созданная карта: `docs/navigation/navigation-map.md`.
- Реестр артефактов: `docs/architecture/schemas/artifact-registry.json`.

Новые документы должны попадать в `docs/navigation/navigation-source.json` или в явный ignore с причиной.
