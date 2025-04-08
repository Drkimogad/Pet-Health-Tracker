/* eslint-disable no-undef, no-console */

// ======== FIREBASE CORE SERVICES ========
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  projectId: "pet-health-tracker-7164d",
  appId: "pet-health-tracker-7164d"
};

// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Service references
const auth = firebase.auth();
const firestore = firebase.firestore();

// ======== NOTIFICATION SERVICE ========
async function showAppNotification(title, body) {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: './icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: { url: '/' }
    });
  } catch (error) {
    console.error('Notification failed:', error);
    throw error;
  }
}

// ======== SERVICE WORKER SETUP ========
async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered:', registration);
    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
}

// ======== NOTIFICATION PERMISSION ========
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}

// ======== MAIN INITIALIZATION ========
async function initializeNotifications() {
  const swRegistered = await setupServiceWorker();
  if (!swRegistered) return;

  const hasPermission = await requestNotificationPermission();
  if (hasPermission) {
    console.log('Ready to send notifications');
  }
}

// Initialize when app loads
initializeNotifications();

// ======== EXPORTS ========
export { initializeNotifications, showAppNotification };
