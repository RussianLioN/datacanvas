import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validator = path.join(root, "scripts/validate-product-change-questionnaire-state.mjs");

function validate(statePath) {
  return spawnSync(process.execPath, [validator, statePath], {
    cwd: root,
    encoding: "utf8",
  });
}

test("состояния исторического опросника и интервью CO-2026-003 проходят одну схему", () => {
  for (const statePath of [
    "docs/product/change-orders/co-2026-001-acceptance-questionnaire-state.json",
    "docs/product/change-orders/co-2026-003-q4-lisa-profile-questionnaire-state.json",
  ]) {
    const result = validate(statePath);
    assert.equal(
      result.status,
      0,
      `${statePath} должно пройти проверку: ${result.stderr || result.stdout}`,
    );
  }
});

test("завершённый опросник отклоняется, если последний ответ позднее завершения", (t) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(root, "tests/.tmp-co-questionnaire-"));
  t.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));

  const sourcePath = path.join(
    root,
    "docs/product/change-orders/co-2026-001-acceptance-questionnaire-state.json",
  );
  const state = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  state.completed_at = "2026-07-04T22:10:04Z";

  const statePath = path.join(temporaryDirectory, "outdated-completion-questionnaire-state.json");
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  const result = validate(path.relative(root, statePath));
  assert.notEqual(result.status, 0, "проверка должна отклонять завершение до последнего ответа");
  assert.match(result.stderr, /completed questionnaire must not precede its latest answer/);
});

test("интервью CO-2026-003 отклоняет почтовый адрес из JSON-состояния", (t) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(root, "tests/.tmp-co-questionnaire-"));
  t.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));

  const sourcePath = path.join(
    root,
    "docs/product/change-orders/co-2026-003-q4-lisa-profile-questionnaire-state.json",
  );
  const state = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  state.answered_questions[0].safe_summary = `Передать результат на ${"operator" + "@" + "example.test"}.`;

  const statePath = path.join(temporaryDirectory, "unsafe-questionnaire-state.json");
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  const result = validate(path.relative(root, statePath));
  assert.notEqual(result.status, 0, "проверка должна отклонять адрес в JSON-состоянии");
  assert.match(result.stderr, /interview state must not contain email addresses/);
});
