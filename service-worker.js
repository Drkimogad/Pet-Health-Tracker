const CACHE_NAME = 'Pet-Health-Tracker-cache-v9';
const OFFLINE_URL = 'https://drkimogad.github.io/Pet-Health-Tracker/offline.html';
const CACHED_INDEX = 'https://drkimogad.github.io/Pet-Health-Tracker/index.html';

const urlsToCache = [
  CACHED_INDEX,
  'https://drkimogad.github.io/Pet-Health-Tracker/styles.css',
  'https://drkimogad.github.io/Pet-Health-Tracker/script.js',
  'https://drkimogad.github.io/Pet-Health-Tracker/manifest.json',
  'https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-192x192.png',
  'https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-512x512.png',
  'https://drkimogad.github.io/Pet-Health-Tracker/favicon.ico',
  OFFLINE_URL
];

// Enhanced Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Optimized Fetch Handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (err) {
          // Fallback to cached index
          const cachedIndex = await caches.match(CACHED_INDEX);
          if (cachedIndex) return cachedIndex;
          // Ultimate fallback
          return caches.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }

  // Static assets
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});

// Aggressive Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    )).then(() => self.clients.claim())
  );
});
