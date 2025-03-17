const CACHE_NAME = 'Pet-Health-Tracker-cache-v10'; // Increment version
const OFFLINE_URL = '/Pet-Health-Tracker/offline.html';

// Update URLs to cache (remove problematic favicon)
const urlsToCache = [
  '/Pet-Health-Tracker/index.html',
  '/Pet-Health-Tracker/styles.css',
  '/Pet-Health-Tracker/script.js',
  '/Pet-Health-Tracker/manifest.json',
  '/Pet-Health-Tracker/icons/icon-192x192.png',
  '/Pet-Health-Tracker/icons/icon-512x512.png',
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(error => {
        console.log('Failed to cache:', error);
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip favicon requests
  if (url.pathname.endsWith('favicon.ico')) {
    return; // Let browser handle
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/Pet-Health-Tracker/index.html')
        .then(response => response || fetch(event.request))
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).catch(error => {
        console.log('Fetch failed; returning offline page:', error);
        return caches.match(OFFLINE_URL);
      });
    })
  );
});
