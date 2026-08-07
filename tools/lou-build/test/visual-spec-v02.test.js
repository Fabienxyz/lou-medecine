import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  loadVisualSpec,
  validateVisualSpec,
  visualSpecClaimUnits,
  VISUAL_SPEC_VERSION,
} from "../lib/visual-spec.js";
import { REPO_ROOT } from "../lib/paths.js";

const FIXTURES = path.join(path.dirname(new URL(import.meta.url).pathname), "fixtures");
const WAVE2_SPECS = path.join(
  REPO_ROOT,
  ".local/product-review-library/phase1a-234-wave2/specs",
);
const MM_SPEC = path.join(
  REPO_ROOT,
  "01-learning/chapters/cardio/234/build/visual-specs/mm-pump-decompensation.yaml",
);
const MM_SVG = path.join(
  REPO_ROOT,
  "01-learning/chapters/cardio/234/build/rendered-visuals/mm-pump-decompensation.svg",
);

const TEST_INVENTORY = {
  chapter: "cardio/test",
  kps: ["KP-001", "KP-002", "KP-003"].map((id) => ({
    id,
    label: `Fact ${id}`,
    disposition: "understanding",
    anchors: [{ section_path: "I. Généralités", quote: `quote ${id}` }],
  })),
};

function expectFail(spec, pattern, options = {}) {
  const result = validateVisualSpec(spec, { inventory: options.inventory || TEST_INVENTORY });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" | "), pattern);
}

test("v0.1 causal-graph still validates unchanged", () => {
  const spec = loadVisualSpec(MM_SPEC);
  assert.equal(String(spec.spec_version), VISUAL_SPEC_VERSION);
  const result = validateVisualSpec(spec);
  assert.equal(result.ok, true, result.errors?.join("; "));
});

test("generic comparison-matrix fixture validates", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-comparison-matrix.yaml"));
  const result = validateVisualSpec(spec, { inventory: TEST_INVENTORY });
  assert.equal(result.ok, true, result.errors?.join("; "));
});

test("generic enumeration-set fixture validates", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-enumeration-set.yaml"));
  const result = validateVisualSpec(spec, { inventory: TEST_INVENTORY });
  assert.equal(result.ok, true, result.errors?.join("; "));
});

test("generic quantity-model fixture validates", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-quantity-model.yaml"));
  const result = validateVisualSpec(spec, { inventory: TEST_INVENTORY });
  assert.equal(result.ok, true, result.errors?.join("; "));
});

test("rejects geometry in v0.2 spec", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-comparison-matrix.yaml"));
  spec.x = 10;
  expectFail(spec, /forbidden geometry/);
});

test("rejects css key in v0.2 spec", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-comparison-matrix.yaml"));
  spec.css = "bad";
  expectFail(spec, /forbidden geometry/);
});

test("rejects missing matrix cell", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-comparison-matrix.yaml"));
  spec.dimensions[0].cells = spec.dimensions[0].cells.slice(0, 1);
  expectFail(spec, /expected 2 cells/);
});

test("rejects fifth class when cardinality is 4", () => {
  const spec = loadVisualSpec(path.join(WAVE2_SPECS, "n17-hfref-treatment-architecture.yaml"));
  spec.groups.find((g) => g.id === "group-prognostic").items.push({
    id: "class-extra",
    label: "Cinquième classe",
    class: "sourced",
    kp: ["KP-077"],
  });
  expectFail(spec, /expected cardinality 4/);
});

test("rejects order on concurrent-set group", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-enumeration-set.yaml"));
  spec.groups[0].ordering_semantics = "priority";
  expectFail(spec, /concurrent-set must use ordering_semantics none/);
});

test("rejects edges in enumeration-set", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-enumeration-set.yaml"));
  spec.edges = [{ from: "a", to: "b", relation: "causes", class: "sourced", kp: ["KP-001"] }];
  expectFail(spec, /edges forbidden/);
});

test("rejects missing unit on quantity value", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-quantity-model.yaml"));
  delete spec.states[0].values[0].unit;
  expectFail(spec, /missing unit/);
});

test("rejects mismatched quantities between states", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-quantity-model.yaml"));
  spec.states[1].values = spec.states[1].values.filter((v) => v.quantity !== "Q");
  expectFail(spec, /same quantities|missing in state/);
});

test("rejects missing value in state", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-quantity-model.yaml"));
  spec.states[0].values[0].value = null;
  expectFail(spec, /missing value/);
});

test("v0.2 claim units include matrix cells and quantity values", () => {
  const spec = loadVisualSpec(path.join(FIXTURES, "generic-quantity-model.yaml"));
  const units = visualSpecClaimUnits(spec);
  assert.ok(units.some((u) => u.unit === "quantity-value"));
  assert.ok(units.some((u) => u.unit === "identity"));
});

test("mm-pump-decompensation SVG matches frozen reference hash", () => {
  if (!fs.existsSync(MM_SVG)) {
    return;
  }
  const refPath = path.join(FIXTURES, "mm-pump-decompensation.svg.md5");
  const expected = fs.readFileSync(refPath, "utf8").trim();
  const hash = crypto.createHash("md5").update(fs.readFileSync(MM_SVG)).digest("hex");
  assert.equal(hash, expected, "mm-pump-decompensation.svg must remain byte-identical to frozen v0.1 reference");
});
