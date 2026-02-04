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

// soft time based theme (non-invasive)
(() => {
  const h = new Date().getHours();
  const root = document.documentElement;
  if (h >= 20 || h < 6) {
    root.style.setProperty('--bg-soft', '#121212');
  }
})();

// === SILENT FEATURE PACK ===
(() => {
  const endBtn = document.querySelector('.end-day-btn');
  if (endBtn) {
    endBtn.addEventListener('click', () => {
      document.body.classList.add('fade-out');
    });
  }

  // auto draft
  document.querySelectorAll('textarea').forEach(t => {
    const key = 'draft_'+location.pathname;
    t.value = localStorage.getItem(key) || t.value;
    t.addEventListener('input', () => {
      localStorage.setItem(key, t.value);
    });
  });
})();

// === 20 FEATURE PACK (ADD-ONLY) ===
(() => {
  // soft read mark
  document.querySelectorAll('[data-entry]').forEach(e=>{
    if(localStorage.getItem('read_'+e.id)) e.classList.add('read-soft');
    e.addEventListener('click',()=>localStorage.setItem('read_'+e.id,'1'));
  });

  // one-line mode toggle (optional)
  document.querySelectorAll('[data-one-line]').forEach(b=>{
    b.addEventListener('click',()=>document.body.classList.toggle('one-line'));
  });

  // silent recall
  if(Math.random()<0.05){
    const r=document.querySelector('[data-entry]');
    if(r) r.scrollIntoView({behavior:'smooth'});
  }

  // mini pause after save
  document.addEventListener('saved',()=>{
    document.body.classList.add('mini-pause');
    setTimeout(()=>document.body.classList.remove('mini-pause'),1200);
  });

  // silent refresh
  window.addEventListener('beforeunload',()=>document.body.classList.add('silent-refresh'));
})();

// === +30 FEATURE PACK (21–50) ADD-ONLY ===
(() => {
  // breath before write
  document.querySelectorAll('textarea').forEach(t=>{
    t.classList.add('breath-delay');
  });

  // punctuation micro pause
  document.addEventListener('input',e=>{
    if(e.target.tagName==='TEXTAREA' && /[\.\!\?]$/.test(e.target.value)){
      e.target.classList.add('pause-soft');
      setTimeout(()=>e.target.classList.remove('pause-soft'),120);
    }
  });

  // defer today flag
  document.querySelectorAll('[data-defer]').forEach(b=>{
    b.addEventListener('click',()=>b.closest('[data-entry]')?.classList.add('defer-today'));
  });

  // idle blur
  let idle;
  const idleOn=()=>document.body.classList.add('blur-idle');
  const idleOff=()=>document.body.classList.remove('blur-idle');
  ['mousemove','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{
    clearTimeout(idle); idleOff(); idle=setTimeout(idleOn,30000);
  }));

  // slow scroll for dense content
  if(document.body.textContent.length>4000){
    document.documentElement.classList.add('scroll-calm');
  }

  // rare reassurance
  if(Math.random()<0.03){
    const m=document.createElement('div');
    m.textContent='Buradakiler cihazında.';
    m.className='footer-mark';
    document.body.appendChild(m);
  }
})();
