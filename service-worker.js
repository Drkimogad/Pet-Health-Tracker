// 🟢 ENHANCEMENT 5: Explicit cache version update
const CACHE_NAME = 'Pet-Health-Tracker-cache-v6';
// 🟢 ENHANCEMENT 1: Define offline URL
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

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn(`Failed to cache ${url}:`, error);
        }
      }
    })
  );
});

// 🟢 ENHANCEMENT 3: NetworkFirst for navigation + 🟢 ENHANCEMENT 7: Cache updates
self.addEventListener('fetch', (event) => {
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(CACHED_INDEX)
          .then(response => response || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // 🟢 ENHANCEMENT 7: Update cache for successful GET requests
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      });

      return cachedResponse || fetchPromise.catch(() => {
        // 🟢 ENHANCEMENT 2: Consistent offline handling
        if (event.request.destination === 'image') {
          return caches.match('https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-512x512.png');
        }
        return caches.match(OFFLINE_URL);
      });
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

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    self.clients.claim().then(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('reload'));
      });
    });
  }
});
