/**
 * Deterministic, filesystem-safe slug generation from document text.
 *
 * No specialty-, College-, or vocabulary-specific rules — only Unicode
 * normalization and generic character filtering.
 */

/**
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  const raw = String(text || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

  let slug = raw
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug;
}

/**
 * Build a chapter filename from heading-derived fields only.
 *
 * @param {{ itemNumber: string | null, titleForSlug: string }} fields
 * @returns {string} filename ending in .md
 */
export function chapterFilename({ itemNumber, titleForSlug }) {
  const slug = slugify(titleForSlug);
  if (!slug) {
    throw new Error("Cannot derive filesystem-safe filename: empty slug");
  }
  if (itemNumber != null && String(itemNumber).length > 0) {
    return `item-${String(itemNumber)}-${slug}.md`;
  }
  return `${slug}.md`;
}
