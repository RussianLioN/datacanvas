# Review

## Increment

Real UAT теперь можно начать одной командой:

```bash
npm run uat:real
```

Runner открывает runtime, принимает export, сохраняет JSON и создает session artifact через importer.

## Ограничения

Runner не заменяет реального участника и не создает pilot evidence.
