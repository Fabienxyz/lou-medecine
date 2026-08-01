#!/usr/bin/env node
/**
 * Dev/test HTTP server — repo static files + installed library at /library (D2-G).
 * Supports PUT /library/library.json for browser offline certification.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installPublishedRelease } from "../../../tools/lou-build/lib/library-install.js";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const LIBRARY_ROOT = path.join(
  REPO_ROOT,
  "demo/renderer/test/fixtures/product-library"
);
const CHAPTER_234 = path.join(REPO_ROOT, "01-learning/chapters/cardio/234");
const PORT = Number(process.env.LOU_LIBRARY_SERVER_PORT || 8765);

function ensureProductLibrary() {
  if (!fs.existsSync(path.join(CHAPTER_234, "manifest.json"))) {
    console.warn("[library-server] chapter 234 manifest missing — skip install");
    return;
  }
  if (!fs.existsSync(path.join(LIBRARY_ROOT, "library.json"))) {
    fs.mkdirSync(LIBRARY_ROOT, { recursive: true });
    installPublishedRelease(CHAPTER_234, LIBRARY_ROOT);
    console.log("[library-server] installed chapter 234 into product library");
  }
}

/**
 * @param {string} urlPath
 * @returns {string | null}
 */
function mapLibraryPath(urlPath) {
  if (urlPath === "/library/library.json") {
    return path.join(LIBRARY_ROOT, "library.json");
  }
  const prefix = "/library/releases/";
  if (!urlPath.startsWith(prefix)) {
    return null;
  }
  const rest = urlPath.slice(prefix.length);
  const slash = rest.indexOf("/");
  if (slash === -1) {
    return null;
  }
  const releaseId = decodeURIComponent(rest.slice(0, slash));
  const relPath = decodeURIComponent(rest.slice(slash + 1));
  if (relPath.includes("..")) {
    return null;
  }
  return path.join(LIBRARY_ROOT, "packages", releaseId, relPath);
}

/**
 * @param {string} filePath
 */
function contentTypeFor(filePath) {
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".mjs") || filePath.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  return "application/octet-stream";
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * @param {import("node:http").ServerResponse} res
 * @param {number} status
 * @param {string | Buffer} body
 * @param {string} [type]
 */
function send(res, status, body, type) {
  res.writeHead(status, type ? { "Content-Type": type } : {});
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/library/library.json" && req.method === "PUT") {
    try {
      const body = await readBody(req);
      JSON.parse(body.toString("utf8"));
      const target = path.join(LIBRARY_ROOT, "library.json");
      const tmp = target + ".tmp";
      fs.writeFileSync(tmp, body);
      fs.renameSync(tmp, target);
      send(res, 204, "");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      send(res, 400, message, "text/plain");
    }
    return;
  }

  const libraryFile = mapLibraryPath(pathname);
  if (libraryFile && req.method === "GET") {
    if (!fs.existsSync(libraryFile) || !fs.statSync(libraryFile).isFile()) {
      send(res, 404, "Not found");
      return;
    }
    if (req.headers["x-http-method-override"] === "HEAD") {
      send(res, 200, "");
      return;
    }
    const body = fs.readFileSync(libraryFile);
    send(res, 200, body, contentTypeFor(libraryFile));
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method not allowed");
    return;
  }

  let staticPath = path.join(REPO_ROOT, pathname);
  if (pathname.endsWith("/")) {
    staticPath = path.join(staticPath, "index.html");
  }
  if (!staticPath.startsWith(REPO_ROOT)) {
    send(res, 403, "Forbidden");
    return;
  }
  if (!fs.existsSync(staticPath) || !fs.statSync(staticPath).isFile()) {
    send(res, 404, "Not found");
    return;
  }
  if (req.method === "HEAD") {
    send(res, 200, "");
    return;
  }
  const body = fs.readFileSync(staticPath);
  send(res, 200, body, contentTypeFor(staticPath));
});

ensureProductLibrary();
server.listen(PORT, "127.0.0.1", () => {
  console.log(`[library-server] http://127.0.0.1:${PORT}/`);
});
