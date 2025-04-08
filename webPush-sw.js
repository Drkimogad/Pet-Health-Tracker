// sw.js
self.addEventListener('push', (event) => {
  const payload = event.data?.json() || { 
    title: 'Reminder', 
    body: 'Check your pet health tracker!' 
  };
  
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192x192.png'
    })
  );
});
