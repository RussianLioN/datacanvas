import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const journeyRoot = "docs/product/analysis/presentation-link-lisa-user-journey";
const packageRoot = `${journeyRoot}/candidate-evidence/email-subject`;
const ownerIntro = "Тема письма должна помогать найти среди многих писем презентацию, изготовленную по справке о конкретном клиенте. Она обязательно содержит точное название ООО «Водолей Трейд», кратко и делово сообщает о готовой презентации и не повторяет стиль приложенного образца. Форматы вложений и адреса получателей в теме не указываются.";

const candidateTexts = [
  "Готовая презентация — ООО «Водолей Трейд»",
  "ООО «Водолей Трейд»: презентация готова",
  "ООО «Водолей Трейд» — готовая презентация",
  "ООО «Водолей Трейд» — презентация подготовлена",
  "ООО «Водолей Трейд»: презентация завершена",
  "ООО «Водолей Трейд»: итоговая презентация готова",
  "ООО «Водолей Трейд»: подготовлена презентация",
  "ООО «Водолей Трейд»: презентация сформирована",
  "Готовая презентация по ООО «Водолей Трейд»",
  "Презентация для ООО «Водолей Трейд» готова",
  "Завершённая презентация — ООО «Водолей Трейд»",
  "Итоговая презентация — ООО «Водолей Трейд»",
  "ООО «Водолей Трейд» — презентация завершена",
  "ООО «Водолей Трейд»: презентация подготовлена",
  "Презентация готова: ООО «Водолей Трейд»",
  "ООО «Водолей Трейд» — презентация сформирована",
  "ООО «Водолей Трейд»: готовая презентация",
  "Подготовленная презентация — ООО «Водолей Трейд»",
  "Презентация ООО «Водолей Трейд» подготовлена",
  "Презентация подготовлена — ООО «Водолей Трейд»",
  "Готовая презентация компании ООО «Водолей Трейд»",
  "Итоговая презентация ООО «Водолей Трейд» готова",
  "ООО «Водолей Трейд» — готовая версия презентации",
  "ООО «Водолей Трейд» — завершённая презентация",
  "ООО «Водолей Трейд» — подготовленная презентация",
  "ООО «Водолей Трейд»: готовый материал презентации",
  "ООО «Водолей Трейд»: презентационный материал готов",
  "Подготовлена презентация — ООО «Водолей Трейд»",
  "ООО «Водолей Трейд»: презентационные материалы готовы",
  "Презентация ООО «Водолей Трейд» готова",
];

const rankings = [
  [2, 3, 4, 30, 10], [2, 3, 17, 30, 1], [2, 3, 4, 30, 1], [2, 3, 30, 10, 1], [2, 30, 10, 4, 1],
  [2, 3, 30, 4, 6], [2, 30, 4, 3, 1], [2, 4, 3, 30, 6], [3, 2, 4, 17, 30], [2, 3, 30, 1, 4],
  [2, 3, 30, 4, 14], [2, 6, 4, 17, 3], [2, 30, 3, 4, 6], [2, 3, 17, 30, 10], [2, 3, 17, 4, 30],
  [2, 3, 30, 1, 6], [2, 3, 14, 4, 30], [2, 4, 30, 19, 3], [2, 30, 3, 1, 15],
];

function fail(message) {
  throw new Error(message);
}

function parseArguments(args) {
  if (args.length === 0) return { check: false };
  if (args.length === 1 && args[0] === "--check") return { check: true };
  fail("использование: node scripts/generate-co-2026-003-email-subject-brainstorm-evidence.mjs [--check]");
}

function readParticipants(root) {
  const rawLedger = fs.readFileSync(path.join(root, packageRoot, "raw-variants-ledger.md"), "utf8");
  const sections = [...rawLedger.matchAll(/^## (участник-\d{2})\n\n((?:(?!^## ).)*)/gmsu)];
  if (sections.length !== 19) fail("raw variants ledger must contain exactly 19 participant sections");
  const participants = sections.map((section, index) => {
    const variants = section[2].split(/\r?\n/u)
      .map((line) => line.match(/^(?:[1-9]|1\d|20)\.\s+(.+)$/u)?.[1])
      .filter(Boolean);
    if (section[1] !== `участник-${String(index + 1).padStart(2, "0")}` || variants.length !== 20) {
      fail("each raw variants ledger section must contain its ordered participant id and exactly 20 variants");
    }
    return { participant_id: section[1], variants };
  });
  const rawVariants = participants.flatMap((participant) => participant.variants);
  if (rawVariants.length !== 380) fail("phase 1 must contain exactly 380 raw variants");
  for (const candidate of candidateTexts) {
    if (!rawVariants.includes(candidate)) fail("each consolidated candidate must originate from saved raw evidence");
  }
  return participants;
}

function buildState(participants) {
  const totals = Array.from({ length: 30 }, (_, index) => ({ candidate_id: index + 1, points: 0 }));
  const pointsByPosition = [5, 4, 3, 2, 1];
  rankings.forEach((ranking) => ranking.forEach((candidateId, index) => {
    totals[candidateId - 1].points += pointsByPosition[index];
  }));
  totals.sort((left, right) => right.points - left.points || left.candidate_id - right.candidate_id);
  const candidates = candidateTexts.map((text, index) => ({ candidate_id: index + 1, text }));
  const candidateById = new Map(candidates.map((candidate) => [candidate.candidate_id, candidate.text]));
  return {
    "$schema": "../../source/schemas/brainstorming-topic-result.schema.json",
    version: "1.0.0",
    change_order_id: "CO-2026-003",
    topic_id: "email_subject",
    topic_title: "Тема письма с презентацией",
    status: "pending_owner_selection",
    owner_intro: ownerIntro,
    phase_1: {
      participant_count: 19,
      minimum_raw_variants_per_participant: 20,
      raw_variant_count: 380,
      context_visibility: "parallel_common_context",
      common_context: "Все участники получили одинаковую вводную владельца продукта. Варианты собраны параллельно, а явные дубли и близкие повторы отсеяны центральной проверкой перед выбором 30 кандидатов.",
      participants,
      consolidation: { candidate_count: 30, candidates },
    },
    phase_2: {
      participant_count: 19,
      reviewer_group: "independent_anonymous",
      input_candidate_count: 30,
      evaluation_mode: "anonymous",
      ranking_size: 5,
      rankings: rankings.map((ranked_candidate_ids, index) => ({
        anonymous_reviewer_id: `reviewer-${String(index + 1).padStart(2, "0")}`,
        ranked_candidate_ids,
      })),
    },
    scoring: {
      rule: "Позиции 1–5 дают 5–1 балл.",
      position_points: { "1": 5, "2": 4, "3": 3, "4": 2, "5": 1 },
      totals,
    },
    final_candidates: totals.slice(0, 5).map((total, index) => ({
      rank: index + 1,
      source_candidate_id: total.candidate_id,
      points: total.points,
      text: candidateById.get(total.candidate_id),
    })),
    selected_text: null,
    boundaries: { render_allowed: false, archive_allowed: false, generator_input_allowed: false },
  };
}

function renderResult(state) {
  const candidateLines = state.phase_1.consolidation.candidates.map((candidate) => `${candidate.candidate_id}. ${candidate.text}`).join("\n");
  const rankingLines = state.phase_2.rankings.map((ranking) => `${ranking.anonymous_reviewer_id}: ${ranking.ranked_candidate_ids.join(", ")}`).join("\n");
  const finalLines = state.final_candidates.map((candidate) => `${candidate.rank}. Вариант ${candidate.source_candidate_id}, ${candidate.points} баллов: ${candidate.text}`).join("\n");
  return `# Результат брейншторма по теме письма с презентацией\n\nСтатус: \`pending_owner_selection\`.\n\nЭтот пакет содержит только кандидаты. Он не меняет действующие договоры, не разрешает рендер, не входит в архив и не является входом генератора.\n\n## Вводная владельца\n\n${ownerIntro}\n\n## Первая фаза\n\nУчастников: 19. Минимум вариантов на участника: 20. Всего сырых вариантов: 380. Все участники получили общую вводную и работали параллельно; перед второй фазой центральная проверка исключила явные дубли и близкие повторы.\n\nПолный журнал сохранён в [raw-variants-ledger.md](raw-variants-ledger.md).\n\n## Консолидация до 30 вариантов\n\n${candidateLines}\n\n## Вторая фаза\n\nУчастников: 19. Участники независимые и анонимные. На входе было 30 вариантов. Каждое ранжирование содержит пять номеров из списка 30.\n\n${rankingLines}\n\n## Правило подсчёта\n\nПозиции 1–5 дают 5–1 балл. При равном числе баллов выше расположен вариант с меньшим номером.\n\n## Итоговые кандидаты\n\n${finalLines}\n\nВыбранный текст: \`null\`. Итоговый выбор владельца ещё не сделан.\n\n## Блокировки\n\n- \`render_allowed\`: \`false\` — рендер не разрешён.\n- \`archive_allowed\`: \`false\` — архив не разрешён.\n- \`generator_input_allowed\`: \`false\` — вход генератора не разрешён.\n`;
}

function expectedFiles(root) {
  const participants = readParticipants(root);
  const state = buildState(participants);
  return new Map([
    [path.join(root, packageRoot, "brainstorming-topic-result.json"), `${JSON.stringify(state, null, 2)}\n`],
    [path.join(root, packageRoot, "brainstorming-topic-result.md"), renderResult(state)],
  ]);
}

try {
  const { check } = parseArguments(process.argv.slice(2));
  const root = process.cwd();
  for (const [filePath, content] of expectedFiles(root)) {
    if (check) {
      if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== content) fail(`generated brainstorm evidence is stale: ${path.relative(root, filePath)}`);
    } else {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }
  }
  process.stdout.write(check ? "Свидетельства брейншторма актуальны.\n" : "Свидетельства брейншторма сформированы.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "формирование не выполнено"}\n`);
  process.exitCode = 1;
}
