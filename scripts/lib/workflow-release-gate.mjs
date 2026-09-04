import fs from "node:fs";
import path from "node:path";

function assertSafeRelativePath(root, relativePath, description) {
  if (typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath) || relativePath.includes("\\")) {
    throw new Error(`небезопасный путь ${description}: ${relativePath}`);
  }
  const normalized = path.posix.normalize(relativePath);
  if (normalized !== relativePath || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`путь ${description} выходит за корень рабочей копии: ${relativePath}`);
  }
  const rootPath = path.resolve(root);
  const resolved = path.resolve(rootPath, relativePath);
  if (!resolved.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error(`путь ${description} выходит за корень рабочей копии: ${relativePath}`);
  }
  return resolved;
}

function readJson(root, relativePath, description) {
  const absolutePath = assertSafeRelativePath(root, relativePath, description);
  const stat = fs.lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${description} не является обычным файлом: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function summarizeMismatches(mismatches) {
  return mismatches.length === 0
    ? { approved: true, summary: "выпуск разрешён" }
    : { approved: false, summary: mismatches.join("; ") };
}

function routeBindingPath(activeVisualRoutePath, relativePath) {
  if (typeof relativePath !== "string" || !relativePath) {
    return relativePath;
  }
  if (relativePath.startsWith("docs/")) {
    return relativePath;
  }
  const marker = "/source/";
  const markerIndex = activeVisualRoutePath.lastIndexOf(marker);
  const packageRoot = markerIndex >= 0
    ? activeVisualRoutePath.slice(0, markerIndex)
    : path.posix.dirname(activeVisualRoutePath);
  return path.posix.join(packageRoot, relativePath);
}

function readRouteBindingJson(root, activeVisualRoutePath, relativePath, description) {
  return readJson(root, routeBindingPath(activeVisualRoutePath, relativePath), description);
}

function readLegacyJourneyGate(root, gate) {
  const journeyContract = readJson(root, gate.journey_contract_path, "договора пути пользователя");
  const lifecycle = journeyContract.lifecycle;
  if (!lifecycle || typeof lifecycle !== "object") {
    throw new Error(`в договоре пути пользователя отсутствует lifecycle: ${gate.journey_contract_path}`);
  }
  return summarizeMismatches([
    ["content_review_status", gate.required_content_review_status],
    ["visual_release_status", gate.required_visual_release_status],
  ].filter(([field, expected]) => lifecycle[field] !== expected)
    .map(([field, expected]) => `${field}: ${String(lifecycle[field])} (требуется ${expected})`));
}

function readActiveVisualRouteGate(root, gate) {
  const activeRoute = readJson(root, gate.active_visual_route_path, "активного визуального маршрута");
  const mismatches = [
    ["status", "active"],
    ["route_id", gate.required_active_route_id],
  ].filter(([field, expected]) => expected && activeRoute[field] !== expected)
    .map(([field, expected]) => `${field}: ${String(activeRoute[field])} (требуется ${expected})`);

  if (gate.required_final_release_status) {
    const activeContract = readRouteBindingJson(
      root,
      gate.active_visual_route_path,
      activeRoute.active_contract?.path,
      "активного договора визуального маршрута",
    );
    if (activeContract.status !== gate.required_final_release_status) {
      mismatches.push(`active_contract.status: ${String(activeContract.status)} (требуется ${gate.required_final_release_status})`);
    }
  }

  const ownerApprovalPath = activeRoute.release_bindings?.owner_final_approval_path;
  if (ownerApprovalPath) {
    const ownerApproval = readRouteBindingJson(
      root,
      gate.active_visual_route_path,
      ownerApprovalPath,
      "итогового решения владельца",
    );
    if (ownerApproval.decision !== "approved") {
      mismatches.push(`owner_final_approval.decision: ${String(ownerApproval.decision)} (требуется approved)`);
    }
    if (ownerApproval.authorizations?.active_release_switch_allowed !== true) {
      mismatches.push("owner_final_approval.active_release_switch_allowed: требуется true");
    }
    if (ownerApproval.authorizations?.delivery_archive_allowed !== true) {
      mismatches.push("owner_final_approval.delivery_archive_allowed: требуется true");
    }
  }

  return summarizeMismatches(mismatches);
}

export function readReleaseGateState(root, archiveContractPath) {
  const archiveContract = readJson(root, archiveContractPath, "контракта архива с выпускным барьером");
  const gate = archiveContract.release_gate;
  if (!gate) {
    throw new Error(`в контракте отсутствует выпускной барьер: ${archiveContractPath}`);
  }
  if (gate.journey_contract_path && gate.active_visual_route_path) {
    throw new Error(`в контракте указан неоднозначный выпускной барьер: ${archiveContractPath}`);
  }
  if (gate.journey_contract_path) {
    return readLegacyJourneyGate(root, gate);
  }
  if (gate.active_visual_route_path) {
    return readActiveVisualRouteGate(root, gate);
  }
  throw new Error(`в контракте отсутствует путь выпускного барьера: ${archiveContractPath}`);
}
