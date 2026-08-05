import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_POSITIVE, VCCK_NEGATIVE, VCCK_W1 } from "../lib/vcck/paths.js";
import { enforceFamilyContract, recognizeFamily, linearPathOrder } from "../lib/vcck/w1-contracts.js";
import { gateBeforeRender } from "../lib/vcck/signature-analyzer.js";
import { renderVcckSpec } from "../lib/vcck/render-bridge.js";
import {
  W1_BOUNDARY_MUTATIONS,
  checkW1Exclusivity,
  evaluateBoundaryMutation,
} from "../lib/vcck/w1-exclusivity.js";
import { W1_FAMILIES } from "../lib/vcck/w1-constants.js";
import { checkBudgets } from "../lib/vcck/budgets.js";

describe("vcck-w1-contracts", () => {
  for (const family of W1_FAMILIES) {
    it(`${family} short positive passes contract`, () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const result = enforceFamilyContract(spec, family);
      assert.equal(result.ok, true, result.code || JSON.stringify(result));
      assert.equal(result.family, family);
    });

    it(`${family} recognition is exclusive`, () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const ex = checkW1Exclusivity(spec, family);
      assert.equal(ex.exclusive, true);
      assert.equal(ex.analysis.family, family);
    });
  }

  it("flat-concurrent negative rejects exclusive single group", () => {
    const spec = loadVisualSpec(path.join(VCCK_NEGATIVE, "flat-concurrent-negative.yaml"));
    const gate = gateBeforeRender(spec);
    assert.equal(gate.allowed, false);
    assert.equal(gate.code, "UNSUPPORTED_TOPOLOGY");
    assert.notEqual(gate.analysis?.status, "recognized");
    const attempted = renderVcckSpec(spec);
    assert.equal(attempted.ok, false);
  });

  it("dependent-sequence negative rejects branching topology", () => {
    const spec = loadVisualSpec(path.join(VCCK_NEGATIVE, "dependent-sequence-negative.yaml"));
    const gate = gateBeforeRender(spec);
    assert.equal(gate.allowed, false);
    assert.equal(gate.code, "UNSUPPORTED_TOPOLOGY");
  });

  it("chain negative rejects topology", () => {
    const spec = loadVisualSpec(path.join(VCCK_NEGATIVE, "chain-negative.yaml"));
    const r = recognizeFamily(spec);
    assert.notEqual(r.status, "recognized");
  });

  it("dependent-sequence without terminal rejects", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dependent-sequence-short.yaml"));
    const noTerminal = structuredClone(spec);
    noTerminal.nodes = noTerminal.nodes.map((n) =>
      n.kind === "conclusion" ? { ...n, kind: "test" } : n,
    );
    const r = enforceFamilyContract(noTerminal, "dependent-sequence");
    assert.equal(r.ok, false);
    assert.equal(r.code, "MISSING_TERMINAL");
  });

  for (const mutation of W1_BOUNDARY_MUTATIONS) {
    it(`boundary ${mutation.id}`, () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${mutation.baseFamily}-short.yaml`));
      const result = evaluateBoundaryMutation(mutation, spec);
      assert.equal(result.pass, true, JSON.stringify(result));
    });
  }

  it("budget +1 cardinal exceeds for chain", () => {
    const w1Path = path.join(VCCK_W1, "chain", "chain-cardinal-plus1.yaml");
    const spec = loadVisualSpec(w1Path);
    const b = checkBudgets(spec, { familyId: "chain" });
    assert.equal(b.ok, false);
    assert.equal(b.code, "BUDGET_EXCEEDED");
  });

  it("linearPathOrder requires exactly one entry when entries provided", () => {
    const nodes = ["a", "b", "c"];
    const edges = [
      { from: "a", to: "b" },
      { from: "b", to: "c" },
    ];
    assert.deepEqual(linearPathOrder(nodes, edges, ["a"]), ["a", "b", "c"]);
    assert.equal(linearPathOrder(nodes, edges, ["a", "b"]), null);
  });

  it("linearPathOrder falls back to single source when entries omitted", () => {
    const nodes = ["a", "b", "c"];
    const edges = [
      { from: "a", to: "b" },
      { from: "b", to: "c" },
    ];
    assert.deepEqual(linearPathOrder(nodes, edges, null), ["a", "b", "c"]);
  });

  it("linearPathOrder visits each connected node exactly once", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dependent-sequence-short.yaml"));
    const branches = spec.branches || [];
    const connected = new Set();
    for (const b of branches) {
      connected.add(b.from);
      connected.add(b.to);
    }
    const entries = spec.nodes.filter((n) => n.kind === "entry").map((n) => n.id);
    const order = linearPathOrder([...connected], branches, entries);
    assert.equal(order.length, connected.size);
    assert.equal(new Set(order).size, connected.size);
  });

  it("linearPathOrder is deterministic after node permutation", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dependent-sequence-short.yaml"));
    const branches = spec.branches;
    const connected = [...new Set(branches.flatMap((b) => [b.from, b.to]))];
    const entries = spec.nodes.filter((n) => n.kind === "entry").map((n) => n.id);
    const base = linearPathOrder(connected, branches, entries);
    const perm = [...connected].reverse();
    const permuted = linearPathOrder(perm, branches, entries);
    assert.deepEqual(permuted, base);
  });

  it("linearPathOrder rejects branch and cycle", () => {
    assert.equal(
      linearPathOrder(["a", "b", "c"], [{ from: "a", to: "b" }, { from: "a", to: "c" }], ["a"]),
      null,
    );
    assert.equal(
      linearPathOrder(["a", "b", "c"], [{ from: "a", to: "b" }, { from: "b", to: "c" }, { from: "c", to: "a" }], ["a"]),
      null,
    );
  });

  it("dependent-sequence permutation normalizes via linearPathOrder", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dependent-sequence-short.yaml"));
    const a = enforceFamilyContract(spec, "dependent-sequence");
    assert.equal(a.ok, true);
    const perm = structuredClone(spec);
    perm.nodes = [spec.nodes[2], spec.nodes[0], spec.nodes[1]];
    const b = enforceFamilyContract(perm, "dependent-sequence");
    assert.equal(b.ok, true);
    assert.deepEqual(b.contract.canonicalOrder, a.contract.canonicalOrder);
  });
});
