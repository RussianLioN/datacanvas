# Definition Of Done

Работа считается завершенной только если результат проверяем, воспроизводим и связан с evidence.

## Общие Критерии

- Изменение выполнено в нужных файлах.
- Acceptance criteria выполнены.
- Обновлены связанные артефакты.
- Есть evidence в sprint folder.
- Нет открытых blocking stop rules.
- Известные ограничения явно записаны.
- Следующий безопасный шаг указан.
- Если затронута документация, обновлен `docs/navigation/navigation-source.json` или explicit ignore, а docs navigation gate проходит.
- Если затронута business navigation, root README, docs README и product README сохраняют business-first маршрут, а business docs достижимы из root максимум за 2 перехода.
- Если работа затрагивает методику документации, lifecycle policy, artifact policy, traceability policy или gates, проходит `npm run validate:documentation-methodology`.
- Если работа явно заявляет opt-in исполнение draft `PROC-038`, cascade run содержит change request, анализ влияния, очередь решений, список измененных артефактов, no-change rationales, validation results и evidence paths.
- Для opt-in исполнения draft `PROC-038` все affected artifacts обновлены или имеют confirmed `no-change rationale`; при открытых блокирующих решениях результат остается blocked и не заявляет Done.

## Для Процессных Артефактов

- Обновлены `process-registry.md` или `process-changelog.md`, если изменение влияет на процесс.
- Создан или обновлен `PROC-*`, если меняется правило процесса.
- Сохранена связь с исходным планом или решением.
- Generated navigation artifacts обновлены через `npm run generate:docs-navigation`, если менялись маршруты или visibility.
- При изменении `navigation_group` обновлены schema, generator, validator и generated navigation outputs.
- При изменении draft `PROC-038` или его контрактов проходят профильные `npm run validate:cascading-governance`, artifact registry и hash manifest checks; это проверяет заготовку, но не принимает правило процесса.

## Для Продуктовых Артефактов

- Обновлена traceability.
- Обновлены backlog или roadmap при влиянии на scope.
- Есть owner и статус.
- Product backlog не смешан с technical, eval или process backlog.
- Закрыты или явно отложены interview evidence requests.
- Синхронизированы requirements, backlog, acceptance, traceability и BA/SA evidence delta, если изменение derived из интервью.
- Для opt-in проверки draft `PROC-038` resource impact закрыт только при подтвержденном резерве, confirmed trade-off или явном blocked status до решения пользователя.
- Для opt-in проверки draft `PROC-038` Jira-bound package не считается ready без approved mapping или явного `pending_external` handoff status.

## Для AI/LLM Инкрементов

- JSON/schema validation проходит.
- Eval cases обновлены.
- Trace evidence создан.
- Security checks не выявили утечек или unsafe export.
- Claim map покрывает каждый generated claim.
- LLM output не попадает в renderer без schema validation.
- FeatureSpec, TaskSpec и AgentPromptSpec проходят `npm run validate:spec-task-prompt-readiness`.

## Для Renderer Инкрементов

- Export sanitization проходит.
- Structural visual baseline проходит.
- RenderResult содержит SHA для каждого export.
- PDF/PNG export не добавляется без отдельной стратегии и evidence.
