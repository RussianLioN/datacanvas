import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  PACKAGE_PATH,
  WEBKIT_EVIDENCE_STATE_IDS,
  loadContracts,
  sha256File,
  stableStringify,
} from "../scripts/lib/presentation-link-lisa-user-journey.mjs";
import {
  EVIDENCE_VIEWPORTS,
  classifyExpectedToolingConsoleMessage,
  expectedEvidencePaths,
  publishEvidenceAtomically,
  validateEvidencePackage,
} from "../scripts/validate-presentation-link-lisa-user-journey-evidence.mjs";
import {
  buildAcceptanceReport,
  installNetworkGuards,
  isExternalNetworkUrl,
  sanitizeDiagnostic,
} from "../scripts/update-presentation-link-lisa-user-journey-evidence.mjs";
import * as evidenceUpdater from "../scripts/update-presentation-link-lisa-user-journey-evidence.mjs";

const root = process.cwd();
const packageRoot = path.join(root, PACKAGE_PATH);
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function writeJson(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, stableStringify(value));
}

function buildSyntheticEvidence() {
  const contracts = loadContracts(root);
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "datacanvas-lisa-evidence-test-"),
  );
  const evidenceRoot = path.join(temporaryRoot, "evidence");
  const screenshots = [];
  const browserSelections = [
    {
      browser: "chromium",
      browserVersion: "test-chromium-1",
      states: contracts.journey.states,
    },
    {
      browser: "webkit",
      browserVersion: "test-webkit-1",
      states: contracts.journey.states.filter((state) =>
        WEBKIT_EVIDENCE_STATE_IDS.includes(state.id),
      ),
    },
  ];

  for (const selection of browserSelections) {
    for (const viewport of EVIDENCE_VIEWPORTS) {
      for (const state of selection.states) {
        const relativePath =
          `evidence/screenshots/${selection.browser}/${viewport.id}/${state.id}.png`;
        const screenshotPath = path.join(
          evidenceRoot,
          relativePath.slice("evidence/".length),
        );
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        fs.writeFileSync(screenshotPath, onePixelPng);
        screenshots.push({
          browser: selection.browser,
          browser_version: selection.browserVersion,
          viewport: viewport.id,
          viewport_dimensions: {
            width: viewport.width,
            height: viewport.height,
          },
          state_id: state.id,
          path: relativePath,
          bytes: onePixelPng.length,
          sha256: sha256Bytes(onePixelPng),
          png_dimensions: { width: 1, height: 1 },
          checks: {
            geometry: {
              passed: true,
              document_scroll_width: viewport.width,
              viewport_width: viewport.width,
              phone_inside_viewport: true,
            },
            overflow: {
              passed: true,
              text_issue_count: 0,
            },
            actions: {
              passed: true,
              action_count: 2,
              issue_count: 0,
            },
            accessibility: {
              passed: true,
              axe_violation_count: 0,
              axe_violations: [],
            },
            resources: {
              passed: true,
              issue_count: 0,
              issues: [],
            },
            tooling_console_messages: [],
            console_errors: [],
            page_errors: [],
            network_attempts: [],
          },
        });
      }
    }
  }

  const browserReport = {
    version: "2.1.0",
    status: "generated",
    deterministic_epoch: "2026-07-16T00:00:00Z",
    playwright_version: "1.61.1",
    browser_versions: {
      chromium: "test-chromium-1",
      webkit: "test-webkit-1",
    },
    capture_stabilization:
      contracts.package.reproducibility.capture_stabilization,
    viewports: EVIDENCE_VIEWPORTS,
    screenshot_count: screenshots.length,
    screenshots,
    totals: {
      chromium_screenshots: 78,
      webkit_screenshots: 30,
      tooling_console_messages: 0,
      console_errors: 0,
      page_errors: 0,
      network_attempts: 0,
      geometry_failures: 0,
      overflow_failures: 0,
      action_failures: 0,
      axe_violations: 0,
    },
  };
  writeJson(path.join(evidenceRoot, "browser-report.json"), browserReport);
  const acceptanceReport = buildAcceptanceReport({
    root,
    evidenceRoot,
    playwrightVersion: "1.61.1",
  });
  writeJson(path.join(evidenceRoot, "acceptance-report.json"), acceptanceReport);
  return { temporaryRoot, evidenceRoot };
}

test("evidence contract expands to exactly 110 deterministic paths", () => {
  const paths = expectedEvidencePaths(root);
  assert.equal(paths.length, 110);
  assert.equal(new Set(paths).size, 110);
  assert.equal(
    paths.filter((item) => item.startsWith("evidence/screenshots/chromium/")).length,
    78,
  );
  assert.equal(
    paths.filter((item) => item.startsWith("evidence/screenshots/webkit/")).length,
    30,
  );
  assert.deepEqual(
    paths.slice(0, 2),
    ["evidence/acceptance-report.json", "evidence/browser-report.json"],
  );
});

test("evidence updater classifies external transport and removes local paths", () => {
  for (const url of [
    "http://example.test/a",
    "https://example.test/a",
    "ws://example.test/socket",
    "wss://example.test/socket",
  ]) {
    assert.equal(isExternalNetworkUrl(url), true, url);
  }
  for (const url of [
    "file:///tmp/demo/index.html",
    "data:text/plain,ok",
    "blob:null/id",
    "about:blank",
  ]) {
    assert.equal(isExternalNetworkUrl(url), false, url);
  }
  const localPath = ["", "Users", "test", "private.js"].join("/");
  const sanitized = sanitizeDiagnostic(
    `Ошибка file://${localPath} и ${localPath}`,
  );
  assert.equal(sanitized.includes(localPath), false);
  assert.match(sanitized, /\[локальный-ресурс\]/u);
});

test("evidence updater rejects an invalid canonical contract before capture", () => {
  const contracts = structuredClone(loadContracts(root));
  contracts.package.version = "0.0.0";
  assert.equal(typeof evidenceUpdater.assertEvidenceContracts, "function");
  assert.throws(
    () => evidenceUpdater.assertEvidenceContracts(root, contracts),
    /канонические договоры.*не прошли проверку/u,
  );
});

test("network guard aborts HTTP and closes WebSocket before publication", async () => {
  const handlers = {};
  const page = {
    on(eventName, handler) {
      handlers[eventName] = handler;
    },
    async route(pattern, handler) {
      handlers.routePattern = pattern;
      handlers.route = handler;
    },
    async routeWebSocket(pattern, handler) {
      handlers.webSocketPattern = pattern;
      handlers.webSocket = handler;
    },
  };
  const attemptedNetwork = new Set();
  await installNetworkGuards(page, attemptedNetwork);
  let abortedWith = null;
  await handlers.route({
    request() {
      return { url: () => "https://example.test/data" };
    },
    async abort(reason) {
      abortedWith = reason;
    },
  });
  let closedWith = null;
  handlers.webSocket({
    url: () => "wss://example.test/events",
    close(details) {
      closedWith = details;
    },
  });
  assert.equal(abortedWith, "blockedbyclient");
  assert.equal(closedWith.code, 1008);
  assert.deepEqual(
    [...attemptedNetwork].sort(),
    ["https://example.test/data", "wss://example.test/events"],
  );
});

test("tooling console classifier is exact and does not hide product CSP errors", () => {
  assert.equal(
    classifyExpectedToolingConsoleMessage(
      "Refused to connect to file:///tmp/demo/styles.css because it does not appear in the connect-src directive of the Content Security Policy.",
    ),
    "axe-stylesheet-connect-src",
  );
  assert.equal(
    classifyExpectedToolingConsoleMessage(
      "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.",
    ),
    "playwright-webkit-screenshot-inline-style",
  );
  assert.equal(
    classifyExpectedToolingConsoleMessage(
      "Refused to apply app.css because it violates style-src.",
    ),
    null,
  );
});

test("acceptance report binds owner approval and current package hashes", (t) => {
  const fixture = buildSyntheticEvidence();
  t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
  const report = buildAcceptanceReport({
    root,
    evidenceRoot: fixture.evidenceRoot,
    playwrightVersion: "1.61.1",
  });
  assert.equal(report.version, "2.2.0");
  assert.equal(report.status, "owner-approved-prototype");
  assert.equal(report.result, "conditional_pass_with_tooling_limitation");
  assert.equal(report.html_files.length, 4);
  assert.equal(report.canonical_contracts.length, 6);
  assert.equal(report.evidence_file_count, 110);
  assert.equal(report.owner_approval.playwright_substitution_confirmed, true);
  assert.equal(report.tooling.chrome_devtools_mcp.available, false);
  assert.equal(report.tooling.playwright.used, true);
  assert.deepEqual(
    report.documentation.map((record) => record.path),
    ["README.md", "donor-options.md", "user-journey.md"],
  );
  for (const record of report.documentation) {
    assert.equal(
      record.sha256,
      sha256File(path.join(packageRoot, record.path)),
    );
  }
  assert.deepEqual(
    report.evidence_toolchain.map((record) => record.path),
    [
      "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
      "scripts/validate-presentation-link-lisa-user-journey-evidence.mjs",
      "tests/presentation-link-lisa-user-journey-evidence.test.mjs",
      "tests/presentation-link-lisa-user-journey.browser.spec.mjs",
      "tests/presentation-link-lisa-user-journey.playwright.config.mjs",
    ],
  );
  for (const record of report.evidence_toolchain) {
    assert.equal(record.sha256, sha256File(path.join(root, record.path)));
  }
  assert.equal(report.donor_operations.write_operations_performed, false);
  assert.equal(report.rights.external_distribution_requires_separate_review, true);
  assert.deepEqual(report.rights.restricted_source_assets, [
    {
      path: "source/components/lisa-phone-shell.svg",
      origin_repository: "RussianLioN/AI-agent-platform",
      origin_commit: "b5ad803b8826ec6487534c4c88d59a3c93f8be4b",
      license: "repository-license-not-found",
      permission: "owner-explicit-svg-source-internal-adaptation-2026-07-16",
    },
  ]);
  assert.equal(
    report.browser_report.sha256,
    sha256File(path.join(fixture.evidenceRoot, "browser-report.json")),
  );
});

test("validator accepts a complete synthetic evidence package", (t) => {
  const fixture = buildSyntheticEvidence();
  t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
  assert.deepEqual(
    validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }),
    [],
  );
});

test("validator rejects corrupt reports, missing files, extra files and hash drift", async (t) => {
  await t.test("corrupt browser report", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    fs.writeFileSync(path.join(fixture.evidenceRoot, "browser-report.json"), "{");
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /browser-report\.json.*повреждён|повреждён.*browser-report\.json/u,
    );
  });

  await t.test("missing screenshot", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    const missing = expectedEvidencePaths(root).find((item) => item.endsWith(".png"));
    fs.rmSync(path.join(fixture.evidenceRoot, missing.slice("evidence/".length)));
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /отсутствует обязательный evidence-файл/u,
    );
  });

  await t.test("extra file", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    fs.writeFileSync(path.join(fixture.evidenceRoot, "unexpected.txt"), "extra");
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /лишний evidence-файл/u,
    );
  });

  await t.test("screenshot hash mismatch", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    const reportPath = path.join(fixture.evidenceRoot, "browser-report.json");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    report.screenshots[0].sha256 = "0".repeat(64);
    writeJson(reportPath, report);
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /не совпадает SHA-256/u,
    );
  });

  await t.test("capture stabilization mismatch", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    const reportPath = path.join(fixture.evidenceRoot, "browser-report.json");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    report.capture_stabilization.scroll_policy = "none";
    writeJson(reportPath, report);
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /политик.*стабилизац/u,
    );
  });

  await t.test("missing resource check", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    const reportPath = path.join(fixture.evidenceRoot, "browser-report.json");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    report.screenshots[0].checks.resources = {
      passed: false,
      issue_count: 1,
      issues: ["локальный ресурс отсутствует"],
    };
    writeJson(reportPath, report);
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /ресурс/u,
    );
  });

  await t.test("unclassified tooling console warning", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    const reportPath = path.join(fixture.evidenceRoot, "browser-report.json");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    report.screenshots[0].checks.tooling_console_messages = [
      { classification: "unknown", message: "неизвестное предупреждение" },
    ];
    report.totals.tooling_console_messages = 1;
    writeJson(reportPath, report);
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /неклассифицированное предупреждение инструмента/u,
    );
  });
});

test("validator rejects path traversal and local machine paths", async (t) => {
  await t.test("path traversal in screenshot inventory", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    const reportPath = path.join(fixture.evidenceRoot, "browser-report.json");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    report.screenshots[0].path = "evidence/screenshots/../../outside.png";
    writeJson(reportPath, report);
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /небезопасный путь|неожиданный путь снимка/u,
    );
  });

  await t.test("absolute local path in report", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    const reportPath = path.join(fixture.evidenceRoot, "acceptance-report.json");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    report.debug_path = ["", "Users", "example", "private"].join("/");
    writeJson(reportPath, report);
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /локальный абсолютный путь/u,
    );
  });
});

test("validator rejects acceptance documentation and donor-safety drift", async (t) => {
  await t.test("documentation hash mismatch", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    const reportPath = path.join(fixture.evidenceRoot, "acceptance-report.json");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    report.documentation[1].sha256 = "0".repeat(64);
    writeJson(reportPath, report);
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /документ donor-options\.md.*SHA-256/u,
    );
  });

  await t.test("donor repository write falsely recorded", () => {
    const fixture = buildSyntheticEvidence();
    t.after(() => fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true }));
    const reportPath = path.join(fixture.evidenceRoot, "acceptance-report.json");
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    report.donor_operations.write_operations_performed = true;
    writeJson(reportPath, report);
    assert.match(
      validateEvidencePackage(root, { evidenceRoot: fixture.evidenceRoot }).join("\n"),
      /отсутствие записи в доноры/u,
    );
  });
});

test("atomic publisher validates staging before replacing existing evidence", (t) => {
  const fixture = buildSyntheticEvidence();
  const targetParent = fs.mkdtempSync(
    path.join(os.tmpdir(), "datacanvas-lisa-evidence-publish-"),
  );
  const targetRoot = path.join(targetParent, "evidence");
  fs.mkdirSync(targetRoot, { recursive: true });
  fs.writeFileSync(path.join(targetRoot, "previous.txt"), "previous");
  t.after(() => {
    fs.rmSync(fixture.temporaryRoot, { recursive: true, force: true });
    fs.rmSync(targetParent, { recursive: true, force: true });
  });

  const invalidStage = path.join(targetParent, "invalid-stage");
  fs.cpSync(fixture.evidenceRoot, invalidStage, { recursive: true });
  fs.rmSync(path.join(invalidStage, "browser-report.json"));
  assert.throws(
    () =>
      publishEvidenceAtomically(root, {
        stagingRoot: invalidStage,
        targetRoot,
      }),
    /evidence-пакет не прошёл проверку/u,
  );
  assert.equal(fs.readFileSync(path.join(targetRoot, "previous.txt"), "utf8"), "previous");

  publishEvidenceAtomically(root, {
    stagingRoot: fixture.evidenceRoot,
    targetRoot,
  });
  assert.equal(fs.existsSync(path.join(targetRoot, "previous.txt")), false);
  assert.equal(
    fs.existsSync(path.join(targetRoot, "acceptance-report.json")),
    true,
  );
  assert.equal(fs.existsSync(fixture.evidenceRoot), false);
});
