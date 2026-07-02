import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

const graphPath = "docs/architecture/schemas/traceability-graph.json";
const graph = readJson(graphPath);
const schema = readJson("schemas/traceability-graph.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

if (!validate(graph)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("traceability graph does not match schema");
}

requireFile(graph.source_plan);

const nodeById = new Map();
for (const node of graph.nodes) {
  if (nodeById.has(node.id)) {
    fail(`duplicate traceability node id: ${node.id}`);
  }
  nodeById.set(node.id, node);
  requireFile(node.artifact_path);
  for (const evidencePath of node.evidence_paths ?? []) {
    requireFile(evidencePath);
  }
}

const requiredNodeTypes = new Set([
  "source",
  "fact",
  "requirement",
  "backlog_item",
  "slide_spec",
  "rendered_artifact",
  "test_eval",
  "sprint_decision",
  "process_change",
]);
const actualNodeTypes = new Set(graph.nodes.map((node) => node.type));
for (const nodeType of requiredNodeTypes) {
  if (!actualNodeTypes.has(nodeType)) {
    fail(`traceability graph is missing node type: ${nodeType}`);
  }
}

const edgeKeys = new Set();
for (const edge of graph.edges) {
  if (!nodeById.has(edge.from)) {
    fail(`traceability edge references missing source node: ${edge.from}`);
  }
  if (!nodeById.has(edge.to)) {
    fail(`traceability edge references missing target node: ${edge.to}`);
  }
  edgeKeys.add(`${edge.from}->${edge.to}`);
  for (const evidencePath of edge.evidence_paths ?? []) {
    requireFile(evidencePath);
  }
}

for (const chain of graph.required_chains) {
  for (const nodeId of chain.ordered_node_ids) {
    if (!nodeById.has(nodeId)) {
      fail(`required chain references missing node: ${nodeId}`);
    }
  }
  const chainEdges = [];
  for (let index = 0; index < chain.ordered_node_ids.length - 1; index += 1) {
    const from = chain.ordered_node_ids[index];
    const to = chain.ordered_node_ids[index + 1];
    if (!edgeKeys.has(`${from}->${to}`)) {
      fail(`required chain is missing edge: ${from}->${to}`);
    }
    chainEdges.push(graph.edges.find((edge) => edge.from === from && edge.to === to));
  }
  if (chain.status === "covered" && chainEdges.some((edge) => edge.status !== "active")) {
    fail(`covered required chain has non-active edge: ${chain.id}`);
  }
  if (chain.status === "blocked" && !chainEdges.some((edge) => edge.status === "blocked")) {
    fail(`blocked required chain must include at least one blocked edge: ${chain.id}`);
  }
  if (chain.status === "partial" && chainEdges.every((edge) => edge.status === "active")) {
    fail(`partial required chain must include planned or blocked edge: ${chain.id}`);
  }
}

const processChangeNodes = graph.nodes.filter((node) => node.type === "process_change");
if (!processChangeNodes.some((node) => node.id.startsWith("PROC-") && node.artifact_path.includes("docs/process/change-requests/"))) {
  fail("traceability graph must include at least one process change request node");
}

const sprintDecisionNodes = graph.nodes.filter((node) => node.type === "sprint_decision");
if (!sprintDecisionNodes.some((node) => node.artifact_path.includes("/decisions.md"))) {
  fail("traceability graph must include at least one sprint decision artifact");
}

console.log("traceability graph validation passed");
