//* FIREBASE IMPORT AND INITIALIZATION *//
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
const messaging = firebase.messaging();

// Initialize push notifications
initializePushNotifications(); // <-- Add this line


// * Global declaration *//
let editingProfileIndex = null;

// ======== ENHANCED SERVICE WORKER REGISTRATION ========
if ('serviceWorker' in navigator) {
  const SW_VERSION = 'v2.1'; // Update this when making SW changes
  const SW_PATH = `${window.location.pathname.replace(/\/[^/]+$/, '')}/Pet-Health-Tracker/service-worker.js`;
  const SW_SCOPE = `${window.location.pathname.replace(/\/[^/]+$/, '')}/`;

  window.addEventListener('load', async () => {
    try {
      // Validate environment before registration
      if (!('indexedDB' in window)) {
        throw new Error('Browser does not support required features');
      }

      // Register service worker with versioning
      const registration = await navigator.serviceWorker.register(`${SW_PATH}?version=${SW_VERSION}`, {
        scope: SW_SCOPE,
        updateViaCache: 'none'
      });

      console.log('📦 Service Worker registered at scope:', registration.scope);
      console.log('🔧 Current Service Worker version:', SW_VERSION);

      // Immediate activation handler
      if (registration.active) {
        console.log('⚡ Service Worker already active');
      }

      // Installation monitoring
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 New Service Worker found:', newWorker.state);

        newWorker.addEventListener('statechange', () => {
          console.log(`🔄 Service Worker state: ${newWorker.state}`);
          if (newWorker.state === 'activated') {
            console.log('✅ New Service Worker activated');
            if (!navigator.serviceWorker.controller) {
              console.log('🔄 Reloading to apply updates...');
              window.location.reload();
            }
          }
        });
      });

      // Runtime error handling
      registration.addEventListener('error', (error) => {
        console.error('🚨 Service Worker error:', error);
      });

      // Network recovery system
      registration.addEventListener('update', () => {
        console.log('🌐 Checking for updates...');
      });

      // Periodic update checks (every 6 hours)
      const updateInterval = setInterval(() => {
        registration.update().catch(error => {
          console.warn('⚠️ Update check failed:', error);
        });
      }, 6 * 60 * 60 * 1000);

      // Cleanup on window close
      window.addEventListener('beforeunload', () => {
        clearInterval(updateInterval);
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      // Fallback UI notification
      showErrorToast('Service Worker registration failed - some features may be unavailable');
    }
  });

  // Global error handler
  navigator.serviceWorker.addEventListener('error', (error) => {
    console.error('🌐 Service Worker container error:', error);
  });

  // Controller change handler
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Controller changed, reloading...');
    window.location.reload();
  });
} else {
  console.warn('❌ Service Workers not supported');
  showErrorToast('Your browser does not support required features');
}

// Helper function for user feedback
function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.style = 'position:fixed; bottom:20px; right:20px; padding:15px; background:#ff4444; color:white; border-radius:5px;';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 5000);
}

// ======== VALIDATION CONFIGURATION ========
const REMINDER_THRESHOLD_DAYS = 5; // Or any other number of days you prefer

const ALLOWED_REMINDER_TYPES = ['vaccination', 'checkup', 'grooming'];
const REMINDER_TYPE_MAP = {
  vaccinationDue: 'vaccination',
  checkupDue: 'checkup',
  groomingDue: 'grooming'
};

  try {
    const reminders = {
      vaccinationsAndDewormingReminder: validateReminder({
        type: 'vaccinationsAndDewormingReminder',
        dueDate: document.getElementById('vaccinationsAndDewormingReminder').value
      }),
      medicalCheckupsReminder: validateReminder({
        type: 'medicalCheckupsReminder',
        dueDate: document.getElementById('medicalCheckupsReminder').value
      }),
      groomingReminder: validateReminder({
        type: 'groomingReminder',
        dueDate: document.getElementById('groomingReminder').value
      })
    };
  } catch (error) {
    alert(`Validation Error: ${error.message}`);
    return;
  }

// ======== A AUTH STATE CHECK ======== (MODIFIED)
document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('mainContent');
  const logoutButton = document.getElementById('logoutButton');
  const petPhotoInput = document.getElementById('petPhoto');
  const petPhotoPreview = document.getElementById('petPhotoPreview');

  // Firebase auth state persistence
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // User is signed in
          authSection.style.display = 'none';
          mainContent.style.display = 'block';
          logoutButton.style.display = 'block';
          loadSavedPetProfile();
          // Add notifications setup HERE (only once!)
        setupNotifications(); // <-- ADD THIS LINE
        } else {
          // User is signed out
          authSection.style.display = 'block';
          mainContent.style.display = 'none';
          logoutButton.style.display = 'none';
          switchAuthForm('login'); // Add this line
        }
      });
    })
    .catch((error) => {
      console.error("Auth persistence error:", error);
    });

// In DOMContentLoaded -> petPhotoInput event listener:
petPhotoInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            petPhotoPreview.src = e.target.result; // Store as Data URL
            petPhotoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file); // ← This is key
    } else {
        petPhotoPreview.src = '';
        petPhotoPreview.style.display = 'none';
    }
});

  // Check sessionStorage for in-progress edits
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key.startsWith('editingProfile_')) {
      const index = parseInt(key.split('_')[1]);
      const originalProfile = JSON.parse(sessionStorage.getItem(key));

      if (originalProfile) {
        editingProfileIndex = index;
        document.getElementById('petName').value = originalProfile.petName;
        document.getElementById('breed').value = originalProfile.breed;
        document.getElementById('age').value = originalProfile.age;
        document.getElementById('weight').value = originalProfile.weight;
        document.getElementById('microchipId').value = originalProfile
          .microchip?.id || '';
        document.getElementById('microchipDate').value = originalProfile
          .microchip?.date || '';
        document.getElementById('microchipVendor').value = originalProfile
          .microchip?.vendor || '';
        document.getElementById('allergies').value = originalProfile
          .allergies;
        document.getElementById('medicalHistory').value = originalProfile
          .medicalHistory;
        document.getElementById('dietPlan').value = originalProfile
          .dietPlan;
        document.getElementById('moodSelector').value = originalProfile
          .mood || '';
        document.getElementById('emergencyContactName').value =
          originalProfile.emergencyContacts?.[0]?.name || '';
        document.getElementById('emergencyContactPhone').value =
          originalProfile.emergencyContacts?.[0]?.phone || '';
        document.getElementById('emergencyContactRelationship').value =
          originalProfile.emergencyContacts?.[0]?.relationship || '';
        document.getElementById('vaccinationsAndDewormingReminder').value =
          originalProfile.vaccinationsAndDewormingReminder || '';
        document.getElementById('medicalCheckupsReminder').value =
          originalProfile.medicalCheckupsReminder || '';
        document.getElementById('groomingReminder').value = originalProfile
          .groomingReminder || '';

        // Pet photo
        if (originalProfile.petPhoto) {
          document.getElementById('petPhotoPreview').src = originalProfile
            .petPhoto;
          document.getElementById('petPhotoPreview').style.display =
            'block';
        } else {
          document.getElementById('petPhotoPreview').src = '';
          document.getElementById('petPhotoPreview').style.display = 'none';
        }

        document.getElementById('dietForm').scrollIntoView();
      }
    }
  }

if (loggedInUser) {
  authSection.style.display = 'none';
  mainContent.style.display = 'block';
  logoutButton.style.display = 'block';
  loadSavedPetProfile(); // 1️⃣ First load profiles

  // MOVE IMAGE PRELOADING HERE
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  savedProfiles.forEach(profile => {
    if (profile.petPhoto) {
      const img = new Image();
      img.src = profile.petPhoto; // 2️⃣ Then preload images
    }
  });
}

// ========B FORM SWITCHING HELPER ========
function switchAuthForm(targetForm) {
  // Hide all forms
  document.getElementById('signUpForm').classList.remove('active');
  document.getElementById('loginForm').classList.remove('active');

  // Show target form and reset it
  const formElement = document.getElementById(`${targetForm}Form`);
  formElement.classList.add('active');
  formElement.querySelector('form').reset();
}

// ========C FORM SWITCHING EVENT LISTENERS ========
document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  switchAuthForm('login');
});

document.getElementById('showSignUp').addEventListener('click', (e) => {
  e.preventDefault();
  switchAuthForm('signUp');
});

// ========D UPDATED SIGN-UP HANDLER ========
document.getElementById('signUp').addEventListener('submit', function(event) {
  event.preventDefault();

  const email = document.getElementById('signUpEmail').value.trim();
  const password = document.getElementById('signUpPassword').value.trim();

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert('Sign-up successful! Please login.');
      switchAuthForm('login');
      this.reset(); // Reset sign-up form
    })
    .catch((error) => {
      console.error("Sign-up error:", error);
      alert(`Sign-up failed: ${error.message}`);
      this.reset(); // Reset form on error
    });
});

  // ======== UPDATED LOGIN HANDLER ========
document.getElementById('login').addEventListener('submit', function(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Immediately after successful login
      this.reset(); // Reset login form
    })
    .catch((error) => {
      console.error("Login error:", error);
      alert(`Login failed: ${error.message}`);
      this.reset();
    });
});
  
// ======== F. LOGOUT HANDLER (FIREBASE INTEGRATION) ========
document.getElementById('logoutButton').addEventListener('click', function() {
  firebase.auth().signOut()
    .then(() => {
      console.log("Firebase Logout successful");
      // Trigger form switching instead of direct DOM manipulation
      switchAuthForm('login');
      alert('Logged out successfully!');
    })
    .catch((error) => {
      console.error("Logout error:", error);
      alert(`Logout failed: ${error.message}`);
    });
});
