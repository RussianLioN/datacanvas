# Журнал Изменений Процесса

## 0.1.0 - 2026-06-22

Статус: active
PCR: `PROC-001`

### Добавлено

- Стартовый паспорт процесса.
- Реестр процесса.
- Process Backlog.
- Шаблон Process Change Request.
- Шаблон процессного эксперимента.
- Метрики здоровья процесса.
- Definition of Ready и Definition of Done.
- Sprint 0 evidence package.

### Причина

Запуск DataCanvas требует управляемого процесса разработки до начала продуктовой реализации.

### Миграции

Миграций нет: это первая версия процесса.

## Управляемые Улучшения Процесса В 0.1.0

### PROC-035 - Threat Model Delta Governance

Статус: accepted
Дата: 2026-06-22
Источник: `docs/process/change-requests/PROC-035-threat-model-delta-governance.md`

#### Изменение

Добавлен обязательный gate `npm run validate:threat-model-delta`, который проверяет, что каждый `docs/sprints/*` имеет запись в `docs/architecture/security/threat-model-delta-manifest.json`.

#### Миграция

Все существующие sprint folders получили coverage entry в manifest. Для будущих спринтов migration rule простое: создать sprint folder можно до Review, но закрыть Review нельзя, пока sprint не добавлен в threat-model delta manifest.

#### Rollback

Удалить gate из `npm test` и CI, вернуть section 9 plan coverage в `partial`, оставить S21 explicit `threat-model-delta.md` как единственный обязательный artifact до нового PCR.

### PROC-036 - Documentation Navigation Governance

Статус: accepted
Дата: 2026-06-25
Источник: `docs/process/change-requests/PROC-036-documentation-navigation-governance.md`

#### Изменение

Закреплен business-first порядок для `README.md`, `docs/README.md` и `docs/product/README.md`. В navigation contract добавлен `navigation_group`, а generated navigation строится группами: business, delivery, technical, governance, evidence и generated.

#### Миграция

Бизнесовые документы DataCanvas добавлены в product index, business routes, artifact registry и generated navigation. Technical backlog явно классифицирован как `technical`, а archived documentation implementation plan классифицирован как governance artifact.

#### Rollback

Откатить `docs/navigation/navigation-source.json`, schemas, generator, validator, registry, hash manifest, generated navigation outputs и business-first README changes одним PR, затем повторить docs navigation, artifact и security gates.

### PROC-037 - Governed BA/SA Discovery Loop

Статус: draft
Дата: 2026-07-02
Источник: `docs/process/change-requests/PROC-037-governed-ba-sa-discovery-loop.md`

#### Изменение

Предложено добавить BA/SA interview evidence, claim status, evidence requests, open question ownership, SA contract/security/NFR check и rollback signals в DoR, DoD и process event log.

#### Миграция

До Process Owner acceptance правило остается draft. Артефакты и валидаторы можно использовать как подготовленный gate, но они не меняют принятую версию процесса.

#### Rollback

Откатить DoR/DoD/process event additions и убрать BA/SA gates из `npm test`.

### PROC-038 - Cascading Documentation Governance

Статус: draft
Дата: 2026-07-02
Источник: `docs/process/change-requests/PROC-038-cascading-documentation-governance.md`

#### Изменение

Предложено добавить `DocumentationChangeRequest`, artifact dependency graph, impact analysis, decision queue, capacity/reprioritization guards, Jira field mapping guards и cascade run evidence в DoR, DoD, process passport, schemas, validators и navigation/artifact tracking.

#### Миграция

До Process Owner acceptance правило остается draft. Артефакты и валидаторы можно использовать как подготовленный gate; concrete capacity, priorities, dates, scope и Jira custom fields не заполняются без отдельного источника.

#### Rollback

Откатить cascade schemas, validators, source artifacts, fixtures, DoR/DoD/passport additions, navigation source и artifact registry entries, затем повторить docs navigation, artifact hash и security gates.

### PROC-046 - Product Change Questionnaire State

Статус: accepted
Дата: 2026-07-03
Источник: `docs/process/change-requests/PROC-046-product-change-questionnaire-state.md`

#### Изменение

Введён контракт сохранения PO-опросника: JSON-состояние, Markdown-журнал, лёгкая проверка `npm run validate:co-questionnaire`, контрольная остановка каждые 5 ответов и обязательное возобновление с вопроса, записанного в state.

#### Миграция

Для `CO-2026-001` создано состояние `docs/product/change-orders/co-2026-001-acceptance-questionnaire-state.json` и журнал `docs/product/change-orders/co-2026-001-acceptance-questionnaire-log.md`. Следующий вопрос сохранён как `PRODUCT-21`.

#### Rollback

Пометить questionnaire artifacts как superseded и удалить `validate:co-questionnaire` из промежуточных validation plans. Продуктовые решения `CO-2026-001` не откатываются без отдельного решения Product Owner.

### PROC-047 — закрыть возобновление PO-опросника `CO-2026-001` — изменения приоритета запуска DataCanvas другим агентом

Статус: done
Дата: 2026-07-05
Источник: `docs/product/change-orders/co-2026-001-acceptance-questionnaire-log.md`

#### Изменение

Закрыт процессный хвост после сохранённой остановки PO-опросника: вопросы `PRODUCT-21` — `PRODUCT-30` завершены, состояние опросника имеет статус `completed`, а `PROC-047` перенесён из `Ready` в `Done` в process backlog.

#### Миграция

Новых продуктовых решений не добавлено. Дальнейшие изменения по DataCanvas оформляются отдельным Product Change Order или impact review.

#### Rollback

Вернуть `PROC-047` в `Ready` только если состояние `docs/product/change-orders/co-2026-001-acceptance-questionnaire-state.json` будет обоснованно переведено из `completed` в активный статус отдельным решением Product Owner.

### PROC-048 — CLI-Friendly Форматирование Таблиц

Статус: done
Дата: 2026-07-07
Источник: `docs/process/change-requests/PROC-048-cli-table-output.md`

#### Изменение

Закреплено правило: табличные данные в рабочем чате Codex CLI выводятся через `cli-table-output` или его правила. Короткие сравнения оформляются списками, матрицы и статусные сводки — fenced `text` Unicode-таблицами, а Markdown pipe table не используется в чате по умолчанию.

#### Миграция

Правило добавлено в `AGENTS.md` и универсальный рабочий процесс документации. `PROC-048` перенесен в Done process backlog; продуктовые артефакты DataCanvas не менялись.

#### Rollback

Вернуть `PROC-048` в Draft, удалить правило `cli-table-output` из `AGENTS.md` и UDW-инструкций, убрать проверку из `validate-universal-documentation-workflow`, затем регенерировать navigation, hash manifest и process metrics snapshot.

### PROC-062 — Безопасный XLSX-Источник И Чистая История Git

Статус: accepted
Дата: 2026-07-12
Источник: `docs/process/change-requests/PROC-062-xlsx-source-history-hygiene.md`

#### Изменение

Оригинальный XLSX с закрытыми метаданными заменён в Git на контролируемую копию и машинный манифест происхождения. Добавлены блокирующие проверки содержимого XLSX во всей истории кандидата и точного SHA, проверяемого CI. SHA-256 исходного файла теперь независимо закреплен в команде и контракте: манифест, созданный из другого файла, больше не может сам подтвердить правильность источника. Принятие рабочей редакции Product Owner отделено от командного согласования трудозатрат: до него перенос в sprint backlog и Jira заблокирован. Срез историй и его CSV-экспорт показывают отдельно принятие формулировок и приоритетов Product Owner и ожидание оценки команды, не задавая календарный квартал. Локальная exact-SHA-команда явно обозначена как smoke-проверка; доказательством pin считается только CI с внешним `EXPECTED_GIT_SHA`. Планировщик больше не поддерживает `--allow-dirty` и явно учитывает все незарегистрированные файлы независимо от пользовательской Git-настройки. Вложенная сквозная проверка использует отдельное пространство путей и реально проходит планирование и финализацию; активный внешний процесс покрывает проверку профиля и завершение без рекурсии. Полный gate ищет подтверждающий маркер во всем неусеченном выводе и блокирует завершение, если маркера нет; семантическая проверка evidence также требует точный набор команд, его хэш и маркер вложенного прохода. В кратком evidence этот результат выводится отдельной первой строкой. Длинное свидетельство также сохраняет начало и конец вывода, поэтому итоговый статус или поздняя ошибка не теряются при ограничении размера. Временные пути исключены из Git.

#### Миграция

Старый PR закрывается без слияния. Итоговое дерево переносится в новую ветку от чистого `main`; продуктовый смысл DataCanvas остаётся неизменным. После слияния отдельный PR обновляет только разрешённые указатели и release evidence.

#### Rollback

Не возвращать загрязнённую историю. До слияния закрыть чистый PR; после слияния выполнить revert отдельным PR. Не ослаблять security-гейты.

### PROC-063 — Блокирующая Проверка Компоновки Визуальных Артефактов

Статус: accepted
Дата: 2026-07-12
Источник: `docs/process/change-requests/PROC-063-derived-visual-layout-gate.md`

#### Изменение

Для SVG, PNG, PDF и PlantUML введена обязательная проверка границ текста, пересечений рамок, равномерности сетки, границ холста и свежести переносимых рендеров. Проверка SVG теперь охватывает заголовок, внутренние прямоугольники и разделительные линии; проверка PlantUML связывает каждый номер бизнес-блока с правильной позицией, а не только считает номера. Генератор перед записью самостоятельно применяет полный геометрический контракт и после рендера вызывает независимый растровый валидатор. В защитной зоне действует нулевой допуск для темных пикселей текста начиная с первого пикселя за рамкой; дополнительно проверяются количество и распределение темных пикселей отдельно в каждом блоке. PDF растеризуется независимым PDF-движком и проходит те же проверки, поэтому подмена PDF или удаление одного блока теперь блокируются. Видимые служебные подписи удалены из визуального BMC, а комментарий генератора — из публичного PlantUML. Актуальный BMC-пакет больше не включает старые снимки предыдущей версии как текущее evidence. Генератор повторно использует PNG/PDF только при неизменном SVG, точных хэшах и корректной структуре, а валидатор сравнивает свежий рендер по визуальному содержанию вместо нестабильного побайтового совпадения между версиями системного рендера. README пакета преобразован в человекочитаемую навигацию с относительными ссылками, встроенными SVG/PNG и кликабельным предпросмотром PDF; служебные команды и JSON из него удалены.

#### Миграция

BMC перегенерирован из канонического SVG. В генератор добавлен предварительный расчет размещения, в валидатор — независимая проверка готового SVG и PlantUML, а в тесты — отрицательные сценарии переполнения, нарушения сетки и устаревшего PNG/PDF.

#### Rollback

Откат выполняется отдельным PR. Исторические снимки нельзя возвращать в актуальный acceptance manifest без воспроизводимой повторной генерации и профильной проверки.

### PROC-064 — Выделение Автоматизации Проектной Документации

Статус: accepted, реализация выполняется
Дата: 2026-08-05
Источник: `docs/process/change-requests/PROC-064-project-documentation-automation-extraction.md`

#### Изменение

Принято создание отдельного закрытого проекта `RussianLioN/project-docs-automation`. Переносимое ядро, контракты, каталоги, шаблоны, планировщик, механизм применения и проверки отделяются от профиля, состояния и продуктового содержания потребителя. Поддерживаются новый проект и существующий неполный проект; отсутствующие факты закрываются вопросами, а не предположениями.

DataCanvas остается пилотом и эталонной реализацией видов документарных артефактов, их связей, форматов, генераторов и проверок. Vision, BMC, требования, истории, бэклог, дорожная карта и другие продуктовые решения DataCanvas не становятся содержанием переносимого проекта.

#### Миграция

Сначала создаются нейтральные контракты и полный реестр каждого файла, команды, динамического семейства и внешнего входа. Затем перенос выполняется вертикальными кластерами с теневым сравнением на одном исходном SHA. Старый путь DataCanvas остается нормативным до `1.0.0`; после переключения совместимые обертки старых команд сохраняются 90 дней.

Версия `0.1.0` требует равенства DataCanvas и двух синтетических сценариев. Версия `1.0.0` требует дополнительно реального нового и реального существующего неполного проекта.

#### Rollback

До появления потребителей отменить решение отдельным коммитом и оставить DataCanvas автономным. После появления потребителей закрепить их на последней проверенной версии, вернуть DataCanvas к старому нормативному пути отдельным PR и не удалять восстановительные снимки до доказанной сохранности данных.
