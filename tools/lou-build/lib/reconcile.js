import fs from "node:fs";
import { loadYamlFile } from "./anchors.js";

const ALLOWED_SEGMENT_DISPOSITIONS = new Set([
  "represented",
  "intentionally-deferred",
  "excluded-with-justification",
]);

export function normalizeScope(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * reconcile({ reconciliationPath, scopeExpected?, requiredSegmentIds?, inventoryKpIds? })
 *
 * Semantic reconciliation is bootstrap-backed: validates persisted
 * build/reconciliation.yaml from an independent process.
 */
export function reconcile({
  reconciliationPath,
  scopeExpected = null,
  requiredSegmentIds = null,
  inventoryKpIds = null,
}) {
  if (!fs.existsSync(reconciliationPath)) {
    return {
      ok: false,
      errors: [`missing reconciliation artifact: ${reconciliationPath}`],
      result: null,
    };
  }

  const result = loadYamlFile(reconciliationPath);
  const errors = [];

  const scope =
    result.reconciliation_scope || result.slice_scope || result.scope;
  if (!scope) {
    errors.push("reconciliation: missing scope (reconciliation_scope / slice_scope)");
  }
  if (scopeExpected && normalizeScope(scope) !== normalizeScope(scopeExpected)) {
    errors.push("reconciliation: scope mismatch");
  }

  if (result.status !== "pass") {
    errors.push(`reconciliation: status is ${result.status} (expected pass)`);
  }

  const requiredIds =
    requiredSegmentIds ||
    result.required_segment_ids ||
    result.required_segments ||
    [];

  const segments = result.segments || [];
  if (segments.length === 0) {
    errors.push(
      "reconciliation: segments list is empty (in-scope coverage incomplete)"
    );
  }

  const segmentById = new Map(segments.map((seg) => [seg.id, seg]));
  for (const reqId of requiredIds) {
    const seg = segmentById.get(reqId);
    if (!seg) {
      errors.push(`reconciliation: required in-scope segment ${reqId} is missing`);
      continue;
    }
    validateSegment(seg, reqId, errors, inventoryKpIds);
  }

  for (const seg of segments) {
    if (!seg.id) {
      errors.push("reconciliation segment: missing id");
      continue;
    }
    if (!seg.disposition) {
      errors.push(`reconciliation segment ${seg.id}: missing disposition`);
    }
  }

  return { ok: errors.length === 0, errors, result, scope, requiredIds };
}

function validateSegment(seg, reqId, errors, inventoryKpIds) {
  if (!seg.disposition) {
    errors.push(`reconciliation segment ${reqId}: missing disposition`);
    return;
  }
  if (!ALLOWED_SEGMENT_DISPOSITIONS.has(seg.disposition)) {
    errors.push(
      `reconciliation segment ${reqId}: disposition "${seg.disposition}" is not allowed for publishable scope`
    );
  }
  if (seg.disposition === "missed") {
    errors.push(`reconciliation: in-scope segment ${reqId} is missed`);
  }
  if (seg.disposition === "ambiguous" && !seg.note) {
    errors.push(`reconciliation: ambiguous segment ${reqId} requires handling`);
  }
  if (
    seg.disposition === "represented" &&
    inventoryKpIds &&
    Array.isArray(seg.kp) &&
    seg.kp.length > 0
  ) {
    for (const kpId of seg.kp) {
      if (!inventoryKpIds.has(kpId)) {
        errors.push(
          `reconciliation segment ${reqId}: references unknown KP ${kpId}`
        );
      }
    }
  }
}

/** OAP slice fixture constants — regression reference only, not used by core loader. */
export const OAP_SLICE_SCOPE =
  "pulmonary filling pressure / congestion → upstream VG pressure transmission → PPC threshold crossing → transudation → cardiogenic OAP → cardiogenic transudate vs lesional exudate confusion boundary";

export const OAP_SLICE_REQUIRED_SEGMENT_IDS = ["seg-B", "seg-C", "seg-D", "seg-E"];
