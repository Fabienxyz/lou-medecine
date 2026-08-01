/**
 * Offline Runtime (D2-E) — release-scoped local availability for Browser Package Access.
 * Read-only serving layer — never writes library.json or certifies offline_ready.
 */
import {
  OfflineRuntimeError,
  SHELL_CACHE_NAME,
  SHELL_URLS,
  DEV_WARM_CACHE_NAME,
  META_ENTRY_PATH,
  buildReleaseNamespace,
  buildReleaseStagingNamespace,
  buildReleaseMetadata,
  metadataMatches,
  normalizeReleaseResourcePath,
  parseReleaseScopedPath,
  validateResourceList,
  isMonorepoDevPath,
  isShellPath,
  toStorageQuotaError,
} from "./offline-runtime-shared.js";

/**
 * @typedef {object} OfflineRuntimeStorage
 * @property {(name: string) => Promise<boolean>} has
 * @property {(name: string) => Promise<OfflineRuntimeCache>} open
 * @property {() => Promise<string[]>} keys
 * @property {(name: string) => Promise<boolean>} delete
 */

/**
 * @typedef {object} OfflineRuntimeCache
 * @property {(key: string) => Promise<StoredResource | null>} get
 * @property {(key: string, resource: StoredResource) => Promise<void>} put
 * @property {() => Promise<string[]>} keys
 * @property {() => Promise<void>} [clear]
 */

/**
 * @typedef {{ body: Uint8Array | ArrayBuffer, contentType?: string, status?: number }} StoredResource
 */

/**
 * @param {CacheStorage} cacheStorage
 * @returns {OfflineRuntimeStorage}
 */
export function createBrowserCacheStorage(cacheStorage = globalThis.caches) {
  if (!cacheStorage) {
    throw new OfflineRuntimeError(
      "RUNTIME_UNAVAILABLE",
      "offline runtime: CacheStorage is unavailable"
    );
  }

  return {
    has(name) {
      return cacheStorage.has(name);
    },
    async open(name) {
      const cache = await cacheStorage.open(name);
      return createBrowserCacheAdapter(cache);
    },
    keys() {
      return cacheStorage.keys();
    },
    delete(name) {
      return cacheStorage.delete(name);
    },
  };
}

/**
 * @param {Cache} cache
 * @returns {OfflineRuntimeCache}
 */
function createBrowserCacheAdapter(cache) {
  return {
    async get(key) {
      const response = await cache.match(makeCacheRequest(key));
      if (!response) {
        return null;
      }
      const body = new Uint8Array(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || undefined;
      return { body, contentType, status: response.status };
    },
    async put(key, resource) {
      const headers = new Headers();
      if (resource.contentType) {
        headers.set("content-type", resource.contentType);
      }
      const response = new Response(resource.body, {
        status: resource.status ?? 200,
        headers,
      });
      await cache.put(makeCacheRequest(key), response);
    },
    async keys() {
      const requests = await cache.keys();
      return requests.map((req) => cacheKeyFromRequest(req));
    },
  };
}

/**
 * @param {string} key
 */
function makeCacheRequest(key) {
  return new Request(`https://lou-offline.local/${encodeURIComponent(key)}`);
}

/**
 * @param {Request} request
 */
function cacheKeyFromRequest(request) {
  const url = new URL(request.url);
  const encoded = url.pathname.replace(/^\//, "");
  return decodeURIComponent(encoded);
}

/**
 * @param {{
 *   storage: OfflineRuntimeStorage,
 *   fetch?: typeof fetch,
 *   libraryBasePath?: string,
 *   shellUrls?: string[],
 *   allowDevPackageWarmCache?: boolean,
 * }} options
 */
export function createOfflineRuntime(options) {
  return new OfflineRuntime(options);
}

class OfflineRuntime {
  /**
   * @param {{
   *   storage: OfflineRuntimeStorage,
   *   fetch?: typeof fetch,
   *   libraryBasePath?: string,
   *   shellUrls?: string[],
   *   allowDevPackageWarmCache?: boolean,
   * }} options
   */
  constructor(options) {
    if (!options?.storage) {
      throw new OfflineRuntimeError(
        "RUNTIME_UNAVAILABLE",
        "offline runtime: storage is required"
      );
    }
    this._storage = options.storage;
    const fetchFn = options.fetch ?? globalThis.fetch;
    if (typeof fetchFn !== "function") {
      throw new OfflineRuntimeError(
        "RUNTIME_UNAVAILABLE",
        "offline runtime: fetch is required"
      );
    }
    this._fetch = fetchFn;
    this._libraryBasePath = options.libraryBasePath ?? "/library";
    this._shellUrls = options.shellUrls ?? SHELL_URLS;
    this._allowDevPackageWarmCache = options.allowDevPackageWarmCache ?? true;
    /** @type {Map<string, Promise<{ releaseId: string, contentDigest: string, resourceCount: number }>>} */
    this._inFlight = new Map();
  }

  /**
   * @returns {Promise<{ cached: number }>}
   */
  async prepareShell() {
    const cache = await this._storage.open(SHELL_CACHE_NAME);
    let cached = 0;
    for (const url of this._shellUrls) {
      const response = await this._fetch(url);
      if (!response.ok) {
        throw new OfflineRuntimeError(
          "RESOURCE_FETCH_FAILED",
          `offline runtime: shell asset fetch failed (${response.status}): ${url}`
        );
      }
      const body = new Uint8Array(await response.arrayBuffer());
      await cache.put(url, {
        body,
        contentType: response.headers.get("content-type") || guessContentType(url),
        status: response.status,
      });
      cached += 1;
    }
    return { cached };
  }

  /**
   * @param {{
   *   releaseId: string,
   *   contentDigest: string,
   *   resources: Array<{ relativePath: string, url: string }>,
   * }} args
   * @returns {Promise<{ releaseId: string, contentDigest: string, resourceCount: number }>}
   */
  async prepareRelease({ releaseId, contentDigest, resources }) {
    if (typeof contentDigest !== "string" || !contentDigest.trim()) {
      throw new OfflineRuntimeError(
        "INVALID_RESOURCE_LIST",
        "offline runtime: contentDigest is required"
      );
    }

    const normalizedResources = validateResourceList(resources);
    const existing = this._inFlight.get(releaseId);
    if (existing) {
      return existing;
    }

    const job = this._prepareReleaseInternal(
      releaseId,
      contentDigest,
      normalizedResources
    ).finally(() => {
      this._inFlight.delete(releaseId);
    });
    this._inFlight.set(releaseId, job);
    return job;
  }

  /**
   * @param {string} releaseId
   * @param {string} contentDigest
   */
  async hasRelease(releaseId, contentDigest) {
    const namespace = buildReleaseNamespace(releaseId);
    if (!(await this._storage.has(namespace))) {
      return false;
    }
    const cache = await this._storage.open(namespace);
    const meta = await this.readReleaseMetadata(cache);
    if (!metadataMatches(meta, releaseId, contentDigest)) {
      return false;
    }
    for (const relativePath of meta.resources) {
      const stored = await cache.get(relativePath);
      if (!stored) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {string} releaseId
   */
  async removeRelease(releaseId) {
    const namespace = buildReleaseNamespace(releaseId);
    const staging = buildReleaseStagingNamespace(releaseId);
    await this._storage.delete(staging);
    return this._storage.delete(namespace);
  }

  /**
   * Serve a prepared resource or shell asset. Returns null when unhandled.
   * @param {Request | string} request
   * @returns {Promise<Response | null>}
   */
  async resolveOrServe(request) {
    const req = typeof request === "string" ? new Request(request) : request;
    if (req.method !== "GET") {
      return null;
    }

    const url = new URL(req.url);
    const base = this._libraryBasePath.replace(/\/+$/, "");
    const releasePrefix = `${base}/releases/`;

    if (url.pathname.startsWith(releasePrefix)) {
      const releaseScoped = parseReleaseScopedPath(
        url.pathname,
        this._libraryBasePath
      );
      if (!releaseScoped) {
        return errorResponse(
          new OfflineRuntimeError(
            "FORBIDDEN_PATH",
            `offline runtime: forbidden release-scoped path ${url.pathname}`
          )
        );
      }
      return this._serveReleaseResource(
        releaseScoped.releaseId,
        releaseScoped.relativePath
      );
    }

    if (isShellPath(url.pathname)) {
      return this._serveShellAsset(url.pathname);
    }

    if (this._allowDevPackageWarmCache && isMonorepoDevPath(url.pathname)) {
      return this._serveDevWarmCache(req);
    }

    if (req.mode === "navigate") {
      return this._serveShellAsset("/demo/renderer/index.html");
    }

    return null;
  }

  /**
   * @param {OfflineRuntimeCache} cache
   */
  async readReleaseMetadata(cache) {
    const stored = await cache.get(META_ENTRY_PATH);
    if (!stored) {
      return null;
    }
    try {
      const text = new TextDecoder().decode(stored.body);
      return JSON.parse(text);
    } catch (err) {
      throw new OfflineRuntimeError(
        "PREPARATION_INCOMPLETE",
        "offline runtime: release metadata unreadable",
        { cause: err }
      );
    }
  }

  /**
   * @param {string} releaseId
   * @param {string} contentDigest
   * @param {Array<{ relativePath: string, url: string }>} resources
   */
  async _prepareReleaseInternal(releaseId, contentDigest, resources) {
    const finalNamespace = buildReleaseNamespace(releaseId);
    const stagingNamespace = buildReleaseStagingNamespace(releaseId);

    const existingMeta = await this._readNamespaceMetadata(finalNamespace);
    if (existingMeta) {
      if (existingMeta.content_digest !== contentDigest) {
        throw new OfflineRuntimeError(
          "DIGEST_MISMATCH",
          `offline runtime: digest mismatch for ${releaseId} ` +
            `(stored=${existingMeta.content_digest}, requested=${contentDigest})`
        );
      }
      if (await this.hasRelease(releaseId, contentDigest)) {
        return {
          releaseId,
          contentDigest,
          resourceCount: resources.length,
        };
      }
    }

    await this._storage.delete(stagingNamespace);
    const staging = await this._storage.open(stagingNamespace);

    try {
      for (const resource of resources) {
        let response;
        try {
          response = await this._fetch(resource.url);
        } catch (err) {
          throw new OfflineRuntimeError(
            "RESOURCE_FETCH_FAILED",
            `offline runtime: fetch failed for ${resource.relativePath}`,
            { cause: err }
          );
        }

        if (!response.ok) {
          throw new OfflineRuntimeError(
            "RESOURCE_FETCH_FAILED",
            `offline runtime: fetch failed (${response.status}) for ${resource.relativePath}`
          );
        }

        const body = new Uint8Array(await response.arrayBuffer());
        await staging.put(resource.relativePath, {
          body,
          contentType:
            response.headers.get("content-type") ||
            guessContentType(resource.relativePath),
          status: response.status,
        });
      }

      const metadata = buildReleaseMetadata(
        releaseId,
        contentDigest,
        resources
      );
      await staging.put(META_ENTRY_PATH, {
        body: new TextEncoder().encode(JSON.stringify(metadata)),
        contentType: "application/json",
      });

      await this._publishStagingNamespace(stagingNamespace, finalNamespace);
      return {
        releaseId,
        contentDigest,
        resourceCount: resources.length,
      };
    } catch (err) {
      await this._storage.delete(stagingNamespace);
      if (err instanceof OfflineRuntimeError) {
        throw err;
      }
      throw toStorageQuotaError(err);
    }
  }

  /**
   * @param {string} stagingNamespace
   * @param {string} finalNamespace
   */
  async _publishStagingNamespace(stagingNamespace, finalNamespace) {
    const staging = await this._storage.open(stagingNamespace);
    const keys = await staging.keys();

    await this._storage.delete(finalNamespace);
    const finalCache = await this._storage.open(finalNamespace);

    for (const key of keys) {
      const stored = await staging.get(key);
      if (!stored) {
        throw new OfflineRuntimeError(
          "PREPARATION_INCOMPLETE",
          `offline runtime: staging entry missing during publish: ${key}`
        );
      }
      await finalCache.put(key, stored);
    }

    await this._storage.delete(stagingNamespace);
  }

  /**
   * @param {string} namespace
   */
  async _readNamespaceMetadata(namespace) {
    try {
      if (!(await this._storage.has(namespace))) {
        return null;
      }
      const cache = await this._storage.open(namespace);
      return this.readReleaseMetadata(cache);
    } catch {
      return null;
    }
  }

  /**
   * @param {string} releaseId
   * @param {string} relativePath
   */
  async _serveReleaseResource(releaseId, relativePath) {
    let normalized;
    try {
      normalized = normalizeReleaseResourcePath(relativePath);
    } catch (err) {
      return errorResponse(err);
    }

    const namespace = buildReleaseNamespace(releaseId);
    if (!(await this._storage.has(namespace))) {
      return errorResponse(
        new OfflineRuntimeError(
          "PREPARATION_INCOMPLETE",
          `offline runtime: release not prepared: ${releaseId}`
        )
      );
    }
    let cache;
    try {
      cache = await this._storage.open(namespace);
    } catch (err) {
      return errorResponse(
        new OfflineRuntimeError(
          "UNKNOWN_RELEASE_NAMESPACE",
          `offline runtime: namespace unavailable for ${releaseId}`,
          { cause: err }
        )
      );
    }

    const meta = await this.readReleaseMetadata(cache);
    if (!meta || meta.release_id !== releaseId) {
      return errorResponse(
        new OfflineRuntimeError(
          "PREPARATION_INCOMPLETE",
          `offline runtime: release not prepared: ${releaseId}`
        )
      );
    }

    const stored = await cache.get(normalized);
    if (!stored) {
      return errorResponse(
        new OfflineRuntimeError(
          "RESOURCE_MISSING",
          `offline runtime: resource not available offline: ${normalized}`
        )
      );
    }

    return storedToResponse(stored);
  }

  /**
   * @param {string} pathname
   */
  async _serveShellAsset(pathname) {
    const cache = await this._storage.open(SHELL_CACHE_NAME);
    const stored = await cache.get(pathname);
    if (stored) {
      return storedToResponse(stored);
    }
    return null;
  }

  /**
   * @param {Request} request
   */
  async _serveDevWarmCache(request) {
    const cache = await this._storage.open(DEV_WARM_CACHE_NAME);
    const stored = await cache.get(request.url);
    if (stored) {
      return storedToResponse(stored);
    }
    return null;
  }
}

/**
 * @param {StoredResource} stored
 */
function storedToResponse(stored) {
  const headers = new Headers();
  if (stored.contentType) {
    headers.set("content-type", stored.contentType);
  }
  return new Response(stored.body, {
    status: stored.status ?? 200,
    headers,
  });
}

/**
 * @param {unknown} err
 */
function errorResponse(err) {
  const runtimeErr =
    err instanceof OfflineRuntimeError
      ? err
      : new OfflineRuntimeError("RUNTIME_UNAVAILABLE", String(err), {
          cause: err,
        });
  return new Response(runtimeErr.message, {
    status: runtimeErr.code === "FORBIDDEN_PATH" ? 403 : 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-lou-offline-error": runtimeErr.code,
    },
  });
}

/**
 * @param {string} path
 */
function guessContentType(path) {
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "text/javascript";
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".woff2")) return "font/woff2";
  if (path.endsWith(".md")) return "text/markdown";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}
