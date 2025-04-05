// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  authDomain: "pet-health-tracker-7164d.firebaseapp.com",
  projectId: "pet-health-tracker-7164d",
  storageBucket: "pet-health-tracker-7164d.firebasestorage.app",
  messagingSenderId: "251170885789",
  appId: "1:251170885789:web:2c16a20f96da9f6a960474",
  measurementId: "G-GKD3RVNVLV"

  export const formatReminderDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const getProfileLink = (index) => {
  return `${window.location.origin}?profile=${index}`;
};
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
