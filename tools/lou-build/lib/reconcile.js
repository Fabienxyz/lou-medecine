import fs from "node:fs";
import { loadYamlFile } from "./anchors.js";

/**
 * reconcile(source, sliceScope, inventory) -> reconciliationResult
 *
 * Semantic reconciliation is bootstrap-backed: this loader validates a persisted
 * reconciliation.yaml produced by an independent process (Cursor prompt).
 * It is NOT produced by the inventory extractor or projection generator.
 */
export function reconcile({ reconciliationPath, sliceScopeExpected }) {
  if (!fs.existsSync(reconciliationPath)) {
    return {
      ok: false,
      errors: [`missing reconciliation artifact: ${reconciliationPath}`],
      result: null,
    };
  }

  const result = loadYamlFile(reconciliationPath);
  const errors = [];

  if (!result.slice_scope) {
    errors.push("reconciliation: missing slice_scope");
  }
  if (sliceScopeExpected && result.slice_scope !== sliceScopeExpected) {
    errors.push("reconciliation: slice_scope mismatch");
  }
  if (result.status !== "pass") {
    errors.push(`reconciliation: status is ${result.status} (expected pass)`);
  }

  const segments = result.segments || [];
  if (segments.length === 0) {
    errors.push("reconciliation: segments list is empty (in-scope coverage incomplete)");
  }

  const segmentById = new Map(segments.map((seg) => [seg.id, seg]));
  for (const reqId of SLICE_REQUIRED_SEGMENT_IDS) {
    const seg = segmentById.get(reqId);
    if (!seg) {
      errors.push(`reconciliation: required in-scope segment ${reqId} is missing`);
      continue;
    }
    if (!seg.disposition) {
      errors.push(`reconciliation segment ${reqId}: missing disposition`);
      continue;
    }
    if (!ALLOWED_SEGMENT_DISPOSITIONS.has(seg.disposition)) {
      errors.push(
        `reconciliation segment ${reqId}: disposition "${seg.disposition}" is not allowed for publishable slice scope`
      );
    }
    if (seg.disposition === "missed") {
      errors.push(`reconciliation: in-scope segment ${reqId} is missed`);
    }
    if (seg.disposition === "ambiguous" && !seg.note) {
      errors.push(`reconciliation: ambiguous segment ${reqId} requires handling`);
    }
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

  return { ok: errors.length === 0, errors, result };
}

export const SLICE_SCOPE =
  "pulmonary filling pressure / congestion → upstream VG pressure transmission → PPC threshold crossing → transudation → cardiogenic OAP → cardiogenic transudate vs lesional exudate confusion boundary";

/** Minimum in-scope segments for the OAP vertical slice (NOT full Item 234). */
export const SLICE_REQUIRED_SEGMENT_IDS = ["seg-B", "seg-C", "seg-D", "seg-E"];

const ALLOWED_SEGMENT_DISPOSITIONS = new Set([
  "represented",
  "intentionally-deferred",
  "excluded-with-justification",
]);
