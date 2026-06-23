# RCA: Pilot recorder false positive on fixture paths

## Ошибка

`npm run pilot:record -- --dry-run --skip-checks ...` падал с ошибкой:

```text
ERROR: real UAT evidence contains forbidden fixture/template/sample/placeholder marker
```

## Проверка уроков

- `docs/LESSONS-LEARNED.md`: отсутствует в текущем репозитории.
- `./scripts/query-lessons.sh`: отсутствует в текущем репозитории.
- Ближайшая локальная база RCA: `docs/knowledge/rca/README.md`.

## 5 почему

1. Почему recorder падал?
   Потому что нашел строку `fixture` в real UAT evidence.

2. Почему `fixture` было в real UAT evidence?
   Потому что реальные audit events сохраняют `source_artifact_id` со ссылкой на `docs/product/ux/review-ui-fixture.json`.

3. Почему это было ошибкой?
   Потому что `fixture` в пути источника artifact допустим, а запрещен только как маркер синтетического пользователя, статуса или placeholder.

4. Почему validator не различал эти случаи?
   Потому что recorder проверял весь JSON через общий regexp.

5. Почему это не было поймано раньше?
   Recorder появился после real UAT flow и не имел отдельного dry-run proof до подключения в handoff.

## Корневая причина

Слишком широкий placeholder scan: recorder проверял весь JSON вместо actor/status-level полей, где fixture/template/sample действительно опасны.

## Исправление

- `TO_BE_FILLED` остается запрещенным во всем real UAT JSON.
- `fixture/template/sample/placeholder/interactive-` проверяются только в `actor_id` real session и audit events.

## Проверка

```bash
npm run pilot:record -- --dry-run --skip-checks --pilot-owner Delivery/GitOps --release-owner Delivery/GitOps --reviewer ProcessOwner --target-reuse-context next-it-project --release-record commit-or-pr-url --follow-up none
```

## Предотвращение

В artifact recorders запрещать broad marker scans по всему JSON, если документ содержит легитимные пути к fixture/golden/template артефактам.
