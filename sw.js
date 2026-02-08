/* LOCAL_PREVIEW_FIX */
if(location.protocol==='file:'){console.warn('Local preview CORS olabilir, siteyi http üzerinden aç');}
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

// === MODE SYSTEM (ADD-ONLY) ===
(() => {
  const MODES=['default','sade','odak','gizlilik','rituel'];
  const key='site_mode_v1';
  const apply=(m)=>{
    MODES.forEach(x=>document.documentElement.classList.remove('mode-'+x));
    document.documentElement.classList.add('mode-'+m);
    localStorage.setItem(key,m);
    document.querySelectorAll('.mode-panel button[data-mode]').forEach(b=>{
      b.classList.toggle('active',b.getAttribute('data-mode')===m);
    });
  };
  apply(localStorage.getItem(key)||'default');
  const panel=document.querySelector('.mode-panel');
  if(panel){
    panel.addEventListener('click',(e)=>{
      const b=e.target.closest('button[data-mode]');
      if(b) apply(b.getAttribute('data-mode'));
    });
  }
})();

// === ONBOARDING (RUN ONCE) ADD-ONLY ===
(() => {
  const key = 'onboard_done_v1';
  const overlay = document.getElementById('onboardOverlay');
  if (!overlay) return;

  const steps = [
    {t:'Burası özel.', d:'Burası sadece senin için. Acelemiz yok.'},
    {t:'Paylaşılmaz.', d:'Buradakiler dışarı çıkmaz. Gösteriş yok, puan yok.'},
    {t:'Yazıp çıkabilirsin.', d:'Bir cümle bile yeter. İstediğin zaman sadece kapat.'},
  ];

  let i = 0;
  const title = document.getElementById('onboardTitle');
  const text = document.getElementById('onboardText');
  const next = document.getElementById('onboardNext');
  const skip = document.getElementById('onboardSkip');

  const render = () => {
    title.textContent = steps[i].t;
    text.textContent = steps[i].d;
    for (let k=0;k<3;k++){
      const dot = document.getElementById('dot'+k);
      if (dot) dot.classList.toggle('on', k===i);
    }
    if (next) next.textContent = (i===2) ? 'Bitti' : 'Devam';
  };

  const close = () => {
    overlay.style.display = 'none';
    localStorage.setItem(key, '1');
  };

  if (!localStorage.getItem(key)) {
    overlay.style.display = 'block';
    render();
  }

  next?.addEventListener('click', () => {
    if (i < 2) { i++; render(); }
    else close();
  });

  skip?.addEventListener('click', close);
  overlay?.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
})();

const CACHE_NAME = 'mermi1-cache-v11';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve())))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
      return resp;
    }).catch(() => cached))
  );
});
