// service-worker.js (combined)
const CACHE_NAME = 'Pet-Health-Tracker-cache-10';
const OFFLINE_URL = './offline.html';
const CACHED_INDEX = './index.html';

const urlsToCache = [
  CACHED_INDEX,
  './styles.css',
  './script.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './favicon.ico',
  OFFLINE_URL
];

// ======== CACHING FUNCTIONALITY ========
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching core resources');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache installation failed:', err);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Network-first for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (err) {
          const cached = await caches.match(CACHED_INDEX) || 
                        await caches.match(OFFLINE_URL);
          return cached;
        }
      })()
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    ))
  );
  self.clients.claim();
});

// ======== PUSH NOTIFICATIONS ========
self.addEventListener('push', (event) => {
  const payload = event.data?.json() || {
    title: 'Pet Health Reminder',
    body: 'Check your pet health tracker!',
    icon: '/icons/icon-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: payload.data || {}
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        if (clientList.length > 0) return clientList[0].focus();
        return clients.openWindow(event.notification.data.url || '/');
      })
  );
});
