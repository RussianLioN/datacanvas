const allowedValidationCommands = new Set([
  "npm run validate:cascade-impact",
  "npm run scan:secrets && npm run validate:data-leakage",
  "npm run validate:main-artifact-lifecycle",
  "npm run validate:business-docs",
  "npm run validate:business-claim-map",
  "npm run validate:bmc",
  "npm run validate:xlsx-backlog",
  "npm run validate:product-sources && npm run validate:product-source-consistency",
  "npm run validate:universal-documentation-workflow",
]);

export function safeValidationScriptNames(command) {
  if (!allowedValidationCommands.has(command)) {
    return null;
  }
  return command.split("&&").map((part) => part.trim().replace(/^npm run /u, ""));
}

export function allowedCascadeValidationCommands() {
  return [...allowedValidationCommands].sort();
}

export function requiredCascadeValidationCommands({
  changedSourcePaths = [],
  impactedArtifactPaths = [],
  hasXlsxSource = false,
}) {
  const affectedPaths = [...new Set([...changedSourcePaths, ...impactedArtifactPaths])];
  const commands = [
    "npm run validate:cascade-impact",
    "npm run scan:secrets && npm run validate:data-leakage",
  ];

  if (affectedPaths.some((artifactPath) =>
    artifactPath === "docs/product-vision.md" || artifactPath.startsWith("docs/product/")
  )) {
    commands.push(
      "npm run validate:main-artifact-lifecycle",
      "npm run validate:business-docs",
      "npm run validate:business-claim-map",
    );
  }
  if (affectedPaths.some((artifactPath) => artifactPath.startsWith("docs/product/bmc/"))) {
    commands.push("npm run validate:bmc");
  }
  if (hasXlsxSource) {
    commands.push(
      "npm run validate:xlsx-backlog",
      "npm run validate:product-sources && npm run validate:product-source-consistency",
    );
  }
  if (affectedPaths.some((artifactPath) => artifactPath.startsWith("docs/process/"))) {
    commands.push("npm run validate:universal-documentation-workflow");
  }

  for (const command of commands) {
    if (!allowedValidationCommands.has(command)) {
      throw new Error(`required cascade validation is outside the built-in allowlist: ${command}`);
    }
  }
  return [...new Set(commands)];
}
