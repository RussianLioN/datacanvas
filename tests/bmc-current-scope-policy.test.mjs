import assert from "node:assert/strict";
import test from "node:test";

import { currentCo2026003ForbiddenActiveMeaning } from "../scripts/lib/bmc-current-scope-policy.mjs";

test("единая политика BMC запрещает все согласованные формы хранения и доставки по ссылке", () => {
  const obsoleteActivePhrases = [
    "Хранение PDF-копии результата входит в текущий сценарий.",
    "Доставка по ссылке готовой презентации входит в текущий сценарий.",
    "Пользователь получает ссылке на результат.",
    "Уведомление по ссылке на презентацию отправляется пользователю.",
  ];

  for (const phrase of obsoleteActivePhrases) {
    assert.ok(
      currentCo2026003ForbiddenActiveMeaning.some((rule) => rule.test(phrase)),
      `политика должна отклонять устаревший активный смысл: ${phrase}`,
    );
  }
});
