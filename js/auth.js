'use strict';

// ========== GLOBALS ==========
let auth, firestore, storage;
let petDB;
let editingProfileId = null;
let profile;

// ========== FIREBASE INITIALIZATION ==========
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
auth = firebase.auth();
firestore = firebase.firestore();
storage = firebase.storage();

// ========== GOOGLE SIGN-IN (GSI V2) ==========
window.handleCredentialResponse = async function (response) {
  const idToken = response.credential;

  try {
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    const result = await auth.signInWithCredential(credential);
    const user = result.user;

    console.log('Signed in as:', user.displayName);
    showSystemMessage?.(`Welcome, ${user.displayName}`);
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    showAuthError?.(error.message || 'Sign-in failed');
  }
};

// ========== AUTH STATE LISTENER ==========
document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('authContainer');
  const mainContent = document.getElementById('mainContent');
  const logoutButton = document.getElementById('logoutButton');

  // Sign out handler
  logoutButton?.addEventListener('click', async () => {
    try {
      await auth.signOut();
      showSystemMessage?.("You’ve been signed out.");
    } catch (error) {
      console.error('Sign-out error:', error);
      showAuthError?.(error.message);
    }
  });

  // Listen to auth state
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          authSection.style.display = 'none';
          mainContent.style.display = 'block';
          logoutButton.style.display = 'block';

          const notificationsReady = await setupNotifications?.();
          if (notificationsReady) {
            await sendPushNotification?.('Welcome Back!', 'Your pet profiles are ready');
          }

          await loadSavedPetProfile?.();
        } else {
          authSection.style.display = 'block';
          mainContent.style.display = 'none';
          logoutButton.style.display = 'none';
        }
      });

      window.addEventListener('beforeunload', () => unsubscribe());
    })
    .catch((error) => {
      console.error("Auth persistence error:", error);
      authSection.style.display = 'block';
    });
});
