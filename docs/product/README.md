# Продукт DataCanvas

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / Продукт

Статус: active
Владелец: Product Owner
Проверка: `npm run validate:docs-navigation`

Этот документ является каноническим бизнесовым индексом продукта DataCanvas для Product Owner.

## Порядок Чтения

1. [Текущее видение](../product-vision.md)
2. [CO - заявки на продуктовые изменения](change-orders/README.md)
3. [BMC - Business Model Canvas, бизнес-модель продукта](bmc/README.md)
4. [Граница реализации 2026 года](sources/co-2026-003-current-2026-scope.md)
5. [Принятые бизнес-требования 2026 года](requirements/business-requirements.md)
6. [Принятые пользовательские истории 2026 года](requirements/user-stories.md)
7. [Диаграммы последовательности пользовательских историй](requirements/sequence-diagrams/README.md)
8. [Product backlog - продуктовый бэклог](backlog/README.md)
9. [Оценка работ и исходные таблицы](sources/README.md)
10. [Roadmap - дорожная карта](roadmap/README.md)
11. [Гипотезы](hypotheses/README.md)
12. [Аналитика и трассировка](analysis/README.md)
13. [Specs - спецификации](specs/README.md)

## Подтверждённый Контур Q4_2026

[CO-2026-003 — заявка на Q4_2026 для Лисы, Профиля сотрудника и почтовой доставки](change-orders/co-2026-003-q4-lisa-profile.md)
задаёт отдельный подтверждённый контур: один заказ для пары сеанс/пользователь,
адреса только через «Профиль сотрудника», доставка `PPTX` и `PDF` по электронной
почте и безопасные статусы в том же чате Лисы. Сначала прочтите [границу реализации 2026 года](sources/co-2026-003-current-2026-scope.md), затем [стенограмму интервью](change-orders/co-2026-003-q4-lisa-profile-bt-interview-transcript.md), [дополнение к решениям](change-orders/co-2026-003-bt-interview-amendment.md), [принятые бизнес-требования](requirements/business-requirements.md), [принятые пользовательские истории](requirements/user-stories.md) и [диаграммы последовательности](requirements/sequence-diagrams/README.md).

Системный PUSH, ссылка на файл, отдельное хранилище и расширенное редактирование
структуры не входят в Q4_2026. Дословные исторические сообщения сохраняются, а
действующие тексты будущего кандидата находятся в реестре утверждённых текстов.
Интегрированный черновик принят для каскадного обновления документации; чистовая
генерация, изменение действующей демонстрации и архив поставки требуют отдельного
явного подтверждения владельца после этого обновления.

## Индексы Слоев

- [CO - заявки на продуктовые изменения](change-orders/README.md)
- [BMC - Business Model Canvas, бизнес-модель продукта](bmc/README.md)
- [Исходные документы и оценки](sources/README.md)
- [Требования](requirements/README.md)
- [Диаграммы последовательности пользовательских историй](requirements/sequence-diagrams/README.md)
- [Backlog](backlog/README.md)
- [Roadmap](roadmap/README.md)
- [Гипотезы](hypotheses/README.md)
- [Бизнес-анализ](analysis/README.md)
- [Specs - спецификации](specs/README.md)

## Пользовательские пути и интерактивные прототипы

- [Путь заказа и получения презентации в Лисе](analysis/presentation-link-lisa-user-journey/README.md) — описание сценария, состояний и границ прототипа.
- [Открыть принятый черновой прототип](analysis/presentation-link-lisa-user-journey/candidate-evidence/prototype-draft/index.html) — 11 кадров для ООО «Водолей Трейд» в прежней оболочке и навигации.
- [Скачать полный черновой пакет](analysis/presentation-link-lisa-user-journey/candidate-evidence/co-2026-003-current-documentation-draft.zip?raw=true) — автономный ZIP с актуальной документацией и черновиком; это не чистовая поставка.

## Исходные Данные 2026 Года

- [Граница реализации 2026 года](sources/co-2026-003-current-2026-scope.md) — человекочитаемый набор действующих историй и исключений.
- [Исходные документы](sources/README.md) — порядок доверия к актуальной книге владельца продукта и стенограмме интервью.

## Если Нужно Понять Изменения И Ревизию

- [Change Orders](change-orders/README.md) - принятые и обсуждаемые изменения продукта.
- [Бизнес-анализ](analysis/README.md) - потребности, бизнес-правила, изменения требований и открытые решения.
- [System analysis](../architecture/system-analysis/README.md) - системные сценарии, состояния и ошибки.
- [Specs](specs/README.md) - спецификации и безопасный контекст для реализации.
- [Принятые бизнес-требования 2026 года](requirements/business-requirements.md) — исходная точка для следующих этапов каскада требований.

## Разделение Источников

- `docs/product-vision.md` - текущий обзорный Vision.
- `docs/product/vision/manifest.json` - машинный манифест Vision: статус, владелец, проверки и политика чистого публичного текста.
- `docs/product/vision/vision-v0.1.md` - версионированный snapshot Vision.
- `docs/product/bmc/bmc-v0.2.md` - текущий BMC, Business Model Canvas, бизнес-модель продукта.
- `docs/product/requirements/business-requirements.md` - принятый владельцем продукта документ бизнес-требований 2026 года.
- `docs/product/requirements/business-claim-map.json` - машинная карта связи принятых CO с основными бизнес-артефактами.
- `docs/stories.md` - совместимый переход на канонический каталог, оставленный для старых ссылок.
- `docs/product/sources/product-source-registry.json` - машинный реестр источников и их статусов.

## Backlog Контуры

- Product backlog: [backlog/product-backlog.md](backlog/product-backlog.md).
- Technical backlog: [backlog/technical-backlog.md](backlog/technical-backlog.md).
- Eval backlog: [backlog/eval-backlog.md](backlog/eval-backlog.md).
- Process backlog: [../process/current/process-backlog.md](../process/current/process-backlog.md).

Технический, eval и process backlog не являются первичными бизнесовыми маршрутами продукта.

## Когда Обновлять

Обновляй этот вход, если меняются product scope, accepted BMC, требования, backlog, roadmap, гипотезы или traceability.
