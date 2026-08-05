/** VCCK Wave 1 — canonical composition families and contract versions. */

export const W1_FAMILIES = Object.freeze([
  "chain",
  "dependent-sequence",
  "two-pole",
  "flat-concurrent",
]);

export const W1_CONTRACT_VERSION = Object.freeze({
  chain: "W1-1",
  "dependent-sequence": "W1-2",
  "two-pole": "W1-3",
  "flat-concurrent": "W1-4",
});

export const W1_VIEWPORT_WIDTHS = Object.freeze([375, 530, 768, 1280, 2400]);

export const W1_VERTICAL_LAYOUT = Object.freeze({
  version: "w1-v1",
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 21,
  titleFontSize: 19,
  titleFontWeight: 600,
  titleLineHeight: 26,
  nodeMinWidth: 148,
  nodeMaxWidth: 264,
  nodePaddingX: 18,
  nodePaddingY: 16,
  nodeMaxLines: 3,
  rowGap: 56,
  margin: 40,
  titleBlock: 74,
  titleMaxLines: 3,
  titlePaddingTop: 8,
  titlePaddingBottom: 12,
  cornerRadius: 14,
  textBaselineFactor: 0.75,
});

export const W1_DECISION_LAYOUT = Object.freeze({
  version: "w1-v1",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 19,
  titleFontSize: 18,
  titleFontWeight: 600,
  titleLineHeight: 24,
  nodeMinWidth: 140,
  nodeMaxWidth: 260,
  nodePaddingX: 16,
  nodePaddingY: 14,
  nodeMaxLines: 4,
  rowGap: 72,
  margin: 36,
  titleBlock: 72,
  titleMaxLines: 4,
  titlePaddingTop: 8,
  titlePaddingBottom: 12,
  cornerRadius: 12,
  textBaselineFactor: 0.75,
});

/** Versioned responsive surface limits — see w1-surface.js W1_SURFACE_CONTRACT. */
export const W1_SVG_MAX_DISPLAY_WIDTH = 640;
export const W1_HTML_MAX_READING_WIDTH = 720;

export function isW1Family(familyId) {
  return W1_FAMILIES.includes(familyId);
}
