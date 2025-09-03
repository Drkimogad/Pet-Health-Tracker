// ========================================
// SERVICE WORKER - Pet Health Tracker
// Version: v8 (increment for updates)
// ========================================

// ======== CACHE NAME & ASSETS ========
const CACHE_NAME = 'Pet-Health-Tracker-cache-v11'; // Bump version after changes
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
  
  // Add to urlsToCache:
'__/firebase/8.10.1/firebase-auth.js',
'__/firebase/init.js',
 // Add to urlsToCache:
'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js',
'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js',
  // External libraries
'js/qrcode.min.js'  // Or remove it if not essential for offline
];

//External CDN files often fail caching due to CORS. We’ll handle them safely in the install step.

// ======== INSTALL ========
// no-cors mode for external scripts avoids SW errors.
//Each file has its own .catch() → one failed file doesn’t break the SW.
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      const cachePromises = urlsToCache.map(url => 
        cache.add(new Request(url, { mode: url.startsWith('http') ? 'no-cors' : 'same-origin' }))
          .catch(err => console.warn(`⚠️ Could not cache: ${url}`, err))
      );
      return Promise.all(cachePromises);
    })
    .then(() => console.log('✅ Installation completed (some files may not be cached)'))
    .catch(err => console.error('❌ Installation failed:', err))
  );
});


// ======== FETCH HANDLER ========
//Navigation uses “app shell” strategy → offline page loads even if user is offline.
//Only basic or cors responses are cached → avoids caching opaque or failed responses.
//Final fallback for CDNs ensures the app won’t crash offline.
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return; // Only handle GET requests

  // ----- Navigation Requests (App Shell) -----
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('index.html')
          .then(resp => resp || caches.match('offline.html')))
    );
    return;
  }

  // ----- Static Assets (Cache First) -----
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached; // Serve from cache
      return fetch(request).then(response => {
        // Only cache successful, same-origin or CORS responses
        if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
          // For HTML pages
       if (request.destination === 'document') {
       return caches.match('offline.html');
      }
  // For external resources
      if (request.url.includes('cdn.')) {
      return new Response('', { status: 408, statusText: 'Offline' });
    }
    return Response.error();
    });
    })
  );
});

// ======== ACTIVATE & CLEANUP ========
//Old caches are cleaned automatically to avoid storage bloat.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())
      )
    ).then(() => {
      console.log('✅ New service worker activated');
      self.clients.claim(); // Take control immediately
    })
  );
});


// ======== UPDATE NOTIFICATION ========
//Notifies the app when a new SW version is available.
//Allows your main JS to prompt the user to reload.
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('controllerchange', () => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage('updateAvailable'));
  });
});


















