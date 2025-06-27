'use strict';

// ========== GLOBALS ==========
let auth, firestore, storage, googleAuthProvider;
let petDB;
let editingProfileId = null;
let profile;

// ========== FIREBASE INITIALIZATION ==========
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
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
googleAuthProvider = new firebase.auth.GoogleAuthProvider();

// ========== DOM READY ==========
document.addEventListener('DOMContentLoaded', () => {
  setupAuthFormSwitchers();
  setupGoogleSignIn();

  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('mainContent');
  const logoutButton = document.getElementById('logoutButton');

  // Monitor auth state
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
          switchAuthForm('login');
        }
      });

      window.addEventListener('beforeunload', () => unsubscribe());
    })
    .catch((error) => {
      console.error("Auth persistence error:", error);
      authSection.style.display = 'block';
      switchAuthForm('login');
    });
});

// ========== GOOGLE SIGN-IN ==========
function setupGoogleSignIn() {
  const googleBtn = document.getElementById('GoogleSignInBtn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const result = await auth.signInWithPopup(googleAuthProvider);
        const user = result.user;
        console.log('Signed in as:', user.displayName);
        showSystemMessage?.(`Welcome, ${user.displayName}`);
      } catch (error) {
        console.error('Google Sign-In Error:', error);
        showAuthError?.(error.message);
      }
    });
  }

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await auth.signOut();
        showSystemMessage?.("You’ve been signed out");
      } catch (error) {
        console.error('Sign-out error:', error);
        showAuthError?.(error.message);
      }
    });
  }
}

// ========== FORM SWITCHING ==========
function setupAuthFormSwitchers() {
  addSafeListener?.('showLogin', (e) => {
    e.preventDefault();
    switchAuthForm('login');
  });

  addSafeListener?.('showSignUp', (e) => {
    e.preventDefault();
    switchAuthForm('signUp');
  });
}

function switchAuthForm(targetForm) {
  document.getElementById('signUpForm')?.classList.remove('active');
  document.getElementById('loginForm')?.classList.remove('active');
  const formElement = document.getElementById(`${targetForm}Form`);
  if (formElement) {
    formElement.classList.add('active');
    formElement.querySelector('form')?.reset();
  }
}
