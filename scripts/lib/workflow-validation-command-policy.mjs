export function uncatalogedWorkflowPlanCommands(validationPlan, catalogCommands) {
  const catalog = new Set(catalogCommands.map((entry) => entry.command));
  return validationPlan.filter((command) => !catalog.has(command));
}

const safeNpmRunCommandPattern = /^npm run ([a-z0-9:_-]+)(?: -- (?:(--check)|--changed-from (HEAD|[0-9a-f]{40}|[0-9a-f]{64})))?$/u;

export function parseSafeNpmInvocations(command) {
  const parts = String(command).split(/\s+&&\s+/u);
  if (parts.length === 0 || parts.some((part) => part.length === 0)) {
    throw new Error("validation command is not a safe npm run command");
  }
  return parts.map((part) => {
    const match = safeNpmRunCommandPattern.exec(part);
    if (!match) throw new Error("validation command is not a safe npm run command: " + command);
    return {
      script_name: match[1],
      args: match[2] ? ["--", "--check"] : match[3] ? ["--", "--changed-from", match[3]] : [],
    };
  });
}

export function parseSafeNpmCommand(command) {
  return parseSafeNpmInvocations(command).map((invocation) => invocation.script_name);
}

export function isSafeNpmRunCommand(command) {
  try {
    parseSafeNpmInvocations(command);
    return true;
  } catch {
    return false;
  }
}

export function nonNpmWorkflowPlanCommands(validationPlan) {
  return validationPlan.filter((command) => !isSafeNpmRunCommand(command));
}
