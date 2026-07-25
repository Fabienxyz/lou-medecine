/**
 * Text normalization: assemble lines, repair hyphenation, strip chrome,
 * collapse artificial breaks — without rewriting medical wording.
 */

const PAGE_NUMBER_RE = /^(?:page\s*)?\d+\s*(?:\/\s*\d+)?$/i;
const PUBLICATION_RE =
  /^By\s+\S+(?:\s+\S+)*\s+Published\s+On:\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/i;
const PUBLICATION_LOOSE_RE =
  /^(?:By\s+.+?\s+)?Published\s+On:\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/i;

/** Horizontal gap (PDF units) above which a space is inserted between items. */
const WORD_GAP = 1.8;
/** Vertical tolerance for grouping items onto the same line. */
const LINE_Y_TOL = 2.5;

/**
 * Normalize extracted pages into clean logical lines.
 * @param {{ pages: import('./types.js').ExtractedPage[] }} extraction
 * @param {{ warnings?: ReturnType<import('./warnings.js').createWarningCollector> }} [ctx]
 */
export function normalizeExtraction(extraction, ctx = {}) {
  const warnings = ctx.warnings;
  /** @type {import('./types.js').NormalizedLine[]} */
  const lines = [];

  for (const page of extraction.pages) {
    const pageLines = assemblePageLines(page);
    for (const line of pageLines) {
      lines.push(line);
    }
  }

  const withoutChrome = stripChrome(lines, warnings);
  const dehyphenated = repairHyphenation(withoutChrome);
  const collapsed = collapseArtificialBreaks(dehyphenated);

  return {
    lines: collapsed,
    stats: {
      pages: extraction.numPages ?? extraction.pages.length,
      rawLines: lines.length,
      keptLines: collapsed.length,
    },
  };
}

/**
 * Group positioned items into reading-order lines.
 * @param {import('./types.js').ExtractedPage} page
 */
export function assemblePageLines(page) {
  const items = page.items
    .slice()
    .sort((a, b) => {
      // Top-to-bottom, then left-to-right (PDF y grows upward).
      if (Math.abs(a.y - b.y) > LINE_Y_TOL) return b.y - a.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.str < b.str ? -1 : a.str > b.str ? 1 : 0;
    });

  /** @type {typeof items[]} */
  const groups = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (!last) {
      groups.push([item]);
      continue;
    }
    const refY = averageY(last);
    if (Math.abs(item.y - refY) <= LINE_Y_TOL) {
      last.push(item);
    } else {
      groups.push([item]);
    }
  }

  /** @type {import('./types.js').NormalizedLine[]} */
  const lines = [];
  for (const group of groups) {
    group.sort((a, b) => a.x - b.x || a.str.localeCompare(b.str));
    const text = joinItems(group);
    if (!text.trim()) continue;

    const fontSizes = group.map((g) => g.fontSize);
    const maxFont = Math.max(...fontSizes);
    const avgFont =
      fontSizes.reduce((s, n) => s + n, 0) / Math.max(fontSizes.length, 1);
    const fonts = [...new Set(group.map((g) => g.fontName))].sort();

    lines.push({
      page: page.pageNumber,
      y: round3(averageY(group)),
      x: round3(group[0].x),
      text: normalizeWhitespace(text),
      fontSize: round3(maxFont),
      avgFontSize: round3(avgFont),
      fonts,
      pageWidth: page.width,
      pageHeight: page.height,
    });
  }

  return lines;
}

function averageY(items) {
  return items.reduce((s, i) => s + i.y, 0) / items.length;
}

/**
 * Join items on one line using gap heuristics (preserves real hyphens).
 */
export function joinItems(items) {
  if (!items.length) return "";
  let out = items[0].str;
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const cur = items[i];
    const prevEnd = prev.x + (prev.width || 0);
    const gap = cur.x - prevEnd;

    const left = out;
    const right = cur.str;
    const leftEndsWord = /[A-Za-zÀ-ÖØ-öø-ÿ0-9]$/.test(left);
    const rightStartsWord = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(right);

    if (gap < -0.5) {
      // Overlap / positioning noise — concatenate, but keep word boundary
      // when PDF widths are slightly underestimated between discrete words.
      if (leftEndsWord && rightStartsWord && gap > -2) out += " " + right;
      else out += right;
    } else if (gap <= WORD_GAP) {
      // Tight gap: usually same word, but uppercase-starting tokens after a
      // finished word are typically a new word ("SFC" + "Published").
      if (
        leftEndsWord &&
        rightStartsWord &&
        /[a-zà-öø-ÿ]$/.test(left) === false &&
        /^[A-ZÀ-Ÿ]/.test(right) &&
        gap >= 0.4
      ) {
        out += " " + right;
      } else if (leftEndsWord && rightStartsWord && gap >= 1.0) {
        out += " " + right;
      } else {
        out += right;
      }
    } else {
      // Significant gap → word boundary, unless either side is a hyphen fragment.
      if (left.endsWith("-") || right.startsWith("-")) {
        out += right;
      } else if (/^\s/.test(right) || /\s$/.test(left)) {
        out += right;
      } else {
        out += " " + right;
      }
    }
  }
  return out;
}

/**
 * Remove page numbers, repeated headers/footers, publication boilerplate.
 */
export function stripChrome(lines, warnings) {
  const footerHeaderFreq = detectRepeatedBands(lines);
  const out = [];

  for (const line of lines) {
    const t = line.text.trim();

    if (isPageNumber(t, line)) {
      continue;
    }

    if (
      PUBLICATION_RE.test(t) ||
      PUBLICATION_LOOSE_RE.test(t) ||
      /^By\s+\S+\s*Published\s*On:\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/i.test(t) ||
      /^By\s+\S+Published\s*On:\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/i.test(t)
    ) {
      continue;
    }

    // Loose "By SFC" alone on a line followed by publication — already covered.
    if (/^By\s+SFC\s*$/i.test(t)) {
      continue;
    }

    if (footerHeaderFreq.has(t) && footerHeaderFreq.get(t) >= 3) {
      // Repeated running header/footer across pages.
      continue;
    }

    // Extremely top/bottom bands that are only digits → page chrome.
    const relY = line.y / (line.pageHeight || 1);
    if (relY < 0.04 || relY > 0.96) {
      if (/^\d+$/.test(t) || PAGE_NUMBER_RE.test(t)) continue;
    }

    out.push(line);
  }

  if (warnings && footerHeaderFreq.size) {
    for (const [text, count] of [...footerHeaderFreq.entries()].sort()) {
      if (count >= 3) {
        warnings.add(
          "stripped-repeated-band",
          "Removed repeated header/footer band",
          { detail: `${count}× "${truncate(text, 80)}"` }
        );
      }
    }
  }

  return out;
}

function detectRepeatedBands(lines) {
  /** @type {Map<string, number>} */
  const freq = new Map();
  for (const line of lines) {
    const t = line.text.trim();
    if (!t || t.length > 80) continue;
    const relY = line.y / (line.pageHeight || 1);
    // Only consider top/bottom bands as running headers/footers.
    if (relY > 0.08 && relY < 0.92) continue;
    // Do not treat chapter titles as headers.
    if (/^Chapitre\s+\d+/i.test(t)) continue;
    if (line.fontSize >= 18) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return freq;
}

export function isPageNumber(text, line) {
  const t = text.trim();
  if (!t) return false;
  if (PAGE_NUMBER_RE.test(t)) {
    const relY = line ? line.y / (line.pageHeight || 1) : 0;
    // Bare numbers in the body are not page numbers.
    if (/^\d+$/.test(t) && relY > 0.08 && relY < 0.92) return false;
    return true;
  }
  return false;
}

/**
 * Repair PDF end-of-line hyphenation. Keeps real compound hyphens.
 */
export function repairHyphenation(lines) {
  if (!lines.length) return lines;
  /** @type {import('./types.js').NormalizedLine[]} */
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    let cur = { ...lines[i], text: lines[i].text };

    while (i + 1 < lines.length) {
      const next = lines[i + 1];
      const joined = tryJoinHyphenated(cur.text, next.text);
      if (!joined) break;
      // Only join when consecutive lines are near in reading flow (same page
      // or page break), and not when next looks like a new block/heading.
      if (looksLikeBlockStart(next.text) || next.fontSize > cur.fontSize + 2) {
        break;
      }
      cur = {
        ...cur,
        text: joined,
        fontSize: Math.max(cur.fontSize, next.fontSize),
      };
      i += 1;
    }
    out.push(cur);
  }
  return out;
}

/**
 * If `left` ends with a soft hyphenation break, join with `right`.
 * @returns {string|null}
 */
export function tryJoinHyphenated(left, right) {
  const L = left.replace(/\s+$/, "");
  const R = right.replace(/^\s+/, "");
  if (!L || !R) return null;

  // Classic soft hyphen: word- + continuation
  const m = L.match(/^(.*?)([A-Za-zÀ-ÖØ-öø-ÿ]{2,})-$/);
  if (m && /^[a-zà-öø-ÿ]/.test(R)) {
    return normalizeWhitespace(`${m[1]}${m[2]}${R}`);
  }
  return null;
}

function looksLikeBlockStart(text) {
  const t = text.trim();
  // Note: do NOT treat body-size "chapitre N" cross-reference continuations
  // as block starts — those must rejoin the preceding prose line.
  // Real chapter titles are gated by font size in reconstruct.
  return (
    /^(?:[IVXLCDM]{2,}|[IVX])(?:\.|\s+)\s*\S/.test(t) ||
    /^[A-Z](?:\.|\s+)[A-ZÀ-Ÿ]/.test(t) ||
    /^Fig(?:ure|\.)\s*\d+/i.test(t) ||
    /^Encadré\s+\d+/i.test(t) ||
    /^Tableau\s+\d+/i.test(t) ||
    /^Points-clés\s*$/i.test(t) ||
    /^Situations de départ\s*$/i.test(t) ||
    /^Hiérarchisation des connaissances\s*$/i.test(t) ||
    /^[•●▪▫‣∙]/.test(t) ||
    /^–\s+\S/.test(t) ||
    /^-\s+\S/.test(t)
  );
}

/**
 * Merge lines that are clearly wrapped prose (not lists/headings/tables).
 * Conservative: only joins when the previous line does not end a sentence
 * and the next line continues mid-paragraph with matching style.
 */
export function collapseArtificialBreaks(lines) {
  if (!lines.length) return lines;
  /** @type {import('./types.js').NormalizedLine[]} */
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    let cur = { ...lines[i], text: lines[i].text };

    while (i + 1 < lines.length) {
      const next = lines[i + 1];
      if (!shouldCollapse(cur, next)) break;
      cur = {
        ...cur,
        text: normalizeWhitespace(`${cur.text} ${next.text}`),
        fontSize: Math.max(cur.fontSize, next.fontSize),
      };
      i += 1;
    }
    out.push(cur);
  }
  return out;
}

function shouldCollapse(cur, next) {
  const a = cur.text.trim();
  const b = next.text.trim();
  if (!a || !b) return false;
  if (looksLikeBlockStart(b)) return false;
  if (looksLikeBlockStart(a)) return false;
  if (Math.abs(cur.fontSize - next.fontSize) > 1.5) return false;
  // Different indent often means list/table/caption continuation with structure.
  if (Math.abs((cur.x || 0) - (next.x || 0)) > 12) return false;
  // Do not collapse if previous ends with sentence/clause closers that usually end a visual line intentionally kept...
  // Actually for PDF wraps we DO want to join after commas etc.
  // Stop if previous already ends paragraph-like.
  if (/[.!?…:]$/.test(a)) return false;
  // Numbered situation lines / short labels
  if (/^\d+\s+\S/.test(a) && a.length < 100 && /[.!?]$/.test(a)) return false;
  // Next starts with lowercase or common continuation → wrap
  if (/^[a-zà-öø-ÿ(]/.test(b)) return true;
  // Next starts uppercase but previous ends with hyphen already handled;
  // allow join when previous clearly mid-phrase (ends with comma, ;, or letter)
  if (/[;,]$/.test(a)) return true;
  if (/[A-Za-zÀ-ÖØ-öø-ÿ]$/.test(a) && /^[A-Za-zÀ-ÖØ-öø-ÿ]/.test(b)) {
    // Avoid joining two short heading-like fragments of different roles.
    if (a.length < 40 && b.length < 40 && /^[A-ZÀ-Ÿ]/.test(b)) {
      // Likely two labels — do not collapse.
      return false;
    }
    return a.length >= 40;
  }
  return false;
}

export function normalizeWhitespace(text) {
  return text
    .replace(/\u00ad/g, "") // soft hyphen char
    .replace(/[\u00a0\u202f\u2007\u2009]/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ \n/g, "\n")
    .trim();
}

function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

function truncate(s, n) {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
