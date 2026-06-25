# Pilot Process Portability Notes

Статус: recorded portability review

## Metadata

- Process version: `0.1.0`
- Pilot date: `2026-06-23T13:37:33.690Z`
- Reviewer: `Process Owner`
- Target reuse context: `следующий ИТ-проект с артефактным Scrum delivery`

## Reusable Parts

- Scrum cadence: недельный sprint cadence можно переносить как default с управляемым PCR для изменения длины.
- Process Change Request flow: PCR flow переносим без изменений при наличии Process Owner.
- Sprint evidence pack: структура sprint evidence pack переносима для проектов с artifact-driven delivery.
- Artifact registry and hash manifest: переносимы как контроль воспроизводимости и ownership.
- Quality gates: переносимы как принцип, но список команд адаптируется под стек проекта.
- Completion audit: переносим как финальный guardrail против закрытия плана без evidence.

## Project-Specific Parts

- Product-specific UX/UAT flow: review runtime и human-review session завязаны на DataCanvas.
- Presentation renderer artifacts: HTML/PDF/PNG renderer относится к DataCanvas.
- DataCanvas-specific schemas: PresentationSpec, RenderResult и trace fields нужно адаптировать под домен.
- Domain-specific risks: unsupported claims, visual defects и source traceability завязаны на презентации.

## Migration Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Перенос без адаптации quality gates | Gate будет проверять чужие артефакты | Создать project-specific gate map перед Sprint 0 |
| Нет Process Owner | PCR flow станет формальностью | Назначить владельца процесса до первого sprint planning |
| Нет artifact registry | Completion audit потеряет проверяемость | Включить registry и hash manifest в bootstrap |

## Required Adaptations

- Заменить DataCanvas-specific schemas на схемы целевого продукта.
- Переписать UAT flow под реальные роли и пользовательские действия целевого продукта.
- Обновить quality gate commands под runtime, test framework и release workflow целевого проекта.
- Зафиксировать новый threat model delta и tool allowlist.

## Process Change Candidates

- Добавить `pilot:record` как стандартный recorder для external evidence.
- Разделить pre-pilot readiness validators и post-pilot acceptance validators.

## G11 Decision

- Decision: `accepted`
- Evidence: `docs/release/pilot-report.md`, `docs/release/commit-pr-evidence.md`, `docs/process/portability/process-portability-pack.json`
- Follow-up: `Maintain release audit, navigation index and artifact hashes if product/runtime artifacts change`
