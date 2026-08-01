/**
 * Browser library catalog persistence (D2-G).
 * library.json remains the sole SSOT — writes go to the library origin via PUT.
 */

/**
 * @param {string} libraryBaseUrl
 * @param {typeof fetch} [fetchFn]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function loadCatalogFromLibrary(libraryBaseUrl, fetchFn = fetch) {
  const url = `${libraryBaseUrl.replace(/\/+$/, "")}/library.json`;
  let response;
  try {
    response = await fetchFn(url, { cache: "no-store" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`library catalog: failed to load: ${message}`);
  }
  if (!response.ok) {
    throw new Error(
      `library catalog: unavailable (${response.status})`
    );
  }
  return /** @type {Record<string, unknown>} */ (await response.json());
}

/**
 * @param {string} libraryBaseUrl
 * @param {Record<string, unknown>} catalog
 * @param {typeof fetch} [fetchFn]
 */
export async function saveCatalogToLibrary(
  libraryBaseUrl,
  catalog,
  fetchFn = fetch
) {
  const url = `${libraryBaseUrl.replace(/\/+$/, "")}/library.json`;
  catalog.updated_at = new Date().toISOString();
  const body = JSON.stringify(catalog, null, 2) + "\n";
  let response;
  try {
    response = await fetchFn(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`library catalog: failed to save: ${message}`);
  }
  if (!response.ok) {
    throw new Error(
      `library catalog: save rejected (${response.status})`
    );
  }
}

/**
 * @param {string} libraryBaseUrl
 * @param {(catalog: Record<string, unknown>) => void | Promise<void>} mutator
 * @param {typeof fetch} [fetchFn]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function mutateCatalogInLibrary(
  libraryBaseUrl,
  mutator,
  fetchFn = fetch
) {
  const catalog = await loadCatalogFromLibrary(libraryBaseUrl, fetchFn);
  await mutator(catalog);
  await saveCatalogToLibrary(libraryBaseUrl, catalog, fetchFn);
  return catalog;
}
