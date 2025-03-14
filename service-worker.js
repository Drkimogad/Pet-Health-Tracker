const CACHE_NAME = 'Pet-Health-Tracker-cache-v3';
const urlsToCache = [
    'https://drkimogad.github.io/Pet-Health-Tracker/',
    'https://drkimogad.github.io/Pet-Health-Tracker/index.html',
    'https://drkimogad.github.io/Pet-Health-Tracker/styles.css',
    'https://drkimogad.github.io/Pet-Health-Tracker/script.js',
    'https://drkimogad.github.io/Pet-Health-Tracker/manifest.json',
    'https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-192x192.png',
    'https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-512x512.png',
    'https://drkimogad.github.io/Pet-Health-Tracker/favicon.ico',
    'https://drkimogad.github.io/Pet-Health-Tracker/offline.html'
];

// Function to normalize request URLs
function normalizeURL(url) {
    const urlObj = new URL(url);
    urlObj.search = ''; // Remove query parameters
    return urlObj.href;
}

// Install event: Cache necessary assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Forces the new service worker to take control immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching assets during install');
            return cache.addAll(urlsToCache)
                .then(() => {
                    console.log('Assets successfully cached!');
                })
                .catch((err) => {
                    console.error('Error caching assets:', err);
                });
        })
    );
});

// Fetch event: Serve assets from cache or fetch from network if not cached
self.addEventListener('fetch', (event) => {
    console.log('Fetching request for:', event.request.url);
    event.respondWith(
        caches.match(normalizeURL(event.request.url)).then((cachedResponse) => {
            if (cachedResponse) {
                console.log('Serving from cache:', event.request.url);
                return cachedResponse; // Serve from cache
            }
            console.log('Fetching from network:', event.request.url);
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                return caches.match(normalizeURL('/offline.html'));  // Ensure offline.html is cached
            });
        }).catch((err) => {
            console.error('Error fetching:', err);
            return caches.match(normalizeURL('/offline.html'));
        })
    );
});

// Activate event: Clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];  // Only keep the current cache
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // Delete old caches
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker activated and ready');
            self.clients.claim();  // Claim clients immediately after activation
        })
    );
});

// Check for updates and fetch new service worker
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
