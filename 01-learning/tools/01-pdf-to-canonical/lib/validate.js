/**
 * Structural validation of the generated canonical Markdown.
 * Failures abort the conversion — never silently continue.
 */

/**
 * @param {{
 *   markdown: string,
 *   headingTexts?: string[],
 *   extractionOk?: boolean,
 *   numPages?: number,
 * }} input
 * @returns {{ ok: boolean, errors: string[], anomalies: string[] }}
 */
export function validateMarkdown(input) {
  const errors = [];
  const anomalies = [];
  const md = input.markdown ?? "";

  if (!input.extractionOk) {
    errors.push("Extraction did not complete successfully");
  }

  if (!md || !md.trim()) {
    errors.push("Document is empty");
    return { ok: false, errors, anomalies };
  }

  // Strip conversion-warning comments before structural checks.
  const body = md.replace(/<!--[\s\S]*?-->/g, "").trim();
  if (!body) {
    errors.push("Document body is empty after removing comments");
  }

  const headings = extractHeadings(body);

  if (headings.length === 0 && body.length > 500) {
    anomalies.push("No headings detected in a non-trivial document");
  }

  // Consecutive identical headings are always an error (extraction glitch).
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].raw === headings[i - 1].raw) {
      errors.push(`Duplicated consecutive heading: ${headings[i].raw}`);
    }
  }

  // Duplicate H1 titles are errors (chapters must be unique).
  const h1Counts = new Map();
  for (const h of headings.filter((x) => x.level === 1)) {
    h1Counts.set(h.raw, (h1Counts.get(h.raw) || 0) + 1);
  }
  for (const [raw, count] of h1Counts) {
    if (count > 1) errors.push(`Duplicated H1 (${count}×): ${raw}`);
  }

  // Phantom / invented chapter boundaries: H1 must look like a real chapter
  // title, not a truncated cross-reference residue (e.g. "Chapitre 1 – ) :").
  for (const h of headings.filter((x) => x.level === 1)) {
    if (isPhantomChapterTitle(h.text)) {
      errors.push(`Phantom chapter heading: ${h.raw}`);
    }
  }

  // Within a chapter, reused labels like "### A Définition" under different
  // parents are normal in College texts. Record as anomalies only when the
  // same heading repeats many times (possible extraction loop), not as hard
  // errors. Consecutive duplicates and duplicate H1s remain hard errors.
  let chapter = [];
  const flushChapter = () => {
    const seen = new Map();
    for (const h of chapter) {
      if (h.level === 1) continue;
      if (isAllowedRepeatHeading(h.raw)) continue;
      seen.set(h.raw, (seen.get(h.raw) || 0) + 1);
    }
    for (const [raw, count] of seen) {
      if (count >= 4) {
        anomalies.push(
          `Heading reused frequently within chapter (${count}×): ${raw}`
        );
      }
    }
    chapter = [];
  };

  for (const h of headings) {
    if (h.level === 1) {
      flushChapter();
      chapter = [h];
    } else {
      chapter.push(h);
    }
  }
  flushChapter();

  // Heading hierarchy: levels should not jump by more than 1 (e.g. ## → ####).
  // H1 → H3 is reported as an anomaly (College PDFs sometimes omit an H2 label
  // at a page boundary) but does not abort; deeper skips are errors.
  let prevLevel = 0;
  for (const h of headings) {
    if (h.level === 1) {
      prevLevel = 1;
      continue;
    }
    if (prevLevel > 0 && h.level > prevLevel + 1) {
      const msg = `Invalid heading hierarchy: ${"#".repeat(prevLevel)} → ${"#".repeat(h.level)} at "${h.text}"`;
      if (prevLevel === 1 && h.level === 3) anomalies.push(msg);
      else errors.push(msg);
    }
    prevLevel = h.level;
  }

  // Obvious structural anomalies
  if ((input.numPages ?? 0) > 0) {
    const charsPerPage = body.length / input.numPages;
    if (charsPerPage < 40) {
      errors.push(
        `Extraction looks incomplete: ~${charsPerPage.toFixed(1)} chars/page`
      );
    }
  }

  const fenceCount = (body.match(/^```/gm) || []).length;
  if (fenceCount % 2 !== 0) {
    errors.push("Unbalanced fenced code blocks (possible table fallback corruption)");
  }

  const longLines = body.split("\n").filter((l) => l.length > 2000);
  if (longLines.length > 0) {
    anomalies.push(`${longLines.length} extremely long line(s) (>2000 chars)`);
  }

  if (!headings.some((h) => h.level === 1) && body.length > 1000) {
    anomalies.push("No level-1 heading found");
  }

  return {
    ok: errors.length === 0,
    errors,
    anomalies,
  };
}

export function extractHeadings(markdown) {
  const headings = [];
  for (const line of markdown.split("\n")) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    headings.push({
      level: m[1].length,
      text: m[2],
      raw: `${m[1]} ${m[2]}`,
    });
  }
  return headings;
}

function isAllowedRepeatHeading(raw) {
  const text = raw.replace(/^#{1,6}\s+/, "").trim();
  return /^(Points-clés|Situations de départ|Hiérarchisation des connaissances)$/i.test(
    text
  );
}

/**
 * Generic structural check: an H1 that matches "Chapitre N" but lacks a
 * plausible title body (Item… / substantial words) is treated as invented.
 */
export function isPhantomChapterTitle(text) {
  const t = text.trim();
  if (!/^Chapitre\s+\d+/i.test(t)) return false;
  // Truncation / punctuation residue from inline cross-references.
  if (/[)\].,;:]\s*$/.test(t) && t.length < 40) return true;
  if (/^Chapitre\s+\d+\s*[–—\-]\s*[)\].,;:]/i.test(t)) return true;
  // Real college chapter titles name an Item or carry a substantial title.
  if (/Item\s*:?\s*\d+/i.test(t)) return false;
  const after = t.replace(/^Chapitre\s+\d+\s*[–—\-]?\s*/i, "").trim();
  if (after.length < 8) return true;
  return false;
}
