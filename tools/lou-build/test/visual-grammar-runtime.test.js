import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CANONICAL_NODE_KINDS,
  CHAIN_KINDS,
  DECISION_EXTENDED_KINDS,
  VISUAL_GRAMMAR_KINDS,
} from "../lib/kind-vocabulary.js";
import {
  VisualGrammarUnknownKindError,
  BRANCHING_PATTERNS,
  BRANCH_LABEL_ANCHORS,
  branchLabelAnchorMode,
  branchLabelIsNotNode,
  branchingPattern,
  calloutPlacementPriority,
  chromaticFamily,
  cognitiveRole,
  compositionRule,
  compositionRules,
  diamondInternalPadding,
  grammarCatalog,
  hierarchyLevel,
  isChainKind,
  isDecision,
  isDecisionExtendedKind,
  isDecisionLateralFanOut,
  isDashedStroke,
  isReinforcedStroke,
  isStructural,
  isTerminal,
  isVerticalDescentFanOut,
  isVisualGrammarKind,
  nodeShape,
  requiresOrthogonalBranchGeometry,
  requiresStrictTextContainment,
  requiresSiblingOutcomeHarmony,
  strokeIntent,
  supportsDecisionLateralSplit,
  supportsMultiOutputFan,
} from "../lib/visual-grammar-runtime.js";

describe("visual-grammar-runtime", () => {
  it("maps Visual Grammar v0.1 lexique to node shapes", () => {
    assert.equal(nodeShape("entry"), "rect");
    assert.equal(nodeShape("action"), "rect");
    assert.equal(nodeShape("test"), "rect");
    assert.equal(nodeShape("decision"), "diamond");
    assert.equal(nodeShape("conclusion"), "rect");
    assert.equal(nodeShape("dead-end"), "rect");
  });

  it("aligns hierarchy levels with VG §3", () => {
    assert.equal(hierarchyLevel("entry"), 2);
    assert.equal(hierarchyLevel("decision"), 2);
    assert.equal(hierarchyLevel("conclusion"), 2);
    assert.equal(hierarchyLevel("action"), 3);
    assert.equal(hierarchyLevel("test"), 4);
    assert.equal(hierarchyLevel("dead-end"), 5);
  });

  it("aligns stroke intents with VG lexique synthesis", () => {
    assert.equal(strokeIntent("test"), "dashed");
    assert.equal(strokeIntent("dead-end"), "dashed-attenuated");
    assert.equal(strokeIntent("decision"), "solid-reinforced");
    assert.equal(strokeIntent("conclusion"), "solid-reinforced");
    assert.equal(strokeIntent("action"), "solid");
  });

  it("aligns chromatic families with VG §4 synthesis table", () => {
    assert.equal(chromaticFamily("entry"), "primary");
    assert.equal(chromaticFamily("action"), "operational");
    assert.equal(chromaticFamily("test"), "neutral");
    assert.equal(chromaticFamily("decision"), "primary");
    assert.equal(chromaticFamily("conclusion"), "primary-reinforced");
    assert.equal(chromaticFamily("dead-end"), "neutral-receded");
  });

  it("derives role predicates from GRAMMAR_SIGNATURES.role flags", () => {
    assert.equal(isDecision("decision"), true);
    assert.equal(isDecision("entry"), false);
    assert.equal(isTerminal("conclusion"), true);
    assert.equal(isTerminal("dead-end"), true);
    assert.equal(isTerminal("action"), false);
    assert.equal(isStructural("entry"), true);
    assert.equal(isStructural("decision"), true);
    assert.equal(isStructural("conclusion"), true);
    assert.equal(isStructural("action"), false);
    assert.equal(isDashedStroke("test"), true);
    assert.equal(isDashedStroke("action"), false);
    assert.equal(isReinforcedStroke("decision"), true);
    assert.equal(isReinforcedStroke("entry"), false);
  });

  it("covers every canonical kind with a signature", () => {
    for (const kind of CANONICAL_NODE_KINDS) {
      assert.ok(nodeShape(kind), `missing shape for ${kind}`);
      assert.ok(hierarchyLevel(kind) >= 2, `invalid hierarchy for ${kind}`);
      assert.equal(cognitiveRole(kind), kind);
    }
    assert.equal(grammarCatalog().length, CANONICAL_NODE_KINDS.length);
  });

  it("classifies vocabulary subsets from signature.vocabulary", () => {
    for (const kind of VISUAL_GRAMMAR_KINDS) {
      assert.equal(isVisualGrammarKind(kind), true);
      assert.equal(isChainKind(kind), false);
      assert.equal(isDecisionExtendedKind(kind), false);
    }
    for (const kind of CHAIN_KINDS) {
      assert.equal(isChainKind(kind), true);
      assert.equal(isVisualGrammarKind(kind), false);
    }
    for (const kind of DECISION_EXTENDED_KINDS) {
      assert.equal(isDecisionExtendedKind(kind), true);
      assert.equal(isVisualGrammarKind(kind), false);
    }
  });

  it("throws VisualGrammarUnknownKindError for unknown kinds", () => {
    assert.throws(() => nodeShape("unknown-kind"), VisualGrammarUnknownKindError);
    assert.throws(() => hierarchyLevel(""), VisualGrammarUnknownKindError);
    assert.throws(() => isDecision("not-a-kind"), VisualGrammarUnknownKindError);

    try {
      nodeShape("bogus");
    } catch (err) {
      assert.equal(err.name, "VisualGrammarUnknownKindError");
      assert.match(err.message, /unknown node kind "bogus"/);
      assert.equal(err.kind, "bogus");
    }
  });

  it("returns false for vocabulary probes on unknown kinds without throwing", () => {
    assert.equal(isVisualGrammarKind("unknown-kind"), false);
    assert.equal(isChainKind("unknown-kind"), false);
    assert.equal(isDecisionExtendedKind("unknown-kind"), false);
  });

  it("exposes composition rules from VG §8", () => {
    assert.equal(compositionRule("diamond", "textContainment"), "strict");
    assert.equal(branchingPattern("test", 2), BRANCHING_PATTERNS.VERTICAL_DESCENT_FAN_OUT);
    assert.equal(branchingPattern("test", 1), BRANCHING_PATTERNS.SINGLE_DESCENT);
    assert.equal(branchingPattern("decision", 2), BRANCHING_PATTERNS.DECISION_LATERAL_FAN_OUT);
    assert.equal(requiresStrictTextContainment("decision"), true);
    assert.equal(requiresStrictTextContainment("entry"), false);
    assert.equal(diamondInternalPadding("decision"), "generous");
    assert.equal(requiresSiblingOutcomeHarmony("test", 2), true);
    assert.equal(supportsMultiOutputFan("test"), true);
    assert.equal(supportsDecisionLateralSplit("decision"), true);
    assert.equal(isVerticalDescentFanOut(BRANCHING_PATTERNS.VERTICAL_DESCENT_FAN_OUT), true);
    assert.equal(isDecisionLateralFanOut(BRANCHING_PATTERNS.DECISION_LATERAL_FAN_OUT), true);
    assert.equal(
      branchLabelAnchorMode(BRANCHING_PATTERNS.VERTICAL_DESCENT_FAN_OUT),
      BRANCH_LABEL_ANCHORS.TARGET_CENTER,
    );
    assert.equal(
      branchLabelAnchorMode(BRANCHING_PATTERNS.DECISION_LATERAL_FAN_OUT),
      BRANCH_LABEL_ANCHORS.SEGMENT_CENTER,
    );
    assert.equal(branchLabelIsNotNode(), true);
    assert.equal(requiresOrthogonalBranchGeometry(), true);
    assert.deepEqual(calloutPlacementPriority(), [
      "below-branch-label",
      "lateral-clear",
      "below-corridor",
    ]);
    assert.ok(compositionRules("callout"));
    assert.ok(compositionRules("thresholdFragment"));
    assert.ok(compositionRules("branch"));
    assert.ok(compositionRules("branchLabel"));
    assert.ok(compositionRules("annotation"));
  });
});
