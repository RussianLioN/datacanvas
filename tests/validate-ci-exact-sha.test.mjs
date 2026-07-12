import assert from "node:assert/strict";
import test from "node:test";

import { assertExactSha, expectedShaFromEnvironment, requireExpectedSha } from "../scripts/validate-ci-exact-sha.mjs";

test("PR head SHA takes precedence over the workflow merge SHA", () => {
  const expected = expectedShaFromEnvironment({
    EXPECTED_GIT_SHA: "a".repeat(40),
    GITHUB_SHA: "b".repeat(40),
  });

  assert.equal(expected, "a".repeat(40));
});

test("exact SHA assertion rejects a different checkout", () => {
  assert.throws(
    () => assertExactSha("a".repeat(40), "b".repeat(40)),
    /checked out Git SHA does not match expected SHA/,
  );
});

test("exact SHA assertion accepts the expected checkout", () => {
  assert.doesNotThrow(() => assertExactSha("a".repeat(40), "a".repeat(40)));
});

test("missing expected SHA is rejected instead of trusting the checkout", () => {
  assert.throws(() => requireExpectedSha({}), /expected Git SHA is required/);
});

test("generic GitHub workflow SHA cannot replace the explicit candidate SHA", () => {
  assert.throws(
    () => requireExpectedSha({ GITHUB_SHA: "a".repeat(40) }),
    /expected Git SHA is required/,
  );
});
