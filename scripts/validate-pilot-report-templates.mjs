import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const templates = [
  {
    path: "docs/release/templates/pilot-report-template.md",
    forbiddenOutput: "docs/release/pilot-report.md",
    requiredText: [
      "Статус: template only",
      "Review Evidence",
      "Gate Decisions",
      "G9 Real UAT",
      "G10 Pilot Gate",
      "Quality Gate Results",
      "Completion Audit Update",
      "TO_BE_FILLED_AFTER_PILOT",
    ],
  },
  {
    path: "docs/release/templates/pilot-process-portability-notes-template.md",
    forbiddenOutput: "docs/release/pilot-process-portability-notes.md",
    requiredText: [
      "Статус: template only",
      "Reusable Parts",
      "Project-Specific Parts",
      "Migration Risks",
      "Required Adaptations",
      "Process Change Candidates",
      "G11 Decision",
      "TO_BE_FILLED_AFTER_PILOT",
    ],
  },
];

for (const template of templates) {
  if (!exists(template.path)) {
    fail(`template does not exist: ${template.path}`);
  }
  if (exists(template.forbiddenOutput)) {
    fail(`real external evidence path exists before pilot run: ${template.forbiddenOutput}`);
  }
  const text = readText(template.path);
  for (const requiredText of template.requiredText) {
    if (!text.includes(requiredText)) {
      fail(`${template.path} is missing required text: ${requiredText}`);
    }
  }
  if (/status:\s*(accepted|complete|met)/i.test(text)) {
    fail(`${template.path} must not claim accepted/complete/met status`);
  }
}

const handoff = readText("docs/release/pilot-execution-handoff.md");
for (const templatePath of templates.map((template) => template.path)) {
  if (!handoff.includes(templatePath)) {
    fail(`pilot execution handoff must reference template: ${templatePath}`);
  }
}

console.log("pilot report templates validation passed");
