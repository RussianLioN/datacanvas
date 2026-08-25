import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function routeTargets(route) {
  return [route.start_path, ...route.next_paths];
}

test("текущая навигация ведет к принятым бизнес-требованиям 2026 года", () => {
  const source = readJson("docs/navigation/navigation-source.json");
  const state = readJson("docs/product/change-orders/co-2026-003-q4-lisa-profile-bt-interview-state.json");
  const requirements = source.managed_entries.find(
    (entry) => entry.path === "docs/product/requirements/business-requirements.md",
  );
  const route = source.task_routes.find((entry) => entry.id === "task-find-business-requirements");

  assert.equal(state.status, "business_requirements_owner_approved");
  assert.equal(state.documentation_cascade.business_requirements, "owner_approved");
  assert.equal(requirements?.lifecycle, "accepted");
  assert.equal(requirements?.navigable, true);
  assert.ok(routeTargets(route).includes("docs/product/sources/co-2026-003-current-2026-scope.md"));
  assert.deepEqual(routeTargets(route), [
    "docs/product/requirements/README.md",
    "docs/product/sources/co-2026-003-current-2026-scope.md",
    "docs/product/requirements/business-requirements.md",
  ]);
});

test("активные маршруты и входные документы не ссылаются на старые бизнес-требования", () => {
  const source = readJson("docs/navigation/navigation-source.json");
  const obsoletePrefixes = [
    "docs/product/change-orders/co-2026-001",
    "docs/product/change-orders/co-2026-002",
    "docs/product/revisions/co-2026-001-source-revision",
    "docs/product/analysis/ba/business-requirements-delta.md",
    "docs/product/sources/reference/datacanvas-backlog-source-sanitized.xlsx",
    "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx",
  ];

  for (const route of [...source.role_routes, ...source.task_routes]) {
    for (const target of routeTargets(route)) {
      assert.equal(
        obsoletePrefixes.some((prefix) => target === prefix || target.startsWith(`${prefix}/`)),
        false,
        `маршрут ${route.id} ведет к устаревшему артефакту: ${target}`,
      );
    }
  }

  for (const entrypoint of [
    "README.md",
    "docs/README.md",
    "docs/product/README.md",
    "docs/product/requirements/README.md",
    "docs/product/sources/README.md",
    "docs/product/analysis/README.md",
    "docs/product/change-orders/README.md",
  ]) {
    const text = readText(entrypoint);
    for (const obsoletePrefix of obsoletePrefixes) {
      assert.equal(
        text.includes(obsoletePrefix),
        false,
        `${entrypoint} ссылается на устаревший артефакт: ${obsoletePrefix}`,
      );
    }
  }
});

test("необновленные последующие требования не выдаются за действующие требования 2026 года", () => {
  const source = readJson("docs/navigation/navigation-source.json");
  const pendingPaths = [
    "docs/product/requirements/user-stories.md",
    "docs/product/requirements/non-functional-requirements.md",
    "docs/product/requirements/acceptance-criteria.md",
    "docs/product/requirements/backlog-slicing-rules.md",
    "docs/product/requirements/traceability-matrix.json",
  ];

  for (const pendingPath of pendingPaths) {
    const entry = source.managed_entries.find((item) => item.path === pendingPath);
    assert.equal(entry?.lifecycle, "draft", `${pendingPath} должен ожидать отдельного обновления`);
    assert.equal(entry?.visibility, "internal", `${pendingPath} не должен быть публичным маршрутом`);
    assert.equal(entry?.searchable, false, `${pendingPath} не должен находиться как текущий источник`);
    assert.equal(entry?.navigable, false, `${pendingPath} не должен быть доступен из действующей навигации`);
  }

  for (const route of [...source.role_routes, ...source.task_routes]) {
    if (route.navigation_group !== "business") {
      continue;
    }
    for (const pendingPath of pendingPaths) {
      assert.equal(
        routeTargets(route).includes(pendingPath),
        false,
        `действующий бизнес-маршрут ${route.id} ведет к не обновленному документу: ${pendingPath}`,
      );
    }
  }
});
