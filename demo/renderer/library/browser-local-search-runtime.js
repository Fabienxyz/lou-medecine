/**
 * Browser Local Search Runtime factory (D6-D).
 * Wires Package Access, IndexedDB cache, and Composition — no Reader UI.
 */
import { createBrowserPackageAccess } from "./browser-package-access.js";
import { createIndexedDbSearchCacheStorage } from "./local-search-cache.js";
import { createLocalSearchRuntime } from "./local-search-runtime.js";
import { compose } from "../composition/composition-engine.js";
import compositionSpec from "../composition/corpus-composition-v1.json" with { type: "json" };

/**
 * @param {{
 *   libraryBaseUrl: string,
 *   fetch?: typeof fetch,
 *   idbFactory?: IDBFactory,
 *   compositionSpec?: Record<string, unknown>,
 * }} [options]
 */
export function createBrowserLocalSearchRuntime(options = {}) {
    if (!options.libraryBaseUrl) {
        throw new Error("browser local search runtime: libraryBaseUrl is required");
    }
    const packageAccess = createBrowserPackageAccess({
        libraryBaseUrl: options.libraryBaseUrl,
        fetch: options.fetch,
    });
    const cacheStorage = createIndexedDbSearchCacheStorage(options.idbFactory);
    return createLocalSearchRuntime({
        packageAccess,
        cacheStorage,
        compose,
        compositionSpec: options.compositionSpec || compositionSpec,
        fetchFn: options.fetch,
    });
}

export default createBrowserLocalSearchRuntime;
