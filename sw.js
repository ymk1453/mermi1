/* Service Worker - Mevra ❤️ Mizra PWA
   Update-safe, path-correct.

   - Supports SKIP_WAITING message (update banner works)
   - Precache critical shell
   - Navigation: offline fallback, also updates cache in background
   - Static assets: stale-while-revalidate
*/

const CACHE_VERSION = "mm-pwa-v10";
const PRECACHE = `${CACHE_VERSION}-precache`;
const RUNTIME = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./index_plus.html",
  "./offline.html",
  "./404.html",
  "./style_plus.css",
  "./script_plus.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./picture-placeholder.svg"
];

// Install: precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k.startsWith("mm-pwa-") && !k.includes(CACHE_VERSION)) ? caches.delete(k) : Promise.resolve())
    );
    await self.clients.claim();
  })());
});

// Message: allow page to request activation
self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isHTML(request) {
  return request.mode === "navigate" ||
         (request.headers.get("accept") || "").includes("text/html");
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  const cache = await caches.open(RUNTIME);
  cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(async (res) => {
      if (res && res.ok) {
        const cache = await caches.open(RUNTIME);
        cache.put(request, res.clone());
      }
      return res;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || caches.match("./offline.html");
}

async function networkFirstHTML(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return (await caches.match(request)) || (await caches.match("./offline.html"));
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network-first (fresh) with cache fallback
  if (isHTML(request)) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});
