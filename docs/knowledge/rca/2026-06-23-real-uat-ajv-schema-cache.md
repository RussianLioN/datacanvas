# RCA: Real UAT readiness Ajv duplicate schema

## Ошибка

`npm run validate:real-uat-readiness` падал после успешного real UAT export с ошибкой Ajv:

```text
schema with key or id "https://datacanvas.local/schemas/human-review-session.schema.json" already exists
```

## Проверка уроков

- `docs/LESSONS-LEARNED.md`: отсутствует в текущем репозитории.
- `./scripts/query-lessons.sh`: отсутствует в текущем репозитории.
- Ближайшая локальная база RCA: `docs/knowledge/rca/README.md`.

## 5 почему

1. Почему readiness validation падал?
   Потому что Ajv получил повторную компиляцию схемы с уже зарегистрированным `$id`.

2. Почему схема компилировалась повторно?
   Потому что один и тот же `schemas/human-review-session.schema.json` проверял и template, и real-session в одном процессе.

3. Почему Ajv не переиспользовал схему автоматически?
   Потому что код каждый раз вызывал `ajv.compile(...)` заново вместо явного reuse валидатора.

4. Почему это проявилось только после real UAT?
   До появления `docs/product/ux/human-review-session-real.json` валидатор проверял только template и не доходил до повторной проверки той же схемы.

5. Почему preflight это не поймал?
   Preflight проверял готовность к записи real UAT, но не моделировал состояние после появления real-session artifact.

## Корневая причина

В `scripts/validate-real-uat-readiness.mjs` была нужна идемпотентная работа со схемами Ajv: один `$id` должен компилироваться один раз за процесс и переиспользоваться для нескольких документов.

## Исправление

В валидатор добавлен `schemaCache`, который хранит compiled validator по `schemaPath` и переиспользует его при повторной проверке.

## Проверка

```bash
npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run
npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json
npm run validate:real-uat-readiness
npm run validate:real-uat-session-importer
npm run validate:real-uat-one-command-runner
```

## Предотвращение

- В новых валидаторах, где одна схема может проверять несколько документов за один запуск, использовать cache или отдельный Ajv instance.
- В post-export сценариях проверять состояние после записи реального artifact, а не только preflight.
