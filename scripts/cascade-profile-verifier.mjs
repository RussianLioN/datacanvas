import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

import { validationManifestHash } from "./cascade-validation-manifest.mjs";
import { sanitizeOutput } from "./cascade-vnext-runtime.mjs";

const npmScriptPattern = /^npm run ([a-z0-9:_-]+)(?: -- --changed-from (HEAD|[0-9a-f]{40}|[0-9a-f]{64}))?$/u;

function parseSafeNpmInvocations(command) {
  const parts = String(command).split(/\s+&&\s+/u);
  if (parts.length === 0) throw new Error("validation command is not a safe npm run command");
  return parts.map((part) => {
    const match = npmScriptPattern.exec(part);
    if (!match) throw new Error("validation command is not a safe npm run command: " + command);
    return {
      script_name: match[1],
      args: match[2] ? ["--", "--changed-from", match[2]] : [],
    };
  });
}

export function parseSafeNpmCommand(command) {
  return parseSafeNpmInvocations(command).map((invocation) => invocation.script_name);
}

export function assertValidationManifestIntegrity(manifest) {
  if (manifest.manifest_sha256 !== validationManifestHash(manifest)) {
    throw new Error("validation manifest sha256 mismatch");
  }
}

export function assertCatalogBinding(manifest, catalog, packageJson) {
  assertValidationManifestIntegrity(manifest);
  if (manifest.verification_level !== "profile") {
    throw new Error("profile verification requires a profile manifest, got " + manifest.verification_level);
  }
  const catalogById = new Map((catalog.commands ?? []).map((entry) => [entry.id, entry]));
  const ids = new Set();
  for (const planned of manifest.planned_commands) {
    if (ids.has(planned.id)) throw new Error("duplicate validation command id: " + planned.id);
    ids.add(planned.id);
    const registered = catalogById.get(planned.id);
    if (!registered || registered.command !== planned.command || registered.gate !== planned.gate) {
      throw new Error("validation command is not bound to the active catalog: " + planned.id);
    }
    if (planned.mutates_files || registered.mutates_files) {
      throw new Error("profile verification cannot execute a mutating command: " + planned.id);
    }
    for (const scriptName of parseSafeNpmCommand(planned.command)) {
      if (!Object.hasOwn(packageJson.scripts ?? {}, scriptName)) {
        throw new Error("validation command references an unknown package script: " + scriptName);
      }
    }
  }
}

function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function executeProfileCommands({ manifest, executionRoot, reportRoot, timeoutMs = 10 * 60 * 1000 }) {
  return manifest.planned_commands.map((planned) => {
    const startedAt = new Date();
    const outputs = [];
    let exitCode = 0;
    for (const invocation of parseSafeNpmInvocations(planned.command)) {
      const result = spawnSync("npm", ["run", invocation.script_name, ...invocation.args], {
        cwd: executionRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: timeoutMs,
        maxBuffer: 8 * 1024 * 1024,
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          CI: "1",
          LANG: process.env.LANG ?? "C.UTF-8",
          LC_ALL: process.env.LC_ALL ?? "C.UTF-8",
          TZ: process.env.TZ ?? "UTC",
          DATACANVAS_CASCADE_NESTED_VALIDATION: "1",
        },
      });
      const combined = String(result.stdout ?? "") + String(result.stderr ?? "");
      outputs.push("[" + invocation.script_name + "]\n" + combined);
      if (result.error || result.status !== 0) {
        exitCode = Number.isInteger(result.status) ? result.status : 1;
        break;
      }
    }
    const finishedAt = new Date();
    const rawOutput = outputs.join("\n");
    const fallback = exitCode === 0 ? "exit 0" : "validation failed";
    const summary = sanitizeOutput(rawOutput || fallback, reportRoot);
    return {
      id: planned.id,
      command_sha256: planned.command_sha256,
      status: exitCode === 0 ? "passed" : "failed",
      exit_code: exitCode,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
      output_sha256: digest(rawOutput),
      summary: summary || (exitCode === 0 ? "Проверка завершилась успешно." : "Проверка завершилась с ошибкой."),
    };
  });
}

export function installProfileDependencies(executionRoot, timeoutMs = 10 * 60 * 1000) {
  const result = spawnSync("npm", ["ci", "--ignore-scripts"], {
    cwd: executionRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      CI: "1",
      LANG: process.env.LANG ?? "C.UTF-8",
      LC_ALL: process.env.LC_ALL ?? "C.UTF-8",
      TZ: process.env.TZ ?? "UTC",
    },
  });
  if (result.error || result.status !== 0) {
    const output = String(result.stdout ?? "") + String(result.stderr ?? "") + String(result.error?.message ?? "");
    throw new Error("isolated profile dependency install failed: " + sanitizeOutput(output, executionRoot));
  }
}
