// firebase-messaging-sw.js (Revised)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize using global config from firebase.config.js
firebase.initializeApp({    // Adjust this to self configure 
  apiKey: self.firebaseConfig?.apiKey || "YOUR_API_KEY",
  projectId: self.firebaseConfig?.projectId || "YOUR_PROJECT_ID",
  messagingSenderId: self.firebaseConfig?.messagingSenderId || "YOUR_SENDER_ID",
  appId: self.firebaseConfig?.appId || "YOUR_APP_ID"
});

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
