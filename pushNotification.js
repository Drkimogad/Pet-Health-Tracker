import { initializeApp, getApp } from 'firebase/app'; // Import getApp
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Assuming you have your Firebase configuration in a separate config.js file
import firebaseConfig from './config';

// Initialize Firebase app if not already initialized
let app;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}

const messaging = getMessaging(app);
const vapidKey = 'YOUR_VAPID_KEY'; // Replace with your actual VAPID key

async function requestAndSaveFCMToken() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const token = await getToken(messaging, { vapidKey: vapidKey });
      if (token) {
        console.log('FCM registration token:', token);
        await saveFCMTokenToFirestore(token);
      } else {
        console.log('No FCM token received.');
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('Error requesting permission or getting token:', error);
  }
}

async function saveFCMTokenToFirestore(fcmToken) {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  if (user) {
    const userDocRef = doc(db, 'users', user.uid); // Assuming 'users' is your user collection
    try {
      await updateDoc(userDocRef, {
        fcmToken: fcmToken
      });
      console.log('FCM token saved to Firestore for user:', user.uid);
    } catch (error) {
      console.error('Error saving FCM token to Firestore:', error);
    }
  } else {
    console.log('User is not currently authenticated.');
  }
}

// Call this function to initiate the process of requesting permission and saving the token
export function setupNotifications() {
  requestAndSaveFCMToken();
}

// Optional: Listen for foreground messages
onMessage(messaging, (payload) => {
  console.log('Message received in foreground:', payload);
  // Handle the notification display here (e.g., using a custom UI or `new Notification()`)
  if (payload.notification) {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/icons/icon-192x192.png', // Adjust path as needed
    };
    new Notification(notificationTitle, notificationOptions);
  }
});
