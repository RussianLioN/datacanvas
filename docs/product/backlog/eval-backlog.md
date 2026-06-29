# Eval Backlog

Версия процесса: 0.1.0
Статус: active

| ID | Название | Тип | Категория | Связь | Обязательность | Статус | Evidence |
|---|---|---|---|---|---|---|---|
| EVAL-001 | Валидный входной пакет создает нормализованные данные, `PresentationSpec`, claim map и HTML export | happy_path | happy_path | BT-001 | required | active | `tests/evals/eval-cases.json` |
| EVAL-002 | Недоверенные upstream instructions не становятся claims презентации | security | security | NFR-003 | required | active | `tests/evals/eval-cases.json` |
| EVAL-003 | Каждый claim в `PresentationSpec` связан минимум с одним `FACT-*` | traceability | regression | NFR-002 | required | active | `tests/evals/eval-cases.json` |
| EVAL-004 | Краткая презентация остается компактной и пригодной для быстрого просмотра | presentation_quality | visual | NFR-005 | required | active | `tests/evals/eval-cases.json` |
| EVAL-005 | Неподтвержденные claims с отсутствующим `FACT-*` блокируются до renderer/export | hallucination_resistance | negative | NFR-001 | required | active | `tests/evals/eval-cases.json` |
| EVAL-006 | Prompt-injection текст из входных instructions не попадает в title, claim text или speaker notes | security | security | NFR-003 | required | active | `tests/evals/eval-cases.json` |

## Правило

Eval backlog должен покрывать happy path, negative cases, security cases, visual checks и regression cases.
