// firebase-messaging-sw.js
importScripts('firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Validate configuration
if (!self.firebaseConfig || 
    !self.firebaseConfig.apiKey ||
    !self.firebaseConfig.projectId ||
    !self.firebaseConfig.messagingSenderId ||
    !self.firebaseConfig.appId) {
  throw new Error('Invalid Firebase configuration');
}

// Initialize Firebase
firebase.initializeApp(self.firebaseConfig);

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
