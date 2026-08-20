import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const journeyRoot = "docs/product/analysis/presentation-link-lisa-user-journey";
const candidateEvidenceRoot = `${journeyRoot}/candidate-evidence`;
const outputPath = `${candidateEvidenceRoot}/owner-selection-packet.md`;
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

function render(root) {
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
  return `# Пакет выбора текстов для будущего прототипа\n\nСтатус: ожидается явный выбор владельца продукта. Этот документ объединяет по пять кандидатов из пяти независимых двухфазных обсуждений. Он не меняет действующие SVG, PNG, HTML, ZIP, доказательства или архив.\n\n## Как зафиксировать выбор\n\nВладелец продукта выбирает по одному номеру в каждом из пяти разделов либо присылает точную отредактированную формулировку. До фиксации всех пяти выборов запрещено менять визуальные кадры и выпускать прототип.\n\n${sections.join("\n\n")}\n`;
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
