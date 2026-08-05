import { renderDecisionAlgorithm } from "./visual-decision-svg.js";
import { renderThresholdScale } from "./visual-threshold-svg.js";

const RENDERERS = {
  "decision-algorithm": renderDecisionAlgorithm,
  "threshold-scale": renderThresholdScale,
};

export function renderVisualSpecSvgV02(spec) {
  const fn = RENDERERS[spec.primitive];
  if (!fn) {
    return { ok: false, errors: [`no SVG renderer for primitive "${spec.primitive}"`], svg: null };
  }
  return fn(spec);
}
