import fs from "node:fs";
import YAML from "yaml";

/** Collapse whitespace for resilient matching across line wraps in the College source. */
export function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function loadYamlFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return YAML.parse(raw);
}

/**
 * Resolve anchor quote within source text.
 * Returns { ok, line_hint?, error?, matchCount? }
 */
export function resolveAnchor(sourceText, anchor, sourceMeta) {
  const quote = anchor.quote;
  if (!quote || typeof quote !== "string") {
    return { ok: false, error: "missing quote" };
  }

  const normQuote = normalizeWhitespace(quote);
  if (!normQuote) {
    return { ok: false, error: "empty quote" };
  }

  let searchText = sourceText;
  if (anchor.section_path) {
    const scoped = extractSectionScope(sourceText, anchor.section_path, sourceMeta);
    if (scoped) {
      searchText = scoped;
    }
  }

  const scopedNorm = normalizeWhitespace(searchText);
  const idx = scopedNorm.indexOf(normQuote);
  if (idx === -1) {
    return { ok: false, error: `quote not found: ${quote.slice(0, 60)}…` };
  }

  const occurrences = countOccurrences(scopedNorm, normQuote);
  if (occurrences !== 1) {
    return {
      ok: false,
      error: `quote matches ${occurrences} times in scope (expected 1)`,
      matchCount: occurrences,
    };
  }

  const lineHint = lineNumberForQuote(sourceText, normQuote);
  return { ok: true, line_hint: lineHint };
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = haystack.indexOf(needle, pos);
    if (idx === -1) break;
    count += 1;
    pos = idx + needle.length;
  }
  return count;
}

function lineNumberForQuote(sourceText, normQuote) {
  const lines = sourceText.split("\n");
  const normLines = lines.map(normalizeWhitespace);
  const joined = normLines.join(" ");
  const idx = joined.indexOf(normQuote);
  if (idx === -1) return null;
  const before = joined.slice(0, idx);
  return before.split(" ").length > 0
    ? lines.findIndex((_, i) => {
        const prefix = normalizeWhitespace(lines.slice(0, i + 1).join(" "));
        return prefix.includes(normQuote.slice(0, Math.min(20, normQuote.length)));
      }) + 1
    : 1;
}

/** Section scoping using source.meta.yaml section index when available. */
export function extractSectionScope(sourceText, sectionPath, sourceMeta) {
  const sections = sourceMeta?.sections || [];
  const section = sections.find((s) => s.path === sectionPath);
  if (section?.heading_markers?.length) {
    return sliceByHeadingMarkers(sourceText, section.heading_markers, sections, sectionPath);
  }

  if (sectionPath === sourceMeta?.section_path_base) {
    const start = sourceText.indexOf("C Physiopathologie");
    if (start === -1) return null;
    const end = sourceText.indexOf(
      "2 En cas de dysfonctionnement cardiaque",
      start
    );
    return end === -1 ? sourceText.slice(start) : sourceText.slice(start, end);
  }

  return null;
}

function sliceByHeadingMarkers(sourceText, markers, allSections, sectionPath) {
  const startIdx = findMarkerPosition(sourceText, markers[0]);
  if (startIdx === -1) return null;

  const ordered = [...allSections].sort(
    (a, b) => findMarkerPosition(sourceText, a.heading_markers?.[0] ?? "") -
      findMarkerPosition(sourceText, b.heading_markers?.[0] ?? "")
  );
  const currentIndex = ordered.findIndex((s) => s.path === sectionPath);
  let endIdx = sourceText.length;
  if (currentIndex !== -1 && currentIndex + 1 < ordered.length) {
    const next = ordered[currentIndex + 1];
    const nextStart = findMarkerPosition(
      sourceText,
      next.heading_markers?.[0] ?? ""
    );
    if (nextStart !== -1 && nextStart > startIdx) {
      endIdx = nextStart;
    }
  }

  return sourceText.slice(startIdx, endIdx);
}

function findMarkerPosition(sourceText, marker) {
  if (!marker) return -1;
  return sourceText.indexOf(marker);
}

export function validateAllAnchors(sourceText, inventory, sourceMeta) {
  const errors = [];
  const results = [];
  const edition = sourceMeta.edition;

  for (const kp of inventory.kps || []) {
    for (const anchor of kp.anchors || []) {
      if (anchor.edition && anchor.edition !== edition) {
        errors.push(`${kp.id}: anchor edition mismatch`);
        continue;
      }
      const result = resolveAnchor(sourceText, anchor, sourceMeta);
      results.push({ kp: kp.id, quote: anchor.quote, ...result });
      if (!result.ok) {
        errors.push(`${kp.id}: ${result.error}`);
      }
    }
  }

  return { ok: errors.length === 0, errors, results };
}

export function loadSourceBundle(chapterPaths, pathsModule) {
  const sourceMeta = loadYamlFile(chapterPaths.sourceMeta);
  sourceMeta._path = chapterPaths.sourceMeta;
  const { text } = pathsModule.loadSourceText(sourceMeta);
  return { sourceMeta, sourceText: text };
}
