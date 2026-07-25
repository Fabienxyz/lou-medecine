/**
 * Block classification from segmented document units.
 *
 * Produces a draft block list. Table regions are typed as HierarchyTable or
 * DataTable using structural cues only. Box/Figure/Caption/Heading/List use
 * generic EDN College document patterns (numbered labels, font size, lists).
 */

import { BlockType, block } from "./blocks.js";
import { isHierarchyTableGrid } from "./reconstructors/hierarchy-table.js";
import { matchBoxHeader, consumeBox } from "./reconstructors/box.js";

const RE_CHAPTER = /^Chapitre\s+(\d+)\s*[–—\-]\s*(.+)$/i;
const RE_CHAPTER_BARE = /^Chapitre\s+(\d+)\b(.*)$/i;
const RE_ROMAN = /^((?:[IVXLCDM]{2,}|[IVX]))(?:\.|\s+)(.+)$/;
const RE_LETTER = /^([A-Z])(?:\.|\s+)([A-ZÀ-Ÿ].+)$/;
const RE_NUMBERED_TITLE = /^(\d+)\s+([A-ZÀ-Ÿ].+)$/;
const RE_FIGURE = /^(Fig(?:ure|\.)\s*[\d.]+)\s*(.*)$/i;
const RE_TABLEAU_CAPTION = /^(Tableau\s+[\d.]+[.]?)\s*(.*)$/i;
const RE_BULLET = /^[•●▪▫‣∙]\s*(.*)$/;
const RE_DASH_ITEM = /^[–—]\s+(.+)$/;
const RE_ORDERED = /^(\d+)[.)]\s+(.+)$/;
/** Short standalone section banners common across EDN Colleges. */
const RE_SECTION_BANNER =
  /^(Situations de départ|Hiérarchisation des connaissances|Points-clés)\s*$/i;

const CHAPTER_MIN_FONT = 20;

/**
 * @param {ReturnType<import('./segment.js').segmentDocument>} segments
 * @returns {import('./blocks.js').Block[]}
 */
export function classifySegments(segments) {
  /** @type {import('./blocks.js').Block[]} */
  const blocks = [];
  let i = 0;
  let inSituations = false;
  let inSommaire = false;

  while (i < segments.length) {
    const ev = segments[i];

    if (ev.kind === "table") {
      inSommaire = false;
      inSituations = false;
      blocks.push(classifyTableRegion(ev.table));
      i += 1;
      continue;
    }

    const line = ev.line;
    const text = line.text.trim();

    if (isChapterTitle(line)) {
      inSituations = false;
      inSommaire = true;
      let j = i + 1;
      let full = formatChapterTitle(text);
      while (j < segments.length && segments[j].kind === "line") {
        const next = segments[j].line;
        const nt = next.text.trim();
        if (next.fontSize < CHAPTER_MIN_FONT) break;
        if (isChapterTitle(next)) break;
        if (isRomanHeading(next, nt) || isLetterHeading(next, nt)) break;
        if (RE_SECTION_BANNER.test(nt)) break;
        full = `${full} ${nt}`;
        j += 1;
      }
      blocks.push(
        block(BlockType.Heading, {
          level: 1,
          text: full.replace(/\s+/g, " ").trim(),
          page: line.page,
          y: line.y,
        })
      );
      i = j;
      continue;
    }

    if (RE_SECTION_BANNER.test(text)) {
      inSommaire = false;
      inSituations = /^Situations de départ/i.test(text);
      const label = /^Points-clés/i.test(text)
        ? "Points-clés"
        : text;
      blocks.push(
        block(BlockType.Heading, {
          level: 2,
          text: label,
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    const tabCap = text.match(RE_TABLEAU_CAPTION);
    if (tabCap) {
      inSommaire = false;
      inSituations = false;
      const caption = [tabCap[1], tabCap[2]].filter(Boolean).join(" ").trim();
      blocks.push(
        block(BlockType.Caption, {
          text: caption,
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    const fig = text.match(RE_FIGURE);
    if (fig) {
      inSommaire = false;
      inSituations = false;
      const caption = [fig[1], fig[2]].filter(Boolean).join(" ").trim();
      blocks.push(
        block(BlockType.Figure, {
          caption,
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    if (matchBoxHeader(text, line)) {
      inSommaire = false;
      inSituations = false;
      const consumed = consumeBox(segments, i, isBlockBoundary);
      if (consumed) {
        blocks.push(consumed.block);
        i = consumed.next;
        continue;
      }
    }

    if (isRomanHeading(line, text)) {
      if (inSommaire && !inSituations && line.fontSize < 16) {
        blocks.push(block(BlockType.Paragraph, { text, page: line.page, y: line.y }));
        i += 1;
        continue;
      }
      inSommaire = false;
      inSituations = false;
      blocks.push(
        block(BlockType.Heading, {
          level: 2,
          text,
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    if (isLetterHeading(line, text)) {
      if (inSommaire && !inSituations && line.fontSize < 13.5) {
        blocks.push(block(BlockType.Paragraph, { text, page: line.page, y: line.y }));
        i += 1;
        continue;
      }
      inSommaire = false;
      inSituations = false;
      blocks.push(
        block(BlockType.Heading, {
          level: 3,
          text,
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    if (
      !inSituations &&
      !inSommaire &&
      RE_NUMBERED_TITLE.test(text) &&
      line.fontSize >= 13.5 &&
      text.length < 120
    ) {
      blocks.push(
        block(BlockType.Heading, {
          level: 4,
          text,
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    if (inSommaire && isBodyProse(line, text)) inSommaire = false;

    const bullet = text.match(RE_BULLET);
    if (bullet) {
      inSommaire = false;
      blocks.push(
        block(BlockType.List, {
          ordered: false,
          items: [bullet[1]],
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    const dash = text.match(RE_DASH_ITEM);
    if (dash) {
      inSommaire = false;
      blocks.push(
        block(BlockType.List, {
          ordered: false,
          items: [dash[1]],
          indent: 1,
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    if (inSituations && RE_NUMBERED_TITLE.test(text)) {
      blocks.push(
        block(BlockType.List, {
          ordered: false,
          items: [text],
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    const ordered = text.match(RE_ORDERED);
    if (ordered && !inSituations) {
      inSommaire = false;
      blocks.push(
        block(BlockType.List, {
          ordered: true,
          items: [`${ordered[1]}. ${ordered[2]}`],
          page: line.page,
          y: line.y,
        })
      );
      i += 1;
      continue;
    }

    inSommaire = inSommaire && isSommaireLine(text);
    blocks.push(block(BlockType.Paragraph, { text, page: line.page, y: line.y }));
    i += 1;
  }

  return dropCollapsedTableLabels(blocks);
}

/**
 * Remove prose lines that are only a gutter-collapsed copy of a table header
 * immediately before a HierarchyTable / DataTable (structural: few short tokens).
 */
function dropCollapsedTableLabels(blocks) {
  /** @type {import('./blocks.js').Block[]} */
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const next = blocks[i + 1];
    if (
      b.type === BlockType.Paragraph &&
      next &&
      (next.type === BlockType.HierarchyTable ||
        next.type === BlockType.DataTable) &&
      isCollapsedHeaderLabel(b.text || "")
    ) {
      continue;
    }
    out.push(b);
  }
  return out;
}

function isCollapsedHeaderLabel(text) {
  const t = text.trim();
  if (!t || t.length > 80 || /[.!?]/.test(t)) return false;
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 5) return false;
  return parts.every((p) => p.length <= 24);
}

/**
 * @param {import('./types.js').DetectedTable} table
 */
export function classifyTableRegion(table) {
  const grid = table.grid || parsePipeGrid(table.markdown);
  const hierarchy = isHierarchyTableGrid(grid, table.colCenters || []);
  return block(hierarchy ? BlockType.HierarchyTable : BlockType.DataTable, {
    page: table.page,
    y: table.yTop,
    grid,
    colCenters: table.colCenters,
    segments: table.segments,
    segmentGrids: table.segmentGrids || (grid ? [grid] : []),
    confidence: table.confidence,
    kind: table.kind,
  });
}

function mergeAdjacentLists(blocks) {
  // Keep list items as individual blocks for fidelity; no heavy merging.
  return blocks;
}

function parsePipeGrid(markdown) {
  if (!markdown) return [];
  return markdown
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*---/.test(l))
    .map((l) =>
      l
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    );
}

export function isChapterTitle(line) {
  const t = line.text.trim();
  if ((line.fontSize || 0) < CHAPTER_MIN_FONT) return false;
  if (RE_CHAPTER.test(t) || RE_CHAPTER_BARE.test(t)) return true;
  if (line.fontSize >= 24 && /^Item\s+\d+/i.test(t)) return true;
  return false;
}

function formatChapterTitle(text) {
  const m = text.match(RE_CHAPTER) || text.match(RE_CHAPTER_BARE);
  if (m) {
    const num = m[1];
    const rest = (m[2] || "").trim();
    return rest ? `Chapitre ${num} – ${rest}` : `Chapitre ${num}`;
  }
  return text;
}

function isRomanHeading(line, text) {
  const m = text.match(RE_ROMAN);
  if (!m) return false;
  if (/^:/.test(m[2].trim()) || /^[A-Z]{2,}\s*:/.test(text)) return false;
  if (!isPlausibleSectionRoman(m[1])) return false;
  if (line.fontSize >= 16) return true;
  return Boolean(m[2] && m[2].length >= 3 && text.length < 140);
}

function isPlausibleSectionRoman(token) {
  const value = romanToInt(token);
  return value != null && value >= 1 && value <= 30;
}

function romanToInt(token) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const s = token.toUpperCase();
  if (!/^[IVXLCDM]+$/.test(s)) return null;
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]] || 0;
    total += cur < next ? -cur : cur;
  }
  const canonical = [
    "I","II","III","IV","V","VI","VII","VIII","IX","X",
    "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX",
    "XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII","XXVIII","XXIX","XXX",
  ];
  if (!canonical.includes(s)) return null;
  return total;
}

function isLetterHeading(line, text) {
  const m = text.match(RE_LETTER);
  if (!m) return false;
  if (/^[IVXLCDM]{2,}(?:\.|\s+)/.test(text)) return false;
  if (/^[IVX](?:\.|\s+)/.test(text) && line.fontSize >= 16) return false;
  if (line.fontSize >= 13) return true;
  return Boolean(m[2] && /^[A-ZÀ-Ÿ]/.test(m[2]) && text.length < 120);
}

function isBodyProse(line, text) {
  if (line.fontSize >= 16) return false;
  if (RE_ROMAN.test(text) || RE_LETTER.test(text)) return false;
  if (RE_SECTION_BANNER.test(text)) return false;
  return text.length > 80 || /[.!?]$/.test(text);
}

function isSommaireLine(text) {
  return (
    RE_ROMAN.test(text) ||
    RE_LETTER.test(text) ||
    RE_SECTION_BANNER.test(text) ||
    text.length < 100
  );
}

function isBlockBoundary(line) {
  const t = line.text.trim();
  return (
    isChapterTitle(line) ||
    isRomanHeading(line, t) ||
    isLetterHeading(line, t) ||
    RE_FIGURE.test(t) ||
    Boolean(matchBoxHeader(t, line)) ||
    RE_SECTION_BANNER.test(t) ||
    RE_TABLEAU_CAPTION.test(t) ||
    line.fontSize >= 16
  );
}

export {
  isRomanHeading,
  isLetterHeading,
  isBlockBoundary,
  CHAPTER_MIN_FONT,
};
