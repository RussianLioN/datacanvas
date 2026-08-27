import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const mapPath = "docs/product/requirements/user-story-decomposition-map.json";
const artifactRoot = "artifacts/evidence/co-2026-003/user-story-sequence-diagrams";
const manifestPath = `${artifactRoot}/manifest.json`;
const indexPath = `${artifactRoot}/index.html`;
const overviewPath = "docs/product/requirements/sequence-diagrams/README.md";
const candidateDiagramState = "candidate_pending_owner_review";
const ownerApprovedDiagramState = "owner_approved";
const supportedDiagramStates = new Set([candidateDiagramState, ownerApprovedDiagramState]);
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(message) {
  throw new Error(message);
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readMap(root) {
  return JSON.parse(fs.readFileSync(path.join(root, mapPath), "utf8"));
}

function parseArguments(argv) {
  const result = { check: false, refreshMetadata: false, javaPath: null, plantumlJar: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      result.check = true;
    } else if (argument === "--refresh-metadata") {
      result.refreshMetadata = true;
    } else if (argument === "--java") {
      result.javaPath = argv[++index];
    } else if (argument === "--plantuml-jar") {
      result.plantumlJar = argv[++index];
    } else {
      fail(`неизвестный аргумент: ${argument}`);
    }
  }
  return result;
}

function expectedStories(root) {
  const map = readMap(root);
  if (map.status !== "owner_approved") {
    fail("диаграммы разрешено готовить только для принятого текста пользовательских историй");
  }
  if (map.child_stories.length !== 24) {
    fail("ожидаются диаграммы для двадцати четырёх детализированных сценариев");
  }
  return map.child_stories;
}

function diagramSetStatus(stories) {
  const statuses = new Set(stories.map((story) => story.sequence_diagram_status));
  if (statuses.size !== 1 || !supportedDiagramStates.has(statuses.values().next().value)) {
    fail("все диаграммы должны иметь единый поддерживаемый статус приёмки");
  }
  return statuses.values().next().value;
}

function assertPumlSource(root, story) {
  const absolutePath = path.join(root, story.sequence_diagram.puml_path);
  if (!fs.existsSync(absolutePath)) {
    fail(`${story.child_story_id}: отсутствует исходник PlantUML`);
  }
  const source = fs.readFileSync(absolutePath, "utf8");
  if (!source.startsWith("@startuml\n") || !source.endsWith("@enduml\n")) {
    fail(`${story.child_story_id}: исходник PlantUML должен иметь одну корректную оболочку`);
  }
  if (!source.includes(`title ${story.child_story_id} — ${story.title}`)) {
    fail(`${story.child_story_id}: диаграмма должна иметь заголовок принятого сценария`);
  }
  if (!source.includes("autonumber\n")) {
    fail(`${story.child_story_id}: диаграмма должна нумеровать шаги`);
  }
}

function assertSvg(absolutePath, storyId) {
  if (!fs.existsSync(absolutePath)) {
    fail(`${storyId}: отсутствует SVG-рендер`);
  }
  const source = fs.readFileSync(absolutePath, "utf8");
  if (!source.includes("<svg") || /(?:Syntax Error|Cannot find Graphviz)/u.test(source)) {
    fail(`${storyId}: SVG-рендер не является корректной диаграммой`);
  }
  if (!/width="[1-9][0-9.]*px"/u.test(source) || !/height="[1-9][0-9.]*px"/u.test(source)) {
    fail(`${storyId}: SVG-рендер должен иметь ненулевой холст`);
  }
}

function assertPng(absolutePath, storyId) {
  if (!fs.existsSync(absolutePath)) {
    fail(`${storyId}: отсутствует PNG-рендер`);
  }
  const content = fs.readFileSync(absolutePath);
  if (content.length < pngSignature.length || !content.subarray(0, pngSignature.length).equals(pngSignature)) {
    fail(`${storyId}: PNG-рендер имеет неверную сигнатуру`);
  }
}

function assertOverview(root, stories) {
  const absolutePath = path.join(root, overviewPath);
  if (!fs.existsSync(absolutePath)) {
    fail("отсутствует обзор диаграмм для навигации в GitHub");
  }
  const overview = fs.readFileSync(absolutePath, "utf8");
  if (!overview.includes("Диаграммы последовательности пользовательских историй 2026")) {
    fail("обзор диаграмм должен иметь корректный заголовок");
  }
  if (!overview.includes("manifest.json")) {
    fail("обзор диаграмм должен ссылаться на манифест доказательств");
  }
  for (const story of stories) {
    const diagram = story.sequence_diagram;
    const requiredNames = [
      story.child_story_id,
      path.basename(diagram.puml_path),
      path.basename(diagram.svg_path),
      path.basename(diagram.png_path),
    ];
    for (const requiredName of requiredNames) {
      if (!overview.includes(requiredName)) {
        fail(`${story.child_story_id}: обзор диаграмм не содержит ссылку на ${requiredName}`);
      }
    }
  }
}

function renderIndex(root, stories, status) {
  const cards = stories.map((story) => {
    const { child_story_id: id, title, sequence_diagram: diagram } = story;
    return `<article><h2>${id} — ${title}</h2><p><a href="../../../../${diagram.puml_path}">Исходник PlantUML</a> · <a href="svg/${path.basename(diagram.svg_path)}">SVG</a> · <a href="png/${path.basename(diagram.png_path)}">PNG</a></p><img src="png/${path.basename(diagram.png_path)}" alt="Диаграмма последовательности ${id}"></article>`;
  }).join("\n");
  const acceptanceText = status === ownerApprovedDiagramState
    ? "Принятый набор. Каждый рисунок построен из соответствующего принятого сценария."
    : "Черновой набор для отдельной приёмки. Каждый рисунок построен из соответствующего принятого сценария.";
  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Диаграммы последовательности пользовательских историй 2026</title><style>body{font:16px Arial,sans-serif;margin:24px;background:#f5f7fa;color:#182230}main{max-width:1400px;margin:auto}article{background:#fff;border:1px solid #d8dee8;border-radius:12px;padding:18px;margin:18px 0;overflow:auto}h1{font-size:28px}h2{font-size:20px;margin:0 0 10px}a{color:#2e5aac}img{display:block;max-width:none;margin-top:14px;border:1px solid #d8dee8}</style></head><body><main><h1>Диаграммы последовательности пользовательских историй 2026</h1><p>${acceptanceText}</p>${cards}</main></body></html>\n`;
  fs.writeFileSync(path.join(root, indexPath), html, "utf8");
}

function writeManifest(root, stories, renderer, status) {
  const artifacts = stories.map((story) => ({
    story_id: story.child_story_id,
    title: story.title,
    puml_path: story.sequence_diagram.puml_path,
    puml_sha256: sha256(path.join(root, story.sequence_diagram.puml_path)),
    svg_path: story.sequence_diagram.svg_path,
    svg_sha256: sha256(path.join(root, story.sequence_diagram.svg_path)),
    png_path: story.sequence_diagram.png_path,
    png_sha256: sha256(path.join(root, story.sequence_diagram.png_path)),
  }));
  const manifest = {
    version: "1.0.0",
    change_order_id: "CO-2026-003",
    status,
    source_document_path: "docs/product/requirements/user-stories.md",
    renderer,
    artifacts,
  };
  fs.writeFileSync(path.join(root, manifestPath), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function waitForRenderedFile(command, args, outputFile, storyId, isComplete) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    let completed = false;
    const stop = (callback) => {
      if (completed) return;
      completed = true;
      clearInterval(poll);
      clearTimeout(timeout);
      callback();
    };
    const rejectWith = (message) => stop(() => reject(new Error(`${storyId}: ${message}${stderr ? ` (${stderr.trim()})` : ""}`)));
    child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
    child.on("error", (error) => rejectWith(`не удалось запустить PlantUML: ${error.message}`));
    child.on("close", (code) => {
      if (!completed && !isComplete(outputFile)) {
        rejectWith(`PlantUML завершился до создания файла, код ${code}`);
      }
    });
    const poll = setInterval(() => {
      if (!isComplete(outputFile)) return;
      stop(() => {
        child.kill("SIGTERM");
        resolve();
      });
    }, 100);
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      rejectWith("PlantUML не создал файл за 30 секунд");
    }, 30_000);
  });
}

async function renderStory(root, story, format, javaPath, plantumlJar) {
  const source = path.join(root, story.sequence_diagram.puml_path);
  const target = path.join(root, format === "svg" ? story.sequence_diagram.svg_path : story.sequence_diagram.png_path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.rmSync(target, { force: true });
  const isComplete = format === "svg"
    ? (filePath) => fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8").includes("<svg")
    : (filePath) => {
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath);
      return content.length > pngSignature.length && content.subarray(0, pngSignature.length).equals(pngSignature);
    };
  await waitForRenderedFile(
    javaPath,
    ["-Djava.awt.headless=true", "-jar", plantumlJar, "-charset", "UTF-8", `-t${format}`, "-o", path.dirname(target), source],
    target,
    story.child_story_id,
    isComplete,
  );
}

export function validateUserStorySequenceDiagrams(root = process.cwd()) {
  const stories = expectedStories(root);
  const status = diagramSetStatus(stories);
  for (const story of stories) {
    assertPumlSource(root, story);
    assertSvg(path.join(root, story.sequence_diagram.svg_path), story.child_story_id);
    assertPng(path.join(root, story.sequence_diagram.png_path), story.child_story_id);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestPath), "utf8"));
  if (manifest.status !== status || manifest.artifacts.length !== stories.length) {
    fail("манифест должен фиксировать полный набор диаграмм и его статус приёмки");
  }
  const manifestArtifacts = new Map(manifest.artifacts.map((artifact) => [artifact.story_id, artifact]));
  for (const story of stories) {
    const artifact = manifestArtifacts.get(story.child_story_id);
    if (!artifact) {
      fail(`${story.child_story_id}: отсутствует запись в манифесте диаграмм`);
    }
    const diagram = story.sequence_diagram;
    if (
      artifact.puml_path !== diagram.puml_path
      || artifact.svg_path !== diagram.svg_path
      || artifact.png_path !== diagram.png_path
      || artifact.puml_sha256 !== sha256(path.join(root, diagram.puml_path))
      || artifact.svg_sha256 !== sha256(path.join(root, diagram.svg_path))
      || artifact.png_sha256 !== sha256(path.join(root, diagram.png_path))
    ) {
      fail(`${story.child_story_id}: манифест не соответствует текущим исходнику и рендерам`);
    }
  }
  assertOverview(root, stories);
  const indexAbsolutePath = path.join(root, indexPath);
  if (!fs.existsSync(indexAbsolutePath)) {
    fail("для просмотра диаграмм должен существовать индекс");
  }
  const index = fs.readFileSync(indexAbsolutePath, "utf8");
  const expectedIndexText = status === ownerApprovedDiagramState ? "Принятый набор." : "Черновой набор для отдельной приёмки.";
  if (!index.includes(expectedIndexText)) {
    fail("индекс диаграмм должен отражать текущий статус приёмки");
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.check) {
    validateUserStorySequenceDiagrams();
    console.log("диаграммы последовательности пользовательских историй проверены");
    return;
  }
  if (options.refreshMetadata) {
    const stories = expectedStories(process.cwd());
    const status = diagramSetStatus(stories);
    for (const story of stories) {
      assertPumlSource(process.cwd(), story);
      assertSvg(path.join(process.cwd(), story.sequence_diagram.svg_path), story.child_story_id);
      assertPng(path.join(process.cwd(), story.sequence_diagram.png_path), story.child_story_id);
    }
    const existingManifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), manifestPath), "utf8"));
    if (!existingManifest.renderer) {
      fail("для обновления статуса необходим манифест с данными средства рендера");
    }
    renderIndex(process.cwd(), stories, status);
    writeManifest(process.cwd(), stories, existingManifest.renderer, status);
    validateUserStorySequenceDiagrams();
    console.log("статус приёмки диаграмм и обзорный индекс обновлены");
    return;
  }
  if (!options.javaPath || !options.plantumlJar) {
    fail("для рендера укажите --java <путь> и --plantuml-jar <путь>");
  }
  if (!fs.existsSync(options.javaPath) || !fs.existsSync(options.plantumlJar)) {
    fail("указанный Java runtime или PlantUML JAR не найден");
  }
  const stories = expectedStories(process.cwd());
  if (diagramSetStatus(stories) !== candidateDiagramState) {
    fail("повторный рендер разрешён только до приёмки диаграмм владельцем продукта");
  }
  for (const story of stories) {
    assertPumlSource(process.cwd(), story);
    await renderStory(process.cwd(), story, "svg", options.javaPath, options.plantumlJar);
    await renderStory(process.cwd(), story, "png", options.javaPath, options.plantumlJar);
    assertSvg(path.join(process.cwd(), story.sequence_diagram.svg_path), story.child_story_id);
    assertPng(path.join(process.cwd(), story.sequence_diagram.png_path), story.child_story_id);
  }
  renderIndex(process.cwd(), stories, candidateDiagramState);
  writeManifest(process.cwd(), stories, {
    name: "PlantUML",
    jar_sha256: sha256(options.plantumlJar),
  }, candidateDiagramState);
  validateUserStorySequenceDiagrams();
  console.log("диаграммы последовательности подготовлены для отдельной приёмки");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
