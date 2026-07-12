import assert from "node:assert/strict";
import fs from "node:fs";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(JSON.parse(fs.readFileSync("schemas/common-defs.schema.json", "utf8")));

const validateBaseline = ajv.compile(
  JSON.parse(fs.readFileSync("schemas/cascade-baseline-manifest.schema.json", "utf8")),
);
const validateVerification = ajv.compile(
  JSON.parse(fs.readFileSync("schemas/cascade-verification-evidence.schema.json", "utf8")),
);
ajv.addSchema(JSON.parse(fs.readFileSync("schemas/cascade-impact-cone.schema.json", "utf8")));
ajv.addSchema(JSON.parse(fs.readFileSync("schemas/impact-analysis-report.schema.json", "utf8")));
const validateResolutionInput = ajv.compile(
  JSON.parse(fs.readFileSync("schemas/cascade-resolution-input.schema.json", "utf8")),
);

const baseline = JSON.parse(
  fs.readFileSync("tests/fixtures/cascading-governance/cascade-baseline-manifest.json", "utf8"),
);
assert.equal(validateBaseline(baseline), true, JSON.stringify(validateBaseline.errors, null, 2));

const verification = JSON.parse(
  fs.readFileSync("tests/fixtures/cascading-governance/cascade-verification-evidence.json", "utf8"),
);
assert.equal(validateVerification(verification), true, JSON.stringify(validateVerification.errors, null, 2));

const failedVerification = structuredClone(verification);
failedVerification.validation_results[0].status = "failed";
assert.equal(validateVerification(failedVerification), false, "verified evidence must reject a failed validation");

const incompleteVerification = structuredClone(verification);
incompleteVerification.decision_queue_status = "blocked";
assert.equal(validateVerification(incompleteVerification), false, "verified evidence must require a closed decision queue");

const resolutionInput = JSON.parse(
  fs.readFileSync("tests/fixtures/cascading-governance/cascade-resolution-input.json", "utf8"),
);
const sourceAwareResolutionInput = {
  ...resolutionInput,
  source_resolutions: [
    {
      path: "docs/product-vision.md",
      update_status: "applied",
      no_change_rationale: null,
    },
  ],
};
assert.equal(
  validateResolutionInput(sourceAwareResolutionInput),
  true,
  JSON.stringify(validateResolutionInput.errors, null, 2),
);
const missingSourceResolutionInput = structuredClone(sourceAwareResolutionInput);
delete missingSourceResolutionInput.source_resolutions;
assert.equal(
  validateResolutionInput(missingSourceResolutionInput),
  false,
  "resolution input must cover the changed source separately from the impact cone",
);
const invalidResolutionInput = structuredClone(sourceAwareResolutionInput);
invalidResolutionInput.artifact_resolutions[0].update_status = "no_change_confirmed";
assert.equal(
  validateResolutionInput(invalidResolutionInput),
  false,
  "no-change resolution must include a structured rationale",
);

console.log("cascade verification validation passed");
