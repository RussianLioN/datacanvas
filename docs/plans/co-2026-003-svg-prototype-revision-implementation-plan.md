# План реализации пересборки SVG-прототипа CO-2026-003

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / [Планы](README.md) / План реализации пересборки SVG-прототипа CO-2026-003

> **Для агентских исполнителей:** обязательный поднавык: использовать `superpowers:subagent-driven-development` или `superpowers:executing-plans` для выполнения этого плана по задачам. Шаги используют синтаксис чекбоксов (`- [ ]`) для отслеживания.

**Цель:** подготовить будущую пересборку SVG-прототипа заказа презентации из Лисы так, чтобы новый контур появился только после выбора владельцем текстов, получения редактируемых исходников, покадровой приёмки и транзакционного переключения выпуска.

**Архитектура:** текущий активный выпуск остаётся исторически действующим до отдельного переключения. Будущий кандидат версии 3 описывает источники, 11 будущих кадров, 2 исторических кадра, граф переходов, порядок демонстрации, проверки полноты данных, визуальные блокировки и откат. Рендер выполняется только по схеме SVG-first: канонический SVG, проверка SVG, черновой PNG, согласование владельца, затем высокий выпуск заново из утверждённых SVG.

**Техническая основа:** Markdown-документы, JSON-договоры, JSON Schema, Node.js-генераторы и валидаторы, Playwright/WebKit для доказательств, ZIP-архив поставки, штатный генератор навигации.

## Глобальные ограничения

- `CO-2026-003` — заявка на изменение Q4_2026; в человекочитаемых строках рядом с кодом всегда указывать, что это изменение Q4_2026 для заказа презентации из Лисы.
- Текущий активный выпуск не менять до транзакционного переключения: `docs/product/analysis/presentation-link-lisa-user-journey/source/journey-contract.json`, `docs/product/analysis/presentation-link-lisa-user-journey/source/active-contracts.json`, `docs/product/analysis/presentation-link-lisa-user-journey/demo/**`, `docs/product/analysis/presentation-link-lisa-user-journey/derived/**`, `docs/product/analysis/presentation-link-lisa-user-journey/evidence/**` остаются действующим историческим комплектом.
- Будущий кандидат создаётся как договор версии 3 и не становится входом активных генераторов, пока владелец не согласует все кадры и полный черновой прототип.
- До выбора владельцем текстов запрещено менять SVG, PNG, HTML, ZIP, активные договоры и доказательства.
- В репозиторий не попадают локальные пути, исходник справки, исходные файлы владельца и закрытые метаданные внешних редактируемых исходников.
- Все презентационные кадры рендерятся только из канонических SVG; внешний редактируемый файл презентации сам по себе не является входом рендера.
- Запрещены HTML-, CSS-, PNG- и дополнительные SVG-наложения текста поверх растра, а также масштабирование чернового PNG для высокого выпуска.
- Архив поставки создаётся только после актуального высокого выпуска и свежих доказательств.

## Текущие проверенные пути

- Фундамент кандидата: `docs/product/analysis/presentation-link-lisa-user-journey/prototype-revision-candidate.md`.
- Машиночитаемый кандидат: `docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json`.
- Договор брейншторма: `docs/product/analysis/presentation-link-lisa-user-journey/source/brainstorming-contract.json`.
- Очищенная модель клиента: `docs/product/analysis/presentation-link-lisa-user-journey/source/client-reference-data.json`.
- Действующий договор пути: `docs/product/analysis/presentation-link-lisa-user-journey/source/journey-contract.json`.
- Действующий реестр договоров: `docs/product/analysis/presentation-link-lisa-user-journey/source/active-contracts.json`.
- Действующие визуальные договоры: `docs/product/analysis/presentation-link-lisa-user-journey/source/frame-contract.json`, `docs/product/analysis/presentation-link-lisa-user-journey/source/visual-basis-contract.json`, `docs/product/analysis/presentation-link-lisa-user-journey/source/visual-components-contract.json`, `docs/product/analysis/presentation-link-lisa-user-journey/source/source-render-catalog.json`.
- Генератор прототипа: `scripts/generate-presentation-link-lisa-user-journey.mjs`.
- Импорт редактируемых источников: `scripts/import-presentation-link-lisa-editable-sources.mjs`.
- Захват доказательств: `scripts/capture-presentation-link-lisa-runtime-evidence.mjs`.
- Профильный валидатор: `scripts/validate-co-2026-003-prototype-revision.mjs`.
- Действующее RCA — разбор первопричины: `docs/release/co-2026-003-visual-prototype-rca.md`.
- Договор архива поставки: `docs/release/co-2026-003-prototype-delivery-archive-contract.json`.
- Человекочитаемая обёртка архива: `docs/release/co-2026-003-prototype-delivery-archive.md`.
- Навигационный источник: `docs/navigation/navigation-source.json`.

## Карта файлов будущей реализации

- Изменить: `docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json` — кандидат версии 3, будущие кадры, графы, источники, блокировки и откат.
- Изменить: `docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/prototype-revision-candidate.schema.json` — проверяемая структура кандидата версии 3.
- Изменить: `docs/product/analysis/presentation-link-lisa-user-journey/prototype-revision-candidate.md` — человекочитаемая обёртка кандидата без разрешения на рендер.
- Изменить: `docs/product/analysis/presentation-link-lisa-user-journey/source/brainstorming-contract.json` — пять независимых циклов выбора текста.
- Изменить: `docs/product/analysis/presentation-link-lisa-user-journey/source/client-reference-data.json` — только очищенная модель ООО «Водолей Трейд», без исходника справки и локальных путей.
- Изменить: `docs/product/analysis/presentation-link-lisa-user-journey/source/source-render-catalog.json` — регистрация канонических SVG будущих кадров после получения источников.
- Изменить: `docs/product/analysis/presentation-link-lisa-user-journey/source/frame-contract.json` — 11 будущих кадров, 2 исторических кадра и разрешённые SVG-группы.
- Изменить: `docs/product/analysis/presentation-link-lisa-user-journey/source/visual-basis-contract.json` — границы геометрии, текста, холста и запрет наложений.
- Изменить: `docs/product/analysis/presentation-link-lisa-user-journey/source/visual-components-contract.json` — допустимые группы SVG и запрет новых декоративных слоёв.
- Изменить после приёмки: `docs/product/analysis/presentation-link-lisa-user-journey/source/active-contracts.json` — единственный момент включения кандидата в активный выпуск.
- Изменить после приёмки: `docs/product/analysis/presentation-link-lisa-user-journey/source/journey-contract.json` — только вместе с активным реестром и производными выходами.
- Изменить: `scripts/validate-co-2026-003-prototype-revision.mjs` и `tests/co-2026-003-prototype-revision.test.mjs` — профильная проверка кандидата, источников, маршрута, полноты данных и блокировок.
- Изменить: `scripts/generate-presentation-link-lisa-user-journey.mjs` и `scripts/lib/presentation-link-lisa-full-package-transaction.mjs` — транзакционная генерация после всех согласований.
- Изменить: `docs/release/co-2026-003-visual-prototype-rca.md` — новое дополнение RCA при сохранении старого разбора историческим.
- Изменить после высокого выпуска: `docs/release/co-2026-003-prototype-delivery-archive-contract.json`, `docs/release/co-2026-003-prototype-delivery-archive.md`, `artifacts/delivery/co-2026-003-q4-lisa-profile-delivery.zip`.
- Изменить после включения новых ручных документов: `docs/navigation/navigation-source.json`, затем сгенерировать `docs/navigation/documentation-index.json`, `docs/navigation/navigation-map.md`, `docs/navigation/orphan-docs-report.md`, `docs/navigation/stale-status-report.md`.

## Task 1: Зафиксированный фундамент кандидата

**Статус:** завершён как вход в будущую пересборку.

**Files:**
- Read: `docs/product/analysis/presentation-link-lisa-user-journey/prototype-revision-candidate.md`
- Read: `docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json`
- Read: `docs/product/analysis/presentation-link-lisa-user-journey/source/active-contracts.json`
- Read: `docs/product/analysis/presentation-link-lisa-user-journey/source/journey-contract.json`

**Interfaces:**
- Consumes: текущий кандидат со статусом `candidate_pending_owner_selection_and_editable_sources`.
- Produces: неизменяемый вход для Task 2 и Task 3; активный выпуск сохраняется историческим.

- [x] **Step 1: Подтвердить, что кандидат не является входом генератора**

  Проверить поля `current_journey_contract_policy.unchanged_by_this_candidate = true` и `candidate_is_not_generator_input = true` в `source/prototype-revision-candidate.json`.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: команда завершается с кодом 0 и подтверждает, что кандидат не включён в активный реестр.

- [x] **Step 2: Сохранить ссылку на фундамент кандидата**

  В будущих задачах ссылаться на `docs/product/analysis/presentation-link-lisa-user-journey/prototype-revision-candidate.md` как на исторический фундамент, а не как на разрешение рендера.

  Expected: в будущих документах нет формулировки, что текущий кандидат уже активировал SVG, PNG, HTML или архив.

## Task 2: Пять независимых циклов выбора текста

**Files:**
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/brainstorming-contract.json`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json`
- Test: `tests/co-2026-003-prototype-revision.test.mjs`
- Validate: `scripts/validate-co-2026-003-prototype-revision.mjs`

**Interfaces:**
- Consumes: пять тем из `source/brainstorming-contract.json`.
- Produces: ровно пять владельчески выбранных текстов для Task 5; SVG остаются неизменными до завершения этой задачи.

- [ ] **Step 1: Написать проверку порядка и независимости тем**

  Добавить в `tests/co-2026-003-prototype-revision.test.mjs` проверку, что массив `topics` содержит ровно эти темы и в этом порядке: `button_label`, `generation_started_message`, `delivery_success_message`, `email_subject`, `email_body`.

  Run: `node --test tests/co-2026-003-prototype-revision.test.mjs`

  Expected: FAIL, если порядок тем изменён, тема отсутствует или появилась шестая тема.

- [ ] **Step 2: Закрепить цикл для текста кнопки**

  В `source/brainstorming-contract.json` для `button_label` сохранить: вводная владельца продукта, первая общая волна 19 участников, не менее 20 вариантов от каждого участника, единый список ровно 30 вариантов, независимая вторая волна 19 участников с анонимной оценкой, ровно 5 кандидатов, финальный выбор владельца.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; поле `generated_candidate_texts` пустое до запуска владельческого цикла.

- [ ] **Step 3: Закрепить цикл для сообщения о начале формирования**

  В `source/brainstorming-contract.json` для `generation_started_message` сохранить тот же количественный контракт: 19 участников первой волны, минимум 20 вариантов от каждого, ровно 30 консолидированных вариантов, 19 независимых оценщиков второй волны, ровно 5 кандидатов, выбор владельца.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; SVG и PNG не изменены.

- [ ] **Step 4: Закрепить цикл для сообщения об успешной отправке**

  В `source/brainstorming-contract.json` для `delivery_success_message` сохранить запрет на резкую формулировку «проверьте почтовый ящик» как вход для владельческого обсуждения, но не создавать готовые варианты текста.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; финальный текст отсутствует до выбора владельца.

- [ ] **Step 5: Закрепить цикл для темы письма**

  В `source/brainstorming-contract.json` для `email_subject` сохранить требование включать ООО «Водолей Трейд» и помогать находить письмо в списке.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; тема письма не записана в SVG письма до выбора владельца.

- [ ] **Step 6: Закрепить цикл для тела письма**

  В `source/brainstorming-contract.json` для `email_body` сохранить требование краткого делового текста без обращения по имени и без копирования приложенного образца.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; тело письма не записано в SVG письма до выбора владельца.

- [ ] **Step 7: Зафиксировать коммит цикла текстов**

  Run:

  ```bash
  git add docs/product/analysis/presentation-link-lisa-user-journey/source/brainstorming-contract.json tests/co-2026-003-prototype-revision.test.mjs scripts/validate-co-2026-003-prototype-revision.mjs
  git commit -m "docs: lock co-2026-003 text selection cycles"
  ```

  Expected: один коммит без изменений SVG, PNG, HTML, `demo/**`, `derived/**` и `evidence/**`.

## Task 3: Кандидат версии 3 и входные источники

**Files:**
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/prototype-revision-candidate.schema.json`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/prototype-revision-candidate.md`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/client-reference-data.json`
- Test: `tests/co-2026-003-prototype-revision.test.mjs`

**Interfaces:**
- Consumes: выбранные владельцем тексты из Task 2 и очищенную модель ООО «Водолей Трейд».
- Produces: кандидат версии 3 с четырьмя ожидаемыми внешними источниками: три редактируемых исходника вариантов презентации и один канонический SVG кадра письма.

- [ ] **Step 1: Написать проверку версии кандидата и запрета локальных путей**

  Проверка должна требовать `version = "3.0.0"`, `render_allowed = false` до полного набора входов, отсутствие `absPath`, `/Users/`, `file://` и исходника справки в кандидате, модели клиента и манифестах.

  Run: `node --test tests/co-2026-003-prototype-revision.test.mjs`

  Expected: FAIL на кандидате без версии 3 или с локальным путём.

- [ ] **Step 2: Обновить схему кандидата**

  В `source/schemas/prototype-revision-candidate.schema.json` закрепить обязательные разделы: `candidate_contract_version`, `required_external_editable_sources`, `canonical_svg_required_before_render`, `active_future_frame_ids`, `historical_inactive_frame_ids`, `semantic_graphs`, `visual_acceptance_contract`, `release_blockers`, `rollback_plan`.

  Run: `npm run validate:schemas`

  Expected: PASS; схема принимает только кандидата с 11 будущими кадрами и 2 историческими кадрами.

- [ ] **Step 3: Обновить кандидат**

  В `source/prototype-revision-candidate.json` сохранить `candidate_contract_version = "3.0.0"` и четыре входа:
  `presentation_variant_slidedoc_editable_source`, `presentation_variant_sber2025_editable_source`, `presentation_variant_mag_editable_source`, `email_frame_canonical_svg_source`.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; внешний файл презентации помечен как источник анализа, но не как вход рендера.

- [ ] **Step 4: Зафиксировать полную модель данных клиента**

  Проверка должна требовать, чтобы группы `general_information`, `business_owners`, `financial_indicators`, `cooperation`, `sber_share`, `active_deals`, `potential`, `preapproved_offers`, `insights`, `meeting_agreements`, `dynamic_suggestions`, `actions` присутствовали в полной справке и были распределены по трём страницам каждого из трёх вариантов презентации.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; проверка полноты групп есть, кадры презентаций ещё не создаются.

- [ ] **Step 5: Обновить человекочитаемую обёртку**

  В `prototype-revision-candidate.md` написать, что кандидат версии 3 блокирует рендер до получения входов и не хранит локальные пути или исходник справки.

  Run: `npm run validate:doc-links`

  Expected: PASS; ссылки ведут на существующие относительные пути.

- [ ] **Step 6: Зафиксировать коммит кандидата версии 3**

  Run:

  ```bash
  git add docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/prototype-revision-candidate.schema.json docs/product/analysis/presentation-link-lisa-user-journey/prototype-revision-candidate.md docs/product/analysis/presentation-link-lisa-user-journey/source/client-reference-data.json tests/co-2026-003-prototype-revision.test.mjs
  git commit -m "docs: define co-2026-003 prototype revision candidate v3"
  ```

  Expected: коммит не содержит активных договоров, SVG, PNG, HTML, ZIP и доказательств.

## Task 4: Реальный граф и порядок демонстрации

**Files:**
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/prototype-revision-candidate.schema.json`
- Test: `tests/co-2026-003-prototype-revision.test.mjs`

**Interfaces:**
- Consumes: список будущих и исторических кадров из Task 3.
- Produces: два независимых описания: реальный граф переходов и порядок демонстрационной галереи.

- [ ] **Step 1: Написать проверку количества кадров**

  Проверка должна требовать ровно 11 `active_future_frame_ids` и ровно 2 `historical_inactive_frame_ids`.

  Run: `node --test tests/co-2026-003-prototype-revision.test.mjs`

  Expected: FAIL, если активных будущих кадров не 11 или исторических кадров не 2.

- [ ] **Step 2: Закрепить реальные переходы**

  В `semantic_graphs` сохранить: успех является прямым исходом `lisa-presentation-generating`; список чатов является отдельной веткой возврата к `lisa-presentation-sent`; письмо открывает три вложения как альтернативы; ошибки не являются продолжением успеха.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; у `lisa-order-not-accepted`, `lisa-delivery-delayed`, `lisa-delivery-partial` нет входящего перехода из `lisa-presentation-sent`.

- [ ] **Step 3: Закрепить порядок демонстрационной галереи**

  В `stakeholder_gallery_order.ordered_state_ids` сохранить порядок: `lisa-materials-full-reference`, `lisa-presentation-generating`, `lisa-presentation-chat-list`, `lisa-presentation-sent`, `lisa-presentation-email`, `lisa-presentation-slidedoc`, `lisa-presentation-sber2025`, `lisa-presentation-mag`, `lisa-order-not-accepted`, `lisa-delivery-delayed`, `lisa-delivery-partial`.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; поле `is_user_scenario_transition` для галереи равно `false`.

- [ ] **Step 4: Зафиксировать коммит маршрута**

  Run:

  ```bash
  git add docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/prototype-revision-candidate.schema.json tests/co-2026-003-prototype-revision.test.mjs
  git commit -m "docs: separate co-2026-003 scenario graph and gallery order"
  ```

  Expected: коммит меняет только кандидат, схему и проверку кандидата.

## Task 5: SVG-first технический контур

**Files:**
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/source-render-catalog.json`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/frame-contract.json`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/visual-basis-contract.json`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/visual-components-contract.json`
- Modify: `scripts/import-presentation-link-lisa-editable-sources.mjs`
- Modify: `scripts/validate-co-2026-003-prototype-revision.mjs`
- Test: `tests/co-2026-003-prototype-revision.test.mjs`

**Interfaces:**
- Consumes: выбранные владельцем тексты и полученные канонические SVG.
- Produces: проверяемый SVG-first источник для будущего рендера без наложений и без масштабирования черновых PNG.

- [ ] **Step 1: Написать отрицательные проверки наложений**

  Проверка должна отвергать `html_overlay`, `css_overlay`, `png_text_overlay`, `additional_svg_message_overlay`, `draft_png_upscale_for_final`, новые группы вне разрешённого списка и текст за пределами холста.

  Run: `node --test tests/co-2026-003-prototype-revision.test.mjs`

  Expected: FAIL на фикстуре с наложением поверх растра.

- [ ] **Step 2: Зарегистрировать канонические SVG**

  После получения источников владельца внести в `source-render-catalog.json` канонические SVG для письма и трёх вариантов презентации, сохранив только относительные пути, SHA-256 и натуральные размеры.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; внешний редактируемый файл не становится входом рендера.

- [ ] **Step 3: Ограничить правку существующими SVG-группами**

  В `frame-contract.json`, `visual-basis-contract.json` и `visual-components-contract.json` указать разрешённые исходные группы для текста кнопки, начала формирования, успеха, темы письма и тела письма. Новые группы или добавочные слои запрещены.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; валидатор проверяет стиль, геометрию, текст, выход за холст и отсутствие пересечений.

- [ ] **Step 4: Зафиксировать границу включения в активный реестр**

  В валидаторе требовать, чтобы `source/active-contracts.json` принимал кандидата только после полного набора согласований и свежего высокого выпуска.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; кандидат с отсутствующим согласованием не может попасть в активный реестр.

- [ ] **Step 5: Зафиксировать коммит SVG-first контура**

  Run:

  ```bash
  git add docs/product/analysis/presentation-link-lisa-user-journey/source/source-render-catalog.json docs/product/analysis/presentation-link-lisa-user-journey/source/frame-contract.json docs/product/analysis/presentation-link-lisa-user-journey/source/visual-basis-contract.json docs/product/analysis/presentation-link-lisa-user-journey/source/visual-components-contract.json scripts/import-presentation-link-lisa-editable-sources.mjs scripts/validate-co-2026-003-prototype-revision.mjs tests/co-2026-003-prototype-revision.test.mjs
  git commit -m "feat: enforce svg-first co-2026-003 revision inputs"
  ```

  Expected: коммит не публикует `demo/**`, `derived/**`, `evidence/**` и архив.

## Task 6: Покадровая последовательность согласования

**Files:**
- Create: `docs/product/analysis/presentation-link-lisa-user-journey/evidence/prototype-revision-owner-approval-log.md`
- Create: `docs/product/analysis/presentation-link-lisa-user-journey/evidence/prototype-revision-owner-approval-state.json`
- Modify: `scripts/validate-co-2026-003-prototype-revision.mjs`
- Test: `tests/co-2026-003-prototype-revision.test.mjs`

**Interfaces:**
- Consumes: SVG-first источники из Task 5.
- Produces: покадровые явные согласования владельца; высокий выпуск остаётся заблокированным до 11 согласований и полного чернового прототипа.

- [ ] **Step 1: Написать проверку последовательности кадра**

  Проверка должна требовать для каждого из 11 будущих кадров порядок: выбранный текст, правка исходной группы канонического SVG, визуальная проверка SVG, черновой PNG в текущем разрешении, явное согласование владельца.

  Run: `node --test tests/co-2026-003-prototype-revision.test.mjs`

  Expected: FAIL, если кадр согласован без SVG-проверки или без чернового PNG.

- [ ] **Step 2: Создать журнал согласований**

  В `prototype-revision-owner-approval-log.md` завести 11 записей по кадрам: `lisa-materials-full-reference`, `lisa-presentation-generating`, `lisa-presentation-chat-list`, `lisa-presentation-sent`, `lisa-presentation-email`, `lisa-presentation-slidedoc`, `lisa-presentation-sber2025`, `lisa-presentation-mag`, `lisa-order-not-accepted`, `lisa-delivery-delayed`, `lisa-delivery-partial`.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; незаполненные согласования блокируют высокий выпуск, но не ломают исторический активный выпуск.

- [ ] **Step 3: Создать состояние согласований**

  В `prototype-revision-owner-approval-state.json` хранить только относительные пути, идентификаторы кадров, отметки согласований и SHA-256 черновых PNG; не хранить локальные пути и исходники владельца.

  Run: `npm run validate:data-leakage`

  Expected: PASS; локальные пути и закрытые метаданные не найдены.

- [ ] **Step 4: Зафиксировать общее согласование черновика**

  После 11 покадровых согласований добавить в состояние событие `draft_full_prototype_current_resolution_rendered`, затем `owner_full_prototype_approval`. Высокий рендер разрешается только после этих двух событий.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; высокий выпуск заблокирован до полного чернового согласования.

- [ ] **Step 5: Зафиксировать коммит согласований**

  Run:

  ```bash
  git add docs/product/analysis/presentation-link-lisa-user-journey/evidence/prototype-revision-owner-approval-log.md docs/product/analysis/presentation-link-lisa-user-journey/evidence/prototype-revision-owner-approval-state.json scripts/validate-co-2026-003-prototype-revision.mjs tests/co-2026-003-prototype-revision.test.mjs
  git commit -m "docs: record co-2026-003 prototype revision approvals"
  ```

  Expected: коммит содержит только журналы согласования и проверки, без высокого выпуска.

## Task 7: Полнота данных в трёх вариантах презентации

**Files:**
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/client-reference-data.json`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json`
- Modify: `scripts/validate-co-2026-003-prototype-revision.mjs`
- Test: `tests/co-2026-003-prototype-revision.test.mjs`

**Interfaces:**
- Consumes: очищенную модель ООО «Водолей Трейд» и три канонических SVG вариантов презентации.
- Produces: проверяемое распределение всех групп данных по трём страницам каждого из трёх вариантов презентации.

- [ ] **Step 1: Написать проверку покрытия групп**

  Проверка должна требовать, чтобы каждая из 12 групп данных из Task 3 присутствовала в полной справке и встречалась хотя бы один раз в суммарных трёх страницах каждого варианта: SlideDoc, Sber 2025, MAG.

  Run: `node --test tests/co-2026-003-prototype-revision.test.mjs`

  Expected: FAIL, если любая группа отсутствует в одном из вариантов презентации.

- [ ] **Step 2: Зафиксировать распределение без создания кадров**

  В `source/prototype-revision-candidate.json` записать карту `presentation_data_coverage`, где для каждого варианта перечислены страницы 1, 2 и 3 и группы данных на странице.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; проверка полноты есть, но `derived/screens/**` и `demo/assets/**` не меняются.

- [ ] **Step 3: Зафиксировать коммит покрытия данных**

  Run:

  ```bash
  git add docs/product/analysis/presentation-link-lisa-user-journey/source/client-reference-data.json docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json scripts/validate-co-2026-003-prototype-revision.mjs tests/co-2026-003-prototype-revision.test.mjs
  git commit -m "test: require co-2026-003 presentation data coverage"
  ```

  Expected: коммит не содержит новых презентационных PNG, потому что кадры создаются только после SVG-проверки и согласования владельца.

## Task 8: RCA, блокировки выпуска и откат

**Files:**
- Modify: `docs/release/co-2026-003-visual-prototype-rca.md`
- Modify: `docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json`
- Modify: `scripts/validate-co-2026-003-prototype-revision.mjs`
- Test: `tests/co-2026-003-prototype-revision.test.mjs`

**Interfaces:**
- Consumes: история дефекта из действующего RCA и блокировки кандидата версии 3.
- Produces: новое дополнение RCA и проверяемый план отката.

- [ ] **Step 1: Написать проверку выпускных блокировок**

  Проверка должна требовать блокировки до выбора пяти текстов, получения четырёх входов, 11 покадровых согласований, согласования полного черновика, высокого рендера из тех же SVG и финальной приёмки высокого выпуска.

  Run: `node --test tests/co-2026-003-prototype-revision.test.mjs`

  Expected: FAIL, если архив разрешён до высокого выпуска и доказательств.

- [ ] **Step 2: Добавить RCA-дополнение**

  В `co-2026-003-visual-prototype-rca.md` сохранить старое RCA историческим и добавить новый раздел: корень дефекта — наложения на растры и необязательный для выпуска визуальный договор; профилактика — обязательный SVG-first договор, профильная проверка до рендера и запрет обходных наложений.

  Run: `npm run validate:doc-links`

  Expected: PASS; новый раздел содержит ссылку на кандидат и не подменяет старый RCA.

- [ ] **Step 3: Зафиксировать откат до переключения**

  В `source/prototype-revision-candidate.json` описать: до переключения удалить кандидатные производные из временного каталога и оставить текущий активный выпуск неизменным.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; до переключения нет частичных активных производных.

- [ ] **Step 4: Зафиксировать откат после переключения**

  В `source/prototype-revision-candidate.json` описать: после переключения возвращается единый предыдущий набор `active-contracts.json`, `journey-contract.json`, манифестов, `demo/**`, `derived/**`, `evidence/**` и ZIP; отдельные PNG не копируются выборочно.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: PASS; откат запрещает смешивать новый договор со старыми PNG.

- [ ] **Step 5: Зафиксировать коммит RCA и отката**

  Run:

  ```bash
  git add docs/release/co-2026-003-visual-prototype-rca.md docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json scripts/validate-co-2026-003-prototype-revision.mjs tests/co-2026-003-prototype-revision.test.mjs
  git commit -m "docs: record co-2026-003 prototype revision rollback gates"
  ```

  Expected: коммит не публикует архив и не меняет активный выпуск.

## Task 9: Транзакционный высокий выпуск, архив и навигация

**Files:**
- Modify after approvals: `docs/product/analysis/presentation-link-lisa-user-journey/source/active-contracts.json`
- Modify after approvals: `docs/product/analysis/presentation-link-lisa-user-journey/source/journey-contract.json`
- Generate after approvals: `docs/product/analysis/presentation-link-lisa-user-journey/demo/**`
- Generate after approvals: `docs/product/analysis/presentation-link-lisa-user-journey/derived/**`
- Generate after approvals: `docs/product/analysis/presentation-link-lisa-user-journey/evidence/**`
- Modify after high release: `docs/release/co-2026-003-prototype-delivery-archive-contract.json`
- Modify after high release: `docs/release/co-2026-003-prototype-delivery-archive.md`
- Generate after high release: `artifacts/delivery/co-2026-003-q4-lisa-profile-delivery.zip`
- Modify: `docs/navigation/navigation-source.json`
- Generate: `docs/navigation/documentation-index.json`, `docs/navigation/navigation-map.md`, `docs/navigation/orphan-docs-report.md`, `docs/navigation/stale-status-report.md`

**Interfaces:**
- Consumes: финальную приёмку высокого выпуска из Task 6 и блокировки из Task 8.
- Produces: активный выпуск, доказательства, архив поставки и навигацию с одним согласованным набором источников.

- [ ] **Step 1: Написать транзакционную проверку**

  Проверка должна требовать порядок: канонические SVG, PNG, автономный прототип, доказательства, профильная проверка, архив поставки с прототипом, навигация, полный gate.

  Run: `npm run validate:co-2026-003-prototype-revision`

  Expected: FAIL, если архив создан до доказательств или навигация ссылается на неактуальный выпуск.

- [ ] **Step 2: Переключить активный выпуск одним комплектом**

  После финальной приёмки высокого выпуска обновить `active-contracts.json`, `journey-contract.json`, `demo/**`, `derived/**`, `evidence/**` и ZIP как единый кандидат. При сбое восстановить предыдущий комплект целиком.

  Run: `npm run validate:presentation-link-lisa-user-journey:profile`

  Expected: PASS; активный выпуск не смешивает кандидата версии 3 с историческими производными.

- [ ] **Step 3: Собрать архив поставки**

  После свежих доказательств обновить договор архива и выполнить генератор архива.

  Run: `npm run generate:co-2026-003-delivery-archive`

  Expected: ZIP содержит актуальный автономный прототип, манифесты и доказательства; исходники владельца и локальные пути отсутствуют.

- [ ] **Step 4: Перегенерировать навигацию**

  Добавить новые ручные документы в `docs/navigation/navigation-source.json`, затем выполнить штатный генератор.

  Run:

  ```bash
  npm run generate:docs-navigation
  npm run generate:docs-navigation -- --check
  npm run validate:doc-links
  npm run validate:docs-navigation
  npm run validate:doc-stale-status
  ```

  Expected: все команды завершаются с кодом 0; производные документы навигации воспроизводимы.

- [ ] **Step 5: Зафиксировать коммит выпуска**

  Run:

  ```bash
  git add docs/product/analysis/presentation-link-lisa-user-journey/source/active-contracts.json docs/product/analysis/presentation-link-lisa-user-journey/source/journey-contract.json docs/product/analysis/presentation-link-lisa-user-journey/demo docs/product/analysis/presentation-link-lisa-user-journey/derived docs/product/analysis/presentation-link-lisa-user-journey/evidence docs/release/co-2026-003-prototype-delivery-archive-contract.json docs/release/co-2026-003-prototype-delivery-archive.md artifacts/delivery/co-2026-003-q4-lisa-profile-delivery.zip docs/navigation/navigation-source.json docs/navigation/documentation-index.json docs/navigation/navigation-map.md docs/navigation/orphan-docs-report.md docs/navigation/stale-status-report.md
  git commit -m "feat: publish co-2026-003 svg prototype revision"
  ```

  Expected: один выпускной коммит после явных приёмок владельца.

## Task 10: Обзор, атомарные коммиты, push и черновой PR

**Files:**
- Read: all files changed by Tasks 2-9
- Read: `.github/PULL_REQUEST_TEMPLATE.md`
- Read: `docs/release/commit-pr-evidence.md`

**Interfaces:**
- Consumes: завершённые атомарные коммиты и результаты проверок.
- Produces: ветка с опубликованным будущим выпуском, черновой PR и ссылки на PNG/SVG/доказательства/архив после явных приёмок владельца.

- [ ] **Step 1: Выполнить обзор перед публикацией**

  Проверить полноту: 5 циклов текста, 11 будущих кадров, 2 исторических кадра, 4 внешних входа, SVG-first, полнота данных ООО «Водолей Трейд», RCA-дополнение, откат, архив после высокого выпуска.

  Run: `git diff --check`

  Expected: PASS; whitespace-ошибок нет.

- [ ] **Step 2: Выполнить полный набор проверок**

  Run:

  ```bash
  npm run validate:co-2026-003-prototype-revision
  npm run validate:presentation-link-lisa-user-journey:profile
  npm run validate:co-2026-003-delivery-archive
  npm run validate:data-leakage
  npm run generate:docs-navigation -- --check
  npm run validate:doc-links
  npm run validate:docs-navigation
  npm run validate:doc-stale-status
  npm test
  ```

  Expected: все команды завершаются с кодом 0; если внешние входы не получены или приёмка владельца не выполнена, выпускные команды не запускаются и причина фиксируется как блокировка.

- [ ] **Step 3: Проверить серию атомарных коммитов**

  Run: `git log --oneline --decorate --max-count=12`

  Expected: видны отдельные коммиты для циклов текста, кандидата версии 3, маршрута, SVG-first, согласований, покрытия данных, RCA/отката, выпуска и навигации.

- [ ] **Step 4: Выполнить push после приёмок владельца**

  Run: `git push origin feat/co-2026-003-q4-lisa-profile-continuation`

  Expected: push выполнен только после явных владельческих приёмок; до этого шага внешние этапы не обещаются.

- [ ] **Step 5: Открыть черновой PR**

  В черновом PR указать: изменённые артефакты, связь с `CO-2026-003` — изменением Q4_2026 для заказа презентации из Лисы, результаты проверок, остаточные риски, ссылки на PNG/SVG/доказательства и ссылку на архив поставки после приёмки высокого выпуска.

  Run: `gh pr create --draft --fill`

  Expected: создан черновой PR; ссылки на архив присутствуют только после фактической сборки архива из актуального высокого выпуска.

## Self-review плана

- Покрытие требований: задачи 1-10 покрывают фундамент кандидата, 5 независимых циклов текста, входные источники, 11 будущих и 2 исторических кадра, SVG-first, покадровую приёмку, полноту данных, RCA, блокировки, откат, архив, навигацию, проверки и будущий PR.
- Плейсхолдеры: в плане нет запрещённых маркеров-заглушек; все задачи содержат точные пути, команды и ожидаемый результат.
- Согласованность: идентификаторы кадров и тем совпадают с текущим кандидатом и договором брейншторма; активный выпуск не меняется до отдельного переключения.
