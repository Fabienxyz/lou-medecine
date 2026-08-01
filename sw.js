/** Minimal offline layer — Reader Acceptance V1 (PDR-D2). No Renderer logic. */
const SHELL_CACHE = "lou-reader-shell-v1";
const RUNTIME_CACHE = "lou-reader-runtime-v1";
const PACKAGE_PREFIX = "/01-learning/chapters/";
const SHELL_PREFIX = "/demo/renderer/";

const SHELL_URLS = [
  "/demo/renderer/index.html",
  "/demo/renderer/styles.css",
  "/demo/renderer/config.js",
  "/demo/renderer/markdown.js",
  "/demo/renderer/learner-store.js",
  "/demo/renderer/text-highlights.js",
  "/demo/renderer/caret-anchor.js",
  "/demo/renderer/inline-notes.js",
  "/demo/renderer/svg-loader.js",
  "/demo/renderer/inline-formatting.js",
  "/demo/renderer/blocks.js",
  "/demo/renderer/renderer.js",
  "/demo/renderer/app.js",
  "/demo/renderer/lib/marked.min.js",
  "/demo/renderer/lib/fonts/inter-latin.woff2",
  "/demo/renderer/composition/bootstrap.mjs",
  "/demo/renderer/composition/corpus-composition-v1.json",
  "/demo/renderer/composition/composition-engine.js",
  "/demo/renderer/composition/reading-view-model.js",
  "/demo/renderer/composition/navigation.js",
  "/demo/renderer/composition/composition-spec-schema.js",
];

function cacheFirst(request) {
  return caches.match(request, { ignoreSearch: true }).then(function (cached) {
    if (cached) {
      return cached;
    }
    return fetch(request)
      .then(function (response) {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(function (cache) {
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
    caches
      .open(SHELL_CACHE)
      .then(function (cache) {
        return cache.addAll(SHELL_URLS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      caches.keys().then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== SHELL_CACHE && key !== RUNTIME_CACHE;
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

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match("/demo/renderer/index.html", { ignoreSearch: true });
      })
    );
    return;
  }

  if (url.pathname.startsWith(SHELL_PREFIX)) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
        return cached || fetch(event.request);
      })
    );
    return;
  }

  if (url.pathname.startsWith(PACKAGE_PREFIX)) {
    event.respondWith(cacheFirst(event.request));
  }
});
