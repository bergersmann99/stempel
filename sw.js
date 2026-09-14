// Service Worker: haelt die App offline lauffaehig.
// Nach jeder Aenderung an index.html, config.js oder gsync.js die Version
// hochzaehlen, sonst bleibt auf dem Geraet die alte Fassung im Cache liegen.
const CACHE = 'stempel-v8';
const SHELL = [
  './',
  './index.html',
  './feiertage.js',
  './config.js',
  './gsync.js',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Google-Anmeldung und die Sheets-Schnittstelle nie aus dem Cache bedienen.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((treffer) => {
      if (treffer) return treffer;
      return fetch(e.request).catch(() => {
        // Nur beim Seitenaufruf auf die App zurueckfallen, nicht bei Skripten.
        return e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error();
      });
    })
  );
});
