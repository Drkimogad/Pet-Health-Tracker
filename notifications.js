export async function initNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getFCMToken();
        await saveSubscription(token);
      }
    } catch (error) {
      console.error('Notification initialization failed:', error);
    }
  }
}

async function getFCMToken() {
  const messaging = firebase.messaging();
  return messaging.getToken({ 
    vapidKey: 'YOUR_VAPID_KEY' 
  });
}
