# RCA: BMC Classic Validation Gap

## Ошибка

Публичный BMC DataCanvas проходил `npm run validate:bmc-content-classic` и полный BMC-gate, хотя содержал техническую, служебную и проверочную информацию, а часть блоков выполняла чужую роль.

Product Owner не смог принять BMC как классический Business Model Canvas: в документе смешались бизнес-модель, пользовательский путь, технические артефакты, generated artifacts, проверочные статусы и внутренний workflow.

## Проверка Уроков

- Ближайшая локальная база RCA: `docs/knowledge/rca/README.md`.
- Правило RCA: RCA не закрывается без предотвращающего действия.
- Предотвращающие действия в этом исправлении: усиленный `validate-bmc-content-classic`, проверка публичной чистоты BMC, синхронизация `datacanvas-bmc` generator contract и mutation guard с фактическими outputs генератора.

## 5 Почему

1. Почему неклассический BMC прошел проверки?
   Потому что `validate-bmc-content-classic` проверял наличие девяти блоков и отдельных якорных слов, но не проверял роль блока и отсутствие технического шума.

2. Почему технический шум оказался в публичном BMC?
   Потому что публичная модель BMC была зашита в `blockModel` внутри `scripts/generate-bmc-artifacts.mjs`, а не бралась из структурированного trace как единого источника истины.

3. Почему trace не предотвратил расхождение?
   Потому что `docs/product/bmc/bmc-trace.v0.1.json` содержал утверждения и статусы, но не содержал полную публичную модель блоков: русские названия, короткие названия, bullets и detail.

4. Почему generated/co-dependent gate не подсветил проблему?
   Потому что `datacanvas-bmc` в UDW generator contract и mutation guard описывал только часть фактических outputs генератора. Workflow видел не весь BMC package.

5. Почему RCA был отложен?
   Потому что `UDW-RCA-001` был запланирован после PO-опросника, хотя дефект BMC/gate блокировал сам BMC-опросник и требовал отдельного немедленного RCA.

## Корневая Причина

Gate проверял воспроизводимость BMC-пакета и наличие классических заголовков, но не проверял, что публичный BMC действительно является классической бизнес-канвой без технического, служебного и проверочного слоя.

Дополнительная причина: продуктовый смысл публичного BMC жил в генераторе, поэтому trace не был полноценным source of truth для публичного BMC.

## Исправление

- `docs/product/bmc/bmc-trace.v0.1.json` расширен до источника публичной модели BMC.
- `scripts/generate-bmc-artifacts.mjs` переведен на чтение публичных блоков из trace.
- Публичный BMC очищен от технических и служебных фрагментов.
- `scripts/validate-bmc-content-classic.mjs` усилен проверками роли блоков, публичной чистоты и синхронизации с trace.
- `scripts/validate-bmc-trace.mjs` усилен проверками дублей, соответствия claim/item и канонического B5.
- `scripts/validate-bmc-package.mjs` проверяет публичную чистоту text alternative и обязательные validators в BMC manifest.
- UDW generator contract, mutation guard и artifact inventory синхронизированы с фактическими BMC outputs.

## Проверка

Минимальный gate для закрытия RCA:

```bash
npm run generate:bmc -- --check
npm run validate:bmc-trace
npm run validate:bmc-content-classic
npm run validate:bmc-package
npm run validate:bmc
npm run validate:universal-documentation-workflow
npm run validate:data-leakage
npm run validate:artifact-hashes
git diff --check
```

## Предотвращение

- Публичные BMC-поверхности не должны содержать `PresentationSpec`, `trace`, `validation companion`, `companion JSON`, `quality gates`, `renderer`, `gateway`, `callback`, `A2A`, `MCP`, `LLM`, локальные пути, SHA, source refs, evidence requests и проверочные статусы.
- `B2` должен описывать ценность, а не workflow.
- `B3` должен описывать каналы, а не внутренние активности.
- `B8` должен описывать партнеров, а не ресурсы.
- `B9` должен описывать структуру затрат, а не статусы исследования.
- Generator contract и mutation guard должны покрывать все фактические outputs `scripts/generate-bmc-artifacts.mjs`.
