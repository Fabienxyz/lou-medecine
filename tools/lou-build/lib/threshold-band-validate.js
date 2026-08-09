/**
 * Independent threshold-scale band label validation — overlap and cell overflow.
 */

import { measureText } from "./text-fit.js";

const DEFAULT_BAND_FONT = 15.4;
const DEFAULT_LINE_HEIGHT = 18;

function rectsOverlap(a, b, pad = 1) {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

function boxInside(inner, outer, eps = 1) {
  return (
    inner.x >= outer.x - eps &&
    inner.y >= outer.y - eps &&
    inner.x + inner.width <= outer.x + outer.width + eps &&
    inner.y + inner.height <= outer.y + outer.height + eps
  );
}

function parseFloatAttr(value, fallback = 0) {
  const v = parseFloat(value);
  return Number.isFinite(v) ? v : fallback;
}

function parseRectTag(tag) {
  const side = tag.match(/data-band-side="(low|high)"/)?.[1];
  if (!side) return null;
  return {
    side,
    x: parseFloatAttr(tag.match(/\sx="([^"]+)"/)?.[1]),
    y: parseFloatAttr(tag.match(/\sy="([^"]+)"/)?.[1]),
    width: parseFloatAttr(tag.match(/\swidth="([^"]+)"/)?.[1]),
    height: parseFloatAttr(tag.match(/\sheight="([^"]+)"/)?.[1]),
  };
}

function parseTextTag(tag, body) {
  const side = tag.match(/data-band-side="(low|high)"/)?.[1];
  if (!side) return null;
  const lines = [];
  const tspanRe = /<tspan[^>]*>([^<]*)<\/tspan>/g;
  let ts;
  while ((ts = tspanRe.exec(body)) !== null) lines.push(ts[1]);
  if (!lines.length) {
    const plain = body.replace(/<[^>]+>/g, "").trim();
    if (plain) lines.push(plain);
  }
  return {
    side,
    x: parseFloatAttr(tag.match(/\sx="([^"]+)"/)?.[1]),
    y: parseFloatAttr(tag.match(/\sy="([^"]+)"/)?.[1]),
    lines,
  };
}

export function extractBandFontSizeFromSvg(svgText) {
  const m = svgText.match(/\.vg-band\{[^}]*font-size:(\d+(?:\.\d+)?)px/);
  return m ? parseFloat(m[1]) : DEFAULT_BAND_FONT;
}

/** Extract band rows from serialized threshold-scale SVG. */
export function extractThresholdBandRows(svgText) {
  const rows = [];
  const scaleRe = /<g[^>]*data-threshold-scale="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g;
  let sm;
  while ((sm = scaleRe.exec(svgText)) !== null) {
    const scaleId = sm[1];
    const block = sm[2];
    const row = { scaleId, cells: {}, texts: {} };

    const cellRe = /<rect\b[^>]*data-band-side="(?:low|high)"[^>]*>/g;
    let cm;
    while ((cm = cellRe.exec(block)) !== null) {
      const cell = parseRectTag(cm[0]);
      if (cell) row.cells[cell.side] = cell;
    }

    const textRe = /<text\b[^>]*data-band-side="(?:low|high)"[^>]*>/g;
    let tm;
    while ((tm = textRe.exec(block)) !== null) {
      const start = tm.index;
      const end = block.indexOf("</text>", start);
      const body = block.slice(start, end);
      const tag = tm[0];
      const text = parseTextTag(tag, body);
      if (text) row.texts[text.side] = text;
    }

    if (row.cells.low && row.cells.high) rows.push(row);
  }
  return rows;
}

export function estimateTextBlockBox(textInfo, cell, options = {}) {
  const fontSize = options.fontSize ?? DEFAULT_BAND_FONT;
  const lineHeight = options.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const lines = textInfo.lines || [];
  if (!lines.length) return null;

  const widths = lines.map((l) => measureText(l, fontSize, 500));
  const width = Math.max(...widths);
  const height = lines.length * lineHeight;
  const x = textInfo.x - width / 2;
  const y = textInfo.y - fontSize * 0.85;

  return { x, y, width, height, lines, fontSize };
}

/**
 * Validate band labels — no cross-cell overlap, text stays inside its cell.
 */
export function validateThresholdBandLabels(svgText, options = {}) {
  const errors = [];
  const rows = extractThresholdBandRows(svgText);
  if (rows.length === 0) {
    return { ok: false, errors: ["threshold-band: no data-threshold-scale rows found"], stats: { rowCount: 0 } };
  }

  const fontSize = options.fontSize ?? extractBandFontSizeFromSvg(svgText);
  const lineHeight = options.lineHeight ?? DEFAULT_LINE_HEIGHT;

  for (const row of rows) {
    const lowCell = row.cells.low;
    const highCell = row.cells.high;
    const lowText = row.texts.low;
    const highText = row.texts.high;

    if (!lowText?.lines?.length || !highText?.lines?.length) {
      errors.push(`threshold-band: ${row.scaleId} missing band label text`);
      continue;
    }

    const lowBox = estimateTextBlockBox(lowText, lowCell, { fontSize, lineHeight });
    const highBox = estimateTextBlockBox(highText, highCell, { fontSize, lineHeight });

    if (lowBox && !boxInside(lowBox, lowCell)) {
      errors.push(`threshold-band: ${row.scaleId} low label overflows cell`);
    }
    if (highBox && !boxInside(highBox, highCell)) {
      errors.push(`threshold-band: ${row.scaleId} high label overflows cell`);
    }
    if (lowBox && highBox && rectsOverlap(lowBox, highBox)) {
      errors.push(`threshold-band: ${row.scaleId} low/high labels overlap`);
    }
  }

  return { ok: errors.length === 0, errors, stats: { rowCount: rows.length } };
}

/** Mutant — single-line labels in cells too narrow (reproduces pre-fix overlap). */
export const MUTANT_THRESHOLD_BAND_OVERLAP = {
  id: "threshold-band-narrow-single-line",
  expectedError: "low/high labels overlap",
  svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80" width="400" height="80">
  <g data-threshold-scale="mutant-scale">
    <rect data-band-side="low" x="20" y="20" width="90" height="36" fill="#eef2ff"/>
    <text data-band-side="low" x="65" y="42" text-anchor="middle" font-size="15"><tspan>IC très improbable</tspan></text>
    <rect data-band-side="high" x="110" y="20" width="90" height="36" fill="#f3f4f6"/>
    <text data-band-side="high" x="155" y="42" text-anchor="middle" font-size="15"><tspan>Poursuivre l'évaluation</tspan></text>
  </g>
</svg>`,
};

export function validateThresholdBandMutantFixtures() {
  const v = validateThresholdBandLabels(MUTANT_THRESHOLD_BAND_OVERLAP.svg);
  return {
    id: MUTANT_THRESHOLD_BAND_OVERLAP.id,
    failedAsExpected: !v.ok && v.errors.some((e) => e.includes(MUTANT_THRESHOLD_BAND_OVERLAP.expectedError)),
    errors: v.errors,
  };
}
