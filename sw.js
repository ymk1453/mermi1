const CACHE = "mm-pwa-v9";

const ASSETS = [
  "/",
  "/index.html",
  "/index_plus.html",
  "/offline.html",
  "/style_plus.css",
  "/script_plus.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Sadece GET
  if (req.method !== "GET") return;

  // Sadece same-origin
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // NAVIGATION → network-first (SSL SAFE)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // STATIC → cache-first
  event.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("/offline.html"))
    )
  );
});
