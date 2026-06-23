# ADR-063: Real UAT One-Command Runner

## Статус

Принято.

## Контекст

До S63 оператор должен был вручную открыть runtime, скачать JSON и переложить файл в `artifacts/manual/real-uat/review-runtime-state-export.json`. Это увеличивало число итераций и риск ошибки пути.

При этом real UAT нельзя полностью автоматизировать без потери достоверности: пользовательские действия должен выполнить реальный участник.

## Решение

Добавить `npm run uat:real`.

Runner:
- запускает preflight checks;
- поднимает локальный сервер на `127.0.0.1`;
- открывает interactive runtime;
- принимает approved real-user state через `/uat-export`;
- сохраняет `artifacts/manual/real-uat/review-runtime-state-export.json`;
- запускает dry-run import checks;
- создает `docs/product/ux/human-review-session-real.json` через importer.

## Последствия

Положительные:
- пользователь запускает одну команду;
- ручное копирование downloaded JSON больше не нужно;
- importer остается единственным способом записи real session artifact.

Ограничения:
- runner не заменяет реального участника;
- runner не создает pilot report и commit/PR evidence;
- после real run нужно обновить release evidence, data leakage targets и completion audit.
