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
firebase.initializeApp(self.firebaseConfig); // <-- Use the global config
const auth = firebase.auth();
const db = firebase.firestore();
const messaging = firebase.messaging();

