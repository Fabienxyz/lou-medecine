/**
 * Service Worker — release-scoped Offline Runtime (D2-E).
 * Shell precache + library release routing. No Renderer logic.
 */
import {
  DEV_WARM_CACHE_NAME,
  SHELL_CACHE_NAME,
  SHELL_NETWORK_BYPASS_HEADER,
} from "./demo/renderer/library/offline-runtime-shared.js";
import {
  createOfflineRuntime,
  createBrowserCacheStorage,
} from "./demo/renderer/library/offline-runtime.js";

const runtime = createOfflineRuntime({
  storage: createBrowserCacheStorage(),
  libraryBasePath: "/library",
  allowDevPackageWarmCache: false,
});

function cacheFirstDev(request) {
  return caches.match(request, { ignoreSearch: true }).then(function (cached) {
    if (cached) {
      return cached;
    }
    return fetch(request)
      .then(function (response) {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(DEV_WARM_CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      })
      .catch(function () {
        return new Response("", { status: 503, statusText: "Offline" });
      });
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    runtime.prepareShell().then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      runtime.prepareShell().catch(function (err) {
        console.warn("[LouSW] shell refresh on activate failed", err);
      }),
      caches.keys().then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              if (key.startsWith("lou-offline-")) {
                return key.endsWith("-staging") || key.endsWith("-backup");
              }
              if (key === SHELL_CACHE_NAME || key === DEV_WARM_CACHE_NAME) {
                return false;
              }
              return true;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      }),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.headers.get(SHELL_NETWORK_BYPASS_HEADER) === "1") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    runtime.resolveOrServe(event.request).then(function (response) {
      if (response) {
        return response;
      }
      if (url.pathname.startsWith("/01-learning/chapters/")) {
        return cacheFirstDev(event.request);
      }
      return fetch(event.request);
    })
  );
});
