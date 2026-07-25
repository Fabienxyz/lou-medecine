/**
 * Warning collector — unknown / lossy situations must be reported, never guessed.
 */
export function createWarningCollector() {
  /** @type {{ code: string, message: string, page?: number, detail?: string }[]} */
  const warnings = [];

  return {
    add(code, message, { page, detail } = {}) {
      const entry = { code, message };
      if (page != null) entry.page = page;
      if (detail != null) entry.detail = detail;
      warnings.push(entry);
    },
    list() {
      // Stable order for determinism in any derived text.
      return warnings
        .slice()
        .sort((a, b) => {
          const pa = a.page ?? 0;
          const pb = b.page ?? 0;
          if (pa !== pb) return pa - pb;
          if (a.code !== b.code) return a.code < b.code ? -1 : 1;
          return a.message < b.message ? -1 : a.message > b.message ? 1 : 0;
        });
    },
    get length() {
      return warnings.length;
    },
  };
}

/** Render warnings as HTML comments (do not alter medical content). */
export function formatWarningsAsComments(warnings) {
  if (!warnings.length) return "";
  const lines = [
    "",
    "<!--",
    "CONVERSION WARNINGS — information that could not be represented perfectly.",
    "These comments are machine-emitted; they are not College content.",
  ];
  for (const w of warnings) {
    const loc = w.page != null ? ` page=${w.page}` : "";
    const detail = w.detail ? ` | ${w.detail}` : "";
    lines.push(`[${w.code}]${loc}: ${w.message}${detail}`);
  }
  lines.push("-->", "");
  return lines.join("\n");
}
