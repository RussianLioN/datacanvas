import fs from "node:fs";
import path from "node:path";

function assertSafeFileName(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath) || relativePath.includes("..") || relativePath.includes("\\")) {
    throw new Error(`unsafe package path: ${relativePath}`);
  }
}

function fsyncPath(candidatePath) {
  const handle = fs.openSync(candidatePath, "r");
  try {
    fs.fsyncSync(handle);
  } finally {
    fs.closeSync(handle);
  }
}

export function publishAtomicPackage({ targetDir, attemptId, files, validate = null }) {
  if (fs.existsSync(targetDir)) throw new Error(`target directory already exists: ${targetDir}`);
  if (!/^ATTEMPT-[A-Z0-9-]+$/u.test(attemptId)) throw new Error(`invalid attempt id: ${attemptId}`);

  const targetParent = path.dirname(targetDir);
  const stagingRoot = path.join(targetParent, ".cascade-staging");
  const stagingDir = path.join(stagingRoot, attemptId);
  fs.mkdirSync(targetParent, { recursive: true });
  fs.mkdirSync(stagingRoot, { recursive: true, mode: 0o700 });
  if (fs.statSync(stagingRoot).dev !== fs.statSync(targetParent).dev) {
    throw new Error("atomic cascade staging and target must be on the same filesystem");
  }
  if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { mode: 0o700 });

  try {
    for (const [relativePath, content] of files.entries()) {
      assertSafeFileName(relativePath);
      const outputPath = path.join(stagingDir, relativePath);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true, mode: 0o700 });
      fs.writeFileSync(outputPath, content, { encoding: "utf8", flag: "wx", mode: 0o600 });
      fsyncPath(outputPath);
    }
    validate?.(stagingDir);
    fsyncPath(stagingDir);
    fs.renameSync(stagingDir, targetDir);
    fsyncPath(targetParent);
  } catch (error) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
    throw error;
  } finally {
    try {
      if (fs.existsSync(stagingRoot) && fs.readdirSync(stagingRoot).length === 0) fs.rmdirSync(stagingRoot);
    } catch {
      // Startup cleanup handles an interrupted best-effort cleanup.
    }
  }
  return targetDir;
}

export function cleanupAtomicStaging(targetParent) {
  const stagingRoot = path.join(targetParent, ".cascade-staging");
  if (!fs.existsSync(stagingRoot)) return [];
  const removed = [];
  for (const entry of fs.readdirSync(stagingRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("ATTEMPT-")) continue;
    fs.rmSync(path.join(stagingRoot, entry.name), { recursive: true, force: true });
    removed.push(entry.name);
  }
  if (fs.existsSync(stagingRoot) && fs.readdirSync(stagingRoot).length === 0) fs.rmdirSync(stagingRoot);
  return removed.sort();
}
