/* eslint-disable no-undef, no-console */

// ======== FIREBASE CONFIGURATION ========
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  projectId: "pet-health-tracker-7164d",
  messagingSenderId: "251170885789",
  appId: "pet-health-tracker-7164d"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ======== SERVICE REFERENCES ========
const auth = firebase.auth();
const firestore = firebase.firestore();
const messaging = firebase.messaging();
const vapidKey = "BCGyRZVIxHmasEQWfF5iCzxe1gLyIppQynZlyPm_BXPHWnv4xzxZwEjo9PuJbbk5Gi8ywLVXSxAYxcgt2QsmHVE";

// ======== FCM TOKEN MANAGEMENT ========
async function saveFCMTokenToFirestore(fcmToken) {
  const user = auth.currentUser;
  if (!user) {
    console.log('User not authenticated');
    return;
  }

  try {
    await firestore.collection('users').doc(user.uid).update({ fcmToken });
    console.log('FCM token saved for user:', user.uid);
  } catch (error) {
    console.error('Error saving token:', error);
  }
}

// ======== NOTIFICATION PERMISSION & TOKEN ========
async function requestAndSaveFCMToken() {
  try {
    const token = await messaging.getToken({ vapidKey });
    if (token) {
      console.log('FCM Token:', token);
      await saveFCMTokenToFirestore(token);
    }
  } catch (error) {
    console.error('Token error:', error);
  }
}

// ======== SEND NOTIFICATIONS ========
async function sendPushNotification(title, body) {
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
  }
}

// ======== NOTIFICATION SETUP & INITIALIZATION ========
async function setupNotifications() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return;
  }

  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered');

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      await requestAndSaveFCMToken();
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Initialize on app load
setupNotifications();

// ======== EXPORTS ========
export { setupNotifications, sendPushNotification };
