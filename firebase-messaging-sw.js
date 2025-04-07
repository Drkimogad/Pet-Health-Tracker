// firebase-messaging-sw.js (Revised)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize using global config from firebase.config.js
firebase.initializeApp({
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  projectId: "pet-health-tracker-7164d",
  messagingSenderId: "251170885789",
  appId: "1:251170885789:web:2c16a20f96da9f6a960474"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'New Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Check your pet health tracker!',
    icon: 'https://drkimogad.github.io/Pet-Health-Tracker/icons/icon-192x192.png'
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
