// firebase.config.js (Revised)

// ====== FIREBASE CONFIG ======
self.firebaseConfig = { // <-- ADD THIS LINE
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  authDomain: "pet-health-tracker-7164d.firebaseapp.com",
  projectId: "pet-health-tracker-7164d",
  storageBucket: "pet-health-tracker-7164d.firebasestorage.app",
  messagingSenderId: "251170885789",
  appId: "1:251170885789:web:2c16a20f96da9f6a960474",
  measurementId: "G-GKD3RVNVLV"
};

// ====== INITIALIZE FIREBASE ======
firebase.initializeApp(firebaseConfig);

// ====== INITIALIZE SERVICES ======
const auth = firebase.auth(); // No need for 'app' parameter
const db = firebase.firestore(); // Direct access via global firebase
const messaging = firebase.messaging();

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
