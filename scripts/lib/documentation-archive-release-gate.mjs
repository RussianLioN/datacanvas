import { spawnSync } from "node:child_process";

const LISA_PROTOTYPE_CHECK = "presentation_link_lisa_user_journey";
const LISA_PROTOTYPE_CHECK_COMMAND = ["scripts/generate-presentation-link-lisa-user-journey.mjs", "--check"];
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

function fail(message) {
  throw new Error(message);
}

function readCandidateFingerprint(readJson, root, relativePath, description) {
  const manifest = readJson(root, relativePath, description);
  const fingerprint = manifest.candidate_fingerprint?.sha256;
  if (typeof fingerprint !== "string" || !SHA256_PATTERN.test(fingerprint)) {
    fail(`${description} не содержит корректный отпечаток кандидата`);
  }
  return fingerprint;
}

function assertFinalReleaseBinding(root, gate, readJson) {
  if (!gate.release_approval_ledger_path) return null;

  const ledger = readJson(root, gate.release_approval_ledger_path, "реестр итоговой приёмки CO-2026-003");
  const finalRelease = ledger.final_release ?? {};
  if (
    finalRelease.status !== gate.required_final_release_status ||
    finalRelease.active_release_switch_allowed !== true ||
    finalRelease.high_resolution_render_allowed !== true ||
    finalRelease.delivery_archive_allowed !== true
  ) {
    fail("итоговая приёмка владельца CO-2026-003 не разрешает чистовой выпуск и архив поставки");
  }

  const ledgerFingerprint = finalRelease.candidate_fingerprint;
  if (typeof ledgerFingerprint !== "string" || !SHA256_PATTERN.test(ledgerFingerprint)) {
    fail("реестр итоговой приёмки CO-2026-003 не содержит отпечаток утверждённого кандидата");
  }
  if (ledger.documentation_cascade?.candidate_fingerprint !== ledgerFingerprint) {
    fail("отпечаток кандидата документационного каскада не совпадает с итоговой приёмкой");
  }

  const packageFingerprint = readCandidateFingerprint(
    readJson,
    root,
    gate.prototype_package_manifest_path,
    "манифест переносимого прототипа",
  );
  if (packageFingerprint !== ledgerFingerprint) {
    fail("отпечаток переносимого прототипа не совпадает с итоговой приёмкой");
  }

  const evidenceFingerprint = readCandidateFingerprint(
    readJson,
    root,
    gate.fresh_evidence_path,
    "свежие доказательства выпуска",
  );
  if (evidenceFingerprint !== ledgerFingerprint) {
    fail("отпечаток свежих доказательств не совпадает с итоговой приёмкой");
  }
  return ledgerFingerprint;
}

export function assertDocumentationArchiveReleaseGate({ root, contract, readJson, readRegularFile }) {
  if (!contract.release_gate) return { candidateFingerprint: null };
  const gate = contract.release_gate;
  const candidateFingerprint = assertFinalReleaseBinding(root, gate, readJson);

  const journeyContract = readJson(root, gate.journey_contract_path, "договор пути пользователя");
  const lifecycle = journeyContract.lifecycle ?? {};
  const mismatches = [
    ["content_review_status", gate.required_content_review_status],
    ["visual_release_status", gate.required_visual_release_status],
  ].filter(([field, expected]) => lifecycle[field] !== expected)
    .map(([field, expected]) => `${field}: ${String(lifecycle[field])} (требуется ${expected})`);
  if (mismatches.length > 0) {
    fail(`статусы договора пути пользователя не прошли выпускной барьер: ${mismatches.join("; ")}`);
  }
  if (gate.prototype_check !== LISA_PROTOTYPE_CHECK) {
    fail(`неподдерживаемая встроенная проверка прототипа: ${String(gate.prototype_check)}`);
  }
  readRegularFile(root, LISA_PROTOTYPE_CHECK_COMMAND[0], "встроенная проверка прототипа");
  const check = spawnSync("node", LISA_PROTOTYPE_CHECK_COMMAND, { cwd: root, encoding: "utf8" });
  if (check.error) fail(`не удалось запустить встроенную проверку прототипа: ${check.error.message}`);
  if (check.status !== 0) {
    const details = `${check.stdout}${check.stderr}`.trim();
    fail(`встроенная проверка прототипа не пройдена${details ? `:\n${details}` : ""}`);
  }
  return { candidateFingerprint };
}
