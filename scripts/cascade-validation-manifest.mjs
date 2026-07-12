import crypto from "node:crypto";

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function validationManifestHash(manifest) {
  return hash({
    version: manifest.version,
    verification_level: manifest.verification_level,
    planned_commands: manifest.planned_commands,
  });
}

export function buildValidationManifest({
  catalog,
  routeCommands = [],
  scopes = [],
  includeFull = false,
}) {
  const byCommand = new Map((catalog.commands ?? []).map((entry) => [entry.command, entry]));
  for (const command of routeCommands) {
    if (!byCommand.has(command)) throw new Error(`route command is not present in the validation catalog: ${command}`);
    if (!includeFull && byCommand.get(command).mutates_files) {
      throw new Error(`mutating route command is not allowed in a profile manifest: ${command}`);
    }
  }

  const selected = new Map();
  for (const entry of catalog.commands ?? []) {
    const applies = (entry.applies_to ?? []).some((scope) => scopes.includes(scope));
    const safeForLevel = includeFull || (!entry.mutates_files && entry.gate !== "full");
    if (entry.completion_blocking && applies && safeForLevel) selected.set(entry.id, entry);
  }
  for (const command of routeCommands) {
    const entry = byCommand.get(command);
    selected.set(entry.id, entry);
  }
  if (includeFull) {
    for (const entry of catalog.commands ?? []) {
      if (entry.gate === "full" && entry.completion_blocking) selected.set(entry.id, entry);
    }
  }

  const planned = [...selected.values()].sort((left, right) => left.id.localeCompare(right.id)).map((entry) => ({
    id: entry.id,
    command: entry.command,
    gate: entry.gate,
    mutates_files: Boolean(entry.mutates_files),
    command_sha256: hash({ id: entry.id, command: entry.command, gate: entry.gate }),
  }));
  const manifest = {
    version: "1.0.0",
    verification_level: includeFull ? "completion" : "profile",
    planned_commands: planned,
  };
  return { ...manifest, manifest_sha256: validationManifestHash(manifest) };
}

export function assertValidationEvidenceComplete(manifest, evidence) {
  const planned = new Map(manifest.planned_commands.map((item) => [item.id, item]));
  const executed = new Map((evidence.executed_commands ?? []).map((item) => [item.id, item]));
  const missing = [...planned.keys()].filter((id) => !executed.has(id));
  const extra = [...executed.keys()].filter((id) => !planned.has(id));
  const failed = [...executed.values()].filter((item) => item.status !== "passed").map((item) => item.id);
  if (missing.length || extra.length || failed.length) {
    throw new Error(`validation evidence mismatch: missing=${missing.join(",")} extra=${extra.join(",")} failed=${failed.join(",")}`);
  }
}
