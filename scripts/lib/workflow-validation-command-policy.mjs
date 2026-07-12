export function uncatalogedWorkflowPlanCommands(validationPlan, catalogCommands) {
  const catalog = new Set(catalogCommands.map((entry) => entry.command));
  return validationPlan.filter((command) => !catalog.has(command));
}
