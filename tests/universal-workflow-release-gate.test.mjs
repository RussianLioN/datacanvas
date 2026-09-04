import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { readReleaseGateState } from "../scripts/lib/workflow-release-gate.mjs";

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value)}\n`);
}

function withFixture(statuses, callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-release-gate-"));
  try {
    writeJson(root, "docs/release/archive.json", {
      release_gate: {
        journey_contract_path: "docs/product/journey.json",
        required_content_review_status: "approved_product_owner",
        required_visual_release_status: "approved_product_owner",
      },
    });
    writeJson(root, "docs/product/journey.json", { lifecycle: statuses });
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("ожидающий выпуск разрешает отсутствие производного архива", () => {
  withFixture({ content_review_status: "pending_product_owner", visual_release_status: "pending_product_owner" }, (root) => {
    assert.deepEqual(readReleaseGateState(root, "docs/release/archive.json"), {
      approved: false,
      summary: "content_review_status: pending_product_owner (требуется approved_product_owner); visual_release_status: pending_product_owner (требуется approved_product_owner)",
    });
  });
});

test("два принятых решения требуют наличия производного архива", () => {
  withFixture({ content_review_status: "approved_product_owner", visual_release_status: "approved_product_owner" }, (root) => {
    assert.deepEqual(readReleaseGateState(root, "docs/release/archive.json"), {
      approved: true,
      summary: "выпуск разрешён",
    });
  });
});

test("browser-native выпуск разрешается через активный визуальный маршрут", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-release-gate-"));
  try {
    writeJson(root, "docs/release/archive.json", {
      release_gate: {
        active_visual_route_path: "docs/product/active-contracts.json",
        required_active_route_id: "lisa-presentation-browser-native-eleven-screen-route",
        required_final_release_status: "owner_final_approved",
      },
    });
    writeJson(root, "docs/product/active-contracts.json", {
      status: "active",
      route_id: "lisa-presentation-browser-native-eleven-screen-route",
      active_contract: {
        path: "docs/product/browser-native-phone-prototype-contract.json",
      },
      release_bindings: {
        owner_final_approval_path: "docs/product/owner-final-approval.json",
      },
    });
    writeJson(root, "docs/product/browser-native-phone-prototype-contract.json", {
      status: "owner_final_approved",
    });
    writeJson(root, "docs/product/owner-final-approval.json", {
      decision: "approved",
      authorizations: {
        active_release_switch_allowed: true,
        delivery_archive_allowed: true,
      },
    });

    assert.deepEqual(readReleaseGateState(root, "docs/release/archive.json"), {
      approved: true,
      summary: "выпуск разрешён",
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("контракт с небезопасным путём выпуска отклоняется", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-release-gate-"));
  try {
    writeJson(root, "docs/release/archive.json", {
      release_gate: {
        journey_contract_path: "../outside.json",
        required_content_review_status: "approved_product_owner",
        required_visual_release_status: "approved_product_owner",
      },
    });
    assert.throws(() => readReleaseGateState(root, "docs/release/archive.json"), /выходит за корень/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
