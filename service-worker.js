// ========================================
// SERVICE WORKER - Pet Health Tracker
// Version: v14 (increment for updates)
// ========================================
const CACHE_NAME = 'Pet-Health-Tracker-cache-v30';
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



// ====================
// IndexedDB Helpers for SW
// This copy of helpers inside the service worker → for background sync 
// ====================

// Open IndexedDB (creates 'offlineProfiles' store if not exists)
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PetHealthDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineProfiles')) {
        const store = db.createObjectStore('offlineProfiles', { keyPath: 'id', autoIncrement: true });
        store.createIndex('profileId', 'profile.id', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Add a queued operation
// Enhance your IndexedDB helpers with better error handling
async function addOfflineProfile(db, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineProfiles', 'readwrite');
    const store = tx.objectStore('offlineProfiles');
    const request = store.add(data);
    
    request.onsuccess = () => resolve(request.result); // Return the ID
    request.onerror = () => {
      console.error('IndexedDB add error:', request.error);
      reject(request.error);
    };
  });
}

// Get all queued operations
async function getOfflineProfiles(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineProfiles', 'readonly');
    const store = tx.objectStore('offlineProfiles');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Remove a synced operation
async function removeOfflineProfile(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineProfiles', 'readwrite');
    const store = tx.objectStore('offlineProfiles');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}


// ======== INSTALL ========
self.addEventListener('install', (event) => {
  self.skipWaiting();

// Inside your 'install' event
event.waitUntil(
  (async () => {
    // 1️⃣ Cache local assets
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache.map(url => new Request(url, { mode: 'same-origin' })));

    // 2️⃣ Cache external libraries safely
    const externalCache = await caches.open(OFFLINE_CACHE);
    const externalLibs = [
      'https://apis.google.com/js/api.js',
      // Add other external libraries here
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
});

//========================================================================================================================
//INITIALIZE FIREBASE AFTER ALL LIBRARIES HAVE BEEN CACHED AND SW INSTALLATION COMPLETED OTHERWISE IT WILL GET STUCK
//========================================================================================================================
importScripts('./js/lib/firebase-app-compat.js');
importScripts('./js/lib/firebase-firestore-compat.js');
// Initialize Firebase in Service Worker
const firebaseConfig = {
  apiKey: "AIzaSyAy2ObF1WWPurBa3TZ_AbBb00o80ZmlLAo",
  authDomain: "pet-health-tracker-4ec31.firebaseapp.com",
  projectId: "pet-health-tracker-4ec31",
  storageBucket: "pet-health-tracker-4ec31.firebasestorage.app",
  messagingSenderId: "123508617321",
  appId: "1:123508617321:web:6abb04f74ce73d7d4232f8",
  measurementId: "G-7YDDLF95KR"
};

// Initialize Firebase
// Wait a moment for files to load, then initialize
setTimeout(() => {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized in Service Worker');
  } else if (typeof firebase !== 'undefined') {
    console.log('✅ Firebase already available in Service Worker');
  } else {
    console.warn('⚠️ Firebase not loaded in Service Worker');
  }
}, 100);

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
// For external CDN libs (stale-while-revalidate)
if (url.origin.includes('googleapis.com') || url.href.includes('apis.google.com/js/api.js')) {
  event.respondWith(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE);

      // 1️⃣ Check if cached
      const cachedResponse = await cache.match(request);
      const networkFetch = fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            cache.put(request, response.clone()); // 2️⃣ Update cache silently
          }
          return response;
        })
        .catch(() => null);

      // 3️⃣ Serve cached first, fallback to network if not cached
      return cachedResponse || (await networkFetch) || Response.error();
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
// ======== MESSAGE LISTENER ========
self.addEventListener('message', (event) => {
  console.log('📨 Message received in service worker:', event.data);
  
  if (event.data === 'triggerSync') {
    console.log('🔄 Sync triggered via message');
    event.waitUntil(syncOfflineProfiles()); // Use waitUntil for background tasks
  }
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Keep your existing sync event listener too
self.addEventListener('sync', (event) => {
  console.log('🔄 Sync event received with tag:', event.tag);
  if (event.tag === 'petProfiles-sync') {
    console.log('🔄 Background sync triggered for petProfiles');
    event.waitUntil(syncOfflineProfiles());
  }
});

// Function to sync queued offline profiles WITH DEEP DEBUGGING
async function syncOfflineProfiles() {
  try {
    console.log('🔄 Starting syncOfflineProfiles');
    
    const db = await openIndexedDB();
    console.log('✅ IndexedDB opened');
    
    const offlineProfiles = await getOfflineProfiles(db);
    console.log('📋 Offline profiles in queue:', offlineProfiles);
    console.log('📋 Number of profiles:', offlineProfiles.length);

    if (!offlineProfiles.length) {
      console.log('📭 No offline profiles to sync');
      return;
    }

    console.log('🔄 Syncing', offlineProfiles.length, 'offline profiles');

    for (const item of offlineProfiles) {
      console.log('🔍 Processing item:', item);
      const { action, profile, profileId } = item;
      console.log('🔍 Action:', action, 'Profile:', profile, 'ProfileId:', profileId);

      // ✅ VALIDATION: Check for missing profileId in delete operations
      if (action === 'delete' && !profileId) {
        console.warn('⚠️ Delete operation missing profileId, skipping');
        continue;
      }
      
      try {
        // ✅ VALIDATION: Ensure profile has ownerId for add/update
        if ((action === 'add' || action === 'update') && (!profile || !profile.ownerId)) {
          console.warn('⚠️ Profile missing ownerId, skipping sync:', profile);
          continue;
        }

        if (action === 'add' || action === 'update') {
          console.log('🔄 Processing add/update for profile:', profile.id);
          const docRef = firebase.firestore().collection('profiles').doc(profile.id);
          await docRef.set(profile, { merge: true });
          console.log(`✅ Synced profile ${profile.id} (${action})`);
        } else if (action === 'delete') {
          console.log('🔄 Processing delete for profileId:', profileId);
          const docRef = firebase.firestore().collection('profiles').doc(profileId);
          await docRef.delete();
          console.log(`✅ Deleted profile ${profileId}`);
        }
        
        await removeOfflineProfile(db, item.id);
        console.log('✅ Removed item from queue:', item.id);
      } catch (err) {
        console.warn(`⚠️ Could not sync profile ${action} operation:`, err);
        console.warn('⚠️ Error details:', err.message, err.code);
      }
    }
    
  } catch (err) {
    console.error('❌ Background sync error:', err);
    console.error('❌ Error details:', err.message, err.code);
  }
}

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
    













