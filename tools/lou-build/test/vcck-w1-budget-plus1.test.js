import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_W1 } from "../lib/vcck/paths.js";
import { W1_FAMILIES } from "../lib/vcck/w1-constants.js";
import { loadFamilyRegistry } from "../lib/vcck/registry.js";
import { evaluateW1BudgetCoverage } from "../lib/vcck/w1-budget-coverage.js";
import { gateBeforeRender } from "../lib/vcck/signature-analyzer.js";
import { checkBudgets } from "../lib/vcck/budgets.js";
import { runW1Pipeline } from "../lib/vcck/w1-pipeline.js";

describe("vcck-w1-budget-plus1", () => {
  for (const familyId of W1_FAMILIES) {
    it(`${familyId} cardinal-plus1 blocks with exact BUDGET_EXCEEDED`, () => {
      const fxPath = path.join(VCCK_W1, familyId, `${familyId}-cardinal-plus1.yaml`);
      const spec = loadVisualSpec(fxPath);
      const gate = gateBeforeRender(spec, { familyId });
      const budget = checkBudgets(spec, { familyId });
      const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });

      assert.equal(gate.allowed, false);
      assert.equal(budget.ok, false);
      assert.equal(budget.code, "BUDGET_EXCEEDED");
      assert.equal(pipeline.ok, false);

      const family = loadFamilyRegistry().families.find((f) => f.id === familyId);
      const field = budget.detail?.field;
      assert.ok(field, "budget field required");

      let declaredMax;
      if (field === "maxNodes") declaredMax = family.budgets.maxNodes;
      else if (field === "maxDimensions") declaredMax = family.budgets.maxDimensions;
      else if (field === "maxItems") declaredMax = family.budgets.maxItems;
      else if (field === "maxBranches") declaredMax = family.budgets.maxBranches;

      let observed;
      if (field === "maxNodes") observed = (spec.nodes || []).length;
      else if (field === "maxDimensions") observed = (spec.dimensions || []).length;
      else if (field === "maxItems") {
        observed = 0;
        for (const g of spec.groups || []) observed += (g.items || []).length;
      } else if (field === "maxBranches") observed = (spec.branches || []).length;

      assert.equal(observed, declaredMax + 1);
    });

    it(`${familyId} text-negative blocks with exact UNSUPPORTED_TEXT_LOAD`, () => {
      const fxPath = path.join(VCCK_W1, familyId, `${familyId}-text-negative.yaml`);
      const spec = loadVisualSpec(fxPath);
      const gate = gateBeforeRender(spec, { familyId });
      const budget = checkBudgets(spec, { familyId });
      const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });

      assert.equal(gate.allowed, false);
      assert.equal(budget.ok, false);
      assert.equal(budget.code, "UNSUPPORTED_TEXT_LOAD");
      assert.equal(pipeline.ok, false);
    });
  }

  it("evaluateW1BudgetCoverage passes cardinal-plus1 and text-negative rows", () => {
    const report = evaluateW1BudgetCoverage();
    const plus1 = report.matrix.filter((r) => r.role === "cardinal-plus1");
    const textNeg = report.matrix.filter((r) => r.role === "text-negative");
    assert.equal(plus1.length, 4);
    assert.equal(textNeg.length, 4);
    assert.ok(plus1.every((r) => r.result === "PASS" && r.code === "BUDGET_EXCEEDED"));
    assert.ok(textNeg.every((r) => r.result === "PASS" && r.code === "UNSUPPORTED_TEXT_LOAD"));
  });

  it("dependent-sequence maxBranches aligns with structural linear ceiling", () => {
    const family = loadFamilyRegistry().families.find((f) => f.id === "dependent-sequence");
    assert.equal(family.budgets.maxBranches, family.budgets.maxNodes - 1);
    const report = evaluateW1BudgetCoverage();
    assert.ok(!report.errors.some((e) => e.includes("BLOCKED_REGISTRY_BUDGET_INCONSISTENCY")));
  });
});
