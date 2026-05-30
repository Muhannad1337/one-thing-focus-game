// Focus Games — service worker.
// Cache-first for the app shell, network-first for everything else, offline fallback to '/'.
// Bump CACHE_VERSION when shipping a release whose cached assets must be evicted.
const CACHE_VERSION = 'focus-games-v4';
const SHELL = [
  '/',
  '/index.html',
  '/icon.svg',
  '/icon-32.png',
  '/apple-icon.png',
  '/pwa-icon.png',
  '/manifest.webmanifest',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Google Fonts: cache-first so the app keeps its typography offline.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const resp = await fetch(req);
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch {
          return hit || new Response('', { status: 504 });
        }
      })
    );
    return;
  }
  // Only handle same-origin assets — bypass third-party telemetry etc cleanly.
  if (url.origin !== self.location.origin) return;

  // Cache-first for the app shell (HTML + icons + manifest).
  if (SHELL.includes(url.pathname) || url.pathname === '/' || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return resp;
      }).catch(() => caches.match('/')))
    );
    return;
  }
  // Network-first for everything else, fall back to cache, then to '/'.
  event.respondWith(
    fetch(req).then((resp) => {
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
      }
      return resp;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
  );
});
