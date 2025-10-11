// ====== IMMEDIATE REDIRECT CHECK ======
// ✅ Prevent offline.html from being cached too aggressively
if (window.location.pathname.includes('offline.html') && navigator.onLine) {
  window.location.href = 'index.html'; // Auto-redirect if online
}

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
  'https://drkimogad.github.io/Pet-Health-Tracker',
  'https://pet-health-tracker-4ec31.web.app' // ADD THIS
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

  // ✅ Show current online/offline status immediately
  checkOnlineStatus();  // <<< ADD HERE
  // Listen for changes
  window.addEventListener('online', checkOnlineStatus);
  window.addEventListener('offline', checkOnlineStatus);

  
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
        // ✅ ADD OFFLINE CHECK - MUST BE FIRST
        if (!navigator.onLine) {
          window.location.href = 'offline.html';
          return; // STOP here - don't proceed with Google sign-in
        }
        
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
      // ✅ ADD DIRECT CLICK HANDLER FOR OFFLINE DETECTION
      googleButtonContainer.addEventListener('click', function(e) {
        if (!navigator.onLine) {
          e.preventDefault();
          e.stopImmediatePropagation();
          window.location.href = 'offline.html';
          return false;
        }
      }, true); // Use capture phase to intercept early
      
      google.accounts.id.renderButton(googleButtonContainer, {
        type: "standard",
        theme: "filled_blue",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 250
      });  
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

  const db = firebase.firestore();
  // ✅ Enable offline persistence
  setupFirebaseOfflinePersistence();  // <<< ADD HERE

  // Return auth instance for use elsewhere
  return firebase.auth();
}


//======================
// FIXED SUPPORT MANAGER - Add to utils.js
// ======================
class SupportManager {
    constructor() {
            this.messages = [
    // TIER 1: Core Value & Differentiation (First impressions)
    "🌐 Works completely offline - perfect for rural areas or vet visits!",
    "🐾 Free forever - manage vaccinations, moods & medical history without subscriptions",
    "💬 The only app with mood tracking + community chat - understand your pet better!",
    
    // TIER 2: Critical Features & Navigation (Usage guidance)
    "🔔 Push notifications coming soon! Reminders will be more reliable in the next update",
    "💡 Tip: Download any pet profile as PDF - click 'Profile Details' then 'Save as PDF'",
    "🔔 Set reminders for vaccinations, checkups & birthdays - never miss important dates!",
    "🚨 Emergency ready! Generate QR codes for pet profiles - critical if pet gets lost",
    
    // TIER 3: Advanced Features & Benefits (Power user tips)
    "📊 Track mood patterns over time - spot behavior changes early!",
    "📱 Offline pet health tracking with QR emergency profiles - your pet's safety net!",
    "🔄 Synced across devices - your pet data stays safe in the cloud!",
    
    // TIER 4: Action & Engagement (Community & sharing)
    "🗣️ Feedback? Use 'Community Chat' - we respond to every message!",
    "📋 Found all pet cards? Click 'Save All Cards' to export everything as ZIP!",
    "🎯 Editing a profile? Click the pet card, then 'Edit Profile' to update info!",
    
    // TIER 5: Support & Growth (Original messages - keep for variety)
    "Love this app? Share with other pet lovers! 🐾",
    "Your support helps us improve faster!",
    "Rate our app to help other pet owners find us!"
];
        this.isInitialized = false;
        this.isUserAuthenticated = false;
        this.authCheckInterval = null;
        this.messageInterval = null;
        
        // Don't setup auth listener immediately - wait for dashboard
        console.log('🔧 SupportManager created - waiting for dashboard initialization');
    }

    setupAuthListener() {
        console.log('🔐 Setting up auth monitoring...');
        
        // Method 1: Check if Firebase is available and initialized
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                firebase.auth().onAuthStateChanged((user) => {
                    const wasAuthenticated = this.isUserAuthenticated;
                    this.isUserAuthenticated = !!user;
                    
                    if (this.isUserAuthenticated && !wasAuthenticated) {
                        console.log('✅ User authenticated - support messages enabled');
                        this.tryInitialize();
                    } else if (!this.isUserAuthenticated && wasAuthenticated) {
                        console.log('🚫 User signed out - support messages disabled');
                        this.stopMessageTimers();
                    }
                });
                console.log('✅ Firebase auth listener registered');
                return;
            } catch (error) {
                console.log('⚠️ Firebase not ready yet, using fallback method');
            }
        }
        
        // Method 2: Fallback - check dashboard visibility
        console.log('🔄 Using dashboard visibility fallback');
        this.authCheckInterval = setInterval(() => {
            if (!this.isUserAuthenticated) {
                const dashboard = document.getElementById('dashboard');
                const authContainer = document.getElementById('authContainer');
                
                if (dashboard && !dashboard.classList.contains('hidden') && 
                    authContainer && authContainer.classList.contains('hidden')) {
                    console.log('✅ Dashboard active - enabling support messages');
                    this.isUserAuthenticated = true;
                    this.tryInitialize();
                    clearInterval(this.authCheckInterval); // Stop checking once authenticated
                }
            }
        }, 3000);
    }

    tryInitialize() {
        if (this.isInitialized || !this.isUserAuthenticated) return;
        
        console.log('🎯 Initializing support messages for authenticated user');
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Inject CSS once
        this.injectStyles();
        
        // Start message timers
        this.startMessageTimers();
        
        this.isInitialized = true;
        console.log('✅ SupportManager initialized for authenticated user');
    }

    startMessageTimers() {
        console.log('⏰ Starting message timers (first message in 45 seconds)');
        
        // Show first message after 45 seconds
        setTimeout(() => {
            if (this.isUserAuthenticated && this.isInDashboard()) {
                this.showSupportMessage();
            }
        }, 45000);
        
        // Show occasionally after that (every 2 minutes, 20% chance)
        this.messageInterval = setInterval(() => {
            if (this.isUserAuthenticated && this.isInDashboard() && Math.random() < 0.2) {
                this.showSupportMessage();
            }
        }, 120000);
    }

    stopMessageTimers() {
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = null;
            console.log('⏹️ Message timers stopped');
        }
        this.isInitialized = false;
    }

    injectStyles() {
        if (document.getElementById('support-manager-styles')) return;
        
        const styles = `
        .support-message-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease-in;
        }
        .support-message {
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            max-width: 300px;
            text-align: center;
            animation: slideUp 0.3s ease-out;
        }
        .support-content .support-emoji {
            font-size: 2em;
            display: block;
            margin-bottom: 10px;
        }
        .support-content p {
            margin: 10px 0;
            color: #333;
            font-size: 14px;
            line-height: 1.4;
        }
        .support-close-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
            transition: background 0.3s;
        }
        .support-close-btn:hover { background: #45a049; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'support-manager-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    showSupportMessage() {
        // Double-check user is still authenticated and in dashboard
        if (!this.isUserAuthenticated || !this.isInDashboard()) {
            console.log('🚫 Suppressing message - user not in dashboard');
            return;
        }
        
        // Don't show if user is in the middle of something important
        if (this.shouldSuppressMessage()) {
            console.log('🚫 Suppressing message - critical operation in progress');
            return;
        }
        
        // Don't show if user just dismissed one recently
        const lastShow = localStorage.getItem('lastSupportShow');
        const now = Date.now();
        if (lastShow && (now - parseInt(lastShow)) < 3600000) { // 1 hour cooldown
            return;
        }

        const randomMessage = this.messages[Math.floor(Math.random() * this.messages.length)];
        
        const supportDiv = document.createElement('div');
        supportDiv.className = 'support-message-overlay';
        supportDiv.innerHTML = `
            <div class="support-message">
                <div class="support-content">
                    <span class="support-emoji">🐾</span>
                    <p>${randomMessage}</p>
                    <button class="support-close-btn">Got it!</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(supportDiv);
        console.log('💬 Showing support message:', randomMessage);
        
        // Add event listener
        supportDiv.querySelector('.support-close-btn').addEventListener('click', () => {
            supportDiv.remove();
            localStorage.setItem('lastSupportShow', Date.now().toString());
            console.log('✅ Support message closed by user');
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (supportDiv.parentElement) {
                supportDiv.remove();
                localStorage.setItem('lastSupportShow', Date.now().toString());
                console.log('⏰ Support message auto-closed');
            }
        }, 10000);
    }

    isInDashboard() {
        const dashboard = document.getElementById('dashboard');
        const authContainer = document.getElementById('authContainer');
        
        return dashboard && !dashboard.classList.contains('hidden') && 
               authContainer && authContainer.classList.contains('hidden');
    }

    shouldSuppressMessage() {
        // Don't show during form editing, modals, or critical operations
        const isEditing = !!window.isEditing || !!window.editingProfileId;
        const hasModal = document.querySelector('.modal, [class*="modal"], [class*="overlay"]');
        const isProcessing = document.getElementById('processing-loader')?.style.display !== 'none';
        
        return isEditing || hasModal || isProcessing;
    }
    
    // Manual initialization method (call this from dashboard.js)
    initializeFromDashboard() {
        console.log('🚀 Manual initialization from dashboard');
        this.setupAuthListener();
    }
    
    // Cleanup method
    destroy() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
        }
    }
}

// Create global instance but DON'T auto-initialize
window.supportManager = new SupportManager();

// ====== Auth State Listener ======
// ====== Auth State Listener ======
function initAuthListeners() {
  firebase.auth().onAuthStateChanged(async (user) => {
    const authContainer = document.getElementById('authContainer');
    const dashboard = document.getElementById('dashboard');

    if (user) {
      authContainer.classList.add('hidden');
      dashboard.classList.remove('hidden');

      // 🆕 SUPPORT MANAGER START - ADD THIS LINE
      if (window.supportManager && !window.supportManager.isInitialized) {
        window.supportManager.isUserAuthenticated = true;
        window.supportManager.init();
      }

      try {
        // ✅ OFFLINE HANDLING: Check connectivity first
        if (navigator.onLine) {
          // Online: Use Firestore
          const snapshot = await firebase.firestore().collection("profiles").where("userId", "==", user.uid).get();
          window.petProfiles = snapshot.docs.map(doc => doc.data());
        } else {
          // Offline: Use localStorage fallback
          window.petProfiles = JSON.parse(localStorage.getItem("petProfiles")) || [];
          console.log("📴 Offline mode: Using cached profiles");
        }

        // ✅ Save to localStorage (fallback) - always update
        const localProfiles = JSON.parse(localStorage.getItem("petProfiles")) || [];
        // Only overwrite if local storage is empty or we have newer online data
        if (localProfiles.length === 0 || navigator.onLine) {
          localStorage.setItem("petProfiles", JSON.stringify(window.petProfiles));
        }
        
        // ✅ Now render profiles from storage
        if (typeof loadSavedPetProfile === 'function') {
          await loadSavedPetProfile();
        }
        if (typeof showDashboard === 'function') {
          showDashboard();
        }
        
// ✅ CORRECT - pass the petId
const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
if (profiles.length > 0) {
  for (const profile of profiles) {
    await checkScheduledReports(profile.id); // monthly check
    await showYearlyInsights(profile.id);
  }
}

        
        // 🆕 ADD ADMIN NOTIFICATION SETUP RIGHT HERE
if (user.email === 'drkimogad@gmail.com') {
  setTimeout(() => {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    profiles.forEach(profile => {
      if (profile.id) {
        setupAdminNotificationListener(profile.id);
      }
    });
  }, 500); // Shorter delay - 500ms
}
        
        // ✅ Hide loader
        showLoading(false);
        
      } catch (error) {
        console.error("Profile load error:", error);
        // Fallback to localStorage on error
        window.petProfiles = JSON.parse(localStorage.getItem("petProfiles")) || [];
        if (typeof loadSavedPetProfile === 'function') {
          await loadSavedPetProfile();
        }
        showErrorToUser("Using offline data - connect to sync");
      }

    } else {
      authContainer.classList.remove('hidden');
      dashboard.classList.add('hidden');
      
      // 🆕 SUPPORT MANAGER STOP - ADD THIS LINE  
      if (window.supportManager && window.supportManager.isInitialized) {
        window.supportManager.stopMessageTimers();
        window.supportManager.isUserAuthenticated = false;
        window.supportManager.isInitialized = false;
      }
      
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
        // ✅ ADD OFFLINE CHECK - DON'T REDIRECT TO OFFLINE.HTML
        if (!navigator.onLine) {
          // Offline logout - just sign out and show auth form
          await firebase.auth().signOut();
          showAuthForm(); // Show login form instead of redirecting
          console.log("👋 User signed out (offline)");
          showSuccessNotification("You're logged out.");  // ADDED 
          return;
        }
        
        // Online logout - normal behavior
        await firebase.auth().signOut();
        console.log("👋 User signed out");
       showSuccessNotification("You're logged out.");  // ADDED   
       window.location.reload();  // CAN BE REMOVED IF NOT NEEDED
        
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
    showLoading(true, "Creating account...");

    const email = document.getElementById("signupEmailInput").value.trim();
    const password = document.getElementById("signupPasswordInput").value;
    const confirmPassword = document.getElementById("signupConfirmInput").value;

    if (!email || !password || !confirmPassword) {
      showErrorToUser("Please fill out all fields.");
      showLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      showErrorToUser("Passwords do not match.");
      showLoading(false);
      return;
    }

    try {
      // Firebase create user
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      console.log("✅ Sign-up successful:", userCredential.user);

      // Optional: send verification email
      await userCredential.user.sendEmailVerification();

      // 🔄 Switch UI back to Sign-In form
     // Optional: Add a slight delay before showing sign-in
     setTimeout(() => {
     toggleEmailForms(true);
     }, 1500); // can be adjusted based on the notification time 

      // Give user feedback
    showSuccessNotification("Account created! Verification email sent.");
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
    
    // ✅ SOFTER OFFLINE CHECK - Wait to confirm
    if (!navigator.onLine) {
      setTimeout(() => {
        if (!navigator.onLine) { // Double-check after delay
          window.location.href = 'offline.html';
        }
      }, 1500);
      return;
    }

    // ✅ MOVE THESE INSIDE - AFTER OFFLINE CHECK
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;

    showLoading(true, "Signing in...");

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

// ====== Forgot Password ======
function setupForgotPassword() {
  const forgotLink = document.getElementById('forgotPasswordLink');
  if (!forgotLink) return;

  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    
    // ✅ SOFTER OFFLINE CHECK
    if (!navigator.onLine) {
      setTimeout(() => {
        if (!navigator.onLine) {
          window.location.href = 'offline.html';
        }
      }, 1500);
      return;
    }
    
    // Simple prompt implementation
    const email = prompt('Enter your email to reset password:');
    if (!email) return;
    
    showLoading(true, 'Sending reset email...');
    
    auth.sendPasswordResetEmail(email)
      .then(() => {
        showSuccessNotification('Password reset email sent! Check your inbox.');
      })
      .catch(error => {
        showErrorToUser(error.message || 'Failed to send reset email');
      })
      .finally(() => {
        showLoading(false);
      });
  });
}
//==== VISIIBILITY TOGGLING HANDLER FOR SIGN-UP AND SIGN-IN =====
// this handler handles the display and swope bet the balls.
function toggleEmailForms(showLogin = true) {
  const loginWrapper = document.getElementById("emailLoginWrapper");
  const signupWrapper = document.getElementById("emailSignupWrapper");

  if (loginWrapper && signupWrapper) {
    // Toggle visibility
    loginWrapper.style.display = showLogin ? "flex" : "none";
    signupWrapper.style.display = showLogin ? "none" : "flex";

    // Apply style modes (signin vs signup)
    if (showLogin) {
      loginWrapper.classList.add("signin-mode");
      loginWrapper.classList.remove("signup-mode");

      signupWrapper.classList.remove("signup-mode");
      signupWrapper.classList.add("signin-mode"); // keep consistent style base
    } else {
      signupWrapper.classList.add("signup-mode");
      signupWrapper.classList.remove("signin-mode");

      loginWrapper.classList.remove("signin-mode");
      loginWrapper.classList.add("signup-mode"); // keep consistent style base
    }
  }
}

//=== Wire toggle links =====
function wireAuthToggleLinks() {
  const toSignup = document.getElementById("goToSignup");
  const toLogin  = document.getElementById("goToLogin");

  if (toSignup) {
    toSignup.addEventListener("click", (e) => {
      e.preventDefault();
      toggleEmailForms(false); // show SIGN-UP
    });
  }

  if (toLogin) {
    toLogin.addEventListener("click", (e) => {
      e.preventDefault();
      toggleEmailForms(true); // show SIGN-IN
    });
  }
}

// ======== SERVICE WORKER SYNC TRIGGER ========
function triggerServiceWorkerSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Wait 3 seconds to ensure SW is fully initialized
      setTimeout(() => {
        if (registration.active) {
          registration.active.postMessage('triggerSync');
          console.log('📤 Message sent to service worker: triggerSync');
        } else {
          console.log('⚠️ Service worker not active yet');
        }
      }, 3000);
    }).catch(err => {
      console.log('⚠️ Service worker not ready:', err);
    });
  }
}


// ====== Handle password reset link ======
function handlePasswordResetLink() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');

if (mode === 'resetPassword' && oobCode) {
  // ===== Auto-hide login/signup balls =====
  const loginWrapper = document.getElementById("emailLoginWrapper");
  const signupWrapper = document.getElementById("emailSignupWrapper");
  if (loginWrapper) loginWrapper.style.display = "none";
  if (signupWrapper) signupWrapper.style.display = "none";

  // ===== Show reset password bubble + overlay =====
  const container = document.getElementById('resetPasswordContainer');
  const overlay = document.getElementById('resetPasswordOverlay');
  if (!container || !overlay) return;

  container.style.display = "flex";   // show bubble
  overlay.style.display = "block";    // show blur overlay

    
  // Optional: hide via toggleEmailForms(false)
  toggleEmailForms(false);

    container.innerHTML = `
      <h2>Set a new password</h2>
      <input type="password" id="newPasswordInput" placeholder="New password" />
      <input type="password" id="confirmNewPasswordInput" placeholder="Confirm new password" />
      <button id="submitNewPasswordBtn">Set Password</button>
    `;

    document.getElementById('submitNewPasswordBtn').addEventListener('click', async () => {
      const newPassword = document.getElementById('newPasswordInput').value;
      const confirmPassword = document.getElementById('confirmNewPasswordInput').value;

      if (!newPassword || !confirmPassword) {
        showErrorToUser('Please enter and confirm your new password.');
        return;
      }
      if (newPassword !== confirmPassword) {
        showErrorToUser('Passwords do not match.');
        return;
      }

      showLoading(true, 'Resetting password...');
      try {
        await auth.confirmPasswordReset(oobCode, newPassword);
        showSuccessNotification('Password reset successfully! You can now log in.');
        // ✅ Show login form again
        toggleEmailForms(true);
        // ✅ Clear and hide reset container + overlay
       container.innerHTML = '';
       container.style.display = "none"; //hides the bubble.
       overlay.style.display = "none"; //hides the blurred background. 
           
      } catch (error) {
        console.error('❌ Password reset failed:', error);
        showErrorToUser(error.message || 'Failed to reset password.');
      } finally {
        showLoading(false);
      }
    });
  }
}


// ===== LAST ONLINE TIME TRACKING =====
// NEW: Tracks when user was last online (for offline page) DEFINE IT FIRST THEN CALL IN INITIALIZATION AND ADD IT TO ONLINE STATUS CHECK FUNCTION
function trackLastOnlineTime() {
    // Store current time as last online
    localStorage.setItem("lastOnline", new Date().toLocaleString());
    console.log("📅 Last online time updated:", new Date().toLocaleString());
    
    // Update periodically while online
    const onlineTracker = setInterval(() => {
        if (navigator.onLine) {
            localStorage.setItem("lastOnline", new Date().toLocaleString());
        } else {
            // Stop tracking when offline
            clearInterval(onlineTracker);
        }
    }, 30000); // Update every 30 seconds
}

// ======== OFFLINE STATUS DETECTION ========
// Call this when coming online instead of manual sync
function checkOnlineStatus() {
  const isOnline = navigator.onLine;
  const statusElement = document.getElementById('online-status') || createStatusElement();
  
  if (isOnline) {
    statusElement.textContent = 'Online';
    statusElement.className = 'online-status online';
    console.log('✅ Online - Connected to server');
    
    // ✅ ADD THIS: Track last online time
    trackLastOnlineTime();
    // ✅ REPLACE MANUAL SYNC WITH MESSAGE TRIGGER
    triggerServiceWorkerSync();
    
  } else {
    statusElement.textContent = 'Offline - Using local data';
    statusElement.className = 'online-status offline';
    console.log('📴 Offline - Using cached data');
  }
  
  return isOnline;
}


function createStatusElement() {
  const statusElement = document.createElement('div');
  statusElement.id = 'online-status';
  document.body.appendChild(statusElement);
  return statusElement;
}

// Listen for online/offline events
window.addEventListener('online', checkOnlineStatus);
window.addEventListener('offline', checkOnlineStatus);

// ======== FIREBASE OFFLINE HANDLING ========
// it will have to be upgraded in the future alongside higher firebase 
function setupFirebaseOfflinePersistence() {
  // Use compat API
  firebase.firestore().enablePersistence() // THE OLD ONE 
  
// Use compat API with multi-tab synchronization
//  firebase.firestore().enablePersistence({ synchronizeTabs: true })
    
    .then(() => {
      console.log('✅ Firebase offline persistence enabled');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open — persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Browser does not support all required features for persistence.');
      } else {
        console.warn('⚠️ Firestore persistence error:', err);
      }
    });
} 
// ======== FIREBASE OFFLINE HANDLING UPDATED FUNCTION ========
//function setupFirebaseOfflinePersistence() {
//  try {
//    firebase.firestore().settings({
//      cache: { sizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED },
//      merge: true
//    });*/

 //   console.log('✅ Firebase offline cache enabled (multi-tab safe)');
//  } catch (err) {
//    if (err.code === 'failed-precondition') {
  //    console.warn('⚠️ Persistence can only be enabled in one tab at a time. Multi-tab detected.');
 //   } else if (err.code === 'unimplemented') {
  //    console.warn('⚠️ Browser does not support all required features for persistence.');
  //  } else {
  //    console.warn('⚠️ Firestore cache settings error:', err);
 //   }
//  }
//}  



// ====== Core Initialization ======
async function initializeAuth() {
  try {
    // 1. First make sure DOM is ready
    if (!initDOMReferences()) {
      throw new Error("Critical DOM elements missing");
    }

    // 2. Wait for Firebase to load
    if (typeof firebase === "undefined") {
      await new Promise((resolve) => {
        const checkFirebase = setInterval(() => {
          if (typeof firebase !== "undefined") {
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

    // 5. Google Sign-In
    if (document.getElementById("googleSignInButton")) {
      setupGoogleLoginButton(); // <-- you had setupEmailPasswordSignUp here by mistake
    }

    // 6. Email/Password Sign-Up
    if (document.getElementById("emailSignupForm")) {
      setupEmailPasswordSignUp();
    }
    // Add this line where you set up other auth methods
    if (document.getElementById("forgotPasswordLink")) {
     setupForgotPassword();
    }

    // 7. Email/Password Login
    if (document.getElementById("emailLoginForm")) {
      setupEmailPasswordLogin();
    }

    // 8. Wire up toggle links (between login/signup)
    wireAuthToggleLinks();
    
   // 11. Handle password reset links
     handlePasswordResetLink();

    // 9. Decide which form to show first (default = login)
    toggleEmailForms(true); // pass false if you want to start with Sign-Up

    // 10. Logout listener
    if (typeof setupLogout === "function") {
      setupLogout();
    }
     // 13.Start tracking last online time
    if (navigator.onLine) {
        trackLastOnlineTime();
    }
        // 🆕 12. Create Support Manager (but don't initialize yet)
    window.supportManager = new SupportManager();
    console.log("✅ Support Manager created - waiting for auth state");


  } catch (error) {
    console.error("Auth initialization failed:", error);
    disableUI();
  }
}
