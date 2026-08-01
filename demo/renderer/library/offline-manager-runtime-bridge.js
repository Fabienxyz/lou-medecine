/**
 * Bridge between Offline Manager orchestration and Offline Runtime (D2-E).
 * Accepts an explicit resource list — no library.json reads, no offline_ready writes.
 */

/**
 * Build runtime resources from declared paths and a URL resolver.
 * @param {string} releaseId
 * @param {string[]} declaredPaths
 * @param {(releaseId: string, relativePath: string) => string | Promise<string>} resolveResourceUrl
 * @returns {Promise<Array<{ relativePath: string, url: string }>>}
 */
export async function buildRuntimeResourceList(
  releaseId,
  declaredPaths,
  resolveResourceUrl
) {
  /** @type {Array<{ relativePath: string, url: string }>} */
  const resources = [];
  for (const relativePath of declaredPaths) {
    const url = await resolveResourceUrl(releaseId, relativePath);
    resources.push({ relativePath, url });
  }
  if (!resources.some((r) => r.relativePath === "manifest.json")) {
    const manifestUrl = await resolveResourceUrl(releaseId, "manifest.json");
    resources.unshift({ relativePath: "manifest.json", url: manifestUrl });
  }
  return resources;
}

/**
 * @param {import("./offline-runtime.js").OfflineRuntime} runtime
 * @param {{
 *   releaseId: string,
 *   contentDigest: string,
 *   declaredPaths: string[],
 *   resolveResourceUrl: (releaseId: string, relativePath: string) => string | Promise<string>,
 * }} args
 */
export async function prepareReleaseViaRuntime(runtime, args) {
  const resources = await buildRuntimeResourceList(
    args.releaseId,
    args.declaredPaths,
    args.resolveResourceUrl
  );
  return runtime.prepareRelease({
    releaseId: args.releaseId,
    contentDigest: args.contentDigest,
    resources,
  });
}
