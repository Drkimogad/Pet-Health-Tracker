<script>
  
  // Initialize Firebase App (using the compatibility API) //
const firebaseConfig = {
            apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
            authDomain: "pet-health-tracker-7164d.firebaseapp.com",
            projectId: "pet-health-tracker-7164d",
            storageBucket: "pet-health-tracker-7164d.firebasestorage.app",
            messagingSenderId: "251170885789",
            appId: "1:251170885789:web:2c16a20f96da9f6a960474",
            measurementId: "G-GKD3RVNVLV"
        };

        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const firestore = firebase.firestore();
        const messaging = firebase.messaging();

  // Firestore Database Setup  
  const db = firebase.firestore(app);  // Initialize Firestore
  console.log("Firestore initialized and ready to use.");
  // Firebase Authentication Setup  
  const auth = firebase.auth(app);  // Initialize Firebase Authentication
  console.log("Authentication service initialized.");
  // Firebase Cloud Messaging Setup  
  const messaging = firebase.messaging(app);  // Initialize Messaging
  console.log("Firebase Cloud Messaging initialized.");
  // Set VAPID key and handle token generation
  messaging.getToken({ vapidKey: "BAL7SL85Z3cAH-T6oDGvfxV0oJhElCpnc7F_TaF2RQogy0gnUChGa_YtmwKdifC4c4pZ0NhUd4T6BFHGRxT79Gk" })
    .then((currentToken) => {
      if (currentToken) {
        console.log('Got FCM device token:', currentToken);
        // Send the token to your server and update the UI if necessary
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    })
    .catch((err) => {
      console.error('An error occurred while retrieving token: ', err);
    });
</script>
