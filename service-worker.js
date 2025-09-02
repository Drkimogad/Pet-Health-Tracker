const CACHE_NAME = 'Pet-Health-Tracker-cache-v7'; // bump version after changes

const urlsToCache = [
  '.', // root (https://drkimogad.github.io/Pet-Health-Tracker/)
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

  // External libs
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];


// ======== INSTALL ========
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache files one by one with error handling
        const cachePromises = urlsToCache.map(url => 
          cache.add(url).catch(err => {
            console.warn(`⚠️ Could not cache: ${url}`, err);
            // Don’t stop caching other files
          })
        );
        return Promise.all(cachePromises);
      })
      .then(() => console.log('✅ Installation completed (some files may not be cached)'))
      .catch(err => console.error('❌ Installation failed:', err))
  );
});

// ======== FETCH ========
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  if (request.method !== 'GET') return;

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request)
      .then(cached => cached || 
        fetch(request).then(response => {
          // Cache successful responses
          if (response.ok && !request.url.includes('chrome-extension')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Final fallback for external resources
          if (request.url.includes('cdn.jsdelivr.net') || 
              request.url.includes('cdnjs.cloudflare.com')) {
            return new Response('Offline - Resource not available');
          }
        })
      )
  );
});

// ======== ACTIVATE & CLEANUP ========
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => 
          key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()
        )
      )
    ).then(() => {
      console.log('✅ New service worker activated');
      self.clients.claim();
    })
  );
});

// ======== UPDATE NOTIFICATION ========
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Listen for controller change (new version installed)
self.addEventListener('controllerchange', () => {
  // Send message to all clients to show update notification
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage('updateAvailable');
    });
  });
});













