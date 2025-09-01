// service-worker.js
const CACHE_NAME = 'Pet-Health-Tracker-cache-v3'; // Changed version
const OFFLINE_URL = '/offline.html';
const CACHED_INDEX = '/index.html';

const urlsToCache = [
  '/',
  CACHED_INDEX,
  OFFLINE_URL,
  '/auth.js', 
  '/utils.js',
  '/dashboard.js',
  '/styles.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  '/banner/Image.png',
  '/privacy.html',
  '/terms.html',
  
  // Your local Lottie 8 of them 
  '/lottiefiles/Welcome.json',
  '/lottiefiles/momhugpets.json',
  '/lottiefiles/Cat.json',
  '/lottiefiles/paws.json',
  '/lottiefiles/BlackCatPeeping.json',
  '/lottiefiles/today.json',
  '/lottiefiles/upcoming.json',
  '/lottiefiles/overdue.json',

   // Essential libraries 
  'https://cdn.jsdelivr.net/npm/@lottiefiles/lottie-player@latest/dist/lottie-player.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
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

 //✅  Handle navigation requests
if (request.mode === 'navigate') {
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(OFFLINE_URL)) // ← ONLY offline.html
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

