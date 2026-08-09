/**
 * Visual Grammar Runtime — executable projection of Visual Grammar v0.1.
 *
 * Answers semantic questions for renderers (shape, hierarchy, role traits,
 * composition rules, branching patterns).
 * Contains no SVG generation or layout algorithms.
 *
 * @see docs/architecture/VISUAL-GRAMMAR-V0.1.md
 * @see docs/architecture/VISUAL-GRAMMAR-RUNTIME.md
 */

import { CANONICAL_NODE_KINDS } from "./kind-vocabulary.js";

/** @typedef {"rect"|"diamond"} NodeShape */

/** @typedef {"solid"|"solid-reinforced"|"dashed"|"dashed-attenuated"} StrokeIntent */

/** @typedef {"primary"|"primary-reinforced"|"operational"|"neutral"|"neutral-receded"} ChromaticFamily */

/** @typedef {"visual-grammar"|"chain"|"decision-extended"} VocabularySet */

/** @typedef {"vertical-descent-fan-out"|"decision-lateral-fan-out"|"single-descent"} BranchingPatternId */

/** Branching pattern identifiers — VG §8.2, §8.5, §8.10. */
export const BRANCHING_PATTERNS = Object.freeze({
  VERTICAL_DESCENT_FAN_OUT: "vertical-descent-fan-out",
  DECISION_LATERAL_FAN_OUT: "decision-lateral-fan-out",
  SINGLE_DESCENT: "single-descent",
});

/** Branch label anchor modes — VG §8.7. */
export const BRANCH_LABEL_ANCHORS = Object.freeze({
  TARGET_CENTER: "target-center",
  SEGMENT_CENTER: "segment-center",
  CORRIDOR: "corridor",
});

/**
 * GRAMMAR_SIGNATURES — projection exécutable du Visual Grammar v0.1 (§4.2).
 */
const GRAMMAR_SIGNATURES = Object.freeze({
  entry: {
    shape: "rect",
    hierarchyLevel: 2,
    strokeIntent: "solid",
    chromaticFamily: "primary",
    cognitiveRole: "entry",
    vocabulary: "visual-grammar",
    role: { structural: true },
  },
  action: {
    shape: "rect",
    hierarchyLevel: 3,
    strokeIntent: "solid",
    chromaticFamily: "operational",
    cognitiveRole: "action",
    vocabulary: "visual-grammar",
    role: {},
  },
  test: {
    shape: "rect",
    hierarchyLevel: 4,
    strokeIntent: "dashed",
    chromaticFamily: "neutral",
    cognitiveRole: "test",
    vocabulary: "visual-grammar",
    role: { multiOutputFan: true },
  },
  decision: {
    shape: "diamond",
    hierarchyLevel: 2,
    strokeIntent: "solid-reinforced",
    chromaticFamily: "primary",
    cognitiveRole: "decision",
    vocabulary: "visual-grammar",
    role: { decision: true, structural: true, lateralSplit: true },
  },
  conclusion: {
    shape: "rect",
    hierarchyLevel: 2,
    strokeIntent: "solid-reinforced",
    chromaticFamily: "primary-reinforced",
    cognitiveRole: "conclusion",
    vocabulary: "visual-grammar",
    role: { structural: true, terminal: true },
  },
  "dead-end": {
    shape: "rect",
    hierarchyLevel: 5,
    strokeIntent: "dashed-attenuated",
    chromaticFamily: "neutral-receded",
    cognitiveRole: "dead-end",
    vocabulary: "visual-grammar",
    role: { terminal: true },
  },
  continuation: {
    shape: "rect",
    hierarchyLevel: 4,
    strokeIntent: "dashed",
    chromaticFamily: "neutral",
    cognitiveRole: "continuation",
    vocabulary: "decision-extended",
    role: {},
  },
  "human-review": {
    shape: "rect",
    hierarchyLevel: 3,
    strokeIntent: "solid",
    chromaticFamily: "operational",
    cognitiveRole: "human-review",
    vocabulary: "decision-extended",
    role: {},
  },
  resume: {
    shape: "rect",
    hierarchyLevel: 2,
    strokeIntent: "solid",
    chromaticFamily: "primary",
    cognitiveRole: "resume",
    vocabulary: "decision-extended",
    role: {},
  },
  state: {
    shape: "rect",
    hierarchyLevel: 2,
    strokeIntent: "solid",
    chromaticFamily: "neutral",
    cognitiveRole: "state",
    vocabulary: "chain",
    role: {},
  },
  event: {
    shape: "rect",
    hierarchyLevel: 3,
    strokeIntent: "solid",
    chromaticFamily: "neutral",
    cognitiveRole: "event",
    vocabulary: "chain",
    role: {},
  },
  response: {
    shape: "rect",
    hierarchyLevel: 2,
    strokeIntent: "solid",
    chromaticFamily: "neutral",
    cognitiveRole: "response",
    vocabulary: "chain",
    role: {},
  },
});

/**
 * COMPOSITION_RULES — projection exécutable VG §8 (Composition Rules).
 * Qualitatif uniquement : le renderer mappe vers les paramètres Theme / layout.
 */
const COMPOSITION_RULES = Object.freeze({
  diamond: {
    textContainment: "strict",
    autoExpand: true,
    internalPadding: "generous",
    proportionBalance: "slightly-wide",
  },
  testMultiOutput: {
    minOutgoingForFan: 2,
    pattern: BRANCHING_PATTERNS.VERTICAL_DESCENT_FAN_OUT,
    branchSeparation: "symmetric",
    siblingOutcomeHarmony: true,
    descentFirst: true,
    geometry: "orthogonal",
  },
  decisionBranching: {
    minOutgoingForLateral: 2,
    pattern: BRANCHING_PATTERNS.DECISION_LATERAL_FAN_OUT,
    lateralCorridor: true,
    minHorizontalSeparation: "moderate",
  },
  branch: {
    geometry: "orthogonal",
    onePerTransition: true,
    avoidUnnecessaryCrossings: true,
    mainFlowIdentifiable: true,
  },
  branchLabel: {
    notNodeSignature: true,
    notImplicitStep: true,
    subordinateToNodes: true,
    anchorFanOut: BRANCH_LABEL_ANCHORS.TARGET_CENTER,
    anchorDefault: BRANCH_LABEL_ANCHORS.SEGMENT_CENTER,
    anchorCorridor: BRANCH_LABEL_ANCHORS.CORRIDOR,
  },
  callout: {
    subordinate: true,
    mustNotOcclude: Object.freeze(["connector", "branch-label", "node"]),
    placementPriority: Object.freeze(["below-branch-label", "lateral-clear", "below-corridor"]),
  },
  flow: {
    layerDescent: "vertical-first",
    convergenceStyle: "shared-connector",
    branchLabelReadability: "required",
    noDominantPeripheralBox: true,
  },
  annotation: {
    outsideMainFlow: true,
    visuallyReceded: true,
    noDuplication: true,
    documentationOnly: true,
  },
});

export class VisualGrammarUnknownKindError extends Error {
  /** @param {unknown} kind */
  constructor(kind) {
    const label = kind == null ? String(kind) : typeof kind === "string" ? kind : JSON.stringify(kind);
    super(
      `Visual Grammar Runtime: unknown node kind "${label}" — add it to GRAMMAR_SIGNATURES after updating VISUAL-GRAMMAR-V0.1.md`,
    );
    this.name = "VisualGrammarUnknownKindError";
    this.kind = kind;
  }
}

function assertCatalogCoversCanonicalKinds() {
  for (const kind of CANONICAL_NODE_KINDS) {
    if (!Object.hasOwn(GRAMMAR_SIGNATURES, kind)) {
      throw new Error(
        `Visual Grammar Runtime: canonical kind "${kind}" is missing from GRAMMAR_SIGNATURES`,
      );
    }
  }
  for (const kind of Object.keys(GRAMMAR_SIGNATURES)) {
    if (!CANONICAL_NODE_KINDS.includes(kind)) {
      throw new Error(
        `Visual Grammar Runtime: GRAMMAR_SIGNATURES entry "${kind}" is not in CANONICAL_NODE_KINDS`,
      );
    }
  }
}

assertCatalogCoversCanonicalKinds();

function requireGrammarSignature(kind) {
  if (typeof kind !== "string" || !Object.hasOwn(GRAMMAR_SIGNATURES, kind)) {
    throw new VisualGrammarUnknownKindError(kind);
  }
  return GRAMMAR_SIGNATURES[kind];
}

function optionalGrammarSignature(kind) {
  if (typeof kind !== "string" || !Object.hasOwn(GRAMMAR_SIGNATURES, kind)) {
    return null;
  }
  return GRAMMAR_SIGNATURES[kind];
}

function hasRoleFlag(kind, flag) {
  return requireGrammarSignature(kind).role?.[flag] === true;
}

function hasVocabulary(kind, vocabulary) {
  return optionalGrammarSignature(kind)?.vocabulary === vocabulary;
}

/** Node geometry class from Visual Grammar (rect | diamond). */
export function nodeShape(kind) {
  return /** @type {NodeShape} */ (requireGrammarSignature(kind).shape);
}

/** Perceptive hierarchy level (1–6, VG §3). Title/global is level 1 — not a node kind. */
export function hierarchyLevel(kind) {
  return requireGrammarSignature(kind).hierarchyLevel;
}

/** Qualitative stroke intent — Theme maps to dash pattern and width. */
export function strokeIntent(kind) {
  return /** @type {StrokeIntent} */ (requireGrammarSignature(kind).strokeIntent);
}

/** Qualitative chromatic family — Theme maps to fill/stroke values. */
export function chromaticFamily(kind) {
  return /** @type {ChromaticFamily} */ (requireGrammarSignature(kind).chromaticFamily);
}

/** Cognitive role identifier (same as canonical kind when known). */
export function cognitiveRole(kind) {
  return requireGrammarSignature(kind).cognitiveRole;
}

export function isDecision(kind) {
  return hasRoleFlag(kind, "decision");
}

export function isTerminal(kind) {
  return hasRoleFlag(kind, "terminal");
}

/** Structural roles (entry, decision, conclusion) — VG §3 level 2. */
export function isStructural(kind) {
  return hasRoleFlag(kind, "structural");
}

/** Kind supports multi-output fan split (VG §8.2) — signature role, not hardcoded kind string. */
export function supportsMultiOutputFan(fromKind) {
  return hasRoleFlag(fromKind, "multiOutputFan");
}

/** Kind supports decision lateral corridor (VG §8.5). */
export function supportsDecisionLateralSplit(fromKind) {
  return hasRoleFlag(fromKind, "lateralSplit");
}

export function isDashedStroke(kind) {
  const intent = strokeIntent(kind);
  return intent === "dashed" || intent === "dashed-attenuated";
}

export function isReinforcedStroke(kind) {
  return strokeIntent(kind) === "solid-reinforced";
}

export function isVisualGrammarKind(kind) {
  return hasVocabulary(kind, "visual-grammar");
}

export function isChainKind(kind) {
  return hasVocabulary(kind, "chain");
}

export function isDecisionExtendedKind(kind) {
  return hasVocabulary(kind, "decision-extended");
}

/** Read-only catalog of all grammar signatures (kind → signature copy). */
export function grammarCatalog() {
  return CANONICAL_NODE_KINDS.map((kind) => [kind, { ...GRAMMAR_SIGNATURES[kind] }]);
}

/** @deprecated use grammarCatalog */
export function listGrammarSignatures() {
  return grammarCatalog();
}

/** Read-only copy of composition rules for a scope (VG §8). */
export function compositionRules(scope) {
  const resolved = scope === "thresholdFragment" ? "callout" : scope;
  const rules = COMPOSITION_RULES[resolved];
  return rules ? structuredClone(rules) : null;
}

/** Single composition rule value. */
export function compositionRule(scope, key) {
  const resolved = scope === "thresholdFragment" ? "callout" : scope;
  const rules = COMPOSITION_RULES[resolved];
  if (!rules || !Object.hasOwn(rules, key)) {
    throw new Error(`Visual Grammar Runtime: unknown composition rule "${scope}.${key}"`);
  }
  return rules[key];
}

/** Whether node kind requires strict diamond text containment (VG §8.1). */
export function requiresStrictTextContainment(kind) {
  return nodeShape(kind) === "diamond" && COMPOSITION_RULES.diamond.textContainment === "strict";
}

/** Qualitative diamond padding class — renderer maps to measurable clearance. */
export function diamondInternalPadding(kind) {
  if (nodeShape(kind) !== "diamond") return null;
  return COMPOSITION_RULES.diamond.internalPadding;
}

/** Qualitative diamond proportion intent (VG §8.1). */
export function diamondProportionBalance(kind) {
  if (nodeShape(kind) !== "diamond") return null;
  return COMPOSITION_RULES.diamond.proportionBalance;
}

/**
 * Branching composition pattern for an outgoing edge (VG §8.2, §8.5, §8.10).
 * @param {string} fromKind
 * @param {number} outgoingCount
 * @returns {BranchingPatternId}
 */
export function branchingPattern(fromKind, outgoingCount) {
  if (
    supportsMultiOutputFan(fromKind) &&
    outgoingCount >= COMPOSITION_RULES.testMultiOutput.minOutgoingForFan
  ) {
    return /** @type {BranchingPatternId} */ (COMPOSITION_RULES.testMultiOutput.pattern);
  }
  if (
    supportsDecisionLateralSplit(fromKind) &&
    outgoingCount >= COMPOSITION_RULES.decisionBranching.minOutgoingForLateral
  ) {
    return /** @type {BranchingPatternId} */ (COMPOSITION_RULES.decisionBranching.pattern);
  }
  return BRANCHING_PATTERNS.SINGLE_DESCENT;
}

export function isVerticalDescentFanOut(pattern) {
  return pattern === BRANCHING_PATTERNS.VERTICAL_DESCENT_FAN_OUT;
}

export function isDecisionLateralFanOut(pattern) {
  return pattern === BRANCHING_PATTERNS.DECISION_LATERAL_FAN_OUT;
}

/**
 * Branch label anchor mode for a branching pattern (VG §8.7).
 * @param {string} pattern
 * @returns {string}
 */
export function branchLabelAnchorMode(pattern) {
  if (isVerticalDescentFanOut(pattern)) {
    return COMPOSITION_RULES.branchLabel.anchorFanOut;
  }
  return COMPOSITION_RULES.branchLabel.anchorDefault;
}

/** Whether sibling outcomes from the same source must share layout harmony (VG §8.2). */
export function requiresSiblingOutcomeHarmony(fromKind, outgoingCount) {
  return (
    supportsMultiOutputFan(fromKind) &&
    outgoingCount >= COMPOSITION_RULES.testMultiOutput.minOutgoingForFan &&
    COMPOSITION_RULES.testMultiOutput.siblingOutcomeHarmony === true
  );
}

/** Whether branch geometry must be orthogonal (VG §8.6). */
export function requiresOrthogonalBranchGeometry() {
  return COMPOSITION_RULES.branch.geometry === "orthogonal";
}

/** Whether a branch label must never use node signature (VG §8.7). */
export function branchLabelIsNotNode() {
  return COMPOSITION_RULES.branchLabel.notNodeSignature === true;
}

/** Callout / threshold_fragment placement priority (VG §8.3, §8.9). */
export function calloutPlacementPriority() {
  return COMPOSITION_RULES.callout.placementPriority;
}

/** @deprecated use calloutPlacementPriority */
export function fragmentPlacementPriority() {
  return calloutPlacementPriority();
}

/** Element classes a callout must never occlude (VG §8.3). */
export function calloutMustNotOcclude() {
  return COMPOSITION_RULES.callout.mustNotOcclude;
}

/** @deprecated use calloutMustNotOcclude */
export function fragmentMustNotOcclude() {
  return calloutMustNotOcclude();
}

/** Qualitative horizontal separation for decision lateral routing (VG §8.5). */
export function decisionLateralSeparationClass() {
  return COMPOSITION_RULES.decisionBranching.minHorizontalSeparation;
}
