import crypto from "node:crypto";
import { isDeepStrictEqual } from "node:util";

export const NESTED_CASCADE_E2E_SUCCESS_MARKER =
  "cascade vNext nested end-to-end validation passed through finalization; active lifecycle covers profile and completion";

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJson(value[key])]));
}

export function completionCommandSet() {
  return [
    {
      id: "clean-install",
      executable: "npm",
      args: ["ci", "--ignore-scripts"],
      timeout_ms: 10 * 60 * 1000,
    },
    {
      id: "cascade-verification",
      executable: "npm",
      args: ["run", "validate:cascade-verification"],
      timeout_ms: 5 * 60 * 1000,
    },
    {
      id: "cascade-vnext",
      executable: "npm",
      args: ["run", "validate:cascade-vnext"],
      timeout_ms: 5 * 60 * 1000,
    },
    {
      id: "cascade-vnext-e2e",
      executable: "npm",
      args: ["run", "validate:cascade-vnext-e2e"],
      timeout_ms: 30 * 60 * 1000,
    },
    {
      id: "cascade-trust",
      executable: "npm",
      args: ["run", "validate:cascade-trust"],
      timeout_ms: 5 * 60 * 1000,
    },
    {
      id: "cascading-governance",
      executable: "npm",
      args: ["run", "validate:cascading-governance"],
      timeout_ms: 10 * 60 * 1000,
    },
    {
      id: "universal-documentation-workflow",
      executable: "npm",
      args: ["run", "validate:universal-documentation-workflow"],
      timeout_ms: 10 * 60 * 1000,
    },
    {
      id: "schemas",
      executable: "npm",
      args: ["run", "validate:schemas"],
      timeout_ms: 5 * 60 * 1000,
    },
    {
      id: "secrets",
      executable: "npm",
      args: ["run", "scan:secrets"],
      timeout_ms: 5 * 60 * 1000,
    },
    {
      id: "data-leakage",
      executable: "npm",
      args: ["run", "validate:data-leakage"],
      timeout_ms: 10 * 60 * 1000,
    },
    {
      id: "diff-check",
      executable: "git",
      args: ["diff", "--check"],
      timeout_ms: 2 * 60 * 1000,
    },
    {
      id: "worktree-cleanliness",
      executable: "git",
      args: ["status", "--porcelain=v1", "--untracked-files=all"],
      timeout_ms: 2 * 60 * 1000,
    },
  ];
}

export function completionCommandSetHash(commands) {
  const payload = commands.map((command) => ({
    id: command.id,
    executable: command.executable,
    args: command.args,
  }));
  return crypto.createHash("sha256").update(JSON.stringify(stableJson(payload))).digest("hex");
}

export function assertRuntimeManifestMatches(expected, actual) {
  if (!isDeepStrictEqual(stableJson(expected), stableJson(actual))) {
    const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
    const changed = keys.filter((key) => !isDeepStrictEqual(expected[key], actual[key]));
    throw new Error("runtime manifest mismatch: " + changed.join(", "));
  }
}

export function commandResultPassed(command, result) {
  if (result.error || result.status !== 0) return false;
  if (command.id === "worktree-cleanliness") {
    return String(result.stdout ?? "").trim() === "";
  }
  return true;
}

export function completionCommandEvidenceProblems(command, rawOutput) {
  if (command.id !== "cascade-vnext-e2e") return [];
  if (String(rawOutput).includes(NESTED_CASCADE_E2E_SUCCESS_MARKER)) return [];
  return ["cascade-vnext-e2e did not prove nested cascade vNext end-to-end execution"];
}

export function completionEvidenceProblems(evidence, commands = completionCommandSet()) {
  const problems = [];
  const expectedCommandSet = commands.map(({ id, executable, args }) => ({ id, executable, args }));
  const actualCommandSet = (evidence.command_results ?? []).map(({ id, executable, args }) => ({
    id,
    executable,
    args,
  }));
  if (!isDeepStrictEqual(actualCommandSet, expectedCommandSet)) {
    problems.push("completion command set mismatch");
  }
  if (evidence.command_set_sha256 !== completionCommandSetHash(commands)) {
    problems.push("completion command set hash mismatch");
  }
  const cascadeE2e = (evidence.command_results ?? []).find((result) => result.id === "cascade-vnext-e2e");
  if (cascadeE2e?.status === "passed") {
    problems.push(...completionCommandEvidenceProblems(cascadeE2e, cascadeE2e.summary));
  }
  return problems;
}

export function assertCompletionEvidenceIntegrity(evidence, commands = completionCommandSet()) {
  const problems = completionEvidenceProblems(evidence, commands);
  if (problems.length > 0) {
    throw new Error(problems.join("; "));
  }
}
