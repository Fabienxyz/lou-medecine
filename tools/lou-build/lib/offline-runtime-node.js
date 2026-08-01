/**
 * Node filesystem storage adapter for Offline Runtime (D2-F).
 * Materializes release namespaces under LIBRARY_ROOT/.offline-runtime/.
 * No library.json access — preparation storage only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createOfflineRuntime } from "../../../demo/renderer/library/offline-runtime.js";

const RUNTIME_DIR = ".offline-runtime";
const NAMESPACES_DIR = "namespaces";

/**
 * @param {string} libraryRoot
 * @returns {import("../../../demo/renderer/library/offline-runtime.js").OfflineRuntimeStorage}
 */
export function createFilesystemRuntimeStorage(libraryRoot) {
  const namespacesRoot = path.join(
    path.resolve(libraryRoot),
    RUNTIME_DIR,
    NAMESPACES_DIR
  );

  return {
    has(name) {
      return Promise.resolve(
        fs.existsSync(path.join(namespacesRoot, name)) &&
          fs.statSync(path.join(namespacesRoot, name)).isDirectory()
      );
    },
    async open(name) {
      const dir = path.join(namespacesRoot, name);
      fs.mkdirSync(dir, { recursive: true });
      return createFilesystemCache(dir);
    },
    async keys() {
      if (!fs.existsSync(namespacesRoot)) {
        return [];
      }
      return fs
        .readdirSync(namespacesRoot)
        .filter((name) =>
          fs.statSync(path.join(namespacesRoot, name)).isDirectory()
        );
    },
    async delete(name) {
      const dir = path.join(namespacesRoot, name);
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        return true;
      }
      return false;
    },
  };
}

/**
 * @param {string} dir
 * @returns {import("../../../demo/renderer/library/offline-runtime.js").OfflineRuntimeCache}
 */
function createFilesystemCache(dir) {
  return {
    async get(key) {
      const filePath = cacheEntryPath(dir, key);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const body = new Uint8Array(fs.readFileSync(filePath));
      const meta = readEntryMeta(filePath);
      return {
        body,
        contentType: meta.contentType,
        status: meta.status ?? 200,
      };
    },
    async put(key, resource) {
      const filePath = cacheEntryPath(dir, key);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(resource.body));
      writeEntryMeta(filePath, {
        contentType: resource.contentType,
        status: resource.status ?? 200,
      });
    },
    async keys() {
      if (!fs.existsSync(dir)) {
        return [];
      }
      /** @type {string[]} */
      const keys = [];
      walkCacheFiles(dir, dir, keys);
      return keys.sort();
    },
  };
}

/**
 * @param {string} root
 * @param {string} dir
 * @param {string[]} keys
 */
function walkCacheFiles(root, dir, keys) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) {
      walkCacheFiles(root, abs, keys);
      continue;
    }
    if (name.endsWith(".meta.json")) {
      continue;
    }
    keys.push(relativeCacheKey(root, abs));
  }
}

/**
 * @param {string} root
 * @param {string} absPath
 */
function relativeCacheKey(root, absPath) {
  return path.relative(root, absPath).replace(/\\/g, "/");
}

/**
 * @param {string} dir
 * @param {string} key
 */
function cacheEntryPath(dir, key) {
  const segments = key.split("/").map((segment) => encodeURIComponent(segment));
  return path.join(dir, ...segments);
}

/**
 * @param {string} filePath
 */
function readEntryMeta(filePath) {
  const metaPath = `${filePath}.meta.json`;
  if (!fs.existsSync(metaPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch {
    return {};
  }
}

/**
 * @param {string} filePath
 * @param {{ contentType?: string, status?: number }} meta
 */
function writeEntryMeta(filePath, meta) {
  fs.writeFileSync(`${filePath}.meta.json`, JSON.stringify(meta));
}

/**
 * @param {string} libraryRoot
 * @param {{ fetch?: typeof fetch }} [options]
 */
export function createNodeOfflineRuntime(libraryRoot, options = {}) {
  return createOfflineRuntime({
    storage: createFilesystemRuntimeStorage(libraryRoot),
    fetch: options.fetch ?? createNodePackageFetch(),
    libraryBasePath: "/library",
    allowDevPackageWarmCache: false,
  });
}

/**
 * @returns {typeof fetch}
 */
export function createNodePackageFetch() {
  return async (input) => {
    const href = typeof input === "string" ? input : input.url;
    const filePath = fileURLToPath(href);
    const data = fs.readFileSync(filePath);
    const contentType = guessContentType(filePath);
    return new Response(data, {
      status: 200,
      headers: contentType ? { "content-type": contentType } : undefined,
    });
  };
}

/**
 * @param {string} filePath
 */
function guessContentType(filePath) {
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".md")) return "text/markdown";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".woff2")) return "font/woff2";
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
    return "text/javascript";
  }
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".html")) return "text/html";
  return "application/octet-stream";
}

/**
 * @param {string} libraryRoot
 */
export function offlineRuntimeRoot(libraryRoot) {
  return path.join(path.resolve(libraryRoot), RUNTIME_DIR);
}
