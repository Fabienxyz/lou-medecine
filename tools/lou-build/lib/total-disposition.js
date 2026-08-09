/**
 * Total Disposition — explicit capability/family declarations vs observed projection.
 * REPORT-ONLY — never gates production; never consumed by renderer.
 */

import { loadFamilyRegistry, familyById } from "./vcck/registry.js";
import { normalizeForMatch } from "./vcck/capability-coverage.js";

/** Closed vocabulary for DISCARDED disposition justifications. */
export const DISCARD_REASONS = Object.freeze([
  "OUT_OF_SCOPE_FOR_CAPABILITY",
  "NON_LEARNER_VISIBLE",
  "LEGACY_UNSUPPORTED",
]);

/** Target dispositions (UNKNOWN is migration-only, never declared). */
export const TARGET_DISPOSITIONS = Object.freeze([
  "MATERIALIZED",
  "DERIVED",
  "DISCARDED",
]);

/** Maps VCCK consumes paths to Fact Spine unit types. */
export const CONSUME_TO_FACT_TYPE = Object.freeze({
  question: "question",
  "nodes.label": "node",
  "nodes.kind": "node",
  "nodes.subitems.label": "subitem",
  "branches.condition": "branch",
  "annotations.label": "annotation",
  "poles.label": "pole",
  "dimensions.label": "dimension",
  "dimensions.cells.items.label": "matrix-cell",
  "groups.items.label": "matrix-cell",
  "set.label": "question",
});

export function isValidDiscardReason(reason) {
  return DISCARD_REASONS.includes(reason);
}

export function isValidDeclaredDisposition(entry) {
  if (!entry || !TARGET_DISPOSITIONS.includes(entry.disposition)) return false;
  if (entry.disposition === "DERIVED" && !entry.derivedFrom) return false;
  if (entry.disposition === "DISCARDED" && !isValidDiscardReason(entry.discardReason)) return false;
  return true;
}

/**
 * Load fact_dispositions from a family registry entry.
 * Returns Map<factType, declaration>.
 */
export function loadFamilyFactDispositions(family) {
  const map = new Map();
  if (!family?.fact_dispositions) return map;
  for (const [factType, entry] of Object.entries(family.fact_dispositions)) {
    map.set(factType, { factType, ...entry });
  }
  return map;
}

/**
 * Merge dispositions from multiple families (later entries override on conflict).
 */
export function mergeFamilyDispositions(families) {
  const merged = new Map();
  for (const family of families) {
    for (const [type, decl] of loadFamilyFactDispositions(family)) {
      merged.set(type, { ...decl, familyId: family.id });
    }
  }
  return merged;
}

/**
 * Resolve applicable family IDs for a figure (explicit override or spec heuristics).
 */
export function resolveFamilyIdsForFigure({ spec, familyId = null, familyIds = null }) {
  if (familyIds?.length) return familyIds;
  if (familyId) return [familyId];
  const ids = [];
  if (spec.primitive === "comparison-matrix") {
    const poleCount = spec.poles?.length ?? 0;
    if (poleCount === 2) ids.push("two-pole");
    else if (poleCount === 3) ids.push("three-pole-reflow");
  } else if (spec.primitive === "decision-algorithm") {
    const hasFragment = (spec.branches || []).some((b) => b.threshold_fragment);
    if (hasFragment) {
      ids.push("skip-level-branch", "embedded-fragment");
    } else {
      ids.push("dependent-sequence");
    }
  } else if (spec.primitive === "causal-graph") {
    ids.push("chain");
  } else if (spec.primitive === "enumeration-set") {
    ids.push("flat-concurrent");
  }
  return [...new Set(ids)];
}

export function loadDeclaredDispositions({ familyIds, registry = null }) {
  const reg = registry || loadFamilyRegistry();
  const families = familyIds.map((id) => familyById(reg, id)).filter(Boolean);
  return {
    families: families.map((f) => f.id),
    dispositions: mergeFamilyDispositions(families),
  };
}

/**
 * Compare declared disposition vs observed projection fact.
 */
export function compareDeclaredVsObserved(declared, observedFact, allFacts) {
  if (!declared) {
    return {
      conformant: false,
      declaredDisposition: null,
      observedDisposition: observedFact.disposition,
      mismatches: ["UNDECLARED_FACT_TYPE"],
      declared: null,
    };
  }

  const mismatches = [];
  const { disposition: declaredDisp, derivedFrom, discardReason } = declared;
  const { disposition: observedDisp, occurrenceCount, status } = observedFact;

  if (declaredDisp === "DISCARDED") {
    if (!isValidDiscardReason(discardReason)) {
      mismatches.push("INVALID_DISCARD_REASON");
    }
    if (occurrenceCount > 0) {
      mismatches.push("DISCARDED_BUT_MATERIALIZED");
    }
  }

  if (declaredDisp === "MATERIALIZED") {
    if (occurrenceCount === 0) mismatches.push("MATERIALIZED_BUT_MISSING");
    if (occurrenceCount > 1) mismatches.push("MATERIALIZED_BUT_DUPLICATED");
    if (observedDisp === "DERIVED" || observedDisp === "DISCARDED") {
      mismatches.push("DISPOSITION_KIND_MISMATCH");
    }
  }

  if (declaredDisp === "DERIVED") {
    if (!derivedFrom) {
      mismatches.push("DERIVED_WITHOUT_SOURCE");
    } else if (observedDisp === "MATERIALIZED" && occurrenceCount > 0) {
      mismatches.push("DERIVED_BUT_INDEPENDENTLY_MATERIALIZED");
    } else if (observedDisp === "DISCARDED" && occurrenceCount === 0) {
      mismatches.push("DERIVED_BUT_DISCARDED");
    } else if (observedDisp === "DERIVED" && derivedFrom && observedFact.materializationSource) {
      const source = allFacts.find((f) => f.id === observedFact.materializationSource);
      if (source && source.unit !== derivedFrom) {
        mismatches.push("DERIVED_FROM_WRONG_SOURCE");
      }
    } else if (observedDisp === "UNKNOWN" && occurrenceCount === 0) {
      mismatches.push("DERIVED_BUT_MISSING");
    }
  }

  if (!isValidDeclaredDisposition(declared)) {
    mismatches.push("INVALID_DECLARATION");
  }

  return {
    conformant: mismatches.length === 0,
    declaredDisposition: declaredDisp,
    observedDisposition: observedDisp,
    mismatches,
    declared,
    multiplicity: status,
  };
}

/**
 * Verify all facts against declared dispositions for resolved families.
 */
export function verifyTotalDispositions({ forwardFacts, familyIds, registry = null }) {
  const { families, dispositions } = loadDeclaredDispositions({ familyIds, registry });
  const results = [];
  let conformant = 0;
  let mismatched = 0;
  let undeclared = 0;

  for (const fact of forwardFacts) {
    const declared = dispositions.get(fact.type) || dispositions.get(fact.unit) || null;
    const comparison = compareDeclaredVsObserved(declared, fact, forwardFacts);
    results.push({
      id: fact.id,
      factType: fact.type,
      ref: fact.ref,
      text: fact.text,
      ...comparison,
    });
    if (!declared) {
      undeclared += 1;
      mismatched += 1;
    } else if (comparison.conformant) conformant += 1;
    else mismatched += 1;
  }

  const declaredDiscarded = [...dispositions.values()].filter((d) => d.disposition === "DISCARDED");
  const discardRate =
    dispositions.size > 0 ? declaredDiscarded.length / dispositions.size : 0;

  return {
    familyIds: families,
    declaredFactTypes: [...dispositions.keys()],
    summary: {
      totalFacts: forwardFacts.length,
      declared: forwardFacts.length - undeclared,
      undeclared,
      conformant,
      mismatched,
      discardRate,
      declaredDiscarded: declaredDiscarded.length,
    },
    comparisons: results,
    mismatches: results.filter((r) => !r.conformant),
  };
}

/**
 * Build audit matrix: family × fact type → behavior / inferred / evidence.
 */
export function buildDispositionAuditMatrix({ registry = null } = {}) {
  const reg = registry || loadFamilyRegistry();
  const familiesWithDispositions = reg.families.filter((f) => f.fact_dispositions);
  const allFactTypes = new Set();

  for (const family of familiesWithDispositions) {
    for (const type of Object.keys(family.fact_dispositions)) {
      allFactTypes.add(type);
    }
  }

  const matrix = [];

  for (const family of familiesWithDispositions) {
    for (const factType of [...allFactTypes].sort()) {
      const declared = family.fact_dispositions[factType] || null;
      const consumesPath = Object.entries(CONSUME_TO_FACT_TYPE).find(([, t]) => t === factType)?.[0];
      const inConsumes = consumesPath ? (family.consumes || []).includes(consumesPath) : false;

      let currentBehavior;
      let currentInferred;
      let evidence;

      if (declared) {
        currentBehavior = "explicitly declared";
        currentInferred = declared.disposition;
        evidence = `families.json#${family.id}.fact_dispositions.${factType}`;
        if (declared.disposition === "DERIVED") {
          evidence += ` → derivedFrom:${declared.derivedFrom}`;
        }
        if (declared.disposition === "DISCARDED") {
          evidence += ` → discardReason:${declared.discardReason}`;
        }
      } else if (inConsumes) {
        currentBehavior = "implicit via consumes (assumed MATERIALIZED)";
        currentInferred = "MATERIALIZED";
        evidence = `families.json#${family.id}.consumes includes ${consumesPath}`;
      } else {
        currentBehavior = "not declared";
        currentInferred = "UNKNOWN";
        evidence = "no fact_dispositions entry; not in consumes";
      }

      matrix.push({
        familyId: family.id,
        factType,
        currentBehavior,
        currentInferredDisposition: currentInferred,
        evidence,
        declared: declared || null,
        inConsumes,
      });
    }
  }

  return matrix;
}

/**
 * Aggregate total-disposition metrics across figure reports.
 */
export function aggregateTotalDispositionMetrics(figureReports) {
  let materialized = 0;
  let derived = 0;
  let discarded = 0;
  let unknown = 0;
  let mismatches = 0;
  let duplicated = 0;
  let missing = 0;
  let orphan = 0;
  let undeclared = 0;
  const byFamily = {};

  for (const report of figureReports) {
    const td = report.totalDisposition;
    if (!td) continue;

    for (const c of td.comparisons) {
      switch (c.observedDisposition) {
        case "MATERIALIZED":
          materialized += 1;
          break;
        case "DERIVED":
          derived += 1;
          break;
        case "DISCARDED":
          discarded += 1;
          break;
        default:
          unknown += 1;
      }
      if (!c.conformant) mismatches += 1;
      if (c.mismatches?.includes("UNDECLARED_FACT_TYPE")) undeclared += 1;
    }

    missing += report.summary.missing || 0;
    duplicated += report.summary.duplicated || 0;
    orphan += report.summary.orphanMarks || 0;

    for (const familyId of td.familyIds || []) {
      byFamily[familyId] = byFamily[familyId] || {
        facts: 0,
        mismatches: 0,
        declaredDiscarded: 0,
        declaredTotal: 0,
      };
      byFamily[familyId].facts += td.summary.totalFacts;
      byFamily[familyId].mismatches += td.summary.mismatched;
    }
  }

  const reg = loadFamilyRegistry();
  for (const [familyId, stats] of Object.entries(byFamily)) {
    const family = familyById(reg, familyId);
    if (family?.fact_dispositions) {
      const declared = Object.values(family.fact_dispositions);
      stats.declaredTotal = declared.length;
      stats.declaredDiscarded = declared.filter((d) => d.disposition === "DISCARDED").length;
      stats.discardRate =
        stats.declaredTotal > 0 ? stats.declaredDiscarded / stats.declaredTotal : 0;
    }
  }

  return {
    materialized,
    derived,
    discarded,
    unknown,
    mismatches,
    duplicated,
    missing,
    orphan,
    undeclared,
    byFamily,
  };
}
