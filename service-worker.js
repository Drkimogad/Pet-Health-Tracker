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

  // offline libraries
  'js/lib/cloudinary-core-shrinkwrap.min.js',
  'js/lib/html2canvas.min.js',
  'js/lib/jszip.min.js',
  'js/lib/jspdf.umd.min.js',
  'js/lib/lottie-player.js',
  'js/lib/qrcode.min.js'  
  ];

// ======== INSTALL ========
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate SW immediately
  
// Inside your 'install' event
event.waitUntil(
  (async () => {
    // 1️⃣ Cache local assets
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache.map(url => new Request(url, { mode: 'same-origin' })));

    // 2️⃣ Cache external libraries safely
    const externalCache = await caches.open(OFFLINE_CACHE);
    const externalLibs = [
      'https://unpkg.com/cloudinary-core@2.11.4/cloudinary-core-shrinkwrap.min.js',
      'https://apis.google.com/js/api.js',
      'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js',
      'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-functions-compat.js'
    ];

    for (const url of externalLibs) {
      try {
        await externalCache.add(new Request(url, { mode: 'no-cors', credentials: 'omit' }));
      } catch (err) {
        console.warn(`⚠️ Could not cache external library: ${url}`, err);
      }
    }

    console.log('✅ Installation completed with local + external libraries');
  })().catch(err => console.error('❌ Installation failed:', err))
);
}); // ✅ This closing brace and parenthesis was missing

// ======== FETCH HANDLER ========
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try to fetch from network first
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (error) {
          // Fallback to cached version or offline page
          const cached = await caches.match('index.html') || 
                         await caches.match('offline.html');
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // For API requests (Firestore), network first with offline fallback
  if (url.href.includes('firestore.googleapis.com')) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (error) {
          // Return a custom offline response for API calls
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

  // For static assets (cache first with network fallback)
  event.respondWith(
    (async () => {
      // Try to get from cache first
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;

      try {
        // Not in cache, try network
        const networkResponse = await fetch(request);
        
        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // For external resources that might be in offline cache
        if (externalResources.some(resource => url.href.includes(resource))) {
          const offlineResponse = await caches.match(request, { 
            ignoreSearch: true,
            cacheName: OFFLINE_CACHE 
          });
          if (offlineResponse) return offlineResponse;
        }
        
        // For images, return a placeholder if available
        if (request.destination === 'image') {
          const placeholder = await caches.match('icons/icon-192x192.png');
          if (placeholder) return placeholder;
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
      // Enable navigation preload if supported
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      
      // Clean up old caches
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(key => {
          if (key !== CACHE_NAME && key !== OFFLINE_CACHE) {
            return caches.delete(key);
          }
        })
      );
      
      console.log('✅ New service worker activated');
      self.clients.claim(); // Take control immediately
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



