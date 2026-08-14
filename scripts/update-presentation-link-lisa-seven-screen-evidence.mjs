import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REPORT_PATH = `${PACKAGE_PATH}/evidence/browser-report.json`;
const ACCEPTANCE_PATH = `${PACKAGE_PATH}/evidence/acceptance-report.json`;
const CONFIG_PATH = "tests/presentation-link-lisa-user-journey.playwright.config.mjs";
const SPEC_PATH = "tests/presentation-link-lisa-seven-screen-prototype.browser.spec.mjs";

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
  const testCount = countBrowserTests(root);
  return {
    version: "3.0.0",
    status: "passed",
    route_id: registry.route_id,
    active_state_ids: registry.active_state_ids,
    candidate_fingerprint: packageManifest.candidate_fingerprint,
    archive: packageManifest.archive,
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
    acceptance: {
      exact_ten_screen_order: true,
      runtime_only_from_demo_assets: true,
      internal_scroll_only_for_long_phone_screens_and_presentation_documents: true,
      system_top_and_bottom_remain_fixed: true,
      application_content_scrolls_between_system_regions: true,
      service_text_and_navigation_are_outside_phone: true,
      four_order_buttons_open_generating_state: true,
      email_is_separate_uncropped_screen: true,
      three_presentation_documents_follow_email: true,
      final_mag_screen_disables_forward_navigation: true,
      unpacked_archive_works_via_file_url: true,
      chromium_and_webkit_passed: true,
      phone_and_document_raster_upscaling_blocked_at_device_scale_factor_3: true,
      email_fills_viewer_at_high_device_scale_factor: true,
      physical_phone_body_ratio_78_1_by_160_8: true,
      protected_phone_raster_is_not_stretched: true,
    },
  };
}

function bytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function runBrowsers(root) {
  const cli = path.join(root, "node_modules/@playwright/test/cli.js");
  const result = spawnSync(process.execPath, [cli, "test", "--config", CONFIG_PATH], {
    cwd: root,
    env: { ...process.env },
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`браузерная проверка завершилась с кодом ${result.status ?? "неизвестно"}`);
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
    process.stdout.write("Отчёты браузерной проверки и приёмки десяти состояний актуальны.\n");
  } else {
    writeAtomic(target, expected);
    writeAtomic(acceptanceTarget, expectedAcceptance);
    process.stdout.write(`Отчёты проверки десяти состояний записаны: ${REPORT_PATH}, ${ACCEPTANCE_PATH}.\n`);
  }
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "отчёт не обновлён"}\n`);
  process.exitCode = 1;
}
