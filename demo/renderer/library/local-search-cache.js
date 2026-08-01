/**
 * Local Search index cache storage (D6-D).
 * Derived, non-patrimonial — separate from lou-learner IndexedDB.
 */

export const SEARCH_CACHE_DB_NAME = "lou-local-search-v1";
export const SEARCH_CACHE_STORE_NAME = "index_cache";
export const SEARCH_CACHE_DB_VERSION = 1;

/**
 * @typedef {Object} SearchIndexCacheRecord
 * @property {string} release_id
 * @property {string} content_digest
 * @property {number} index_schema_version
 * @property {string} compositionSpecVersion
 * @property {unknown[]} viewBindings
 * @property {Record<string, unknown>} index
 * @property {string} [cached_at]
 */

/**
 * @typedef {Object} SearchCacheStorage
 * @property {(releaseId: string) => Promise<SearchIndexCacheRecord | null>} get
 * @property {(record: SearchIndexCacheRecord) => Promise<void>} put
 * @property {(releaseId: string) => Promise<boolean>} delete
 * @property {() => Promise<void>} clear
 */

/**
 * In-memory cache storage for tests.
 * @returns {SearchCacheStorage}
 */
export function createMemorySearchCacheStorage() {
    /** @type {Map<string, SearchIndexCacheRecord>} */
    const store = new Map();

    return {
        async get(releaseId) {
            const record = store.get(releaseId);
            return record ? structuredClone(record) : null;
        },
        async put(record) {
            store.set(record.release_id, structuredClone(record));
        },
        async delete(releaseId) {
            return store.delete(releaseId);
        },
        async clear() {
            store.clear();
        },
    };
}

/**
 * IndexedDB cache storage for browser runtime.
 * @param {IDBFactory} [idbFactory]
 * @returns {SearchCacheStorage}
 */
export function createIndexedDbSearchCacheStorage(idbFactory) {
    const idb = idbFactory || globalThis.indexedDB;
    if (!idb) {
        throw new Error("local search cache: IndexedDB unavailable");
    }

    /** @type {Promise<IDBDatabase> | null} */
    let dbPromise = null;

    function openDb() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const request = idb.open(SEARCH_CACHE_DB_NAME, SEARCH_CACHE_DB_VERSION);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(SEARCH_CACHE_STORE_NAME)) {
                        db.createObjectStore(SEARCH_CACHE_STORE_NAME, { keyPath: "release_id" });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        return dbPromise;
    }

    return {
        async get(releaseId) {
            const db = await openDb();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(SEARCH_CACHE_STORE_NAME, "readonly");
                const store = tx.objectStore(SEARCH_CACHE_STORE_NAME);
                const req = store.get(releaseId);
                req.onsuccess = () => resolve(req.result ? structuredClone(req.result) : null);
                req.onerror = () => reject(req.error);
            });
        },
        async put(record) {
            const db = await openDb();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(SEARCH_CACHE_STORE_NAME, "readwrite");
                const store = tx.objectStore(SEARCH_CACHE_STORE_NAME);
                const req = store.put(structuredClone(record));
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        },
        async delete(releaseId) {
            const db = await openDb();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(SEARCH_CACHE_STORE_NAME, "readwrite");
                const store = tx.objectStore(SEARCH_CACHE_STORE_NAME);
                const req = store.delete(releaseId);
                req.onsuccess = () => resolve(req.result === undefined ? true : Boolean(req.result));
                req.onerror = () => reject(req.error);
            });
        },
        async clear() {
            const db = await openDb();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(SEARCH_CACHE_STORE_NAME, "readwrite");
                const store = tx.objectStore(SEARCH_CACHE_STORE_NAME);
                const req = store.clear();
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        },
    };
}

/**
 * @param {unknown} record
 * @returns {record is SearchIndexCacheRecord}
 */
export function isValidCacheRecordShape(record) {
    if (!record || typeof record !== "object") {
        return false;
    }
    const r = /** @type {Record<string, unknown>} */ (record);
    return (
        typeof r.release_id === "string" &&
        typeof r.content_digest === "string" &&
        typeof r.index_schema_version === "number" &&
        Array.isArray(r.viewBindings) &&
        r.index !== null &&
        typeof r.index === "object"
    );
}
