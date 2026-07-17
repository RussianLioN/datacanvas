import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  CONTRACT_PATHS,
  PACKAGE_PATH,
  compareGeneratedPackage,
  loadContracts,
  measureVariableText,
  parsePresentationLinkLisaValidationArguments,
  validateContracts,
  validateGeneratedPackage,
  validateSvgSecurity,
} from "./lib/presentation-link-lisa-user-journey.mjs";

const root = process.cwd();
let validationMode;
try {
  validationMode = parsePresentationLinkLisaValidationArguments(
    process.argv.slice(2),
  );
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
const issues = [];
const contracts = loadContracts(root);
issues.push(...validateContracts(root, contracts));
issues.push(...validateGeneratedPackage(root));

if (!validationMode.savedOnly) {
  issues.push(...compareGeneratedPackage(root));
}

const componentRoot = path.join(root, PACKAGE_PATH, "source/components");
let libraryBytes = 0;
for (const component of contracts.visual.components) {
  const componentPath = path.join(componentRoot, path.basename(component.source_svg));
  if (!fs.existsSync(componentPath)) {
    issues.push(`source SVG component is missing: ${component.source_svg}`);
    continue;
  }
  const svg = fs.readFileSync(componentPath, "utf8");
  libraryBytes += Buffer.byteLength(svg);
  issues.push(
    ...validateSvgSecurity(svg, contracts.visual.svg_security_limits).map(
      (issue) => `${component.source_svg}: ${issue}`,
    ),
  );
}
if (libraryBytes > contracts.visual.svg_security_limits.library_max_bytes) {
  issues.push(
    `source SVG component library exceeds ${contracts.visual.svg_security_limits.library_max_bytes} bytes`,
  );
}

const fontPath = path.join(root, PACKAGE_PATH, "source/fonts/NotoSans[wdth,wght].ttf");
if (!fs.existsSync(fontPath)) {
  issues.push("vendored Noto Sans font is missing");
} else {
  const regular = measureVariableText(fontPath, "Заказать презентацию", 16, {
    wght: 400,
    wdth: 100,
  });
  const bold = measureVariableText(fontPath, "Заказать презентацию", 16, {
    wght: 700,
    wdth: 100,
  });
  const regularAgain = measureVariableText(fontPath, "Заказать презентацию", 16, {
    wght: 400,
    wdth: 100,
  });
  if (!(bold > regular)) {
    issues.push(`variable font weight is not applied: regular=${regular}, bold=${bold}`);
  }
  if (Math.abs(regular - regularAgain) > 0.001) {
    issues.push(
      `variable font measurement leaks state: first=${regular}, repeated=${regularAgain}`,
    );
  }
}

for (const relativePath of Object.values(CONTRACT_PATHS)) {
  const text = fs.readFileSync(path.join(root, relativePath), "utf8");
  if (text.includes("/Users/") || text.includes("file://")) {
    issues.push(`contract contains a local path: ${relativePath}`);
  }
}

if (issues.length > 0) {
  console.error(`ERROR: presentation link Lisa validation failed:\n- ${issues.join("\n- ")}`);
  process.exit(1);
}

console.log(
  validationMode.savedOnly
    ? "presentation link Lisa saved package validation passed"
    : "presentation link Lisa user journey validation passed",
);
