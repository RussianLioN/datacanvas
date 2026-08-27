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
