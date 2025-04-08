// firebase-messaging-sw.js

// 1. Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting(); // Activate immediately
});

// 2. Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  // Parse payload or use defaults
  const payload = event.data?.json() || { 
    title: 'New Reminder', 
    body: 'Check your pet health tracker!'
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: './icons/icon-192x192.png',
      data: payload.data || {} // Pass through custom data
    })
  );
});

// 3. Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  event.notification.close();
  
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Focus existing tab or open new window
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// 4. Background Sync Handler (optional)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  // Add background sync logic if needed
});
