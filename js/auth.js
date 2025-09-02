// GLOBAL DECLARATIONS - AUTH-INITIALIZATION
const CLOUDINARY_CONFIG = {
  cloudName: 'dh7d6otgu',
  uploadPreset: 'PetHealthTracker_auto_folder'
};
// 🔶 GLOBAL DECLARATIONS🔶🔶🔶
let auth = null;
let provider = null;
let isSignupInProgress = false;

// Make these global for notification system 
window.showSuccessNotification = showSuccessNotification;
window.showErrorNotification = showErrorNotification;
window.showErrorToUser = showErrorToUser;


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
function showLoading(show, message = "Loading your app") {
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
showLoading(true, "Loading your app");
  
  try {
    const credential = firebase.auth.GoogleAuthProvider.credential(response.credential);
    const userCredential = await firebase.auth().signInWithCredential(credential);
    await userCredential.user.getIdToken(true); // Force token refresh
   console.log("✅ Sign-in complete. Waiting for auth state listener to handle dashboard rendering.");
    
  } catch (error) {
    console.error("Google Sign-In failed:", error);
   showErrorToUser("Google Sign-In failed. Please try again."); // From utils.js
   showLoading(false); // moved inside the catch for smoother UI
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
        // ✅ Hide loader only after dashboard is fully set up
        showLoading(false);
        
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
// ===== IMPROVED NOTIFICATION SYSTEM =====
function showErrorToUser(message, type = "error") {
    console.log("📢 Attempting to show notification:", message, type); // ← ADD THIS LINE
  try {
    // CREATE NEW ELEMENT EACH TIME
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification'; // ← Use CLASS instead of ID
    
    // Set styles FIRST
    notificationDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px 30px;
      border-radius: 12px;
      z-index: 10002; /* ← HIGHER THAN MODAL */
      max-width: 80%;
      text-align: center;
      font-weight: bold;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
      display: block; /* ← ADD THIS */
    `;

    // Set content and colors
    notificationDiv.textContent = message;

    // 🎨 Color scheme
    if (type === "success") {
      notificationDiv.style.backgroundColor = "rgba(76, 175, 80, 0.95)"; 
      notificationDiv.style.color = "white";
      notificationDiv.style.border = "2px solid #4CAF50";
    } else if (type === "info") {
      notificationDiv.style.backgroundColor = "rgba(255, 193, 7, 0.95)";
      notificationDiv.style.color = "black";
      notificationDiv.style.border = "2px solid #FFC107";
    } else if (type === "error"){
      notificationDiv.style.backgroundColor = "rgba(244, 67, 54, 0.95)";
      notificationDiv.style.color = "white";
      notificationDiv.style.border = "2px solid #f44336";
    } else if (type === "fallback") {
      notificationDiv.style.backgroundColor = "rgba(173, 216, 230, 0.95)";
      notificationDiv.style.color = "black";
      notificationDiv.style.border = "2px solid #ADD8E6";
    }

    // Accessibility
    notificationDiv.setAttribute("role", "alert");
    notificationDiv.setAttribute("aria-live", "assertive");

    // ✅ ADD TO DOM AFTER ALL STYLES ARE SET
    document.body.appendChild(notificationDiv);
         console.log("✅ Notification created and appended to body"); // ← ADD THIS LINE

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notificationDiv && notificationDiv.parentNode) {
        notificationDiv.remove();
      }
    }, 5000);

  } catch (fallbackError) {
        console.error("❌ Notification error:", fallbackError); // ← ADD ERROR LOG

    alert(message);
  }
}

// Keep your wrapper functions exactly as they are:
function showSuccessNotification(message) {
  showErrorToUser(message, "success");
}
function showErrorNotification(message) {
  showErrorToUser(message, "error");
}
function showInfoNotification(message) {
  showErrorToUser(message, "info");
}
function showFallbackNotification(message) {
  showErrorToUser(message, "fallback");
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

//==== EMAIL AND PASSWORD AUTHENTICATION ========
// ====== Email/Password Sign-Up ======
function setupEmailPasswordSignUp() {
  const signupForm = document.getElementById("emailSignupForm");
  if (!signupForm) return;

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoading(true, "Creating your account...");

    const email = document.getElementById("signupEmailInput").value.trim();
    const password = document.getElementById("signupPasswordInput").value;

    if (!email || !password) {
      showErrorToUser("Please enter both email and password.");
      showLoading(false);
      return;
    }

    try {
      // Sign up with Firebase
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      console.log("✅ Email/Password sign-up successful:", userCredential.user);
      
      // Force token refresh
      await userCredential.user.getIdToken(true);

      showSuccessNotification("Account created successfully! Redirecting...");
      // Show dashboard after account creation
      showDashboard();
    } catch (error) {
      console.error("❌ Sign-up failed:", error);
      showErrorToUser(error.message || "Sign-up failed. Try again.");
    } finally {
      showLoading(false);
    }
  });
}

// ====== Email/Password Sign-In ======
function setupEmailPasswordLogin() {
  const loginForm = document.getElementById("emailLoginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoading(true, "Signing in...");

    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;

    if (!email || !password) {
      showErrorToUser("Please enter both email and password.");
      showLoading(false);
      return;
    }

    try {
      // Sign in with Firebase
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      console.log("✅ Email/Password sign-in successful:", userCredential.user);
      
      // Force token refresh (optional but safer)
      await userCredential.user.getIdToken(true);

      // Show dashboard
      showDashboard();
    } catch (error) {
      console.error("❌ Email/Password sign-in failed:", error);
      showErrorToUser(error.message || "Sign-in failed. Try again.");
    } finally {
      showLoading(false);
    }
  });
}
//==== VISIIBILITY TOGGLING HANDLER FOR SIGN-UP AND SIGN-IN =====
function toggleEmailForms(showLogin = true) {
  const loginWrapper = document.getElementById("emailLoginWrapper");
  const signupWrapper = document.getElementById("emailSignupWrapper");

  if (loginWrapper && signupWrapper) {
    loginWrapper.style.display = showLogin ? "flex" : "none";
    signupWrapper.style.display = showLogin ? "none" : "flex";
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
     setupEmailPasswordSignUp();
    }
   // ✅ Set up email/password login (if form exists)
    if (document.getElementById("emailLoginForm")) {
     setupEmailPasswordLogin();
    }
    
   // ✅ Set up email/password login (if form exists)
    if (document.getElementById("emailLoginForm")) {
     setupEmailPasswordLogin();
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
