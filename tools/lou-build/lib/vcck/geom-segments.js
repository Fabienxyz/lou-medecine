/**
 * Shared segment intersection — separate determinant threshold from parametric tolerance.
 */

export const GEOM_DETERMINANT_EPS = 1e-10;
export const GEOM_PARAM_EPS = 1e-6;
export const GEOM_AXIS_EPS = 1;

/** True when segments cross in interior (open interval, excluding endpoint-only contact). */
export function segmentsIntersect(a, b, options = {}) {
  const detEps = options.detEps ?? GEOM_DETERMINANT_EPS;
  const paramEps = options.paramEps ?? GEOM_PARAM_EPS;

  const den = (a.x1 - a.x2) * (b.y1 - b.y2) - (a.y1 - a.y2) * (b.x1 - b.x2);
  if (Math.abs(den) < detEps) return false;

  const t =
    ((a.x1 - b.x1) * (b.y1 - b.y2) - (a.y1 - b.y1) * (b.x1 - b.x2)) / den;
  const u =
    ((a.x1 - b.x1) * (a.y1 - a.y2) - (a.y1 - b.y1) * (a.x1 - a.x2)) / den;

  return t > paramEps && t < 1 - paramEps && u > paramEps && u < 1 - paramEps;
}

/** Endpoint contact on segment a at parameter t. */
export function segmentEndpointContact(a, b, options = {}) {
  const detEps = options.detEps ?? GEOM_DETERMINANT_EPS;
  const paramEps = options.paramEps ?? GEOM_PARAM_EPS;
  const den = (a.x1 - a.x2) * (b.y1 - b.y2) - (a.y1 - a.y2) * (b.x1 - b.x2);
  if (Math.abs(den) < detEps) return false;
  const t =
    ((a.x1 - b.x1) * (b.y1 - b.y2) - (a.y1 - b.y1) * (b.x1 - b.x2)) / den;
  const u =
    ((a.x1 - b.x1) * (a.y1 - a.y2) - (a.y1 - b.y1) * (a.x1 - a.x2)) / den;
  const onA = t >= -paramEps && t <= 1 + paramEps;
  const onB = u >= -paramEps && u <= 1 + paramEps;
  const endpoint =
    Math.abs(t) <= paramEps ||
    Math.abs(t - 1) <= paramEps ||
    Math.abs(u) <= paramEps ||
    Math.abs(u - 1) <= paramEps;
  return onA && onB && endpoint;
}

/** Quasi-axis-aligned segment test (|dx| or |dy| below epsilon). */
export function isQuasiVertical(seg, eps = GEOM_PARAM_EPS) {
  return Math.abs(seg.x2 - seg.x1) <= eps;
}

export function isQuasiHorizontal(seg, eps = GEOM_PARAM_EPS) {
  return Math.abs(seg.y2 - seg.y1) <= eps;
}
