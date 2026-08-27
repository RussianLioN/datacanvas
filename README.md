# DataCanvas

## Актуальные Материалы По CO-2026-003

- [Принятые бизнес-требования 2026 года](docs/product/requirements/business-requirements.md) — понятное описание возможностей DataCanvas в согласованной границе девяти пользовательских историй 2026 года.
- [Принятые пользовательские истории 2026 года](docs/product/requirements/user-stories.md) — единый каталог девяти историй и 24 детализированных сценариев.
- [Диаграммы последовательности пользовательских историй](docs/product/requirements/sequence-diagrams/README.md) — GitHub-совместимый обзор 24 принятых сценариев с исходниками и рендерами.
- [Граница реализации 2026 года](docs/product/sources/co-2026-003-current-2026-scope.md) — действующий перечень историй и исключений, подготовленный по книге владельца продукта и интервью.
- [Скачать полный черновой пакет документации и прототипа](docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/co-2026-003-current-documentation-draft.zip?raw=true) — автономный ZIP-архив актуальных документов и принятого 11-кадрового черновика ООО «Водолей Трейд»; это не чистовая поставка.
- [Открыть принятый черновой прототип](docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/prototype-draft/index.html) — 11 кадров в прежней оболочке и навигации прототипа.
- [Реестр решений интервью и дополнений](docs/product/change-orders/co-2026-003-authoritative-interview-decision-register.md) — исторические решения сохранены дословно; `CO3-AMND-001` — дополнение о форматах `PPTX` и `PDF`, `CO3-AMND-002` — дополнение о принятии только изолированного черновика для документального каскада.
- [Реестр разрешений и приёмок выпуска](docs/product/change-orders/co-2026-003-release-approval-ledger.md) — текущий статус документального каскада, кадров и запрета чистового выпуска.
- [Текущий план каскадного обновления](docs/plans/co-2026-003-documentation-cascade-remediation-plan.md) — согласованный порядок завершения документации и выпускных барьеров.
- [Порядок сборки чернового пакета](docs/release/co-2026-003-draft-documentation-archive.md) — состав актуальной документации, принятого 11-кадрового черновика и граница до чистового выпуска.
- [RCA каскадного расхождения](docs/knowledge/rca/2026-08-25-co-2026-003-amendment-cascade-drift.md) — причина неполного обновления после дополнений владельца и постоянные защиты от повтора.

DataCanvas - проект AI-агента, который формирует краткую презентацию на основе данных, подготовленных другим агентом или внешней системой.

## Быстрые маршруты

| Что ищете | Куда идти сначала | Что там находится |
|---|---|---|
| Понять продукт | [Продуктовая документация](docs/product/README.md) | Vision, BMC, истории, требования, бэклог, дорожная карта и гипотезы. |
| Найти принятые требования 2026 года | [Бизнес-требования](docs/product/requirements/business-requirements.md) | Согласованные возможности, ветвления и исключения текущего периода. |
| Проверить исходные документы и принятые изменения | [Исходные документы](docs/product/sources/README.md) и [change orders](docs/product/change-orders/README.md) | Реестр источников, аудит источников и принятые изменения продукта. |
| Найти методику и исследования | [Методика проектной документации](docs/process/methodology/README.md) | Правила ведения документации, BABOK-источник и исследование процесса разработки с поддержкой ИИ. |
| Запустить или проверить рабочий процесс документации | [Универсальный рабочий процесс](docs/process/universal-documentation-workflow/README.md) | Runbook, состояние запуска, журналы, правила переноса и проверки. |
| Открыть принятый черновик пути презентации в Лисе | [Открыть раздел](docs/product/analysis/presentation-link-lisa-user-journey/README.md), [черновой прототип](docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/prototype-draft/index.html) или [скачать полный черновой пакет](docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/co-2026-003-current-documentation-draft.zip?raw=true) | Принятый 11-кадровый черновик ООО «Водолей Трейд» и полный комплект его текущей документации; чистовой выпуск требует отдельного подтверждения. |
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
| Принятые бизнес-требования 2026 года | [docs/product/requirements/business-requirements.md](docs/product/requirements/business-requirements.md) |
| Принятые пользовательские истории 2026 года | [docs/product/requirements/user-stories.md](docs/product/requirements/user-stories.md) |
| Диаграммы последовательности пользовательских историй | [docs/product/requirements/sequence-diagrams/README.md](docs/product/requirements/sequence-diagrams/README.md) |
| Граница реализации 2026 года | [docs/product/sources/co-2026-003-current-2026-scope.md](docs/product/sources/co-2026-003-current-2026-scope.md) |
| Product backlog - продуктовый бэклог и оценка работ | [docs/product/backlog/README.md](docs/product/backlog/README.md) и [docs/product/sources/README.md](docs/product/sources/README.md) |
| Граница и исходные данные 2026 года | [Граница реализации 2026 года](docs/product/sources/co-2026-003-current-2026-scope.md) и [исходные документы](docs/product/sources/README.md) |
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
