# No-Network-By-Default Для LLM Boundary

Статус: draft
Версия процесса: 0.1.0
Владелец: Security/Privacy Lead

## Решение

DataCanvas не выполняет сетевые вызовы в стандартном контуре генерации и проверки краткой презентации. Любой внешний вызов модели, API, браузера, хранилища или публикации должен быть оформлен как отдельное изменение процесса и пройти review доверенных границ.

## Инварианты

- `docs/architecture/security/tool-allowlist.yaml` использует `default_policy: deny`.
- Все инструменты в allowlist имеют `network_access: false`, пока не принят отдельный Process Change Request.
- `npm test` не должен зависеть от сети.
- LLM boundary проверяется через локальный mock adapter и JSON-схемы.
- Утверждения в `PresentationSpec` допустимы только при трассировке к существующим `FACT-*`.

## Stop Rules

Работа останавливается и переводится в security review, если:

- требуется сетевой вызов без Process Change Request;
- LLM result содержит claim без валидного `fact_id`;
- входной пакет пытается передать инструкции выше системных правил DataCanvas;
- export содержит speaker notes, raw traces, secrets или неутвержденные источники.

## Evidence

Минимальная проверка:

```bash
npm run validate:llm
```

Проверка должна подтверждать:

- валидность `LLMResult`;
- валидность вложенного `PresentationSpec`;
- отклонение отрицательного примера с отсутствующим `FACT-*`;
- отсутствие сетевых команд в стандартных npm scripts;
- отсутствие `network_access: true` в текущем allowlist.
