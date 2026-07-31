/**
 * Lot E — Reader-neutral package publication guards (contrat 04 §10.3).
 * Blocks Reader vocabulary (projection labels, pseudo-view known_absent) from manifests.
 */

/** Legacy Reader tab ids — not package production absences (contrat 08 §5). */
export const READER_PSEUDO_ABSENT_IDS = new Set(["actors", "readiness"]);

export function validateProjectionRegistryNeutral(projections) {
  const errors = [];
  for (const p of projections || []) {
    if (p && Object.prototype.hasOwnProperty.call(p, "label") && p.label != null) {
      errors.push(
        `projections.yaml: projection "${p.id || "?"}": Reader label must not be published (remove label field)`
      );
    }
  }
  return errors;
}

export function validateKnownAbsentNeutral(knownAbsent) {
  const errors = [];
  const entries = Array.isArray(knownAbsent) ? knownAbsent : [];
  for (const id of entries) {
    if (typeof id !== "string" || !id.trim()) {
      errors.push("chapter.package.yaml: known_absent entries must be non-empty strings");
      continue;
    }
    if (READER_PSEUDO_ABSENT_IDS.has(id)) {
      errors.push(
        `chapter.package.yaml: known_absent "${id}" is a Reader pseudo-view — not a package production absence`
      );
    }
  }
  return errors;
}

export function validateManifestReaderNeutral(manifest) {
  const errors = [];
  errors.push(...validateKnownAbsentNeutral(manifest?.known_absent));
  for (const p of manifest?.projections || []) {
    if (p && Object.prototype.hasOwnProperty.call(p, "label") && p.label != null) {
      errors.push(
        `manifest: projection "${p.id || "?"}": Reader label must not be published`
      );
    }
  }
  return errors;
}
