import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { fileURLToPath } from "node:url";
import {
  loadVisualSpec,
  visualSpecClaimUnits,
} from "../lib/visual-spec.js";
import { loadVisualGroundingReview } from "../lib/visual-ground.js";
import { renderVisualSpec, describeCausalGraph } from "../lib/visual-render.js";
import { layoutCausalGraph } from "../lib/visual-layout.js";
import { measureText, wrapText } from "../lib/text-fit.js";
import { REPO_ROOT } from "../lib/paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAPTER_DIR = path.join(REPO_ROOT, "01-learning/chapters/cardio/234");
const SPEC_PATH = path.join(
  CHAPTER_DIR,
  "build/visual-specs/mm-pump-decompensation.yaml"
);
const REVIEW_PATH = path.join(CHAPTER_DIR, "build/visual-grounding-review.yaml");
const FIGURE_PATH = path.join(CHAPTER_DIR, "figures/mm-pump-decompensation.svg");
const GENERIC_FIXTURE = path.join(__dirname, "fixtures/generic-causal-graph.yaml");
const SOURCE_META = { edition: 2022 };

const inventory = YAML.parse(
  fs.readFileSync(path.join(CHAPTER_DIR, "inventory.yaml"), "utf8")
);

function realSpec() {
  return loadVisualSpec(SPEC_PATH);
}
function realReview() {
  return loadVisualGroundingReview(REVIEW_PATH);
}

/** Build a review that passes every judgement-class unit of `spec`. */
function passingReview(spec) {
  const verdicts = {};
  for (const unit of visualSpecClaimUnits(spec)) {
    if (unit.class === "sourced") continue;
    verdicts[unit.id] = { status: "pass", unit_digest: unit.digest, rationale: "test" };
  }
  return { verdicts, meta: { method: "test-review" }, missing: false };
}

function renderReal(overrides = {}) {
  return renderVisualSpec({
    spec: realSpec(),
    inventory,
    sourceMeta: SOURCE_META,
    review: realReview(),
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// A / B — renders, and renders reproducibly
// ---------------------------------------------------------------------------

test("A: render-eligible spec renders successfully", () => {
  const result = renderReal();
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.stage, "rendered");
  assert.match(result.svg, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<svg /);
  assert.equal(result.layout.nodes.length, 8);
  assert.equal(result.layout.edges.length, 8);
});

test("B: identical input renders byte-identical output", () => {
  const a = renderReal();
  const b = renderReal();
  assert.equal(a.svg, b.svg);
  assert.equal(
    Buffer.compare(Buffer.from(a.svg), Buffer.from(b.svg)),
    0,
    "renderer output is not byte-stable"
  );
});

test("B2: committed figure matches a fresh render of the committed spec", () => {
  const result = renderReal();
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(
    fs.readFileSync(FIGURE_PATH, "utf8"),
    result.svg,
    "committed SVG is stale relative to the spec — re-run render-visual-specs.mjs"
  );
});

// ---------------------------------------------------------------------------
// C — the renderer is a grammar renderer, not a chapter renderer
// ---------------------------------------------------------------------------

test("C: an unrelated non-medical causal graph renders with no code change", () => {
  const spec = loadVisualSpec(GENERIC_FIXTURE);
  const result = renderVisualSpec({
    spec,
    inventory,
    sourceMeta: SOURCE_META,
    review: passingReview(spec),
  });

  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.layout.nodes.length, 4);
  assert.equal(result.layout.edges.length, 5);
  // Fan-out then fan-in then feedback: three layers.
  assert.deepEqual(result.layout.rows, [
    ["understaffing"],
    ["overtime", "deferred-maintenance"],
    ["incident-rate"],
  ]);
  assert.match(result.svg, /data-relation="feeds_back"/);
  // Nothing from the medical chapter leaked into a fixture render.
  assert.equal(result.svg.includes("cardiaque"), false);
});

// ---------------------------------------------------------------------------
// D / E / F — the gate refuses to emit
// ---------------------------------------------------------------------------

test("D: failed node grounding blocks render", () => {
  const spec = realSpec();
  spec.nodes[2].kp = ["KP-001", "KP-404"];
  const result = renderVisualSpec({
    spec,
    inventory,
    sourceMeta: SOURCE_META,
    review: realReview(),
  });
  assert.equal(result.ok, false);
  assert.equal(result.svg, null);
});

test("D2: failed edge grounding blocks render", () => {
  const spec = realSpec();
  const review = realReview();
  const edgeId = "cb-vis-mm-pump-decompensation-e-overload-to-pump-failure";
  review.verdicts[edgeId].status = "fail";

  const result = renderVisualSpec({
    spec,
    inventory,
    sourceMeta: SOURCE_META,
    review,
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "eligibility");
  assert.equal(result.svg, null);
  assert.match(result.errors.join(" | "), /is fail/);
});

test("E: stale grounding digest blocks render", () => {
  const spec = realSpec();
  const feedback = spec.edges.find((e) => e.relation === "feeds_back");
  feedback.kp = [...feedback.kp, "KP-009"];

  const result = renderVisualSpec({
    spec,
    inventory,
    sourceMeta: SOURCE_META,
    review: realReview(),
  });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "eligibility");
  assert.equal(result.svg, null);
  assert.match(result.errors.join(" | "), /is unresolved/);
});

test("E2: an unreviewed bridging edge blocks render", () => {
  const result = renderReal({ review: { verdicts: {} } });
  assert.equal(result.ok, false);
  assert.equal(result.svg, null);
});

test("F: spec validation failure blocks render before layout", () => {
  const dangling = realSpec();
  dangling.edges[1].to = "ghost";
  const a = renderVisualSpec({
    spec: dangling,
    inventory,
    sourceMeta: SOURCE_META,
    review: realReview(),
  });
  assert.equal(a.ok, false);
  assert.equal(a.stage, "validation");
  assert.equal(a.svg, null);

  const geometry = realSpec();
  geometry.nodes[0].x = 12;
  const b = renderVisualSpec({
    spec: geometry,
    inventory,
    sourceMeta: SOURCE_META,
    review: realReview(),
  });
  assert.equal(b.ok, false);
  assert.equal(b.stage, "validation");
  assert.equal(b.svg, null);
});

test("F2: an unrenderable primitive is refused rather than approximated", () => {
  const spec = realSpec();
  spec.primitive = "transmission-path";
  const result = renderVisualSpec({
    spec,
    inventory,
    sourceMeta: SOURCE_META,
    review: realReview(),
  });
  assert.equal(result.ok, false);
  assert.equal(result.svg, null);
});

// ---------------------------------------------------------------------------
// G / H — text fitting, never truncation
// ---------------------------------------------------------------------------

test("G: short labels stay on one line", () => {
  const wrapped = wrapText("Débit insuffisant", 228, 15, 600, { maxLines: 3 });
  assert.equal(wrapped.ok, true);
  assert.equal(wrapped.lines.length, 1);
  assert.equal(wrapped.lines[0], "Débit insuffisant");
});

test("G2: a long but valid label wraps without losing a single character", () => {
  const label = "Compensations neurohormonales (sympathique, SRAA)";
  const wrapped = wrapText(label, 228, 15, 600, { maxLines: 3 });
  assert.equal(wrapped.ok, true);
  assert.ok(wrapped.lines.length > 1, "expected multi-line wrap");
  assert.equal(wrapped.lines.join(" "), label);
  assert.equal(wrapped.lines.some((l) => l.includes("\u2026")), false);
  for (const line of wrapped.lines) {
    assert.ok(measureText(line, 15, 600) <= 228, `line overflows: "${line}"`);
  }
});

test("G3: no rendered line overflows its node, and no label loses content", () => {
  const result = renderReal();
  const spec = realSpec();
  const cfg = result.layout.config;
  const labels = new Map(spec.nodes.map((n) => [n.id, n.label]));

  for (const box of result.layout.nodes) {
    const inner = box.width - 2 * cfg.nodePaddingX;
    for (const line of box.lines) {
      assert.ok(
        measureText(line, cfg.fontSize, cfg.fontWeight) <= inner + 0.5,
        `node ${box.id} line overflows: "${line}"`
      );
    }
    assert.equal(
      box.lines.join(" "),
      labels.get(box.id).replace(/\s+/g, " ").trim(),
      `node ${box.id} lost or altered label text`
    );
    assert.ok(
      box.lines.length * cfg.lineHeight + 2 * cfg.nodePaddingY <= box.height + 0.5,
      `node ${box.id} text block is taller than its box`
    );
  }
  assert.equal(result.svg.includes("\u2026"), false, "output contains an ellipsis");
});

test("H: an unrenderable label fails loudly instead of being trimmed", () => {
  const spec = realSpec();
  spec.nodes[0].label =
    "Alphanumérique bravissimo charlatanesque deltaplane " +
    "echolocation foxtrottant golfeuse hôtellerie";
  const laid = layoutCausalGraph(spec);
  assert.equal(laid.ok, false);
  assert.equal(laid.layout, null);
  assert.match(laid.errors.join(" | "), /node cardiac-abnormality: .*lines/);
});

test("H2: a single unbreakable word wider than a node fails loudly", () => {
  const wrapped = wrapText("A".repeat(120), 228, 15, 600, { maxLines: 3 });
  assert.equal(wrapped.ok, false);
  assert.match(wrapped.errors.join(" | "), /no breakable punctuation/);
});

test("H3: an over-long question fails rather than overflowing the canvas", () => {
  const spec = realSpec();
  spec.question = `Question ${"interminable ".repeat(40)}?`;
  const laid = layoutCausalGraph(spec);
  assert.equal(laid.ok, false);
  assert.match(laid.errors.join(" | "), /^question: /);
});

// ---------------------------------------------------------------------------
// I / J / K / L — semantic fidelity of the emitted asset
// ---------------------------------------------------------------------------

test("I: every semantic node appears exactly once", () => {
  const { svg } = renderReal();
  const spec = realSpec();
  for (const node of spec.nodes) {
    const hits = svg.split(`data-node-id="${node.id}"`).length - 1;
    assert.equal(hits, 1, `node ${node.id} appears ${hits} times`);
  }
  assert.equal(svg.split("data-node-id=").length - 1, spec.nodes.length);
});

test("J: every semantic edge appears exactly once", () => {
  const { svg } = renderReal();
  const spec = realSpec();
  for (const edge of spec.edges) {
    const marker = `data-edge-id="${edge.from}-&gt;${edge.to}"`;
    const hits = svg.split(marker).length - 1;
    assert.equal(hits, 1, `edge ${edge.from}->${edge.to} appears ${hits} times`);
  }
  assert.equal(svg.split("data-edge-id=").length - 1, spec.edges.length);
});

test("K: every node and edge carries its stable claim identity and KP provenance", () => {
  const { svg } = renderReal();
  const spec = realSpec();

  for (const unit of visualSpecClaimUnits(spec)) {
    assert.ok(
      svg.includes(`data-claim="${unit.id}"`),
      `missing traceability attribute for ${unit.id}`
    );
    if (unit.kp.length > 0) {
      assert.ok(
        svg.includes(`data-kp="${unit.kp.join(" ")}"`),
        `missing KP provenance for ${unit.id}`
      );
    }
  }

  // No ordinal identity anywhere in the semantic attributes.
  assert.equal(/data-(node|edge)-id="[a-z-]*\d+"/.test(svg), false);
  assert.equal(/data-claim="(node|step|edge)-\d+"/.test(svg), false);
});

test("L: the feedback relation is represented distinctly from forward causation", () => {
  const { svg, layout } = renderReal();

  const feedback = layout.edges.find((e) => e.relation === "feeds_back");
  const forward = layout.edges.filter((e) => e.relation === "causes");
  assert.ok(feedback);
  assert.equal(feedback.back, true);
  assert.equal(
    forward.every((e) => e.back === false),
    true
  );

  // Distinct dash pattern, distinct marker, and a route that leaves the grid.
  const block = svg
    .split('data-relation="feeds_back"')[1]
    .split("</g>")[0];
  assert.match(block, /stroke-dasharray="8 6"/);
  assert.match(block, /url\(#vg-arrow-accent\)/);
  assert.match(block, / Q /, "feedback edge is not routed through the gutter");

  const forwardBlock = svg
    .split('data-relation="causes"')[1]
    .split("</g>")[0];
  assert.equal(forwardBlock.includes("stroke-dasharray"), false);
  assert.match(forwardBlock, /url\(#vg-arrow-solid\)/);
});

test("L2: each relation kind gets a distinct marker, at equal stroke weight", () => {
  const { svg } = renderReal();
  const markers = new Map();
  for (const [, relation, block] of svg.matchAll(
    /data-relation="([a-z_]+)"[^>]*>\s*\n\s*(<path[^>]*>)/g
  )) {
    markers.set(relation, block);
  }
  assert.equal(markers.size, 3, "expected all three relation kinds in this graph");

  const markerIds = [...markers.values()].map(
    (b) => b.match(/marker-end="url\(#([^)]+)\)"/)[1]
  );
  assert.equal(new Set(markerIds).size, 3, "relation kinds share a marker shape");

  // Line weight must not imply rank: kind is orthogonal to grounding strength.
  for (const block of markers.values()) {
    assert.match(block, /stroke-width="2\.5"/);
  }
  // A `transmits` edge must not look fainter than a `causes` edge.
  assert.equal(markers.get("transmits").includes("stroke-dasharray"), false);
});

// ---------------------------------------------------------------------------
// M — zero medical authorship in the renderer
// ---------------------------------------------------------------------------

test("M: renderer source authors no learner-visible medical content", () => {
  const rendererFiles = [
    "lib/visual-render.js",
    "lib/visual-layout.js",
    "lib/text-fit.js",
  ];

  // Terms from Item 234 and from adjacent specialties. If the renderer ever needs
  // one of these, it has started authoring content instead of laying it out.
  const forbidden = [
    "OAP", "cardiogénique", "cardiaque", "coeur", "cœur", "pompe", "congestion",
    "BNP", "proBNP", "mmHg", "FEVG", "troponine", "diurétique", "myocard",
    "ventricul", "auricul", "coronar", "systoli", "diastoli", "insuffisance",
    "débit", "précharge", "postcharge", "transsudat", "exsudat", "oedème",
    "œdème", "dyspnée", "SRAA", "sympathique", "Starling", "remodelage",
    "hypertrophie", "décompensation", "À retenir",
  ];

  for (const rel of rendererFiles) {
    const source = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
    const lower = source.toLowerCase();
    for (const term of forbidden) {
      assert.equal(
        lower.includes(term.toLowerCase()),
        false,
        `${rel} contains medical term "${term}"`
      );
    }
  }
});

test("M2: the description restates only relations the spec declares", () => {
  const spec = realSpec();
  const desc = describeCausalGraph(spec);

  for (const edge of spec.edges) {
    const from = spec.nodes.find((n) => n.id === edge.from).label;
    const to = spec.nodes.find((n) => n.id === edge.to).label;
    assert.ok(desc.includes(from), `description omits "${from}"`);
    assert.ok(desc.includes(to), `description omits "${to}"`);
  }
  assert.match(desc, /8 entités, 8 relations/);
  assert.match(desc, /1 boucle de rétroaction/);
});

// ---------------------------------------------------------------------------
// N / O — accessibility and well-formedness
// ---------------------------------------------------------------------------

test("N: SVG exposes role, title and desc, and keeps text selectable", () => {
  const { svg } = renderReal();
  const spec = realSpec();

  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-labelledby="vg-title vg-desc"/);
  assert.match(svg, /<title id="vg-title">/);
  assert.match(svg, /<desc id="vg-desc">/);

  const title = svg.match(/<title id="vg-title">([^<]*)<\/title>/)[1];
  assert.equal(title, spec.question);

  // Real <text>/<tspan>, never outlined paths, so the text stays selectable.
  assert.equal(svg.split("<tspan ").length - 1 >= spec.nodes.length, true);
  assert.equal(/<text[^>]*>\s*<path/.test(svg), false);
});

test("O: output is well-formed XML with balanced elements", () => {
  const { svg } = renderReal();

  assert.equal(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n'), true);
  assert.equal(svg.trimEnd().endsWith("</svg>"), true);

  const tags = [...svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)];
  const stack = [];
  for (const [, closing, name, attrs, selfClose] of tags) {
    if (closing) {
      assert.equal(stack.pop(), name, `unbalanced </${name}>`);
    } else if (!selfClose) {
      stack.push(name);
    }
    // Every attribute value must be quoted and free of raw angle brackets.
    assert.equal(/[<>]/.test(attrs.replace(/&[a-z]+;/g, "")), false);
  }
  assert.deepEqual(stack, [], "unclosed elements remain");

  // Raw ampersands and angle brackets must all be escaped in text content.
  const textContent = svg.replace(/<[^>]*>/g, "");
  assert.equal(/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(textContent), false);
});

// ---------------------------------------------------------------------------
// Layout structure
// ---------------------------------------------------------------------------

test("layering reflects graph structure rather than spec order", () => {
  const { layout } = renderReal();
  assert.deepEqual(layout.rows, [
    ["cardiac-abnormality"],
    ["pump-failure"],
    ["low-output", "filling-pressure", "acute-decompensation"],
    ["compensation", "congestion"],
    ["overload"],
  ]);
});

test("no two nodes overlap", () => {
  const { layout } = renderReal();
  const boxes = layout.nodes;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlaps =
        a.x < b.x + b.width &&
        b.x < a.x + a.width &&
        a.y < b.y + b.height &&
        b.y < a.y + a.height;
      assert.equal(overlaps, false, `${a.id} overlaps ${b.id}`);
    }
  }
});

test("every node stays inside the canvas", () => {
  const { layout } = renderReal();
  for (const box of layout.nodes) {
    assert.ok(box.x >= 0, `${box.id} starts left of the canvas`);
    assert.ok(box.y >= 0, `${box.id} starts above the canvas`);
    assert.ok(box.x + box.width <= layout.width, `${box.id} exceeds canvas width`);
    assert.ok(box.y + box.height <= layout.height, `${box.id} exceeds canvas height`);
  }
});

test("a cycle that does not declare feedback is rejected by layout", () => {
  const spec = loadVisualSpec(GENERIC_FIXTURE);
  spec.edges.find((e) => e.relation === "feeds_back").relation = "causes";
  const laid = layoutCausalGraph(spec);
  assert.equal(laid.ok, false);
  assert.match(laid.errors.join(" | "), /cycle/);
});
