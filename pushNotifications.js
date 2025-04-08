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

//---------------- Request permission and save FCM token (with retry logic)
async function requestAndSaveFCMToken() {
  try {
    // Register ONLY Firebase messaging SW
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js', 
      { scope: '/firebase-cloud-messaging-push-scope' } // Firebase's required scope
    );
    
    console.log('Firebase SW registered:', registration);

    // Now get the token
    const token = await messaging.getToken({ 
      vapidKey,
      serviceWorkerRegistration: registration // Explicitly use this SW
    });
    
    if (token) {
      console.log('FCM token:', token);
      await saveFCMTokenToFirestore(token);
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
}

// Send a push notification manually
async function sendPushNotification(token, { title, body }) {
  const authToken = await getAccessToken(); // Use Firebase Admin SDK or OAuth2
  const projectId = "pet-health-tracker-7164d";

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` // OAuth2 token
      },
      body: JSON.stringify({
        message: {
          token: token,
          notification: { title, body }
        }
      })
    }
  );
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
