import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  loadVisualSpec,
  validateVisualSpec,
  visualSpecClaimUnits,
} from "../lib/visual-spec.js";
import {
  groundVisualSpec,
  renderEligibility,
  loadVisualGroundingReview,
} from "../lib/visual-ground.js";
import { REPO_ROOT } from "../lib/paths.js";

const CHAPTER_DIR = path.join(REPO_ROOT, "01-learning/chapters/cardio/234");
const SPEC_PATH = path.join(
  CHAPTER_DIR,
  "build/visual-specs/mm-pump-decompensation.yaml"
);
const REVIEW_PATH = path.join(CHAPTER_DIR, "build/visual-grounding-review.yaml");
const SOURCE_META = { edition: "2024-SFC" };

const TEST_INVENTORY = {
  chapter: "cardio/test",
  kps: ["KP-001", "KP-002", "KP-003"].map((id) => ({
    id,
    label: `Fact ${id}`,
    disposition: "understanding",
    anchors: [{ section_path: "I. Généralités", quote: `quote ${id}` }],
  })),
};

/** a --sourced--> b --bridging--> c, so both legs of the gate are exercised. */
function syntheticSpec() {
  return {
    spec_version: "0.1",
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

/** Build a review that passes every judgement-class unit of `spec`. */
function passingReview(spec, overrides = {}) {
  const verdicts = {};
  for (const unit of visualSpecClaimUnits(spec)) {
    if (unit.class === "sourced") continue;
    verdicts[unit.id] = {
      status: "pass",
      unit_digest: unit.digest,
      rationale: "entailed",
      ...(overrides[unit.id] || {}),
    };
  }
  return { verdicts, meta: { method: "test-review" }, missing: false };
}

function gate(spec, review, inventory = TEST_INVENTORY) {
  const validation = validateVisualSpec(spec, { inventory });
  const grounding = groundVisualSpec({
    spec,
    inventory,
    sourceMeta: SOURCE_META,
    review,
  });
  return { validation, grounding, ...renderEligibility({ validation, grounding }) };
}

// ---------------------------------------------------------------------------
// Eligibility gate
// ---------------------------------------------------------------------------

test("fully grounded spec is render-eligible", () => {
  const spec = syntheticSpec();
  const result = gate(spec, passingReview(spec));
  assert.equal(result.grounding.status, "pass");
  assert.equal(result.eligible, true, result.reasons.join("; "));
  assert.equal(result.blocking.length, 0);
});

test("a failed node makes the spec ineligible", () => {
  const spec = syntheticSpec();
  spec.nodes[1].kp = ["KP-002", "KP-404"];
  const result = gate(spec, passingReview(spec));
  assert.equal(result.eligible, false);
  assert.match(result.reasons.join(" | "), /node cb-vis-mm-test-n-b is fail/);
});

test("a failed edge makes the spec ineligible", () => {
  const spec = syntheticSpec();
  const review = passingReview(spec);
  const edgeId = "cb-vis-mm-test-e-b-to-c";
  review.verdicts[edgeId].status = "fail";
  review.verdicts[edgeId].rationale = "asserts causation the source does not support";

  const result = gate(spec, review);
  assert.equal(result.eligible, false);
  assert.equal(result.grounding.verdicts[edgeId].status, "fail");
  assert.match(result.reasons.join(" | "), /edge cb-vis-mm-test-e-b-to-c is fail/);
});

test("an unreviewed bridging edge is unresolved and blocks rendering", () => {
  const spec = syntheticSpec();
  const result = gate(spec, { verdicts: {} });
  assert.equal(result.eligible, false);
  assert.equal(
    result.grounding.verdicts["cb-vis-mm-test-e-b-to-c"].status,
    "unresolved"
  );
  assert.match(result.reasons.join(" | "), /is unresolved/);
});

test("a stale review does not carry over to edited content", () => {
  const spec = syntheticSpec();
  const review = passingReview(spec);

  // Same claim id, materially different claim: broaden the KP set.
  spec.edges[1].kp = ["KP-002", "KP-003"];

  const result = gate(spec, review);
  assert.equal(result.eligible, false);
  const verdict = result.grounding.verdicts["cb-vis-mm-test-e-b-to-c"];
  assert.equal(verdict.status, "unresolved");
  assert.match(verdict.reason, /stale review/);
});

test("scaffolding is reviewed like bridging, not waved through", () => {
  const spec = syntheticSpec();
  spec.nodes[2].class = "scaffolding";
  delete spec.nodes[2].kp;

  const unreviewed = gate(spec, { verdicts: {} });
  assert.equal(unreviewed.eligible, false);
  assert.equal(
    unreviewed.grounding.verdicts["cb-vis-mm-test-n-c"].status,
    "unresolved"
  );

  const reviewed = gate(spec, passingReview(spec));
  assert.equal(reviewed.eligible, true, reviewed.reasons.join("; "));
  assert.equal(reviewed.grounding.verdicts["cb-vis-mm-test-n-c"].status, "pass");
});

test("structural failure alone blocks rendering", () => {
  const spec = syntheticSpec();
  spec.nodes[0].x = 10;
  const result = gate(spec, passingReview(spec));
  assert.equal(result.eligible, false);
  assert.match(result.reasons.join(" | "), /structural validation failed/);
});

test("an independent fail overrides a deterministically grounded sourced unit", () => {
  const spec = syntheticSpec();
  const review = passingReview(spec);
  review.verdicts["cb-vis-mm-test-e-a-to-b"] = {
    status: "fail",
    rationale: "temporal succession presented as causation",
  };
  const result = gate(spec, review);
  assert.equal(result.eligible, false);
  assert.equal(result.grounding.verdicts["cb-vis-mm-test-e-a-to-b"].status, "fail");
});

test("a missing review file leaves every judgement-class unit unresolved", () => {
  const spec = syntheticSpec();
  const review = loadVisualGroundingReview(
    path.join(CHAPTER_DIR, "build/does-not-exist.yaml")
  );
  assert.equal(review.missing, true);
  const result = gate(spec, review);
  assert.equal(result.eligible, false);
  assert.match(result.grounding.note, /all judgement-class units are unresolved/);
});

// ---------------------------------------------------------------------------
// The real Item 234 artifact
// ---------------------------------------------------------------------------

test("MM-pump-decompensation is render-eligible against its independent review", () => {
  const spec = loadVisualSpec(SPEC_PATH);
  const inventory = YAML.parse(
    fs.readFileSync(path.join(CHAPTER_DIR, "inventory.yaml"), "utf8")
  );
  const review = loadVisualGroundingReview(REVIEW_PATH);
  assert.equal(review.missing, false);

  const validation = validateVisualSpec(spec, { inventory });
  const grounding = groundVisualSpec({
    spec,
    inventory,
    sourceMeta: SOURCE_META,
    review,
  });
  const eligibility = renderEligibility({ validation, grounding });

  assert.equal(validation.ok, true, validation.errors.join("; "));
  assert.equal(grounding.ok, true, grounding.errors.join("; "));
  assert.equal(eligibility.eligible, true, eligibility.reasons.join("; "));

  // 16 semantic units, each independently auditable.
  assert.equal(Object.keys(grounding.verdicts).length, 16);

  const byMode = Object.values(grounding.verdicts).reduce((acc, v) => {
    acc[v.mode] = (acc[v.mode] || 0) + 1;
    return acc;
  }, {});
  assert.equal(byMode["deterministic"], 13);
  assert.equal(byMode["semantic-independent"], 3);
});

test("the removed congestion → decompensation edge is gone and its replacement is sourced", () => {
  const spec = loadVisualSpec(SPEC_PATH);
  const ids = visualSpecClaimUnits(spec).map((u) => u.id);
  assert.equal(
    ids.includes("cb-vis-mm-pump-decompensation-e-congestion-to-acute-decompensation"),
    false
  );
  const replacement = spec.edges.find(
    (e) => e.from === "pump-failure" && e.to === "acute-decompensation"
  );
  assert.ok(replacement);
  assert.equal(replacement.class, "sourced");
  assert.deepEqual(replacement.kp, ["KP-059"]);
});

test("editing the real spec would invalidate its independent review", () => {
  const spec = loadVisualSpec(SPEC_PATH);
  const review = loadVisualGroundingReview(REVIEW_PATH);
  const inventory = YAML.parse(
    fs.readFileSync(path.join(CHAPTER_DIR, "inventory.yaml"), "utf8")
  );

  // Strengthen the feedback edge's claim without re-reviewing it.
  const feedback = spec.edges.find((e) => e.relation === "feeds_back");
  feedback.kp = [...feedback.kp, "KP-009"];

  const grounding = groundVisualSpec({
    spec,
    inventory,
    sourceMeta: SOURCE_META,
    review,
  });
  const verdict =
    grounding.verdicts["cb-vis-mm-pump-decompensation-e-overload-to-pump-failure"];
  assert.equal(verdict.status, "unresolved");
  assert.match(verdict.reason, /stale review/);
  assert.equal(
    renderEligibility({ validation: { ok: true }, grounding }).eligible,
    false
  );
});
