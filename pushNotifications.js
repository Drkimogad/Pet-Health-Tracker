const auth = firebase.auth();
const firestore = firebase.firestore();
const messaging = firebase.messaging();
const vapidKey = 'BCGyRZVIxHmasEQWfF5iCzxe1gLyIppQynZlyPm_BXPHWnv4xzxZwEjo9PuJbbk5Gi8ywLVXSxAYxcgt2QsmHVE';

// Save FCM token to Firestore
async function saveFCMTokenToFirestore(fcmToken) {
  const user = auth.currentUser;
  const db = firestore;

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

// Request permission and save FCM token (with retry logic)
async function requestAndSaveFCMToken() {
  try {
    const token = await messaging.getToken({ vapidKey });
    if (token) {
      console.log('FCM token:', token);
      await saveFCMTokenToFirestore(token);

      // Refresh token every 7 days
      setInterval(async () => {
        const newToken = await messaging.getToken({ vapidKey });
        if (newToken !== token) {
          await saveFCMTokenToFirestore(newToken);
        }
      }, 604800000); // 7 days in ms
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
}

// Send a push notification manually
async function sendPushNotification(token, { title, body }) {
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `key=${process.env.FCM_SERVER_KEY}`
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body }
    })
  });

  if (!response.ok) {
    throw new Error(`FCM error: ${response.statusText}`);
  }
}

// Get and log current token
messaging.getToken({ vapidKey })
  .then((currentToken) => {
    if (currentToken) console.log('FCM token:', currentToken);
    else console.log('No token available');
  })
  .catch((err) => {
    console.error('Token error:', err);
  });

console.log("Firebase services initialized");

// Handle foreground messages
messaging.onMessage((payload) => {
  console.log('New notification:', payload);
  if (payload.notification) {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: './icons/icon-192x192.png'
    });
  }
});

// Call notification setup on load
function setupNotifications() {
  requestAndSaveFCMToken();
}
setupNotifications();

export {
  requestAndSaveFCMToken,
  saveFCMTokenToFirestore,
  sendPushNotification,
  setupNotifications
};
