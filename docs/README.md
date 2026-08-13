# Документация DataCanvas

Навигация: [DataCanvas](../README.md) / Документация

Статус: active
Владелец: Documentation Owner
Проверка: `npm run validate:docs-navigation`

## Быстрые маршруты

| Что ищете | Куда идти сначала | Что там находится |
|---|---|---|
| Понять продукт | [Продуктовая документация](product/README.md) | Vision, BMC, истории, требования, бэклог, дорожная карта и гипотезы. |
| Найти требования и критерии приемки | [Требования](product/requirements/README.md) | Бизнес-требования, НФТ, критерии приемки и матрица трассировки. |
| Проверить исходные документы и принятые изменения | [Исходные документы](product/sources/README.md) и [change orders](product/change-orders/README.md) | Реестр источников, аудит источников и принятые изменения продукта. |
| Найти методику и исследования | [Методика проектной документации](process/methodology/README.md) | Правила ведения документации, BABOK-источник и исследование процесса разработки с поддержкой ИИ. |
| Запустить или проверить рабочий процесс документации | [Универсальный рабочий процесс](process/universal-documentation-workflow/README.md) | Runbook, состояние запуска, журналы, правила переноса и проверки. |
| Импортировать пользовательские истории в Jira | [Руководство по массовому импорту](process/guides/datacanvas-jira-story-bulk-import.md) и [готовый CSV](../artifacts/generated/jira/datacanvas-stories-dc-st-23-dc-st-33.csv) | Подготовка, проверка и загрузка пользовательских историй DataCanvas в Jira. |
| Подготовить сдачу или найти evidence | [Release](release/README.md) и [evidence index](knowledge/evidence-index.md) | Релизные доказательства, PR evidence, pilot и handoff-материалы. |
| Найти архитектуру, схемы и проверки | [Архитектура](architecture/README.md), [схемы](../schemas/README.md), [команды](../package.json) | ADR, схемы, границы доверия, проверки и полный список команд. |

## Продукт DataCanvas

| Область | Источники |
|---|---|
| Vision - видение продукта | [docs/product-vision.md](product-vision.md) |
| CO - заявки на продуктовые изменения | [docs/product/change-orders/README.md](product/change-orders/README.md) |
| BMC - Business Model Canvas, бизнес-модель продукта | [docs/product/bmc/README.md](product/bmc/README.md) |
| Пользовательские истории | [docs/product/requirements/user-stories.md](product/requirements/user-stories.md) |
| Требования и критерии приемки | [docs/product/requirements/README.md](product/requirements/README.md) |
| Product backlog - продуктовый бэклог и оценка работ | [docs/product/backlog/README.md](product/backlog/README.md) и [docs/product/sources/README.md](product/sources/README.md) |
| Таблицы Excel с исходным бэклогом и рабочей оценкой | [Контролируемый XLSX-источник](product/sources/reference/datacanvas-backlog-source-sanitized.xlsx) и [рабочая XLSX-версия с оценкой ПШЕ](product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx) |
| Полный локальный архив главной цепочки | [Внутренний ZIP-архив с ограниченным доступом](../artifacts/documentation-archive/datacanvas-main-documentation.zip) — основные файлы действующей цепочки, включая рабочий XLSX, и восемь дополнительных материалов: представления BMC, выгрузка кандидатных историй, очищенный XLSX-источник, руководство и подготовленный CSV для импорта пользовательских историй в Jira; после распаковки доступна автономная навигация. |
| Roadmap - дорожная карта | [docs/product/roadmap/README.md](product/roadmap/README.md) |
| Hypotheses - гипотезы | [docs/product/hypotheses/README.md](product/hypotheses/README.md) |
| BA/SA artifacts - артефакты бизнес-анализа и системного анализа | [docs/product/analysis/README.md](product/analysis/README.md) и [docs/architecture/system-analysis/README.md](architecture/system-analysis/README.md) |
| Specs - спецификации | [docs/product/specs/README.md](product/specs/README.md) |

## Техническое воплощение ведения проектной документации

| Подгруппа | Стартовый документ | Что хранит |
|---|---|---|
| Карта слоев проекта | [docs/project-map.md](project-map.md) | Связь верхних областей репозитория и источников документации. |
| Методология ведения проектной документации | [Методика проектной документации](process/methodology/README.md) | Правила жизненного цикла, качества, трассировки и работы агента. |
| Методические исследования | [Методика проектной документации](process/methodology/README.md) | BABOK-источник и исследование процесса разработки с поддержкой ИИ. |
| Организация рабочего процесса документации | [Процесс](process/README.md) | Текущий процесс, реестр процесса, управление изменениями и правила работы. |
| Универсальная методика документационного workflow | [Универсальный рабочий процесс документации](process/universal-documentation-workflow/README.md) | Переносимое ядро методики, профиль DataCanvas, состояние запуска, журналы, генераторы и проверки. |
| Navigation source - ручной источник навигации | [docs/navigation/navigation-source.json](navigation/navigation-source.json) | Единственный ручной источник generated navigation — автоматически созданной навигации. |
| Generated navigation - автоматически созданная навигация | [Карта навигации](navigation/navigation-map.md) | Сгенерированный индекс, карта, отчет об orphan docs — документах без маршрута — и отчет об устаревших статусах. |
| Process/governance - процесс и управление изменениями | [Реестр процесса](process/current/process-registry.md) | Управленческие правила, события, версии и проверки процесса. |
| ADR - архитектурные решения | [Архитектура](architecture/README.md) | Архитектурные решения, системный анализ, безопасность и границы доверия. |
| Schemas - схемы | [Реестр схем](architecture/schemas/schema-registry.md) | JSON Schema, контракты и машинные структуры проектного контура. |
| Scripts - скрипты и validators - проверки | [package.json](../package.json) | Команды генерации, проверки, security scan — проверки безопасности — и полный gate. |
| Delivery - поставочный контур | [Release](release/README.md) | Release, PR evidence — доказательства для PR, pilot и handoff. |
| Evidence - доказательный контур | [Evidence hub](knowledge/evidence-index.md) | Ручные и generated evidence без raw confidential данных. |
| Knowledge base - база знаний | [Knowledge](knowledge/README.md) | RCA, lessons learned и долговременные знания проекта. |
| Sprint artifacts - спринтовые артефакты | [Sprint artifacts](sprints/README.md) | Планы, доказательства и манифесты спринтов. |
| Технические планы документационного контура | [Планы](plans/README.md) | Планы работ по документации, методологии и проверкам. |

## Откуда Обновляется Навигация

- Ручной источник навигации: `docs/navigation/navigation-source.json`.
- Автоматически созданный индекс: `docs/navigation/documentation-index.json`.
- Автоматически созданная карта: `docs/navigation/navigation-map.md`.
- Реестр артефактов: `docs/architecture/schemas/artifact-registry.json`.

Новые документы должны попадать в `docs/navigation/navigation-source.json` или в явный ignore с причиной.
