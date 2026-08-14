import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, webkit } from "@playwright/test";
import { stabilizeBrowserCapture } from "./lib/presentation-link-lisa-user-journey.mjs";

const RUNTIME_WORKER_VERSION = "1.0.0";
const RUNTIME_WORKER_PATH = fileURLToPath(import.meta.url);
const RUNTIME_BROWSER_TYPES = Object.freeze({ chromium, webkit });
const DIAGNOSTIC_FIELDS = Object.freeze([
  "version",
  "status",
  "browser",
  "last_viewport",
  "last_state_id",
  "last_stage",
  "elapsed_ms",
  "termination",
  "network_attempts",
  "console_errors",
  "page_errors",
  "stderr",
]);

function sameOrderedValues(left, right) {
  return Array.isArray(left) && Array.isArray(right) &&
    left.length === right.length && left.every((value, index) => value === right[index]);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, expected) {
  return isPlainObject(value) &&
    sameOrderedValues(
      Object.keys(value).sort((left, right) => left.localeCompare(right, "en")),
      [...expected].sort((left, right) => left.localeCompare(right, "en")),
    );
}

function createRuntimeProgress(stage = "worker-launch") {
  return {
    viewport: null,
    stateId: null,
    stage,
    networkAttempts: new Set(),
    consoleErrors: new Set(),
    pageErrors: new Set(),
  };
}

function validateRuntimeViewports(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("runtime browser-worker требует viewport из request");
  }
  return value.map((viewport) => {
    if (
      !exactKeys(viewport, ["id", "width", "height"]) ||
      typeof viewport.id !== "string" || viewport.id.length === 0 ||
      !Number.isInteger(viewport.width) || viewport.width <= 0 ||
      !Number.isInteger(viewport.height) || viewport.height <= 0
    ) {
      throw new Error("runtime browser-worker получил недопустимый viewport из request");
    }
    return { id: viewport.id, width: viewport.width, height: viewport.height };
  });
}

function ensureSafeRelativePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value.split(/[\\/]/u).some((part) => part === ".." || part.length === 0)
  ) {
    throw new Error(`${label} должен быть безопасным относительным путём`);
  }
  return value;
}

function assertRuntimeCaptureSupervision(supervision) {
  if (!isPlainObject(supervision)) {
    throw new Error("runtime_capture_supervision отсутствует");
  }
  if (supervision.browser_process_model !== "isolated-child-process-per-browser") {
    throw new Error("runtime browser-worker требует отдельный дочерний процесс для браузера");
  }
  if (!sameOrderedValues(supervision.browser_execution_order, ["chromium", "webkit"])) {
    throw new Error("runtime browser-worker требует порядок chromium затем webkit");
  }
  if (!isPlainObject(supervision.diagnostic_report) || supervision.diagnostic_report.published !== false) {
    throw new Error("диагностика runtime browser-worker не должна публиковаться");
  }
  ensureSafeRelativePath(supervision.diagnostic_report.path, "путь диагностики runtime browser-worker");
  if (
    !Number.isInteger(supervision.page_timeout_ms) || supervision.page_timeout_ms <= 0 ||
    !Number.isInteger(supervision.browser_worker_timeout_ms) || supervision.browser_worker_timeout_ms <= 0 ||
    !Number.isInteger(supervision.graceful_cleanup_timeout_ms) || supervision.graceful_cleanup_timeout_ms < 0 ||
    supervision.force_termination_after_graceful_cleanup !== true ||
    supervision.force_termination_scope !== "isolated-child-process-group" ||
    !exactKeys(supervision.post_kill_group_exit_confirmation, [
      "timeout_ms",
      "required_state",
      "timeout_state",
      "timeout_action",
    ]) ||
    supervision.post_kill_group_exit_confirmation.timeout_ms !== 5_000 ||
    supervision.post_kill_group_exit_confirmation.required_state !== "process-group-exited" ||
    supervision.post_kill_group_exit_confirmation.timeout_state !== "process-group-exit-unconfirmed" ||
    supervision.post_kill_group_exit_confirmation.timeout_action !== "fail-runtime-capture-and-rollback" ||
    supervision.partial_browser_or_acceptance_reports_on_failure_allowed !== false
  ) {
    throw new Error("runtime_capture_supervision содержит недопустимые пределы или правила остановки");
  }
}

/** Удаляет локальные пути и ограничивает диагностический текст непубликуемым минимумом. */
export function sanitizeDiagnostic(value) {
  return String(value ?? "")
    .replace(/file:\/\/[^\s"'<>)]*/gu, "[локальный-ресурс]")
    .replace(/(^|[\s("'`])\/(?:[^\s"'<>)]*)/gu, "$1[локальный-ресурс]")
    .replace(/[A-Za-z]:\\(?:[^\s"'<>)]*)/gu, "[локальный-ресурс]")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 4096);
}

function sanitizeList(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => sanitizeDiagnostic(value))
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "en"));
}

function createDiagnosticRunRoot({ toolchainRoot, diagnosticRoot, supervision, diagnosticRunRoot }) {
  const baseRoot = path.resolve(diagnosticRoot ?? toolchainRoot);
  const reportRoot = path.resolve(baseRoot, supervision.diagnostic_report.path);
  if (!reportRoot.startsWith(`${baseRoot}${path.sep}`)) {
    throw new Error("диагностика runtime browser-worker находится вне разрешённого корня");
  }
  if (diagnosticRunRoot) {
    const resolved = path.resolve(diagnosticRunRoot);
    if (
      !resolved.startsWith(`${reportRoot}${path.sep}`) ||
      !/^run-[a-z0-9-]+$/u.test(path.basename(resolved))
    ) {
      throw new Error("diagnosticRunRoot должен быть изолированным run-* каталогом");
    }
    fs.mkdirSync(resolved, { recursive: true });
    return resolved;
  }
  fs.mkdirSync(reportRoot, { recursive: true });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const runRoot = path.join(reportRoot, `run-${randomUUID()}`);
    try {
      fs.mkdirSync(runRoot, { recursive: false });
      return runRoot;
    } catch (error) {
      if (!(error && typeof error === "object" && error.code === "EEXIST")) throw error;
    }
  }
  throw new Error("не удалось создать изолированный каталог диагностики runtime browser-worker");
}

function writeAtomicJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(value)}\n`, { encoding: "utf8", flag: "wx" });
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
  }
}

function readWorkerResult(resultPath) {
  if (!fs.existsSync(resultPath)) {
    throw new Error("runtime browser-worker не создал атомарный result");
  }
  try {
    return JSON.parse(fs.readFileSync(resultPath, "utf8"));
  } catch {
    throw new Error("runtime browser-worker создал некорректный result");
  }
}

function expectedRuntimeResultKeys() {
  return [
    "version",
    "status",
    "browser",
    "browser_version",
    "browser_launch_args",
    "runtime_results",
  ];
}

function assertCompleteWorkerResult(result, { browserName, runtimePlans }) {
  if (
    !exactKeys(result, expectedRuntimeResultKeys()) ||
    result.version !== RUNTIME_WORKER_VERSION ||
    result.status !== "success" ||
    result.browser !== browserName ||
    typeof result.browser_version !== "string" || result.browser_version.length === 0 ||
    !Array.isArray(result.browser_launch_args) ||
    !result.browser_launch_args.every((argument) => typeof argument === "string") ||
    !Array.isArray(result.runtime_results) || result.runtime_results.length !== runtimePlans.length
  ) {
    throw new Error("runtime browser-worker вернул неполный или недопустимый result");
  }
  const expected = runtimePlans.map((plan) => `${browserName}:${plan.viewport}:${plan.state_id}`);
  const actual = result.runtime_results.map((record) =>
    `${record?.browser}:${record?.viewport}:${record?.state_id}`,
  );
  if (!sameOrderedValues(actual, expected)) {
    throw new Error("runtime browser-worker вернул неполный или несогласованный result");
  }
}

function diagnosticTermination(outcome, error) {
  if (typeof outcome?.termination === "string" && outcome.termination.length > 0) {
    return sanitizeDiagnostic(outcome.termination);
  }
  if (outcome?.timeoutTriggered === true) return "worker-timeout";
  if (outcome?.signal) return `signal=${sanitizeDiagnostic(outcome.signal)}`;
  if (Number.isInteger(outcome?.status)) return `exit-status=${outcome.status}`;
  if (error) return "invalid-result";
  return "worker-failure";
}

function writeFailureDiagnostic({ diagnosticRunRoot, browserName, startedAt, progress, outcome, error }) {
  const diagnostic = {
    version: RUNTIME_WORKER_VERSION,
    status: "failed",
    browser: browserName,
    last_viewport: progress.viewport ?? null,
    last_state_id: progress.stateId ?? null,
    last_stage: progress.stage ?? "worker-launch",
    elapsed_ms: Math.max(0, Date.now() - startedAt),
    termination: diagnosticTermination(outcome, error),
    network_attempts: sanitizeList(progress.networkAttempts),
    console_errors: sanitizeList(progress.consoleErrors),
    page_errors: sanitizeList(progress.pageErrors),
    stderr: sanitizeDiagnostic([outcome?.stderr, error instanceof Error ? error.message : error]
      .filter(Boolean)
      .join("; ")),
  };
  if (!exactKeys(diagnostic, DIAGNOSTIC_FIELDS)) {
    throw new Error("внутренняя ошибка формы диагностики runtime browser-worker");
  }
  writeAtomicJson(path.join(diagnosticRunRoot, `${browserName}.json`), diagnostic);
}

function updateProgress(progress, event) {
  if (!isPlainObject(event) || event.type !== "runtime-progress") return;
  if (typeof event.viewport === "string") progress.viewport = event.viewport;
  if (typeof event.state_id === "string") progress.stateId = event.state_id;
  if (typeof event.stage === "string") progress.stage = event.stage;
  for (const rawUrl of event.network_attempts ?? []) progress.networkAttempts.add(sanitizeDiagnostic(rawUrl));
  for (const message of event.console_errors ?? []) progress.consoleErrors.add(sanitizeDiagnostic(message));
  for (const message of event.page_errors ?? []) progress.pageErrors.add(sanitizeDiagnostic(message));
}

function killIsolatedProcessGroup(pid, signal) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    if (process.platform === "win32") process.kill(pid, signal);
    else process.kill(-pid, signal);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ESRCH") return false;
    throw error;
  }
}

/**
 * Проверяет только существование изолированной группы дочернего процесса.
 * На POSIX используется отрицательный PID, поэтому проверка не выдаётся за
 * подтверждение остановки сопутствующих XPC-процессов macOS.
 */
function probeIsolatedProcessGroup(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    if (process.platform === "win32") process.kill(pid, 0);
    else process.kill(-pid, 0);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ESRCH") return false;
    throw error;
  }
}

function parseWorkerEvents(chunk, state, onProgress) {
  state.buffer += chunk;
  const lines = state.buffer.split(/\r?\n/u);
  state.buffer = lines.pop() ?? "";
  for (const line of lines) {
    if (!line) continue;
    try {
      const event = JSON.parse(line);
      updateProgress(state.progress, event);
      onProgress?.(event);
    } catch {
      // Рабочий вывод не является доказательством; он намеренно не попадает в отчёты.
    }
  }
}

/**
 * Запускает только дочерний runtime-процесс. Он не знает о candidate fingerprint,
 * staging evidence или публикации.
 */
export function launchRuntimeBrowserWorkerProcess({
  requestPath,
  resultPath,
  browserName,
  supervision,
  onProgress,
  spawnWorker = spawn,
  signalProcessGroupFn = killIsolatedProcessGroup,
  probeProcessGroupFn = probeIsolatedProcessGroup,
  timerApi = globalThis,
}) {
  assertRuntimeCaptureSupervision(supervision);
  if (
    typeof spawnWorker !== "function" ||
    typeof signalProcessGroupFn !== "function" ||
    typeof probeProcessGroupFn !== "function" ||
    !timerApi ||
    typeof timerApi.setTimeout !== "function" ||
    typeof timerApi.clearTimeout !== "function"
  ) {
    throw new Error("launcher runtime browser-worker получил недопустимые швы процесса или таймера");
  }
  return new Promise((resolve, reject) => {
    const child = spawnWorker(process.execPath, [RUNTIME_WORKER_PATH, "--request", requestPath, "--result", resultPath], {
      cwd: path.dirname(RUNTIME_WORKER_PATH),
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const startedAt = Date.now();
    const eventState = {
      buffer: "",
      progress: createRuntimeProgress(),
    };
    let stderr = "";
    let timeoutTriggered = false;
    let deadlineTimer = null;
    let graceTimer = null;
    let preKillProbeTimer = null;
    let postKillConfirmationTimer = null;
    let postKillProbeTimer = null;
    let closedOutcome = null;
    let settled = false;
    let rejected = false;
    let processGroupExitConfirmed = false;
    let postKillConfirmationStarted = false;
    const clearTimers = () => {
      if (deadlineTimer !== null) timerApi.clearTimeout(deadlineTimer);
      if (graceTimer !== null) timerApi.clearTimeout(graceTimer);
      if (preKillProbeTimer !== null) timerApi.clearTimeout(preKillProbeTimer);
      if (postKillConfirmationTimer !== null) timerApi.clearTimeout(postKillConfirmationTimer);
      if (postKillProbeTimer !== null) timerApi.clearTimeout(postKillProbeTimer);
      deadlineTimer = null;
      graceTimer = null;
      preKillProbeTimer = null;
      postKillConfirmationTimer = null;
      postKillProbeTimer = null;
    };
    const finish = (outcome) => {
      if (settled || rejected) return;
      settled = true;
      clearTimers();
      resolve({
        ...outcome,
        stdout: "",
        stderr: sanitizeDiagnostic(stderr),
        elapsedMs: Math.max(0, Date.now() - startedAt),
        timeoutTriggered,
        progress: eventState.progress,
      });
    };
    const failLauncher = (error) => {
      if (settled || rejected) return;
      rejected = true;
      clearTimers();
      reject(error);
    };
    const appendStderr = (error) => {
      stderr += ` ${sanitizeDiagnostic(error instanceof Error ? error.message : error)}`;
    };
    const finishWithConfirmedGroupExit = () => {
      if (!processGroupExitConfirmed || !closedOutcome) return;
      finish({
        ...closedOutcome,
        termination: supervision.post_kill_group_exit_confirmation.required_state,
      });
    };
    const startBoundedGroupExitConfirmation = () => {
      if (
        settled ||
        rejected ||
        postKillConfirmationTimer !== null
      ) return;
      postKillConfirmationTimer = timerApi.setTimeout(() => {
        if (settled || rejected) return;
        finish({
          status: null,
          signal: null,
          pid: child.pid,
          termination: supervision.post_kill_group_exit_confirmation.timeout_state,
        });
      }, supervision.post_kill_group_exit_confirmation.timeout_ms);
    };
    const confirmProcessGroupExit = () => {
      if (settled || rejected || processGroupExitConfirmed) return;
      processGroupExitConfirmed = true;
      if (timeoutTriggered) {
        if (graceTimer !== null) {
          timerApi.clearTimeout(graceTimer);
          graceTimer = null;
        }
        if (preKillProbeTimer !== null) {
          timerApi.clearTimeout(preKillProbeTimer);
          preKillProbeTimer = null;
        }
      }
      finishWithConfirmedGroupExit();
      if (!settled && timeoutTriggered) startBoundedGroupExitConfirmation();
    };
    const probeForProcessGroupExit = () => {
      if (settled || rejected || processGroupExitConfirmed) return false;
      let processGroupExists;
      try {
        processGroupExists = probeProcessGroupFn(child.pid);
      } catch (error) {
        appendStderr(error);
        return false;
      }
      if (processGroupExists === false) {
        confirmProcessGroupExit();
        return true;
      }
      // Только синхронный boolean false подтверждает выход группы. Promise,
      // исключение и любое другое значение остаются непроверенным состоянием.
      return false;
    };
    const schedulePreKillProbe = () => {
      if (
        settled ||
        rejected ||
        processGroupExitConfirmed ||
        preKillProbeTimer !== null
      ) return;
      preKillProbeTimer = timerApi.setTimeout(() => {
        preKillProbeTimer = null;
        if (settled || rejected || processGroupExitConfirmed) return;
        probeForProcessGroupExit();
        if (!settled && !rejected && !processGroupExitConfirmed) schedulePreKillProbe();
      }, Math.min(100, Math.max(1, supervision.graceful_cleanup_timeout_ms)));
    };
    const beginPostKillConfirmation = () => {
      if (settled || rejected || processGroupExitConfirmed || postKillConfirmationStarted) return;
      postKillConfirmationStarted = true;
      startBoundedGroupExitConfirmation();
      const probeAgain = () => {
        if (settled || rejected || processGroupExitConfirmed) return;
        probeForProcessGroupExit();
        if (!settled && !rejected && !processGroupExitConfirmed) {
          postKillProbeTimer = timerApi.setTimeout(
            probeAgain,
            Math.min(100, supervision.post_kill_group_exit_confirmation.timeout_ms),
          );
        }
      };
      // Сначала ставим повторный опрос, чтобы он получил шанс подтвердить выход
      // до ограниченного окончательного срока даже в управляемом timerApi теста.
      probeAgain();
    };
    const beginForcedTermination = () => {
      if (settled || rejected) return;
      graceTimer = null;
      if (preKillProbeTimer !== null) {
        timerApi.clearTimeout(preKillProbeTimer);
        preKillProbeTimer = null;
      }
      probeForProcessGroupExit();
      if (settled || rejected || processGroupExitConfirmed) {
        if (!settled) startBoundedGroupExitConfirmation();
        return;
      }
      if (supervision.force_termination_after_graceful_cleanup) {
        try {
          signalProcessGroupFn(child.pid, "SIGKILL");
        } catch (error) {
          appendStderr(error);
        }
      }
      // Не зависит от close или от зависшего TERM-probe.
      beginPostKillConfirmation();
    };
    deadlineTimer = timerApi.setTimeout(() => {
      if (settled || rejected) return;
      timeoutTriggered = true;
      if (processGroupExitConfirmed) {
        startBoundedGroupExitConfirmation();
        return;
      }
      // До TERM сначала подтверждаем, что исходная POSIX-группа ещё существует.
      // Иначе PID мог быть переиспользован, а сигнал затронул бы чужой процесс.
      probeForProcessGroupExit();
      if (processGroupExitConfirmed) {
        if (!settled) startBoundedGroupExitConfirmation();
        return;
      }
      try {
        signalProcessGroupFn(child.pid, "SIGTERM");
      } catch (error) {
        appendStderr(error);
      }
      if (supervision.force_termination_after_graceful_cleanup) {
        graceTimer = timerApi.setTimeout(beginForcedTermination, supervision.graceful_cleanup_timeout_ms);
        schedulePreKillProbe();
      }
    }, supervision.browser_worker_timeout_ms);
    child.stdout.on("data", (chunk) => parseWorkerEvents(String(chunk), eventState, onProgress));
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.once("error", (error) => {
      failLauncher(error);
    });
    child.once("close", (status, signal) => {
      if (settled || rejected) return;
      // Даже status=0 не доказывает, что потомки не удерживают группу.
      closedOutcome = { status, signal, pid: child.pid };
      if (processGroupExitConfirmed) {
        finishWithConfirmedGroupExit();
        return;
      }
      probeForProcessGroupExit();
    });
  });
}

/**
 * Надзирает за одним браузером: request/result являются внутренними временными
 * файлами, а при сбое остаётся только очищенная диагностическая запись вне кандидата.
 */
export async function runRuntimeBrowserWorker({
  toolchainRoot = process.cwd(),
  packageRoot,
  demoPath,
  browserName,
  runtimePlans,
  runtimeViewports,
  captureStabilization,
  browserLaunchArgs = [],
  supervision,
  diagnosticRoot,
  diagnosticRunRoot,
  launchWorker = launchRuntimeBrowserWorkerProcess,
}) {
  assertRuntimeCaptureSupervision(supervision);
  if (!RUNTIME_BROWSER_TYPES[browserName]) {
    throw new Error("runtime browser-worker получил неизвестный браузер");
  }
  if (!Array.isArray(runtimePlans) || runtimePlans.length === 0) {
    throw new Error("runtime browser-worker требует непустой план проверок");
  }
  const resolvedRuntimeViewports = runtimeViewports;
  validateRuntimeViewports(resolvedRuntimeViewports);
  if (!Array.isArray(browserLaunchArgs) || !browserLaunchArgs.every((argument) => typeof argument === "string")) {
    throw new Error("runtime browser-worker получил недопустимые аргументы запуска браузера");
  }
  if (typeof launchWorker !== "function") {
    throw new Error("runtime browser-worker требует функцию запуска дочернего процесса");
  }
  const runRoot = createDiagnosticRunRoot({
    toolchainRoot,
    diagnosticRoot,
    supervision,
    diagnosticRunRoot,
  });
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), `datacanvas-lisa-runtime-worker-${browserName}-`));
  const requestPath = path.join(temporaryRoot, "request.json");
  const resultPath = path.join(temporaryRoot, "result.json");
  const startedAt = Date.now();
  const progress = createRuntimeProgress();
  let outcome = null;
  try {
    writeAtomicJson(requestPath, {
      version: RUNTIME_WORKER_VERSION,
      browser: browserName,
      package_root: path.resolve(packageRoot),
      demo_path: path.resolve(demoPath ?? path.join(packageRoot, "demo/index.html")),
      runtime_plans: runtimePlans,
      runtime_viewports: validateRuntimeViewports(resolvedRuntimeViewports),
      capture_stabilization: captureStabilization,
      browser_launch_args: [...browserLaunchArgs],
      page_timeout_ms: supervision.page_timeout_ms,
    });
    outcome = await launchWorker({
      requestPath,
      resultPath,
      browserName,
      supervision,
      onProgress: (event) => updateProgress(progress, event),
    });
    if (!outcome || outcome.timeoutTriggered === true || outcome.status !== 0 || outcome.signal !== null) {
      const reason = outcome?.timeoutTriggered ? "тайм-аут" : "неуспешное завершение";
      throw new Error(`runtime browser-worker ${browserName}: ${reason} (${outcome?.signal ?? outcome?.status ?? "unknown"})`);
    }
    updateProgress(progress, outcome.progress);
    const result = readWorkerResult(resultPath);
    assertCompleteWorkerResult(result, { browserName, runtimePlans });
    return {
      browserVersion: result.browser_version,
      browserLaunchArgs: [...result.browser_launch_args],
      runtimeResults: result.runtime_results,
      diagnosticRunRoot: runRoot,
    };
  } catch (error) {
    updateProgress(progress, outcome?.progress);
    writeFailureDiagnostic({
      diagnosticRunRoot: runRoot,
      browserName,
      startedAt,
      progress,
      outcome,
      error,
    });
    throw error;
  } finally {
    if (fs.existsSync(temporaryRoot)) fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

export function isExternalNetworkUrl(rawUrl) {
  try {
    return ["http:", "https:", "ws:", "wss:"].includes(new URL(rawUrl).protocol);
  } catch {
    return false;
  }
}

function classifyExpectedToolingConsoleMessage(message) {
  if (
    message.includes("connect-src") &&
    message.includes("styles.css") &&
    (message.includes("violates") || message.includes("Refused to connect"))
  ) {
    return "axe-stylesheet-connect-src";
  }
  if (
    message === "Refused to apply a stylesheet because its hash, its nonce, or " +
      "'unsafe-inline' does not appear in the style-src directive of the " +
      "Content Security Policy."
  ) {
    return "playwright-webkit-screenshot-inline-style";
  }
  return null;
}

function inspectResourceUrls(resourceUrls, packageRoot) {
  const issues = [];
  const resolvedPackageRoot = path.resolve(packageRoot);
  for (const rawUrl of resourceUrls) {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      issues.push("ресурс содержит некорректный URL");
      continue;
    }
    if (!["file:", "data:", "about:"].includes(url.protocol)) {
      issues.push(`запрещён внешний протокол ресурса: ${url.protocol}`);
      continue;
    }
    if (url.protocol === "data:" && !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/u.test(rawUrl)) {
      issues.push("разрешены только проверенные data:image/png ресурсы");
      continue;
    }
    if (url.protocol === "file:") {
      const resourcePath = path.resolve(fileURLToPath(url));
      if (!resourcePath.startsWith(`${resolvedPackageRoot}${path.sep}`) || !fs.existsSync(resourcePath)) {
        issues.push("локальный ресурс находится вне переносимого пакета");
      }
    }
  }
  return issues;
}

async function collectGeometry(page) {
  return page.evaluate(() => {
    const scene = document.querySelector(".prototype-scene[data-prototype-scene]");
    const base = scene?.querySelector("img.scene-base[data-source-base-id]");
    const stage = document.querySelector(".scene-stage");
    if (!scene || !base || !stage) return { missingScene: true };
    const sceneRect = scene.getBoundingClientRect();
    const baseRect = base.getBoundingClientRect();
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const slots = [...scene.querySelectorAll("[data-slot-id][data-semantic-control-id]")];
    const slotIds = slots.map((element) => element.getAttribute("data-slot-id"));
    const semanticControlIds = slots.map((element) => element.getAttribute("data-semantic-control-id"));
    const actions = slots.filter((element) => !element.hasAttribute("disabled")).filter(visible).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        id: element.getAttribute("data-action-id") || element.getAttribute("data-semantic-control-id"),
        inside: rect.left >= sceneRect.left - 1 && rect.right <= sceneRect.right + 1 &&
          rect.top >= sceneRect.top - 1 && rect.bottom <= sceneRect.bottom + 1,
      };
    });
    return {
      missingScene: false,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentScrollHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      sceneInsideViewportHorizontally: sceneRect.left >= -1 && sceneRect.right <= window.innerWidth + 1,
      sceneMatchesBase: base.complete && base.naturalWidth > 0 && base.naturalHeight > 0 &&
        Math.abs(sceneRect.width - baseRect.width) < 0.1 && Math.abs(sceneRect.height - baseRect.height) < 0.1 &&
        Math.abs((baseRect.width / base.naturalWidth) - (baseRect.height / base.naturalHeight)) < 0.001,
      slotIds,
      semanticControlIds,
      actionOutsideSceneCount: actions.filter((action) => !action.inside).length,
      stageContainsScene: stage.contains(scene),
      resourceUrls: [...new Set([
        ...[...document.querySelectorAll("[src], [href]")].map((element) => element.src || element.href),
        ...performance.getEntriesByType("resource").map((entry) => entry.name),
      ])],
    };
  });
}

function compactAxeViolations(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    node_count: violation.nodes.length,
  }));
}

/** Enforces that the guard is installed on BrowserContext, never Page. */
export function assertContextNetworkGuard(context) {
  if (
    !context ||
    typeof context.newPage !== "function" ||
    typeof context.route !== "function" ||
    typeof context.routeWebSocket !== "function"
  ) {
    throw new Error("защита сети evidence должна устанавливаться на BrowserContext, а не на Page");
  }
}

export async function installNetworkGuards(context, attemptedNetwork, onAttempt) {
  assertContextNetworkGuard(context);
  const recordAttempt = (rawUrl) => {
    if (!isExternalNetworkUrl(rawUrl)) return;
    attemptedNetwork.add(rawUrl);
    onAttempt?.(rawUrl);
  };
  context.on("request", (request) => recordAttempt(request.url()));
  await context.route(/^(?:https?|wss?):/u, async (route) => {
    recordAttempt(route.request().url());
    await route.abort("blockedbyclient");
  });
  await context.routeWebSocket(/^(?:ws|wss):/u, (socket) => {
    recordAttempt(socket.url());
    socket.close({ code: 1008, reason: "Внешняя сеть запрещена" });
  });
}

function runtimeRecord({ browserName, plan, checks }) {
  return {
    browser: browserName,
    viewport: plan.viewport,
    state_id: plan.state_id,
    checks,
  };
}

function runtimeChecks({ renderedStateId, expectedStateId, expectedSlots, consoleErrors, pageErrors, axeViolations, geometry, resourceIssues, attemptedNetwork }) {
  const relevantConsoleErrors = consoleErrors
    .filter((message) => classifyExpectedToolingConsoleMessage(message) === null)
    .map(sanitizeDiagnostic);
  const sanitizedPageErrors = pageErrors.map(sanitizeDiagnostic);
  const attempts = [...attemptedNetwork].sort((left, right) => left.localeCompare(right, "en"));
  const behaviorPassed = renderedStateId === expectedStateId && relevantConsoleErrors.length === 0 && sanitizedPageErrors.length === 0;
  const expectedSlotIds = expectedSlots.map((slot) => slot.id);
  const expectedControlIds = expectedSlots.map((slot) => slot.semantic_control_id);
  const geometryPassed = !geometry.missingScene &&
    geometry.documentScrollWidth <= geometry.viewportWidth + 1 &&
    geometry.documentScrollHeight <= geometry.viewportHeight + 1 &&
    geometry.sceneInsideViewportHorizontally === true && geometry.sceneMatchesBase === true &&
    geometry.stageContainsScene === true && geometry.actionOutsideSceneCount === 0 &&
    sameOrderedValues([...geometry.slotIds].sort((left, right) => String(left).localeCompare(String(right), "en")), [...expectedSlotIds].sort((left, right) => left.localeCompare(right, "en"))) &&
    sameOrderedValues([...geometry.semanticControlIds].sort((left, right) => String(left).localeCompare(String(right), "en")), [...expectedControlIds].sort((left, right) => left.localeCompare(right, "en"))) &&
    resourceIssues.length === 0;
  return {
    behavior: { passed: behaviorPassed },
    accessibility: {
      passed: axeViolations.length === 0,
      axe_violation_count: axeViolations.length,
    },
    geometry: { passed: geometryPassed },
    network: {
      passed: attempts.length === 0,
      network_attempts: attempts,
      console_errors: relevantConsoleErrors,
      page_errors: sanitizedPageErrors,
    },
  };
}

function emitRuntimeProgress(event) {
  process.stdout.write(`${JSON.stringify({ type: "runtime-progress", ...event })}\n`);
}

async function withPageDeadline({ page, timeoutMs, stage, action }) {
  let timeoutId;
  try {
    return await Promise.race([
      action(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`runtime page timeout: ${stage}`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

/**
 * Runs interaction/accessibility/layout/network checks only. It deliberately
 * never calls screenshot(), so Chromium cannot publish an unstable PNG.
 */
export async function captureBrowser({
  browserType,
  browserName,
  runtimePlans,
  runtimeViewports,
  packageRoot,
  demoPath = path.join(packageRoot, "demo/index.html"),
  captureStabilization,
  browserLaunchArgs,
  pageTimeoutMs = 45_000,
  onProgress,
}) {
  const resolvedRuntimeViewports = validateRuntimeViewports(runtimeViewports);
  const appliedBrowserLaunchArgs = [...browserLaunchArgs];
  onProgress?.({ stage: "browser-launch" });
  const browser = await browserType.launch({ headless: true, args: appliedBrowserLaunchArgs });
  const browserVersion = browser.version();
  const results = [];
  try {
    for (const viewport of resolvedRuntimeViewports) {
      const plans = runtimePlans.filter((plan) => plan.viewport === viewport.id);
      if (plans.length === 0) continue;
      onProgress?.({ viewport: viewport.id, stage: "context-create" });
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        locale: "ru-RU",
        timezoneId: "UTC",
        colorScheme: "light",
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      context.setDefaultNavigationTimeout(pageTimeoutMs);
      context.setDefaultTimeout(pageTimeoutMs);
      const attemptedNetwork = new Set();
      try {
        await installNetworkGuards(context, attemptedNetwork, (rawUrl) => onProgress?.({
          viewport: viewport.id,
          stage: "network-blocked",
          network_attempts: [rawUrl],
        }));
        for (const plan of plans) {
          const page = await context.newPage();
          page.setDefaultNavigationTimeout(pageTimeoutMs);
          page.setDefaultTimeout(pageTimeoutMs);
          const consoleErrors = [];
          const pageErrors = [];
          page.on("console", (message) => {
            if (message.type() !== "error") return;
            consoleErrors.push(message.text());
            onProgress?.({ viewport: viewport.id, state_id: plan.state_id, stage: "console-error", console_errors: [message.text()] });
          });
          page.on("pageerror", (error) => {
            pageErrors.push(error.message);
            onProgress?.({ viewport: viewport.id, state_id: plan.state_id, stage: "page-error", page_errors: [error.message] });
          });
          await page.addInitScript(() => {
            Date.now = () => 1784150400000;
            window.__DATACANVAS_LISA_CAPTURE__ = true;
          });
          try {
            const url = pathToFileURL(demoPath);
            url.searchParams.set("state", plan.state_id);
            onProgress?.({ viewport: viewport.id, state_id: plan.state_id, stage: "page-goto" });
            await page.goto(url.href, { waitUntil: "load", timeout: pageTimeoutMs });
            const scene = page.locator(".prototype-scene[data-prototype-scene]");
            await scene.waitFor({ timeout: pageTimeoutMs });
            onProgress?.({ viewport: viewport.id, state_id: plan.state_id, stage: "stabilize" });
            await withPageDeadline({
              page,
              timeoutMs: pageTimeoutMs,
              stage: "stabilize",
              action: () => stabilizeBrowserCapture(page, captureStabilization),
            });
            const renderedStateId = await scene.getAttribute("data-state-id", { timeout: pageTimeoutMs });
            onProgress?.({ viewport: viewport.id, state_id: plan.state_id, stage: "geometry" });
            const geometry = await withPageDeadline({
              page,
              timeoutMs: pageTimeoutMs,
              stage: "geometry",
              action: () => collectGeometry(page),
            });
            const resourceIssues = inspectResourceUrls(geometry.resourceUrls ?? [], packageRoot);
            onProgress?.({ viewport: viewport.id, state_id: plan.state_id, stage: "accessibility" });
            const axe = await withPageDeadline({
              page,
              timeoutMs: pageTimeoutMs,
              stage: "accessibility",
              action: () => new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
                .analyze(),
            });
            results.push(runtimeRecord({
              browserName,
              plan,
              checks: runtimeChecks({
                renderedStateId,
                expectedStateId: plan.state_id,
                expectedSlots: plan.semantic_slots ?? [],
                consoleErrors,
                pageErrors,
                axeViolations: compactAxeViolations(axe.violations),
                geometry,
                resourceIssues,
                attemptedNetwork,
              }),
            }));
            onProgress?.({ viewport: viewport.id, state_id: plan.state_id, stage: "complete" });
          } finally {
            await page.close();
          }
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return {
    browserVersion,
    runtimeResults: results,
    browserLaunchArgs: [...appliedBrowserLaunchArgs],
  };
}

function readWorkerRequest(requestPath) {
  let request;
  try {
    request = JSON.parse(fs.readFileSync(requestPath, "utf8"));
  } catch {
    throw new Error("runtime browser-worker не прочитал request");
  }
  const keys = [
    "version",
    "browser",
    "package_root",
    "demo_path",
    "runtime_plans",
    "runtime_viewports",
    "capture_stabilization",
    "browser_launch_args",
    "page_timeout_ms",
  ];
  if (
    !exactKeys(request, keys) || request.version !== RUNTIME_WORKER_VERSION ||
    !RUNTIME_BROWSER_TYPES[request.browser] ||
    typeof request.package_root !== "string" || !path.isAbsolute(request.package_root) ||
    typeof request.demo_path !== "string" || !path.isAbsolute(request.demo_path) ||
    !Array.isArray(request.runtime_plans) || request.runtime_plans.length === 0 ||
    !Array.isArray(request.browser_launch_args) ||
    !request.browser_launch_args.every((argument) => typeof argument === "string") ||
    !Number.isInteger(request.page_timeout_ms) || request.page_timeout_ms <= 0
  ) {
    throw new Error("runtime browser-worker получил недопустимый request");
  }
  validateRuntimeViewports(request.runtime_viewports);
  return request;
}

export async function runRuntimeBrowserWorkerChild({ requestPath, resultPath }) {
  const request = readWorkerRequest(requestPath);
  const capture = await captureBrowser({
    browserType: RUNTIME_BROWSER_TYPES[request.browser],
    browserName: request.browser,
    runtimePlans: request.runtime_plans,
    runtimeViewports: request.runtime_viewports,
    packageRoot: request.package_root,
    demoPath: request.demo_path,
    captureStabilization: request.capture_stabilization,
    browserLaunchArgs: request.browser_launch_args,
    pageTimeoutMs: request.page_timeout_ms,
    onProgress: emitRuntimeProgress,
  });
  writeAtomicJson(resultPath, {
    version: RUNTIME_WORKER_VERSION,
    status: "success",
    browser: request.browser,
    browser_version: capture.browserVersion,
    browser_launch_args: capture.browserLaunchArgs,
    runtime_results: capture.runtimeResults,
  });
}

function cliValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export async function main() {
  const requestPath = cliValue("--request");
  const resultPath = cliValue("--result");
  if (!requestPath || !resultPath) {
    throw new Error("runtime browser-worker требует --request и --result");
  }
  await runRuntimeBrowserWorkerChild({ requestPath, resultPath });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`${sanitizeDiagnostic(error instanceof Error ? error.stack ?? error.message : error)}\n`);
    process.exitCode = 1;
  }
}
