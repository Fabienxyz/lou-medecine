/**
 * VisualSpec projection normalization — one canonical source per learner-visible fact.
 *
 * When a branch carries threshold_fragment, numeric thresholds are canonical in
 * threshold_fragment.scales; branch.condition must remain qualitative only.
 * Secondary display strings (scale lines, branch labels) are derived from scales.
 */

import { normalizeForMatch } from "./vcck/capability-coverage.js";

/** Learner-visible scale line as rendered in threshold_fragment callouts. */
export function formatThresholdFragmentScaleLine(scale) {
  return `${scale.analyte} ${scale.cutoff_label}`.trim();
}

/** Join of all scale lines — derived branch label text, not an authoring source. */
export function deriveThresholdBranchLabelFromFragment(fragment) {
  return (fragment?.scales || [])
    .map((scale) => formatThresholdFragmentScaleLine(scale))
    .filter(Boolean)
    .join(" ou ");
}

/**
 * True when branch.condition duplicates threshold_fragment semantics.
 * Used at validation time — no figure-specific rules.
 */
export function conditionRedundantWithThresholdFragment(condition, fragment) {
  const cond = normalizeForMatch(condition);
  if (!cond || !fragment) return false;

  const derived = normalizeForMatch(deriveThresholdBranchLabelFromFragment(fragment));
  if (derived && cond === derived) return true;

  for (const scale of fragment.scales || []) {
    const line = normalizeForMatch(formatThresholdFragmentScaleLine(scale));
    if (line && (cond === line || cond.includes(line) || line.includes(cond))) return true;
    const cutoff = normalizeForMatch(scale.cutoff_label);
    if (cutoff && cond.includes(cutoff)) return true;
    if (scale.value != null && cond.includes(String(scale.value))) return true;
  }
  return false;
}

/**
 * Resolve branch condition for projection/render.
 * Qualitative authored condition is returned as-is; never synthesised from fragment.
 */
export function resolveBranchConditionForProjection(branch) {
  return String(branch.condition || "").trim();
}

/**
 * Normalize decision-algorithm specs for projection: shallow clone, no content invention.
 */
export function normalizeDecisionAlgorithmForProjection(spec) {
  if (spec?.primitive !== "decision-algorithm") return spec;
  const out = structuredClone(spec);
  for (const branch of out.branches || []) {
    if (!branch.threshold_fragment) continue;
    branch.condition = resolveBranchConditionForProjection(branch);
  }
  return out;
}

export function normalizeVisualSpecForProjection(spec) {
  if (!spec || typeof spec !== "object") return spec;
  switch (spec.primitive) {
    case "decision-algorithm":
      return normalizeDecisionAlgorithmForProjection(spec);
    default:
      return spec;
  }
}

/**
 * Claim-unit emission for threshold_fragment scales.
 * Canonical learner fact: threshold-fragment-scale-line (matches callout rendering).
 * cutoff_label remains authoring substrate — not a separate learner-visible fact.
 */
export function thresholdFragmentScaleClaimEntries(branch, spec, push) {
  const frag = branch.threshold_fragment;
  const branchKey = branch.id || `${branch.from}-to-${branch.to}`;

  if (frag.context?.trim()) {
    push(
      `frag-ctx-${branchKey}`,
      "threshold-fragment-context",
      `${branchKey}/context`,
      frag.context,
      branch.class,
      branch.kp || [],
      ["frag-context", branchKey, frag.context, branch.class, (branch.kp || []).join(",")],
    );
  }
  if (frag.low_band_meaning?.trim()) {
    push(
      `frag-lbm-${branchKey}`,
      "threshold-fragment-low-band-meaning",
      `${branchKey}/low_band_meaning`,
      frag.low_band_meaning,
      branch.class,
      branch.kp || [],
      ["frag-lbm", branchKey, frag.low_band_meaning, branch.class, (branch.kp || []).join(",")],
    );
  }
  if (frag.interpretation?.trim()) {
    push(
      `frag-int-${branchKey}`,
      "threshold-fragment-interpretation",
      `${branchKey}/interpretation`,
      frag.interpretation,
      branch.class,
      branch.kp || [],
      ["frag-int", branchKey, frag.interpretation, branch.class, (branch.kp || []).join(",")],
    );
  }
  for (const scale of frag.scales || []) {
    const scaleLine = formatThresholdFragmentScaleLine(scale);
    push(
      `frag-line-${scale.id}`,
      "threshold-fragment-scale-line",
      scale.id,
      scaleLine,
      scale.class,
      scale.kp || [],
      ["frag-line", scale.analyte, scale.cutoff_label, scale.class, (scale.kp || []).join(",")],
    );
  }
}
