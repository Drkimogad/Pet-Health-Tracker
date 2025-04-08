const auth = firebase.auth();
const firestore = firebase.firestore();

// Initialize Firebase services using global `firebase` object
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

// Add retry logic for token refresh
async function requestAndSaveFCMToken() {
  try {
    const token = await messaging.getToken({ vapidKey });
    if (token) {
      console.log('FCM token:', token);
      await saveFCMTokenToFirestore(token);
      // Add periodic token refresh (optional)
      setInterval(async () => {
        const newToken = await messaging.getToken({ vapidKey });
        if (newToken !== token) {
          await saveFCMTokenToFirestore(newToken);
        }
      }, 604800000); // Refresh every 7 days
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
}

//* Required Helper Function (Add to pushNotifications.js)*//
export async function sendPushNotification(token, { title, body }) {
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

// ====== FCM TOKEN HANDLING ======
// Move this to pushNotifications.js if needed!
messaging.getToken({ vapidKey: "BCGyRZVIxHmasEQWfF5iCzxe1gLyIppQynZlyPm_BXPHWnv4xzxZwEjo9PuJbbk5Gi8ywLVXSxAYxcgt2QsmHVE" })
  .then((currentToken) => {
    if (currentToken) console.log('FCM token:', currentToken);
    else console.log('No token available');
  })
  .catch((err) => {
    console.error('Token error:', err);
  });

console.log("Firebase services initialized");


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
setupNotifications();
export { requestAndSaveFCMToken, saveFCMTokenToFirestore, sendPushNotification, setupNotifications };
