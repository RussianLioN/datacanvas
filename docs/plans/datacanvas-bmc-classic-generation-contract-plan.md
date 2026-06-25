# План внедрения контракта классического BMC DataCanvas

Дата: 2026-06-24
Статус: draft
Владелец: Product Owner / Data Traceability Architect
Связанный инкремент: SPRINT-2026-W26-S64

## Назначение

Внедрить в DataCanvas полноценный контракт генерации Business Model Canvas, который превосходит подход соседнего проекта: классический BMC-контент, классическая визуальная компоновка, чистый публичный BMC, отдельный companion JSON для проверки утверждений, детерминированная генерация `Markdown/SVG/PNG/PDF/PlantUML`, машинная и визуальная приемка, traceability, leakage coverage и CI-gate без ложнозеленых результатов.

Канонический визуальный источник: `SVG` с холстом `3840x2160`. Производные визуальные форматы: `PNG` и `PDF`, сгенерированные из свежего `SVG`. `PlantUML` остается вторичным инженерным артефактом для проверки табличной структуры.

## Изменения в BMC-контенте

Перестроить содержательную модель BMC так, чтобы каждый блок отражал классический смысл Business Model Canvas, а не только workflow генерации презентации.

| Блок | Классический смысл | Содержание DataCanvas |
|---|---|---|
| B1 | Customer Segments | КМ, CSM, перспективно пользователи Лисы; отдельно отразить выгодополучателей и спонсоров, если они подтверждены источниками. |
| B2 | Value Proposition | Быстрое получение рабочей презентации, снижение ручного копирования и верстки, управляемая итерация и проверяемость результата. |
| B3 | Channels | Лиса, выбранные сообщения, кнопка запуска, Оркестратор/A2A, прямой вызов через A2A/MCP, сервисные вызовы от АС. |
| B4 | Customer Relationships | Guided interview, human-in-the-loop, подтверждение описания до генерации, прием правок, feedback/repair loop после доставки. |
| B5 | Revenue Streams / Потоки внутренней ценности и финансирования | Экономия времени, снижение ручной работы, повторное использование, метрики эффекта, источник финансирования и владелец бюджета как отдельные пункты для уточнения в companion JSON. |
| B6 | Key Resources | Входной контекст, описание/PresentationSpec, шаблоны, renderer, схемы, quality gates, интеграции Лисы/A2A/MCP. |
| B7 | Key Activities | Проверка достаточности входа, уточнения, формирование описания, согласование, генерация, доставка, сбор замечаний, повторная генерация, контроль качества. |
| B8 | Key Partners | Лиса, Оркестратор, предшествующие агенты, поставщики данных, АС, A2A/MCP gateway, владельцы шаблонов, renderer/tooling. |
| B9 | Cost Structure | LLM-вызовы, renderer, human review, latency, поддержка, сопровождение, интеграции, шаблоны, эксплуатация и инциденты. |

## Публичный BMC-документ

Перестроить `docs/product/bmc/bmc-v0.2.md` как полноценный clean-документ:

- методика BMC и адаптация для внутреннего продукта;
- граница модели DataCanvas;
- список пользовательских и машинных артефактов;
- краткая канва из 9 блоков;
- отдельные разделы по каждому блоку с 3-5 содержательными пунктами;
- отсутствие validation/status markers в публичном тексте;
- формулировка статуса: `Рабочая версия для продуктового обсуждения`, пока companion JSON содержит незакрытые проверки.

Запрещено включать в публичный Markdown:

- `unconfirmed`, `assumption`, `confidence`, `source_refs`, `evidence_requests`;
- локальные пути;
- SHA;
- служебные команды;
- внутренние trace details.

## Генератор BMC

Обновить `scripts/generate-bmc-artifacts.mjs`:

- генерировать `Markdown`, `SVG`, `PNG`, `PDF`, `PlantUML`, `derived manifest`, `validation-needs JSON`;
- удалить ручную 90x90 PNG-заглушку;
- генерировать `PNG` через `rsvg-convert -w 3840 -h 2160`;
- генерировать `PDF` из того же SVG через `rsvg-convert` или Inkscape;
- фиксировать выбранный PDF-путь в evidence;
- добавить deterministic check-mode: `npm run generate:bmc -- --check`, который проверяет совпадение производных файлов без записи.

## Классическая BMC-визуализация

Сделать `SVG` визуальным источником истины:

- `viewBox="0 0 3840 2160"`;
- `role="img"`;
- обязательные `title` и `desc`;
- верхний ряд: `B8 | B7/B6 | B2 | B4/B3 | B1`;
- нижний ряд: `B9 | B5`;
- центр визуального веса - `B2`;
- спокойная профессиональная палитра без декоративной перегрузки;
- `data-role` для `bmc-root`, каждого блока, заголовка, body-текста, нижнего ряда, cost row и value stream row;
- отсутствие обрезки текста через `slice`;
- короткие визуальные bullets вместо длинных абзацев;
- machine gate на отсутствие overflow и truncation markers.

## Traceability

Расширить `schemas/bmc-trace.schema.json`:

- у `claims` добавить `source_refs`;
- добавить `derivation`;
- добавить `introduced_in`;
- добавить `validation_state`;
- добавить `public_inclusion_policy`;
- проверять, что публичный BMC берет только clean statements;
- хранить статусы и проверки только в `bmc-validation-needs.json` и evidence JSON.

Обновить `docs/product/bmc/source-lock.json`:

- заменить устаревшие reference paths на фактический reference `/Users/rl/coding/AI-agent-platform`;
- сохранить SHA проверенных reference-файлов;
- указать, что соседний проект используется как method reference, а не источник DataCanvas product claims;
- до refresh ветки `codex/datacanvas-stories-doc` оставить BMC в статусе `draft_working`.

## Визуальный BMC-пакет

Добавить или обновить пакет:

- `docs/product/bmc/README.md` - точка входа, назначение, команды открытия;
- `docs/product/bmc/source-map.md` - связь BMC-блоков с trace/source refs;
- `docs/product/bmc/text-alternative.md` - текстовая альтернатива SVG/PNG/PDF;
- `docs/product/bmc/manifest.json` - SHA, размеры, форматы, генератор, validator versions;
- `docs/product/bmc/evidence/visual-review.md` - ручной визуальный вердикт;
- `docs/product/bmc/evidence/designer-consilium.json` - минимум 5 дизайн-ролей, verdict, SHA проверенных файлов, отсутствие blocker/major;
- `docs/product/bmc/evidence/bmc-visual-acceptance.json` - machine-readable evidence по SVG/PNG/PDF/PlantUML.

## Validators

Добавить validators и включить их в `npm run validate:bmc`:

- `scripts/validate-bmc-visual.mjs`:
  - XML validity;
  - `viewBox`;
  - `role/title/desc`;
  - `data-role`;
  - 9 BMC-блоков;
  - классическая раскладка;
  - отсутствие forbidden refs;
  - контраст;
  - минимальный размер текста;
  - отсутствие overflow/truncation markers.
- `scripts/validate-bmc-render-parity.mjs`:
  - `PNG/PDF` свежие относительно `SVG`;
  - PNG `3840x2160`;
  - nonblank;
  - hash match;
  - `rsvg-convert` output совпадает с committed PNG.
- `scripts/validate-bmc-content-classic.mjs`:
  - наличие классических блоков BMC;
  - корректная адаптация `B5`;
  - запрет подмены BMC workflow-описанием без business-model смысла.
- `scripts/validate-bmc-package.mjs`:
  - наличие README/source-map/text-alternative/manifest/evidence;
  - согласованность SHA;
  - отсутствие служебных данных в публичных артефактах.

## Схемы и манифесты

Обновить:

- `schemas/bmc-derived-manifest.schema.json` - добавить `pdf`;
- `schemas/bmc-visual-acceptance.schema.json` - новый контракт visual evidence;
- `schemas/bmc-package-manifest.schema.json` - новый контракт BMC package manifest;
- `scripts/validate-json-schema.mjs` - добавить новые JSON-артефакты;
- `docs/architecture/schemas/artifact-registry.json` - зарегистрировать новые artifacts;
- `docs/architecture/security/data-leakage-manifest.json` - включить весь BMC-пакет, включая SVG/PNG/PDF/PUML/manifest/source-map/text-alternative/evidence;
- `docs/architecture/schemas/artifact-hash-manifest.json` - пересобрать после регистрации.

## CI и QA

Обновить CI:

- добавить явные steps:
  - `npm run generate:bmc`;
  - `npm run validate:bmc`;
  - `npm run validate:bmc-visual`;
  - `npm run validate:bmc-render-parity`;
  - `npm run validate:artifact-hashes`;
- после generation в CI выполнить `git diff --exit-code`;
- если `rsvg-convert` отсутствует в CI, job должен падать с понятным сообщением;
- Inkscape gate сделать optional-local evidence, но обязательным перед внешней публикацией или пользовательской приемкой;
- browser smoke добавить как локальный или CI-compatible check:
  - открыть SVG/HTML wrapper;
  - проверить ненулевой bounding box;
  - сделать screenshot/crop;
  - зафиксировать nonblank result.

## Sprint и Process Evidence

Обновить:

- `docs/sprints/2026-W26-bmc-interview/sprint-evidence-manifest.json` - заменить старую цель на BMC visual contract implementation;
- устаревшие ограничения про `real interview not conducted`, если runtime state уже completed;
- machine-readable evidence fields:
  - `checked_at`;
  - `command`;
  - `exit_code`;
  - `input_sha256`;
  - `output_sha256`;
  - `artifact_paths`;
- process metrics/hash manifests после генерации.

## Rollback и Stop Rules

Стоп-правила:

- если `validate:bmc-visual` падает, не публиковать BMC как визуальный результат;
- если `validate:bmc-render-parity` падает, не публиковать BMC как визуальный результат;
- если source refresh не выполнен, не повышать статус выше `draft_working`;
- если visual review содержит blocker или major, не переводить пакет в `ready_for_user_acceptance`.

Rollback:

- отключить новые BMC gates из `package.json`;
- восстановить предыдущие generated artifacts и registry/hash/security manifests из git;
- вернуть BMC status в `draft_interviewed`;
- сохранить RCA/lesson для visual failure;
- предпочитать forward-fix, если проблема локализована в генераторе или visual gate.

## Acceptance Criteria

Генерация:

- `npm run generate:bmc`;
- `npm run generate:bmc -- --check`;
- `node scripts/generate-artifact-hash-manifest.mjs`.

BMC-проверки:

- `npm run validate:bmc`;
- `npm run validate:bmc-visual`;
- `npm run validate:bmc-render-parity`;
- `npm run validate:bmc-content-classic`;
- `npm run validate:bmc-package`.

Общие проверки:

- `npm run validate:schemas`;
- `npm run validate:data-leakage`;
- `npm run validate:artifact-registry`;
- `npm run validate:artifact-hashes`;
- `npm test`.

Чистота публичных артефактов:

```bash
rg -n "не подтверждено|допущение|подтверждено|unconfirmed|assumption|confirmed|Confidence|Evidence Requests|Open Questions|Source refs|/Users/|file://" docs/product/bmc/bmc-v0.2.md docs/product/bmc/source/derived/datacanvas-bmc.svg docs/product/bmc/source/derived/datacanvas-bmc.puml
```

Ожидаемый результат: пустой вывод.

Визуальная приемка:

- открыть `docs/product/bmc/source/derived/datacanvas-bmc.png`;
- открыть `docs/product/bmc/source/derived/datacanvas-bmc.pdf`;
- открыть `docs/product/bmc/source/derived/datacanvas-bmc.svg`;
- подтвердить:
  - 9 блоков;
  - классическая структура;
  - текст читается;
  - нет обрезки;
  - нет служебных меток;
  - нет пустых зон;
  - нижний ряд корректен;
  - `B2/B7/B9/B5` читаются без увеличения.

## Assumptions

- Цель текущего инкремента - локальный BMC-пакет в репозитории, без Kaiten-публикации.
- Kaiten/browser-comment gate добавляется отдельным инкрементом только при наличии card/comment URL.
- SVG является каноническим визуальным источником; PNG/PDF являются производными.
- DataCanvas BMC остается рабочей draft-версией, пока source refresh и validation-needs не закрыты.
- Публичный BMC и рендеры остаются чистыми; validation metadata хранится только в companion/evidence JSON.
