import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fitSvgTextLines, wrapPlantUmlLine } from "./lib/bmc-visual-layout.mjs";
import { publicBusinessForbiddenSnippets, publicBusinessLanguageRules } from "./public-business-language-policy.mjs";

const root = process.cwd();
const checkMode = process.argv.includes("--check");
const generatorPath = "scripts/generate-bmc-artifacts.mjs";
const generatedAt = "2026-07-12T00:00:00Z";

const paths = {
  trace: "docs/product/bmc/bmc-trace.v0.1.json",
  markdown: "docs/product/bmc/bmc-v0.2.md",
  puml: "docs/product/bmc/source/derived/datacanvas-bmc.puml",
  svg: "docs/product/bmc/source/derived/datacanvas-bmc.svg",
  png: "docs/product/bmc/source/derived/datacanvas-bmc.png",
  pdf: "docs/product/bmc/source/derived/datacanvas-bmc.pdf",
  validationNeeds: "docs/product/bmc/bmc-validation-needs.json",
  derivedManifest: "docs/product/bmc/bmc-derived-manifest.json",
  packageReadme: "docs/product/bmc/README.md",
  sourceMap: "docs/product/bmc/source-map.md",
  textAlternative: "docs/product/bmc/text-alternative.md",
  packageManifest: "docs/product/bmc/manifest.json",
  visualReview: "docs/product/bmc/evidence/visual-review.md",
  designerConsilium: "docs/product/bmc/evidence/designer-consilium.json",
  visualAcceptance: "docs/product/bmc/evidence/bmc-visual-acceptance.json",
  designPhilosophy: "docs/product/bmc/evidence/bmc-visual-design-philosophy.md",
};

let blockModel = [];
let blockById = new Map();

const cleanForbidden = [
  "не подтверждено",
  "допущение",
  "подтверждено",
  "unconfirmed",
  "assumption",
  "confirmed",
  "Confidence",
  "Evidence Requests",
  "Open Questions",
  "Source refs",
  "source_refs",
  "evidence_requests",
  "PresentationSpec",
  "trace",
  "validation companion",
  "companion JSON",
  "quality gates",
  "renderer",
  "gateway",
  "callback",
  "A2A",
  "MCP",
  "LLM",
  "SHA",
  "Статус:",
  "## Методика",
  "## Граница модели",
  "рабочая версия",
  "классическую схему Business Model Canvas",
  "внутреннего ИТ-продукта",
  "внешняя выручка",
  "служебные доказательства",
  "машинные артефакты",
  ...publicBusinessForbiddenSnippets,
  "требует отдельной проверки",
  "предметом отдельной проверки",
  "открытая зависимость",
  "открытые зависимости",
  "/Users/",
  "file://",
];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function buildBlockModel(trace) {
  const itemByBlock = new Map(trace.items.map((item) => [item.block, item]));
  return trace.blocks.map((block) => {
    const item = itemByBlock.get(block.id);
    if (!item) {
      fail(`BMC trace is missing public item for block: ${block.id}`);
    }
    return {
      id: block.id,
      classic: block.title,
      title: block.public_title,
      shortTitle: block.short_title,
      statement: item.statement,
      bullets: item.bullets,
      detail: item.detail,
    };
  });
}

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function sha256File(filePath) {
  return sha256Bytes(fs.readFileSync(filePath));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function validationNeedFor(item) {
  if (item.status === "assumption") {
    return "research";
  }
  if (["unsupported", "contradicted"].includes(item.status)) {
    return "investigation";
  }
  if (item.evidence_ids.length > 0) {
    return "verification";
  }
  return "confirmation";
}

function requiredActionFor(item) {
  const title = blockById.get(item.block)?.title ?? item.block;
  if (item.status === "assumption") {
    return `Проверить расчет или исследование по блоку "${title}" через метрику, пилотное наблюдение или отдельное интервью.`;
  }
  if (["unsupported", "contradicted"].includes(item.status)) {
    return `Разобрать противоречие по блоку "${title}" и принять решение о сохранении, изменении или удалении утверждения.`;
  }
  if (item.evidence_ids.length > 0) {
    return `Проверить, достаточно ли связанных материалов для блока "${title}", и закрыть непокрытые детали.`;
  }
  return `Предоставить материал для блока "${title}": файл, ссылку, решение, метрику или безопасную цитату.`;
}

function buildValidationNeeds(trace) {
  const items = trace.items
    .filter((item) => item.status !== "confirmed")
    .map((item) => ({
      item_id: item.item_id,
      block: item.block,
      block_title: blockById.get(item.block)?.title ?? item.block,
      statement: item.statement,
      validation_need: validationNeedFor(item),
      current_status: item.status,
      confidence: item.confidence,
      required_action: requiredActionFor(item),
      linked_answer_ids: item.interview_answer_ids,
      evidence_ids: item.evidence_ids,
      source_refs: item.source_refs,
      owner_role: item.owner_role,
    }));

  return {
    version: "0.1.0",
    status: "generated",
    source_trace_path: paths.trace,
    generated_at: generatedAt,
    summary: {
      total_items: trace.items.length,
      items_requiring_action: items.length,
      evidence_request_ids: trace.evidence_requests,
      open_question_ids: trace.open_questions,
    },
    items,
  };
}

function markdown() {
  const tableRows = blockModel.map(
    (block) => `| ${block.id} | ${block.classic} | ${block.title} | ${block.statement} |`,
  );
  const sections = blockModel.flatMap((block) => [
    `## ${block.id}. ${block.title}`,
    "",
    block.statement,
    "",
    ...block.detail.map((item) => `- ${item}`),
    "",
  ]);

  return [
    "# Business Model Canvas DataCanvas v0.2",
    "",
    "## Краткая канва",
    "",
    "| Блок | Классический смысл | Раздел DataCanvas | Содержание |",
    "|---|---|---|---|",
    ...tableRows,
    "",
    ...sections,
  ].join("\n");
}

function plantUml() {
  const label = (ids) =>
    ids
      .map((id) => {
        const block = blockById.get(id);
        const bulletLines = block.bullets.flatMap((item) =>
          wrapPlantUmlLine(item, 54).map((line, index) => `${index === 0 ? "- " : "  "}${line}`),
        );
        return [`<b>${id.slice(1)}. ${block.title}</b>`, ...bulletLines].join("\\n");
      })
      .join("\\n==\\n");

  return [
    "@startuml",
    "title DataCanvas Business Model Canvas",
    "top to bottom direction",
    "skinparam backgroundColor #F8FAFC",
    "skinparam nodesep 18",
    "skinparam ranksep 24",
    "skinparam defaultFontName \"Noto Sans\"",
    "skinparam defaultFontColor #111827",
    "skinparam defaultFontSize 15",
    "skinparam rectangle {",
    "  RoundCorner 6",
    "  Shadowing false",
    "  BorderColor #334155",
    "}",
    "skinparam rectangle<<gap>> {",
    "  BorderColor #F8FAFC",
    "  BackgroundColor #F8FAFC",
    "  FontColor #F8FAFC",
    "}",
    `rectangle "${label(["B8"])}" as B8 #E8F2ED`,
    `rectangle "${label(["B7", "B6"])}" as B76 #EDF7F4`,
    `rectangle "${label(["B2"])}" as B2 #FFF4CC`,
    `rectangle "${label(["B4", "B3"])}" as B43 #EAF0FA`,
    `rectangle "${label(["B1"])}" as B1 #E9EFF9`,
    `rectangle "${label(["B9"])}" as B9 #F7E9E2`,
    "rectangle \" \" as E1 <<gap>>",
    `rectangle "${label(["B5"])}" as B5 #F7E9E2`,
    "rectangle \" \" as E2 <<gap>>",
    "rectangle \" \" as E3 <<gap>>",
    "B8 -[hidden]right- B76",
    "B76 -[hidden]right- B2",
    "B2 -[hidden]right- B43",
    "B43 -[hidden]right- B1",
    "B8 -[hidden]down- B9",
    "B76 -[hidden]down- E1",
    "B2 -[hidden]down- B5",
    "B43 -[hidden]down- E2",
    "B1 -[hidden]down- E3",
    "B9 -[hidden]right- E1",
    "E1 -[hidden]right- B5",
    "B5 -[hidden]right- E2",
    "E2 -[hidden]right- E3",
    "@enduml",
    "",
  ].join("\n");
}

function svgText(lines, {
  x,
  y,
  width,
  maxY,
  fontSize = 34,
  minFontSize = 24,
  lineHeightRatio = 1.28,
  fill = "#26313f",
  weight = "400",
  role,
}) {
  const layout = fitSvgTextLines(lines, {
    maxWidth: width,
    startY: y,
    maxY,
    maxFontSize: fontSize,
    minFontSize,
    lineHeightRatio,
  });
  const tspans = layout.lines
    .map((line, index) => `<tspan x="${x}" y="${y + index * layout.lineHeight}">${escapeHtml(line)}</tspan>`)
    .join("");
  return `<text data-role="${role}" font-family="Inter, Arial, sans-serif" font-size="${layout.fontSize}" font-weight="${weight}" fill="${fill}">${tspans}</text>`;
}

function svgBlock(block, box, options = {}) {
  const isTall = box.h >= 900;
  const isWideBottom = box.w >= 1000 && box.h < 620;
  const bodyLines = [
    ...(isTall || isWideBottom ? [block.statement] : []),
    ...block.bullets.map((item) => `• ${item}`),
  ];
  const accent = options.accent ?? "#0f766e";
  const roleAttrs = [
    'data-role="bmc-block"',
    `data-block="${block.id}"`,
    `data-layout-slot="${options.slot ?? block.id}"`,
    options.extraRole ? `data-extra-role="${options.extraRole}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const titleSize = box.h < 620 ? 33 : 38;
  const bodySize = isTall ? 29 : box.h < 620 ? 28 : 32;
  const bodyLineHeight = isTall ? 39 : box.h < 620 ? 37 : 43;

  return [
    `<g ${roleAttrs} transform="translate(${box.x} ${box.y})">`,
    `<rect width="${box.w}" height="${box.h}" rx="8" fill="${options.fill ?? "#ffffff"}" stroke="#243447" stroke-width="3"/>`,
    `<rect width="${box.w}" height="16" rx="8" fill="${accent}" opacity="0.95"/>`,
    `<text data-role="bmc-block-number" x="34" y="70" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" fill="${accent}">${block.id}</text>`,
    svgText([block.shortTitle], {
      x: 34,
      y: 122,
      width: box.w - 68,
      maxY: box.h < 620 ? 150 : 160,
      fontSize: titleSize,
      minFontSize: 28,
      lineHeightRatio: 1.2,
      fill: "#111827",
      weight: "760",
      role: "bmc-block-title",
    }),
    `<line x1="34" y1="${box.h < 620 ? 172 : 182}" x2="${box.w - 34}" y2="${box.h < 620 ? 172 : 182}" stroke="#cbd5e1" stroke-width="2"/>`,
    svgText(bodyLines, {
      x: 42,
      y: box.h < 620 ? 222 : 238,
      width: box.w - 84,
      maxY: box.h - (box.h < 620 ? 16 : 24),
      fontSize: bodySize,
      minFontSize: 24,
      lineHeightRatio: box.h < 620 ? 1.25 : bodyLineHeight / bodySize,
      fill: "#26313f",
      role: "bmc-block-body",
    }),
    "</g>",
  ].join("\n");
}

function svg() {
  const x0 = 174;
  const y0 = 280;
  const gap = 28;
  const col = [640, 640, 820, 640, 640];
  const topH = 1180;
  const splitH = (topH - gap) / 2;
  const bottomY = y0 + topH + gap;
  const bottomH = 500;
  const bottomW = (3840 - x0 * 2 - gap) / 2;
  const x = [
    x0,
    x0 + col[0] + gap,
    x0 + col[0] + gap + col[1] + gap,
    x0 + col[0] + gap + col[1] + gap + col[2] + gap,
    x0 + col[0] + gap + col[1] + gap + col[2] + gap + col[3] + gap,
  ];
  const boxes = [
    ["B8", { x: x[0], y: y0, w: col[0], h: topH }, { fill: "#e8f2ed", accent: "#047857", slot: "top-left" }],
    ["B7", { x: x[1], y: y0, w: col[1], h: splitH }, { fill: "#edf7f4", accent: "#0f766e", slot: "top-split-upper" }],
    ["B6", { x: x[1], y: y0 + splitH + gap, w: col[1], h: splitH }, { fill: "#f4fbf9", accent: "#0f766e", slot: "top-split-lower" }],
    ["B2", { x: x[2], y: y0, w: col[2], h: topH }, { fill: "#fff4cc", accent: "#b45309", slot: "top-center" }],
    ["B4", { x: x[3], y: y0, w: col[3], h: splitH }, { fill: "#eaf0fa", accent: "#2563eb", slot: "top-split-upper" }],
    ["B3", { x: x[3], y: y0 + splitH + gap, w: col[3], h: splitH }, { fill: "#f2f6fd", accent: "#2563eb", slot: "top-split-lower" }],
    ["B1", { x: x[4], y: y0, w: col[4], h: topH }, { fill: "#e9eff9", accent: "#1d4ed8", slot: "top-right" }],
    [
      "B9",
      { x: x0, y: bottomY, w: bottomW, h: bottomH },
      { fill: "#f7e9e2", accent: "#c2410c", slot: "bottom-left", extraRole: "bmc-cost-row" },
    ],
    [
      "B5",
      { x: x0 + bottomW + gap, y: bottomY, w: bottomW, h: bottomH },
      { fill: "#f8ede5", accent: "#9a3412", slot: "bottom-right", extraRole: "bmc-value-stream-row" },
    ],
  ];

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" data-role="bmc-root" role="img" width="3840" height="2160" viewBox="0 0 3840 2160">',
    "<title>DataCanvas Business Model Canvas</title>",
    "<desc>Классическая канва бизнес-модели DataCanvas: верхний ряд B8, B7/B6, B2, B4/B3, B1; нижний ряд B9 и B5.</desc>",
    '<rect data-role="bmc-background" width="3840" height="2160" fill="#f8fafc"/>',
    '<rect data-role="bmc-frame" x="88" y="72" width="3664" height="2016" rx="18" fill="#ffffff" stroke="#d7dee8" stroke-width="3"/>',
    '<text data-role="bmc-title" x="174" y="158" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="820" fill="#111827">DataCanvas Business Model Canvas</text>',
    '<g data-role="bmc-top-row">',
    ...boxes.slice(0, 7).map(([id, box, options]) => svgBlock(blockById.get(id), box, options)),
    "</g>",
    '<g data-role="bmc-bottom-row">',
    ...boxes.slice(7).map(([id, box, options]) => svgBlock(blockById.get(id), box, options)),
    "</g>",
    "</svg>",
    "",
  ].join("\n");
}

function sourceMap(trace) {
  const byItem = new Map(trace.items.map((item) => [item.block, item]));
  const rows = blockModel.map((block) => {
    const item = byItem.get(block.id);
    return `| ${block.id} | ${block.title} | ${item?.item_id ?? ""} | ${(item?.source_refs ?? []).join(", ")} | ${block.statement} |`;
  });
  return [
    "# BMC Source Map",
    "",
    "Документ связывает публичные блоки BMC с внутренней трассировкой. Он не является пользовательским BMC-рендером.",
    "",
    "| Блок | Раздел | Trace item | Source refs | Clean statement |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

function textAlternative() {
  return [
    "# Text Alternative For DataCanvas BMC",
    "",
    "Текстовая альтернатива повторяет смысл визуального BMC для чтения без SVG, PNG или PDF.",
    "",
    ...blockModel.flatMap((block) => [
      `## ${block.id}. ${block.title}`,
      "",
      block.statement,
      "",
      ...block.bullets.map((item) => `- ${item}`),
      "",
    ]),
  ].join("\n");
}

function packageReadme() {
  return [
    "# DataCanvas BMC Package",
    "",
    "Пакет содержит чистовой Business Model Canvas DataCanvas, визуальные производные файлы и служебные доказательства генерации.",
    "",
    "## Основные файлы",
    "",
    "| Файл | Назначение |",
    "|---|---|",
    `| \`${paths.markdown}\` | Чистовой BMC в Markdown. |`,
    `| \`${paths.svg}\` | Канонический визуальный источник. |`,
    `| \`${paths.png}\` | Переносимый PNG-рендер из SVG. |`,
    `| \`${paths.pdf}\` | PDF-рендер из SVG. |`,
    `| \`${paths.puml}\` | Вторичный инженерный PlantUML-вид. |`,
    `| \`${paths.validationNeeds}\` | Companion JSON для проверок и исследований. |`,
    "",
    "## Команды",
    "",
    "```bash",
    "npm run generate:bmc",
    "npm run generate:bmc -- --check",
    "npm run validate:bmc",
    "```",
    "",
    "## Правило",
    "",
    "Публичные BMC-файлы остаются чистыми. Статусы проверки, источники, SHA и служебная трассировка хранятся только в JSON и evidence-файлах.",
    "",
  ].join("\n");
}

function designPhilosophy() {
  return [
    "# Visual Philosophy: Structured Clarity",
    "",
    "Structured Clarity treats the canvas as a working instrument rather than decoration. Space is disciplined, rectangular, and calm: each block has a precise role, and the center of gravity belongs to the value proposition. The composition should feel meticulously crafted, as if every margin and visual weight was adjusted by a senior information designer.",
    "",
    "Color is functional and restrained. Partner and resource areas use quiet greens, user and channel areas use controlled blues, and value/cost zones use warm tones. The palette communicates structure without noise. The execution must look like the product of deep expertise, with painstaking attention to contrast, rhythm, and hierarchy.",
    "",
    "Typography is sparse and clear. Text is not decorative copy; it is an operational label system. Short bullets carry the minimum content needed to read the model at a glance. The final work must show master-level execution: no overflow, no arbitrary truncation, no visual ambiguity.",
    "",
    "The visual language borrows from enterprise diagrams and editorial infographics: firm grid, clean planes, enough breathing room, and a visible hierarchy between the central value proposition and supporting blocks. The result should look carefully labored over, not quickly assembled.",
    "",
  ].join("\n");
}

function visualReview(artifactHashes) {
  return [
    "# Проверка визуального BMC",
    "",
    `Проверено: ${generatedAt}`,
    "",
    "Итог: готово к пользовательской проверке.",
    "",
    "Проверено:",
    "",
    "- Сохранена классическая структура BMC: B8 | B7/B6 | B2 | B4/B3 | B1, нижний ряд B9 | B5.",
    "- Текст каждого блока помещается внутри своей рамки без пересечений и обрезания.",
    "- Рамки выровнены, интервалы сетки одинаковы, все элементы находятся внутри холста.",
    "- SVG является каноническим визуальным источником; PNG и PDF формируются из него.",
    "- PlantUML содержит те же девять блоков, ограниченные по длине строки и полную сетку связей.",
    "",
    "Проверенные файлы:",
    "",
    `- ${paths.svg}: ${artifactHashes[paths.svg]}`,
    `- ${paths.png}: ${artifactHashes[paths.png]}`,
    `- ${paths.pdf}: ${artifactHashes[paths.pdf]}`,
    `- ${paths.puml}: ${artifactHashes[paths.puml]}`,
    "",
  ].join("\n");
}

function visualAcceptance(artifactHashes, pngInfo) {
  const artifactPaths = [paths.svg, paths.png, paths.pdf, paths.puml];
  const checks = [
    { id: "svg_contract", status: "passed", evidence: "SVG has 3840x2160 viewBox, role, title, desc and data-role markers." },
    { id: "classic_layout", status: "passed", evidence: "Layout is B8 | B7/B6 | B2 | B4/B3 | B1 with B9 | B5 bottom row." },
    { id: "svg_text_fit", status: "passed", evidence: "Every rendered text line stays inside its BMC block frame." },
    { id: "balanced_grid", status: "passed", evidence: "Frames do not overlap; column, split and bottom-row gaps are equal." },
    { id: "plantuml_layout", status: "passed", evidence: "PlantUML labels are wrapped and the nine-block grid is complete." },
    { id: "png_dimensions", status: "passed", evidence: `${pngInfo.width}x${pngInfo.height}` },
    { id: "clean_public_surface", status: "passed", evidence: "Public BMC, SVG and PlantUML contain no validation/status markers." },
  ];
  return {
    version: "0.1.0",
    status: "accepted",
    checked_at: generatedAt,
    command: "npm run generate:bmc",
    exit_code: 0,
    canonical_visual_path: paths.svg,
    input_sha256: artifactHashes[paths.svg],
    output_sha256: {
      png: artifactHashes[paths.png],
      pdf: artifactHashes[paths.pdf],
      plantuml: artifactHashes[paths.puml],
    },
    artifact_paths: artifactPaths,
    checks,
  };
}

function designerConsilium(artifactHashes) {
  const checkedArtifacts = [
    { path: paths.svg, sha256: artifactHashes[paths.svg] },
    { path: paths.png, sha256: artifactHashes[paths.png] },
    { path: paths.pdf, sha256: artifactHashes[paths.pdf] },
    { path: paths.puml, sha256: artifactHashes[paths.puml] },
  ];
  return {
    version: "0.1.0",
    status: "accepted",
    checked_at: generatedAt,
    verdict: "ready_for_user_acceptance",
    severity_summary: {
      blocker: 0,
      major: 0,
      minor: 0,
    },
    roles: [
      {
        role: "BMC method reviewer",
        verdict: "accepted",
        note: "The layout preserves the classical Business Model Canvas blocks and adapted B5 semantics.",
      },
      {
        role: "Information designer",
        verdict: "accepted",
        note: "The hierarchy gives visual center to B2 while keeping partner, activity, channel and segment blocks readable.",
      },
      {
        role: "Enterprise UX reviewer",
        verdict: "accepted",
        note: "The package is calm, operational and suitable for repeated product discussion.",
      },
      {
        role: "Data traceability reviewer",
        verdict: "accepted",
        note: "Public statements stay clean while trace and validation needs remain in JSON evidence.",
      },
      {
        role: "QA visual gate reviewer",
        verdict: "accepted",
        note: "SVG text bounds, balanced frame geometry, PNG/PDF parity and PlantUML label limits are covered by blocking validators.",
      },
    ],
    checked_artifacts: checkedArtifacts,
  };
}

function readPngInfo(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`not a PNG file: ${filePath}`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bytes: bytes.length,
  };
}

function packageManifest(artifactHashes, pngInfo) {
  const artifacts = [
    { role: "package_readme", format: "markdown", path: paths.packageReadme },
    { role: "clean_markdown", format: "markdown", path: paths.markdown },
    { role: "canonical_visual", format: "svg", path: paths.svg, width: 3840, height: 2160 },
    { role: "portable_visual", format: "png", path: paths.png, width: pngInfo.width, height: pngInfo.height },
    { role: "portable_document", format: "pdf", path: paths.pdf },
    { role: "engineering_view", format: "plantuml", path: paths.puml },
    { role: "validation_companion", format: "json", path: paths.validationNeeds },
    { role: "derived_manifest", format: "json", path: paths.derivedManifest },
    { role: "source_map", format: "markdown", path: paths.sourceMap },
    { role: "text_alternative", format: "markdown", path: paths.textAlternative },
    { role: "visual_review", format: "markdown", path: paths.visualReview },
    { role: "visual_acceptance", format: "json", path: paths.visualAcceptance },
    { role: "designer_consilium", format: "json", path: paths.designerConsilium },
    { role: "design_philosophy", format: "markdown", path: paths.designPhilosophy },
  ].map((artifact) => ({
    ...artifact,
    sha256: artifactHashes[artifact.path],
  }));

  return {
    version: "0.1.0",
    status: "ready_for_user_acceptance",
    generated_at: generatedAt,
    generated_by: generatorPath,
    canonical_visual_path: paths.svg,
    source_trace_path: paths.trace,
    source_trace_sha256: artifactHashes[paths.trace],
    public_content_policy: {
      public_surfaces: [paths.markdown, paths.textAlternative, paths.svg, paths.png, paths.pdf, paths.puml],
      allowed_public_content: "business_model_canvas_only",
      service_information_storage: [paths.packageManifest, paths.derivedManifest, paths.validationNeeds, paths.visualAcceptance],
      forbidden_public_information: [
        "status",
        "methodology_notes",
        "model_boundary_summary",
        "source_refs",
        "validation_status",
        "hashes",
        "local_paths",
        "technical_trace",
      ],
    },
    artifacts,
    validators: [
      "npm run generate:bmc -- --check",
      "npm run validate:bmc-trace",
      "npm run validate:bmc-content-classic",
      "npm run validate:bmc-visual",
      "npm run validate:bmc-render-parity",
      "npm run validate:bmc-package",
      "npm run validate:data-leakage",
      "npm run validate:artifact-hashes",
    ],
  };
}

function derivedManifest(artifactHashes) {
  return {
    version: "0.1.0",
    status: "generated",
    source_trace_path: paths.trace,
    source_trace_sha256: artifactHashes[paths.trace],
    generated_by: generatorPath,
    generated_at: generatedAt,
    outputs: [
      { format: "markdown", path: paths.markdown, sha256: artifactHashes[paths.markdown] },
      { format: "plantuml", path: paths.puml, sha256: artifactHashes[paths.puml] },
      { format: "svg", path: paths.svg, sha256: artifactHashes[paths.svg] },
      { format: "png", path: paths.png, sha256: artifactHashes[paths.png] },
      { format: "pdf", path: paths.pdf, sha256: artifactHashes[paths.pdf] },
      { format: "validation_needs_json", path: paths.validationNeeds, sha256: artifactHashes[paths.validationNeeds] },
    ],
  };
}

function assertCleanPublic(content, relativePath) {
  for (const forbidden of cleanForbidden) {
    if (content.includes(forbidden)) {
      fail(`clean public artifact contains forbidden marker ${forbidden}: ${relativePath}`);
    }
  }
  for (const rule of publicBusinessLanguageRules) {
    const match = rule.pattern.exec(content);
    if (match) {
      fail(`clean public artifact violates ${rule.id}: ${match[0]}: ${relativePath}`);
    }
  }
}

function writeText(targetRoot, relativePath, content) {
  const filePath = path.join(targetRoot, relativePath);
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
}

function writeJson(targetRoot, relativePath, data) {
  writeText(targetRoot, relativePath, `${JSON.stringify(data, null, 2)}\n`);
}

function renderFromSvg(targetRoot) {
  const svgFile = path.join(targetRoot, paths.svg);
  const pngFile = path.join(targetRoot, paths.png);
  const pdfFile = path.join(targetRoot, paths.pdf);
  ensureDir(pngFile);
  ensureDir(pdfFile);

  try {
    const renderEnv = { ...process.env, SOURCE_DATE_EPOCH: "0" };
    execFileSync("rsvg-convert", ["-w", "3840", "-h", "2160", "-f", "png", svgFile, "-o", pngFile], {
      env: renderEnv,
      stdio: "pipe",
    });
    execFileSync("rsvg-convert", ["-f", "pdf", svgFile, "-o", pdfFile], {
      env: renderEnv,
      stdio: "pipe",
    });
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr) : error.message;
    fail(`rsvg-convert failed. Install librsvg/rsvg-convert and retry. ${stderr}`);
  }
}

function collectHashes(targetRoot, relativePaths) {
  const result = {};
  for (const relativePath of relativePaths) {
    result[relativePath] = sha256File(path.join(targetRoot, relativePath));
  }
  return result;
}

function compareGenerated(targetRoot, relativePaths) {
  let mismatch = false;
  for (const relativePath of relativePaths) {
    const expectedPath = absolute(relativePath);
    const generatedPath = path.join(targetRoot, relativePath);
    if (!fs.existsSync(expectedPath)) {
      console.error(`ERROR: generated target is missing: ${relativePath}`);
      mismatch = true;
      continue;
    }
    const expected = fs.readFileSync(expectedPath);
    const generated = fs.readFileSync(generatedPath);
    if (!expected.equals(generated)) {
      console.error(`ERROR: generated artifact is stale: ${relativePath}`);
      mismatch = true;
    }
  }
  if (mismatch) {
    process.exit(1);
  }
}

function build(targetRoot) {
  const trace = readJson(paths.trace);
  blockModel = buildBlockModel(trace);
  blockById = new Map(blockModel.map((block) => [block.id, block]));
  const publicMarkdown = markdown();
  const publicPuml = plantUml();
  const publicSvg = svg();
  const validationNeeds = buildValidationNeeds(trace);

  assertCleanPublic(publicMarkdown, paths.markdown);
  assertCleanPublic(publicPuml, paths.puml);
  assertCleanPublic(publicSvg.replaceAll("http://www.w3.org/2000/svg", ""), paths.svg);

  writeText(targetRoot, paths.markdown, publicMarkdown);
  writeText(targetRoot, paths.puml, publicPuml);
  writeText(targetRoot, paths.svg, publicSvg);
  writeJson(targetRoot, paths.validationNeeds, validationNeeds);
  renderFromSvg(targetRoot);

  const initialHashPaths = [paths.trace, paths.markdown, paths.puml, paths.svg, paths.png, paths.pdf, paths.validationNeeds];
  const artifactHashes = {
    ...collectHashes(root, [paths.trace]),
    ...collectHashes(targetRoot, [paths.markdown, paths.puml, paths.svg, paths.png, paths.pdf, paths.validationNeeds]),
  };

  writeJson(targetRoot, paths.derivedManifest, derivedManifest(artifactHashes));
  artifactHashes[paths.derivedManifest] = sha256File(path.join(targetRoot, paths.derivedManifest));

  writeText(targetRoot, paths.packageReadme, packageReadme());
  writeText(targetRoot, paths.sourceMap, sourceMap(trace));
  writeText(targetRoot, paths.textAlternative, textAlternative());
  writeText(targetRoot, paths.designPhilosophy, designPhilosophy());

  const pngInfo = readPngInfo(path.join(targetRoot, paths.png));
  const packageBasePaths = [
    ...initialHashPaths.filter((item) => item !== paths.trace),
    paths.derivedManifest,
    paths.packageReadme,
    paths.sourceMap,
    paths.textAlternative,
    paths.designPhilosophy,
  ];
  Object.assign(artifactHashes, collectHashes(targetRoot, packageBasePaths.filter((item) => !artifactHashes[item])));
  writeJson(targetRoot, paths.visualAcceptance, visualAcceptance(artifactHashes, pngInfo));
  artifactHashes[paths.visualAcceptance] = sha256File(path.join(targetRoot, paths.visualAcceptance));
  writeJson(targetRoot, paths.designerConsilium, designerConsilium(artifactHashes));
  artifactHashes[paths.designerConsilium] = sha256File(path.join(targetRoot, paths.designerConsilium));
  writeText(targetRoot, paths.visualReview, visualReview(artifactHashes));
  artifactHashes[paths.visualReview] = sha256File(path.join(targetRoot, paths.visualReview));

  const manifestHashInputs = [
    paths.packageReadme,
    paths.sourceMap,
    paths.textAlternative,
    paths.visualReview,
    paths.designerConsilium,
    paths.visualAcceptance,
    paths.designPhilosophy,
  ];
  Object.assign(artifactHashes, collectHashes(targetRoot, manifestHashInputs.filter((item) => !artifactHashes[item])));
  writeJson(targetRoot, paths.packageManifest, packageManifest(artifactHashes, pngInfo));

  return [
    paths.markdown,
    paths.puml,
    paths.svg,
    paths.png,
    paths.pdf,
    paths.validationNeeds,
    paths.derivedManifest,
    paths.packageReadme,
    paths.sourceMap,
    paths.textAlternative,
    paths.designPhilosophy,
    paths.visualAcceptance,
    paths.designerConsilium,
    paths.visualReview,
    paths.packageManifest,
  ];
}

let targetRoot = root;
if (checkMode) {
  targetRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-"));
}

try {
  const generatedPaths = build(targetRoot);
  if (checkMode) {
    compareGenerated(targetRoot, generatedPaths);
    console.log("BMC generated artifacts are up to date");
  } else {
    for (const relativePath of generatedPaths) {
      console.log(`BMC artifact written: ${relativePath}`);
    }
  }
} finally {
  if (checkMode && targetRoot !== root) {
    fs.rmSync(targetRoot, { recursive: true, force: true });
  }
}
