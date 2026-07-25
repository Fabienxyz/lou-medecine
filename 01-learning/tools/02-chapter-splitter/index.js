export { splitCollege, splitFromMarkdown } from "./lib/pipeline.js";
export { detectChapters, parseHeadingContent, splitLines, joinLines } from "./lib/detect.js";
export { splitChapters } from "./lib/split.js";
export { validateSplit } from "./lib/validate.js";
export { slugify, chapterFilename } from "./lib/slug.js";
export {
  buildManifest,
  serializeManifest,
  sha256,
  TOOL_VERSION,
  TOOL_NAME,
} from "./lib/manifest.js";
export { resolveSplitPaths, defaultLearningRoot } from "./lib/paths.js";
