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

## Для Процессных Артефактов

- Обновлены `process-registry.md` или `process-changelog.md`, если изменение влияет на процесс.
- Создан или обновлен `PROC-*`, если меняется правило процесса.
- Сохранена связь с исходным планом или решением.
- Generated navigation artifacts обновлены через `npm run generate:docs-navigation`, если менялись маршруты или visibility.

## Для Продуктовых Артефактов

- Обновлена traceability.
- Обновлены backlog или roadmap при влиянии на scope.
- Есть owner и статус.

## Для AI/LLM Инкрементов

- JSON/schema validation проходит.
- Eval cases обновлены.
- Trace evidence создан.
- Security checks не выявили утечек или unsafe export.
- Claim map покрывает каждый generated claim.
- LLM output не попадает в renderer без schema validation.

## Для Renderer Инкрементов

- Export sanitization проходит.
- Structural visual baseline проходит.
- RenderResult содержит SHA для каждого export.
- PDF/PNG export не добавляется без отдельной стратегии и evidence.
