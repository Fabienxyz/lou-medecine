/**
 * Specialized Box (Encadré) reconstructor.
 *
 * Preserves identifier, title, and body as distinct fields.
 * Prevents title↔body merge and title/body inversion.
 *
 * Detection uses a generic numbered-box identifier pattern common to
 * official EDN Colleges (label + dotted number), plus font/size cues —
 * not specialty-specific titles.
 */

/** Numbered box label: "Encadré 2.1 …", accent-insensitive. */
const RE_BOX_ID =
  /^((?:Encadr[eé]|ENCADR[EÉ])\s+(\d+(?:\.\d+)*))\s*(.*)$/i;

/**
 * @param {string} text
 * @param {{ fontSize?: number }} [line]
 */
export function matchBoxHeader(text, line = {}) {
  const t = String(text || "").trim();
  const m = t.match(RE_BOX_ID);
  if (!m) return null;

  // Citation fragments: "encadré 15.1)." — not block openers.
  if (/\)\s*\.?$/.test(t) && t.length < 40) return null;
  if (/^encadr[eé]\s+[\d.]+\s*\)/i.test(t)) return null;

  const id = m[1].replace(/\s+/g, " ").trim();
  // Normalize display form while keeping source wording of the title part.
  const idNorm = id.replace(/^encadr[eé]/i, "Encadré");
  let title = (m[3] || "").trim();

  // Prefer real block titles (identifier + title words). Bare ids with no
  // title are accepted only when display-sized (rare cover lines).
  if (!title && (line.fontSize || 0) < 13) return null;
  if (title && title.length < 2 && (line.fontSize || 0) < 13) return null;

  return { id: idNorm, title, number: m[2] };
}

/**
 * Consume a Box block starting at `start` in a line-segment stream.
 *
 * @param {Array<{ kind: string, line?: import('../types.js').NormalizedLine }>} stream
 * @param {number} start
 * @param {(line: import('../types.js').NormalizedLine) => boolean} isBoundary
 * @returns {{ block: import('../blocks.js').Block, next: number } | null}
 */
export function consumeBox(stream, start, isBoundary) {
  const ev = stream[start];
  if (!ev || ev.kind !== "line") return null;
  const header = matchBoxHeader(ev.line.text, ev.line);
  if (!header) return null;

  let { id, title } = header;
  let i = start + 1;

  // Title wrap: at most one continuation, and only when the title on the
  // identifier line is clearly truncated (ends mid-phrase).
  if (isTruncatedTitle(title) && i < stream.length && stream[i].kind === "line") {
    const next = stream[i].line;
    const nt = next.text.trim();
    if (
      !isBoundary(next) &&
      isTitleContinuation(nt) &&
      !matchBoxHeader(nt, next)
    ) {
      title = `${title} ${nt}`.replace(/\s+/g, " ").trim();
      i += 1;
    }
  }

  /** @type {string[]} */
  const body = [];
  while (i < stream.length && stream[i].kind === "line") {
    const line = stream[i].line;
    const nt = line.text.trim();
    if (isBoundary(line) || matchBoxHeader(nt, line)) break;
    body.push(nt);
    i += 1;
  }

  // Never invert: if somehow body landed in title via bad wrap, split on
  // a second title-case clause after a complete first clause.
  const split = splitMergedTitleBody(title);
  if (split.bodyPrefix) {
    title = split.title;
    body.unshift(split.bodyPrefix);
  }

  return {
    block: {
      type: "Box",
      page: ev.line.page,
      y: ev.line.y,
      id,
      title,
      body,
    },
    next: i,
  };
}

function isTruncatedTitle(title) {
  if (!title) return true;
  if (/[.!?]$/.test(title)) return false;
  // Ends with a function word / truncated mid-phrase.
  return /\b(?:de|des|du|d'|le|la|les|un|une|et|ou|à|au|aux|en|pour|par|sur)\s*$/i.test(
    title
  );
}

function isTitleContinuation(text) {
  if (!text || text.length > 70) return false;
  if (/^[•●▪▫‣∙–—]/.test(text)) return false;
  if (/^[a-zà-öø-ÿ]/.test(text)) return false;
  if (/[.!?]$/.test(text) && text.length > 40) return false;
  // A short standalone Title-Case phrase after an already-complete title
  // is body structure (section label), not a wrap.
  if (/^[A-ZÀ-Ÿ][\wÀ-ÿ'’\-]+(?:\s+[A-ZÀ-Ÿa-zà-ÿ'’\-]+){0,4}$/.test(text) && text.length <= 55) {
    return false;
  }
  return true;
}

/**
 * If title absorbed a following body heading (two Title-Case clauses),
 * split them. Generic punctuation/case structure only.
 */
function splitMergedTitleBody(title) {
  if (!title || title.length < 40) return { title, bodyPrefix: "" };
  // First lowercase/paren → Capital boundary where the left side looks like
  // a complete title clause (not truncated on a function word).
  const re = /[a-zà-öø-ÿ)]\s+[A-ZÀ-Ÿ]/g;
  let m;
  while ((m = re.exec(title)) !== null) {
    const left = title.slice(0, m.index + 1).trim();
    const right = title.slice(m.index + 1).trim();
    if (left.length < 25 || right.length < 10) continue;
    if (/\b(?:de|des|du|le|la|les|et)\s*$/i.test(left)) continue;
    return { title: left, bodyPrefix: right };
  }
  return { title, bodyPrefix: "" };
}
