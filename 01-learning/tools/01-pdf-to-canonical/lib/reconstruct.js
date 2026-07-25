/**
 * Markdown reconstruction orchestrator.
 *
 * segment → classify → specialized reconstruct → render
 *
 * The internal block model is not exposed downstream; Markdown remains the
 * canonical output.
 */

import { segmentDocument } from "./segment.js";
import { classifySegments, isChapterTitle } from "./classify.js";
import { reconstructBlocks } from "./reconstructors/index.js";
import { renderDocument } from "./render.js";

/**
 * @param {{ lines: import('./types.js').NormalizedLine[] }} normalized
 * @param {{
 *   warnings?: ReturnType<import('./warnings.js').createWarningCollector>,
 *   tables?: import('./types.js').DetectedTable[],
 * }} [ctx]
 */
export function reconstructMarkdown(normalized, ctx = {}) {
  const warnings = ctx.warnings;
  const tables = ctx.tables || [];

  const segments = segmentDocument(normalized.lines, tables);
  const draft = classifySegments(segments);
  const blocks = reconstructBlocks(draft, { warnings });
  return renderDocument(blocks, { warnings });
}

/** @deprecated use segmentDocument — kept for tests */
export { segmentDocument as mergeLinesAndTables } from "./segment.js";
export { isChapterTitle };
