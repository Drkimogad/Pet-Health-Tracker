importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "pet-health-tracker-7164d.firebaseapp.com",
  projectId: "pet-health-tracker-7164d",
  storageBucket: "pet-health-tracker-7164d.appspot.com",
  messagingSenderId: "251170885789",
  appId: "1:251170885789:web:2c16a20f96da9f6a960474",
  measurementId: "G-GKD3RVNVLV"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  return self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: '/icons/pet-icon-192x192.png',
      data: payload.data
    }
  );
});
