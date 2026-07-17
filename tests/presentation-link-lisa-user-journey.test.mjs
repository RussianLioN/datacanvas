import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import playwrightConfig from "./presentation-link-lisa-user-journey.playwright.config.mjs";
import {
  buildNormalizedModel,
  createFontEngine,
  generatePrototypePackage,
  generateHtmlPrototype,
  loadContracts,
  measureVariableText,
  parseStateSearch,
  resolvePresentationBinding,
  validateLayoutBoxes,
  validateContracts,
  validateGeneratedPackage,
  validateSvgSecurity,
  wrapMeasuredText,
} from "../scripts/lib/presentation-link-lisa-user-journey.mjs";
import * as journeyLibrary from "../scripts/lib/presentation-link-lisa-user-journey.mjs";

const root = process.cwd();
const packageRoot = "docs/product/analysis/presentation-link-lisa-user-journey";
const expectedStateIds = [
  "lisa-materials-ready",
  "lisa-materials-email-sent",
  "lisa-presentation-order-submitting",
  "lisa-presentation-order-failed",
  "lisa-presentation-generating",
  "lisa-presentation-ready-unread",
  "lisa-notifications-list-empty",
  "lisa-notifications-list-unread",
  "lisa-notification-detail-unread",
  "lisa-notifications-list-read",
  "lisa-notification-detail-read",
  "lisa-result-view-from-chat",
  "lisa-result-view-from-notification",
  "lisa-returned-to-chat",
  "lisa-presentation-email-submitting",
  "lisa-presentation-email-sent",
  "lisa-presentation-email-partial-failure",
  "lisa-presentation-email-failed",
  "lisa-result-not-ready",
  "lisa-link-invalid",
  "lisa-link-expired",
  "lisa-access-denied",
  "lisa-offline",
  "lisa-notification-failed-chat-available",
  "lisa-result-cancelled",
  "lisa-result-revoked",
];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  assert.ok(fs.existsSync(absolute(relativePath)), `missing required file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

test("canonical journey contract fixes the Lisa route and all public states", () => {
  const journey = readJson(`${packageRoot}/source/journey-contract.json`);
  const state = (stateId) => journey.states.find((candidate) => candidate.id === stateId);
  const action = (actionId) => journey.actions.find((candidate) => candidate.id === actionId);

  assert.equal(journey.status, "owner-approved-prototype");
  assert.equal(journey.initial_state_id, "lisa-materials-ready");
  assert.deepEqual(
    journey.route,
    {
      surface: "lisa",
      interaction_mode: "lisa_dialog",
      datacanvas_launch_mode: "other_agent",
      initiator: "user_action",
    },
  );
  assert.deepEqual(
    journey.states.map((state) => state.id),
    expectedStateIds,
  );
  assert.equal(new Set(journey.states.map((state) => state.id)).size, expectedStateIds.length);
  assert.match(journey.copy.generation_started, /20 минут/u);
  assert.equal(journey.notification.kind, "lisa_notification_center_item");
  assert.equal(journey.notification.push_supported, false);
  assert.equal(journey.notification.list_open_marks_read, false);
  assert.equal(journey.notification.result_open_marks_read, true);
  assert.equal(state("lisa-notifications-list-empty").result_ref, undefined);
  assert.equal(
    state("lisa-notification-failed-chat-available").result_ref,
    undefined,
  );
  assert.deepEqual(state("lisa-notifications-list-empty").action_ids, [
    "close-notifications-empty",
  ]);
  assert.equal(
    action("close-notifications-empty").target_state_id,
    "lisa-materials-ready",
  );
  assert.equal(journey.email_delivery.message_count, 1);
  assert.deepEqual(journey.email_delivery.required_attachments, ["pdf", "pptx"]);
  assert.equal(journey.email_delivery.success_requires_all_attachments, true);
  assert.equal(journey.email_delivery.retry_scope, "failed_attachment_only");
  assert.equal(journey.prototype_semantics.scope, "visual-validation-only");
  assert.ok(
    journey.prototype_semantics.fields.includes(
      "email_delivery.recipient_copy",
    ),
  );
  assert.ok(
    journey.open_product_decisions.includes(
      "Правила определения получателя и адреса электронной почты",
    ),
  );
  assert.ok(
    journey.open_product_decisions.includes(
      "Промышленная идемпотентность и ключ устранения дублей",
    ),
  );
  assert.ok(journey.invariants.includes("one-order-per-material-version"));
  assert.ok(journey.invariants.includes("one-ready-event-two-projections"));
  assert.ok(journey.invariants.includes("same-result-ref-for-chat-and-notification"));
  assert.deepEqual(
    state("lisa-materials-ready").content.sections.map((section) => section.title),
    [
      "Участники встречи",
      "Повестка встречи",
      "Сотрудничество",
      "Предодобренные предложения",
      "Договорённости с прошлой встречи",
      "Риски и инсайты о других банках",
      "С чего начать диалог",
    ],
  );
  assert.equal(state("lisa-materials-ready").content.data_classification, "synthetic");
  assert.equal(state("lisa-materials-ready").content.external_links_allowed, false);
  assert.equal(state("lisa-materials-ready").content.initial_scroll_anchor, "material-start");
  assert.equal(state("lisa-materials-ready").content.action_anchor, "material-actions");
  assert.deepEqual(state("lisa-presentation-generating").history_state_ids, [
    "lisa-materials-ready",
  ]);
  assert.deepEqual(state("lisa-presentation-ready-unread").history_state_ids, [
    "lisa-materials-ready",
    "lisa-presentation-generating",
  ]);
  assert.deepEqual(state("lisa-returned-to-chat").history_state_ids, [
    "lisa-materials-ready",
    "lisa-presentation-generating",
  ]);
  assert.deepEqual(state("lisa-presentation-ready-unread").action_ids, [
    "open-result-from-chat",
  ]);
  assert.equal(action("open-notifications"), undefined);
  assert.deepEqual(action("retry-order").prototype_sequence, [
    { state_id: "lisa-presentation-generating", at_ms: 600 },
    { state_id: "lisa-presentation-ready-unread", at_ms: 8000 },
  ]);
  assert.deepEqual(action("retry-failed-attachment").prototype_sequence, [
    { state_id: "lisa-presentation-email-sent", at_ms: 900 },
  ]);
  assert.deepEqual(action("retry-email").prototype_sequence, [
    { state_id: "lisa-presentation-email-sent", at_ms: 900 },
  ]);
  assert.deepEqual(
    journey.actions
      .filter((item) => item.id.startsWith("retry-"))
      .map((item) => item.id)
      .sort(),
    [
      "retry-email",
      "retry-failed-attachment",
      "retry-open-result",
      "retry-order",
    ],
  );
  assert.equal(action("retry-open-result").target_state_id, "lisa-result-view-from-chat");
  assert.equal(action("close-result").target_state_id, "lisa-returned-to-chat");
  assert.equal(
    state("lisa-result-view-from-notification").return_anchor,
    "presentation-ready-card",
  );
  assert.equal(new Set(journey.states.map((item) => item.display_name)).size, journey.states.length);
  for (const item of journey.states) {
    assert.match(item.display_name, /[А-Яа-яЁё]/u);
    assert.notEqual(item.display_name, item.id);
  }
  const normalized = buildNormalizedModel(loadContracts(root));
  assert.equal(normalized.status, journey.status);
  assert.deepEqual(
    normalized.states.map(({ id, display_name: displayName }) => ({
      id,
      display_name: displayName,
    })),
    journey.states.map(({ id, display_name: displayName }) => ({
      id,
      display_name: displayName,
    })),
  );
});

test("active SVG sources are rendered by the approved HTML and reference-only SVG is explicit", () => {
  const visual = readJson(`${packageRoot}/source/visual-components-contract.json`);
  const runtime = fs.readFileSync(
    absolute("scripts/lib/presentation-link-lisa-html-runtime.mjs"),
    "utf8",
  );
  assert.equal(visual.version, "1.3.0");
  assert.deepEqual(visual.capture_stability, {
    notification_card_boundary: "solid-border",
    compositor_dependent_inset_shadow_allowed: false,
  });
  assert.deepEqual(
    visual.components.map(({ id, usage }) => ({ id, usage })),
    [
      { id: "lisa-phone-shell", usage: "rendered-in-html" },
      { id: "lisa-notification-bell", usage: "rendered-in-html" },
      { id: "lisa-presentation-card", usage: "reference-only" },
    ],
  );
  assert.ok(
    runtime.includes("../source/components/lisa-phone-shell.svg"),
  );
  assert.ok(
    runtime.includes("../source/components/lisa-notification-bell.svg"),
  );
  assert.equal(
    runtime.includes("../source/components/lisa-presentation-card.svg"),
    false,
  );
  assert.match(
    runtime,
    /\.notification-card \{[\s\S]*?border-color: var\(--border\);[\s\S]*?box-shadow: none;/u,
  );
  assert.doesNotMatch(
    runtime,
    /\.notification-card \{[^}]*box-shadow: inset/u,
  );
  assert.ok(
    runtime.includes(
      '!captureMode && state.id === "lisa-notification-detail-read"',
    ),
  );
});

test("meeting material preserves the exact synthetic Lisa fixture as 33 typed units", () => {
  const journey = readJson(`${packageRoot}/source/journey-contract.json`);
  const material = journey.states.find((state) => state.id === "lisa-materials-ready").content;
  const fixture = readJson(`${packageRoot}/source/source-fixture-manifest.json`);

  assert.equal(journey.version, "1.2.0");
  assert.deepEqual(material.header, {
    title: "Подготовка к встрече",
    holding: "Холдинг ГК Достовалова",
    company: "ИП Достовалова",
    meta: "Регулярная встреча · материалы актуальны на 11 июля 2026",
  });
  assert.equal(material.data_classification, "synthetic");
  assert.equal(material.external_links_allowed, false);
  assert.equal(material.sections.length, 7);
  assert.equal(
    material.sections.reduce(
      (total, section) =>
        total +
        section.blocks.reduce(
          (sectionTotal, block) =>
            sectionTotal +
            (Array.isArray(block.items) ? block.items.length : 1),
          0,
        ),
      0,
    ),
    33,
  );

  const participants = material.sections.find((section) => section.id === "participants");
  assert.deepEqual(participants.blocks, [
    {
      id: "meeting-participants",
      type: "participants",
      items: [
        {
          id: "p1",
          name: "Достовалова Ирина Антоновна",
          role: "Бенефициар",
        },
        {
          id: "p2",
          name: "Савёлов Антон Игоревич",
          role: "Генеральный директор",
        },
      ],
    },
  ]);

  const agenda = material.sections.find((section) => section.id === "agenda");
  assert.deepEqual(
    agenda.blocks[0].items.map(({ id, title, tag, group }) => ({ id, title, tag, group })),
    [
      { id: "a1", title: "Эквайринг", tag: "insight", group: "mandatory" },
      { id: "a2", title: "Поставки из Индии", tag: "agreement", group: "mandatory" },
      {
        id: "a3",
        title: "Новые площади в Красноярске",
        tag: "news",
        group: "mandatory",
      },
      { id: "a4", title: "СберСпасибо", tag: "agreement", group: "optional" },
      { id: "a5", title: "BNPL", tag: "insight", group: "optional" },
      { id: "a6", title: "КСО", tag: "insight", group: "optional" },
    ],
  );

  const cooperation = material.sections.find((section) => section.id === "cooperation");
  assert.deepEqual(
    cooperation.blocks.find((block) => block.type === "metrics").items.map((item) => item.value),
    [
      "1 250 млн ₽",
      "115 млн ₽ — овернайт",
      "15 млн ₽ — эквайринг и инкассация",
      "14 млн ₽ — снижение за 3 мес.",
      "8 млн ₽ — СберЗдоровье, СберМаркетинг",
    ],
  );

  const offers = material.sections.find((section) => section.id === "preapproved-offers");
  assert.deepEqual(
    offers.blocks.find((block) => block.type === "offers").items.map((item) => ({
      title: item.title,
      amount: item.amount,
      maximum_term: item.maximum_term,
    })),
    [
      {
        title: "Банковская гарантия (таможенная)",
        amount: "19 млрд ₽",
        maximum_term: "14 мес.",
      },
      {
        title: "Краткосрочное финансирование",
        amount: "16 млрд ₽",
        maximum_term: "36 мес.",
      },
      {
        title: "Лизинг СБЛ",
        amount: "2 млрд ₽",
        maximum_term: "84 мес.",
      },
    ],
  );

  assert.deepEqual(fixture, {
    $schema: "schemas/source-fixture-manifest.schema.json",
    version: "1.0.0",
    source_file: "lisa-prototype_7.html",
    source_sha256: "d60267513a5d2081bcc5d9fb74305e8b7c4fa4edf82653423456537d809cd5ad",
    normalized_material_sha256:
      "7676d6df83ce1df90d390f0e80741a480e586bb18da8593cebbf458986c2c3da",
    data_classification: "synthetic",
    owner_permission: "owner-reconfirmed-synthetic-use-2026-07-17",
    trust: "untrusted-data-only",
    copied_executable_code: false,
    active_external_links: false,
    external_source_occurrences: 5,
    external_source_count: 4,
  });
});

test("presentation preview contract defines three traceable 16:9 slides without invented totals", () => {
  const preview = readJson(`${packageRoot}/source/presentation-preview-contract.json`);

  assert.equal(preview.version, "1.0.0");
  assert.equal(preview.status, "owner-approved-prototype");
  assert.equal(preview.audience, "internal-client-manager-and-leader");
  assert.equal(preview.aspect_ratio, "16:9");
  assert.equal(preview.slides.length, 3);
  assert.deepEqual(
    preview.slides.map((slide) => slide.title),
    [
      "Активы задают масштаб отношений, но остальные направления заметно уступают",
      "Главные возможности сосредоточены в гарантии и краткосрочном финансировании, а давление — в эквайринге",
      "Встреча должна завершиться следующими шагами по эквайрингу, поставкам из Индии и новым площадям",
    ],
  );
  assert.deepEqual(preview.slides[2].data_bindings, [
    "sections.agenda.blocks.agenda-items.items.a1",
    "sections.agenda.blocks.agenda-items.items.a2",
    "sections.agenda.blocks.agenda-items.items.a3",
  ]);
  assert.deepEqual(
    preview.slides[2].card_summaries.map((card) => card.binding),
    preview.slides[2].data_bindings,
  );
  assert.ok(preview.slides.every((slide) => slide.data_bindings.length > 0));
  assert.equal(JSON.stringify(preview).includes("37 млрд"), false);

  const journey = readJson(`${packageRoot}/source/journey-contract.json`);
  const material = journey.states.find((state) => state.id === "lisa-materials-ready").content;
  for (const slide of preview.slides) {
    for (const binding of slide.data_bindings) {
      assert.notEqual(
        resolvePresentationBinding(material, binding),
        undefined,
        `${slide.id}: unresolved ${binding}`,
      );
    }
  }
});

test("order timeline is absolute, lasts eight seconds and viewer can email from both entries", () => {
  const journey = readJson(`${packageRoot}/source/journey-contract.json`);
  const frames = readJson(`${packageRoot}/source/frame-contract.json`);
  const action = (actionId) => journey.actions.find((candidate) => candidate.id === actionId);
  const state = (stateId) => journey.states.find((candidate) => candidate.id === stateId);
  const frame = (stateId) => frames.frames.find((candidate) => candidate.state_id === stateId);

  assert.deepEqual(action("order-presentation").prototype_sequence, [
    { state_id: "lisa-presentation-generating", at_ms: 600 },
    { state_id: "lisa-presentation-ready-unread", at_ms: 8000 },
  ]);
  assert.deepEqual(action("retry-order").prototype_sequence, [
    { state_id: "lisa-presentation-generating", at_ms: 600 },
    { state_id: "lisa-presentation-ready-unread", at_ms: 8000 },
  ]);
  assert.deepEqual(journey.prototype_timeline, {
    start_time: "13:24",
    ready_time: "13:44",
    generation_started_at_ms: 600,
    clock_animation_ends_at_ms: 7600,
    ready_at_ms: 8000,
    direct_state_autoplay: false,
  });
  for (const stateId of [
    "lisa-result-view-from-chat",
    "lisa-result-view-from-notification",
  ]) {
    assert.deepEqual(state(stateId).action_ids, ["close-result", "email-presentation"]);
    assert.deepEqual(frame(stateId).action_ids, ["close-result", "email-presentation"]);
    assert.equal(frame(stateId).region_id, "viewer-surface");
  }
  assert.deepEqual(journey.email_delivery.entry_surfaces, [
    "chat-ready-card",
    "viewer-from-chat",
    "viewer-from-notification",
  ]);
});

test("visual and frame contracts make narrow screens a first-class layout", () => {
  const visual = readJson(`${packageRoot}/source/visual-components-contract.json`);
  const frames = readJson(`${packageRoot}/source/frame-contract.json`);

  assert.equal(visual.layout.phone_max_width_px, 375);
  assert.equal(visual.layout.phone_max_height_px, 812);
  assert.equal(visual.layout.action_two_column_min_content_width_px, 356);
  assert.equal(visual.layout.minimum_target_px, 44);
  assert.equal(visual.layout.minimum_action_gap_px, 8);
  assert.equal(visual.layout.whole_phone_transform_scale_allowed, false);
  assert.deepEqual(visual.layout.vertical_scroll_regions, [
    "chat",
    "notifications-list",
  ]);
  assert.deepEqual(visual.layout.horizontal_scroll_regions, []);
  assert.deepEqual(visual.accessibility.axe_tags, ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  assert.equal(visual.viewer.minimum_scale, 1);
  assert.equal(visual.viewer.maximum_scale, 3);
  assert.equal(visual.viewer.slide_count, 3);
  assert.equal(visual.motion.clock_overlay.pointer_events, "none");
  assert.equal(visual.motion.clock_overlay.reduced_motion_rotation, false);

  assert.equal(frames.frames.length, expectedStateIds.length);
  assert.deepEqual(
    frames.frames.map((frame) => frame.state_id),
    expectedStateIds,
  );
  const firstFrame = frames.frames.find((frame) => frame.state_id === "lisa-materials-ready");
  assert.deepEqual(firstFrame.action_ids, [
    "edit-materials",
    "email-materials",
    "order-presentation",
  ]);
  assert.ok(frames.allowed_overlaps.some((item) => item.id === "notification-dot-on-bell"));
  assert.deepEqual(
    frames.regions.map((region) => region.id),
    [
      "phone-shell",
      "header",
      "chat",
      "notifications-list",
      "composer",
      "time-lapse-overlay",
      "viewer-surface",
      "viewer-toolbar",
      "viewer-stage",
      "viewer-actions",
    ],
  );
});

test("prototype package contract is portable, deterministic and network-free", () => {
  const contract = readJson(`${packageRoot}/source/prototype-package-contract.json`);

  assert.equal(contract.version, "1.8.0");
  assert.equal(contract.portability.entrypoint, "demo/index.html");
  assert.equal(contract.portability.file_scheme_supported, true);
  assert.equal(contract.portability.local_server_required, false);
  assert.equal(contract.security.external_network_requests_allowed, false);
  assert.equal(contract.security.absolute_local_paths_allowed, false);
  assert.equal(contract.security.dynamic_html_injection_allowed, false);
  assert.equal(contract.reproducibility.byte_deterministic_text_outputs, true);
  assert.equal(
    contract.reproducibility.frame_source,
    "owner-approved-html-browser-capture",
  );
  assert.equal(
    contract.reproducibility.svg_frame_representation,
    "embedded-png-data-uri",
  );
  assert.deepEqual(contract.reproducibility.capture_stabilization, {
    wait_for_document_fonts: true,
    scroll_policy: "restore-marked-end-after-fonts",
    focus_policy: "capture-mode-suppress-then-blur-active-element",
    settle_animation_frames: 2,
    explicit_screenshot_style_parameter_used: false,
    playwright_internal_style_attempt_blocked_by_csp: true,
    browser_launch_args: [],
  });
  assert.equal(contract.reproducibility.capture_engine, "webkit");
  assert.deepEqual(contract.reproducibility.capture_transport, {
    mode: "playwright-route-fulfilled-local-files",
    origin: "http://lisa.invalid",
    external_network_requests_allowed: false,
    path_escape_blocked: true,
  });
  assert.deepEqual(contract.reproducibility.capture_normalization, {
    mode: "lossless-rsvg-reencode",
    dimensions_unchanged: true,
    embedded_capture_equals_derived_png: true,
  });
  assert.equal(
    contract.reproducibility.cross_platform_png_byte_identity_required,
    false,
  );
  assert.equal(contract.dependencies["@playwright/test"], "1.61.1");
  assert.equal(contract.dependencies["@axe-core/playwright"], "4.12.1");
  assert.equal(contract.dependencies["opentype.js"], "2.0.0");
  assert.equal(contract.outputs.exact_count, 58);
  assert.deepEqual(contract.outputs.per_state.templates, [
    "derived/screens/{state_id}.svg",
    "derived/screens/{state_id}.png",
  ]);
  assert.equal(contract.outputs.per_state.state_count, expectedStateIds.length);
  assert.ok(contract.outputs.exact.includes("derived/prototype-package-manifest.json"));
  assert.ok(contract.outputs.exact.includes("demo/index.html"));
  assert.equal(contract.outputs.extra_files_allowed, false);
  assert.ok(
    contract.source_assets.some(
      (asset) =>
        asset.path === "source/fonts/NotoSans[wdth,wght].ttf" &&
        asset.sha256 ===
          "bfb7bb691513f12e734dc346c03a03f784912432d7e3fa8e56efcf906fe86b3d",
    ),
  );
  for (const asset of contract.source_assets.filter(
    (candidate) => candidate.origin_repository === "DataCanvas",
  )) {
    assert.equal(asset.origin_commit, null);
    assert.equal(
      asset.origin_base_commit,
      "698f5951d2acaa120dbb8abb83cedb98ae4de601",
    );
  }
});

test("profile generator, validator and browser contract are registered as source files", () => {
  for (const relativePath of [
    "scripts/lib/presentation-link-lisa-user-journey.mjs",
    "scripts/lib/presentation-link-lisa-html-runtime.mjs",
    "scripts/capture-presentation-link-lisa-derived-frames.mjs",
    "scripts/generate-presentation-link-lisa-user-journey.mjs",
    "scripts/validate-presentation-link-lisa-user-journey.mjs",
    "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
    "scripts/validate-presentation-link-lisa-user-journey-evidence.mjs",
    "tests/presentation-link-lisa-user-journey-evidence.test.mjs",
    "tests/presentation-link-lisa-user-journey.browser.spec.mjs",
    "tests/presentation-link-lisa-user-journey.playwright.config.mjs",
  ]) {
    assert.ok(fs.existsSync(absolute(relativePath)), `missing required source: ${relativePath}`);
  }
  for (const relativePath of [
    "scripts/capture-presentation-link-lisa-derived-frames.mjs",
    "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
  ]) {
    assert.ok(
      fs
        .readFileSync(absolute(relativePath), "utf8")
        .includes("__DATACANVAS_LISA_CAPTURE__"),
      `${relativePath}: capture mode marker is missing`,
    );
  }
});

test("browser profile bounds each engine lifetime without hiding flaky results", () => {
  assert.equal(playwrightConfig.workers, 2);
  assert.equal(playwrightConfig.retries, 0);
  assert.equal(playwrightConfig.failOnFlakyTests, true);
  assert.equal(playwrightConfig.fullyParallel, true);
});

test("validator command line keeps local freshness strict and rejects unknown modes", () => {
  assert.deepEqual(
    journeyLibrary.parsePresentationLinkLisaValidationArguments([]),
    { savedOnly: false },
  );
  assert.deepEqual(
    journeyLibrary.parsePresentationLinkLisaValidationArguments(["--saved-only"]),
    { savedOnly: true },
  );
  assert.throws(
    () =>
      journeyLibrary.parsePresentationLinkLisaValidationArguments([
        "--unknown-mode",
      ]),
    /неизвестный аргумент/u,
  );
});

test("local release profile stays strict while CI runs cross-platform browser checks", () => {
  const packageJson = readJson("package.json");
  const localProfile =
    packageJson.scripts["validate:presentation-link-lisa-user-journey:profile"];
  assert.match(
    localProfile,
    /check:presentation-link-lisa-user-journey &&/u,
  );
  assert.match(
    localProfile,
    /check:presentation-link-lisa-user-journey:evidence/u,
  );
  assert.doesNotMatch(localProfile, /--saved-only/u);

  const workflow = fs.readFileSync(absolute(".github/workflows/docs-check.yml"), "utf8");
  const repositoryGate = workflow.indexOf("run: npm test");
  const browserInstall = workflow.indexOf(
    "run: npx playwright install --with-deps chromium webkit",
  );
  const lisaCiProfile = workflow.indexOf(
    "run: npm run validate:presentation-link-lisa-user-journey:ci",
  );
  const cleanTreeGate = workflow.indexOf("run: git diff --exit-code");
  assert.ok(repositoryGate >= 0, "CI must run the repository quality gate");
  assert.ok(browserInstall > repositoryGate, "browser install must follow npm test");
  assert.ok(lisaCiProfile > browserInstall, "Lisa CI profile must follow browser install");
  assert.ok(cleanTreeGate > lisaCiProfile, "generated-file gate must follow Lisa CI profile");
  assert.doesNotMatch(
    workflow,
    /run: npm run validate:presentation-link-lisa-user-journey:profile/u,
  );
});

test("package contract registers the source fixture, slide contract and HTML gate", () => {
  const contract = readJson(`${packageRoot}/source/prototype-package-contract.json`);

  assert.ok(contract.canonical_contracts.includes("source/source-fixture-manifest.json"));
  assert.ok(contract.canonical_contracts.includes("source/presentation-preview-contract.json"));
  assert.equal(
    contract.commands.validate_html,
    "npm run validate:presentation-link-lisa-user-journey:html",
  );
  assert.equal(
    contract.commands.validate_evidence,
    "npm run validate:presentation-link-lisa-user-journey:evidence",
  );
  assert.equal(
    contract.commands.check_evidence,
    "npm run check:presentation-link-lisa-user-journey:evidence",
  );
  assert.equal(
    contract.commands.validate_profile,
    "npm run validate:presentation-link-lisa-user-journey:profile",
  );
  assert.equal(
    contract.commands.validate_ci,
    "npm run validate:presentation-link-lisa-user-journey:ci",
  );
  const packageJson = readJson("package.json");
  assert.equal(
    packageJson.scripts["validate:presentation-link-lisa-user-journey:ci"],
    "npm run check:presentation-link-lisa-user-journey:html && " +
      "node --test tests/presentation-link-lisa-user-journey.test.mjs && " +
      "node scripts/validate-presentation-link-lisa-user-journey.mjs --saved-only && " +
      "npm run validate:presentation-link-lisa-user-journey:evidence && " +
      "npm run test:presentation-link-lisa-user-journey:browser",
  );
  assert.equal(contract.html_stage.atomic_update_required, true);
  assert.equal(contract.html_stage.owner_approval_required, true);
  assert.equal(contract.html_stage.derived_outputs_allowed, false);
  const webkitEvidence = contract.evidence_outputs.screenshots.find(
    (entry) => entry.browser === "webkit",
  );
  assert.equal(
    journeyLibrary.WEBKIT_EVIDENCE_STATE_IDS.length,
    webkitEvidence.state_count,
  );
  assert.deepEqual(journeyLibrary.WEBKIT_EVIDENCE_STATE_IDS, [
    "lisa-materials-ready",
    "lisa-presentation-generating",
    "lisa-presentation-ready-unread",
    "lisa-notifications-list-empty",
    "lisa-notifications-list-unread",
    "lisa-notification-detail-unread",
    "lisa-notification-detail-read",
    "lisa-result-view-from-notification",
    "lisa-returned-to-chat",
    "lisa-presentation-email-sent",
  ]);
});

test("failed HTML staging leaves the previous four-file prototype intact", (context) => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-atomic-"));
  const demoRoot = path.join(outputRoot, packageRoot, "demo");
  const fileNames = ["app.js", "data.js", "index.html", "styles.css"];
  try {
    fs.mkdirSync(demoRoot, { recursive: true });
    for (const name of fileNames) {
      fs.writeFileSync(path.join(demoRoot, name), `принятый комплект: ${name}\n`);
    }
    const before = new Map(
      fileNames.map((name) => [name, fs.readFileSync(path.join(demoRoot, name))]),
    );
    const originalWriteFileSync = fs.writeFileSync;
    let stagedWriteCount = 0;
    context.mock.method(fs, "writeFileSync", (...args) => {
      if (String(args[0]).includes(".demo-next-")) {
        stagedWriteCount += 1;
        if (stagedWriteCount === 2) throw new Error("проверочный сбой второй записи");
      }
      return originalWriteFileSync(...args);
    });

    assert.throws(
      () => generateHtmlPrototype({ sourceRoot: root, outputRoot }),
      /проверочный сбой второй записи/u,
    );
    for (const [name, bytes] of before) {
      assert.deepEqual(fs.readFileSync(path.join(demoRoot, name)), bytes);
    }
    assert.deepEqual(
      fs
        .readdirSync(path.join(outputRoot, packageRoot))
        .filter((name) => name.startsWith(".demo-") || name === ".html-generation.lock"),
      [],
    );
  } finally {
    context.mock.restoreAll();
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("a competing HTML generation cannot remove another process lock", () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-lock-"));
  const packageDirectory = path.join(outputRoot, packageRoot);
  const lockPath = path.join(packageDirectory, ".html-generation.lock");
  try {
    fs.mkdirSync(packageDirectory, { recursive: true });
    fs.writeFileSync(lockPath, "занято другим процессом\n");
    assert.throws(
      () => generateHtmlPrototype({ sourceRoot: root, outputRoot }),
      (error) => error && error.code === "EEXIST",
    );
    assert.equal(fs.readFileSync(lockPath, "utf8"), "занято другим процессом\n");
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("HTML staging neither follows old symlinks nor preserves unregistered extras", () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-symlink-"));
  const demoRoot = path.join(outputRoot, packageRoot, "demo");
  const externalFile = path.join(outputRoot, "external-control.txt");
  try {
    fs.mkdirSync(path.join(demoRoot, "stale"), { recursive: true });
    fs.writeFileSync(externalFile, "внешний файл не изменён\n");
    fs.symlinkSync(externalFile, path.join(demoRoot, "app.js"));
    fs.writeFileSync(path.join(demoRoot, "obsolete.js"), "устаревший файл\n");
    fs.writeFileSync(path.join(demoRoot, "stale", "old.png"), "не снимок\n");

    generateHtmlPrototype({ sourceRoot: root, outputRoot });

    assert.equal(fs.readFileSync(externalFile, "utf8"), "внешний файл не изменён\n");
    assert.equal(fs.lstatSync(path.join(demoRoot, "app.js")).isFile(), true);
    assert.equal(fs.lstatSync(path.join(demoRoot, "app.js")).isSymbolicLink(), false);
    assert.deepEqual(
      fs.readdirSync(demoRoot).sort((left, right) => left.localeCompare(right, "en")),
      ["app.js", "data.js", "index.html", "styles.css"],
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("HTML generation rejects local filesystem paths from untrusted content", () => {
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-local-path-"));
  try {
    const sourceDirectory = path.join(sourceRoot, packageRoot, "source");
    fs.mkdirSync(path.dirname(sourceDirectory), { recursive: true });
    fs.cpSync(absolute(`${packageRoot}/source`), sourceDirectory, { recursive: true });
    const journeyPath = path.join(sourceDirectory, "journey-contract.json");
    const journey = JSON.parse(fs.readFileSync(journeyPath, "utf8"));
    journey.states.find((state) => state.id === "lisa-materials-email-sent").body =
      "Проверочный закрытый путь file:///etc/passwd";
    fs.writeFileSync(journeyPath, `${JSON.stringify(journey, null, 2)}\n`);
    assert.throws(
      () => generateHtmlPrototype({ sourceRoot, outputRoot: sourceRoot }),
      /absolute local path/u,
    );
  } finally {
    fs.rmSync(sourceRoot, { recursive: true, force: true });
  }
});

test("full visual generation requires explicit owner approval", () => {
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-unapproved-"));
  try {
    const copiedPackageRoot = path.join(sourceRoot, packageRoot);
    fs.mkdirSync(copiedPackageRoot, { recursive: true });
    fs.cpSync(absolute(`${packageRoot}/source`), path.join(copiedPackageRoot, "source"), {
      recursive: true,
    });
    for (const relativePath of [
      "source/journey-contract.json",
      "source/presentation-preview-contract.json",
    ]) {
      const target = path.join(copiedPackageRoot, relativePath);
      const contract = JSON.parse(fs.readFileSync(target, "utf8"));
      contract.status = "owner-review-pending";
      fs.writeFileSync(target, `${JSON.stringify(contract, null, 2)}\n`);
    }

    assert.throws(
      () => generatePrototypePackage({ sourceRoot, outputRoot: sourceRoot }),
      /owner-approved-prototype/u,
    );
  } finally {
    fs.rmSync(sourceRoot, { recursive: true, force: true });
  }
});

test("approved full visual generation emits the exact registered package", () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-approved-"));
  try {
    const generated = generatePrototypePackage({ sourceRoot: root, outputRoot });
    assert.equal(generated.model.status, "owner-approved-prototype");
    assert.equal(generated.generatedPaths.length, 58);
    assert.equal(generated.manifest.inventory.generated_output_count, 58);
    for (const relativePath of generated.generatedPaths) {
      assert.ok(fs.existsSync(path.join(outputRoot, relativePath)), relativePath);
    }
    for (const stateId of [
      "lisa-materials-ready",
      "lisa-presentation-generating",
      "lisa-notifications-list-unread",
      "lisa-result-view-from-chat",
    ]) {
      const svg = fs.readFileSync(
        path.join(outputRoot, packageRoot, "derived/screens", `${stateId}.svg`),
        "utf8",
      );
      assert.match(svg, /data-render-source="owner-approved-html"/u);
      assert.match(svg, /data-capture-sha256="[a-f0-9]{64}"/u);
      assert.match(svg, /<image\b[^>]*href="data:image\/png;base64,/u);
      const encoded = svg.match(/href="data:image\/png;base64,([^"]+)"/u)?.[1];
      assert.ok(encoded, `${stateId}: embedded browser frame is missing`);
      const embeddedCapture = Buffer.from(encoded, "base64");
      assert.equal(embeddedCapture.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      assert.deepEqual(
        embeddedCapture,
        fs.readFileSync(
          path.join(outputRoot, packageRoot, "derived/screens", `${stateId}.png`),
        ),
      );
    }
    assert.match(
      generated.manifest.generation.frame_capture,
      /^Playwright WebKit /u,
    );
    assert.equal(generated.manifest.generation.capture_engine, "webkit");
    assert.deepEqual(generated.manifest.generation.capture_stabilization, {
      wait_for_document_fonts: true,
      scroll_policy: "restore-marked-end-after-fonts",
      focus_policy: "capture-mode-suppress-then-blur-active-element",
      settle_animation_frames: 2,
      explicit_screenshot_style_parameter_used: false,
      playwright_internal_style_attempt_blocked_by_csp: true,
      browser_launch_args: [],
    });
    assert.deepEqual(generated.manifest.generation.capture_transport, {
      mode: "playwright-route-fulfilled-local-files",
      origin: "http://lisa.invalid",
      external_network_requests_allowed: false,
      path_escape_blocked: true,
    });
    assert.deepEqual(generated.manifest.generation.capture_normalization, {
      mode: "lossless-rsvg-reencode",
      dimensions_unchanged: true,
      embedded_capture_equals_derived_png: true,
    });
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("generated package validation rejects a corrupt manifest, path escape and extra file", () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-corrupt-"));
  try {
    generatePrototypePackage({ sourceRoot: root, outputRoot });
    const manifestPath = path.join(
      outputRoot,
      packageRoot,
      "derived/prototype-package-manifest.json",
    );
    const originalManifest = fs.readFileSync(manifestPath);

    fs.writeFileSync(manifestPath, '{"version":');
    assert.ok(
      validateGeneratedPackage(outputRoot, root).some((issue) =>
        issue.includes("prototype package manifest is invalid"),
      ),
    );

    fs.writeFileSync(manifestPath, originalManifest);
    const escapedManifest = JSON.parse(originalManifest);
    escapedManifest.outputs[0].path = "../outside-package.txt";
    fs.writeFileSync(manifestPath, `${JSON.stringify(escapedManifest, null, 2)}\n`);
    assert.ok(
      validateGeneratedPackage(outputRoot, root).some((issue) =>
        issue.includes("manifest output path escapes package"),
      ),
    );

    fs.writeFileSync(manifestPath, originalManifest);
    fs.writeFileSync(
      path.join(outputRoot, packageRoot, "derived/screens/unregistered.png"),
      "лишний файл\n",
    );
    assert.ok(
      validateGeneratedPackage(outputRoot, root).some((issue) =>
        issue.includes("unregistered generated output"),
      ),
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("canonical contracts pass their schemas and cross-contract invariants", () => {
  assert.deepEqual(validateContracts(root, loadContracts(root)), []);
});

test("source asset hashes are verified even when source and output roots are the same", () => {
  const contracts = structuredClone(loadContracts(root));
  const adaptedAsset = contracts.package.source_assets.find(
    (asset) => asset.kind === "adapted-svg-component",
  );
  const copiedAsset = contracts.package.source_assets.find(
    (asset) => asset.path === "source/fonts/NotoSans[wdth,wght].ttf",
  );
  adaptedAsset.sha256 = "0".repeat(64);
  copiedAsset.origin_sha256 = "1".repeat(64);

  const issues = validateContracts(root, contracts);
  assert.ok(
    issues.some((issue) =>
      issue.includes(`source asset hash mismatch: ${adaptedAsset.path}`),
    ),
  );
  assert.ok(
    issues.some((issue) =>
      issue.includes(`source asset origin hash mismatch: ${copiedAsset.path}`),
    ),
  );
});

test("normalized font license preserves its pinned origin without trailing whitespace", () => {
  const contract = readJson(`${packageRoot}/source/prototype-package-contract.json`);
  const licenseAsset = contract.source_assets.find(
    (asset) => asset.path === "source/fonts/OFL.txt",
  );
  const licenseText = fs.readFileSync(
    absolute(`${packageRoot}/source/fonts/OFL.txt`),
    "utf8",
  );

  assert.equal(licenseAsset.kind, "adapted-license");
  assert.notEqual(licenseAsset.sha256, licenseAsset.origin_sha256);
  assert.doesNotMatch(licenseText, /[\t ]+$/mu);
});

test("browser capture stabilization restores direct-state scroll after fonts settle", async () => {
  let fontsReady = false;
  let blurred = false;
  let animationFrames = 0;
  const content = { scrollTop: 0, scrollHeight: 420 };
  const originalDocument = globalThis.document;
  const originalHTMLElement = globalThis.HTMLElement;
  const originalWindow = globalThis.window;
  class FakeHTMLElement {
    blur() {
      blurred = true;
    }
  }
  globalThis.HTMLElement = FakeHTMLElement;
  globalThis.document = {
    fonts: {
      ready: Promise.resolve().then(() => {
        fontsReady = true;
      }),
    },
    activeElement: new FakeHTMLElement(),
    querySelector(selector) {
      assert.equal(fontsReady, true);
      return selector ===
        '.phone-content[data-capture-scroll-anchor="end"]'
        ? content
        : null;
    },
  };
  globalThis.window = {
    requestAnimationFrame(callback) {
      animationFrames += 1;
      queueMicrotask(callback);
    },
  };
  const page = {
    evaluate(callback, policy) {
      return callback(policy);
    },
  };

  try {
    assert.equal(typeof journeyLibrary.stabilizeBrowserCapture, "function");
    await journeyLibrary.stabilizeBrowserCapture(page, {
      wait_for_document_fonts: true,
      scroll_policy: "restore-marked-end-after-fonts",
      focus_policy: "capture-mode-suppress-then-blur-active-element",
      settle_animation_frames: 2,
    });
    assert.equal(content.scrollTop, content.scrollHeight);
    assert.equal(blurred, true);
    assert.equal(animationFrames, 2);

    content.scrollTop = 17;
    globalThis.document.querySelector = () => null;
    await journeyLibrary.stabilizeBrowserCapture(page, {
      wait_for_document_fonts: true,
      scroll_policy: "restore-marked-end-after-fonts",
      focus_policy: "capture-mode-suppress-then-blur-active-element",
      settle_animation_frames: 2,
    });
    assert.equal(content.scrollTop, 17);
  } finally {
    globalThis.document = originalDocument;
    globalThis.HTMLElement = originalHTMLElement;
    globalThis.window = originalWindow;
  }
});

test("adapted source origin is fixed independently from the package manifest", () => {
  const contracts = structuredClone(loadContracts(root));
  const adaptedAsset = contracts.package.source_assets.find(
    (asset) => asset.kind === "adapted-svg-component",
  );
  adaptedAsset.origin_sha256 = "2".repeat(64);

  assert.ok(
    validateContracts(root, contracts).some((issue) =>
      issue.includes(`source asset pinned origin mismatch: ${adaptedAsset.path}`),
    ),
  );
});

test("typed material blocks reject an item shape from another block type", () => {
  const contracts = structuredClone(loadContracts(root));
  const participants = contracts.journey.states
    .find((state) => state.id === "lisa-materials-ready")
    .content.sections.find((section) => section.id === "participants")
    .blocks.find((block) => block.id === "meeting-participants");
  participants.items = [{ id: "p1", text: "Недопустимый элемент списка" }];
  assert.ok(
    validateContracts(root, contracts).some((issue) =>
      issue.includes("journey-contract.json"),
    ),
  );
});

test("fixture hash rejects a silent substitution inside the 33 source units", () => {
  const contracts = structuredClone(loadContracts(root));
  contracts.journey.states
    .find((state) => state.id === "lisa-materials-ready")
    .content.sections.find((section) => section.id === "dialog-starters")
    .blocks.find((block) => block.id === "company-news")
    .items[0].text = "Подменённый синтетический текст";
  assert.ok(
    validateContracts(root, contracts).some((issue) =>
      issue.includes("meeting material hash mismatch"),
    ),
  );
});

test("direct state links reject duplicates, executable input and unknown states", () => {
  const known = new Set(expectedStateIds);

  assert.deepEqual(parseStateSearch("", expectedStateIds[0], known), {
    ok: true,
    stateId: expectedStateIds[0],
    explicit: false,
  });
  assert.deepEqual(parseStateSearch("?state=lisa-offline", expectedStateIds[0], known), {
    ok: true,
    stateId: "lisa-offline",
    explicit: true,
  });
  assert.equal(
    parseStateSearch(
      "?state=lisa-materials-ready&state=lisa-offline",
      expectedStateIds[0],
      known,
    ).reason,
    "duplicate-state",
  );
  assert.equal(
    parseStateSearch("?state=%3Cscript%3E", expectedStateIds[0], known).reason,
    "malformed-state",
  );
  assert.equal(
    parseStateSearch("?state=lisa-unregistered", expectedStateIds[0], known).reason,
    "unknown-state",
  );
});

test("cross-contract checks reject a different result in chat and notification", () => {
  const contracts = structuredClone(loadContracts(root));
  const notification = contracts.journey.states.find(
    (state) => state.id === "lisa-notifications-list-unread",
  );
  notification.result_ref = "other-secure-copy";

  assert.ok(
    validateContracts(root, contracts).some((issue) =>
      issue.includes("chat and notification must reference the same result"),
    ),
  );
});

for (const stateId of [
  "lisa-notification-detail-unread",
  "lisa-notifications-list-read",
  "lisa-presentation-email-submitting",
  "lisa-presentation-email-sent",
  "lisa-presentation-email-partial-failure",
  "lisa-presentation-email-failed",
]) {
  test(`cross-contract checks reject a different result in ${stateId}`, () => {
    const contracts = structuredClone(loadContracts(root));
    const state = contracts.journey.states.find(
      (candidate) => candidate.id === stateId,
    );
    state.result_ref = "other-secure-copy";

    assert.ok(
      validateContracts(root, contracts).some((issue) =>
        issue.includes(
          `chat and notification must reference the same result: ${stateId}`,
        ),
      ),
    );
  });
}

test("cross-contract checks reject push semantics and an invalid notification target", () => {
  const contracts = structuredClone(loadContracts(root));
  contracts.journey.notification.push_supported = true;
  const action = contracts.journey.actions.find(
    (candidate) => candidate.id === "open-result-from-notification",
  );
  action.target_state_id = "lisa-result-view-from-chat";

  const issues = validateContracts(root, contracts);
  assert.ok(issues.some((issue) => issue.includes("push notifications are outside this prototype")));
  assert.ok(
    issues.some((issue) => issue.includes("notification result action must open notification viewer")),
  );
});

test("cross-contract checks reject a result reference when notification delivery failed", () => {
  const contracts = structuredClone(loadContracts(root));
  const state = contracts.journey.states.find(
    (candidate) => candidate.id === "lisa-notification-failed-chat-available",
  );
  state.result_ref = contracts.journey.result_ref;

  assert.ok(
    validateContracts(root, contracts).some((issue) =>
      issue.includes("failed notification delivery cannot create a notification result reference"),
    ),
  );
});

test("lossless PNG proof rejects a pixel mismatch", () => {
  const first = fs.readFileSync(
    absolute(
      `${packageRoot}/derived/screens/lisa-presentation-ready-unread.png`,
    ),
  );
  const samePixels = Buffer.from(first);
  const different = fs.readFileSync(
    absolute(
      `${packageRoot}/derived/screens/lisa-presentation-generating.png`,
    ),
  );

  assert.equal(
    typeof journeyLibrary.assertLosslessPngPixels,
    "function",
    "pixel equality proof must be part of the generation contract",
  );
  assert.doesNotThrow(() =>
    journeyLibrary.assertLosslessPngPixels(
      first,
      samePixels,
      "same-pixel-frame",
    ),
  );
  assert.throws(
    () =>
      journeyLibrary.assertLosslessPngPixels(
        first,
        different,
        "different-pixel-frame",
      ),
    /Нормализация изменила пиксели кадра different-pixel-frame/u,
  );
});

test("cross-contract checks reject unknown and self-referencing chat history", () => {
  const contracts = structuredClone(loadContracts(root));
  const state = contracts.journey.states.find(
    (candidate) => candidate.id === "lisa-presentation-generating",
  );
  state.history_state_ids = ["lisa-materials-ready", "lisa-unknown", state.id];

  const issues = validateContracts(root, contracts);
  assert.ok(issues.some((issue) => issue.includes("unknown history state lisa-unknown")));
  assert.ok(issues.some((issue) => issue.includes("cannot include itself in chat history")));
});

test("SVG component boundary allows simple geometry and blocks active or remote content", () => {
  const limits = {
    component_max_bytes: 4096,
    max_nodes: 20,
    single_path_data_max_chars: 100,
    total_path_data_max_chars: 200,
  };
  const safe =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Колокольчик</title><path d="M6 9h12"/></svg>';
  assert.deepEqual(validateSvgSecurity(safe, limits), []);
  const safeEmbeddedPng =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" data-render-source="owner-approved-html" data-capture-sha256="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"><image x="0" y="0" width="1" height="1" href="data:image/png;base64,iVBORw0KGgo="/></svg>';
  assert.deepEqual(validateSvgSecurity(safeEmbeddedPng, limits), []);

  for (const unsafe of [
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.test/x.png"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:text/html;base64,PHNjcmlwdD4="/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"></svg>',
    '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"/>',
  ]) {
    assert.notDeepEqual(validateSvgSecurity(unsafe, limits), [], unsafe);
  }
});

test("vendored variable font is parsed from bytes and applies both registered axes", () => {
  const fontPath = absolute(`${packageRoot}/source/fonts/NotoSans[wdth,wght].ttf`);
  const regular = measureVariableText(fontPath, "Заказать презентацию", 16, {
    wght: 400,
    wdth: 100,
  });
  const bold = measureVariableText(fontPath, "Заказать презентацию", 16, {
    wght: 700,
    wdth: 100,
  });
  const narrow = measureVariableText(fontPath, "Заказать презентацию", 16, {
    wght: 400,
    wdth: 75,
  });
  const regularAgain = measureVariableText(fontPath, "Заказать презентацию", 16, {
    wght: 400,
    wdth: 100,
  });

  assert.ok(Math.abs(regular - 176.08) < 0.5, regular);
  assert.ok(Math.abs(bold - 188.288) < 0.5, bold);
  assert.ok(Math.abs(narrow - 142.96) < 0.5, narrow);
  assert.ok(Math.abs(regular - regularAgain) < 0.001);
});

test("measured wrapping fails before a word or text flow can overflow", () => {
  const fontPath = absolute(`${packageRoot}/source/fonts/NotoSans[wdth,wght].ttf`);
  const font = createFontEngine(
    fontPath,
    "bfb7bb691513f12e734dc346c03a03f784912432d7e3fa8e56efcf906fe86b3d",
  );
  assert.throws(
    () =>
      wrapMeasuredText(font, "НеразрывноеСверхдлинноеСлово", {
        maxWidth: 20,
        maxLines: 2,
        fontSize: 16,
      }),
    /Неразрывное слово/u,
  );
  assert.throws(
    () =>
      wrapMeasuredText(font, "один два три четыре пять шесть", {
        maxWidth: 45,
        maxLines: 2,
        fontSize: 16,
      }),
    /число строк/u,
  );
});

test("geometry ledger rejects overflow, intersections and undersized controls", () => {
  const issues = validateLayoutBoxes(
    [
      { id: "canvas-child", x: 380, y: 20, width: 30, height: 30 },
      {
        id: "first",
        x: 20,
        y: 20,
        width: 44,
        height: 44,
        interactive: true,
        collisionGroup: "actions",
      },
      {
        id: "second",
        x: 40,
        y: 40,
        width: 20,
        height: 20,
        interactive: true,
        collisionGroup: "actions",
      },
    ],
    { canvasWidth: 390, canvasHeight: 844, minimumTarget: 44 },
  );
  assert.ok(issues.some((issue) => issue.includes("выходит за холст")));
  assert.ok(issues.some((issue) => issue.includes("пересекается")));
  assert.ok(issues.some((issue) => issue.includes("область нажатия меньше")));
});

test("geometry ledger treats lines of one text flow as one layout object", () => {
  const shared = {
    x: 20,
    width: 180,
    height: 18,
    collisionGroup: "message-content",
    flowId: "message-title",
    requireGap: true,
  };
  assert.deepEqual(
    validateLayoutBoxes([
      { ...shared, id: "message-title-1", y: 20 },
      { ...shared, id: "message-title-2", y: 36 },
    ]),
    [],
  );

  const differentFlows = validateLayoutBoxes([
    { ...shared, id: "message-title-1", y: 20 },
    {
      ...shared,
      id: "message-body-1",
      y: 36,
      flowId: "message-body",
    },
  ]);
  assert.ok(differentFlows.some((issue) => issue.includes("пересекается")));
});
