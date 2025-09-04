// ========================================
// SERVICE WORKER - Pet Health Tracker
// Version: v14 (increment for updates)
// ========================================

const CACHE_NAME = 'Pet-Health-Tracker-cache-v14';
const OFFLINE_CACHE = 'Pet-Health-Tracker-offline-v2';

// Core app assets
const urlsToCache = [
  '.',
  'index.html',
  'offline.html',
  'js/auth.js',
  'js/utils.js',
  'js/dashboard.js',
  'styles.css',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'favicon.ico',
  'banner/Image.png',
  'privacy.html',
  'terms.html',

  // Local Lotties
  'lottiefiles/Welcome.json',
  'lottiefiles/momhugpets.json',
  'lottiefiles/Cat.json',
  'lottiefiles/paws.json',
  'lottiefiles/BlackCatPeeping.json',
  'lottiefiles/today.json',
  'lottiefiles/upcoming.json',
  'lottiefiles/overdue.json',

  // Local JS libraries
  'js/lib/cloudinary-core-shrinkwrap.min.js',
  'js/lib/html2canvas.min.js',
  'js/lib/jszip.min.js',
  'js/lib/jspdf.umd.min.js',
  'js/lib/lottie-player.js',
  'js/lib/qrcode.min.js',
  'js/lib/firebase-app-compat.js',
  'js/lib/firebase-auth-compat.js',
  'js/lib/firebase-firestore-compat.js',
  'js/lib/firebase-functions-compat.js'
];

// ======== INSTALL ========
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urlsToCache.map(url => new Request(url, { mode: 'same-origin' })));
      console.log('✅ Service worker installed and all local assets cached.');
    })()
  );
});

// ======== FETCH HANDLER ========
// ======== FETCH HANDLER ========
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and browser extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (err) {
          return await caches.match('index.html') || await caches.match('offline.html');
        }
      })()
    );
    return;
  }

  // Firestore API offline response
  if (url.href.includes('firestore.googleapis.com')) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (err) {
          return new Response(JSON.stringify({
            status: 'offline',
            message: 'You are offline. Changes will sync when connection is restored.'
          }), {
            status: 408,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return;
  }

  // Static assets: cache first
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        if (request.destination === 'image') {
          return await caches.match('icons/icon-192x192.png') || Response.error();
        }
        return Response.error();
      }
    })()
  );
});

// ======== ACTIVATE & CLEANUP ========
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => (key !== CACHE_NAME) ? caches.delete(key) : null)
      );
      self.clients.claim();
      console.log('✅ Service worker activated and old caches removed.');
    })()
  );
});

// ======== BACKGROUND SYNC ========
// (Optional) You can add background sync for offline data later
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // You can implement background sync for Firestore operations here
  }
});

// ======== UPDATE NOTIFICATION ========
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('controllerchange', () => {
  // Notify all clients about the update
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage('updateAvailable'));
  });
});




