// GLOBAL DECLARATIONS - AUTH-INITIALIZATION
const CLOUDINARY_CONFIG = {
  cloudName: 'dh7d6otgu',
  uploadPreset: 'PetHealthTracker_auto_folder'
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
// DOM Elements - Initialize as null first
const auth_DOM = {
  authContainer: null,
  signupPage: null,
  loginPage: null,
  dashboard: null,
};

// Initialize DOM elements when page loads
// ===== Initialize DOM Elements =====
function initDOMReferences() {
  // auth elements
  auth_DOM.processingLoader = document.getElementById('processing-loader');
  auth_DOM.authContainer = document.getElementById("authContainer");
  auth_DOM.googleSignInBtnWrapper = document.getElementById("googleSignInBtnWrapper");
  auth_DOM.fullPageBanner = document.getElementById("fullPageBanner");
  // dashboard elements
  auth_DOM.dashboard = document.getElementById("dashboard");
  auth_DOM.addPetProfileBtn = document.getElementById("addPetProfileBtn");
  auth_DOM.petList = document.getElementById("petList"); // Add this too if used in rendering
  auth_DOM.savedProfilesList = document.getElementById('savedProfilesList');
  auth_DOM.logoutButton = document.getElementById("logoutButton");
 
// Keep this inside the function
  if (!auth_DOM.authContainer || !auth_DOM.dashboard) {
    console.error("❌ Critical dashboard elements missing!");
    if (typeof disableUI === "function") disableUI();
    return false;
  }
  console.log("✅ DOM references initialized.");
  return true;
}

// show loading function only for authentication
function showLoading(show, message = "Loading...") {
  const loader = auth_DOM.processingLoader;
  const msgEl = document.getElementById("auth-loader-message");

  if (!loader) return;

  if (show) {
    loader.style.display = "block";
    if (msgEl) msgEl.textContent = message;
  } else {
    loader.style.display = "none";
  }
}

// ===== DOM Ready: Initialize Everything =====
document.addEventListener("DOMContentLoaded", () => {
  const domReady = initDOMReferences();
  if (!domReady) return;
  
  // ✅ Let initializeAuth handle everything
  initializeAuth();
});
// ====== Core Functions ======
// ✅ Show Dashboard after successful login
function showDashboard() {
  console.log("🚪 Entered showDashboard()");

  // 🔒 Hide sign-in related elements
  if (auth_DOM.googleSignInBtnWrapper) auth_DOM.googleSignInBtnWrapper.classList.add("hidden");
  if (auth_DOM.fullPageBanner) auth_DOM.fullPageBanner.classList.add("hidden");
  if (auth_DOM.authContainer) auth_DOM.authContainer.classList.add("hidden");

  // ✅ Show dashboard elements after sucessful signin
  if (auth_DOM.dashboard) auth_DOM.dashboard.classList.remove("hidden");
   // ✅ Always show addpetprofilebtn
  if (auth_DOM.addPetProfileBtn) auth_DOM.addPetProfileBtn.classList.remove("hidden");
 // ✅ Always show petList form when is called.
  if (auth_DOM.petList) auth_DOM.petList.classList.add("hidden");
  // ✅ Show the saved profiles section (even if empty)
  if (auth_DOM.savedProfilesList) auth_DOM.savedProfilesList.classList.remove("hidden");
  // ✅ Show logout button
  if (auth_DOM.logoutButton) auth_DOM.logoutButton.style.display = "block";

  // 🧠 Restore pet profiles
  let localProfiles = window.petProfiles || JSON.parse(localStorage.getItem("petProfiles")) || [];
  window.petProfiles = localProfiles;

  console.log("🧠 Restored petProfiles in showDashboard:", localProfiles);
  console.log("🧠 petProfiles length:", localProfiles.length);
  console.log("📦 petProfiles:", localProfiles);
  
// 🐾 Render profiles if they exist
if (localProfiles.length > 0 ) {
   loadSavedPetProfile();
  
  } else {
  
 auth_DOM.savedProfilesList.innerHTML = `
<li class="no-profiles-msg" style="text-align:center; font-style: italic; color: #666;">
   No saved pet profiles yet 🐶🐱🐦🐰🐢...
  </li>`;
    console.log("ℹ️ No profiles to render in showDashboard");
  }
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
showLoading(true, "Signing you in...");
  
  try {
    const credential = firebase.auth.GoogleAuthProvider.credential(response.credential);
    const userCredential = await firebase.auth().signInWithCredential(credential);
    await userCredential.user.getIdToken(true); // Force token refresh
   console.log("✅ Sign-in complete. Waiting for auth state listener to handle dashboard rendering.");
    
  } catch (error) {
    console.error("Google Sign-In failed:", error);
   showErrorToUser("Google Sign-In failed. Please try again."); // From utils.js

  } finally {
    showLoading(false);
  }
}
    }); 
// Render button if container exists
    const googleButtonContainer = document.getElementById("googleSignInButton");
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

  // 🔹 Initialize Firebase app if not already done
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // 🔹 REMOVE callable function initialization - COMMENT OUT OR DELETE
  /*
  try {
    const functions = firebase.app().functions("us-central1");
    window.deleteImageFn = functions.httpsCallable("deleteImage");
    console.log("✅ deleteImageFn initialized and ready.");
  } catch (err) {
    console.error("❌ Failed to initialize deleteImageFn:", err);
  }
  */

  console.log("✅ Firebase initialized (HTTP functions mode)");

  // Return auth instance for use elsewhere
  return firebase.auth();
}


// ====== Auth State Listener ======
function initAuthListeners() {
  firebase.auth().onAuthStateChanged(async (user) => {
    const authContainer = document.getElementById('authContainer');
    const dashboard = document.getElementById('dashboard');

    if (user) {
      authContainer.classList.add('hidden');
      dashboard.classList.remove('hidden');

      try {
        const snapshot = await firebase.firestore().collection("profiles").where("userId", "==", user.uid).get();
        window.petProfiles = snapshot.docs.map(doc => doc.data());

        // ✅ Save to localStorage (fallback)
        localStorage.setItem("petProfiles", JSON.stringify(window.petProfiles));

        // ✅ Now render profiles from storage
       if (typeof loadSavedPetProfile === 'function') {
       await loadSavedPetProfile(); // wait until data is rendered
        }
       if (typeof showDashboard === 'function') {
        showDashboard(); // now dashboard sees data
       }
        
      } catch (error) {
        console.error("Profile load error:", error);
        showErrorToUser("Couldn't load saved profiles");
      }

    } else {
      authContainer.classList.remove('hidden');
      dashboard.classList.add('hidden');
      setupGoogleLoginButton();
    }
  });
}

// MVED FUNCTIONS FROM UTILS.JS
// Show error message to user
function showErrorToUser(message, isSuccess = false) {
  try {
    const errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
      const newErrorDiv = document.createElement('div');
      newErrorDiv.id = 'error-message';
      newErrorDiv.className = isSuccess ? 'success-message' : 'auth-error';
      newErrorDiv.textContent = message;
      document.querySelector('#authContainer').prepend(newErrorDiv);
    } else {
      errorDiv.textContent = message;
      errorDiv.className = isSuccess ? 'success-message' : 'auth-error';
    }
  } catch (fallbackError) {
    alert(message);
  }
}
// Show the sign-in form
// ✅ Show Authentication Form
function showAuthForm() {
  console.log("🧭 Showing auth UI");

  // ✅ Ensure all auth-related UI is visible
  if (auth_DOM.authContainer) auth_DOM.authContainer.classList.remove("hidden");
  if (auth_DOM.googleSignInBtnWrapper) auth_DOM.googleSignInBtnWrapper.classList.remove("hidden");
  if (auth_DOM.fullPageBanner) auth_DOM.fullPageBanner.classList.remove("hidden");

  // ❌ Hide dashboard and logout
  if (auth_DOM.dashboard) auth_DOM.dashboard.classList.add("hidden");
  if (auth_DOM.logoutButton) auth_DOM.logoutButton.style.display = "none";
}

// Show user email info
function showUserInfo(user) {
  const emailEl = document.getElementById('userEmail');
  if (emailEl && user?.email) {
    emailEl.textContent = user.email;
  }
}
// Disable all UI on fatal error
function disableUI() {
  document.body.innerHTML = `
    <h1 style="color: red; padding: 2rem; text-align: center">
      Critical Error: Failed to load application interface
    </h1>
  `;
}
//=================================
// Showsuccessnotification
//=================================
// Keep existing success function (unchanged)
function showSuccessNotification(message) {
  showErrorToUser(message, true);
}
window.showSuccessNotification = showSuccessNotification;

// Fix error function (only corrected syntax)
function showErrorNotification(message) {
  showErrorToUser(message, false); // Removed stray 'isSuccess'
}
window.showErrorNotification = showErrorNotification;

// Firebase accessors (optional to move)
function getAuth() {
  return firebase.auth();
}
function getFirestore() {
  if (!firestore) console.warn("Firestore not initialized - using localStorage fallback");
  return firestore;
}
// logoutbutton logic
function setupLogout() {
  if (auth_DOM.logoutButton) {
    auth_DOM.logoutButton.addEventListener('click', async () => {
      try {
        await firebase.auth().signOut();
        console.log("👋 User signed out"); // IN CONSOLE FOR NOW
        window.location.reload(); // Reset app state
      } catch (error) {
        console.error("Logout failed:", error);
        showErrorToUser("Logout failed. Please try again.");
      }
    });
  }
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
    if (document.getElementById("googleSignInButton")) {
      setupGoogleLoginButton();
    }

    // ✅ Add logout listener after auth is ready
    if (typeof setupLogout === "function") {
      setupLogout();
    }

  } catch (error) {
    console.error("Auth initialization failed:", error);
    disableUI();
  }
}
