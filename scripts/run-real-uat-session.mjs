import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
const host = "127.0.0.1";
const defaultPort = 4177;
const runtimePath = "artifacts/examples/review-runtime-interactive.html";
const exportPath = "artifacts/manual/real-uat/review-runtime-state-export.json";
const sessionPath = "docs/product/ux/human-review-session-real.json";

function hasArg(name) {
  return process.argv.includes(name);
}

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function writeJson(relativePath, data) {
  fs.mkdirSync(path.dirname(absolute(relativePath)), { recursive: true });
  fs.writeFileSync(absolute(relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function runNpm(args) {
  console.log(`$ npm ${args.join(" ")}`);
  const result = spawnSync("npm", args, {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    fail(`command failed: npm ${args.join(" ")}`);
  }
}

function runPreflight() {
  runNpm(["run", "validate:real-uat-preflight"]);
  runNpm(["run", "validate:real-uat-operator-handoff"]);
  runNpm(["run", "validate:review-runtime-interactive"]);
}

function runPostExportChecks() {
  runNpm(["run", "validate:real-uat-import", "--", "--input", exportPath, "--dry-run"]);
  runNpm(["run", "prepare:real-uat-session", "--", "--input", exportPath, "--dry-run"]);
  runNpm(["run", "prepare:real-uat-session", "--", "--input", exportPath]);
  runNpm(["run", "validate:real-uat-readiness"]);
}

function injectRunner(html) {
  const panel = `
  <style>
    #uat-runner-panel {
      position: sticky;
      bottom: 0;
      z-index: 10;
      border: 1px solid #0f766e;
      background: #ecfdf5;
      color: #064e3b;
      padding: 12px 18px;
      font: 14px system-ui, sans-serif;
    }
    #uat-runner-panel button {
      margin-left: 8px;
      border-color: #0f766e;
      background: #0f766e;
      color: #ffffff;
    }
  </style>
  <div id="uat-runner-panel">
    Real UAT runner: выполните review flow, нажмите Export, затем дождитесь подтверждения записи evidence.
    <button id="uat-runner-submit" type="button">Передать state в runner</button>
    <span id="uat-runner-status"></span>
  </div>
  <script>
    (() => {
      const status = document.getElementById("uat-runner-status");
      const storageKey = "datacanvas.review.runtime.state.v0.1";
      const realUatMode = document.getElementById("real-uat-mode");
      const resetButton = document.getElementById("reset-runtime");

      localStorage.removeItem(storageKey);
      resetButton?.click();
      if (realUatMode && !realUatMode.checked) {
        realUatMode.checked = true;
        realUatMode.dispatchEvent(new Event("change", { bubbles: true }));
      }
      status.textContent = " Real UAT включен; старое fixture-состояние сброшено.";

      function parseCurrentState() {
        const stateText = document.getElementById("state-json")?.textContent || "";
        return JSON.parse(stateText);
      }

      function stateIsRealUat(runtimeState) {
        return runtimeState.status === "recorded_real_user"
          && runtimeState.session_kind === "real_user"
          && runtimeState.current_state === "approved"
          && runtimeState.export_allowed === true;
      }

      function normalizeRuntimeState(runtimeState) {
        const evidencePaths = new Set([
          ...(runtimeState.evidence_paths || []),
          "artifacts/examples/review-runtime-interactive.html",
          "docs/product/ux/review-runtime-state-fixture.json",
          "docs/product/ux/human-review-flow.json",
          "docs/product/ux/review-ui-fixture.json",
          "docs/product/ux/human-review-session-minimal.json",
          "scripts/validate-review-runtime-interactive.mjs"
        ]);
        return {
          ...runtimeState,
          evidence_paths: [...evidencePaths]
        };
      }

      async function submitState() {
        const runtimeState = normalizeRuntimeState(parseCurrentState());
        if (!stateIsRealUat(runtimeState)) {
          status.textContent = " Ошибка: включите Real UAT, выполните flow с начала до approved и нажмите Export.";
          return;
        }
        status.textContent = " Передаю real UAT state...";
        const response = await fetch("/uat-export", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(runtimeState)
        });
        const result = await response.json();
        status.textContent = response.ok
          ? " Готово: " + result.message
          : " Ошибка: " + result.error;
      }
      document.getElementById("uat-runner-submit").addEventListener("click", submitState);
      document.getElementById("runtime-state-json")?.addEventListener("click", (event) => {
        event.preventDefault();
        submitState();
      });
      document.querySelector('[data-action="export"]')?.addEventListener("click", () => {
        setTimeout(submitState, 250);
      });
    })();
  </script>`;
  return html.replace("</body>", `${panel}\n</body>`);
}

function validateRuntimeState(runtimeState) {
  const text = JSON.stringify(runtimeState);
  if (text.includes("TO_BE_FILLED")) {
    throw new Error("runtime export contains TO_BE_FILLED placeholder");
  }
  if (runtimeState.status !== "recorded_real_user") {
    throw new Error("runtime export must have status=recorded_real_user");
  }
  if (runtimeState.session_kind !== "real_user") {
    throw new Error("runtime export must have session_kind=real_user");
  }
  if (runtimeState.current_state !== "approved" || runtimeState.export_allowed !== true) {
    throw new Error("runtime export must be approved and export_allowed=true");
  }
  const unsafeActorPattern = /fixture|template|sample|placeholder|interactive-|TO_BE_FILLED/i;
  for (const event of runtimeState.transition_history || []) {
    if (unsafeActorPattern.test(event.actor_id || "")) {
      throw new Error("runtime export contains forbidden actor_id marker");
    }
  }
  const actions = new Set((runtimeState.transition_history || []).map((event) => event.action));
  for (const action of ["submit_for_review", "comment", "record_decision", "export"]) {
    if (!actions.has(action)) {
      throw new Error(`runtime export is missing required action: ${action}`);
    }
  }
}

function openBrowser(url) {
  if (hasArg("--no-open")) return;
  if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    console.log(`Откройте URL вручную: ${url}`);
  }
}

function checkOnly() {
  for (const requiredPath of [
    runtimePath,
    "docs/product/ux/real-uat-one-command-runner.json",
    "docs/product/ux/real-uat-one-command-runner.md",
    "scripts/validate-real-uat-one-command-runner.mjs",
    "scripts/prepare-real-uat-session.mjs",
  ]) {
    if (!fs.existsSync(absolute(requiredPath))) {
      fail(`required file does not exist: ${requiredPath}`);
    }
  }
  const source = readText("scripts/run-real-uat-session.mjs");
  for (const requiredText of ["/uat-export", "validate:real-uat-import", "prepare:real-uat-session", "recorded_real_user"]) {
    if (!source.includes(requiredText)) {
      fail(`runner source is missing required text: ${requiredText}`);
    }
  }
  console.log("real UAT one-command runner validation passed");
}

if (hasArg("--check")) {
  checkOnly();
  process.exit(0);
}

if (fs.existsSync(absolute(exportPath)) && !hasArg("--force")) {
  fail(`${exportPath} already exists; use --force only after confirming overwrite is intended`);
}
if (fs.existsSync(absolute(sessionPath)) && !hasArg("--force")) {
  fail(`${sessionPath} already exists; use --force only after confirming overwrite is intended`);
}

runPreflight();

const port = Number(argValue("--port", String(defaultPort)));
const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);
  if (request.method === "GET" && requestUrl.pathname === "/") {
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
    });
    response.end(injectRunner(readText(runtimePath)));
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/status") {
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "application/json",
    });
    response.end(JSON.stringify({ status: "ready", exportPath, sessionPath }));
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/uat-export") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        const runtimeState = JSON.parse(body);
        validateRuntimeState(runtimeState);
        writeJson(exportPath, runtimeState);
        runPostExportChecks();
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({
          message: `saved ${exportPath} and ${sessionPath}`,
          exportPath,
          sessionPath,
        }));
        setTimeout(() => server.close(), 500);
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("not found");
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}/?runner=${Date.now()}`;
  console.log(`Real UAT runner started: ${url}`);
  console.log("После успешного export runner сохранит evidence и остановится.");
  openBrowser(url);
});
