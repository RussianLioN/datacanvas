import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const reviewDirectory = `${packagePath}/candidate-evidence/frame-review/lisa-presentation-email`;
const sourcePath = `${reviewDirectory}/source.svg`;
const manifestPath = `${reviewDirectory}/review-source-manifest.json`;
const approvalPath = `${reviewDirectory}/owner-approval.json`;
const approvedTextsPath = `${packagePath}/source/owner-approved-texts.json`;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function sha256(relativePath) {
  return createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

test("кандидат письма — самостоятельный SVG с согласованным текстом и двумя форматами вложения", () => {
  assert.equal(fs.existsSync(path.join(root, sourcePath)), true, "для письма нужен самостоятельный SVG-источник");
  assert.equal(fs.existsSync(path.join(root, manifestPath)), true, "для письма нужен манифест чернового кадра");

  const source = read(sourcePath);
  const manifest = JSON.parse(read(manifestPath));
  const approved = JSON.parse(read(approvedTextsPath));
  const subject = approved.selections.find((item) => item.topic_id === "email_subject")?.text;
  const body = approved.selections.find((item) => item.topic_id === "email_body")?.text;

  assert.match(source, /<svg[^>]+viewBox="0 0 1280 960"/u);
  assert.doesNotMatch(source, /<image\b/u, "SVG не должен подкладывать исходный PNG под новый текст");
  assert.doesNotMatch(source, /V16c/u, "контур иконки вложения не должен уходить к абсолютной координате верхнего края холста");
  assert.match(source, /data-email-field="sender"[^>]*>\s*ЕФС • Наш бизнес\s*</u);
  assert.match(source, /data-email-field="recipient"[^>]*>\s*Солодовников Роман Юрьевич\s*</u);
  assert.match(source, /data-email-field="signature"[^>]*>\s*С уважением,\s*<\/text>\s*<text[^>]*data-email-field="signature"[^>]*>\s*команда «ЕФС • Наш бизнес»\s*</u);
  assert.match(source, new RegExp(subject.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(source, new RegExp(body.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(source, /Презентация по справке\.pptx/u);
  assert.match(source, /Презентация по справке\.pdf/u);
  assert.match(source, /data-email-field="attachment-format"[^>]*>\s*PPTX\s*</u);
  assert.match(source, /data-email-field="attachment-format"[^>]*>\s*PDF\s*</u);

  assert.equal(manifest.frame_id, "lisa-presentation-email");
  assert.equal(manifest.status, "owner_frame_approved");
  assert.equal(manifest.source_svg_path, "candidate-evidence/frame-review/lisa-presentation-email/source.svg");
  assert.equal(manifest.source_svg_sha256, sha256(sourcePath));
  assert.equal(manifest.visual_reference_id, "owner_supplied_outlook_corporate_email_screenshot_2026_08_19");
  assert.equal(manifest.visual_reference_persisted_in_repository, false);
  assert.equal(manifest.recipient, "Солодовников Роман Юрьевич");
  assert.deepEqual(manifest.signature_lines, ["С уважением,", "команда «ЕФС • Наш бизнес»"]);
  assert.deepEqual(manifest.attachments, [
    { display_name: "Презентация по справке.pptx", format: "PPTX" },
    { display_name: "Презентация по справке.pdf", format: "PDF" },
  ]);
  assert.equal(manifest.subject, subject);
  assert.equal(manifest.body, body);
  assert.equal(manifest.active_release_mutation_prohibited, true);
  assert.equal(manifest.draft_png_rendered, true);
  assert.equal(manifest.draft_png_path, "candidate-evidence/frame-review/lisa-presentation-email/draft-current-resolution.png");
  assert.match(manifest.draft_png_sha256, /^[a-f0-9]{64}$/u);
  assert.deepEqual(manifest.owner_frame_approval, {
    record_path: "candidate-evidence/frame-review/lisa-presentation-email/owner-approval.json",
    decision: "approved",
    decision_text: "ok",
    decision_source: "Product Owner в рабочем чате",
    approval_time_precision: "date_only",
    approved_on: "2026-08-24",
  });

  assert.equal(fs.existsSync(path.join(root, approvalPath)), true, "принятому кадру нужна отдельная запись приёмки");
  const approval = JSON.parse(read(approvalPath));
  assert.equal(approval.frame_id, "lisa-presentation-email");
  assert.equal(approval.decision, "approved");
  assert.equal(approval.decision_text, "ok");
  assert.equal(approval.approval_time_precision, "date_only");
  assert.equal(approval.approved_on, "2026-08-24");
  assert.equal(approval.approved_source_svg_sha256, manifest.source_svg_sha256);
  assert.equal(approval.approved_draft_png_sha256, manifest.draft_png_sha256);
});

test("черновой PNG письма создаётся только из самостоятельного SVG", () => {
  const result = spawnSync(process.execPath, ["scripts/render-lisa-presentation-email-review-draft.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("общая проверка схем включает манифест и запись приёмки письма", () => {
  const schemaValidator = read("scripts/validate-json-schema.mjs");
  assert.match(schemaValidator, /lisa-presentation-email-review-source-manifest\.schema\.json/u);
  assert.match(schemaValidator, /frame-review\/lisa-presentation-email\/review-source-manifest\.json/u);
  assert.match(schemaValidator, /frame-review\/lisa-presentation-email\/owner-approval\.json/u);
});

test("неактивный договор переводит следующий цикл с письма на SVG-кадры презентаций", () => {
  const contract = JSON.parse(read(`${packagePath}/source/canonical-svg-frame-pipeline-contract.json`));
  const emailFrame = contract.frame_svg_sources.find((frame) => frame.frame_id === "lisa-presentation-email");

  assert.equal(contract.version, "4.0.0");
  assert.equal(contract.status, "inactive_pending_presentation_variant_svg_sources_and_frame_approval");
  assert.deepEqual(emailFrame, {
    frame_id: "lisa-presentation-email",
    svg_editing_mode: "canonical_svg_existing_groups_only",
    canonical_svg_status: "prepared_visual_reference_composition",
    approved_text_status: "owner_approved",
    svg_visual_check_status: "passed",
    draft_png_status: "rendered_current_resolution",
    owner_frame_approval_status: "approved",
  });
  assert.equal(contract.frame_review_session.current_frame_id, "lisa-presentation-email");
  assert.equal(contract.frame_review_session.next_frame_id, "lisa-presentation-slidedoc");
  assert.equal(contract.frame_review_session.status, "presentation_variant_frames_blocked_pending_canonical_svg_sources");
  assert.equal(contract.frame_review_session.owner_approval_record_path, "candidate-evidence/frame-review/lisa-presentation-email/owner-approval.json");
});
