import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-email`;
const REVIEW_SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const REVIEW_MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const APPROVED_TEXTS_PATH = `${PACKAGE_PATH}/source/owner-approved-texts.json`;
const VISUAL_REFERENCE_ID = "owner_supplied_outlook_corporate_email_screenshot_2026_08_19";
const RECIPIENT = "Солодовников Роман Юрьевич";
const SIGNATURE_LINES = Object.freeze(["С уважением,", "команда «ЕФС • Наш бизнес»"]);
const ATTACHMENTS = Object.freeze([
  Object.freeze({ display_name: "Презентация по справке.pptx", format: "PPTX", color: "#d95d39" }),
  Object.freeze({ display_name: "Презентация по справке.pdf", format: "PDF", color: "#e03f3f" }),
]);

function fail(message) {
  throw new Error(message);
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeText(root, relativePath, text) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text, "utf8");
}

function requiredText(root, topicId) {
  const selected = readJson(root, APPROVED_TEXTS_PATH).selections.find((item) => item.topic_id === topicId)?.text;
  if (!selected) fail(`в реестре согласованных текстов не найден ${topicId}`);
  return selected;
}

function text({ x, y, value, size = 16, weight = 400, fill = "#252a34", anchor, field, extra = "" }) {
  const attributes = [
    `x="${x}"`, `y="${y}"`, `fill="${fill}"`,
    'font-family="Arial, Helvetica, sans-serif"', `font-size="${size}"`, `font-weight="${weight}"`,
  ];
  if (anchor) attributes.push(`text-anchor="${anchor}"`);
  if (field) attributes.push(`data-email-field="${field}"`);
  if (extra) attributes.push(extra);
  return `<text ${attributes.join(" ")}>${escapeXml(value)}</text>`;
}

function iconButton(x, label) {
  return `<g transform="translate(${x} 52)"><rect width="46" height="45" rx="2" fill="#ffffff"/><text x="23" y="20" text-anchor="middle" fill="#36404d" font-family="Arial, Helvetica, sans-serif" font-size="20">${label}</text></g>`;
}

function attachmentCard(attachment, y) {
  return `<g data-email-field="attachment">
    <rect x="732" y="${y}" width="366" height="70" rx="4" fill="#f6f8fc" stroke="#d9dee8"/>
    <rect x="746" y="${y + 12}" width="43" height="47" rx="3" fill="#ffffff" stroke="#cbd1dc"/>
    <path d="M777 ${y + 12}v12h12" fill="#e7ebf3"/>
    <rect x="751" y="${y + 43}" width="34" height="13" rx="2" fill="${attachment.color}"/>
    ${text({ x: 768, y: y + 53, value: attachment.format, size: 7.5, weight: 700, fill: "#ffffff", anchor: "middle", field: "attachment-format" })}
    ${text({ x: 806, y: y + 41, value: attachment.display_name, size: 13, weight: 600, field: "attachment-name" })}
    <path d="M1066 ${y + 26}v17m-6-6 6 6 6-6" stroke="#64748b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>`;
}

function buildSvg({ subject, body }) {
  const subjectPreview = "Презентация по справке ООО «Водолей Трейд»";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="960" viewBox="0 0 1280 960" role="img" aria-label="Письмо с презентацией по справке ООО Водолей Трейд в корпоративном стиле Outlook">
  <title>Письмо с презентацией по справке ООО «Водолей Трейд»</title>
  <desc>Самостоятельный редактируемый SVG кадра, повторяющий светлую корпоративную компоновку согласованного образца Outlook.</desc>
  <defs><filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#96a0b5" flood-opacity="0.18"/></filter></defs>
  <rect width="1280" height="960" fill="#e8ebf3"/>
  <rect width="1280" height="38" fill="#0078d4"/>
  ${text({ x: 20, y: 25, value: "Home", size: 12, weight: 700, fill: "#ffffff" })}
  ${text({ x: 84, y: 25, value: "Organise", size: 12, weight: 600, fill: "#ffffff" })}
  ${text({ x: 168, y: 25, value: "Tools", size: 12, weight: 600, fill: "#ffffff" })}
  ${text({ x: 636, y: 25, value: "Inbox", size: 13, weight: 700, fill: "#ffffff", anchor: "middle" })}
  <rect y="38" width="1280" height="62" fill="#ffffff" stroke="#d4d9e3"/>
  ${["✉", "▣", "▥", "▱", "↶", "↷", "⇢", "▰", "●", "⚑", "⌕"].map((glyph, index) => iconButton(7 + index * 48, glyph)).join("\n")}
  <rect y="100" width="244" height="860" fill="#f1f2f7"/>
  <rect x="244" y="100" width="350" height="860" fill="#ffffff" stroke="#d7dbe4"/>
  <rect x="594" y="100" width="686" height="860" fill="#f7f8fc"/>
  ${text({ x: 16, y: 126, value: "All Accounts", size: 13, weight: 600, fill: "#5a6472" })}
  ${text({ x: 42, y: 153, value: "Inbox", size: 14, fill: "#4b5563" })}
  ${text({ x: 32, y: 187, value: "Drafts", size: 14, fill: "#4b5563" })}
  ${text({ x: 32, y: 210, value: "Sent", size: 14, fill: "#4b5563" })}
  ${text({ x: 16, y: 248, value: "Солодовников Роман Юрьевич", size: 12, weight: 700, fill: "#344054" })}
  ${text({ x: 32, y: 275, value: "Inbox", size: 14, fill: "#4b5563" })}
  ${text({ x: 32, y: 299, value: "Archive", size: 14, fill: "#4b5563" })}
  ${text({ x: 32, y: 323, value: "Deleted Items", size: 14, fill: "#4b5563" })}
  <rect x="244" y="100" width="350" height="36" fill="#fafbfd" stroke="#d7dbe4"/>
  ${text({ x: 272, y: 123, value: "By: Conversations", size: 12, fill: "#596579" })}
  <rect x="260" y="151" width="319" height="61" rx="3" fill="#edf2fb"/>
  <circle cx="275" cy="173" r="10" fill="#ee7c2d"/>
  ${text({ x: 292, y: 169, value: "ЕФС • Наш бизнес", size: 12.5, weight: 700, field: "sender" })}
  ${text({ x: 292, y: 188, value: subjectPreview, size: 11.5, fill: "#4c5563" })}
  ${text({ x: 553, y: 169, value: "13:40", size: 11.5, fill: "#586273", anchor: "end" })}
  ${text({ x: 617, y: 128, value: subject, size: 20, weight: 700, field: "subject" })}
  <circle cx="641" cy="169" r="19" fill="#ed7c2d"/>
  ${text({ x: 641, y: 176, value: "Е", size: 17, weight: 700, fill: "#ffffff", anchor: "middle" })}
  ${text({ x: 674, y: 159, value: "ЕФС • Наш бизнес", size: 14, weight: 700, field: "sender" })}
  ${text({ x: 674, y: 179, value: "то", size: 12, fill: "#7b8493" })}
  ${text({ x: 692, y: 179, value: RECIPIENT, size: 12, fill: "#4c5563", field: "recipient" })}
  ${text({ x: 1180, y: 160, value: "Сегодня в 13:40", size: 12, fill: "#7b8493", anchor: "end" })}
  <rect x="674" y="208" width="490" height="652" rx="12" fill="#ffffff" filter="url(#card-shadow)"/>
  <line x1="704" y1="287" x2="1134" y2="287" stroke="#e3e7ee"/>
  <text x="704" y="331" fill="#313b4a" font-family="Arial, Helvetica, sans-serif" font-size="16" data-email-field="body" aria-label="${escapeXml(body)}"><tspan x="704" dy="0">Во вложении презентация по Справке по</tspan><tspan x="704" dy="23">клиенту ООО «Водолей Трейд».</tspan></text>
  ${attachmentCard(ATTACHMENTS[0], 382)}
  ${attachmentCard(ATTACHMENTS[1], 462)}
  ${text({ x: 704, y: 599, value: "Данное письмо сформировано автоматически, отвечать", size: 12, fill: "#8a94a5" })}
  ${text({ x: 704, y: 617, value: "на него не требуется.", size: 12, fill: "#8a94a5" })}
  ${text({ x: 704, y: 671, value: "👋 Спасибо!", size: 15, weight: 700, fill: "#303b4c" })}
  ${text({ x: 704, y: 701, value: SIGNATURE_LINES[0], size: 15, field: "signature" })}
  ${text({ x: 704, y: 723, value: SIGNATURE_LINES[1], size: 15, field: "signature" })}
</svg>
`;
}

function prepareEmailReviewSource({ root = process.cwd(), replaceUnaccepted = false } = {}) {
  const sourcePath = path.join(root, REVIEW_SOURCE_PATH);
  const manifestPath = path.join(root, REVIEW_MANIFEST_PATH);
  if (fs.existsSync(path.join(path.dirname(sourcePath), "owner-approval.json"))) fail("принятый кадр письма нельзя пересобирать");
  if (fs.existsSync(manifestPath)) {
    const prior = readJson(root, REVIEW_MANIFEST_PATH);
    if (prior.status !== "svg_source_prepared_pending_visual_check" && !replaceUnaccepted) {
      fail("кадр письма уже передан на визуальную проверку; исходник нельзя менять неявно");
    }
  }
  const subject = requiredText(root, "email_subject");
  const body = requiredText(root, "email_body");
  const source = buildSvg({ subject, body });
  if (/<image\b/u.test(source)) fail("SVG кадра письма не должен использовать растровую подложку");
  writeText(root, REVIEW_SOURCE_PATH, source);
  const manifest = {
    "$schema": "../../../source/schemas/lisa-presentation-email-review-source-manifest.schema.json",
    "version": "1.0.0",
    "frame_id": "lisa-presentation-email",
    "status": "svg_source_prepared_pending_visual_check",
    "visual_reference_id": VISUAL_REFERENCE_ID,
    "visual_reference_persisted_in_repository": false,
    "source_svg_path": "candidate-evidence/frame-review/lisa-presentation-email/source.svg",
    "source_svg_sha256": sha256File(sourcePath),
    "approved_texts_path": "source/owner-approved-texts.json",
    "approved_texts_sha256": sha256File(path.join(root, APPROVED_TEXTS_PATH)),
    "recipient": RECIPIENT,
    "signature_lines": SIGNATURE_LINES,
    "subject": subject,
    "body": body,
    "attachments": ATTACHMENTS.map(({ display_name, format }) => ({ display_name, format })),
    "mock_email_time_value": "13:40",
    "active_release_mutation_prohibited": true,
    "draft_png_rendered": false,
    "draft_png_path": null,
    "draft_png_sha256": null,
    "draft_png_dimensions": null,
    "owner_frame_approval": null
  };
  writeText(root, REVIEW_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const argumentsList = process.argv.slice(2);
    if (argumentsList.some((argument) => argument !== "--replace-unaccepted")) fail("использование: node scripts/prepare-lisa-presentation-email-review-source.mjs [--replace-unaccepted]");
    const manifest = prepareEmailReviewSource({ replaceUnaccepted: argumentsList.includes("--replace-unaccepted") });
    process.stdout.write(`SVG-кандидат письма подготовлен: ${manifest.source_svg_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "SVG-кандидат письма не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { prepareEmailReviewSource };
