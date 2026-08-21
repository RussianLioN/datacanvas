# DataCanvas

## Актуальные материалы для согласования

- [Черновой кадр полной справки ООО «Водолей Трейд»](docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/frame-review/lisa-materials-full-reference/review.md) — первый SVG-первичный кадр в прежнем разрешении; ожидает отдельной приёмки и не меняет действующую демонстрацию.
- [Утверждённые тексты будущего прототипа Лисы](docs/product/analysis/presentation-link-lisa-user-journey/owner-approved-texts.md) — единственный источник истины для подписи кнопки, сообщений и письма; до покадровой SVG-приёмки и получения редактируемых исходников визуальные кадры не меняются.
- [Исторический пакет кандидатов](docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/owner-selection-packet.md) — кандидаты двухфазного обсуждения; итоговый результат хранится отдельно.

DataCanvas - проект AI-агента, который формирует краткую презентацию на основе данных, подготовленных другим агентом или внешней системой.

## Быстрые маршруты

| Что ищете | Куда идти сначала | Что там находится |
|---|---|---|
| Понять продукт | [Продуктовая документация](docs/product/README.md) | Vision, BMC, истории, требования, бэклог, дорожная карта и гипотезы. |
| Найти требования и критерии приемки | [Требования](docs/product/requirements/README.md) | Бизнес-требования, НФТ, критерии приемки и матрица трассировки. |
| Проверить исходные документы и принятые изменения | [Исходные документы](docs/product/sources/README.md) и [change orders](docs/product/change-orders/README.md) | Реестр источников, аудит источников и принятые изменения продукта. |
| Найти методику и исследования | [Методика проектной документации](docs/process/methodology/README.md) | Правила ведения документации, BABOK-источник и исследование процесса разработки с поддержкой ИИ. |
| Запустить или проверить рабочий процесс документации | [Универсальный рабочий процесс](docs/process/universal-documentation-workflow/README.md) | Runbook, состояние запуска, журналы, правила переноса и проверки. |
| Открыть или скачать интерактивный прототип пути презентации в Лисе | [Открыть раздел](docs/product/analysis/presentation-link-lisa-user-journey/README.md), [запустить демонстрацию](docs/product/analysis/presentation-link-lisa-user-journey/demo/index.html), [скачать ZIP локально](docs/product/analysis/presentation-link-lisa-user-journey/derived/lisa-presentation-user-journey-demo.zip) или [скачать ZIP из GitHub](docs/product/analysis/presentation-link-lisa-user-journey/derived/lisa-presentation-user-journey-demo.zip?raw=true) | Подтверждённый путь от заказа презентации до просмотра и отправки по электронной почте; автономный архив для показа без сети. |
| Импортировать пользовательские истории в Jira | [Руководство по массовому импорту](docs/process/guides/datacanvas-jira-story-bulk-import.md) и [готовый CSV](artifacts/generated/jira/datacanvas-stories-dc-st-23-dc-st-33.csv) | Подготовка, проверка и загрузка пользовательских историй DataCanvas в Jira. |
| Подготовить сдачу или найти evidence | [Release](docs/release/README.md) и [evidence index](docs/knowledge/evidence-index.md) | Релизные доказательства, PR evidence, pilot и handoff-материалы. |
| Найти архитектуру, схемы и проверки | [Архитектура](docs/architecture/README.md), [схемы](schemas/README.md), [команды](package.json) | ADR, схемы, границы доверия, проверки и полный список команд. |

## Продукт DataCanvas

| Что нужно | Куда идти |
|---|---|
| Продуктовый вход | [docs/product/README.md](docs/product/README.md) |
| Vision - видение продукта | [docs/product-vision.md](docs/product-vision.md) |
| CO - заявки на продуктовые изменения | [docs/product/change-orders/README.md](docs/product/change-orders/README.md) |
| BMC - Business Model Canvas, бизнес-модель продукта | [docs/product/bmc/README.md](docs/product/bmc/README.md) |
| Пользовательские истории | [docs/product/requirements/user-stories.md](docs/product/requirements/user-stories.md) |
| Требования и критерии приемки | [docs/product/requirements/README.md](docs/product/requirements/README.md) |
| Product backlog - продуктовый бэклог и оценка работ | [docs/product/backlog/README.md](docs/product/backlog/README.md) и [docs/product/sources/README.md](docs/product/sources/README.md) |
| Таблицы Excel с исходным бэклогом и рабочей оценкой | [Контролируемый XLSX-источник](docs/product/sources/reference/datacanvas-backlog-source-sanitized.xlsx) и [рабочая XLSX-версия с оценкой ПШЕ](docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx) |
| Полный локальный архив главной цепочки | [Внутренний ZIP-архив с ограниченным доступом](artifacts/documentation-archive/datacanvas-main-documentation.zip) — основные файлы действующей цепочки, включая рабочий XLSX, и восемь дополнительных материалов: представления BMC, выгрузка кандидатных историй, очищенный XLSX-источник, руководство и подготовленный CSV для импорта пользовательских историй в Jira; после распаковки доступна автономная навигация. |
| Roadmap - дорожная карта | [docs/product/roadmap/README.md](docs/product/roadmap/README.md) |
| Hypotheses - гипотезы | [docs/product/hypotheses/README.md](docs/product/hypotheses/README.md) |
| BA/SA - бизнес-анализ и системный анализ | [docs/product/analysis/README.md](docs/product/analysis/README.md) и [docs/architecture/system-analysis/README.md](docs/architecture/system-analysis/README.md) |
| Specs - спецификации | [docs/product/specs/README.md](docs/product/specs/README.md) |

## Техническое воплощение ведения проектной документации

| Что нужно | Куда идти |
|---|---|
| Общий вход в документацию | [docs/README.md](docs/README.md) |
| Карта слоев проекта | [docs/project-map.md](docs/project-map.md) |
| Методология ведения проектной документации | [docs/process/methodology/README.md](docs/process/methodology/README.md) |
| Методические исследования | [docs/process/methodology/README.md](docs/process/methodology/README.md) |
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
