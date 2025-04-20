// service-worker.js
const CACHE_NAME = 'Pet-Health-Tracker-cache-v3'; // Changed version
const OFFLINE_URL = '/offline.html';
const CACHED_INDEX = '/index.html';

const urlsToCache = [
  '/',
  CACHED_INDEX,
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
  '/favicon.ico',
  OFFLINE_URL,
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

// ======== Improved Install Handler ========
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => console.log('Cached core assets'))
      .catch(err => console.error('Cache addAll error:', err))
  );
});

// ======== Smarter Fetch Handler ========
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(CACHED_INDEX) || caches.match(OFFLINE_URL))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request)
      .then(cached => cached || 
        fetch(request).then(response => {
          // Cache new responses
          if (response.ok && !request.url.includes('chrome-extension')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
      )
  );
});

// ======== Cleanup Old Caches ========
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => 
          key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()
        )
      )
    ).then(() => {
      console.log('Activated new SW');
      self.clients.claim();
    })
  );
});

// ======== Push Notifications ========
self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {
    title: 'Pet Health Reminder',
    body: 'Check your pet health tracker!',
    icon: '/icons/icon-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: '/icons/badge-72x72.png',
      data: { url: payload.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === event.notification.data.url) {
            return client.focus();
          }
        }
        return clients.openWindow(event.notification.data.url);
      })
  );
});
