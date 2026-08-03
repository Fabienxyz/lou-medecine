/** PAS-OFFLINE AAI helpers — persistent cache / shell convergence scenarios. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { RELEASE_ID_234 } from "./fixtures.mjs";

export const SHELL_CACHE_NAME = "lou-reader-shell-v1";
export const STALE_SHELL_MARKER = "LOU-AAI-STALE-SHELL-MARKER";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.."
);

/** @param {string} pathname */
function offlineCacheRequest(pathname) {
  return new Request(
    `https://lou-offline.local/${encodeURIComponent(pathname)}`
  );
}

/**
 * Seed shell cache with HTML missing current chrome (simulates pre-update profile).
 * @param {import('@playwright/test').Page} page
 */
export async function seedStaleShellCache(page) {
  await page.evaluate(
    async ({ cacheName, marker }) => {
      const cache = await caches.open(cacheName);
      const staleHtml = `<!DOCTYPE html><html><head><title>Stale</title></head><body><p>${marker}</p></body></html>`;
      const req = new Request(
        `https://lou-offline.local/${encodeURIComponent("/demo/renderer/index.html")}`
      );
      await cache.put(
        req,
        new Response(staleHtml, {
          status: 200,
          headers: { "content-type": "text/html" },
        })
      );
    },
    { cacheName: SHELL_CACHE_NAME, marker: STALE_SHELL_MARKER }
  );
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} releaseId
 * @param {string} fakeDigest
 */
export async function corruptRuntimeDigest(page, releaseId, fakeDigest) {
  await page.evaluate(
    async ({ releaseId, fakeDigest }) => {
      const namespace = `lou-offline-${releaseId}-v1`;
      const cache = await caches.open(namespace);
      const metaKey = "__lou-offline-meta.json";
      const req = new Request(
        `https://lou-offline.local/${encodeURIComponent(metaKey)}`
      );
      const existing = await cache.match(req);
      if (!existing) {
        throw new Error("runtime metadata missing — certify release first");
      }
      const meta = await existing.json();
      meta.content_digest = fakeDigest;
      await cache.put(
        req,
        new Response(JSON.stringify(meta), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    },
    { releaseId, fakeDigest }
  );
}

/** @param {import('@playwright/test').Page} page */
export async function purgeReleaseNamespaces(page) {
  await page.evaluate(async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("lou-offline-") && !key.endsWith("-staging") && !key.endsWith("-backup"))
        .map((key) => caches.delete(key))
    );
  });
}

/** @param {string} repoRoot @param {string} catalogPath */
export function assertProductFixtureRestored(repoRoot, catalogPath) {
  const rel = path.relative(repoRoot, catalogPath);
  const diff = execFileSync("git", ["diff", "--name-only", "--", rel], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  if (diff) {
    throw new Error(`product fixture not restored: ${rel} still differs from HEAD`);
  }
}

/**
 * @param {import('@playwright/test').Playwright} playwright
 * @param {string} baseURL
 * @param {(context: import('@playwright/test').BrowserContext, page: import('@playwright/test').Page) => Promise<void>} fn
 */
export async function withPersistentBrowser(playwright, baseURL, fn) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-pas-offline-"));
  const context = await playwright.chromium.launchPersistentContext(userDataDir, {
    baseURL,
    headless: true,
    serviceWorkers: "allow",
    viewport: { width: 1280, height: 900 },
  });
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await fn(context, page);
  } finally {
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

export { REPO_ROOT, RELEASE_ID_234 };
