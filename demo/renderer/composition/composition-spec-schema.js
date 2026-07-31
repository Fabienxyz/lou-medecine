/**
 * Reader Composition V1 — minimal spec schema and static validator.
 * Lot A only: no runtime, no compose(), no manifest resolution.
 */

export const SPEC_VERSION = "1.0";

/** Frozen product view ids — READER-COMPOSITION-V1-FREEZE.md §2 */
export const FROZEN_VIEW_IDS = [
  "cognitive-priming",
  "mental-model",
  "notions",
  "clinical-cases",
  "college-official",
  "qcm",
  "notes",
];

/** Frozen labels by viewId — acceptance reference only */
export const FROZEN_VIEW_LABELS = {
  "cognitive-priming": "Amorçage cognitif",
  "mental-model": "Modèle mental",
  notions: "Notions",
  "clinical-cases": "Cas cliniques",
  "college-official": "Collège officiel",
  qcm: "QCM",
  notes: "Notes",
};

export const ALLOWED_SOURCE_KINDS = [
  "projection",
  "questions",
  "scenarios",
  "college-source",
  "none",
];

export const ALLOWED_AVAILABILITY_POLICIES = [
  "default",
  "always-planned",
  "always-published-for-shell",
];

const ROOT_KEYS = new Set(["version", "views"]);
const VIEW_KEYS = new Set([
  "viewId",
  "label",
  "displayOrder",
  "availabilityPolicy",
  "sources",
]);
const SOURCE_KEYS = new Set(["kind", "ref", "mergeOrder"]);

/** kebab-case ids or snake_case manifest keys (e.g. source_edition) */
const REF_PATTERN = /^[a-z][a-z0-9_-]*$/;

/**
 * @param {unknown} spec
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateCompositionSpec(spec) {
  const errors = [];

  if (spec === null || typeof spec !== "object" || Array.isArray(spec)) {
    return { ok: false, errors: ["spec must be a plain object"] };
  }

  for (const key of Object.keys(spec)) {
    if (!ROOT_KEYS.has(key)) {
      errors.push(`forbidden root field: ${key}`);
    }
  }

  if (spec.version !== SPEC_VERSION) {
    errors.push(`version must be "${SPEC_VERSION}"`);
  }

  if (!Array.isArray(spec.views)) {
    errors.push("views must be an array");
    return { ok: false, errors };
  }

  if (spec.views.length !== 7) {
    errors.push(`views must contain exactly 7 entries (got ${spec.views.length})`);
  }

  const seenViewIds = new Set();
  const seenDisplayOrders = new Set();

  spec.views.forEach(function (view, index) {
    const prefix = `views[${index}]`;

    if (view === null || typeof view !== "object" || Array.isArray(view)) {
      errors.push(`${prefix} must be a plain object`);
      return;
    }

    for (const key of Object.keys(view)) {
      if (!VIEW_KEYS.has(key)) {
        errors.push(`${prefix}: forbidden field: ${key}`);
      }
    }

    for (const required of ["viewId", "label", "displayOrder", "availabilityPolicy", "sources"]) {
      if (!(required in view)) {
        errors.push(`${prefix}: missing required field: ${required}`);
      }
    }

    if (typeof view.viewId === "string") {
      if (seenViewIds.has(view.viewId)) {
        errors.push(`duplicate viewId: ${view.viewId}`);
      }
      seenViewIds.add(view.viewId);

      if (!FROZEN_VIEW_IDS.includes(view.viewId)) {
        errors.push(`${prefix}: unknown viewId "${view.viewId}"`);
      }

      if (
        FROZEN_VIEW_LABELS[view.viewId] &&
        view.label !== FROZEN_VIEW_LABELS[view.viewId]
      ) {
        errors.push(
          `${prefix}: label must be "${FROZEN_VIEW_LABELS[view.viewId]}" for ${view.viewId}`
        );
      }
    }

    if (typeof view.displayOrder === "number") {
      if (!Number.isInteger(view.displayOrder) || view.displayOrder < 1 || view.displayOrder > 7) {
        errors.push(`${prefix}: displayOrder must be an integer from 1 to 7`);
      }
      if (seenDisplayOrders.has(view.displayOrder)) {
        errors.push(`duplicate displayOrder: ${view.displayOrder}`);
      }
      seenDisplayOrders.add(view.displayOrder);
    }

    if (
      typeof view.availabilityPolicy === "string" &&
      !ALLOWED_AVAILABILITY_POLICIES.includes(view.availabilityPolicy)
    ) {
      errors.push(`${prefix}: invalid availabilityPolicy "${view.availabilityPolicy}"`);
    }

    if (!Array.isArray(view.sources)) {
      errors.push(`${prefix}: sources must be an array`);
      return;
    }

    const projectionSources = [];

    view.sources.forEach(function (source, sourceIndex) {
      const sp = `${prefix}.sources[${sourceIndex}]`;

      if (source === null || typeof source !== "object" || Array.isArray(source)) {
        errors.push(`${sp} must be a plain object`);
        return;
      }

      for (const key of Object.keys(source)) {
        if (!SOURCE_KEYS.has(key)) {
          errors.push(`${sp}: forbidden field: ${key}`);
        }
      }

      if (!("kind" in source)) {
        errors.push(`${sp}: missing required field: kind`);
        return;
      }

      if (!ALLOWED_SOURCE_KINDS.includes(source.kind)) {
        errors.push(`${sp}: invalid kind "${source.kind}"`);
      }

      if (source.kind === "none") {
        if ("ref" in source) {
          errors.push(`${sp}: ref must not be set when kind is "none"`);
        }
        if ("mergeOrder" in source) {
          errors.push(`${sp}: mergeOrder must not be set when kind is "none"`);
        }
        return;
      }

      if (!("ref" in source)) {
        errors.push(`${sp}: missing required field: ref`);
      } else if (typeof source.ref !== "string" || !REF_PATTERN.test(source.ref)) {
        errors.push(`${sp}: ref must match ${REF_PATTERN}`);
      }

      if ("mergeOrder" in source) {
        if (source.kind !== "projection") {
          errors.push(`${sp}: mergeOrder is only allowed for kind "projection"`);
        } else if (
          typeof source.mergeOrder !== "number" ||
          !Number.isInteger(source.mergeOrder) ||
          source.mergeOrder < 1
        ) {
          errors.push(`${sp}: mergeOrder must be a positive integer`);
        } else {
          projectionSources.push(source);
        }
      } else if (source.kind === "projection") {
        projectionSources.push(source);
      }
    });

    if (projectionSources.length > 1) {
      const mergeOrders = projectionSources
        .map(function (s) {
          return s.mergeOrder;
        })
        .filter(function (m) {
          return m !== undefined;
        });
      if (mergeOrders.length !== projectionSources.length) {
        errors.push(
          `${prefix}: mergeOrder required on every projection source when a view aggregates multiple projections`
        );
      } else {
        const unique = new Set(mergeOrders);
        if (unique.size !== mergeOrders.length) {
          errors.push(`${prefix}: duplicate mergeOrder among projection sources`);
        }
      }
    }
  });

  for (let order = 1; order <= 7; order += 1) {
    if (!seenDisplayOrders.has(order)) {
      errors.push(`missing displayOrder: ${order}`);
    }
  }

  for (const viewId of FROZEN_VIEW_IDS) {
    if (!seenViewIds.has(viewId)) {
      errors.push(`missing frozen viewId: ${viewId}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
