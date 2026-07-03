import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const paths = {
  changeOrder: "docs/product/change-orders/co-2026-001-a2a-first-priority.json",
  questionnaire: "docs/product/change-orders/co-2026-001-acceptance-questionnaire-state.json",
  sourceRegistry: "docs/product/sources/product-source-registry.json",
  changeSet: "docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json",
  vision: "docs/product-vision.md",
};

const requiredArtifacts = new Set([
  "docs/product-vision.md",
  "docs/product/bmc/bmc-v0.2.md",
  "docs/product/requirements/business-requirements.md",
  "docs/product/requirements/acceptance-criteria.md",
  "docs/product/analysis/ba/ba-spec.json",
  "docs/architecture/system-analysis/sa-spec.json",
  "docs/product/specs/feature-spec-a2a-launch.json",
  "docs/product/requirements/traceability-matrix.json",
]);

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    throw new Error(`required file is missing: ${relativePath}`);
  }
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

try {
  for (const requiredPath of Object.values(paths)) {
    requireFile(requiredPath);
  }

  const changeOrder = readJson(paths.changeOrder);
  if (changeOrder.status !== "accepted") {
    throw new Error("CO-2026-001 must be accepted before impact revision");
  }
  if (!changeOrder.priority_after?.includes("Запуск другим агентом")) {
    throw new Error("CO-2026-001 priority_after must include launch by another agent");
  }

  const questionnaire = readJson(paths.questionnaire);
  const confirmedQuestions = new Set(
    questionnaire.answered_questions
      .filter((question) => question.status === "confirmed")
      .map((question) => question.question_id),
  );
  for (const questionId of ["PRODUCT-01", "PRODUCT-07", "PRODUCT-19", "PRODUCT-20"]) {
    if (!confirmedQuestions.has(questionId)) {
      throw new Error(`required PO decision is not confirmed: ${questionId}`);
    }
  }

  const vision = readText(paths.vision);
  for (const phrase of [
    "Если данных достаточно и задача пришла от другого агента",
    "В диалоговом режиме в Лисе",
    "редактируемом формате",
  ]) {
    if (!vision.includes(phrase)) {
      throw new Error(`Vision is missing accepted CO-2026-001 phrase: ${phrase}`);
    }
  }

  const sourceRegistry = readJson(paths.sourceRegistry);
  const cascadeSource = sourceRegistry.sources.find((source) => source.source_id === "SRC-DC-CASCADE-2026-07-02");
  if (!cascadeSource || cascadeSource.lifecycle !== "historical" || cascadeSource.trust_level !== "superseded_by_co_acceptance") {
    throw new Error("historical cascade evidence must be marked as superseded by CO acceptance");
  }

  const changeSet = readJson(paths.changeSet);
  const coveredArtifacts = new Set(changeSet.proposed_edits.map((edit) => edit.artifact_path));
  for (const artifactPath of requiredArtifacts) {
    if (!coveredArtifacts.has(artifactPath)) {
      throw new Error(`accepted CO impact is missing proposed edit coverage for: ${artifactPath}`);
    }
  }

  for (const edit of changeSet.proposed_edits) {
    const semantic = ["point_semantic", "cross_artifact_semantic", "conceptual_product", "conceptual_process", "security_boundary"].includes(edit.change_kind);
    if (semantic && edit.apply_status === "applied" && !edit.acceptance_record_id) {
      throw new Error(`accepted CO impact has applied semantic edit without acceptance: ${edit.edit_id}`);
    }
  }

  console.log("accepted change order impact validation passed");
} catch (error) {
  fail(error.message);
}
