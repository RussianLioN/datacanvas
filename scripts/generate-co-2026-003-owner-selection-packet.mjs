import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const journeyRoot = "docs/product/analysis/presentation-link-lisa-user-journey";
const candidateEvidenceRoot = `${journeyRoot}/candidate-evidence`;
const outputPath = `${candidateEvidenceRoot}/owner-selection-packet.md`;
const approvedTextsPath = `${journeyRoot}/source/owner-approved-texts.json`;
const topics = [
  { directory: "button-label", title: "Текст кнопки заказа презентации" },
  { directory: "generation-started-message", title: "Сообщение о начале формирования презентации" },
  { directory: "delivery-success-message", title: "Сообщение об успешной отправке презентации" },
  { directory: "email-subject", title: "Тема письма с презентацией" },
  { directory: "email-body", title: "Тело письма с презентацией" },
];

function fail(message) {
  throw new Error(message);
}

function parseArguments(args) {
  if (args.length === 0) return { check: false };
  if (args.length === 1 && args[0] === "--check") return { check: true };
  fail("использование: node scripts/generate-co-2026-003-owner-selection-packet.mjs [--check]");
}

function readTopic(root, topic) {
  const resultPath = path.join(root, candidateEvidenceRoot, topic.directory, "brainstorming-topic-result.json");
  const result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  if (result.status !== "pending_owner_selection" || result.selected_text !== null) {
    fail(`${topic.directory}: выбор владельца должен оставаться незафиксированным`);
  }
  if (result.final_candidates?.length !== 5) fail(`${topic.directory}: требуется ровно пять кандидатов`);
  if (result.boundaries?.render_allowed || result.boundaries?.archive_allowed || result.boundaries?.generator_input_allowed) {
    fail(`${topic.directory}: кандидатный пакет не должен разрешать выпуск`);
  }
  return {
    result,
    candidates: result.selection_revision?.candidates || result.final_candidates,
    hasOwnerRevision: Boolean(result.selection_revision),
  };
}

function readApprovedTexts(root) {
  const approvedTexts = JSON.parse(fs.readFileSync(path.join(root, approvedTextsPath), "utf8"));
  if (approvedTexts.status !== "owner_approved" || approvedTexts.selections?.length !== topics.length) {
    fail("реестр утверждённых текстов должен содержать пять подтверждённых владельцем формулировок");
  }
  return approvedTexts;
}

function render(root) {
  const approvedTexts = readApprovedTexts(root);
  const sections = topics.map((topic) => {
    const selection = readTopic(root, topic);
    const resultLink = `${topic.directory}/brainstorming-topic-result.md`;
    const variants = selection.candidates
      .map((candidate) => `${candidate.rank}. ${candidate.text}`)
      .join("\n");
    const source = selection.hasOwnerRevision
      ? `Источник: [полный результат двухфазного обсуждения](${resultLink}); применено редакционное уточнение владельца без нового брейншторма.`
      : `Источник: [полный результат двухфазного обсуждения](${resultLink}).`;
    return `## ${topic.title}\n\n${source}\n\n${variants}`;
  });
  const approvedLink = "../owner-approved-texts.md";
  const selectionExplanation = {
    team_vote_maximum_plus_exact_candidate: "выбран лидер опроса команды",
    owner_approved_editorial_text_after_team_vote: "утверждена редакционная правка владельца после опроса команды",
    owner_tie_break_after_team_vote: "владелец разрешил ничью между лидерами опроса",
  };
  const approvedSummary = approvedTexts.selections
    .map((selection) => `- **${selection.topic_title}:** «${selection.text}» — ${selectionExplanation[selection.selection_method]}.`)
    .join("\n");
  return `# Исторический пакет кандидатов будущего прототипа\n\nСтатус: обсуждение завершено. Этот документ сохраняет по пять кандидатов из двухфазного обсуждения. Он не является первичным протоколом отметок команды и не заменяет редакционные правки владельца. Единственный источник истины для дальнейших правок — [утверждённые тексты](${approvedLink}).\n\n## Итог выбора владельца продукта\n\n${approvedSummary}\n\nВо внешнем пакете владельца были отмечены результаты опроса команды и, где требовалось, внесены редакционные правки. В репозитории сохраняются только проверяемые итоги выбора: число отметок, способ выбора и финальный текст; имя файла, путь и метаданные внешнего пакета не сохраняются.\n\nТри PDF-донора вариантов презентации получены, но не являются входом рендера. До подготовки канонического SVG, визуальной проверки SVG и отдельного согласования каждого чернового PNG запрещено менять визуальные кадры и выпускать прототип. В проверочной изолированной копии текущего прототипа одновременно заменяется только один одноимённый кадр; следующий кадр не начинается до явной приёмки владельца.\n\n## Исторические кандидаты\n\n${sections.join("\n\n")}\n`;
}

try {
  const { check } = parseArguments(process.argv.slice(2));
  const root = process.cwd();
  const content = render(root);
  const target = path.join(root, outputPath);
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) fail(`пакет выбора устарел: ${outputPath}`);
  } else {
    fs.writeFileSync(target, content);
  }
  process.stdout.write(check ? "Пакет выбора актуален.\n" : "Пакет выбора сформирован.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "формирование не выполнено"}\n`);
  process.exitCode = 1;
}
