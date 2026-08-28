export function uncatalogedWorkflowPlanCommands(validationPlan, catalogCommands) {
  const catalog = new Set(catalogCommands.map((entry) => entry.command));
  return validationPlan.filter((command) => !catalog.has(command));
}

const safeNpmRunCommandPattern = /^npm run [a-z0-9:_-]+(?: -- (?:--check|--changed-from (?:HEAD|[0-9a-f]{40}|[0-9a-f]{64})))?$/u;

export function nonNpmWorkflowPlanCommands(validationPlan) {
  return validationPlan.filter((command) =>
    String(command)
      .split(/\s+&&\s+/u)
      .some((part) => !safeNpmRunCommandPattern.test(part))
  );
}
