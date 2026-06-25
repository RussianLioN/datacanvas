# Decisions

## DEC-S37-001

Static `review-ui-fixture.html` не изменяется, потому что его validator запрещает script. Интерактивность вынесена в отдельный artifact с отдельным validator.

## DEC-S37-002

Runtime state сохраняется в `localStorage`, потому что это минимальный локальный механизм для prototype без backend, network и секретов.
