function parseAttributes(source) {
  return Object.fromEntries(
    [...source.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
  );
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripMarkup(value) {
  return decodeXml(value.replace(/<[^>]+>/g, "")).trim();
}

export function estimateSvgTextWidth(value, fontSize) {
  let em = 0;
  for (const character of String(value)) {
    if (/\s/u.test(character)) {
      em += 0.34;
    } else if (/[ilI1|]/u.test(character)) {
      em += 0.35;
    } else if (/[MW@%ШЩЖЮ]/u.test(character)) {
      em += 0.82;
    } else if (/[.,:;!'"`()\-]/u.test(character)) {
      em += 0.38;
    } else {
      em += 0.62;
    }
  }
  return em * fontSize;
}

export function wrapSvgText(value, maxWidth, fontSize) {
  const words = String(value).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    if (estimateSvgTextWidth(word, fontSize) > maxWidth) {
      throw new Error(`word does not fit visual frame at ${fontSize}px: ${word}`);
    }
    const next = line ? `${line} ${word}` : word;
    if (line && estimateSvgTextWidth(next, fontSize) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) {
    lines.push(line);
  }
  return lines;
}

export function fitSvgTextLines(logicalLines, options) {
  const {
    maxWidth,
    startY,
    maxY,
    maxFontSize,
    minFontSize = 24,
    lineHeightRatio = 1.28,
  } = options;

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
    const lineHeight = Math.ceil(fontSize * lineHeightRatio);
    let lines;
    try {
      lines = logicalLines.flatMap((line) => wrapSvgText(line, maxWidth, fontSize));
    } catch {
      continue;
    }
    const lastBaseline = startY + Math.max(0, lines.length - 1) * lineHeight;
    const renderedBottom = lastBaseline + fontSize * 0.3;
    if (renderedBottom <= maxY) {
      return { fontSize, lineHeight, lines, renderedBottom };
    }
  }

  throw new Error(
    `text does not fit visual frame between y=${startY} and y=${maxY} at minimum ${minFontSize}px`,
  );
}

function parseTranslate(value) {
  const match = /^translate\(\s*(-?\d+(?:\.\d+)?)\s*(?:,|\s)\s*(-?\d+(?:\.\d+)?)\s*\)$/.exec(value ?? "");
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
}

function nearlyEqual(left, right, tolerance = 1) {
  return Math.abs(left - right) <= tolerance;
}

function overlap(left, right) {
  return (
    left.x < right.x + right.w &&
    left.x + left.w > right.x &&
    left.y < right.y + right.h &&
    left.y + left.h > right.y
  );
}

function parseBlocks(svg, issues) {
  const blocks = new Map();
  const blockPattern = /<g\s+([^>]*data-role="bmc-block"[^>]*)>([\s\S]*?)<\/g>/g;
  for (const match of svg.matchAll(blockPattern)) {
    const groupAttributes = parseAttributes(match[1]);
    const id = groupAttributes["data-block"];
    const position = parseTranslate(groupAttributes.transform);
    const frameMatch = /<rect\s+([^>]*)\/>/.exec(match[2]);
    const frameAttributes = frameMatch ? parseAttributes(frameMatch[1]) : {};
    const w = numeric(frameAttributes.width);
    const h = numeric(frameAttributes.height);
    if (!id || !position || w === null || h === null) {
      issues.push(`BMC block has incomplete geometry: ${id ?? "unknown"}`);
      continue;
    }
    blocks.set(id, { id, ...position, w, h, source: match[2] });
  }
  return blocks;
}

export function extractBmcSvgBlockFrames(svg) {
  const issues = [];
  const blocks = parseBlocks(svg, issues);
  if (issues.length > 0) {
    throw new Error(`cannot extract BMC frame geometry: ${issues.join("; ")}`);
  }
  return [...blocks.values()].map(({ id, x, y, w, h }) => ({ id, x, y, w, h }));
}

function validateBlockShapes(block, issues) {
  for (const rectMatch of block.source.matchAll(/<rect\s+([^>]*)\/>/g)) {
    const attributes = parseAttributes(rectMatch[1]);
    const x = numeric(attributes.x ?? "0");
    const y = numeric(attributes.y ?? "0");
    const width = numeric(attributes.width);
    const height = numeric(attributes.height);
    if ([x, y, width, height].some((value) => value === null)) {
      issues.push(`${block.id} inner rect has incomplete geometry`);
      continue;
    }
    if (x < 0 || y < 0 || width < 0 || height < 0 || x + width > block.w || y + height > block.h) {
      issues.push(`${block.id} inner rect exceeds frame bounds`);
    }
  }

  for (const lineMatch of block.source.matchAll(/<line\s+([^>]*)\/>/g)) {
    const attributes = parseAttributes(lineMatch[1]);
    const coordinates = ["x1", "y1", "x2", "y2"].map((name) => numeric(attributes[name]));
    if (coordinates.some((value) => value === null)) {
      issues.push(`${block.id} inner line has incomplete geometry`);
      continue;
    }
    const [x1, y1, x2, y2] = coordinates;
    if ([x1, x2].some((value) => value < 0 || value > block.w) || [y1, y2].some((value) => value < 0 || value > block.h)) {
      issues.push(`${block.id} inner line exceeds frame bounds`);
    }
  }
}

function validateTitle(svg, width, height, issues) {
  const titleMatch = /<text\s+([^>]*data-role="bmc-title"[^>]*)>([\s\S]*?)<\/text>/.exec(svg);
  if (!titleMatch) {
    issues.push("BMC SVG title geometry is missing");
    return;
  }
  const attributes = parseAttributes(titleMatch[1]);
  const x = numeric(attributes.x);
  const y = numeric(attributes.y);
  const fontSize = numeric(attributes["font-size"]);
  if ([x, y, fontSize, width, height].some((value) => value === null)) {
    issues.push("BMC SVG title has incomplete geometry");
    return;
  }
  const text = stripMarkup(titleMatch[2]);
  const right = x + estimateSvgTextWidth(text, fontSize);
  const top = y - fontSize;
  const bottom = y + fontSize * 0.3;
  if (x < 0 || top < 0 || right > width || bottom > height) {
    issues.push("BMC SVG title exceeds canvas bounds");
  }
}

function validateBlockText(block, issues) {
  const textPattern = /<text\s+([^>]*)>([\s\S]*?)<\/text>/g;
  for (const textMatch of block.source.matchAll(textPattern)) {
    const textAttributes = parseAttributes(textMatch[1]);
    const role = textAttributes["data-role"] ?? "text";
    const fontSize = numeric(textAttributes["font-size"]);
    if (fontSize === null) {
      issues.push(`${block.id} ${role} has no numeric font size`);
      continue;
    }

    const tspans = [...textMatch[2].matchAll(/<tspan\s+([^>]*)>([\s\S]*?)<\/tspan>/g)];
    const lines = tspans.length > 0
      ? tspans.map((match) => ({ attributes: parseAttributes(match[1]), text: stripMarkup(match[2]) }))
      : [{ attributes: textAttributes, text: stripMarkup(textMatch[2]) }];

    for (const line of lines) {
      const x = numeric(line.attributes.x);
      const y = numeric(line.attributes.y);
      if (x === null || y === null) {
        issues.push(`${block.id} ${role} has a line without numeric x/y coordinates`);
        continue;
      }
      const right = x + estimateSvgTextWidth(line.text, fontSize);
      const top = y - fontSize;
      const bottom = y + fontSize * 0.3;
      if (x < 18 || right > block.w - 18) {
        issues.push(`${block.id} ${role} text exceeds horizontal frame bounds: ${line.text}`);
      }
      if (top < 12 || bottom > block.h - 16) {
        issues.push(`${block.id} ${role} text exceeds vertical frame bounds at y=${y}: ${line.text}`);
      }
    }
  }
}

export function validateBmcSvgLayout(svg) {
  const issues = [];
  if (/data-role="bmc-(?:subtitle|footer)"/.test(svg)) {
    issues.push("BMC SVG must not expose service subtitle or footer text");
  }
  for (const servicePhrase of ["Классическая структура:", "каноническим визуальным источником", "генерируются из него"]) {
    if (svg.includes(servicePhrase)) {
      issues.push(`BMC SVG contains visible service text: ${servicePhrase}`);
    }
  }
  const rootMatch = /<svg\s+([^>]*)>/.exec(svg);
  if (!rootMatch) {
    return ["BMC SVG root is missing"];
  }
  const rootAttributes = parseAttributes(rootMatch[1]);
  const width = numeric(rootAttributes.width);
  const height = numeric(rootAttributes.height);
  const viewBox = (rootAttributes.viewBox ?? "").trim().split(/\s+/).map(Number);
  if (width !== 3840 || height !== 2160 || viewBox.length !== 4 || viewBox.some((value) => !Number.isFinite(value))) {
    issues.push("BMC SVG must use a numeric 3840x2160 canvas and viewBox");
  } else if (viewBox[0] !== 0 || viewBox[1] !== 0 || viewBox[2] !== width || viewBox[3] !== height) {
    issues.push("BMC SVG viewBox must match the full canvas");
  }
  validateTitle(svg, width, height, issues);

  const frameMatch = /<rect\s+([^>]*(?:data-role="bmc-frame"|x="88")[^>]*)\/>/.exec(svg);
  const frameAttributes = frameMatch ? parseAttributes(frameMatch[1]) : {};
  const frame = {
    x: numeric(frameAttributes.x),
    y: numeric(frameAttributes.y),
    w: numeric(frameAttributes.width),
    h: numeric(frameAttributes.height),
  };
  if (Object.values(frame).some((value) => value === null)) {
    issues.push("BMC SVG outer frame geometry is missing");
  } else if (frame.x < 0 || frame.y < 0 || frame.x + frame.w > width || frame.y + frame.h > height) {
    issues.push("BMC SVG outer frame exceeds canvas bounds");
  }

  const blocks = parseBlocks(svg, issues);
  const expectedIds = ["B8", "B7", "B6", "B2", "B4", "B3", "B1", "B9", "B5"];
  for (const id of expectedIds) {
    if (!blocks.has(id)) {
      issues.push(`BMC SVG is missing visual block ${id}`);
    }
  }
  if (blocks.size !== expectedIds.length) {
    issues.push(`BMC SVG must contain exactly ${expectedIds.length} visual blocks, found ${blocks.size}`);
  }

  for (const block of blocks.values()) {
    if (frame.x !== null && (
      block.x < frame.x ||
      block.y < frame.y ||
      block.x + block.w > frame.x + frame.w ||
      block.y + block.h > frame.y + frame.h
    )) {
      issues.push(`${block.id} frame exceeds the outer BMC frame`);
    }
    validateBlockShapes(block, issues);
    validateBlockText(block, issues);
  }

  const blockList = [...blocks.values()];
  for (let leftIndex = 0; leftIndex < blockList.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < blockList.length; rightIndex += 1) {
      if (overlap(blockList[leftIndex], blockList[rightIndex])) {
        issues.push(`${blockList[leftIndex].id} and ${blockList[rightIndex].id} frames overlap`);
      }
    }
  }

  if (expectedIds.every((id) => blocks.has(id))) {
    const top = [blocks.get("B8"), blocks.get("B7"), blocks.get("B2"), blocks.get("B4"), blocks.get("B1")];
    const horizontalGaps = top.slice(1).map((block, index) => block.x - (top[index].x + top[index].w));
    if (horizontalGaps.some((gap) => gap <= 0) || horizontalGaps.some((gap) => !nearlyEqual(gap, horizontalGaps[0]))) {
      issues.push(`BMC top-row gaps must be positive and equal: ${horizontalGaps.join(", ")}`);
    }
    if (top.some((block) => !nearlyEqual(block.y, top[0].y))) {
      issues.push("BMC top-row columns must share the same top edge");
    }
    for (const id of ["B8", "B2", "B1"]) {
      const block = blocks.get(id);
      if (!nearlyEqual(block.h, blocks.get("B8").h)) {
        issues.push("BMC tall top-row frames must have equal heights");
        break;
      }
    }

    const splitPairs = [[blocks.get("B7"), blocks.get("B6")], [blocks.get("B4"), blocks.get("B3")]];
    const splitGaps = splitPairs.map(([upper, lower]) => lower.y - (upper.y + upper.h));
    if (splitPairs.some(([upper, lower]) => !nearlyEqual(upper.w, lower.w) || !nearlyEqual(upper.h, lower.h))) {
      issues.push("BMC split-column frames must have equal widths and heights");
    }
    if (splitGaps.some((gap) => gap <= 0) || splitGaps.some((gap) => !nearlyEqual(gap, horizontalGaps[0]))) {
      issues.push(`BMC split-column gaps must match the grid gap: ${splitGaps.join(", ")}`);
    }

    const bottom = [blocks.get("B9"), blocks.get("B5")];
    const bottomGap = bottom[1].x - (bottom[0].x + bottom[0].w);
    if (!nearlyEqual(bottom[0].y, bottom[1].y) || !nearlyEqual(bottom[0].w, bottom[1].w) || !nearlyEqual(bottom[0].h, bottom[1].h)) {
      issues.push("BMC bottom-row frames must be aligned and equal");
    }
    if (!nearlyEqual(bottomGap, horizontalGaps[0])) {
      issues.push(`BMC bottom-row gap must match the grid gap: ${bottomGap}`);
    }
    const topBottom = Math.max(...top.map((block) => block.y + (block.id === "B7" || block.id === "B4" ? blocks.get(block.id === "B7" ? "B6" : "B3").y + blocks.get(block.id === "B7" ? "B6" : "B3").h - block.y : block.h)));
    const rowGap = bottom[0].y - topBottom;
    if (!nearlyEqual(rowGap, horizontalGaps[0])) {
      issues.push(`BMC row gap must match the grid gap: ${rowGap}`);
    }
    if (frame.x !== null) {
      const leftMargin = top[0].x - frame.x;
      const rightMargin = frame.x + frame.w - (top.at(-1).x + top.at(-1).w);
      if (!nearlyEqual(leftMargin, rightMargin, 2)) {
        issues.push(`BMC grid side margins must be balanced: ${leftMargin}, ${rightMargin}`);
      }
    }
  }

  return issues;
}

export function wrapPlantUmlLine(value, maxCharacters = 58) {
  const words = String(value).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (word.length > maxCharacters) {
      throw new Error(`PlantUML word exceeds ${maxCharacters} characters: ${word}`);
    }
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > maxCharacters) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

export function validateBmcPlantUmlLayout(plantUml, maxCharacters = 58) {
  const issues = [];
  if (/generated by|do not edit by hand/iu.test(plantUml)) {
    issues.push("PlantUML BMC must not expose generator service comments");
  }
  if (!plantUml.startsWith("@startuml") || !plantUml.trimEnd().endsWith("@enduml")) {
    issues.push("PlantUML BMC must have @startuml/@enduml boundaries");
  }
  for (const [name, minimum] of [["nodesep", 16], ["ranksep", 18]]) {
    const match = new RegExp(`skinparam ${name} (\\d+)`).exec(plantUml);
    if (!match || Number(match[1]) < minimum) {
      issues.push(`PlantUML ${name} must be at least ${minimum}`);
    }
  }

  const labels = [...plantUml.matchAll(/rectangle "((?:\\.|[^"])*)" as ([A-Za-z0-9]+)/g)];
  const aliases = new Set(labels.map((match) => match[2]));
  if (aliases.size !== labels.length) {
    issues.push("PlantUML BMC contains duplicate layout aliases");
  }
  for (const alias of ["B8", "B76", "B2", "B43", "B1", "B9", "B5", "E1", "E2", "E3"]) {
    if (!aliases.has(alias)) {
      issues.push(`PlantUML BMC is missing layout node ${alias}`);
    }
  }
  const blockNumbers = new Set();
  const blockNumbersByAlias = new Map();
  for (const match of labels) {
    const alias = match[2];
    const aliasBlockNumbers = new Set();
    for (const rawLine of match[1].split("\\n")) {
      const line = stripMarkup(rawLine);
      const numberMatch = /^(\d+)\./.exec(line);
      if (numberMatch) {
        const blockNumber = Number(numberMatch[1]);
        blockNumbers.add(blockNumber);
        aliasBlockNumbers.add(blockNumber);
      }
      if (line !== "==" && line.length > maxCharacters) {
        issues.push(`PlantUML ${alias} label line exceeds ${maxCharacters} characters: ${line}`);
      }
    }
    blockNumbersByAlias.set(alias, aliasBlockNumbers);
  }
  for (let number = 1; number <= 9; number += 1) {
    if (!blockNumbers.has(number)) {
      issues.push(`PlantUML BMC is missing business block ${number}`);
    }
  }

  const expectedBlocksByAlias = new Map([
    ["B8", [8]],
    ["B76", [6, 7]],
    ["B2", [2]],
    ["B43", [3, 4]],
    ["B1", [1]],
    ["B9", [9]],
    ["B5", [5]],
    ["E1", []],
    ["E2", []],
    ["E3", []],
  ]);
  for (const [alias, expected] of expectedBlocksByAlias) {
    const actual = [...(blockNumbersByAlias.get(alias) ?? [])].sort((left, right) => left - right);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      issues.push(`PlantUML ${alias} must contain business blocks ${expected.join(", ") || "none"}; found ${actual.join(", ") || "none"}`);
    }
  }

  for (const relation of [
    "B8 -[hidden]right- B76",
    "B76 -[hidden]right- B2",
    "B2 -[hidden]right- B43",
    "B43 -[hidden]right- B1",
    "B8 -[hidden]down- B9",
    "B76 -[hidden]down- E1",
    "B2 -[hidden]down- B5",
    "B43 -[hidden]down- E2",
    "B1 -[hidden]down- E3",
    "B9 -[hidden]right- E1",
    "E1 -[hidden]right- B5",
    "B5 -[hidden]right- E2",
    "E2 -[hidden]right- E3",
  ]) {
    if (!plantUml.includes(relation)) {
      issues.push(`PlantUML BMC is missing grid relation: ${relation}`);
    }
  }
  return issues;
}
