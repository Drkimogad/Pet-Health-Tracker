// service-worker.js (add this at the top)
// Check for updates and fetch new service worker
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

const CACHE_NAME = 'Pet-Health-Tracker-cache-v4'; // Updated cache version
const OFFLINE_URL = new URL('offline.html', self.location.href).href;
const INDEX_URL = new URL('index.html', self.location.href).href;

const urlsToCache = [
    // Removed root URL to avoid potential redirect issues
    INDEX_URL,
    'https://drkimogad.github.io/Pet-Health-Tracker/styles.css',
    'https://drkimogad.github.io/Pet-Health-Tracker/script.js',
    'https://drkimogad.github.io/Pet-Health-Tracker/manifest.json',
    'https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-192x192.png',
    'https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-512x512.png',
    'https://drkimogad.github.io/Pet-Health-Tracker/favicon.ico',
    OFFLINE_URL
];

// normalize URLs function 
function normalizeURL(url) {
    const urlObj = new URL(url);
    urlObj.search = '';
    return urlObj.href;
}

// Install event 
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(err => console.error('Install error:', err))
    );
});

// Fetch event 
self.addEventListener('fetch', (event) => {
    const requestUrl = normalizeURL(event.request.url);
    
    event.respondWith(
        caches.match(requestUrl).then(cachedResponse => {
            // Return cached response if found
            if (cachedResponse) return cachedResponse;
            
            // Clone request for potential caching
            const fetchRequest = event.request.clone();
            
            return fetch(fetchRequest).then(networkResponse => {
                if (!networkResponse.ok) throw new Error('Network response not ok');
                
                // Clone response for caching
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(requestUrl, responseToCache);
                });
                
                return networkResponse;
            }).catch(async () => {
                // Handle navigation requests separately
                if (event.request.mode === 'navigate') {
                    const cachedIndex = await caches.match(INDEX_URL);
                    return cachedIndex || caches.match(OFFLINE_URL);
                }
                return caches.match(OFFLINE_URL);
            });
        })
    );
});

// Activate event 
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

