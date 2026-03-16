const CACHE_NAME = "spendtrack-v4";

// App-shell URLs to precache on install
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/analytics",
  "/settings/data",
  "/manifest.webmanifest",
];

// ── Install: precache the app shell ──────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ───────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// ── Message: allow client to trigger skipWaiting ─────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Fetch: network-first for navigations, cache-first for assets ─
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  // Navigation requests → Network-first, fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Static assets → Cache-first, fall back to network (and cache the response)
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          // Only cache same-origin, successful responses
          if (
            response.ok &&
            new URL(request.url).origin === self.location.origin
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
    )
  );
});
