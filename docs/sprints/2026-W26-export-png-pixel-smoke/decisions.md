# Decisions

## DEC-S61-001: Pixel smoke без browser dependency

Решение: проверять PNG fixture напрямую через chunk parsing и zlib inflate.

Причина: это закрывает минимальную декодируемость PNG без установки browser runtime.
