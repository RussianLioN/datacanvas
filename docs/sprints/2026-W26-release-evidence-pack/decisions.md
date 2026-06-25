# Decisions: Release Evidence Pack

## DEC-S29-001: Pre-Commit Candidate

Release evidence pack фиксирует pre-commit candidate. Commit SHA и PR evidence остаются явными pending fields до настоящего commit/release tag.

## DEC-S29-002: Validation Gate

Release pack должен валидироваться отдельной командой, чтобы его нельзя было считать complete только по наличию Markdown-описания.
