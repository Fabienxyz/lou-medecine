/**
 * Projection Verification — REPORT-ONLY bidirectional reconciliation.
 *
 * Authoritative fact enumeration: visualSpecClaimUnits() from visual-spec.js.
 * This module never becomes a renderer or production pipeline input.
 */

import { visualSpecClaimUnits } from "./visual-spec.js";
import { normalizeForMatch, decodeXmlText } from "./vcck/capability-coverage.js";
import {
  resolveFamilyIdsForFigure,
  verifyTotalDispositions,
  buildDispositionAuditMatrix,
  aggregateTotalDispositionMetrics,
} from "./total-disposition.js";

/** Documented authoritative source for learner-visible facts. */
export const AUTHORITATIVE_FACT_SOURCE = "visualSpecClaimUnits";

/** Projection disposition vocabulary — descriptive only, no gate. */
export const PROJECTION_DISPOSITIONS = Object.freeze([
  "MATERIALIZED",
  "DERIVED",
  "DISCARDED",
  "UNKNOWN",
]);

/**
 * Unit types observed as not emitted to dedicated artifact locations
 * (decision-algorithm V02 callout renderer — descriptive catalog, not a rule engine).
 */
const KNOWN_NON_PROJECTED_UNITS = new Set(["threshold-fragment-interpretation"]);

/** Unit types that receive direct dedicated projection marks. */
const PRIMARY_MATERIALIZATION_UNITS = new Set([
  "node",
  "subitem",
  "branch",
  "question",
  "annotation",
  "pole",
  "dimension",
  "matrix-cell",
  "relation-label",
]);

function isSecondaryMaterializationUnit(unit) {
  return unit.startsWith("threshold-fragment-") || unit === "threshold-cutoff";
}

/** Expected materialization role labels for justification strings. */
const UNIT_ROLE_LABELS = Object.freeze({
  node: "node label",
  subitem: "node subitem",
  branch: "branch label",
  question: "figure title",
  annotation: "annotation",
  "threshold-cutoff": "threshold cutoff text",
  "threshold-fragment-context": "fragment callout context line",
  "threshold-fragment-low-band-meaning": "fragment low_band_meaning field",
  "threshold-fragment-interpretation": "fragment interpretation field",
  "threshold-fragment-scale-line": "fragment callout scale line",
  pole: "pole header",
  dimension: "dimension label",
  "matrix-cell": "matrix cell",
  "relation-label": "edge relation label",
});

/**
 * Enumerate all learner-visible facts from a VisualSpec.
 * Delegates exclusively to the existing claim-unit spine.
 */
export function enumerateLearnerFacts(spec) {
  return visualSpecClaimUnits(spec);
}

/**
 * Count non-overlapping occurrences of normalized needle in normalized haystack.
 */
export function countNormalizedOccurrences(haystack, needle) {
  const h = normalizeForMatch(haystack);
  const n = normalizeForMatch(needle);
  if (!n) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = h.indexOf(n, pos)) !== -1) {
    count += 1;
    pos += n.length;
  }
  return count;
}

/** Claim-unit types that are grounded but not learner-visible in SVG projection. */
const PROJECTION_STRUCTURAL_UNITS = new Set(["edge"]);

/** Learner-visible text classes in V02 decision / W1 SVG artifacts. */
const LEARNER_TEXT_CLASS_RE =
  /\bclass="(?:vg-title|vg-label|vg-sub|vg-branch|vg-ann|vg-pole|vg-dim|vg-cell|vg-cell-list|card-title|step-num|title-main)\b/;

/**
 * Filter claim units to learner-visible facts for projection verification.
 * Authoritative enumeration remains visualSpecClaimUnits(); structural units
 * (e.g. edge topology without relation_label) are excluded from materialization checks.
 */
export function isLearnerVisibleForProjection(fact) {
  if (PROJECTION_STRUCTURAL_UNITS.has(fact.unit)) return false;
  return Boolean(String(fact.text || "").trim());
}

export function enumerateProjectionFacts(spec) {
  return enumerateLearnerFacts(spec).filter(isLearnerVisibleForProjection);
}

/**
 * Extract learner-visible text marks from an SVG artifact.
 * Returns { marks, haystack } where each mark is a discrete text element block.
 */
export function extractLearnerVisibleMarks(artifact) {
  const marks = [];
  const textBlockRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match;
  while ((match = textBlockRe.exec(artifact)) !== null) {
    const attrs = match[1];
    const inner = match[2];
    const text = extractTextContent(inner);
    const normalized = normalizeForMatch(text);
    if (!normalized) continue;

    const officialTextId = readAttr(attrs, "data-official-text-id");
    const inLearnerContext =
      LEARNER_TEXT_CLASS_RE.test(attrs) ||
      isInsideLearnerContext(artifact, match.index) ||
      officialTextId != null;

    if (!inLearnerContext) continue;

    marks.push({
      text,
      normalized,
      officialTextId,
      offset: match.index,
      location: inferMarkLocation(artifact, match.index),
    });
  }

  const haystack = marks.map((m) => m.normalized).join(" ");
  return { marks, haystack };
}

function readAttr(attrs, name) {
  const re = new RegExp(`${name}="([^"]*)"`, "i");
  const m = attrs.match(re);
  return m ? decodeXmlText(m[1]) : null;
}

function extractTextContent(inner) {
  const parts = [];
  const tspanRe = /<tspan\b[^>]*>([\s\S]*?)<\/tspan>/gi;
  let tspanMatch;
  let lastIndex = 0;
  while ((tspanMatch = tspanRe.exec(inner)) !== null) {
    if (tspanMatch.index > lastIndex) {
      const between = inner.slice(lastIndex, tspanMatch.index).replace(/<[^>]+>/g, "");
      if (between.trim()) parts.push(decodeXmlText(between));
    }
    parts.push(decodeXmlText(tspanMatch[1]));
    lastIndex = tspanRe.lastIndex;
  }
  if (lastIndex < inner.length) {
    const rest = inner.slice(lastIndex).replace(/<[^>]+>/g, "");
    if (rest.trim()) parts.push(decodeXmlText(rest));
  }
  if (parts.length === 0) {
    return decodeXmlText(inner.replace(/<[^>]+>/g, ""));
  }
  return parts.join("");
}

function isInsideLearnerContext(artifact, textOffset) {
  const before = artifact.slice(0, textOffset);
  const layerMarkers = [
    'data-layer="nodes"',
    'data-layer="branches"',
    'data-layer="annotations"',
    'data-fragment="threshold-scale"',
    'data-branch-label="',
    'data-context="',
    'data-cell="',
    'data-pole="',
  ];
  const lastOpenG = before.lastIndexOf("<g ");
  if (lastOpenG === -1) return false;
  const contextSlice = before.slice(lastOpenG);
  return layerMarkers.some((m) => contextSlice.includes(m));
}

/** Parse structural SVG context around a text mark for disposition evidence. */
export function inferMarkLocation(artifact, textOffset) {
  const before = artifact.slice(0, textOffset);
  const nodeId = lastAttrBefore(before, "data-node-id");
  const branchId = lastAttrBefore(before, "data-branch-label");
  const inFragment = before.includes('data-fragment="threshold-scale"');
  const placement = lastAttrBefore(before, "data-placement");

  if (inFragment) {
    return { kind: "fragment-callout", branchId: branchId || null, nodeId: null };
  }
  if (branchId) {
    return { kind: "branch-label", branchId, nodeId: null };
  }
  if (nodeId) {
    return { kind: "node-label", nodeId, branchId: null };
  }
  if (before.includes('class="vg-title"') || before.includes("vg-title")) {
    return { kind: "figure-title", nodeId: null, branchId: null };
  }
  if (placement) {
    return { kind: "annotation", nodeId: null, branchId: null, placement };
  }
  if (before.includes('class="vg-dim"')) {
    return { kind: "dimension-label", nodeId: null, branchId: null };
  }
  if (before.includes('class="vg-pole"')) {
    return { kind: "pole-header", nodeId: null, branchId: null };
  }
  if (before.includes('class="vg-cell"')) {
    return { kind: "matrix-cell", nodeId: nodeId || null, branchId: null };
  }
  return { kind: "learner-text", nodeId: null, branchId: null };
}

function lastAttrBefore(before, attrName) {
  const re = new RegExp(`${attrName}="([^"]*)"`, "gi");
  let last = null;
  let m;
  while ((m = re.exec(before)) !== null) {
    last = decodeXmlText(m[1]);
  }
  return last;
}

function marksMatchingFact(fact, marks) {
  const fn = normalizeForMatch(fact.text);
  return marks.filter(
    (m) =>
      m.normalized === fn ||
      (fn && (m.normalized.includes(fn) || fn.includes(m.normalized))),
  );
}

function locationMatchesUnit(unit, location) {
  switch (unit) {
    case "node":
    case "subitem":
      return location.kind === "node-label";
    case "branch":
      return location.kind === "branch-label";
    case "question":
      return location.kind === "figure-title";
    case "annotation":
      return location.kind === "annotation";
    case "threshold-fragment-context":
    case "threshold-fragment-scale-line":
    case "threshold-cutoff":
      return location.kind === "fragment-callout" || location.kind === "branch-label";
    case "threshold-fragment-low-band-meaning":
      return location.kind === "fragment-callout";
    case "dimension":
      return location.kind === "dimension-label";
    case "pole":
      return location.kind === "pole-header";
    case "matrix-cell":
      return location.kind === "matrix-cell";
    default:
      return location.kind !== "learner-text";
  }
}

function formatLocation(loc) {
  if (!loc) return "artifact";
  switch (loc.kind) {
    case "node-label":
      return `node:${loc.nodeId}`;
    case "branch-label":
      return `branch:${loc.branchId}`;
    case "fragment-callout":
      return loc.branchId ? `fragment:${loc.branchId}` : "fragment:callout";
    case "figure-title":
      return "title";
    case "annotation":
      return loc.placement ? `annotation:${loc.placement}` : "annotation";
    case "dimension-label":
      return "dimension-label";
    case "pole-header":
      return "pole-header";
    case "matrix-cell":
      return loc.nodeId ? `cell:${loc.nodeId}` : "matrix-cell";
    default:
      return loc.kind;
  }
}

/**
 * Classify how a fact is treated by the projection pipeline (descriptive only).
 */
export function classifyFactDisposition(fact, allFacts, linkedMarks, occurrenceCount) {
  const roleLabel = UNIT_ROLE_LABELS[fact.unit] || fact.unit;
  const locations = linkedMarks.map((m) => formatLocation(m.location));
  const normalized = normalizeForMatch(fact.text);

  if (KNOWN_NON_PROJECTED_UNITS.has(fact.unit) && occurrenceCount === 0) {
    return {
      disposition: "DISCARDED",
      justification: "intentionally not projected (field not included in renderer output)",
      materializationSource: null,
      evidence: { role: roleLabel, locations: [] },
    };
  }

  if (isSecondaryMaterializationUnit(fact.unit) && occurrenceCount > 0) {
    const primaryPeer = allFacts.find(
      (f) =>
        f.id !== fact.id &&
        PRIMARY_MATERIALIZATION_UNITS.has(f.unit) &&
        normalizeForMatch(f.text) === normalized,
    );
    if (primaryPeer) {
      return {
        disposition: "DERIVED",
        justification: `represented by ${primaryPeer.unit} ${primaryPeer.ref}`,
        materializationSource: primaryPeer.id,
        evidence: { role: roleLabel, locations, derivedFrom: primaryPeer.ref },
      };
    }
  }

  if (occurrenceCount === 0) {
    return {
      disposition: "UNKNOWN",
      justification: "no learner-visible text match in artifact",
      materializationSource: null,
      evidence: { role: roleLabel, locations: [] },
    };
  }

  const roleMatched = linkedMarks.some((m) => locationMatchesUnit(fact.unit, m.location));
  return {
    disposition: "MATERIALIZED",
    justification: roleMatched ? roleLabel : `${roleLabel} (text present in artifact)`,
    materializationSource: fact.id,
    evidence: { role: roleLabel, locations: [...new Set(locations)] },
  };
}

/**
 * Classify materialization multiplicity for a single fact.
 * @returns {"missing"|"exactly-once"|"duplicated"}
 */
export function classifyMultiplicity(occurrenceCount) {
  if (occurrenceCount === 0) return "missing";
  if (occurrenceCount === 1) return "exactly-once";
  return "duplicated";
}

/**
 * Forward reconciliation: VisualSpec facts → artifact.
 */
export function reconcileFactsToArtifact(facts, artifact) {
  const { haystack, marks } = extractLearnerVisibleMarks(artifact);
  const results = [];

  for (const fact of facts) {
    const occurrenceCount = countNormalizedOccurrences(haystack, fact.text);
    const status = classifyMultiplicity(occurrenceCount);

    const linkedMarks = marksMatchingFact(fact, marks);

    const dispositionInfo = classifyFactDisposition(
      fact,
      facts,
      linkedMarks,
      occurrenceCount,
    );

    results.push({
      id: fact.id,
      unit: fact.unit,
      type: fact.unit,
      text: fact.text,
      ref: fact.ref,
      occurrenceCount,
      status,
      linkedMarkCount: linkedMarks.length,
      disposition: dispositionInfo.disposition,
      justification: dispositionInfo.justification,
      materializationSource: dispositionInfo.materializationSource,
      evidence: dispositionInfo.evidence,
    });
  }

  return results;
}

/**
 * Reverse reconciliation: artifact marks → known facts.
 * Conservative: only text marks; no structural SVG elements.
 */
export function reconcileArtifactToFacts(facts, artifact) {
  const { marks } = extractLearnerVisibleMarks(artifact);
  const factByNormalized = new Map();
  for (const fact of facts) {
    const key = normalizeForMatch(fact.text);
    if (!factByNormalized.has(key)) factByNormalized.set(key, []);
    factByNormalized.get(key).push(fact);
  }

  const orphans = [];

  for (const mark of marks) {
    const exactFacts = factByNormalized.get(mark.normalized) || [];
    if (exactFacts.length > 0) continue;

    const explainable = facts.some((fact) => {
      const fn = normalizeForMatch(fact.text);
      return fn && (mark.normalized.includes(fn) || fn.includes(mark.normalized));
    });

    if (explainable) continue;

    orphans.push({
      text: mark.text,
      normalized: mark.normalized,
      officialTextId: mark.officialTextId,
    });
  }

  return orphans;
}

/**
 * Produce a per-figure projection verification report.
 */
export function verifyFigureProjection({
  spec,
  artifact,
  figureId = null,
  familyId = null,
  familyIds = null,
}) {
  const facts = enumerateProjectionFacts(spec);
  const forward = reconcileFactsToArtifact(facts, artifact);
  const orphans = reconcileArtifactToFacts(facts, artifact);

  const missing = forward.filter((f) => f.status === "missing");
  const duplicated = forward.filter((f) => f.status === "duplicated");
  const exactlyOnce = forward.filter((f) => f.status === "exactly-once");

  const dispositionCounts = countDispositions(forward);

  const resolvedFamilyIds = resolveFamilyIdsForFigure({ spec, familyId, familyIds });
  const totalDisposition = verifyTotalDispositions({
    forwardFacts: forward,
    familyIds: resolvedFamilyIds,
  });

  const byType = {};
  for (const f of forward) {
    byType[f.type] = byType[f.type] || {
      total: 0,
      missing: 0,
      duplicated: 0,
      exactlyOnce: 0,
      materialized: 0,
      derived: 0,
      discarded: 0,
      unknown: 0,
    };
    byType[f.type].total += 1;
    byType[f.type][f.status === "exactly-once" ? "exactlyOnce" : f.status] += 1;
    byType[f.type][dispositionKey(f.disposition)] += 1;
  }

  return {
    figureId: figureId || spec.element,
    element: spec.element,
    primitive: spec.primitive,
    familyIds: resolvedFamilyIds,
    authoritativeSource: AUTHORITATIVE_FACT_SOURCE,
    summary: {
      totalFacts: facts.length,
      exactlyOnce: exactlyOnce.length,
      missing: missing.length,
      duplicated: duplicated.length,
      orphanMarks: orphans.length,
      dispositionMismatches: totalDisposition.summary.mismatched,
      undeclaredFactTypes: totalDisposition.summary.undeclared,
      ...dispositionCounts,
    },
    dispositions: dispositionCounts,
    totalDisposition,
    byType,
    violations: {
      missing: missing.map((f) => ({
        id: f.id,
        type: f.type,
        text: f.text,
        disposition: f.disposition,
        justification: f.justification,
      })),
      duplicated: duplicated.map((f) => ({
        id: f.id,
        type: f.type,
        text: f.text,
        occurrenceCount: f.occurrenceCount,
        disposition: f.disposition,
        justification: f.justification,
        evidence: f.evidence,
      })),
      orphans: orphans.map((o) => ({
        text: o.text,
        officialTextId: o.officialTextId,
      })),
      dispositionMismatches: totalDisposition.mismatches.map((m) => ({
        id: m.id,
        factType: m.factType,
        ref: m.ref,
        declaredDisposition: m.declaredDisposition,
        observedDisposition: m.observedDisposition,
        mismatches: m.mismatches,
        multiplicity: m.multiplicity,
      })),
    },
    facts: forward,
  };
}

function dispositionKey(disposition) {
  switch (disposition) {
    case "MATERIALIZED":
      return "materialized";
    case "DERIVED":
      return "derived";
    case "DISCARDED":
      return "discarded";
    default:
      return "unknown";
  }
}

function countDispositions(facts) {
  const counts = { materialized: 0, derived: 0, discarded: 0, unknown: 0 };
  for (const f of facts) {
    counts[dispositionKey(f.disposition)] += 1;
  }
  return counts;
}

/**
 * Aggregate corpus-level report from per-figure reports.
 */
export function verifyCorpusProjection(figureReports) {
  const byType = {};
  let totalFacts = 0;
  let exactlyOnce = 0;
  let missing = 0;
  let duplicated = 0;
  let orphan = 0;
  let dispositionMismatches = 0;
  const dispositions = { materialized: 0, derived: 0, discarded: 0, unknown: 0 };

  for (const report of figureReports) {
    totalFacts += report.summary.totalFacts;
    exactlyOnce += report.summary.exactlyOnce;
    missing += report.summary.missing;
    duplicated += report.summary.duplicated;
    orphan += report.summary.orphanMarks;
    dispositions.materialized += report.summary.materialized || 0;
    dispositions.derived += report.summary.derived || 0;
    dispositions.discarded += report.summary.discarded || 0;
    dispositions.unknown += report.summary.unknown || 0;
    dispositionMismatches += report.summary.dispositionMismatches || 0;

    for (const [type, counts] of Object.entries(report.byType || {})) {
      byType[type] = byType[type] || {
        total: 0,
        exactlyOnce: 0,
        missing: 0,
        duplicated: 0,
        materialized: 0,
        derived: 0,
        discarded: 0,
        unknown: 0,
      };
      byType[type].total += counts.total;
      byType[type].exactlyOnce += counts.exactlyOnce;
      byType[type].missing += counts.missing;
      byType[type].duplicated += counts.duplicated;
      byType[type].materialized += counts.materialized || 0;
      byType[type].derived += counts.derived || 0;
      byType[type].discarded += counts.discarded || 0;
      byType[type].unknown += counts.unknown || 0;
    }
  }

  const totalDispositionMetrics = aggregateTotalDispositionMetrics(figureReports);

  return {
    figureCount: figureReports.length,
    totalFacts,
    exactlyOnce,
    missing,
    duplicated,
    orphan,
    dispositionMismatches,
    dispositions,
    totalDispositionMetrics,
    byType,
    figures: figureReports.map((r) => ({
      figureId: r.figureId,
      element: r.element,
      familyIds: r.familyIds,
      summary: r.summary,
      dispositions: r.dispositions,
      totalDisposition: r.totalDisposition
        ? {
            summary: r.totalDisposition.summary,
            mismatchCount: r.totalDisposition.mismatches.length,
          }
        : null,
    })),
  };
}

export { buildDispositionAuditMatrix, aggregateTotalDispositionMetrics };

/** Known enumeration gap categories detectable from orphan/missing patterns. */
export const ENUMERATION_GAP_CATEGORIES = Object.freeze([
  "question",
  "threshold-fragment-context",
  "threshold-fragment-low-band-meaning",
  "threshold-fragment-interpretation",
  "threshold-fragment-scale-line",
  "subitem",
]);

/**
 * Classify fact-enumeration gaps by TYPE from a baseline report.
 */
export function classifyEnumerationGaps(corpusReport, figureReports) {
  const gaps = new Set();

  for (const report of figureReports) {
    for (const orphan of report.violations.orphans) {
      const t = normalizeForMatch(orphan.text);
      if (t.includes("?") || t.length > 40) gaps.add("question");
    }

    for (const missing of report.violations.missing) {
      if (missing.type === "subitem") gaps.add("subitem");
    }
  }

  for (const report of figureReports) {
    if (report.primitive !== "decision-algorithm") continue;
    const orphanTexts = report.violations.orphans.map((o) => normalizeForMatch(o.text));

    if (orphanTexts.some((t) => t === "hors urgence" || t.includes("urgence"))) {
      gaps.add("threshold-fragment-context");
    }
    if (orphanTexts.some((t) => /bnp|nt-probnp|pg\/ml/i.test(t))) {
      gaps.add("threshold-fragment-scale-line");
    }
  }

  const n09 = figureReports.find((r) => r.figureId === "N09" || r.element?.includes("N09"));
  if (n09) {
    const hasLowBandMissing = n09.violations.missing.some(
      (m) => m.text === "IC peu probable" || m.type === "threshold-fragment-low-band-meaning",
    );
    if (hasLowBandMissing || !n09.facts.some((f) => f.type === "threshold-fragment-low-band-meaning")) {
      gaps.add("threshold-fragment-low-band-meaning");
    }
  }

  return [...gaps].sort();
}

/**
 * Evaluate P0a → P0b checkpoint.
 * PASS when gaps are limited, extensible categories — no new abstraction needed.
 */
export function evaluateCheckpoint(gapCategories) {
  const allowed = new Set(ENUMERATION_GAP_CATEGORIES);
  const unknown = gapCategories.filter((g) => !allowed.has(g));

  if (unknown.length > 0) {
    return {
      verdict: "STOP",
      reason: `Unknown gap categories requiring new abstraction: ${unknown.join(", ")}`,
      gapCategories,
    };
  }

  if (gapCategories.length === 0) {
    return {
      verdict: "PASS",
      reason: "No enumeration gaps detected; P0b may still harmonize materialization ids.",
      gapCategories,
    };
  }

  if (gapCategories.length > 6) {
    return {
      verdict: "STOP",
      reason: `Too many gap categories (${gapCategories.length}); possible fact model ambiguity.`,
      gapCategories,
    };
  }

  return {
    verdict: "PASS",
    reason: `Limited gap categories extensible via visualSpecClaimUnits: ${gapCategories.join(", ")}`,
    gapCategories,
  };
}
