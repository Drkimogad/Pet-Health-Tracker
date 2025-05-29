/* eslint-disable no-undef, no-console */

// ======== FIREBASE CORE SERVICES ========
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  projectId: "pet-health-tracker-7164d",
  appId: "pet-health-tracker-7164d"
};

// Initialize Firebase singleton
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ======== NOTIFICATION SERVICE ========
export async function sendPushNotification(title, body) {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: './icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: { url: '/' },
      badge: './icons/badge-72x72.png'
    });
    return true;
  } catch (error) {
    console.error('Notification delivery failed:', error);
    return false;
  }
}

// ======== SERVICE WORKER MANAGEMENT ========
async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    return await navigator.serviceWorker.register('./service-worker.js');
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// ======== NOTIFICATION PERMISSION HANDLER ========
async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  
  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Permission request failed:', error);
    return 'denied';
  }
}

// ======== MAIN NOTIFICATION SETUP ========
export async function setupNotifications() {
  try {
    const registration = await setupServiceWorker();
    if (!registration) return false;

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    console.log('Notification system ready');
    return true;
  } catch (error) {
    console.error('Notification setup failed:', error);
    return false;
  }
}

// ======== INITIALIZATION HELPER ========
export async function initializeNotifications() {
  return setupNotifications();
}
