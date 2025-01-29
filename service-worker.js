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

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        }).catch((err) => {
            console.error('Error caching assets:', err);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('/offline.html');
                }
            });
        }).catch((err) => {
            console.error('Error fetching:', err);
            if (event.request.mode === 'navigate') {
                return caches.match('/offline.html');
            }
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            self.clients.claim();
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
