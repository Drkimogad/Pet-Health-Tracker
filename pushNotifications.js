// Initialize Firebase services using global `firebase` object
const messaging = firebase.messaging();
const vapidKey = 'BCGyRZVIxHmasEQWfF5iCzxe1gLyIppQynZlyPm_BXPHWnv4xzxZwEjo9PuJbbk5Gi8ywLVXSxAYxcgt2QsmHVE'; // ⚠️ Add your key here

async function requestAndSaveFCMToken() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const token = await messaging.getToken({ vapidKey: vapidKey });
      if (token) {
        console.log('FCM token:', token);
        await saveFCMTokenToFirestore(token);
      } else {
        console.log('No FCM token received.');
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function saveFCMTokenToFirestore(fcmToken) {
  const user = firebase.auth().currentUser; // Use global auth
  const db = firebase.firestore(); // Use global firestore

  if (user) {
    try {
      await db.collection('users').doc(user.uid).update({
        fcmToken: fcmToken
      });
      console.log('FCM token saved to Firestore for user:', user.uid);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  } else {
    console.log('User not authenticated.');
  }
}

// Handle incoming messages (foreground)
messaging.onMessage((payload) => {
  console.log('New notification:', payload);
  if (payload.notification) {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: '/icons/icon-192x192.png' // Update path if needed
    });
  }
});

// Initialize notifications when the app loads
function setupNotifications() {
  requestAndSaveFCMToken();
}
