import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const journeyRoot = "docs/product/analysis/presentation-link-lisa-user-journey";
const packageRoot = `${journeyRoot}/candidate-evidence/generation-started-message`;
const ownerIntro = "После принятия данных сообщение должно сохранить время ЧЧ:ММ, обещание «не более 20 минут» и указание, что презентация будет направлена по электронной почте в SIGMA и OMEGA. Нужен краткий деловой понятный текст о времени и результате без грубых побудительных предложений: нельзя предлагать переключиться, заняться чем-либо или проверить почту. Повторный заказ в той же паре сеанс/пользователь после принятия данных заблокирован.";

const candidateTexts = [
  "Формирование презентации началось в ЧЧ:ММ. Срок — не более 20 минут; затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "В ЧЧ:ММ началось формирование презентации. Оно займет не более 20 минут, после чего презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Данные приняты. Формирование презентации началось в ЧЧ:ММ; срок — не более 20 минут. Затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Формирование презентации по принятым данным началось в ЧЧ:ММ. На подготовку отведено не более 20 минут, после чего презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Формирование презентации на основе принятых данных началось в ЧЧ:ММ; срок — не более 20 минут. Далее презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Принятые данные переданы на формирование презентации в ЧЧ:ММ; срок — не более 20 минут. Далее презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Формирование презентации началось в ЧЧ:ММ и займет не более 20 минут. После завершения презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "В ЧЧ:ММ начато формирование презентации. Срок выполнения — не более 20 минут; по завершении презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "С ЧЧ:ММ выполняется формирование презентации. Срок — не более 20 минут; после формирования презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Подготовка презентации началась в ЧЧ:ММ. На формирование потребуется не более 20 минут, затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Презентация формируется с ЧЧ:ММ. Срок формирования — не более 20 минут; затем она будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Данные приняты. В ЧЧ:ММ запущено формирование презентации. Срок подготовки — не более 20 минут; затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "В ЧЧ:ММ началось создание презентации. Срок — не более 20 минут; по завершении презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Формирование презентации началось в ЧЧ:ММ. Не более 20 минут потребуется на подготовку, после чего презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "В ЧЧ:ММ начато формирование презентации со сроком не более 20 минут. После завершения презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Подготовка презентации начата в ЧЧ:ММ и продлится не более 20 минут. Затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "В ЧЧ:ММ началась работа над формированием презентации. Срок — не более 20 минут. Затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Формирование презентации запущено в ЧЧ:ММ со сроком не более 20 минут. Затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Данные приняты. Презентация формируется с ЧЧ:ММ. Срок формирования — не более 20 минут, далее она будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Формирование презентации выполняется с ЧЧ:ММ. Оно займет не более 20 минут, затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Презентация поставлена в формирование в ЧЧ:ММ. Подготовка займет не более 20 минут, после чего презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "В ЧЧ:ММ началась работа над презентацией. Формирование займет не более 20 минут, после чего презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Данные приняты. Формирование презентации уже началось в ЧЧ:ММ; срок — не более 20 минут. Затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Данные приняты. В ЧЧ:ММ началась подготовка презентации. На формирование отведено не более 20 минут; затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "В ЧЧ:ММ запущено формирование презентации. Оно будет завершено не более чем за 20 минут, затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Формирование презентации уже началось в ЧЧ:ММ. Срок — не более 20 минут. Затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Время начала формирования презентации — ЧЧ:ММ. Срок выполнения — не более 20 минут; затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Формирование презентации начато в ЧЧ:ММ. Срок подготовки — не более 20 минут, затем презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
  "Презентация поставлена на формирование в ЧЧ:ММ. Срок — не более 20 минут, затем она будет направлена по электронной почте только в SIGMA и OMEGA.",
  "В ЧЧ:ММ запущено создание презентации. Срок — не более 20 минут. По завершении презентация будет направлена по электронной почте только в SIGMA и OMEGA.",
];

const rankings = [
  [1, 2, 8, 28, 7], [1, 8, 7, 28, 15], [1, 7, 8, 2, 28], [1, 7, 8, 28, 2], [1, 7, 8, 28, 15],
  [1, 7, 8, 28, 2], [1, 7, 28, 8, 15], [1, 8, 7, 28, 18], [1, 8, 7, 2, 28], [1, 7, 2, 8, 28],
  [1, 7, 8, 28, 2], [7, 1, 8, 28, 2], [1, 7, 8, 28, 18], [1, 7, 8, 28, 15], [1, 8, 7, 15, 28],
  [1, 7, 8, 28, 2], [1, 7, 8, 28, 15], [1, 7, 8, 28, 18], [1, 8, 28, 7, 4],
];

const selectionRevision = Object.freeze({
  revision_kind: "owner_editorial_revision_without_rebrainstorm",
  reason: "После завершения двух фаз владелец продукта исключил слово «только» перед перечнем контуров. Исторический журнал и результаты голосования сохранены без изменения.",
  constraints: [
    "Не использовать слово «только» перед SIGMA и OMEGA.",
    "Сохранить время ЧЧ:ММ, обещание «не более 20 минут» и упоминание SIGMA и OMEGA.",
  ],
  candidates: [
    { rank: 1, source_candidate_id: 1, text: "Формирование презентации началось в ЧЧ:ММ. Срок — не более 20 минут; затем презентация будет направлена по электронной почте в SIGMA и OMEGA." },
    { rank: 2, source_candidate_id: 7, text: "Формирование презентации началось в ЧЧ:ММ и займет не более 20 минут. После завершения презентация будет направлена по электронной почте в SIGMA и OMEGA." },
    { rank: 3, source_candidate_id: 8, text: "В ЧЧ:ММ начато формирование презентации. Срок выполнения — не более 20 минут; по завершении презентация будет направлена по электронной почте в SIGMA и OMEGA." },
    { rank: 4, source_candidate_id: 28, text: "Формирование презентации начато в ЧЧ:ММ. Срок подготовки — не более 20 минут, затем презентация будет направлена по электронной почте в SIGMA и OMEGA." },
    { rank: 5, source_candidate_id: 2, text: "В ЧЧ:ММ началось формирование презентации. Оно займет не более 20 минут, после чего презентация будет направлена по электронной почте в SIGMA и OMEGA." },
  ],
});

function fail(message) {
  throw new Error(message);
}

function parseArguments(args) {
  if (args.length === 0) return { check: false };
  if (args.length === 1 && args[0] === "--check") return { check: true };
  fail("использование: node scripts/generate-co-2026-003-generation-started-brainstorm-evidence.mjs [--check]");
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
    if (!rawVariants.includes(candidate)) fail("each consolidated candidate must originate from the saved raw evidence");
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
  const finalCandidates = totals.slice(0, 5).map((total, index) => ({
    rank: index + 1,
    source_candidate_id: total.candidate_id,
    points: total.points,
    text: candidateById.get(total.candidate_id),
  }));
  return {
    "$schema": "../../source/schemas/brainstorming-topic-result.schema.json",
    version: "1.0.0",
    change_order_id: "CO-2026-003",
    topic_id: "generation_started_message",
    topic_title: "Сообщение о начале формирования презентации",
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
    final_candidates: finalCandidates,
    selection_revision: selectionRevision,
    selected_text: null,
    boundaries: { render_allowed: false, archive_allowed: false, generator_input_allowed: false },
  };
}

function renderLedger(state) {
  const candidateLines = state.phase_1.consolidation.candidates.map((candidate) => `${candidate.candidate_id}. ${candidate.text}`).join("\n");
  const rankingLines = state.phase_2.rankings.map((ranking) => `${ranking.anonymous_reviewer_id}: ${ranking.ranked_candidate_ids.join(", ")}`).join("\n");
  const finalLines = state.final_candidates.map((candidate) => `${candidate.rank}. Вариант ${candidate.source_candidate_id}, ${candidate.points} баллов: ${candidate.text}`).join("\n");
  const revisionLines = state.selection_revision.candidates.map((candidate) => `${candidate.rank}. Вариант ${candidate.source_candidate_id}: ${candidate.text}`).join("\n");
  return `# Результат брейншторма по сообщению о начале формирования презентации\n\nСтатус: \`pending_owner_selection\`.\n\nЭтот пакет содержит только кандидаты. Он не меняет действующие договоры, не разрешает рендер, не входит в архив и не является входом генератора.\n\n## Вводная владельца\n\n${ownerIntro}\n\n## Первая фаза\n\nУчастников: 19. Минимум вариантов на участника: 20. Всего сырых вариантов: 380. Все участники получили общую вводную и работали параллельно; перед второй фазой центральная проверка исключила явные дубли и близкие повторы.\n\nПолный журнал сохранён в [raw-variants-ledger.md](raw-variants-ledger.md).\n\n## Консолидация до 30 вариантов\n\n${candidateLines}\n\n## Вторая фаза\n\nУчастников: 19. Участники независимые и анонимные. На входе было 30 вариантов. Каждое ранжирование содержит пять номеров из списка 30.\n\n${rankingLines}\n\n## Правило подсчёта\n\nПозиции 1–5 дают 5–1 балл. При равном числе баллов выше расположен вариант с меньшим номером.\n\n## Итоговые кандидаты\n\n${finalLines}\n\n## Редакционное уточнение владельца\n\n${state.selection_revision.reason}\n\nУточнённые кандидаты для выбора:\n\n${revisionLines}\n\nВыбранный текст: \`null\`. Итоговый выбор владельца ещё не сделан.\n\n## Блокировки\n\n- \`render_allowed\`: \`false\` — рендер не разрешён.\n- \`archive_allowed\`: \`false\` — архив не разрешён.\n- \`generator_input_allowed\`: \`false\` — вход генератора не разрешён.\n`;
}

function expectedFiles(root) {
  const participants = readParticipants(root);
  const state = buildState(participants);
  return new Map([
    [path.join(root, packageRoot, "brainstorming-topic-result.json"), `${JSON.stringify(state, null, 2)}\n`],
    [path.join(root, packageRoot, "brainstorming-topic-result.md"), renderLedger(state)],
  ]);
}

try {
  const { check } = parseArguments(process.argv.slice(2));
  const root = process.cwd();
  const files = expectedFiles(root);
  for (const [filePath, content] of files) {
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
