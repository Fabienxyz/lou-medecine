import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  loadVisualSpec,
  validateVisualSpec,
  visualSpecClaimUnits,
  findSimpleCycles,
  VISUAL_SPEC_VERSION,
} from "../lib/visual-spec.js";
import { assembleTraceability } from "../lib/claims.js";
import { parseBlueprint, collectBlueprintElementIds } from "../lib/blueprint.js";
import { REPO_ROOT } from "../lib/paths.js";

const CHAPTER_DIR = path.join(REPO_ROOT, "01-learning/chapters/cardio/234");
const SPEC_PATH = path.join(
  CHAPTER_DIR,
  "build/visual-specs/mm-pump-decompensation.yaml"
);

/** Tiny synthetic inventory keeps the structural tests independent of Item 234. */
const TEST_INVENTORY = {
  chapter: "cardio/test",
  kps: ["KP-001", "KP-002", "KP-003"].map((id) => ({
    id,
    label: `Fact ${id}`,
    disposition: "understanding",
    anchors: [{ section_path: "I. Généralités", quote: `quote ${id}` }],
  })),
};

function minimalSpec() {
  return {
    spec_version: VISUAL_SPEC_VERSION,
    primitive: "causal-graph",
    chapter: "cardio/test",
    element: "MM-test",
    question: "Que se passe-t-il ?",
    nodes: [
      { id: "a", kind: "state", label: "A", class: "sourced", kp: ["KP-001"] },
      { id: "b", kind: "state", label: "B", class: "sourced", kp: ["KP-002"] },
      { id: "c", kind: "response", label: "C", class: "sourced", kp: ["KP-003"] },
    ],
    edges: [
      { from: "a", to: "b", relation: "causes", class: "sourced", kp: ["KP-001"] },
      { from: "b", to: "c", relation: "causes", class: "bridging", kp: ["KP-002"] },
    ],
  };
}

function expectFailure(spec, pattern, options = {}) {
  const result = validateVisualSpec(spec, {
    inventory: TEST_INVENTORY,
    ...options,
  });
  assert.equal(result.ok, false, "expected validation to fail");
  assert.match(result.errors.join(" | "), pattern);
  return result;
}

// ---------------------------------------------------------------------------
// Positive baseline
// ---------------------------------------------------------------------------

test("minimal well-formed causal-graph validates", () => {
  const result = validateVisualSpec(minimalSpec(), { inventory: TEST_INVENTORY });
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.stats.nodes, 3);
  assert.equal(result.stats.cycles, 0);
});

test("structural validation runs without an inventory, referential checks do not", () => {
  const spec = minimalSpec();
  spec.nodes[0].kp = ["KP-999"];
  assert.equal(validateVisualSpec(spec).ok, true);
  const withInventory = validateVisualSpec(spec, { inventory: TEST_INVENTORY });
  assert.equal(withInventory.ok, false);
});

test("a single declared feedback cycle is permitted", () => {
  const spec = minimalSpec();
  spec.edges.push({
    from: "c",
    to: "a",
    relation: "feeds_back",
    class: "bridging",
    kp: ["KP-003"],
  });
  const result = validateVisualSpec(spec, { inventory: TEST_INVENTORY });
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.stats.cycles, 1);
});

// ---------------------------------------------------------------------------
// Negative tests — the validator must fail loudly
// ---------------------------------------------------------------------------

test("rejects unknown KP reference", () => {
  const spec = minimalSpec();
  spec.nodes[1].kp = ["KP-404"];
  expectFailure(spec, /unknown KP reference KP-404/);
});

test("rejects dangling edge endpoint", () => {
  const spec = minimalSpec();
  spec.edges[1].to = "ghost";
  expectFailure(spec, /dangling edge endpoint "to: ghost"/);
});

test("rejects ungrounded medical node", () => {
  const spec = minimalSpec();
  delete spec.nodes[2].kp;
  expectFailure(spec, /ungrounded node/);
});

test("rejects ungrounded medical edge even when both endpoints are grounded", () => {
  const spec = minimalSpec();
  spec.edges[0].kp = [];
  expectFailure(spec, /ungrounded edge/);
});

test("rejects a semantic unit with no class at all", () => {
  const spec = minimalSpec();
  delete spec.edges[0].class;
  expectFailure(spec, /missing class/);
});

test("rejects scaffolding that also claims KP grounding", () => {
  const spec = minimalSpec();
  spec.nodes[2].class = "scaffolding";
  expectFailure(spec, /scaffolding node must not claim KP grounding/);
});

test("accepts scaffolding without KP grounding", () => {
  const spec = minimalSpec();
  spec.nodes[2].class = "scaffolding";
  delete spec.nodes[2].kp;
  spec.edges[1].class = "scaffolding";
  delete spec.edges[1].kp;
  const result = validateVisualSpec(spec, { inventory: TEST_INVENTORY });
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.stats.classes.scaffolding, 2);
});

test("rejects forbidden geometry field on a node", () => {
  const spec = minimalSpec();
  spec.nodes[0].x = 120;
  expectFailure(spec, /forbidden geometry\/style field "x"/);
});

test("rejects forbidden style fields at spec and edge level", () => {
  const withFill = minimalSpec();
  withFill.edges[0].stroke = "#9CA3AF";
  expectFailure(withFill, /forbidden geometry\/style field "stroke"/);

  const withLayout = minimalSpec();
  withLayout.layout = "vertical-stack";
  expectFailure(withLayout, /forbidden geometry\/style field "layout"/);
});

test("rejects unknown non-geometry fields rather than ignoring them", () => {
  const spec = minimalSpec();
  spec.takeaway = "Une pompe qui échoue…";
  expectFailure(spec, /unknown field "takeaway"/);
});

test("rejects excessive node budget", () => {
  const spec = minimalSpec();
  for (let i = 0; i < 8; i++) {
    spec.nodes.push({
      id: `n${i}`,
      kind: "state",
      label: `N${i}`,
      class: "sourced",
      kp: ["KP-001"],
    });
    spec.edges.push({
      from: "a",
      to: `n${i}`,
      relation: "causes",
      class: "sourced",
      kp: ["KP-001"],
    });
  }
  expectFailure(spec, /nodes exceeds causal-graph budget of 8/);
});

test("rejects paragraph-like node labels", () => {
  const spec = minimalSpec();
  spec.nodes[0].label =
    "Un dysfonctionnement de la pompe cardiaque peut avoir deux conséquences principales";
  expectFailure(spec, /label exceeds 6 words/);
});

test("rejects multiple feedback relations", () => {
  const spec = minimalSpec();
  spec.edges.push(
    { from: "b", to: "a", relation: "feeds_back", class: "bridging", kp: ["KP-002"] },
    { from: "c", to: "a", relation: "feeds_back", class: "bridging", kp: ["KP-003"] }
  );
  expectFailure(spec, /2 feedback relations exceeds causal-graph budget of 1/);
});

// A single back edge closing over a fan-in yields several simple cycles but
// asserts one feedback relationship, so the budget must not reject it.
test("accepts one feedback relation closing over a fan-out and fan-in", () => {
  const spec = minimalSpec();
  spec.nodes.push({
    id: "d",
    kind: "state",
    label: "D",
    class: "sourced",
    kp: ["KP-003"],
  });
  spec.edges.push(
    { from: "a", to: "d", relation: "causes", class: "sourced", kp: ["KP-001"] },
    { from: "d", to: "c", relation: "causes", class: "sourced", kp: ["KP-003"] },
    { from: "c", to: "a", relation: "feeds_back", class: "bridging", kp: ["KP-003"] }
  );
  const result = validateVisualSpec(spec, { inventory: TEST_INVENTORY });
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.stats.feedbackRelations, 1);
  assert.ok(result.stats.cycles > 1, "expected more than one simple cycle");
});

test("rejects an undeclared cycle formed by plain causal edges", () => {
  const spec = minimalSpec();
  spec.edges.push({
    from: "c",
    to: "a",
    relation: "causes",
    class: "bridging",
    kp: ["KP-003"],
  });
  expectFailure(spec, /contains no feeds_back relation/);
});

test("rejects self-loop", () => {
  const spec = minimalSpec();
  spec.edges.push({
    from: "a",
    to: "a",
    relation: "feeds_back",
    class: "bridging",
    kp: ["KP-001"],
  });
  expectFailure(spec, /self-loop/);
});

test("rejects duplicate node ids", () => {
  const spec = minimalSpec();
  spec.nodes[2].id = "a";
  expectFailure(spec, /duplicate node id "a"/);
});

test("rejects orphan node that participates in no edge", () => {
  const spec = minimalSpec();
  spec.nodes.push({
    id: "lonely",
    kind: "state",
    label: "Isolé",
    class: "sourced",
    kp: ["KP-001"],
  });
  expectFailure(spec, /orphan — participates in no edge/);
});

test("rejects wrong primitive discriminator and unknown relation kinds", () => {
  const wrongPrimitive = minimalSpec();
  wrongPrimitive.primitive = "transmission-path";
  expectFailure(wrongPrimitive, /unsupported primitive "transmission-path"/);

  const wrongRelation = minimalSpec();
  wrongRelation.edges[0].relation = "correlates";
  expectFailure(wrongRelation, /unknown relation "correlates"/);
});

test("rejects unsupported spec_version", () => {
  const spec = minimalSpec();
  spec.spec_version = "0.9";
  expectFailure(spec, /unsupported spec_version 0.9/);
});

test("rejects an element absent from the Blueprint when Blueprint ids are supplied", () => {
  expectFailure(minimalSpec(), /is not a Blueprint element/, {
    blueprintElementIds: new Set(["MM-other"]),
  });
});

// ---------------------------------------------------------------------------
// Cycle enumeration
// ---------------------------------------------------------------------------

test("cycle enumeration counts each simple cycle exactly once", () => {
  const nodes = ["a", "b", "c"];
  const edges = [
    { from: "a", to: "b" },
    { from: "b", to: "c" },
    { from: "c", to: "a" },
    { from: "b", to: "a" },
  ];
  const { cycles, truncated } = findSimpleCycles(nodes, edges);
  assert.equal(truncated, false);
  assert.equal(cycles.length, 2);
});

// ---------------------------------------------------------------------------
// The real Item 234 artifact
// ---------------------------------------------------------------------------

test("MM-pump-decompensation spec validates against the canonical Inventory and Blueprint", () => {
  const spec = loadVisualSpec(SPEC_PATH);
  const inventory = YAML.parse(
    fs.readFileSync(path.join(CHAPTER_DIR, "inventory.yaml"), "utf8")
  );
  const blueprint = parseBlueprint(
    "blueprint.md",
    fs.readFileSync(path.join(CHAPTER_DIR, "blueprint.md"), "utf8")
  );

  const result = validateVisualSpec(spec, {
    inventory,
    blueprintElementIds: collectBlueprintElementIds(blueprint.data),
  });

  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.stats.nodes, 8);
  assert.equal(result.stats.edges, 8);
  assert.equal(result.stats.cycles, 1);
  assert.deepEqual(result.stats.cyclePaths, [
    "pump-failure -> low-output -> compensation -> overload -> pump-failure",
  ]);
});

test("visualSpec semantic units flow through the existing traceability assembler", () => {
  const spec = loadVisualSpec(SPEC_PATH);
  const inventory = YAML.parse(
    fs.readFileSync(path.join(CHAPTER_DIR, "inventory.yaml"), "utf8")
  );

  const units = visualSpecClaimUnits(spec);
  assert.equal(units.length, spec.nodes.length + spec.edges.length);

  const trace = assembleTraceability(units, inventory, { edition: "2024-SFC" });

  const nodeClaim = trace["cb-vis-mm-pump-decompensation-n-pump-failure"];
  assert.ok(nodeClaim, "node claim missing from traceability index");
  assert.equal(nodeClaim.element, "MM-pump-decompensation");
  assert.deepEqual(nodeClaim.kp, ["KP-001", "KP-006"]);
  assert.equal(nodeClaim.anchors.length, 2);
  assert.ok(nodeClaim.anchors[0].quote.length > 0);

  const edgeClaim =
    trace["cb-vis-mm-pump-decompensation-e-overload-to-pump-failure"];
  assert.ok(edgeClaim, "feedback edge claim missing from traceability index");
  assert.equal(edgeClaim.class, "bridging");
  assert.equal(edgeClaim.kp.length, 3);
});

test("every claim id derived from the spec is unique and stable", () => {
  const spec = loadVisualSpec(SPEC_PATH);
  const ids = visualSpecClaimUnits(spec).map((u) => u.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    ids.every((id) => id.startsWith("cb-vis-")),
    true
  );
  assert.deepEqual(ids, visualSpecClaimUnits(loadVisualSpec(SPEC_PATH)).map((u) => u.id));
});
