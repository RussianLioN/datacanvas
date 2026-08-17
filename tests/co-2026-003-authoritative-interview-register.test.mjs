import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(new URL(relativePath, root), "utf8"));

test("CO-2026-003 хранит безопасный реестр согласованных формулировок как источник истины", () => {
  const register = readJson("docs/product/change-orders/co-2026-003-authoritative-interview-decision-register.json");
  assert.equal(register.change_order_id, "CO-2026-003");
  assert.equal(register.source_of_truth_policy.interview_precedence, "equal_to_controlled_xlsx");
  assert.ok(register.decisions.length >= 8);
  assert.ok(register.verbatim_wordings.length >= 16);
  assert.ok(register.unresolved_authoritative_text_ids.includes("CO3-MSG-001"));
  assert.ok(register.unresolved_authoritative_text_ids.includes("CO3-MSG-005"));
  assert.equal(JSON.stringify(register).includes("@"), false);
});
