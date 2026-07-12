import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SHA_PATTERN = /^[0-9a-f]{40}$/iu;

export function expectedShaFromEnvironment(environment = process.env) {
  return environment.EXPECTED_GIT_SHA || environment.LOCAL_EXPECTED_GIT_SHA || null;
}

export function requireExpectedSha(environment = process.env) {
  const expected = expectedShaFromEnvironment(environment);
  if (!expected) {
    throw new Error("expected Git SHA is required; set EXPECTED_GIT_SHA or LOCAL_EXPECTED_GIT_SHA");
  }
  return expected;
}

export function assertExactSha(actual, expected) {
  if (!SHA_PATTERN.test(actual) || !SHA_PATTERN.test(expected)) {
    throw new Error("Git SHA values must contain exactly 40 hexadecimal characters");
  }
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`checked out Git SHA does not match expected SHA: ${actual} != ${expected}`);
  }
}

function currentHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

export function main(environment = process.env) {
  const actual = currentHead();
  const expected = requireExpectedSha(environment);
  assertExactSha(actual, expected);
  console.log(`exact Git SHA validation passed: ${actual}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
