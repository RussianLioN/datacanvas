import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const sourceRoot = path.join(root, packagePath, "source/browser-native-phone-prototype");
const runtimeRoot = path.join(root, packagePath, "candidate-evidence/browser-native-phone-prototype");
const outputPath = path.join(root, "docs/release/co-2026-003-browser-native-phone-prototype-release-evidence.json");
const check = process.argv.slice(2).includes("--check");

function fail(message) {
  throw new Error(`browser-native-phone-release-evidence: ${message}`);
}

function json(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  if (process.argv.slice(2).some((argument) => argument !== "--check")) fail("использование: node scripts/generate-browser-native-phone-prototype-release-evidence.mjs [--check]");
  const contract = json(path.join(sourceRoot, "browser-native-phone-prototype-contract.json"));
  const approval = json(path.join(sourceRoot, contract.release_boundary.final_approval_path));
  const manifest = json(path.join(runtimeRoot, "manifest.json"));
  const series = json(path.join(runtimeRoot, "external-4k-series-review/series-manifest.json"));
  if (contract.status !== "owner_final_approved" || approval.decision !== "approved" || approval.authorizations?.delivery_archive_allowed !== true || manifest.status !== contract.status || series.status !== "owner_series_approved" || series.owner_decision !== "approved") {
    fail("источники не подтверждают итоговый выпуск браузерного прототипа");
  }
  if (manifest.candidate_fingerprint?.algorithm !== "sha256" || !/^[a-f0-9]{64}$/u.test(manifest.candidate_fingerprint.sha256)) fail("манифест прототипа не содержит корректный отпечаток кандидата");
  const evidence = {
    version: "1.0.0",
    status: "owner_final_approved",
    change_order_id: contract.change_order_id,
    prototype_manifest_path: `${packagePath}/candidate-evidence/browser-native-phone-prototype/manifest.json`,
    external_series_manifest_path: `${packagePath}/candidate-evidence/browser-native-phone-prototype/external-4k-series-review/series-manifest.json`,
    final_approval_path: `${packagePath}/source/browser-native-phone-prototype/${contract.release_boundary.final_approval_path}`,
    candidate_fingerprint: manifest.candidate_fingerprint,
    runtime_mode: manifest.runtime_mode,
    phone_text_mode: manifest.product_text_source,
    raw_pdf_included: false,
    active_release_switch_allowed: contract.release_boundary.active_release_switch_allowed,
    delivery_archive_allowed: contract.release_boundary.archive_update_allowed
  };
  const expected = `${JSON.stringify(evidence, null, 2)}\n`;
  if (check) {
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== expected) fail("свежие доказательства чистового выпуска отсутствуют или устарели");
    process.stdout.write("Свежие доказательства чистового браузерного прототипа актуальны\n");
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, expected, "utf8");
  process.stdout.write("Свежие доказательства чистового браузерного прототипа сформированы\n");
}

try {
  main();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "доказательства не сформированы"}\n`);
  process.exitCode = 1;
}
