import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const scanRoots = ["README.md", "AGENTS.md", ".github/PULL_REQUEST_TEMPLATE.md", "docs"];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function repoPath(...parts) {
  return toPosix(path.join(...parts)).replace(/^\.\//, "");
}

function listMarkdownFiles(relativeRoot) {
  const target = absolute(relativeRoot);
  if (!fs.existsSync(target)) {
    return [];
  }
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    return relativeRoot.endsWith(".md") ? [relativeRoot] : [];
  }

  const files = [];
  function walk(currentRelative) {
    for (const entry of fs.readdirSync(absolute(currentRelative), { withFileTypes: true })) {
      const child = repoPath(currentRelative, entry.name);
      if (entry.isDirectory()) {
        walk(child);
      } else if (entry.isFile() && child.endsWith(".md")) {
        files.push(child);
      }
    }
  }
  walk(relativeRoot);
  return files.sort();
}

function slugHeading(rawHeading, usedSlugs) {
  const withoutFormatting = rawHeading
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const base =
    withoutFormatting
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-") || "section";
  const count = usedSlugs.get(base) || 0;
  usedSlugs.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function anchorsFor(relativePath) {
  const text = fs.readFileSync(absolute(relativePath), "utf8");
  const anchors = new Set();
  const usedSlugs = new Map();
  const headingPattern = /^#{1,6}\s+(.+)$/gm;
  let match;
  while ((match = headingPattern.exec(text)) !== null) {
    anchors.add(slugHeading(match[1].trim(), usedSlugs));
  }
  return anchors;
}

function isExternal(target) {
  return /^(https?:|mailto:|tel:)/i.test(target);
}

function localLinks(markdown) {
  const links = [];
  const linkPattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(markdown)) !== null) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    }
    target = target.split(/\s+/)[0];
    if (target && !isExternal(target) && !target.startsWith("#")) {
      links.push(target);
    }
  }
  return links;
}

function assertInsideRepo(resolvedPath, sourcePath, rawTarget) {
  const realRoot = fs.realpathSync(root);
  const existingPath = fs.existsSync(resolvedPath) ? resolvedPath : path.dirname(resolvedPath);
  let realTargetParent;
  try {
    realTargetParent = fs.realpathSync(existingPath);
  } catch {
    return;
  }
  const relativeToRoot = path.relative(realRoot, realTargetParent);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    fail(`${sourcePath}: link escapes repository boundary: ${rawTarget}`);
  }
}

const markdownFiles = scanRoots.flatMap(listMarkdownFiles).sort();
const anchorCache = new Map();

for (const sourcePath of markdownFiles) {
  const markdown = fs.readFileSync(absolute(sourcePath), "utf8");
  for (const rawTarget of localLinks(markdown)) {
    if (/^file:\/\//i.test(rawTarget)) {
      fail(`${sourcePath}: file:// links are forbidden: ${rawTarget}`);
    }
    if (path.isAbsolute(rawTarget) || /^[A-Za-z]:[\\/]/.test(rawTarget)) {
      fail(`${sourcePath}: absolute local links are forbidden: ${rawTarget}`);
    }

    const [pathPart, anchorPart] = rawTarget.split("#");
    const decodedPath = decodeURIComponent(pathPart);
    const normalizedTarget = path.resolve(path.dirname(absolute(sourcePath)), decodedPath);
    assertInsideRepo(normalizedTarget, sourcePath, rawTarget);

    if (!fs.existsSync(normalizedTarget)) {
      fail(`${sourcePath}: broken local link: ${rawTarget}`);
    }

    if (anchorPart && normalizedTarget.endsWith(".md")) {
      const targetRelative = toPosix(path.relative(root, normalizedTarget));
      if (!anchorCache.has(targetRelative)) {
        anchorCache.set(targetRelative, anchorsFor(targetRelative));
      }
      if (!anchorCache.get(targetRelative).has(decodeURIComponent(anchorPart))) {
        fail(`${sourcePath}: missing markdown anchor ${rawTarget}`);
      }
    }
  }
}

console.log("documentation link validation passed");
