const CACHE_NAME = 'Pet-Health-Tracker-cache-v7';
const OFFLINE_URL = '/Pet-Health-Tracker/offline.html';
const CACHED_INDEX = '/Pet-Health-Tracker/index.html';

const urlsToCache = [
  CACHED_INDEX,
  '/Pet-Health-Tracker/styles.css',
  '/Pet-Health-Tracker/script.js',
  '/Pet-Health-Tracker/manifest.json',
  '/Pet-Health-Tracker/icons/icon-192x192.png',
  '/Pet-Health-Tracker/icons/icon-512x512.png',
  '/Pet-Health-Tracker/favicon.ico',
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      return Promise.all(
        urlsToCache.map(async (url) => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn(`Failed to cache ${url}:`, error);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(CACHED_INDEX))
        .then(response => response || caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(networkResponse => {
        if (event.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => caches.match(OFFLINE_URL));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames.map(cacheName => 
          cacheName !== CACHE_NAME ? caches.delete(cacheName) : null
        )
      ).then(() => self.clients.claim())
    )
  );
});
