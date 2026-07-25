import fs from "node:fs";
import { inventoryById, anchorForKp } from "./inventory.js";
import { visualSpecClaimUnits } from "./visual-spec.js";
import { loadYamlFile } from "./anchors.js";

/**
 * Semantic grounding for visualSpec units.
 *
 * This is not a parallel grounding system. It reuses the claim IDs produced by
 * visualSpecClaimUnits(), the sourced/bridging/scaffolding vocabulary, and the
 * {ok, errors, verdicts, status} result model of ground.js — including its
 * writer, so visual verdicts serialise exactly like prose verdicts.
 *
 * The philosophy is inherited unchanged:
 *   sourced    → must be directly supported
 *   bridging   → must be entailed, and entailment is a judgement, not a default
 *   scaffolding→ must be explicitly reviewed as carrying no medical claim
 *   uncertain  → unresolved, and unresolved blocks
 */

/** Classes whose verdict cannot be computed and must come from an independent pass. */
const REVIEW_REQUIRED = new Set(["bridging", "scaffolding"]);

export function loadVisualGroundingReview(filePath) {
  if (!fs.existsSync(filePath)) {
    return { verdicts: {}, meta: null, missing: true };
  }
  const doc = loadYamlFile(filePath);
  return {
    verdicts: doc?.verdicts || {},
    meta: {
      element: doc?.element,
      method: doc?.method,
      reviewer: doc?.reviewer,
      reviewed_against: doc?.reviewed_against,
    },
    missing: false,
  };
}

/**
 * Produce a verdict for every semantic unit of a visualSpec.
 *
 * `review` supplies independently adjudicated verdicts for units whose class
 * requires human/LLM judgement. Each such verdict is honoured only if its
 * unit_digest still matches the unit — a review of wording that has since
 * changed is treated as unresolved, not as a pass.
 */
export function groundVisualSpec({ spec, inventory, sourceMeta, review = null }) {
  const errors = [];
  const verdicts = {};
  const kpMap = inventoryById(inventory);
  const edition = sourceMeta?.edition;
  const reviewVerdicts = review?.verdicts || {};

  for (const unit of visualSpecClaimUnits(spec)) {
    const base = {
      unit: unit.unit,
      ref: unit.ref,
      class: unit.class,
      kp: unit.kp,
    };

    // --- deterministic leg: do the cited KPs resolve to real anchored source? ---
    const unresolvedKp = [];
    let anchorCount = 0;
    for (const kpId of unit.kp) {
      const kp = kpMap.get(kpId);
      const anchor = anchorForKp(kp, edition);
      if (!kp || !anchor || !String(anchor.quote || "").trim()) {
        unresolvedKp.push(kpId);
      } else {
        anchorCount += 1;
      }
    }

    if (unresolvedKp.length > 0) {
      verdicts[unit.id] = {
        ...base,
        mode: "deterministic",
        rule: "kp-anchor-resolved",
        status: "fail",
        unresolved_kp: unresolvedKp,
      };
      errors.push(
        `visual grounding: ${unit.id} cites KP without resolvable anchor (${unresolvedKp.join(", ")})`
      );
      continue;
    }

    if (!REVIEW_REQUIRED.has(unit.class)) {
      // sourced: deterministically grounded, unless an independent pass overrides.
      const override = reviewVerdicts[unit.id];
      if (override && override.status === "fail") {
        verdicts[unit.id] = {
          ...base,
          mode: "semantic-independent",
          status: "fail",
          rationale: override.rationale || null,
        };
        errors.push(`visual grounding: ${unit.id} failed independent review`);
        continue;
      }
      verdicts[unit.id] = {
        ...base,
        mode: "deterministic",
        rule: "kp-anchor-resolved",
        status: "pass",
        anchors: anchorCount,
      };
      continue;
    }

    // --- judgement leg: bridging and scaffolding require an independent verdict ---
    const entry = reviewVerdicts[unit.id];
    if (!entry) {
      verdicts[unit.id] = {
        ...base,
        mode: "semantic-independent",
        status: "unresolved",
        reason: "no independent verdict recorded",
      };
      errors.push(`visual grounding: ${unit.id} lacks an independent verdict`);
      continue;
    }
    if (entry.unit_digest !== unit.digest) {
      verdicts[unit.id] = {
        ...base,
        mode: "semantic-independent",
        status: "unresolved",
        reason: "stale review — semantic unit changed since it was adjudicated",
        reviewed_digest: entry.unit_digest || null,
        current_digest: unit.digest,
      };
      errors.push(
        `visual grounding: ${unit.id} has a stale independent verdict (unit changed since review)`
      );
      continue;
    }
    if (entry.status !== "pass") {
      verdicts[unit.id] = {
        ...base,
        mode: "semantic-independent",
        status: entry.status === "fail" ? "fail" : "unresolved",
        rationale: entry.rationale || null,
      };
      errors.push(`visual grounding: ${unit.id} did not pass independent review`);
      continue;
    }

    verdicts[unit.id] = {
      ...base,
      mode: "semantic-independent",
      status: "pass",
      unit_digest: unit.digest,
      rationale: entry.rationale || null,
    };
  }

  return {
    ok: errors.length === 0,
    errors,
    verdicts,
    status: errors.length === 0 ? "pass" : "fail",
    note: review?.meta?.method
      ? `Independent verdicts from ${review.meta.method}; each bound to unit_digest and invalidated by any change to the unit.`
      : "No independent review record supplied; all judgement-class units are unresolved.",
  };
}

/**
 * The gate between semantics and pixels.
 *
 * Deliberately a computed function rather than a persisted flag: a stored
 * "eligible: true" would be a self-certifying artifact that outlives the facts
 * it summarises. Callers recompute it from current validation and grounding.
 */
export function renderEligibility({ validation, grounding }) {
  const reasons = [];

  if (!validation || validation.ok !== true) {
    reasons.push("structural validation failed");
  }

  const verdicts = grounding?.verdicts || {};
  if (Object.keys(verdicts).length === 0) {
    reasons.push("no grounding verdicts present");
  }

  const blocking = [];
  for (const [id, v] of Object.entries(verdicts)) {
    if (v.status !== "pass") blocking.push({ id, status: v.status, unit: v.unit });
  }
  for (const b of blocking) {
    reasons.push(`${b.unit || "unit"} ${b.id} is ${b.status}`);
  }

  return { eligible: reasons.length === 0, reasons, blocking };
}
