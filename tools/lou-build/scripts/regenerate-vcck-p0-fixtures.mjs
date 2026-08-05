#!/usr/bin/env node
/**
 * Regenerate VCCK P0.8 negative + reject fixtures (topological rejects + text load).
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { fileURLToPath } from "node:url";
import { VCCK_NEGATIVE, VCCK_REJECT } from "../lib/vcck/paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const S = { class: "scaffolding" };
const K = { class: "sourced", kp: ["KP-VCK-001"] };

function writeYaml(filePath, doc) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, YAML.stringify(doc));
}

const disconnectedCausal = (id, question) => ({
  spec_version: "0.1",
  primitive: "causal-graph",
  chapter: "vcck/fixtures",
  element: `vcck-${id}`,
  question,
  nodes: [
    { id: "a", kind: "state", label: "Composant A", ...S },
    { id: "b", kind: "state", label: "Composant B", ...S },
    { id: "c", kind: "state", label: "Composant C", ...S },
    { id: "d", kind: "state", label: "Composant D", ...S },
  ],
  edges: [
    { from: "a", to: "b", relation: "causes", ...S },
    { from: "c", to: "d", relation: "causes", ...S },
  ],
});

const unsupportedDecision = (id, question) => ({
  spec_version: "0.2",
  primitive: "decision-algorithm",
  variant: "diagnostic",
  technology: "svg",
  chapter: "vcck/fixtures",
  element: `vcck-${id}`,
  question,
  provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
  nodes: [
    { id: "start", kind: "entry", label: "Entrée", ...S },
    { id: "a", kind: "test", label: "Test A", ...S },
    { id: "b", kind: "test", label: "Test B", ...S },
    { id: "c", kind: "test", label: "Test C", ...S },
    { id: "d", kind: "dead-end", label: "Arrêt D", ...S },
    { id: "e", kind: "dead-end", label: "Arrêt E", ...S },
    { id: "f", kind: "conclusion", label: "Fin F", ...S },
  ],
  branches: [
    { id: "b1", from: "start", to: "a", condition: "Cas alpha", ...S },
    { id: "b2", from: "start", to: "b", condition: "Cas beta", ...S },
    { id: "b3", from: "start", to: "c", condition: "Cas gamma", ...S },
    { id: "b4", from: "a", to: "d", condition: "Vers D", ...S },
    { id: "b5", from: "b", to: "e", condition: "Vers E", ...S },
    { id: "b6", from: "c", to: "f", condition: "Vers F", ...S },
  ],
  annotations: [{ id: "ann", label: "Note", placement: "out-of-flow", ...S }],
});

const missingTerminalDecision = (id) => ({
  spec_version: "0.2",
  primitive: "decision-algorithm",
  variant: "diagnostic",
  technology: "svg",
  chapter: "vcck/fixtures",
  element: `vcck-${id}`,
  question: "Negative — aucun terminal dead-end",
  provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
  nodes: [
    { id: "start", kind: "entry", label: "Start", ...S },
    { id: "mid", kind: "test", label: "Mid", ...S },
    { id: "end", kind: "conclusion", label: "End", ...S },
  ],
  branches: [
    { id: "b1", from: "start", to: "mid", condition: "A", ...S },
    { id: "b2", from: "mid", to: "end", condition: "B", ...S },
  ],
  annotations: [{ id: "ann", label: "Note", placement: "out-of-flow", ...S }],
});

const textLoadCausal = (id, family) => ({
  ...disconnectedCausal(id, `Negative texte — charge excessive ${family}`),
  nodes: [
    { id: "a", kind: "state", label: "Un libellé volontairement trop long pour dépasser le budget de mots autorisé ici", ...S },
    { id: "b", kind: "state", label: "B", ...S },
  ],
  edges: [{ from: "a", to: "b", relation: "causes", ...S }],
});

const TOPO_NEGATIVES = {
  "chain-negative": disconnectedCausal("chain-negative", "Negative topo — graphe déconnecté"),
  "fan-out-negative": disconnectedCausal("fan-out-negative", "Negative topo — graphe déconnecté"),
  "fan-in-negative": disconnectedCausal("fan-in-negative", "Negative topo — graphe déconnecté"),
  "diamond-negative": {
    spec_version: "0.1",
    primitive: "causal-graph",
    chapter: "vcck/fixtures",
    element: "vcck-diamond-negative",
    question: "Negative — topologie K3,2 non planaire",
    nodes: [
      { id: "s1", kind: "response", label: "S1", ...S },
      { id: "s2", kind: "response", label: "S2", ...S },
      { id: "s3", kind: "response", label: "S3", ...S },
      { id: "t1", kind: "state", label: "T1", ...S },
      { id: "t2", kind: "state", label: "T2", ...S },
    ],
    edges: [
      { from: "s1", to: "t1", relation: "causes", ...S },
      { from: "s1", to: "t2", relation: "causes", ...S },
      { from: "s2", to: "t1", relation: "causes", ...S },
      { from: "s2", to: "t2", relation: "causes", ...S },
      { from: "s3", to: "t1", relation: "causes", ...S },
      { from: "s3", to: "t2", relation: "causes", ...S },
    ],
  },
  "lateral-feedback-negative": {
    spec_version: "0.1",
    primitive: "causal-graph",
    chapter: "vcck/fixtures",
    element: "vcck-lateral-feedback-negative",
    question: "Negative — cycle sans feeds_back",
    nodes: [
      { id: "a", kind: "state", label: "A", ...S },
      { id: "b", kind: "state", label: "B", ...S },
      { id: "c", kind: "state", label: "C", ...S },
    ],
    edges: [
      { from: "a", to: "b", relation: "causes", ...S },
      { from: "b", to: "c", relation: "causes", ...S },
      { from: "c", to: "a", relation: "causes", ...S },
    ],
  },
  "dependent-sequence-negative": missingTerminalDecision("dependent-sequence-negative"),
  "binary-rule-out-negative": missingTerminalDecision("binary-rule-out-negative"),
  "skip-level-branch-negative": unsupportedDecision("skip-level-branch-negative", "Negative — branchement non supporté"),
  "monitoring-loop-negative": unsupportedDecision("monitoring-loop-negative", "Negative — branchement non supporté"),
  "embedded-fragment-negative": unsupportedDecision("embedded-fragment-negative", "Negative — branchement non supporté"),
  "single-context-negative": {
    spec_version: "0.2",
    primitive: "threshold-scale",
    variant: "numeric-contextual",
    technology: "svg",
    chapter: "vcck/fixtures",
    element: "vcck-single-context-negative",
    question: "Negative — zéro contexte",
    provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
    contexts: [],
    interpretations: [{ id: "i1", label: "Note", attach_to: "not-low-band", ...K }],
    confounders: { increase: [], decrease: [] },
  },
  "dual-context-negative": {
    spec_version: "0.2",
    primitive: "threshold-scale",
    variant: "numeric-contextual",
    technology: "svg",
    chapter: "vcck/fixtures",
    element: "vcck-dual-context-negative",
    question: "Negative — zéro contexte",
    provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
    contexts: [],
    interpretations: [{ id: "i1", label: "Note", attach_to: "not-low-band", ...K }],
    confounders: { increase: [], decrease: [] },
  },
  "two-pole-negative": {
    spec_version: "0.2",
    primitive: "comparison-matrix",
    technology: "semantic-html",
    chapter: "vcck/fixtures",
    element: "vcck-two-pole-negative",
    question: "Negative — un seul pôle",
    provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
    poles: [{ id: "a", label: "A", pole_type: "entity", ...S }],
    dimensions: [{ id: "d1", label: "Dim", ...S, cells: [{ pole: "a", items: [{ id: "i1", label: "X", ...K }] }] }],
  },
  "three-pole-reflow-negative": {
    spec_version: "0.2",
    primitive: "comparison-matrix",
    technology: "semantic-html",
    chapter: "vcck/fixtures",
    element: "vcck-three-pole-negative",
    question: "Negative — un seul pôle",
    provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
    poles: [{ id: "a", label: "A", pole_type: "entity", ...S }],
    dimensions: [{ id: "d1", label: "Dim", ...S, cells: [{ pole: "a", items: [{ id: "i1", label: "X", ...K }] }] }],
  },
  "flat-concurrent-negative": {
    spec_version: "0.2",
    primitive: "enumeration-set",
    technology: "semantic-html",
    chapter: "vcck/fixtures",
    element: "vcck-flat-concurrent-negative",
    question: "Negative — logique non concurrente",
    provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
    set: { label: "Set", membership_logic: "exclusive-set", expected_cardinality: 2 },
    groups: [],
  },
  "grouped-concurrent-negative": {
    spec_version: "0.2",
    primitive: "enumeration-set",
    technology: "semantic-html",
    chapter: "vcck/fixtures",
    element: "vcck-grouped-concurrent-negative",
    question: "Negative — un seul groupe",
    provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
    set: { label: "Set", membership_logic: "exclusive-set" },
    groups: [{ id: "g1", label: "G1", items: [{ id: "i1", label: "Item", ...K }] }],
  },
  "identity-negative": {
    spec_version: "0.2",
    primitive: "quantity-model",
    technology: "semantic-html",
    chapter: "vcck/fixtures",
    element: "vcck-identity-negative",
    question: "Negative — deux états sans identité",
    provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
    target: { label: "Cible", ...S },
    states: [
      { id: "s1", label: "S1", values: [{ value: 1, unit: "u" }] },
      { id: "s2", label: "S2", values: [{ value: 2, unit: "u" }] },
    ],
    identities: [],
    insights: [],
  },
  "two-state-negative": {
    spec_version: "0.2",
    primitive: "quantity-model",
    technology: "semantic-html",
    chapter: "vcck/fixtures",
    element: "vcck-two-state-negative",
    question: "Negative — un seul état",
    provenance: { source_edition: 2022, walkthrough: "VCCK", methodology_version: "vcck-p0" },
    target: { label: "Cible", ...S },
    states: [{ id: "s1", label: "S1", values: [{ value: 1, unit: "u" }] }],
    identities: [],
    insights: [],
  },
};

const TEXT_NEGATIVES = {};
for (const family of Object.keys(TOPO_NEGATIVES)) {
  const base = family.replace("-negative", "");
  TEXT_NEGATIVES[`${base}-text-negative.yaml`] = textLoadCausal(`${base}-text-negative`, base);
}

const REJECT = {
  "reject-unsupported-topology.yaml": disconnectedCausal("reject-unsupported-topology", "Reject UNSUPPORTED_TOPOLOGY"),
  "reject-non-planar.yaml": TOPO_NEGATIVES["diamond-negative"],
  "reject-temporal-as-causal.yaml": TOPO_NEGATIVES["lateral-feedback-negative"],
  "reject-missing-terminal.yaml": missingTerminalDecision("reject-missing-terminal"),
  "reject-unlabelled-branch.yaml": {
    ...missingTerminalDecision("reject-unlabelled-branch"),
    nodes: [
      { id: "start", kind: "entry", label: "Start", ...S },
      { id: "end", kind: "dead-end", label: "Stop", ...S },
    ],
    branches: [{ id: "b1", from: "start", to: "end", condition: "", ...S }],
  },
  "reject-ambiguous-edge.yaml": {
    ...disconnectedCausal("reject-ambiguous-edge", "Reject AMBIGUOUS_EDGE_ORIGIN"),
    edges: [
      { from: "a", to: "b", relation: "causes", ...S },
      { from: "a", to: "b", relation: "causes", ...S },
    ],
  },
  "reject-unsupported-nesting.yaml": {
    ...disconnectedCausal("reject-unsupported-nesting", "Reject UNSUPPORTED_NESTING"),
    nested_primitive: "threshold-scale",
  },
  "reject-budget-exceeded.yaml": {
    spec_version: "0.1",
    primitive: "causal-graph",
    chapter: "vcck/fixtures",
    element: "vcck-reject-budget",
    question: "Reject BUDGET_EXCEEDED",
    nodes: Array.from({ length: 10 }, (_, i) => ({
      id: `n${i}`,
      kind: "state",
      label: `N${i}`,
      ...S,
    })),
    edges: Array.from({ length: 9 }, (_, i) => ({
      from: `n${i}`,
      to: `n${i + 1}`,
      relation: "causes",
      ...S,
    })),
  },
  "reject-text-load.yaml": textLoadCausal("reject-text-load", "reject"),
};

for (const [name, doc] of Object.entries(TOPO_NEGATIVES)) {
  writeYaml(path.join(VCCK_NEGATIVE, `${name}.yaml`), doc);
}
for (const [name, doc] of Object.entries(TEXT_NEGATIVES)) {
  writeYaml(path.join(VCCK_NEGATIVE, name), doc);
}
for (const [name, doc] of Object.entries(REJECT)) {
  writeYaml(path.join(VCCK_REJECT, name), doc);
}

console.log(`Wrote ${Object.keys(TOPO_NEGATIVES).length} topo negatives`);
console.log(`Wrote ${Object.keys(TEXT_NEGATIVES).length} text negatives`);
console.log(`Wrote ${Object.keys(REJECT).length} reject fixtures`);
