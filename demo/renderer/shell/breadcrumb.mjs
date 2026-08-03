/**
 * Shell V1 — breadcrumb (PAS-SHELL S2).
 * Navigation contextuelle ; aucune dépendance Renderer ni contenu pédagogique.
 */

export const BRAND_LABEL = "Lou Médecine";

/**
 * @param {string | undefined | null} chapterId e.g. "cardio/234"
 * @returns {string | null}
 */
export function extractItemNumber(chapterId) {
  if (typeof chapterId !== "string" || !chapterId.trim()) {
    return null;
  }
  const last = chapterId.trim().split("/").pop();
  if (last && /^\d+$/.test(last)) {
    return last;
  }
  return null;
}

/**
 * @param {string | undefined | null} title
 * @returns {string}
 */
export function extractChapterShortTitle(title) {
  if (typeof title !== "string" || !title.trim()) {
    return "";
  }
  const trimmed = title.trim();
  const sep = trimmed.indexOf(" — ");
  return sep >= 0 ? trimmed.slice(0, sep).trim() : trimmed;
}

/**
 * @param {{ chapter?: string, title?: string, chapterLine?: string }} manifest
 * @returns {string}
 */
export function deriveChapterSegmentLabel(manifest) {
  if (!manifest || typeof manifest !== "object") {
    return "…";
  }
  const itemNumber = extractItemNumber(manifest.chapter);
  const shortTitle = extractChapterShortTitle(manifest.title);
  if (itemNumber && shortTitle) {
    return "Item " + itemNumber + " — " + shortTitle;
  }
  if (typeof manifest.chapterLine === "string" && manifest.chapterLine.trim()) {
    return manifest.chapterLine.trim();
  }
  if (typeof manifest.title === "string" && manifest.title.trim()) {
    return manifest.title.trim();
  }
  if (typeof manifest.chapter === "string" && manifest.chapter.trim()) {
    return manifest.chapter.trim();
  }
  return "…";
}

/**
 * Segments Reader S2 — trois niveaux ; extensible S3 (library/specialty nav).
 *
 * @param {{ specialty?: string, chapter?: string, title?: string, chapterLine?: string }} manifest
 * @returns {Array<{ kind: string, label: string, navigable: boolean }>}
 */
export function buildReaderBreadcrumbSegments(manifest) {
  const specialty =
    manifest && typeof manifest.specialty === "string" && manifest.specialty.trim()
      ? manifest.specialty.trim()
      : "…";
  return [
    { kind: "brand", label: BRAND_LABEL, navigable: false },
    { kind: "specialty", label: specialty, navigable: false },
    {
      kind: "chapter",
      label: deriveChapterSegmentLabel(manifest),
      navigable: true,
    },
  ];
}

/**
 * @param {HTMLElement} container
 * @param {Array<{ kind: string, label: string, navigable: boolean }>} segments
 */
export function renderBreadcrumb(container, segments) {
  if (!container) {
    return;
  }
  const doc = container.ownerDocument || document;
  container.replaceChildren();
  container.classList.add("shell-breadcrumb");
  container.setAttribute("aria-label", "Fil d'Ariane");

  const list = doc.createElement("ol");
  list.className = "shell-breadcrumb-list";

  segments.forEach(function (segment, index) {
    const item = doc.createElement("li");
    item.className = "shell-breadcrumb-item";
    item.dataset.segment = segment.kind;

    if (segment.navigable) {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "shell-breadcrumb-link";
      button.textContent = segment.label;
      item.appendChild(button);
    } else {
      const span = doc.createElement("span");
      span.className =
        index === segments.length - 1
          ? "shell-breadcrumb-current"
          : "shell-breadcrumb-text";
      span.textContent = segment.label;
      item.appendChild(span);
    }

    list.appendChild(item);
  });

  container.appendChild(list);
}

/**
 * @param {HTMLElement} container
 * @param {(segmentKind: string) => void | Promise<void>} handler
 */
export function bindBreadcrumbSegmentClicks(container, handler) {
  if (!container || typeof handler !== "function") {
    return;
  }
  container.addEventListener("click", function (event) {
    const button = event.target.closest(".shell-breadcrumb-link");
    if (!button || !container.contains(button)) {
      return;
    }
    const item = button.closest(".shell-breadcrumb-item");
    const kind = item && item.dataset ? item.dataset.segment : null;
    if (kind) {
      handler(kind);
    }
  });
}
