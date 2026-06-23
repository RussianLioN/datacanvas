# Data Classification Policy

| Класс | Описание | Разрешенные Sinks |
|---|---|---|
| public | Можно публиковать | export, evidence |
| internal | Внутренние данные проекта | prompt, trace, evidence с ограничением доступа |
| confidential | Чувствительные рабочие данные | только локальная обработка и ограниченный trace |
| pii | Персональные данные | запрещены в export без явного разрешения |
| secret | Секреты, ключи, токены | запрещены в prompt, trace, export, evidence |

Если класс данных не определен, используется `confidential`.

