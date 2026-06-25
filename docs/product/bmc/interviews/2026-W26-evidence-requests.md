# BMC Evidence Requests

Статус: `open`

| ID | BMC block | Claim | Requested evidence | Owner | Missing impact |
|---|---|---|---|---|---|
| EVD-REQ-001 | B1/B2 | КМ и пользователи Лисы являются primary segment/value target. | Интервью, решение команды, story или user observation. | Product Owner | Claim остается `unconfirmed`. |
| EVD-REQ-002 | B3/B4 | Лиса, Оркестратор и email являются основными каналами и interaction points. | UX decision, integration note или story. | Product Owner | Channels остаются `unconfirmed`. |
| EVD-REQ-003 | B5 | DataCanvas экономит время и снижает ошибки. | Метрика времени, baseline текущего процесса или pilot observation. | Product Owner | Economics остаются `assumption`. |
| EVD-REQ-004 | B8 | Лиса, Оркестратор, upstream agents/tools и email infrastructure являются key partners. | Owner map или integration contract. | Delivery/GitOps Lead | Partner map остается `unconfirmed`. |
| EVD-REQ-005 | B9 | LLM/render/review/support/latency являются ключевыми cost drivers. | Cost estimate, review estimate или operational baseline. | Product Owner | Cost model остается `assumption`. |

## Правило

Если requested evidence не предоставлен, связанный claim не удаляется, но остается со статусом `unconfirmed` или `assumption`.
