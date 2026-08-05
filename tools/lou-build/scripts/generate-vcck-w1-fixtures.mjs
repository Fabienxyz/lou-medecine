#!/usr/bin/env node
/** Generate W1 fixture bundle — generic content only, no medical strings. */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { VCCK_W1, VCCK_POSITIVE } from "../lib/vcck/paths.js";
import { loadFamilyRegistry } from "../lib/vcck/registry.js";

const TEXT_90_LABEL =
  "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo";

function writeYaml(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, YAML.stringify(obj));
}

function chainFixtures(dir, maxNodes) {
  const mkNodes = (n, labelFn) =>
    Array.from({ length: n }, (_, i) => ({
      id: `n${i}`,
      kind: i === n - 1 ? "event" : "state",
      label: labelFn(i),
      class: "scaffolding",
    }));
  const mkEdges = (n) =>
    Array.from({ length: n - 1 }, (_, i) => ({
      from: `n${i}`,
      to: `n${i + 1}`,
      relation: "causes",
      class: "scaffolding",
    }));

  const short = {
    spec_version: "0.1",
    primitive: "causal-graph",
    chapter: "vcck/w1",
    element: "w1-chain-short",
    question: "Comment progresse un colis ?",
    nodes: mkNodes(3, (i) => ["Dépôt", "Plateforme", "Livraison"][i]),
    edges: mkEdges(3),
  };
  writeYaml(path.join(dir, "chain-short.yaml"), short);

  const cardinalN = Math.max(2, Math.ceil(maxNodes * 0.9));
  writeYaml(path.join(dir, "chain-cardinal-90.yaml"), {
    ...short,
    element: "w1-chain-cardinal-90",
    nodes: mkNodes(cardinalN, (i) => `Étape ${i + 1}`),
    edges: mkEdges(cardinalN),
  });

  writeYaml(path.join(dir, "chain-text-90.yaml"), {
    ...short,
    element: "w1-chain-text-90",
    nodes: mkNodes(3, (i) =>
      i === 1 ? TEXT_90_LABEL : ["Dépôt central", "Livraison locale"][i === 0 ? 0 : 1],
    ),
  });

  writeYaml(path.join(dir, "chain-topo-negative.yaml"), {
    ...short,
    element: "w1-chain-topo-negative",
    nodes: [...short.nodes, { id: "fork", kind: "state", label: "Fork", class: "scaffolding" }],
    edges: [...short.edges, { from: "n1", to: "fork", relation: "causes", class: "scaffolding" }],
  });

  writeYaml(path.join(dir, "chain-text-negative.yaml"), {
    ...short,
    element: "w1-chain-text-negative",
    nodes: [{ id: "n0", kind: "state", label: "Un deux trois quatre cinq six sept huit neuf dix onze douze treize", class: "scaffolding" }],
    edges: [],
  });

  writeYaml(path.join(dir, "chain-cardinal-plus1.yaml"), {
    ...short,
    element: "w1-chain-cardinal-plus1",
    nodes: mkNodes(maxNodes + 1, (i) => `N${i}`),
    edges: mkEdges(maxNodes + 1),
  });

  writeYaml(path.join(dir, "chain-permutation.yaml"), {
    ...short,
    element: "w1-chain-permutation",
    nodes: [short.nodes[2], short.nodes[0], short.nodes[1]],
    edges: [
      { from: "n2", to: "n0", relation: "causes", class: "scaffolding" },
      { from: "n0", to: "n1", relation: "causes", class: "scaffolding" },
    ],
  });

  writeYaml(path.join(dir, "chain-accents.yaml"), {
    ...short,
    element: "w1-chain-accents",
    question: "Où va l'été français ?",
    nodes: mkNodes(3, (i) => ["Été", "Automne", "Hiver"][i]),
  });

  writeYaml(path.join(dir, "chain-apostrophe.yaml"), {
    ...short,
    element: "w1-chain-apostrophe",
    question: "Qu\u2019est-ce qui avance ?",
  });

  writeYaml(path.join(dir, "chain-comparator.yaml"), {
    ...short,
    element: "w1-chain-comparator",
    nodes: mkNodes(3, (i) => (i === 1 ? "A \u2264 B" : ["Entrée", "Sortie"][i === 0 ? 0 : 1])),
  });

  writeYaml(path.join(dir, "chain-unit.yaml"), {
    ...short,
    element: "w1-chain-unit",
    nodes: mkNodes(3, (i) => (i === 1 ? "12 kg" : ["Mesure", "Résultat"][i === 0 ? 0 : 1])),
  });

  writeYaml(path.join(dir, "chain-symbols.yaml"), {
    ...short,
    element: "w1-chain-symbols",
    nodes: mkNodes(3, (i) => (i === 1 ? "A \u2192 B" : ["Source", "Cible"][i === 0 ? 0 : 1])),
  });

  writeYaml(path.join(dir, "chain-stress-90.yaml"), {
    ...short,
    element: "w1-chain-stress-90",
    question: "Où va l'été — A \u2264 B ?",
    nodes: mkNodes(cardinalN, (i) =>
      i === Math.floor(cardinalN / 2) ? TEXT_90_LABEL : `Étape ${i + 1}`,
    ),
    edges: mkEdges(cardinalN),
  });
}

function decisionFixtures(dir, maxNodes) {
  const base = {
    spec_version: "0.2",
    primitive: "decision-algorithm",
    variant: "diagnostic",
    technology: "svg",
    chapter: "vcck/w1",
    provenance: { source_edition: 2022, walkthrough: "VCCK-W1", methodology_version: "w1" },
    annotations: [
      { id: "ann-urgency", label: "Note technique", placement: "out-of-flow", class: "scaffolding" },
    ],
  };
  const linear = (n, labels) => {
    const nodes = labels.map((label, i) => ({
      id: `s${i}`,
      kind: i === 0 ? "entry" : i === n - 1 ? "conclusion" : "test",
      label,
      class: "scaffolding",
    }));
    const branches = Array.from({ length: n - 1 }, (_, i) => ({
      id: `b${i}`,
      from: `s${i}`,
      to: `s${i + 1}`,
      condition: `Étape ${i + 1}`,
      class: "scaffolding",
    }));
    return { nodes, branches };
  };

  const short = { ...base, element: "w1-dependent-sequence-short", question: "Quel enchaînement ?", ...linear(3, ["Ouverture", "Contrôle", "Fin"]) };
  writeYaml(path.join(dir, "dependent-sequence-short.yaml"), short);

  const n90 = Math.max(2, Math.ceil(maxNodes * 0.9));
  writeYaml(path.join(dir, "dependent-sequence-cardinal-90.yaml"), {
    ...base,
    element: "w1-dependent-sequence-cardinal-90",
    question: "Enchaînement long",
    ...linear(n90, Array.from({ length: n90 }, (_, i) => `Étape ${i + 1}`)),
  });

  writeYaml(path.join(dir, "dependent-sequence-topo-negative.yaml"), {
    ...short,
    element: "w1-dependent-sequence-topo-negative",
    nodes: [...short.nodes, { id: "alt", kind: "conclusion", label: "Alt", class: "scaffolding" }],
    branches: [...short.branches, { id: "b-alt", from: "s1", to: "alt", condition: "Autre", class: "scaffolding" }],
  });

  writeYaml(path.join(dir, "dependent-sequence-text-negative.yaml"), {
    ...short,
    element: "w1-dependent-sequence-text-negative",
    nodes: [{ id: "s0", kind: "entry", label: "Un deux trois quatre cinq six sept huit neuf dix onze douze treize", class: "scaffolding" }],
    branches: [],
  });

  writeYaml(path.join(dir, "dependent-sequence-cardinal-plus1.yaml"), {
    ...base,
    element: "w1-dependent-sequence-cardinal-plus1",
    question: "Trop long",
    ...linear(maxNodes + 1, Array.from({ length: maxNodes + 1 }, (_, i) => `N${i}`)),
  });

  writeYaml(path.join(dir, "dependent-sequence-permutation.yaml"), {
    ...short,
    element: "w1-dependent-sequence-permutation",
    nodes: [short.nodes[2], short.nodes[0], short.nodes[1]],
    branches: [...short.branches],
  });

  writeYaml(path.join(dir, "dependent-sequence-accents.yaml"), {
    ...short,
    element: "w1-dependent-sequence-accents",
    question: "Procédure été",
    ...linear(3, ["Été", "Contrôle", "Clôture"]),
  });

  writeYaml(path.join(dir, "dependent-sequence-apostrophe.yaml"), {
    ...short,
    element: "w1-dependent-sequence-apostrophe",
    question: "Qu\u2019est-ce qui suit ?",
  });

  writeYaml(path.join(dir, "dependent-sequence-comparator.yaml"), {
    ...short,
    element: "w1-dependent-sequence-comparator",
    ...linear(3, ["Entrée", "A \u2264 B", "Sortie"]),
  });

  writeYaml(path.join(dir, "dependent-sequence-unit.yaml"), {
    ...short,
    element: "w1-dependent-sequence-unit",
    ...linear(3, ["Mesure", "12 kg", "Résultat"]),
  });

  writeYaml(path.join(dir, "dependent-sequence-symbols.yaml"), {
    ...short,
    element: "w1-dependent-sequence-symbols",
    ...linear(3, ["A", "A \u2192 B", "B"]),
  });

  writeYaml(path.join(dir, "dependent-sequence-text-90.yaml"), {
    ...short,
    element: "w1-dependent-sequence-text-90",
    ...linear(3, ["Entrée", TEXT_90_LABEL, "Sortie"]),
  });

  writeYaml(path.join(dir, "dependent-sequence-stress-90.yaml"), {
    ...base,
    element: "w1-dependent-sequence-stress-90",
    question: "Procédure été — A \u2192 B",
    ...linear(n90, Array.from({ length: n90 }, (_, i) =>
      i === Math.floor(n90 / 2) ? TEXT_90_LABEL : `Étape ${i + 1}`,
    )),
  });
}

function twoPoleFixtures(dir) {
  const base = {
    spec_version: "0.2",
    primitive: "comparison-matrix",
    technology: "semantic-html",
    chapter: "vcck/w1",
    provenance: { source_edition: 2022, walkthrough: "VCCK-W1", methodology_version: "w1" },
    poles: [
      { id: "a", label: "Mode A", pole_type: "entity", class: "scaffolding" },
      { id: "b", label: "Mode B", pole_type: "entity", class: "scaffolding" },
    ],
  };
  const dim = (id, label, aLabel, bLabel) => ({
    id,
    label,
    class: "scaffolding",
    cells: [
      { pole: "a", items: [{ id: `${id}-a`, label: aLabel, class: "scaffolding" }] },
      { pole: "b", items: [{ id: `${id}-b`, label: bLabel, class: "scaffolding" }] },
    ],
  });

  writeYaml(path.join(dir, "two-pole-short.yaml"), {
    ...base,
    element: "w1-two-pole-short",
    question: "Quelle différence ?",
    dimensions: [dim("d1", "Vitesse", "Flexible", "Massifiée")],
  });

  writeYaml(path.join(dir, "two-pole-topo-negative.yaml"), {
    ...base,
    element: "w1-two-pole-topo-negative",
    question: "Incomplete",
    poles: [{ id: "a", label: "A", pole_type: "entity", class: "scaffolding" }],
    dimensions: [dim("d1", "D", "X", "Y")],
  });

  writeYaml(path.join(dir, "two-pole-text-negative.yaml"), {
    ...base,
    element: "w1-two-pole-text-negative",
    question: "Trop long",
    dimensions: [
      dim("d1", "Un deux trois quatre cinq six sept huit neuf dix onze douze treize", "X", "Y"),
    ],
  });

  const short = {
    ...base,
    element: "w1-two-pole-short",
    question: "Quelle différence ?",
    dimensions: [dim("d1", "Vitesse", "Flexible", "Massifiée")],
  };

  writeYaml(path.join(dir, "two-pole-cardinal-90.yaml"), {
    ...base,
    element: "w1-two-pole-cardinal-90",
    question: "Matrice dense",
    dimensions: Array.from({ length: 8 }, (_, i) =>
      dim(`d${i}`, `Dimension ${i + 1}`, `A${i}`, `B${i}`),
    ),
  });

  writeYaml(path.join(dir, "two-pole-cardinal-plus1.yaml"), {
    ...base,
    element: "w1-two-pole-cardinal-plus1",
    question: "Trop de dimensions",
    dimensions: Array.from({ length: 9 }, (_, i) =>
      dim(`d${i}`, `Dim ${i + 1}`, "X", "Y"),
    ),
  });

  writeYaml(path.join(dir, "two-pole-accents.yaml"), {
    ...short,
    element: "w1-two-pole-accents",
    question: "Différences été",
    dimensions: [dim("d1", "Été", "Café", "Thé")],
  });

  writeYaml(path.join(dir, "two-pole-apostrophe.yaml"), {
    ...short,
    element: "w1-two-pole-apostrophe",
    question: "Qu\u2019est-ce qui diffère ?",
  });

  writeYaml(path.join(dir, "two-pole-comparator.yaml"), {
    ...short,
    element: "w1-two-pole-comparator",
    dimensions: [dim("d1", "Ordre", "A \u2264 B", "B \u2264 A")],
  });

  writeYaml(path.join(dir, "two-pole-unit.yaml"), {
    ...short,
    element: "w1-two-pole-unit",
    dimensions: [dim("d1", "Masse", "12 kg", "15 kg")],
  });

  writeYaml(path.join(dir, "two-pole-symbols.yaml"), {
    ...short,
    element: "w1-two-pole-symbols",
    dimensions: [dim("d1", "Flux", "A \u2192 B", "B \u2192 A")],
  });

  writeYaml(path.join(dir, "two-pole-permutation.yaml"), {
    ...short,
    element: "w1-two-pole-permutation",
    poles: [base.poles[1], base.poles[0]],
  });

  writeYaml(path.join(dir, "two-pole-text-90.yaml"), {
    ...short,
    element: "w1-two-pole-text-90",
    dimensions: [dim("d1", TEXT_90_LABEL, "Flexible", "Massifiée")],
  });

  writeYaml(path.join(dir, "two-pole-stress-90.yaml"), {
    ...base,
    element: "w1-two-pole-stress-90",
    question: "Qu\u2019est-ce qui diffère — A \u2264 B ?",
    dimensions: Array.from({ length: 8 }, (_, i) =>
      dim(
        `d${i}`,
        i === 4 ? TEXT_90_LABEL : `Dimension ${i + 1}`,
        i === 1 ? "A \u2192 B" : `A${i}`,
        `B${i}`,
      ),
    ),
  });
}

function flatConcurrentFixtures(dir, maxItems) {
  const items = (labels) =>
    labels.map((label, i) => ({ id: `i${i}`, label, class: "scaffolding" }));
  const group = (labels) => ({
    id: "grp",
    label: "Ensemble",
    membership_logic: "concurrent-set",
    ordering_semantics: "none",
    expected_cardinality: labels.length,
    class: "scaffolding",
    items: items(labels),
  });

  const base = {
    spec_version: "0.2",
    primitive: "enumeration-set",
    technology: "semantic-html",
    chapter: "vcck/w1",
    provenance: { source_edition: 2022, walkthrough: "VCCK-W1", methodology_version: "w1" },
    set: {
      id: "set",
      label: "Capteurs",
      membership_logic: "concurrent-set",
      ordering_semantics: "none",
      expected_cardinality: 3,
      class: "scaffolding",
    },
  };

  const shortFc = {
    ...base,
    element: "w1-flat-concurrent-short",
    question: "Quels capteurs ?",
    groups: [group(["Température", "Humidité", "Pression"])],
  };
  writeYaml(path.join(dir, "flat-concurrent-short.yaml"), shortFc);

  const n90 = Math.max(1, Math.ceil(maxItems * 0.9));
  writeYaml(path.join(dir, "flat-concurrent-cardinal-90.yaml"), {
    ...base,
    element: "w1-flat-concurrent-cardinal-90",
    question: "Liste dense",
    set: { ...base.set, expected_cardinality: n90 },
    groups: [group(Array.from({ length: n90 }, (_, i) => `Item ${i + 1}`))],
  });

  writeYaml(path.join(dir, "flat-concurrent-topo-negative.yaml"), {
    ...base,
    element: "w1-flat-concurrent-topo-negative",
    question: "Cardinalité incompatible",
    set: { ...base.set, expected_cardinality: 5 },
    groups: [group(["Température", "Humidité", "Pression"])],
  });

  writeYaml(path.join(dir, "flat-concurrent-text-negative.yaml"), {
    ...base,
    element: "w1-flat-concurrent-text-negative",
    question: "Trop long",
    groups: [
      group([
        "Un deux trois quatre cinq six sept huit neuf dix onze douze treize",
        "Humidité",
        "Pression",
      ]),
    ],
  });

  writeYaml(path.join(dir, "flat-concurrent-cardinal-plus1.yaml"), {
    ...base,
    element: "w1-flat-concurrent-cardinal-plus1",
    question: "Trop",
    set: { ...base.set, expected_cardinality: maxItems + 1 },
    groups: [group(Array.from({ length: maxItems + 1 }, (_, i) => `X${i}`))],
  });

  writeYaml(path.join(dir, "flat-concurrent-text-90.yaml"), {
    ...base,
    element: "w1-flat-concurrent-text-90",
    question: "Liste longue",
    groups: [
      group([TEXT_90_LABEL, "Humidité", "Pression"]),
    ],
  });

  writeYaml(path.join(dir, "flat-concurrent-permutation.yaml"), {
    ...shortFc,
    element: "w1-flat-concurrent-permutation",
    groups: [group(["Pression", "Température", "Humidité"])],
  });

  writeYaml(path.join(dir, "flat-concurrent-accents.yaml"), {
    ...shortFc,
    element: "w1-flat-concurrent-accents",
    question: "Capteurs été",
    groups: [group(["Été", "Automne", "Hiver"])],
  });

  writeYaml(path.join(dir, "flat-concurrent-apostrophe.yaml"), {
    ...shortFc,
    element: "w1-flat-concurrent-apostrophe",
    question: "Qu\u2019est-ce qui est actif ?",
  });

  writeYaml(path.join(dir, "flat-concurrent-comparator.yaml"), {
    ...shortFc,
    element: "w1-flat-concurrent-comparator",
    groups: [group(["A \u2264 B", "Humidité", "Pression"])],
  });

  writeYaml(path.join(dir, "flat-concurrent-unit.yaml"), {
    ...shortFc,
    element: "w1-flat-concurrent-unit",
    groups: [group(["12 kg", "Humidité", "Pression"])],
  });

  writeYaml(path.join(dir, "flat-concurrent-symbols.yaml"), {
    ...shortFc,
    element: "w1-flat-concurrent-symbols",
    groups: [group(["A \u2192 B", "Humidité", "Pression"])],
  });

  writeYaml(path.join(dir, "flat-concurrent-stress-90.yaml"), {
    ...base,
    element: "w1-flat-concurrent-stress-90",
    question: "Capteurs été — A \u2264 B",
    set: { ...base.set, expected_cardinality: n90 },
    groups: [
      group(
        Array.from({ length: n90 }, (_, i) =>
          i === Math.floor(n90 / 2) ? TEXT_90_LABEL : `Item ${i + 1}`,
        ),
      ),
    ],
  });
}

for (const family of loadFamilyRegistry().families.filter((f) =>
  ["chain", "dependent-sequence", "two-pole", "flat-concurrent"].includes(f.id),
)) {
  const dir = path.join(VCCK_W1, family.id);
  if (family.id === "chain") chainFixtures(dir, family.budgets.maxNodes);
  if (family.id === "dependent-sequence") decisionFixtures(dir, family.budgets.maxNodes);
  if (family.id === "two-pole") twoPoleFixtures(dir);
  if (family.id === "flat-concurrent") flatConcurrentFixtures(dir, family.budgets.maxItems);
}

console.log("W1 fixtures written to", VCCK_W1);
