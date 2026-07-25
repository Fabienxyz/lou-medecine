/**
 * Specialized reconstruction dispatch.
 *
 * Draft blocks from classification are enriched by type-specific reconstructors.
 * Adjacent HierarchyTable / DataTable segments across page breaks are grouped
 * before reconstruction so column roles can be normalized per segment.
 */

import { BlockType, block } from "../blocks.js";
import {
  reconstructHierarchyTable,
  isHierarchyTableGrid,
} from "./hierarchy-table.js";
import { reconstructDataTable } from "./data-table.js";

/**
 * @param {import('../blocks.js').Block[]} draft
 * @param {{ warnings?: ReturnType<import('../warnings.js').createWarningCollector> }} [ctx]
 * @returns {import('../blocks.js').Block[]}
 */
export function reconstructBlocks(draft, ctx = {}) {
  const grouped = groupContinuedTables(draft);
  /** @type {import('../blocks.js').Block[]} */
  const out = [];
  for (const b of grouped) {
    let rebuilt = b;
    if (b.type === BlockType.HierarchyTable) {
      rebuilt = reconstructHierarchyTable(b, ctx);
    } else if (b.type === BlockType.DataTable) {
      rebuilt = reconstructDataTable(b, ctx);
    }
    out.push(rebuilt);
    // Prose clipped out of a hierarchy grid is re-emitted as paragraphs.
    for (const text of rebuilt.leakedProse || []) {
      out.push(
        block(BlockType.Paragraph, {
          text,
          page: rebuilt.page,
          y: rebuilt.y,
        })
      );
    }
  }
  return joinSplitParagraphs(out);
}

/**
 * Rejoin a restored leak paragraph with its lowercase wrap continuation.
 */
function joinSplitParagraphs(blocks) {
  /** @type {import('../blocks.js').Block[]} */
  const out = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.type === BlockType.Paragraph &&
      b.type === BlockType.Paragraph &&
      /^[a-zà-öø-ÿ]/.test((b.text || "").trim()) &&
      !/[.!?]$/.test((prev.text || "").trim())
    ) {
      prev.text = `${prev.text} ${b.text}`.replace(/\s+/g, " ").trim();
      continue;
    }
    out.push(b);
  }
  return out;
}

/**
 * Merge consecutive table blocks that continue across pages.
 * Hierarchy vs Data typing is reconciled after merge using structure.
 * @param {import('../blocks.js').Block[]} blocks
 */
function groupContinuedTables(blocks) {
  if (blocks.length < 2) return blocks;
  /** @type {import('../blocks.js').Block[]} */
  const out = [];
  let cur = blocks[0];

  for (let i = 1; i < blocks.length; i++) {
    const next = blocks[i];
    if (canMergeTableBlocks(cur, next)) {
      const segmentGrids = [
        ...(cur.segmentGrids || (cur.grid ? [cur.grid] : [])),
        ...(next.segmentGrids || (next.grid ? [next.grid] : [])),
      ];
      const hierarchy =
        cur.type === BlockType.HierarchyTable ||
        next.type === BlockType.HierarchyTable ||
        segmentGrids.some((g) => isHierarchyTableGrid(g));
      cur = {
        ...cur,
        type: hierarchy ? BlockType.HierarchyTable : BlockType.DataTable,
        // Advance page to the latest segment so 3+ page continuations keep merging.
        page: next.page ?? cur.page,
        y: next.y ?? cur.y,
        segmentGrids,
        segments: [...(cur.segments || []), ...(next.segments || [])],
        confidence: Math.min(cur.confidence ?? 1, next.confidence ?? 1),
      };
    } else {
      out.push(cur);
      cur = next;
    }
  }
  out.push(cur);
  return out;
}

function isTableBlock(b) {
  return (
    b.type === BlockType.HierarchyTable || b.type === BlockType.DataTable
  );
}

function lastSegmentPage(block) {
  const segs = block.segments || [];
  if (segs.length) return segs[segs.length - 1].page ?? block.page ?? 0;
  return block.page ?? 0;
}

function canMergeTableBlocks(a, b) {
  if (!isTableBlock(a) || !isTableBlock(b)) return false;
  // Use the latest segment page so already-merged multi-page blocks can
  // still absorb the next page (3+ page hierarchy tables).
  const pageA = lastSegmentPage(a);
  const pageB = b.page ?? 0;
  const hierarchyPair =
    a.type === BlockType.HierarchyTable ||
    b.type === BlockType.HierarchyTable ||
    (a.grid && isHierarchyTableGrid(a.grid, a.colCenters || [])) ||
    (b.grid && isHierarchyTableGrid(b.grid, b.colCenters || []));

  const bottoms = (a.segments || []).map((s) => s.yBottom);
  const tops = (b.segments || []).map((s) => s.yTop);
  const yBottom = bottoms.length
    ? Math.min(...bottoms)
    : a.y != null
      ? a.y
      : 0;
  const yTop = tops.length ? Math.max(...tops) : b.y != null ? b.y : 1000;

  // Next-page continuation.
  if (pageB === pageA + 1) {
    if (hierarchyPair) return true;
    return yBottom < 180 && yTop > 580;
  }

  // Same-page split regions (detector interrupted mid-table): stitch only for
  // hierarchy tables that sit directly one under the other.
  if (pageB === pageA && hierarchyPair && yBottom > yTop) {
    return yBottom - yTop < 100;
  }

  return false;
}

export { reconstructHierarchyTable } from "./hierarchy-table.js";
export { reconstructDataTable } from "./data-table.js";
export { consumeBox, matchBoxHeader } from "./box.js";
export { isHierarchyTableGrid } from "./hierarchy-table.js";
