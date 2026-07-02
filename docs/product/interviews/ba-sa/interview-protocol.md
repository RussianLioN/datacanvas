# Протокол БА/СА Интервью

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [БА/СА интервью](README.md) / Протокол

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:ba-sa-interview`

## Режимы

| Режим | Когда Использовать | Ограничение |
|---|---|---|
| `light` | Быстро уточнить один продуктовый контур | Только критичные вопросы и явные gaps |
| `standard` | Подготовить DoR-ready backlog candidates | Один смысловой вопрос за шаг |
| `deep` | Подготовить SRS, interface control и Change Order | Нужны evidence refs и owner решений |

## Обязательные Домены

1. Stakeholders.
2. Текущий процесс.
3. Целевой результат.
4. Ценность.
5. Ограничения.
6. Политики.
7. Исключения.
8. Каналы.
9. Данные.
10. Роли решений.
11. Acceptance examples.
12. Риски.
13. Метрики.
14. Откат.

## Продвижение Claim

| Статус | Разрешенное Действие |
|---|---|
| `confirmed` + `evidence_refs` | Можно использовать в БА/СА артефактах, acceptance и eval |
| `unconfirmed` | Только evidence request или hypothesis |
| `assumption` | Только research backlog |
| `contradicted` | Open decision, stop condition или negative eval |

## Stop Rules

- Нет `safe_summary`.
- Нет `data_class`.
- Нет `allowed_downstream_use`.
- Downstream artifact ссылается на `raw_answer_ref` как на требование.
- Unconfirmed или assumption claim используется как `must`.
