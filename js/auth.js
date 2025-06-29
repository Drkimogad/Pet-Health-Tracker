'use strict';

// ======== GLOBAL VARIABLES 🌟========
let editingProfileId = null;
let auth, firestore, googleAuthProvider;
let petDB;
let profile;

// clodinary declaration 
const CLOUDINARY_CONFIG = {
  cloudName: 'dh7d6otgu',
  uploadPreset: 'PetStudio'
};
// ====== UI HELPERS ======
function showLoading(show) {
  const loader = document.getElementById("processing-loader");
  if (!loader) {
    console.warn("⚠️ 'processing-loader' element not found.");
    return;
  }
  loader.style.display = show ? "block" : "none";
}

function disableUI() {
  document.body.innerHTML = `
    <h1 style="color: red; padding: 2rem; text-align: center">
      Critical Error: Failed to load application interface
    </h1>
  `;
}
// ========== FIREBASE INITIALIZATION ==========
const firebaseConfig = {
  apiKey: "AIzaSyAy2ObF1WWPurBa3TZ_AbBb00o80ZmlLAo",
  authDomain: "pet-health-tracker-4ec31.firebaseapp.com",
  projectId: "pet-health-tracker-4ec31",
  storageBucket: "pet-health-tracker-4ec31.firebasestorage.app",
  messagingSenderId: "123508617321",
  appId: "1:123508617321:web:6abb04f74ce73d7d4232f8",
  measurementId: "G-7YDDLF95KR"
};

firebase.initializeApp(firebaseConfig);
auth = firebase.auth();
firestore = firebase.firestore();
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
