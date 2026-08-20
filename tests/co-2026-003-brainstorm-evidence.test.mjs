import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

const root = path.resolve(new URL("../", import.meta.url).pathname);
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/delivery-success-message";
const statePath = path.join(packagePath, "brainstorming-topic-result.json");
const ledgerPath = path.join(packagePath, "brainstorming-topic-result.md");
const rawLedgerPath = path.join(packagePath, "raw-variants-ledger.md");
const schemaPath = "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-topic-result.schema.json";
const validatorPath = "scripts/validate-co-2026-003-brainstorm-evidence.mjs";
const generationStartedGeneratorPath = "scripts/generate-co-2026-003-generation-started-brainstorm-evidence.mjs";
const negativeFixturePath = "tests/fixtures/co-2026-003-brainstorm-evidence-negative.json";
const registryPath = "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/candidate-evidence-registry.json";
const buttonPackagePath = "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/button-label";
const buttonStatePath = path.join(buttonPackagePath, "brainstorming-topic-result.json");
const buttonLedgerPath = path.join(buttonPackagePath, "brainstorming-topic-result.md");
const buttonRawLedgerPath = path.join(buttonPackagePath, "raw-variants-ledger.md");
const generationStartedPackagePath = "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/generation-started-message";
const generationStartedStatePath = path.join(generationStartedPackagePath, "brainstorming-topic-result.json");
const generationStartedLedgerPath = path.join(generationStartedPackagePath, "brainstorming-topic-result.md");
const generationStartedRawLedgerPath = path.join(generationStartedPackagePath, "raw-variants-ledger.md");
const registrySchemaPath = "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/candidate-evidence-registry.schema.json";
const brainstormingContractPath = "docs/product/analysis/presentation-link-lisa-user-journey/source/brainstorming-contract.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function writeJson(directory, relativePath, value) {
  const target = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(directory, relativePath, value) {
  const target = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}

function runValidator(extraArgs = [], cwd = root) {
  return spawnSync(process.execPath, [path.join(root, validatorPath), ...extraArgs], {
    cwd,
    encoding: "utf8",
  });
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"}: ${error.message}`).join("; ");
}

function validateWithSchema(data) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(readJson(schemaPath));
  const passed = validate(data);
  return { passed, errorText: formatAjvErrors(validate.errors) };
}

function applyMutation(base, scenario) {
  const data = structuredClone(base);
  const state = data[statePath];
  if (scenario.mutation === "phase_1_18_participants") {
    state.phase_1.participant_count = 18;
    state.phase_1.participants = state.phase_1.participants.slice(0, 18);
  } else if (scenario.mutation === "phase_1_379_variants") {
    state.phase_1.raw_variant_count = 379;
    state.phase_1.participants[18].variants = state.phase_1.participants[18].variants.slice(0, 19);
  } else if (scenario.mutation === "phase_1_29_consolidated") {
    state.phase_1.consolidation.candidate_count = 29;
    state.phase_1.consolidation.candidates = state.phase_1.consolidation.candidates.slice(0, 29);
  } else if (scenario.mutation === "phase_2_not_anonymous") {
    state.phase_2.evaluation_mode = "named";
  } else if (scenario.mutation === "phase_2_18_votes") {
    state.phase_2.participant_count = 18;
    state.phase_2.rankings = state.phase_2.rankings.slice(0, 18);
  } else if (scenario.mutation === "four_final_candidates") {
    state.final_candidates = state.final_candidates.slice(0, 4);
  } else if (scenario.mutation === "six_final_candidates") {
    state.final_candidates.push({ ...state.final_candidates[4], rank: 6, source_candidate_id: 14 });
  } else if (scenario.mutation === "selected_text_filled") {
    state.selected_text = state.final_candidates[0].text;
  } else if (scenario.mutation === "render_enabled") {
    state.boundaries.render_allowed = true;
  } else if (scenario.mutation === "archive_enabled") {
    state.boundaries.archive_allowed = true;
  } else if (scenario.mutation === "generator_input_enabled") {
    state.boundaries.generator_input_allowed = true;
  } else if (scenario.mutation === "local_path") {
    state.owner_intro = `${state.owner_intro} /private/tmp/source`;
  } else if (scenario.mutation === "docx_reference") {
    state.owner_intro = `${state.owner_intro} SOURCE.DOCX`;
  } else if (scenario.mutation === "email_reference") {
    state.owner_intro = `${state.owner_intro} owner@example.com`;
  } else if (scenario.mutation === "sha256_reference") {
    state.owner_intro = `${state.owner_intro} aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
  } else {
    throw new Error(`неизвестная мутация ${scenario.mutation}`);
  }
  return data;
}

test("пакет свидетельств по теме delivery_success_message сохранён только как неактивный кандидат", () => {
  for (const relativePath of [statePath, ledgerPath, rawLedgerPath, schemaPath, validatorPath]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `отсутствует ${relativePath}`);
  }

  const state = readJson(statePath);
  assert.equal(state.change_order_id, "CO-2026-003");
  assert.equal(state.topic_id, "delivery_success_message");
  assert.equal(state.status, "pending_owner_selection");
  assert.equal(state.phase_1.participant_count, 19);
  assert.equal(state.phase_1.raw_variant_count, 380);
  assert.equal(state.phase_1.participants.length, 19);
  assert.equal(state.phase_1.participants.every((participant) => participant.variants.length >= 20), true);
  assert.equal(state.phase_1.consolidation.candidates.length, 30);
  assert.equal(state.phase_2.participant_count, 19);
  assert.equal(state.phase_2.rankings.length, 19);
  assert.equal(state.scoring.position_points["1"], 5);
  assert.deepEqual(state.final_candidates.map((candidate) => candidate.source_candidate_id), [1, 2, 9, 6, 14]);
  assert.equal(state.selected_text, null);
  assert.deepEqual(state.boundaries, {
    render_allowed: false,
    archive_allowed: false,
    generator_input_allowed: false,
  });

  const stateText = JSON.stringify(state);
  for (const forbidden of [/\/private\/tmp/u, /\/Users\//u, /file:/iu, /\.docx\b/iu, /@[a-z0-9.-]+\.[a-z]{2,}/iu]) {
    assert.doesNotMatch(stateText, forbidden);
  }
  assert.match(readText(ledgerPath), /Статус: `pending_owner_selection`/u);
  assert.match(readText(rawLedgerPath), /Всего сырых вариантов: 380/u);

  const result = runValidator();
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
});

test("JSON Schema напрямую отклоняет лишний вариант, DOCX, почту, SHA и вход генератора", () => {
  const base = readJson(statePath);
  const cases = [
    {
      id: "twenty-first-participant-variant",
      mutate: (state) => state.phase_1.participants[0].variants.push("Лишний двадцать первый вариант."),
      expected: "must NOT have more than 20 items",
    },
    {
      id: "uppercase-docx",
      mutate: (state) => state.owner_intro = `${state.owner_intro} SOURCE.DOCX`,
      expected: "must NOT be valid",
    },
    {
      id: "email-address",
      mutate: (state) => state.owner_intro = `${state.owner_intro} owner@example.com`,
      expected: "must NOT be valid",
    },
    {
      id: "sha256",
      mutate: (state) => state.owner_intro = `${state.owner_intro} aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
      expected: "must NOT be valid",
    },
    {
      id: "generator-input-enabled",
      mutate: (state) => state.boundaries.generator_input_allowed = true,
      expected: "/boundaries/generator_input_allowed: must be equal to constant",
    },
  ];

  for (const scenario of cases) {
    const state = structuredClone(base);
    scenario.mutate(state);
    const result = validateWithSchema(state);
    assert.equal(result.passed, false, `${scenario.id}: схема должна была отклонить нарушение`);
    assert.match(result.errorText, new RegExp(scenario.expected), `${scenario.id}: ${result.errorText}`);
  }
});

test("узкий валидатор отклоняет нарушения пакета свидетельств брейншторма", () => {
  const fixture = readJson(negativeFixturePath);
  const base = {
    [statePath]: readJson(statePath),
    [ledgerPath]: readText(ledgerPath),
    [rawLedgerPath]: readText(rawLedgerPath),
    [buttonStatePath]: readJson(buttonStatePath),
    [buttonLedgerPath]: readText(buttonLedgerPath),
    [buttonRawLedgerPath]: readText(buttonRawLedgerPath),
    [generationStartedStatePath]: readJson(generationStartedStatePath),
    [generationStartedLedgerPath]: readText(generationStartedLedgerPath),
    [generationStartedRawLedgerPath]: readText(generationStartedRawLedgerPath),
    [schemaPath]: readJson(schemaPath),
    [registryPath]: readJson(registryPath),
    [registrySchemaPath]: readJson(registrySchemaPath),
    [brainstormingContractPath]: readJson(brainstormingContractPath),
  };

  for (const scenario of fixture.scenarios) {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "co-2026-003-brainstorm-evidence-"));
    try {
      const mutated = applyMutation(base, scenario);
      for (const [relativePath, value] of Object.entries(mutated)) {
        if (typeof value === "string") writeText(temporaryDirectory, relativePath, value);
        else writeJson(temporaryDirectory, relativePath, value);
      }

      const result = runValidator(["--root", temporaryDirectory], temporaryDirectory);
      assert.notEqual(result.status, 0, `${scenario.id}: валидатор должен был отклонить нарушение`);
      assert.match(result.stderr, new RegExp(scenario.expected_error), `${scenario.id}: ${result.stderr}`);
    } finally {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  }
});

test("реестр неактивных пакетов сохраняет button_label и не включает варианты в выпуск", () => {
  for (const relativePath of [registryPath, buttonStatePath]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `отсутствует ${relativePath}`);
  }

  const registry = readJson(registryPath);
  assert.deepEqual(registry.topic_ids, ["button_label", "generation_started_message", "delivery_success_message"]);
  assert.deepEqual(registry.package_paths, [
    "candidate-evidence/button-label",
    "candidate-evidence/generation-started-message",
    "candidate-evidence/delivery-success-message",
  ]);

  const state = readJson(buttonStatePath);
  assert.equal(state.topic_id, "button_label");
  assert.equal(state.phase_1.participant_count, 19);
  assert.equal(state.phase_1.raw_variant_count, 380);
  assert.equal(state.phase_1.consolidation.candidates.length, 30);
  assert.equal(state.phase_2.rankings.length, 19);
  assert.deepEqual(state.final_candidates.map((candidate) => candidate.source_candidate_id), [15, 30, 29, 17, 21]);
  assert.equal(state.selected_text, null);
  assert.deepEqual(state.boundaries, {
    render_allowed: false,
    archive_allowed: false,
    generator_input_allowed: false,
  });

  const result = runValidator();
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
});

test("реестр включает завершённый двухфазный брейншторм сообщения о начале формирования", () => {
  for (const relativePath of [generationStartedStatePath, generationStartedLedgerPath, generationStartedRawLedgerPath, generationStartedGeneratorPath]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `отсутствует ${relativePath}`);
  }

  const registry = readJson(registryPath);
  assert.deepEqual(registry.topic_ids, ["button_label", "generation_started_message", "delivery_success_message"]);
  assert.deepEqual(registry.package_paths, [
    "candidate-evidence/button-label",
    "candidate-evidence/generation-started-message",
    "candidate-evidence/delivery-success-message",
  ]);

  const state = readJson(generationStartedStatePath);
  assert.equal(state.topic_id, "generation_started_message");
  assert.equal(state.owner_intro.includes("не более 20 минут"), true);
  assert.equal(state.owner_intro.includes("SIGMA и OMEGA"), true);
  assert.equal(state.phase_1.participant_count, 19);
  assert.equal(state.phase_1.raw_variant_count, 380);
  assert.equal(state.phase_1.consolidation.candidates.length, 30);
  assert.equal(state.phase_2.rankings.length, 19);
  assert.equal(state.final_candidates.length, 5);
  assert.equal(state.selected_text, null);
  assert.deepEqual(state.boundaries, {
    render_allowed: false,
    archive_allowed: false,
    generator_input_allowed: false,
  });

  const result = runValidator();
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);

  const generatorResult = spawnSync(process.execPath, [path.join(root, generationStartedGeneratorPath), "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(generatorResult.status, 0, `${generatorResult.stderr}\n${generatorResult.stdout}`);
});

test("узкий валидатор проверяет границу неактивности у каждого пакета, записанного в реестре", () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "co-2026-003-brainstorm-registry-"));
  try {
    const files = [
      statePath,
      ledgerPath,
      rawLedgerPath,
      buttonStatePath,
      buttonLedgerPath,
      buttonRawLedgerPath,
      generationStartedStatePath,
      generationStartedLedgerPath,
      generationStartedRawLedgerPath,
      schemaPath,
      registryPath,
      registrySchemaPath,
      brainstormingContractPath,
    ];
    for (const relativePath of files) {
      const source = path.join(root, relativePath);
      const destination = path.join(temporaryDirectory, relativePath);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
    }
    const state = JSON.parse(fs.readFileSync(path.join(temporaryDirectory, buttonStatePath), "utf8"));
    state.boundaries.render_allowed = true;
    writeJson(temporaryDirectory, buttonStatePath, state);

    const result = runValidator(["--root", temporaryDirectory], temporaryDirectory);
    assert.notEqual(result.status, 0, "валидатор не должен пропускать разрешённый рендер зарегистрированного пакета");
    assert.match(result.stderr, /boundaries\/render_allowed: must be equal to constant/);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
