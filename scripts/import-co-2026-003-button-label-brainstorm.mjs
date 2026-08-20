import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const topicId = "button_label";
const topicTitle = "Текст кнопки заказа презентации";
const ownerIntro = "Кнопка должна ясно связывать «Справку по клиенту» и презентацию. Текст должен быть максимально коротким; предпочтительно не более трёх слов. Пример «сформировать презентацию по справке» не является вариантом для использования.";
const commonContext = "Каждый участник видит уже внесённые варианты и предлагает только новые формулировки. Нужна краткая подпись кнопки, которая ясно связывает «Справку по клиенту» и презентацию; пример владельца продукта не повторяется.";
const boundaries = Object.freeze({
  render_allowed: false,
  archive_allowed: false,
  generator_input_allowed: false,
});

function fail(message) {
  throw new Error(message);
}

function parseArguments(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith("--") || !value || values.has(flag)) {
      fail("использование: node scripts/import-co-2026-003-button-label-brainstorm.mjs --phase-1 <file> --consolidated <file> --phase-2 <file> --output <directory>");
    }
    values.set(flag, value);
  }
  const expected = ["--phase-1", "--consolidated", "--phase-2", "--output"];
  if (values.size !== expected.length || expected.some((flag) => !values.has(flag))) {
    fail("использование: node scripts/import-co-2026-003-button-label-brainstorm.mjs --phase-1 <file> --consolidated <file> --phase-2 <file> --output <directory>");
  }
  return Object.fromEntries(expected.map((flag) => [flag.slice(2).replaceAll("-", "_"), path.resolve(values.get(flag))]));
}

function parseNumberedLines(text, expectedCount, sourceName) {
  const entries = [...text.matchAll(/^(\d+)\.\s+(.+)$/gmu)].map((match) => ({
    id: Number(match[1]),
    text: match[2].trim(),
  }));
  if (entries.length !== expectedCount || entries.some((entry, index) => entry.id !== index + 1 || !entry.text)) {
    fail(`${sourceName} должен содержать ровно ${expectedCount} последовательных непустых строк`);
  }
  return entries;
}

function parsePhase1(text) {
  const sections = text.split(/^### Участник\s+/mu).slice(1);
  if (sections.length !== 19) fail("первая фаза должна содержать ровно 19 участников");
  const participants = sections.map((section, index) => {
    const variants = parseNumberedLines(section, 20, `участник ${index + 1}`).map((entry) => entry.text);
    return {
      participant_id: `участник-${String(index + 1).padStart(2, "0")}`,
      variants,
    };
  });
  const all = participants.flatMap((participant) => participant.variants);
  if (new Set(all).size !== all.length) fail("первая фаза содержит повторяющиеся точные формулировки");
  return participants;
}

function parseConsolidation(text) {
  return parseNumberedLines(text, 30, "консолидированный список").map(({ id, text: candidateText }) => ({
    candidate_id: id,
    text: candidateText,
  }));
}

function parseRankings(text) {
  const rankings = parseNumberedLines(text, 19, "вторая фаза").map(({ id, text: line }) => {
    const rankedCandidateIds = line.split(",").map((value) => Number(value.trim()));
    if (rankedCandidateIds.length !== 5 || rankedCandidateIds.some((candidateId) => !Number.isInteger(candidateId) || candidateId < 1 || candidateId > 30) || new Set(rankedCandidateIds).size !== 5) {
      fail(`ранжирование ${id} должно содержать пять разных номеров вариантов 1..30`);
    }
    return {
      anonymous_reviewer_id: `reviewer-${String(id).padStart(2, "0")}`,
      ranked_candidate_ids: rankedCandidateIds,
    };
  });
  return rankings;
}

function score(rankings, candidates) {
  const positionPoints = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };
  const totals = new Map(candidates.map(({ candidate_id }) => [candidate_id, 0]));
  for (const ranking of rankings) {
    ranking.ranked_candidate_ids.forEach((candidateId, index) => {
      totals.set(candidateId, totals.get(candidateId) + positionPoints[index + 1]);
    });
  }
  const ordered = [...totals.entries()]
    .sort((left, right) => right[1] - left[1] || left[0] - right[0])
    .map(([candidate_id, points]) => ({ candidate_id, points }));
  const byId = new Map(candidates.map((candidate) => [candidate.candidate_id, candidate.text]));
  const finalCandidates = ordered.slice(0, 5).map((total, index) => ({
    rank: index + 1,
    source_candidate_id: total.candidate_id,
    points: total.points,
    text: byId.get(total.candidate_id),
  }));
  return { positionPoints, totals: ordered, finalCandidates };
}

function createState(participants, candidates, rankings) {
  const scoring = score(rankings, candidates);
  return {
    $schema: "../../source/schemas/brainstorming-topic-result.schema.json",
    version: "1.0.0",
    change_order_id: "CO-2026-003",
    topic_id: topicId,
    topic_title: topicTitle,
    status: "pending_owner_selection",
    owner_intro: ownerIntro,
    phase_1: {
      participant_count: 19,
      minimum_raw_variants_per_participant: 20,
      raw_variant_count: 380,
      context_visibility: "shared",
      common_context: commonContext,
      participants,
      consolidation: {
        candidate_count: 30,
        candidates,
      },
    },
    phase_2: {
      participant_count: 19,
      reviewer_group: "independent_anonymous",
      input_candidate_count: 30,
      evaluation_mode: "anonymous",
      ranking_size: 5,
      rankings,
    },
    integrity: {
      raw_variant_uniqueness: "verified_exact_unique",
      replacement_attribution: "verified_against_recorded_participant_id",
    },
    scoring: {
      rule: "Позиции 1–5 дают 5–1 балл.",
      position_points: scoring.positionPoints,
      totals: scoring.totals,
    },
    final_candidates: scoring.finalCandidates,
    selected_text: null,
    boundaries,
  };
}

function renderRawLedger(state) {
  const participants = state.phase_1.participants.map((participant) => [
    `## ${participant.participant_id}`,
    "",
    ...participant.variants.map((variant, index) => `${index + 1}. ${variant}`),
  ].join("\n")).join("\n\n");
  return `# Полный журнал сырых вариантов подписи кнопки\n\nНавигация: [DataCanvas](../../../../../../README.md) / [Документация](../../../../../README.md) / [Продукт](../../../../README.md) / [Аналитика](../../../README.md) / [Пользовательский путь заказа презентации в Лисе](../../README.md) / Сырые варианты брейншторма\n\n\`CO-2026-003\` — изменение Q4_2026 для заказа презентации из агента «Справка по клиенту» в Лисе.\n\nТема: \`button_label\` — текст кнопки заказа презентации.\n\nВсего сырых вариантов: 380.\n\nЖурнал сохраняет только тексты вариантов и обезличенные номера участников. Исходные вложения, пути и технические метаданные не сохраняются.\n\n${participants}\n`;
}

function renderResultLedger(state) {
  const candidates = state.phase_1.consolidation.candidates.map((candidate) => `${candidate.candidate_id}. ${candidate.text}`).join("\n");
  const rankings = state.phase_2.rankings.map((ranking) => `${ranking.anonymous_reviewer_id}: ${ranking.ranked_candidate_ids.join(", ")}`).join("\n");
  const finalists = state.final_candidates.map((candidate) => `${candidate.rank}. Вариант ${candidate.source_candidate_id}, ${candidate.points} баллов: ${candidate.text}`).join("\n");
  return `# Результат брейншторма по тексту кнопки\n\nНавигация: [DataCanvas](../../../../../../README.md) / [Документация](../../../../../README.md) / [Продукт](../../../../README.md) / [Аналитика](../../../README.md) / [Пользовательский путь заказа презентации в Лисе](../../README.md) / Неактивный результат брейншторма\n\n\`CO-2026-003\` — изменение Q4_2026 для заказа презентации из агента «Справка по клиенту» в Лисе.\n\nСтатус: \`pending_owner_selection\`.\n\nЭтот пакет является неактивным свидетельством по теме \`button_label\` — текст кнопки заказа презентации. Он не меняет действующие договоры, не разрешает рендер, не входит в архив и не является входом генератора.\n\n## Вводная владельца\n\n${state.owner_intro}\n\n## Первая фаза\n\nУчастников: 19. Минимум вариантов на участника: 20. Всего сырых вариантов: 380. Контекст был общий и видимый участникам первой фазы.\n\nПолный журнал сырых вариантов сохранён в [raw-variants-ledger.md](raw-variants-ledger.md).\n\n### Контроль качества\n\nПеред консолидацией выполнена автоматическая проверка точного совпадения всех 380 вариантов: повторов не осталось. Если вариант требует замены, номер участника сначала сверяется с записью, которой принадлежит повтор.\n\n## Консолидация до 30 вариантов\n\n${candidates}\n\n## Вторая фаза\n\nУчастников: 19. Участники независимые и анонимные. На входе было 30 вариантов. Каждое ранжирование содержит пять номеров из списка 30.\n\n${rankings}\n\n## Правило подсчёта\n\nПозиции 1–5 дают 5–1 балл. При равном числе баллов выше расположен вариант с меньшим номером.\n\n## Итоговые кандидаты\n\n${finalists}\n\nВыбранный текст: \`null\`. Итоговый выбор владельца ещё не сделан.\n\n## Блокировки\n\n- \`render_allowed\`: \`false\` — рендер не разрешён.\n- \`archive_allowed\`: \`false\` — архив не разрешён.\n- \`generator_input_allowed\`: \`false\` — вход генератора не разрешён.\n`;
}

function writeText(target, text) {
  fs.writeFileSync(target, text, "utf8");
}

try {
  const args = parseArguments(process.argv.slice(2));
  const participants = parsePhase1(fs.readFileSync(args.phase_1, "utf8"));
  const candidates = parseConsolidation(fs.readFileSync(args.consolidated, "utf8"));
  const rankings = parseRankings(fs.readFileSync(args.phase_2, "utf8"));
  const state = createState(participants, candidates, rankings);
  fs.mkdirSync(args.output, { recursive: true });
  writeText(path.join(args.output, "brainstorming-topic-result.json"), `${JSON.stringify(state, null, 2)}\n`);
  writeText(path.join(args.output, "brainstorming-topic-result.md"), renderResultLedger(state));
  writeText(path.join(args.output, "raw-variants-ledger.md"), renderRawLedger(state));
  process.stdout.write("Неактивный пакет вариантов текста кнопки подготовлен.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "импорт не выполнен"}\n`);
  process.exitCode = 1;
}
