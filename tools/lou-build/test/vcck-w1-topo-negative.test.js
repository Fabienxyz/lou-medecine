import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_W1, VCCK_POSITIVE } from "../lib/vcck/paths.js";
import { W1_FAMILIES } from "../lib/vcck/w1-constants.js";
import { evaluateW1BudgetCoverage, evaluateTopoNegative } from "../lib/vcck/w1-budget-coverage.js";
import { checkBudgets } from "../lib/vcck/budgets.js";
import { enforceFamilyContract } from "../lib/vcck/w1-contracts.js";
import { runW1Pipeline } from "../lib/vcck/w1-pipeline.js";

describe("vcck-w1-topo-negative", () => {
  for (const familyId of W1_FAMILIES) {
    it(`${familyId} topo-negative blocks with exact UNSUPPORTED_TOPOLOGY`, () => {
      const fxPath = path.join(VCCK_W1, familyId, `${familyId}-topo-negative.yaml`);
      const spec = loadVisualSpec(fxPath);
      const evalTopo = evaluateTopoNegative(spec, familyId);

      assert.equal(evalTopo.contractBlocked, true);
      assert.equal(evalTopo.code, "UNSUPPORTED_TOPOLOGY");
      assert.equal(evalTopo.rendererBlocked, true);
      assert.equal(evalTopo.positiveRecognition, false);
      assert.equal(evalTopo.result, "PASS");

      const enforced = enforceFamilyContract(spec, familyId);
      assert.equal(enforced.ok, false);
      assert.equal(enforced.code, "UNSUPPORTED_TOPOLOGY");
      assert.equal(runW1Pipeline(spec, { expectedFamily: familyId }).ok, false);
    });
  }

  it("flat-concurrent topo-negative stays within budget envelope", () => {
    const spec = loadVisualSpec(
      path.join(VCCK_W1, "flat-concurrent", "flat-concurrent-topo-negative.yaml"),
    );
    const budget = checkBudgets(spec, { familyId: "flat-concurrent" });
    assert.equal(budget.ok, true, JSON.stringify(budget.detail));
    assert.equal((spec.groups || []).length, 1);
  });

  it("BUDGET_EXCEEDED is not accepted as topo-negative proof", () => {
    const spec = loadVisualSpec(path.join(VCCK_W1, "chain", "chain-cardinal-plus1.yaml"));
    const evalTopo = evaluateTopoNegative(spec, "chain");
    assert.equal(evalTopo.result, "FAIL");
    assert.equal(evalTopo.code, "BUDGET_EXCEEDED");
  });

  it("evaluateW1BudgetCoverage passes all topo-negative rows", () => {
    const report = evaluateW1BudgetCoverage();
    const topo = report.matrix.filter((r) => r.role === "topo-negative");
    assert.equal(topo.length, 4);
    assert.ok(topo.every((r) => r.result === "PASS" && r.code === "UNSUPPORTED_TOPOLOGY"));
  });
});
