

<script>

  // Initialize Firebase App (using the compatibility API)

  const app = firebase.initializeApp({

    apiKey: "AIzaSyB42agDYdC2-LF81f0YurmwiDmXptTpMVw",

    authDomain: "swiftreach2025.firebaseapp.com",

    projectId: "swiftreach2025",

    storageBucket: "swiftreach2025.firebasestorage.app",

    messagingSenderId: "540185558422",

    appId: "1:540185558422:web:d560ac90eb1dff3e5071b7",

    measurementId: "G-SNBPRVBPNM"

  });



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
