import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { isTransientFullPackageReleasePath } from "../scripts/generate-docs-navigation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const analysisRoot = path.join(root, "docs/product/analysis");
const indexPath = path.join(root, "docs/navigation/documentation-index.json");

function repoPath(absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function regenerateNavigation() {
  execFileSync(process.execPath, ["scripts/generate-docs-navigation.mjs"], {
    cwd: root,
    stdio: "pipe",
  });
}

test("навигация исключает только служебные пути полного выпуска", () => {
  const transientDirectories = [
    "candidate",
    "backup",
    "failed",
  ].map((kind) =>
    fs.mkdtempSync(
      path.join(analysisRoot, `.presentation-link-lisa-full-package-${kind}-navigation-test-`),
    ),
  );
  const ordinaryDirectory = fs.mkdtempSync(
    path.join(analysisRoot, ".presentation-link-lisa-full-package-backups-navigation-test-"),
  );

  for (const directory of transientDirectories) {
    fs.writeFileSync(
      path.join(directory, "README.md"),
      "# Служебный выпуск\n\n[Намеренно несуществующая ссылка](missing.md)\n",
    );
  }
  fs.writeFileSync(path.join(ordinaryDirectory, "README.md"), "# Обычная документация\n");

  try {
    regenerateNavigation();
    execFileSync(process.execPath, ["scripts/validate-doc-links.mjs"], {
      cwd: root,
      stdio: "pipe",
    });
    const entries = JSON.parse(fs.readFileSync(indexPath, "utf8")).entries;
    const transientPaths = transientDirectories.map(
      (directory) => `${repoPath(directory)}/README.md`,
    );
    const ordinaryPath = `${repoPath(ordinaryDirectory)}/README.md`;
    const journalPath =
      "docs/product/analysis/.presentation-link-lisa-user-journey.full-package-release.json";
    const lockPath =
      "docs/product/analysis/.presentation-link-lisa-full-package-release.lock";
    const ordinaryJsonPath = `${journalPath}.backup`;

    for (const transientPath of transientPaths) {
      assert.equal(
        entries.some((entry) => entry.path === transientPath),
        false,
        "служебный кандидат, резерв и неудавшийся выпуск не должны попадать в индекс документации",
      );
    }
    assert.equal(
      entries.some((entry) => entry.path === ordinaryPath),
      true,
      "соседний каталог с похожим именем не должен исключаться",
    );
    assert.equal(
      isTransientFullPackageReleasePath(journalPath),
      true,
      "журнал полного выпуска не должен считаться документацией",
    );
    assert.equal(
      isTransientFullPackageReleasePath(lockPath),
      true,
      "блокировка полного выпуска не должна считаться документацией",
    );
    assert.equal(
      isTransientFullPackageReleasePath(ordinaryJsonPath),
      false,
      "схожий, но не служебный путь не должен исключаться",
    );
    assert.equal(
      entries.some((entry) => entry.path === journalPath),
      false,
      "журнал полного выпуска не должен попадать в индекс документации",
    );
  } finally {
    for (const directory of transientDirectories) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
    fs.rmSync(ordinaryDirectory, { recursive: true, force: true });
    regenerateNavigation();
  }
});
