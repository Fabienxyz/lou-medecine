/**
 * Deterministic text measurement and wrapping.
 *
 * No DOM, no canvas, no font files: widths come from a static advance-width
 * table so that the same string always measures the same on every machine.
 *
 * This module knows nothing about any subject domain. It never shortens, elides,
 * or abbreviates a string — if text cannot fit the space allowed, callers are
 * told so and are expected to fail rather than to trim meaning.
 */

/**
 * Advance widths as a fraction of font size, approximating Inter Regular.
 * Values are rounded slightly upward: overestimating makes boxes a little wide,
 * whereas underestimating would let text spill outside them.
 */
const ADVANCE = {
  " ": 0.28, "!": 0.30, '"': 0.43, "#": 0.68, $: 0.61, "%": 0.78, "&": 0.68,
  "'": 0.25, "(": 0.35, ")": 0.35, "*": 0.51, "+": 0.61, ",": 0.27, "-": 0.36,
  ".": 0.27, "/": 0.46, ":": 0.27, ";": 0.27, "<": 0.61, "=": 0.61, ">": 0.61,
  "?": 0.52, "@": 0.90, "[": 0.35, "\\": 0.46, "]": 0.35, "^": 0.61, _: 0.48,
  "`": 0.30, "{": 0.35, "|": 0.27, "}": 0.35, "~": 0.61,

  0: 0.61, 1: 0.61, 2: 0.61, 3: 0.61, 4: 0.61, 5: 0.61,
  6: 0.61, 7: 0.61, 8: 0.61, 9: 0.61,

  A: 0.67, B: 0.67, C: 0.70, D: 0.72, E: 0.61, F: 0.59, G: 0.74, H: 0.73,
  I: 0.29, J: 0.55, K: 0.66, L: 0.58, M: 0.89, N: 0.75, O: 0.77, P: 0.66,
  Q: 0.77, R: 0.67, S: 0.64, T: 0.61, U: 0.72, V: 0.66, W: 0.99, X: 0.64,
  Y: 0.62, Z: 0.61,

  a: 0.59, b: 0.61, c: 0.55, d: 0.61, e: 0.58, f: 0.37, g: 0.61, h: 0.60,
  i: 0.27, j: 0.27, k: 0.56, l: 0.27, m: 0.90, n: 0.60, o: 0.62, p: 0.61,
  q: 0.61, r: 0.41, s: 0.53, t: 0.41, u: 0.60, v: 0.55, w: 0.81, x: 0.55,
  y: 0.55, z: 0.52,

  // Punctuation and symbols that appear in structured labels.
  "\u2019": 0.25, "\u2018": 0.25, "\u201C": 0.43, "\u201D": 0.43,
  "\u00AB": 0.52, "\u00BB": 0.52, "\u2013": 0.61, "\u2014": 1.0,
  "\u2026": 0.90, "\u00B7": 0.30, "\u00A0": 0.28, "\u202F": 0.18,
  "\u2192": 0.72, "\u2190": 0.72, "\u2191": 0.72, "\u2193": 0.72,
  "\u2194": 0.80, "\u21D2": 0.72, "\u00D7": 0.61, "\u00F7": 0.61,
  "\u2264": 0.61, "\u2265": 0.61, "\u2260": 0.61, "\u00B1": 0.61,
  "\u00B0": 0.40, "\u2030": 1.05, "\u00B5": 0.60,
};

/** Deliberately generous, so unknown glyphs never cause silent overflow. */
const DEFAULT_ADVANCE = 0.7;

/** Inter's semibold and bold cuts are marginally wider than the regular cut. */
const WEIGHT_FACTOR = { 400: 1.0, 500: 1.01, 600: 1.03, 700: 1.05 };

/** Guards against accumulated rounding error in the table above. */
const SAFETY_FACTOR = 1.02;

/** Points where a single over-long token may be split without losing content. */
const INTRA_WORD_BREAKS = ["-", "/", "\u2013", "\u2014", "\u00B7"];

function advanceFor(char) {
  const direct = ADVANCE[char];
  if (direct !== undefined) return direct;

  // Accented letters advance like their base letter; combining marks add nothing.
  const decomposed = char.normalize("NFD");
  const base = decomposed[0];
  if (base !== char) {
    const baseAdvance = ADVANCE[base];
    if (baseAdvance !== undefined) return baseAdvance;
  }
  return DEFAULT_ADVANCE;
}

export function measureText(text, fontSize, weight = 400) {
  const factor = (WEIGHT_FACTOR[weight] || 1.05) * SAFETY_FACTOR;
  let em = 0;
  for (const char of String(text)) em += advanceFor(char);
  return em * fontSize * factor;
}

/**
 * Split a token that is itself wider than the line, at punctuation only.
 * Returns null when the token cannot be split, which is a hard failure.
 */
function splitLongToken(token, maxWidth, fontSize, weight) {
  const pieces = [];
  let current = "";

  for (const char of token) {
    current += char;
    if (INTRA_WORD_BREAKS.includes(char)) {
      pieces.push(current);
      current = "";
    }
  }
  if (current) pieces.push(current);

  if (pieces.length < 2) return null;
  if (pieces.some((p) => measureText(p, fontSize, weight) > maxWidth)) return null;
  return pieces;
}

/**
 * Greedy word wrap within a fixed width.
 *
 * Returns `{ ok: false }` rather than a shortened string when the text cannot be
 * laid out. Truncation is never an outcome of this function.
 */
export function wrapText(text, maxWidth, fontSize, weight = 400, options = {}) {
  const maxLines = options.maxLines ?? Infinity;
  const raw = String(text).trim().replace(/\s+/g, " ");

  if (!raw) {
    return { ok: false, lines: [], width: 0, errors: ["empty text"] };
  }

  const tokens = [];
  for (const word of raw.split(" ")) {
    if (measureText(word, fontSize, weight) <= maxWidth) {
      tokens.push(word);
      continue;
    }
    const pieces = splitLongToken(word, maxWidth, fontSize, weight);
    if (!pieces) {
      return {
        ok: false,
        lines: [],
        width: 0,
        errors: [
          `word "${word}" needs ${Math.ceil(measureText(word, fontSize, weight))}px ` +
            `but only ${Math.round(maxWidth)}px is available, and it has no breakable punctuation`,
        ],
      };
    }
    tokens.push(...pieces);
  }

  const lines = [];
  let line = "";
  for (const token of tokens) {
    // A piece produced by splitLongToken already ends in its delimiter, so it
    // joins the next piece without an inserted space.
    const glue = line && !INTRA_WORD_BREAKS.includes(line.slice(-1)) ? " " : "";
    const candidate = line + glue + token;
    if (line && measureText(candidate, fontSize, weight) > maxWidth) {
      lines.push(line);
      line = token;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    return {
      ok: false,
      lines: [],
      width: 0,
      errors: [
        `text needs ${lines.length} lines at ${Math.round(maxWidth)}px wide but only ` +
          `${maxLines} are allowed; widen the primitive budget or shorten the label in the spec`,
      ],
    };
  }

  const width = Math.max(...lines.map((l) => measureText(l, fontSize, weight)));
  return { ok: true, lines, width, errors: [] };
}
