import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { absoluteRepoPath, hashJsonDocument, hashRepoPath } from "./cascade-evidence-utils.mjs";
import { acceptanceConfirmationPayload, interactiveAcceptanceEvidenceHash } from "./cascade-owner-acceptance.mjs";
import { assertCascadeReplayInputs, buildActualDiffManifest } from "./cascade-vnext-core.mjs";
import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

export function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(absoluteRepoPath(root, relativePath), "utf8"));
}

export function validateDocument(root, data, schemaPath) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(readJson(root, "schemas/common-defs.schema.json"));
  ajv.addSchema(readJson(root, "schemas/cascade-impact-cone.schema.json"));
  ajv.addSchema(readJson(root, "schemas/impact-analysis-report.schema.json"));
  const validate = ajv.compile(readJson(root, schemaPath));
  if (!validate(data)) throw new Error(`${schemaPath} validation failed: ${JSON.stringify(validate.errors, null, 2)}`);
}

export function git(root, args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    timeout: options.timeout ?? 30_000,
    maxBuffer: options.maxBuffer ?? 4 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: process.env.LANG ?? "C.UTF-8", TZ: process.env.TZ ?? "UTC" },
  });
}

export function assertGitCommit(root, value, label) {
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(value ?? "")) throw new Error(`${label} must be an immutable Git SHA`);
  git(root, ["cat-file", "-e", `${value}^{commit}`]);
  return value;
}

export function assertAncestor(root, baseSha, candidateSha) {
  git(root, ["merge-base", "--is-ancestor", baseSha, candidateSha]);
}

export function parseGitNameStatus(output) {
  const tokens = output.split("\0").filter(Boolean);
  const entries = [];
  for (let index = 0; index < tokens.length;) {
    const status = tokens[index++];
    if (/^[RC]/u.test(status)) {
      const oldPath = normalizeRepoPath(tokens[index++]);
      const newPath = normalizeRepoPath(tokens[index++]);
      entries.push({ status, path: newPath, old_path: oldPath });
    } else {
      entries.push({ status, path: normalizeRepoPath(tokens[index++]), old_path: null });
    }
  }
  return entries;
}

function sortedPaths(values) {
  return [...new Set(values.filter(Boolean).map(normalizeRepoPath))].sort();
}

export function planningPackagePaths(runPath, run) {
  return sortedPaths([
    runPath,
    run.source_identity_manifest_path,
    run.source_change_analysis_path,
    run.impact_report_path,
    run.validation_manifest_path,
    run.runtime_manifest_path,
    run.owner_question_packet_path,
  ]);
}

export function finalizedPackagePaths(runPath, run) {
  return sortedPaths([runPath, run.diff_manifest_path, run.resolution_report_path]);
}

export function profilePackagePaths(runPath, run) {
  return sortedPaths([runPath, run.profile_evidence_path]);
}

export function assertRepoPathMatchesGit(root, commitSha, relativePath, label = "repository path") {
  const normalized = normalizeRepoPath(relativePath);
  const committedHash = hashGitPath(root, commitSha, normalized);
  const currentHash = hashRepoPath(root, normalized);
  if (!committedHash || !currentHash || committedHash !== currentHash) {
    throw new Error(`${label} does not match candidate Git content: ${normalized}`);
  }
  return committedHash;
}

export function assertImmutableGitPackage({
  root,
  runPath,
  packagePaths,
  anchorSha,
  mustPrecedeSha = null,
  label,
}) {
  const expectedPaths = sortedPaths(packagePaths);
  if (!expectedPaths.includes(normalizeRepoPath(runPath))) {
    throw new Error(`${label} package does not include its run record`);
  }
  const headSha = git(root, ["rev-parse", "HEAD"]).trim();
  assertGitCommit(root, anchorSha, `${label} anchor SHA`);
  const additions = git(root, ["log", "--format=%H", "--diff-filter=A", headSha, "--", normalizeRepoPath(runPath)])
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
  if (additions.length !== 1) throw new Error(`${label} run record must have one immutable addition commit`);
  const packageCommitSha = additions[0];
  assertAncestor(root, anchorSha, packageCommitSha);
  if (mustPrecedeSha) assertAncestor(root, packageCommitSha, mustPrecedeSha);

  const commitEntries = parseGitNameStatus(git(root, [
    "diff-tree",
    "--root",
    "--no-commit-id",
    "--name-status",
    "-r",
    "-z",
    packageCommitSha,
  ]));
  const commitPaths = sortedPaths(commitEntries.flatMap((entry) => [entry.path, entry.old_path]));
  if (!isDeepStrictEqual(commitPaths, expectedPaths)) {
    throw new Error(`${label} package commit scope mismatch: expected=${expectedPaths.join(",")} actual=${commitPaths.join(",")}`);
  }
  for (const relativePath of expectedPaths) {
    const packageHash = hashGitPath(root, packageCommitSha, relativePath);
    const headHash = hashGitPath(root, headSha, relativePath);
    const currentHash = hashRepoPath(root, relativePath);
    if (!packageHash || packageHash !== headHash || packageHash !== currentHash) {
      throw new Error(`${label} package is not immutable: ${relativePath}`);
    }
  }
  return packageCommitSha;
}

export function buildActualDiffManifestFromGit(root, {
  baseSha,
  planningHeadSha,
  candidateHeadSha,
  allowedWrites,
}) {
  const entries = parseGitNameStatus(git(root, [
    "diff",
    "--name-status",
    "-z",
    `${baseSha}..${candidateHeadSha}`,
  ])).map((entry) => ({
    ...entry,
    sha256: hashGitPath(root, candidateHeadSha, entry.path),
  }));
  return {
    $schema: "https://datacanvas.local/schemas/v1/cascade-actual-diff-manifest.schema.json",
    ...buildActualDiffManifest({
      baseSha,
      planningHeadSha,
      candidateHeadSha,
      entries,
      allowedWrites,
      dirty: false,
    }),
  };
}

export function assertActualDiffManifestMatchesGit(root, expectedManifest) {
  const actualManifest = buildActualDiffManifestFromGit(root, {
    baseSha: expectedManifest.base_sha,
    planningHeadSha: expectedManifest.planning_head_sha,
    candidateHeadSha: expectedManifest.candidate_head_sha,
    allowedWrites: expectedManifest.allowed_write_paths,
  });
  if (!isDeepStrictEqual(actualManifest, expectedManifest)) {
    throw new Error("actual diff manifest does not match the immutable Git range");
  }
  return actualManifest;
}

export function verifyAcceptanceConfirmationEvidence(root, acceptance, candidateSha, options = {}) {
  const evidence = acceptance.confirmation_evidence;
  if (!evidence) throw new Error("acceptance confirmation evidence is missing");
  if (acceptance.confirmation_channel === "interactive_session") {
    if (evidence.evidence_type !== "interactive_turn") {
      throw new Error("interactive acceptance requires interactive turn evidence");
    }
    const activeThreadId = options.activeThreadId ?? process.env.CODEX_THREAD_ID;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(activeThreadId ?? "")) {
      throw new Error("interactive acceptance requires an active Codex thread binding");
    }
    if (evidence.reference !== `codex-thread:${activeThreadId}`) {
      throw new Error("interactive acceptance thread binding mismatch");
    }
    if (evidence.sha256 !== interactiveAcceptanceEvidenceHash(acceptance)) {
      throw new Error("interactive acceptance evidence hash mismatch");
    }
    return;
  }
  if (acceptance.confirmation_channel === "repository_approval") {
    if (evidence.evidence_type !== "repository_commit") {
      throw new Error("repository acceptance requires repository commit evidence");
    }
    const approvalCommit = assertGitCommit(root, evidence.reference, "repository approval commit");
    assertAncestor(root, approvalCommit, candidateSha);
    const authorEmail = git(root, ["show", "-s", "--format=%ae", approvalCommit]).trim();
    if (authorEmail !== acceptance.owner_identity) {
      throw new Error("repository acceptance owner identity does not match commit author");
    }
    const rawCommit = git(root, ["cat-file", "commit", approvalCommit]);
    if (evidence.sha256 !== sha256(rawCommit)) {
      throw new Error("repository acceptance commit hash mismatch");
    }
    return;
  }
  void acceptanceConfirmationPayload(acceptance);
  throw new Error("signed external acceptance is unsupported until signature verification is configured");
}

export function hashGitPath(root, candidateSha, relativePath) {
  const result = spawnSync("git", ["show", `${candidateSha}:${relativePath}`], {
    cwd: root,
    encoding: null,
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME },
  });
  if (result.status !== 0) return null;
  return sha256(result.stdout);
}

export function hashGitPatch(root, baseSha, candidateSha, relativePath) {
  const result = spawnSync("git", ["diff", "--binary", "--no-ext-diff", baseSha + ".." + candidateSha, "--", relativePath], {
    cwd: root,
    encoding: null,
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME },
  });
  if (result.status !== 0) throw new Error("cannot calculate Git patch digest for " + relativePath);
  return sha256(result.stdout);
}

export function assertFreshRunDir(relativePath, runsRoot = "docs/process/cascading-governance/runs") {
  const normalized = normalizeRepoPath(relativePath);
  if (!normalized.startsWith(`${runsRoot}/`) || normalized.slice(runsRoot.length + 1).includes("/")) {
    throw new Error(`output dir must be a fresh direct child of ${runsRoot}`);
  }
  return normalized;
}

export function sanitizeOutput(value, root) {
  const rootPattern = root.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return String(value)
    .replace(new RegExp(rootPattern, "gu"), "<repo>")
    .replace(/(token|secret|password|api[_-]?key)\s*[:=]\s*\S+/giu, "$1=<redacted>")
    .slice(0, 4000);
}

export function createIsolatedNpmEnvironment(tempRoot) {
  const home = path.join(tempRoot, "home");
  const cache = path.join(tempRoot, "npm-cache");
  const userConfig = path.join(tempRoot, "npmrc");
  fs.mkdirSync(home, { recursive: true, mode: 0o700 });
  fs.mkdirSync(cache, { recursive: true, mode: 0o700 });
  fs.writeFileSync(userConfig, "", { encoding: "utf8", flag: "wx", mode: 0o600 });
  return {
    HOME: home,
    NPM_CONFIG_CACHE: cache,
    NPM_CONFIG_USERCONFIG: userConfig,
    NPM_CONFIG_UPDATE_NOTIFIER: "false",
    NPM_CONFIG_FUND: "false",
  };
}

export function buildRuntimeManifest(root, environment = {}) {
  const packageJson = readJson(root, "package.json");
  const runVersion = (executable, args) => execFileSync(executable, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: environment.HOME ?? process.env.HOME,
      LANG: process.env.LANG ?? "C.UTF-8",
      TZ: process.env.TZ ?? "UTC",
      ...environment,
    },
  }).trim();
  return {
    $schema: "https://datacanvas.local/schemas/v1/cascade-runtime-manifest.schema.json",
    version: "1.0.0",
    node: process.version.replace(/^v/u, ""),
    npm: runVersion("npm", ["--version"]),
    python: runVersion("python3", ["-c", "import platform; print(platform.python_version())"]),
    platform: process.platform,
    arch: process.arch,
    locale: process.env.LC_ALL ?? process.env.LANG ?? "C.UTF-8",
    timezone: process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    lockfile_sha256: hashRepoPath(root, "package-lock.json"),
    command_map_sha256: hashJsonDocument(packageJson.scripts),
    environment_allowlist: [
      "CI",
      "HOME",
      "LANG",
      "LC_ALL",
      "NPM_CONFIG_CACHE",
      "NPM_CONFIG_FUND",
      "NPM_CONFIG_UPDATE_NOTIFIER",
      "NPM_CONFIG_USERCONFIG",
      "TZ",
    ],
  };
}

export function assertCascadeReplayEvidence(root, run) {
  const runtimeManifest = readJson(root, run.runtime_manifest_path);
  const actualInputs = {
    runner_version: "1.0.0",
    change_request_sha256: hashGitPath(root, run.planning_head_sha, run.change_request_path),
    graph_sha256: hashGitPath(
      root,
      run.planning_head_sha,
      "docs/process/cascading-governance/artifact-dependency-graph.json",
    ),
    source_registry_sha256: hashGitPath(
      root,
      run.planning_head_sha,
      "docs/product/sources/product-source-registry.json",
    ),
    acceptance_authority_sha256: hashGitPath(root, run.planning_head_sha, run.acceptance_authority_path),
    source_identity_sha256: hashRepoPath(root, run.source_identity_manifest_path),
    source_change_analysis_sha256: run.source_change_analysis_path
      ? hashRepoPath(root, run.source_change_analysis_path)
      : null,
    semantic_impact_sha256: hashRepoPath(root, run.impact_report_path),
    validation_manifest_sha256: hashRepoPath(root, run.validation_manifest_path),
    runtime_contract_sha256: hashJsonDocument({
      lockfile_sha256: runtimeManifest.lockfile_sha256,
      command_map_sha256: runtimeManifest.command_map_sha256,
    }),
    owner_question_packet_sha256: run.owner_question_packet_path
      ? hashRepoPath(root, run.owner_question_packet_path)
      : null,
  };
  assertCascadeReplayInputs(run, actualInputs);
}
