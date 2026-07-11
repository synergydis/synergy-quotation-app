// Synergy Quotation App — Service Worker
// Caches the app shell so it works offline once installed.
// Bump CACHE_NAME whenever you publish a new version so old caches don't linger.

const CACHE_NAME = 'synergy-quote-v8';
const PRECACHE_URLS = [
  './',
  './Synergy_Quotation_App_Mobile_v8.html',
  './Synergy_Quotation_App_Desktop_v8.html',
  './manifest.json',
  './manifest-desktop.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for same-origin app files, network passthrough for everything else
// (jsPDF CDN, WhatsApp links, Google Fonts, etc. always go to the network)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return; // let cross-origin requests (CDN, WhatsApp, fonts) go straight to network
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache a copy of newly-fetched same-origin files for next time offline
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      }).catch(() => cached); // if offline and not cached, just fail gracefully
    })
  );
});
