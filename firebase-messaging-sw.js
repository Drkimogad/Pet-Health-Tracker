// firebase-messaging-sw.js

// 1. Load dependencies
try {
  importScripts('firebase-config.js');
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
} catch (e) {
  console.error('Dependency loading failed:', e);
  throw new Error('Service worker setup failed');
}

// 2. Validate configuration
const requiredConfigKeys = [
  'apiKey', 
  'projectId', 
  'messagingSenderId', 
  'appId'
];

if (!self.firebaseConfig || 
    requiredConfigKeys.some(key => !self.firebaseConfig[key])) {
  const missingKeys = requiredConfigKeys.filter(key => !self.firebaseConfig?.[key]);
  console.error('Missing Firebase config keys:', missingKeys);
  throw new Error('Invalid Firebase configuration');
}

// 3. Initialize Firebase
try {
  firebase.initializeApp(self.firebaseConfig);
  console.log('Firebase initialized in service worker');
} catch (e) {
  console.error('Firebase initialization failed:', e);
  throw e;
}

const messaging = firebase.messaging();

// 4. Background Message Handler
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Check your pet health tracker!',
    icon: './icons/icon-192x192.png',
    data: payload.data || {} // Pass through any additional data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 5. Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  event.notification.close();
  
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// 6. Optional: Handle installation
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting(); // Activate immediately
});
