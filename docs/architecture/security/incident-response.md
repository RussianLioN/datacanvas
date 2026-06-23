# Security Incident Response

## Trigger

Инцидент фиксируется при утечке secret/PII, prompt injection bypass, unsafe export или отключении security gate.

## Действия

1. Остановить приемку затронутого инкремента.
2. Зафиксировать evidence без раскрытия секрета.
3. Создать security defect и RCA.
4. Добавить eval/regression case.
5. Обновить threat model delta.
6. Создать `PROC-*`, если требуется изменение процесса.

