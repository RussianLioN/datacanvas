import process from "node:process";
import {
  compareGeneratedHtml,
  compareGeneratedPackage,
  generateHtmlPrototype,
  generatePrototypePackage,
} from "./lib/presentation-link-lisa-user-journey.mjs";

const checkMode = process.argv.includes("--check");
const htmlOnlyMode = process.argv.includes("--html-only");

try {
  if (checkMode && htmlOnlyMode) {
    const differences = compareGeneratedHtml(process.cwd());
    if (differences.length > 0) {
      console.error(`ERROR: presentation link Lisa HTML is stale:\n- ${differences.join("\n- ")}`);
      process.exit(1);
    }
    console.log("presentation link Lisa HTML outputs are current");
  } else if (checkMode) {
    const differences = compareGeneratedPackage(process.cwd());
    if (differences.length > 0) {
      console.error(`ERROR: presentation link Lisa package is stale:\n- ${differences.join("\n- ")}`);
      process.exit(1);
    }
    console.log("presentation link Lisa package generated outputs are current");
  } else if (htmlOnlyMode) {
    const result = generateHtmlPrototype();
    console.log(
      `presentation link Lisa HTML written: ${result.model.states.length} states, ${result.generatedPaths.length} outputs`,
    );
  } else {
    const result = generatePrototypePackage();
    console.log(
      `presentation link Lisa package written: ${result.model.states.length} states, ${result.generatedPaths.length} outputs`,
    );
  }
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
