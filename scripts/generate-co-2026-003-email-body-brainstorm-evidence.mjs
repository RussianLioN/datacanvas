import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const journeyRoot = "docs/product/analysis/presentation-link-lisa-user-journey";
const packageRoot = `${journeyRoot}/candidate-evidence/email-body`;
const ownerIntro = "Тело письма должно кратко и делово сообщать, что DataCanvas изготовил презентацию по Справке по клиенту для ООО «Водолей Трейд» и направляет её вложением. Нужен корпоративный стиль без обращения по имени, без форматов вложений, адресов получателей и без копирования приложенного образца письма.";

const candidateTexts = [
  "DataCanvas изготовил презентацию по Справке по клиенту для ООО «Водолей Трейд»; она приложена к письму.",
  "Во вложении направляется изготовленная DataCanvas презентация по Справке по клиенту ООО «Водолей Трейд».",
  "DataCanvas подготовил и приложил презентацию по Справке по клиенту для ООО «Водолей Трейд».",
  "К письму приложена презентация, изготовленная DataCanvas по Справке по клиенту ООО «Водолей Трейд».",
  "DataCanvas сформировал презентацию по Справке по клиенту ООО «Водолей Трейд» и направляет её вложением.",
  "Презентация по Справке по клиенту для ООО «Водолей Трейд», изготовленная DataCanvas, приложена к письму.",
  "Во вложении представлена презентация DataCanvas по Справке по клиенту ООО «Водолей Трейд».",
  "DataCanvas изготовил презентацию по Справке по клиенту ООО «Водолей Трейд»; документ приложен.",
  "К письму приложен результат работы DataCanvas — презентация по Справке по клиенту ООО «Водолей Трейд».",
  "DataCanvas подготовил презентацию по Справке по клиенту для ООО «Водолей Трейд» и приложил её к письму.",
  "Приложена изготовленная DataCanvas презентация по Справке по клиенту ООО «Водолей Трейд».",
  "DataCanvas направляет вложением презентацию по Справке по клиенту ООО «Водолей Трейд».",
  "Во вложении содержится подготовленная DataCanvas презентация по Справке по клиенту для ООО «Водолей Трейд».",
  "DataCanvas изготовил и приложил презентацию по Справке по клиенту ООО «Водолей Трейд».",
  "Презентация DataCanvas по Справке по клиенту для ООО «Водолей Трейд» направлена вложением.",
  "К письму прилагается презентация, подготовленная DataCanvas по Справке по клиенту ООО «Водолей Трейд».",
  "DataCanvas сформировал презентацию по Справке по клиенту для ООО «Водолей Трейд»; она находится во вложении.",
  "Во вложении размещена презентация, изготовленная DataCanvas по Справке по клиенту ООО «Водолей Трейд».",
  "DataCanvas подготовил презентацию по Справке по клиенту ООО «Водолей Трейд» и направил её приложением.",
  "Приложена презентация по Справке по клиенту ООО «Водолей Трейд», изготовленная DataCanvas.",
  "DataCanvas подготовил по Справке по клиенту ООО «Водолей Трейд» презентацию, направленную вложением.",
  "Во вложении направлена презентация DataCanvas, изготовленная по Справке по клиенту ООО «Водолей Трейд».",
  "DataCanvas изготовил презентацию на основе Справки по клиенту ООО «Водолей Трейд» и направил её вложением.",
  "Презентация DataCanvas по Справке по клиенту ООО «Водолей Трейд» подготовлена и приложена к письму.",
  "Вложением направляется подготовленная DataCanvas презентация по Справке по клиенту ООО «Водолей Трейд».",
  "DataCanvas подготовил и направил вложением презентацию по Справке по клиенту ООО «Водолей Трейд».",
  "К письму приложена презентация, изготовленная DataCanvas на основании Справки по клиенту ООО «Водолей Трейд».",
  "DataCanvas направляет вложением презентацию, подготовленную по Справке по клиенту ООО «Водолей Трейд».",
  "Презентация по Справке по клиенту ООО «Водолей Трейд» изготовлена DataCanvas и направлена вложением.",
  "Во вложении находится презентация DataCanvas, подготовленная по Справке по клиенту ООО «Водолей Трейд».",
];

const rankings = [
  [1, 6, 4, 8, 14], [3, 14, 10, 8, 26], [30, 7, 24, 20, 11], [10, 26, 3, 28, 12],
  [12, 7, 16, 26, 30], [16, 27, 6, 24, 20], [10, 16, 28, 30, 24], [26, 2, 30, 28, 16],
  [12, 26, 28, 16, 10], [26, 28, 10, 16, 24], [1, 14, 23, 8, 27], [12, 26, 28, 2, 30],
  [2, 14, 3, 1, 10], [16, 27, 23, 10, 26], [26, 23, 5, 2, 14], [16, 10, 26, 23, 2],
  [26, 12, 10, 1, 4], [10, 3, 1, 26, 12], [16, 10, 26, 30, 28],
];

function fail(message) {
  throw new Error(message);
}

function parseArguments(args) {
  if (args.length === 1 && args[0] === "--collect") return { collect: true };
  if (args.length === 0) return { collect: false, check: false };
  if (args.length === 1 && args[0] === "--check") return { collect: false, check: true };
  fail("использование: node scripts/generate-co-2026-003-email-body-brainstorm-evidence.mjs [--collect|--check]");
}

function collectRawLedger(root) {
  const rawDirectory = path.join(root, packageRoot, "raw");
  const files = fs.readdirSync(rawDirectory)
    .filter((fileName) => /^participant-\d\d\.md$/u.test(fileName))
    .sort();
  if (files.length !== 19) fail("первая фаза должна содержать ровно 19 исходных файлов участников");

  const sections = files.map((fileName, index) => {
    const source = fs.readFileSync(path.join(rawDirectory, fileName), "utf8").trim();
    const expectedHeading = `# Участник ${String(index + 1).padStart(2, "0")}`;
    if (!source.startsWith(expectedHeading)) fail(`${fileName}: нарушен заголовок участника`);
    const variants = [...source.matchAll(/^\d+\.\s+(.+)$/gmu)];
    if (variants.length !== 20) fail(`${fileName}: требуется ровно 20 исходных вариантов`);
    return `## участник-${String(index + 1).padStart(2, "0")}\n\n${variants.map((match, variantIndex) => `${variantIndex + 1}. ${match[1]}`).join("\n")}`;
  });

  const rawLedger = `# Полный журнал первой фазы: тело письма с презентацией\n\nВсего сырых вариантов: 380. Каждый из 19 участников подготовил по 20 вариантов; текст сохранён без редакторской правки до центральной консолидации.\n\n${sections.join("\n\n")}\n`;
  const target = path.join(root, packageRoot, "raw-variants-ledger.md");
  fs.writeFileSync(target, rawLedger);
}

function readParticipants(root) {
  const rawLedger = fs.readFileSync(path.join(root, packageRoot, "raw-variants-ledger.md"), "utf8");
  const sections = [...rawLedger.matchAll(/^## (участник-\d{2})\n\n((?:(?!^## ).)*)/gmsu)];
  if (sections.length !== 19) fail("полный журнал должен содержать ровно 19 разделов участников");
  const participants = sections.map((section, index) => {
    const variants = section[2].split(/\r?\n/u)
      .map((line) => line.match(/^(?:[1-9]|1\d|20)\.\s+(.+)$/u)?.[1])
      .filter(Boolean);
    if (section[1] !== `участник-${String(index + 1).padStart(2, "0")}` || variants.length !== 20) {
      fail("каждый раздел полного журнала должен содержать упорядоченный идентификатор и ровно 20 вариантов");
    }
    return { participant_id: section[1], variants };
  });
  const rawVariants = participants.flatMap((participant) => participant.variants);
  if (rawVariants.length !== 380) fail("первая фаза должна содержать ровно 380 исходных вариантов");
  for (const candidate of candidateTexts) {
    if (!rawVariants.includes(candidate)) fail("каждый из 30 кандидатов должен происходить из сохранённого полного журнала");
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
    topic_id: "email_body",
    topic_title: "Тело письма с презентацией",
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
  return `# Результат брейншторма по телу письма с презентацией\n\nСтатус: \`pending_owner_selection\`.\n\nЭтот пакет содержит только кандидаты. Он не меняет действующие договоры, не разрешает рендер, не входит в архив и не является входом генератора.\n\n## Вводная владельца\n\n${ownerIntro}\n\n## Первая фаза\n\nУчастников: 19. Минимум вариантов на участника: 20. Всего сырых вариантов: 380. Все участники получили общую вводную и работали параллельно; перед второй фазой центральная проверка исключила явные дубли и близкие повторы.\n\nПолный журнал сохранён в [raw-variants-ledger.md](raw-variants-ledger.md).\n\n## Консолидация до 30 вариантов\n\n${candidateLines}\n\n## Вторая фаза\n\nУчастников: 19. Участники независимые и анонимные. На входе было 30 вариантов. Каждое ранжирование содержит пять номеров из списка 30.\n\n${rankingLines}\n\n## Правило подсчёта\n\nПозиции 1–5 дают 5–1 балл. При равном числе баллов выше расположен вариант с меньшим номером.\n\n## Итоговые кандидаты\n\n${finalLines}\n\nВыбранный текст: \`null\`. Итоговый выбор владельца ещё не сделан.\n\n## Блокировки\n\n- \`render_allowed\`: \`false\` — рендер не разрешён.\n- \`archive_allowed\`: \`false\` — архив не разрешён.\n- \`generator_input_allowed\`: \`false\` — вход генератора не разрешён.\n`;
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
  const args = parseArguments(process.argv.slice(2));
  const root = process.cwd();
  if (args.collect) {
    collectRawLedger(root);
    process.stdout.write("Полный журнал первой фазы сформирован.\n");
  } else {
    for (const [filePath, content] of expectedFiles(root)) {
      if (args.check) {
        if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== content) fail(`свидетельство брейншторма устарело: ${path.relative(root, filePath)}`);
      } else {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
      }
    }
    process.stdout.write(args.check ? "Свидетельства брейншторма актуальны.\n" : "Свидетельства брейншторма сформированы.\n");
  }
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "формирование не выполнено"}\n`);
  process.exitCode = 1;
}
