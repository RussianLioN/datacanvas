import crypto from "node:crypto";
import { isDeepStrictEqual } from "node:util";

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
      id: "full-gate",
      executable: "npm",
      args: ["test"],
      timeout_ms: 30 * 60 * 1000,
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
