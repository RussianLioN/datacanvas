export function uncatalogedWorkflowPlanCommands(validationPlan, catalogCommands) {
  const catalog = new Set(catalogCommands.map((entry) => entry.command));
  return validationPlan.filter((command) => !catalog.has(command));
}

export function nonNpmWorkflowPlanCommands(validationPlan) {
  return validationPlan.filter((command) =>
    command
      .split("&&")
      .map((part) => part.trim())
      .some((part) => !/^npm run\s+[^\s]+/u.test(part))
  );
}
