'use strict';
// GLOBAL DECLARATIONS - AUTH-INITIALIZATION
const CLOUDINARY_CONFIG = {
  cloudName: 'dh7d6otgu',
  uploadPreset: 'PetStudio'
};
// 🔶 GLOBAL DECLARATIONS🔶🔶🔶
let auth = null;
let provider = null;
let isSignupInProgress = false;
// 🔶 State Management🔶🔶🔶
const VALID_ORIGINS = [
  'https://drkimogad.github.io',
  'https://drkimogad.github.io/Pet-Health-Tracker'
];
// Runtime origin check
if (!VALID_ORIGINS.includes(window.location.origin)) {
  window.location.href = 'https://drkimogad.github.io/Pet-Health-Tracker';
}
// HELPER FUNCTION DISABLE UI    
function disableUI() {
  document.body.innerHTML = `
    <h1 style="color: red; padding: 2rem; text-align: center">
      Critical Error: Failed to load application interface
    </h1>
  `;
}
// DOM Elements - Initialize as null first
const DOM = {
  authContainer: null,
  signupPage: null,
  loginPage: null,
  dashboard: null,
  processingLoader: document.getElementById('processing-loader') // For showLoading()
};

// Initialize DOM elements when page loads
// ===== Initialize DOM Elements =====
function initDOMReferences() {
  // Get elements safely
  DOM.authContainer = document.getElementById("authContainer");
  DOM.dashboard = document.getElementById("dashboard");
  
  // Check if elements exist
  if (!DOM.authContainer || !DOM.dashboard) {
    console.warn("DOM elements not found - will retry");
    setTimeout(initDOMReferences, 100); // Retry after 100ms
    return false;
  }
  
  console.log("✅ DOM references initialized.");
  return true;
}
// show loading function
function showLoading(show) {
 const loader = DOM.processingLoader;
  if (!loader) {
    console.warn("⛔ 'processing-loader' element not found.");
    return;
  }
  if (show) {
    loader.classList.remove("hidden");
    loader.style.display = "block";
  } else {
    loader.classList.add("hidden");
    loader.style.display = "none";
  }
}

// ===== DOM Ready: Initialize Everything =====
document.addEventListener("DOMContentLoaded", () => {
  const domReady = initDOMReferences();
  if (!domReady) return;
// Initialize login button and other startup logic
  if (typeof setupGoogleLoginButton === "function") {
    setupGoogleLoginButton();
  } else {
    console.warn("⚠️ setupGoogleLoginButton() not found.");
  }
  // If needed, add more initializations here
  initializeAuth();
});
// ====== Core Functions ======
function showDashboard() {
  console.log("🚪 Entered showDashboard()");

  // ✅ Use live memory if available, else fallback to localStorage
  let localProfiles = window.petProfiles || JSON.parse(localStorage.getItem("petProfiles")) || [];

  // ✅ Restore to window for consistency
  window.petProfiles = localProfiles;

  // ✅ Log for debugging
  console.log("🧠 Restored petProfiles in showDashboard:", localProfiles);
  console.log("🧠 petProfiles length:", localProfiles.length);
  console.log("📦 petProfiles:", localProfiles);

  // ✅ Render pet cards if available
  if (localProfiles.length > 0 && DOM.petList) {
    DOM.petList.classList.remove('hidden');
    renderProfiles();
  } else {
    console.log("ℹ️ No profiles to render in showDashboard");
  }

  // ✅ Final UI toggles
  if (!DOM.authContainer || !DOM.dashboard) {
    console.error("DOM elements not ready in showDashboard");
    return;
  }

  DOM.authContainer.classList.add('hidden');
  DOM.dashboard.classList.remove('hidden');

  if (DOM.addPetProfileBtn) DOM.addPetProfileBtn.classList.remove('hidden');
  if (DOM.fullPageBanner) DOM.fullPageBanner.classList.remove('hidden');
  if (DOM.mainContent) DOM.mainContent.classList.add('hidden');
}
// ====== Google Sign-In Initialization ======
function setupGoogleLoginButton() {
  // Check if Google and Firebase are loaded
  if (typeof google === 'undefined' || !google.accounts || typeof firebase === 'undefined') {
    console.log("Waiting for libraries to load...");
    setTimeout(setupGoogleLoginButton, 300);
    return;
  } 
  const CLIENT_ID = '175545140523-ufts7k2laidsobihlqnpf7q0m63h3abo.apps.googleusercontent.com';
  try {
    // Initialize Google Identity Services
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
callback: async (response) => {
  showLoading(true);
  try {
    const credential = firebase.auth.GoogleAuthProvider.credential(response.credential);
    const userCredential = await firebase.auth().signInWithCredential(credential);
    await userCredential.user.getIdToken(true); // Force token refresh
    showDashboard();
  } catch (error) {
    console.error("Google Sign-In failed:", error);
   showAuthError("Google Sign-In failed. Please try again."); // From utils.js

  } finally {
    showLoading(false);
  }
}
    }); 
// Render button if container exists
    const googleButtonContainer = document.getElementById("googleSignInBtn");
    if (googleButtonContainer) {
      google.accounts.id.renderButton(googleButtonContainer, {
        type: "standard",
        theme: "filled_blue",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 250
      });  
  // ✅ Avoid popup if already signed in
    if (!firebase.auth().currentUser) {
      google.accounts.id.prompt();
   } 
  }
  } catch (error) {
    console.error("Google Sign-In setup failed:", error);
  }
}
// ====== Firebase Integration ======
// ====== Firebase Initialization ======
function initializeFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyAy2ObF1WWPurBa3TZ_AbBb00o80ZmlLAo",
    authDomain: "pet-health-tracker-4ec31.firebaseapp.com",
    projectId: "pet-health-tracker-4ec31",
    storageBucket: "pet-health-tracker-4ec31.firebasestorage.app",
    messagingSenderId: "123508617321",
    appId: "1:123508617321:web:6abb04f74ce73d7d4232f8",
    measurementId: "G-7YDDLF95KR"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return firebase.auth();
}
// ====== Auth State Listener ======
function initAuthListeners() {
  firebase.auth().onAuthStateChanged(async (user) => {
    const authContainer = document.getElementById('authContainer');
    const mainContent = document.getElementById('mainContent');
    
    if (user) {
      authContainer.classList.add('hidden');
      mainContent.classList.remove('hidden');
      
      try {
        const snapshot = await firebase.firestore().collection("profiles").where("userId", "==", user.uid).get();
        window.petProfiles = snapshot.docs.map(doc => doc.data());
        localStorage.setItem("petProfiles", JSON.stringify(window.petProfiles));
        showDashboard();
      } catch (error) {
        console.error("Profile load error:", error);
      }
    } else {
      authContainer.classList.remove('hidden');
      mainContent.classList.add('hidden');
      setupGoogleLoginButton();
    }
  });
}
// ====== Core Initialization ======
async function initializeAuth() {
  try {
    // 1. First make sure DOM is ready
    if (!initDOMReferences()) {
      throw new Error("Critical DOM elements missing");
    }    
    // 2. Wait for Firebase to load
    if (typeof firebase === 'undefined') {
      await new Promise(resolve => {
        const checkFirebase = setInterval(() => {
          if (typeof firebase !== 'undefined') {
            clearInterval(checkFirebase);
            resolve();
          }
        }, 100);
      });
    }    
    // 3. Initialize Firebase Auth
    auth = await initializeFirebase();
    console.log("✅ Auth object received:", auth);
    console.log("Type of onAuthStateChanged:", typeof auth.onAuthStateChanged);

    // ✅ Set persistence before attaching listener
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    console.log("🔐 Firebase auth persistence set to LOCAL");
    
    // 4. Set up auth state listener
    initAuthListeners(auth);  
    // 5. Set up Google Sign-In button (if exists)
    if (document.getElementById("googleSignInBtn")) {
      setupGoogleLoginButton();
    }    
  } catch (error) {
    console.error("Auth initialization failed:", error);
    disableUI();
  }
}
// Start initialization when everything is ready
document.addEventListener('DOMContentLoaded', function() {
  // Additional check for Firebase
  if (typeof firebase === 'undefined') {
    console.error("Firebase not loaded yet");
    // You might want to add retry logic here
  }
  initializeAuth();
});
