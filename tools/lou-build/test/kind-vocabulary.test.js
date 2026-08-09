import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CANONICAL_NODE_KINDS,
  DECISION_ALGORITHM_SPEC_KINDS,
  VISUAL_GRAMMAR_KINDS,
  themeKindKey,
} from "../lib/kind-vocabulary.js";
import { loadSvgGraphicLanguage, resetSvgGraphicLanguageCache, getDecisionNodeKindStyle } from "../lib/svg-graphic-language.js";

describe("kind-vocabulary", () => {
  it("exposes canonical kinds aligned with Visual Grammar v0.1", () => {
    assert.deepEqual(VISUAL_GRAMMAR_KINDS, [
      "entry",
      "action",
      "test",
      "decision",
      "conclusion",
      "dead-end",
    ]);
  });

  it("maps theme keys identically to spec kinds", () => {
    for (const kind of CANONICAL_NODE_KINDS) {
      assert.equal(themeKindKey(kind), kind);
    }
  });

  it("requires every decision-algorithm spec kind in Theme node_kinds", () => {
    resetSvgGraphicLanguageCache();
    const lang = loadSvgGraphicLanguage({ reload: true });
    for (const kind of DECISION_ALGORITHM_SPEC_KINDS) {
      assert.ok(lang.nodeKinds[kind], `missing node_kinds.${kind}`);
    }
  });

  it("resolves action with operational Theme signature (G3)", () => {
    resetSvgGraphicLanguageCache();
    const action = getDecisionNodeKindStyle("action");
    assert.equal(action.fill, "#fffbeb");
    assert.equal(action.stroke, "#d97706");
    assert.equal(action.strokeWidth, 2);
    assert.equal(action.dash, null);
    const conclusion = getDecisionNodeKindStyle("conclusion");
    assert.notEqual(action.fill, conclusion.fill);
    assert.notEqual(action.stroke, conclusion.stroke);
  });

  it("resolves decision diamond shape from Visual Grammar not Theme YAML", () => {
    resetSvgGraphicLanguageCache();
    const lang = loadSvgGraphicLanguage({ reload: true });
    assert.equal(lang.nodeKinds.decision.shape, undefined);
    assert.equal(getDecisionNodeKindStyle("decision").shape, "diamond");
  });

  it("resolves hyphenated kinds without renderer aliases", () => {
    resetSvgGraphicLanguageCache();
    const deadEnd = getDecisionNodeKindStyle("dead-end");
    assert.equal(deadEnd.dash, "4 3");
    const continuation = getDecisionNodeKindStyle("continuation");
    const test = getDecisionNodeKindStyle("test");
    assert.equal(continuation.fill, test.fill);
    assert.equal(continuation.dash, test.dash);
  });
});
