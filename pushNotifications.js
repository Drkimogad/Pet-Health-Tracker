/* eslint-disable no-undef, no-console */

// ======== FIREBASE CONFIGURATION ========
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  projectId: "pet-health-tracker-7164d",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ======== SERVICE REFERENCES ========
const auth = firebase.auth();
const firestore = firebase.firestore();
const messaging = firebase.messaging();
const vapidKey = "YOUR_VAPID_KEY_HERE";

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
    if (!('Notification' in window)) {
      alert('This browser doesn't support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const token = await messaging.getToken({ vapidKey });
    if (token) {
      console.log('FCM Token:', token);
      await saveFCMTokenToFirestore(token);
    }
  } catch (error) {
    console.error('Token error:', error);
  }
}

// ======== SEND NOTIFICATIONS (BASIC) ========
async function sendPushNotification(token, { title, body }) {
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${vapidKey}`
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body }
      })
    });
    
    console.log('Notification sent:', await response.json());
  } catch (error) {
    console.error('Notification failed:', error);
  }
}

// ======== INITIALIZE ON LOAD ========
function setupNotifications() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(() => {
        console.log('Firebase SW registered');
        requestAndSaveFCMToken();
      })
      .catch(err => console.error('SW registration failed:', err));
  } else {
    console.warn('Service workers not supported');
  }
}

// Start immediately
setupNotifications();

// ======== EXPORTS (IF NEEDED) ========
export { setupNotifications, sendPushNotification };
