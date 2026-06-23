# Artifact Updates

- Добавлен pilot execution handoff для G10.
- Добавлена схема `PilotExecutionHandoff`.
- Добавлен validator `validate:pilot-execution-handoff`.
- Pilot gate readiness будет ссылаться на handoff как available readiness artifact.
- Completion audit останется заблокированным до external evidence.
