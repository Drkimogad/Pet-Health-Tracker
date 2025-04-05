// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = { /* your config */ };
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 1. Add your custom push handlers HERE
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/pet-icon-192x192.png',
      data: data.url
    })
  );
});
// 2. Push eventlistener. //
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// 3. Keep Firebase's background handler
messaging.onBackgroundMessage((payload) => {
  return self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: '/icons/pet-icon-192x192.png',
      data: payload.data
    }
  );
});
