export { convertCollege, convertFromExtraction } from "./lib/pipeline.js";
export { extractPdf } from "./lib/extract.js";
export {
  normalizeExtraction,
  assemblePageLines,
  joinItems,
  repairHyphenation,
  tryJoinHyphenated,
  stripChrome,
  isPageNumber,
  normalizeWhitespace,
  collapseArtificialBreaks,
} from "./lib/normalize.js";
export { reconstructMarkdown, isChapterTitle, mergeLinesAndTables } from "./lib/reconstruct.js";
export { segmentDocument } from "./lib/segment.js";
export { classifySegments, classifyTableRegion } from "./lib/classify.js";
export { reconstructBlocks } from "./lib/reconstructors/index.js";
export { renderDocument } from "./lib/render.js";
export { BlockType } from "./lib/blocks.js";
export { validateMarkdown, extractHeadings, isPhantomChapterTitle } from "./lib/validate.js";
export {
  detectTables,
  detectTablesOnPage,
  buildVisualRows,
  clusterXs,
  bandLogicalRows,
  buildTableFromRows,
  renderPipeTable,
  filterExtractionOutsideTables,
} from "./lib/tables.js";
export {
  buildManifest,
  serializeManifest,
  sha256,
  CONVERTER_VERSION,
  CONVERTER_NAME,
} from "./lib/manifest.js";
export { resolveEditionPaths, defaultLearningRoot } from "./lib/paths.js";
export { createWarningCollector } from "./lib/warnings.js";
