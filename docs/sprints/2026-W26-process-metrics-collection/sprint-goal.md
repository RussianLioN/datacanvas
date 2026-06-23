# Sprint Goal: Process Metrics Collection

Цель инкремента: добавить воспроизводимый сбор snapshot-метрик процесса из текущих артефактов DataCanvas.

Done when:

- collector генерирует JSON и Markdown snapshot;
- validator сверяет snapshot с текущим repository state;
- snapshot подключен к `npm test` и CI;
- ограничения real delivery metrics явно сохранены.
