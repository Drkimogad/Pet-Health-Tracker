const CACHE_NAME = 'Pet-Health-Tracker-cache-v5'; // Updated cache version
const urlsToCache = [
    'https://drkimogad.github.io/Pet-Health-Tracker/index.html',
    'https://drkimogad.github.io/Pet-Health-Tracker/styles.css',
    'https://drkimogad.github.io/Pet-Health-Tracker/script.js',
    'https://drkimogad.github.io/Pet-Health-Tracker/manifest.json',
    'https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-192x192.png',
    'https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-512x512.png',
    'https://drkimogad.github.io/Pet-Health-Tracker/favicon.ico',
    'https://drkimogad.github.io/Pet-Health-Tracker/offline.html'
];

// Install event: Precache static assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const url of urlsToCache) {
                try {
                    console.log(`Caching: ${url}`);
                    await cache.add(url);
                    console.log(`Cached successfully: ${url}`);
                } catch (error) {
                    console.warn(`Failed to cache ${url}:`, error);
                }
            }
        })
    ); // 🔹 This bracket was missing!
});

// Fetch event: Serve from cache, then update cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || !networkResponse.ok) throw new Error('Network response not ok');
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match(/'index.html') || caches.match(OFFLINE_URL);
                }
                return caches.match('/offline.html');
            });
        })
    );
});

// Activate event: Cleanup old caches
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

// Handle updates and force refresh
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
