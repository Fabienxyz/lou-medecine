/**
 * Canonical node `kind` vocabulary — Visual Grammar v0.1 + chain + v0.2 extensions.
 *
 * Single source of truth for kind names across Theme, renderers and technical docs.
 * See docs/architecture/KIND-VOCABULARY-MIGRATION.md
 */

/** Lexique Visual Grammar v0.1 (decision-algorithm & dependent-sequence). */
export const VISUAL_GRAMMAR_KINDS = Object.freeze([
  "entry",
  "action",
  "test",
  "decision",
  "conclusion",
  "dead-end",
]);

/** Lexique causal-graph / chain (primitive distincte). */
export const CHAIN_KINDS = Object.freeze(["state", "event", "response"]);

/** Extensions visualSpec v0.2 decision-algorithm (hors lexique VG v0.1 fermé). */
export const DECISION_EXTENDED_KINDS = Object.freeze(["continuation", "human-review", "resume"]);

/** Ensemble complet des kinds de nœuds graphiques. */
export const CANONICAL_NODE_KINDS = Object.freeze([
  ...VISUAL_GRAMMAR_KINDS,
  ...CHAIN_KINDS,
  ...DECISION_EXTENDED_KINDS,
]);

/** Kinds déclarables dans visualSpec v0.2 decision-algorithm (validateur). */
export const DECISION_ALGORITHM_SPEC_KINDS = new Set([
  ...VISUAL_GRAMMAR_KINDS,
  ...DECISION_EXTENDED_KINDS,
]);

/** Kinds déclarables dans visualSpec v0.1 causal-graph. */
export const CAUSAL_GRAPH_SPEC_KINDS = new Set(CHAIN_KINDS);

/**
 * Clé Theme YAML pour un kind VisualSpec.
 * Vocabulaire canonique : identité (forme hyphenated du spec).
 */
export function themeKindKey(kind) {
  return kind;
}

export function isCanonicalNodeKind(kind) {
  return CANONICAL_NODE_KINDS.includes(kind);
}
