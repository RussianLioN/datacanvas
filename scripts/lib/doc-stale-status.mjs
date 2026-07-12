import { execFileSync } from "node:child_process";

function optionalGitOutput(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function isAncestor(root, ancestor, descendant) {
  return optionalGitOutput(root, ["merge-base", "--is-ancestor", ancestor, descendant]) === "";
}

function changedFiles(root, baseRef, headRef) {
  const output = optionalGitOutput(root, ["diff", "--name-only", `${baseRef}..${headRef}`]);
  if (output === null) {
    return null;
  }
  return output === "" ? [] : output.split("\n").filter(Boolean);
}

export function isAllowedMainPointerSuccessor({
  root,
  pointerCommit,
  currentMainCommit,
  headCommit,
  allowedPaths,
}) {
  if (!headCommit || !isAncestor(root, pointerCommit, currentMainCommit)) {
    return false;
  }

  if (headCommit !== currentMainCommit && !isAncestor(root, currentMainCommit, headCommit)) {
    return false;
  }

  const files = changedFiles(root, pointerCommit, currentMainCommit);
  return files !== null && files.every((filePath) => allowedPaths.has(filePath));
}
