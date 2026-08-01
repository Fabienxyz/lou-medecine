import { createPackageAccess } from "../lib/package-access.js";
import { createOfflineManager } from "../lib/offline-manager.js";
import { createNodeOfflineRuntime } from "../lib/offline-runtime-node.js";

/**
 * @param {string} libraryRoot
 * @param {{
 *   packageAccess?: import("../lib/package-access.js").PackageAccess,
 *   runtime?: import("../../../demo/renderer/library/offline-runtime.js").OfflineRuntime,
 *   catalogMutate?: typeof import("../lib/library-catalog.js").mutateCatalogAtomic,
 * }} [overrides]
 */
export function createTestOfflineManager(libraryRoot, overrides = {}) {
  const packageAccess =
    overrides.packageAccess ?? createPackageAccess(libraryRoot);
  const runtime = overrides.runtime ?? createNodeOfflineRuntime(libraryRoot);
  return createOfflineManager({
    packageAccess,
    libraryRoot,
    runtime,
    catalogMutate: overrides.catalogMutate,
  });
}
