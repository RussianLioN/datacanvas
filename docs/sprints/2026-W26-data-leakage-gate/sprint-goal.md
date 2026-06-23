# Sprint Goal: Data Leakage Gate

Цель инкремента: добавить исполняемый security gate для PII/redaction и trace/log leakage на runtime/export/trace/evidence sinks.

Done when:

- leakage manifest создан;
- validator проверяет выбранные sinks;
- gate включен в `npm test` и CI;
- ограничения real UAT sinks явно описаны.
