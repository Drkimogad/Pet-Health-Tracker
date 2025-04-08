//* COMBINED SW WITH FIREBASE MESSAGING SW *//
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const CACHE_NAME = 'Pet-Health-Tracker-cache-10';
const OFFLINE_URL = './offline.html';
const CACHED_INDEX = './index.html';

const urlsToCache = [
  CACHED_INDEX,
  './styles.css',
  './profiles.js',
  './pushNotifications.js',
  './auth.js',
  './initialization.js',
  './reminders-validation.js',
  './buttons.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './favicon.ico',
  OFFLINE_URL
];

// Enhanced Install Event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching resources');
      return cache.addAll(urlsToCache);
    }).then(() => {
      return caches.keys().then(keys => {
        console.log('Current caches:', keys);
      });
    }).catch(err => {
      console.error('Error while caching resources:', err);
    })
  );
});

// Optimized Fetch Handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          console.log('Trying to fetch from network:', request.url);
          // Try network first
          const networkResponse = await fetch(request);
          console.log('Network fetch successful:', request.url);
          return networkResponse;
        } catch (err) {
          console.error('Network fetch failed:', request.url, err);
          // Fallback to cached index
          const cachedIndex = await caches.match(CACHED_INDEX);
          if (cachedIndex) {
            console.log('Returning cached index.html');
            return cachedIndex;
          }
          // Ultimate fallback
          console.warn('Cached index.html not found, returning offline page');
          return caches.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }

  // Static assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        console.log('Returning cached asset:', request.url);
        return cached;
      }
      console.log('Fetching from network:', request.url);
      return fetch(request);
    })
  );
});

// Aggressive Activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    )).then(() => {
      console.log('Service Worker: Activation complete');
      self.clients.claim();
    }).catch(err => {
      console.error('Error during activation:', err);
    })
  );
});

// Add Firebase init // instead of firebase-messaging-sw.js//
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'New Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Check your pet health tracker!',
    icon: './icons/icon-192x192.png'
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clients => {
      if (clients.length) {
        return clients[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
