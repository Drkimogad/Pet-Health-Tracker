const CACHE_NAME = 'Pet-Health-Tracker-cache-v7'; // Incremented version
const OFFLINE_URL = '/Pet-Health-Tracker/offline.html';
const CACHED_INDEX = '/Pet-Health-Tracker/index.html';

// 🟢 1. Precaching with Network Timeout
const PRE_CACHE_TIMEOUT = 3000; // 3 seconds

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[SW] Installing version', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PRE_CACHE_TIMEOUT);
      
      try {
        await Promise.all(urlsToCache.map(async (url) => {
          const response = await fetch(url, { 
            signal: controller.signal,
            cache: 'reload' // Bypass HTTP cache
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await cache.put(url, response);
        }));
      } catch (error) {
        console.error('[SW] Precache failed:', error);
        // Partial caching is acceptable
      } finally {
        clearTimeout(timeoutId);
      }
    })
  );
});

// 🟢 2. Enhanced Fetch Handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  console.log(`[SW] Fetch: ${url.pathname}`, event.request.mode);

  // A. Handle API/External Requests
  if (url.origin !== location.origin) {
    return; // Let browser handle external requests
  }

  // B. Navigation Requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Network-first with timeout
          const networkPromise = fetch(event.request);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000);
          
          await Promise.race([networkPromise, timeoutPromise]);
          return networkPromise;
        } catch (error) {
          console.log('[SW] Serving cached index for', url.pathname);
          return caches.match(CACHED_INDEX)
            || caches.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }

  // C. Static Assets
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) {
        console.log('[SW] Cache hit:', url.pathname);
        return cached;
      }

      try {
        const response = await fetch(event.request);
        console.log('[SW] Network response:', url.pathname);
        // Cache successful GET requests
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      } catch (error) {
        console.log('[SW] Offline fallback for:', url.pathname);
        if (event.request.destination === 'image') {
          return caches.match('/Pet-Health-Tracker/icons/icon-512x512.png');
        }
        return caches.match(OFFLINE_URL);
      }
    })()
  );
});

// 🟢 3. Robust Activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new version');
  event.waitUntil(
    caches.keys().then(cacheList => {
      return Promise.all(
        cacheList.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      });
    })
  );
});
