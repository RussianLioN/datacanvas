import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { webkit } from "@playwright/test";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REPORT_PATH = `${PACKAGE_PATH}/evidence/browser-report.json`;
const ACCEPTANCE_PATH = `${PACKAGE_PATH}/evidence/acceptance-report.json`;
const VISUAL_MANIFEST_PATH = `${PACKAGE_PATH}/evidence/visual-screenshot-manifest.json`;
const SCREENSHOTS_PATH = `${PACKAGE_PATH}/evidence/screenshots`;
const CONFIG_PATH = "tests/presentation-link-lisa-user-journey.playwright.config.mjs";
const SPEC_PATH = "tests/presentation-link-lisa-seven-screen-prototype.browser.spec.mjs";
const VISUAL_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "desktop-1280x720", width: 1280, height: 720 }),
  Object.freeze({ id: "mobile-390x844", width: 390, height: 844 }),
  Object.freeze({ id: "stress-320x568", width: 320, height: 568 }),
]);

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function countBrowserTests(root) {
  const source = fs.readFileSync(path.join(root, SPEC_PATH), "utf8");
  return [...source.matchAll(/^test\("/gmu)].length;
}

function reportFor(root) {
  const registry = readJson(root, `${PACKAGE_PATH}/source/active-contracts.json`);
  const packageManifest = readJson(root, `${PACKAGE_PATH}/derived/prototype-package-manifest.json`);
  const routeStateIds = packageManifest.state_ids;
  if (!Array.isArray(routeStateIds) || routeStateIds.length === 0) {
    throw new Error("манифест прототипа не содержит state_ids опубликованного маршрута");
  }
  const testCount = countBrowserTests(root);
  return {
    version: "3.0.0",
    status: "passed",
    route_id: registry.route_id,
    active_state_ids: routeStateIds,
    candidate_fingerprint: packageManifest.candidate_fingerprint,
    archive: packageManifest.archive,
    visual_screenshot_manifest: "evidence/visual-screenshot-manifest.json",
    execution: {
      command: "npm run test:presentation-link-lisa-user-journey:browser",
      configuration: CONFIG_PATH,
      specification: SPEC_PATH,
      browsers: [
        { id: "chromium", status: "passed", test_count: testCount },
        { id: "webkit", status: "passed", test_count: testCount },
      ],
      opening_mode: "file://",
      extracted_archive_checked: true,
      network_requests_allowed: false,
      device_scale_factor_3_checked: true,
      email_fills_viewer_at_device_scale_factor_3: true,
      wheel_and_drag_checked: true,
      presentation_document_scroll_checked: true,
      presentation_documents_are_local_png: true,
      phone_and_document_raster_upscaling_blocked_at_device_scale_factor_3: true,
      three_raster_layers_per_phone_checked: true,
      fixed_system_top_and_bottom_checked: true,
      scroll_isolated_to_middle_phone_region: true,
      service_controls_in_left_panel_checked: true,
      iphone_12_pro_max_body_ratio_checked: true,
      protected_source_aspect_ratio_preserved: true,
      all_active_states_rendered_as_webkit_png: true,
    },
  };
}

function acceptanceFor(browserReport) {
  return {
    version: "3.0.0",
    status: "passed",
    route_id: browserReport.route_id,
    active_state_ids: browserReport.active_state_ids,
    candidate_fingerprint: browserReport.candidate_fingerprint,
    browser_report: "evidence/browser-report.json",
    visual_screenshot_manifest: "evidence/visual-screenshot-manifest.json",
    acceptance: {
      exact_success_path_then_status_order: true,
      runtime_only_from_demo_assets: true,
      internal_scroll_only_for_long_phone_screens_and_presentation_documents: true,
      system_top_and_bottom_remain_fixed: true,
      application_content_scrolls_between_system_regions: true,
      service_text_and_navigation_are_outside_phone: true,
      three_order_buttons_open_generating_state: true,
      email_is_separate_uncropped_screen: true,
      three_presentation_documents_follow_email: true,
      final_status_screen_disables_forward_navigation: true,
      unpacked_archive_works_via_file_url: true,
      chromium_and_webkit_passed: true,
      phone_and_document_raster_upscaling_blocked_at_device_scale_factor_3: true,
      email_fills_viewer_at_high_device_scale_factor: true,
      physical_phone_body_ratio_78_1_by_160_8: true,
      protected_phone_raster_is_not_stretched: true,
      all_active_states_have_current_visual_evidence: true,
    },
  };
}

function bytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256File(target) {
  const result = spawnSync("shasum", ["-a", "256", target], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`не удалось вычислить SHA-256 снимка: ${target}`);
  return result.stdout.trim().split(/\s+/u)[0];
}

function relativePackagePath(relativePath) {
  return `${PACKAGE_PATH}/${relativePath}`.split(path.sep).join("/");
}

function sameFingerprint(left, right) {
  return left?.algorithm === "sha256" && right?.algorithm === "sha256" && left.sha256 === right.sha256;
}

function visualManifestFor(root, report, records) {
  return {
    version: "1.0.0",
    status: "passed",
    renderer: "playwright-webkit",
    route_id: report.route_id,
    candidate_fingerprint: report.candidate_fingerprint,
    active_state_ids: report.active_state_ids,
    viewports: VISUAL_VIEWPORTS,
    records,
  };
}

async function captureVisualEvidence(root, report) {
  const evidenceRoot = path.join(root, PACKAGE_PATH, "evidence");
  const destination = path.join(root, SCREENSHOTS_PATH);
  const staging = fs.mkdtempSync(path.join(evidenceRoot, ".screenshots-candidate-"));
  const browser = await webkit.launch();
  const records = [];
  try {
    const page = await browser.newPage();
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));
    for (const viewport of VISUAL_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const stateId of report.active_state_ids) {
        const url = pathToFileURL(path.join(root, PACKAGE_PATH, "demo/index.html"));
        url.searchParams.set("state", stateId);
        await page.goto(url.href, { waitUntil: "load" });
        await page.evaluate(async () => { await document.fonts.ready; });
        const unexpectedRequest = requests.find((item) => !item.startsWith("file://"));
        if (unexpectedRequest) throw new Error(`визуальный снимок использует недопустимый запрос: ${unexpectedRequest}`);
        const relativePath = path.posix.join("webkit", viewport.id, `${stateId}.png`);
        const target = path.join(staging, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        await page.screenshot({ path: target, animations: "disabled" });
        records.push({
          state_id: stateId,
          viewport_id: viewport.id,
          path: relativePackagePath(path.posix.join("evidence", "screenshots", relativePath)),
          sha256: sha256File(target),
        });
      }
    }
  } finally {
    await browser.close();
  }
  const expectedCount = report.active_state_ids.length * VISUAL_VIEWPORTS.length;
  if (records.length !== expectedCount) throw new Error(`снято ${records.length} кадров вместо ${expectedCount}`);
  fs.rmSync(destination, { recursive: true, force: true, maxRetries: 2 });
  fs.renameSync(staging, destination);
  return records;
}

function checkVisualEvidence(root, report) {
  const target = path.join(root, VISUAL_MANIFEST_PATH);
  if (!fs.existsSync(target)) throw new Error("отсутствует манифест актуальных визуальных снимков");
  const manifest = readJson(root, VISUAL_MANIFEST_PATH);
  const expectedCount = report.active_state_ids.length * VISUAL_VIEWPORTS.length;
  if (
    manifest.status !== "passed" ||
    manifest.renderer !== "playwright-webkit" ||
    !sameFingerprint(manifest.candidate_fingerprint, report.candidate_fingerprint) ||
    JSON.stringify(manifest.active_state_ids) !== JSON.stringify(report.active_state_ids) ||
    JSON.stringify(manifest.viewports) !== JSON.stringify(VISUAL_VIEWPORTS) ||
    !Array.isArray(manifest.records) ||
    manifest.records.length !== expectedCount
  ) {
    throw new Error("манифест визуальных снимков не соответствует опубликованному прототипу");
  }
  const expectedKeys = new Set();
  for (const viewport of VISUAL_VIEWPORTS) {
    for (const stateId of report.active_state_ids) expectedKeys.add(`${viewport.id}/${stateId}`);
  }
  const actualKeys = new Set();
  for (const record of manifest.records) {
    const key = `${record.viewport_id}/${record.state_id}`;
    actualKeys.add(key);
    const expectedPath = `${PACKAGE_PATH}/evidence/screenshots/webkit/${record.viewport_id}/${record.state_id}.png`;
    if (record.path !== expectedPath) throw new Error(`${key}: неверный путь визуального снимка`);
    const targetPng = path.join(root, record.path);
    if (!fs.existsSync(targetPng) || sha256File(targetPng) !== record.sha256) {
      throw new Error(`${key}: визуальный снимок отсутствует или устарел`);
    }
  }
  if (actualKeys.size !== expectedKeys.size || [...expectedKeys].some((key) => !actualKeys.has(key))) {
    throw new Error("набор визуальных снимков неполный или содержит повторения");
  }
}

function runBrowsers(root) {
  const cli = path.join(root, "node_modules/@playwright/test/cli.js");
  const runnerTemp = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-playwright-evidence-"));
  try {
    const result = spawnSync(process.execPath, [cli, "test", "--config", CONFIG_PATH], {
      cwd: root,
      env: { ...process.env, RUNNER_TEMP: runnerTemp },
      stdio: "inherit",
    });
    if (result.status !== 0) throw new Error(`браузерная проверка завершилась с кодом ${result.status ?? "неизвестно"}`);
  } finally {
    fs.rmSync(runnerTemp, { recursive: true, force: true, maxRetries: 2 });
  }
}

function writeAtomic(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.candidate-${process.pid}`;
  fs.writeFileSync(temporary, content, { flag: "wx", mode: 0o644 });
  fs.renameSync(temporary, target);
}

function parseArguments(args) {
  if (args.length === 0) return { check: false };
  if (args.length === 1 && args[0] === "--check") return { check: true };
  throw new Error("использование: node scripts/update-presentation-link-lisa-seven-screen-evidence.mjs [--check]");
}

try {
  const root = process.cwd();
  const mode = parseArguments(process.argv.slice(2));
  runBrowsers(root);
  const report = reportFor(root);
  const expected = bytes(report);
  const expectedAcceptance = bytes(acceptanceFor(report));
  const target = path.join(root, REPORT_PATH);
  const acceptanceTarget = path.join(root, ACCEPTANCE_PATH);
  if (mode.check) {
    if (
      !fs.existsSync(target) ||
      !fs.readFileSync(target).equals(expected) ||
      !fs.existsSync(acceptanceTarget) ||
      !fs.readFileSync(acceptanceTarget).equals(expectedAcceptance)
    ) {
      throw new Error("отчёты браузерной проверки и приёмки отсутствуют или устарели");
    }
    checkVisualEvidence(root, report);
    process.stdout.write("Отчёты браузерной проверки и приёмки тринадцати состояний актуальны.\n");
  } else {
    const visualRecords = await captureVisualEvidence(root, report);
    writeAtomic(target, expected);
    writeAtomic(acceptanceTarget, expectedAcceptance);
    writeAtomic(path.join(root, VISUAL_MANIFEST_PATH), bytes(visualManifestFor(root, report, visualRecords)));
    process.stdout.write(`Отчёты проверки тринадцати состояний записаны: ${REPORT_PATH}, ${ACCEPTANCE_PATH}.\n`);
  }
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "отчёт не обновлён"}\n`);
  process.exitCode = 1;
}
