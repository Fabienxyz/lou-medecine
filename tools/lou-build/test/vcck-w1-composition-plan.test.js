import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_POSITIVE } from "../lib/vcck/paths.js";
import { runW1Pipeline } from "../lib/vcck/w1-pipeline.js";
import {
  mutatePlan,
  PLAN_MUTANT_IDS,
  validateCompositionPlan,
} from "../lib/vcck/w1-composition-plan.js";
import { W1_FAMILIES } from "../lib/vcck/w1-constants.js";

describe("vcck-w1-composition-plan", () => {
  for (const family of W1_FAMILIES) {
    it(`${family} builds valid plan`, () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const result = runW1Pipeline(spec, { expectedFamily: family });
      assert.equal(result.ok, true, result.errors?.join("; "));
      assert.ok(result.plan);
      const v = validateCompositionPlan(result.plan);
      assert.equal(v.ok, true, v.errors.join("; "));
      assert.equal(result.plan.canonicalOrder.length > 0, true);
    });

    it(`${family} permutation normalizes to same canonical order`, () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const a = runW1Pipeline(spec, { expectedFamily: family });
      assert.equal(a.ok, true);
      const perm = structuredClone(spec);
      if (family === "chain" || family === "dependent-sequence") {
        perm.nodes = [...spec.nodes].reverse();
      } else if (family === "flat-concurrent") {
        perm.groups[0].items = [...spec.groups[0].items].reverse();
      } else if (family === "two-pole") {
        perm.poles = [...spec.poles].reverse();
      }
      const b = runW1Pipeline(perm, { expectedFamily: family });
      assert.equal(b.ok, true);
      assert.deepEqual(b.plan.canonicalOrder, a.plan.canonicalOrder);
    });
  }

  it("plan mutants fail validation", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-long.yaml"));
    const result = runW1Pipeline(spec, { expectedFamily: "chain" });
    assert.equal(result.ok, true);
    for (const id of PLAN_MUTANT_IDS) {
      const mutant = mutatePlan(result.plan, id);
      const v = validateCompositionPlan(mutant);
      assert.equal(v.ok, false, `mutant ${id} should fail: ${v.errors.join("; ")}`);
    }
  });

  it("SVG plan passes technology-specific validation", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const result = runW1Pipeline(spec, { expectedFamily: "chain" });
    assert.equal(result.plan.technology, "svg");
    const v = validateCompositionPlan(result.plan);
    assert.equal(v.ok, true, v.errors.join("; "));
  });

  it("HTML plan passes technology-specific validation", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "two-pole-short.yaml"));
    const result = runW1Pipeline(spec, { expectedFamily: "two-pole" });
    assert.equal(result.plan.technology, "html");
    const v = validateCompositionPlan(result.plan);
    assert.equal(v.ok, true, v.errors.join("; "));
  });

  it("missing technology fails with explicit diagnostic", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const result = runW1Pipeline(spec, { expectedFamily: "chain" });
    const plan = { ...result.plan, technology: undefined };
    const v = validateCompositionPlan(plan);
    assert.equal(v.ok, false);
    assert.ok(v.errors.some((e) => e.includes("missing technology")));
  });

  it("unknown technology fails with explicit diagnostic", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const result = runW1Pipeline(spec, { expectedFamily: "chain" });
    const plan = { ...result.plan, technology: "canvas" };
    const v = validateCompositionPlan(plan);
    assert.equal(v.ok, false);
    assert.ok(v.errors.some((e) => e.includes('unknown technology "canvas"')));
  });
});
