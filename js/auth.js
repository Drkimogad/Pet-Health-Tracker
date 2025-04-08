//In HTML: Change /js/... to ./js/... (e.g., <script type="module" src="./js/profiles.js"></script>).
//In JS Imports: Use import { ... } from './profiles.js'; (no /js/ if files are in the same folder).

// Importing firebase ftom CDN directly 
const auth = firebase.auth();
const firestore = firebase.firestore();

import { loadSavedPetProfile } from '.js/profiles.js';
import { setupNotifications } from '.js/pushNotifications.js';

// ======== A AUTH STATE CHECK ======== (MODIFIED)
export function initializeAuth() {
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
  });
}

// ========B FORM SWITCHING HELPER ========
export function switchAuthForm(targetForm) {
  // Hide all forms
  document.getElementById('signUpForm').classList.remove('active');
  document.getElementById('loginForm').classList.remove('active');

  // Show target form and reset it
  const formElement = document.getElementById(`${targetForm}Form`);
  formElement.classList.add('active');
  formElement.querySelector('form').reset();
}

// ========C FORM SWITCHING EVENT LISTENERS ========
export function setupAuthFormSwitchers() {
  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthForm('login');
  });

  document.getElementById('showSignUp').addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthForm('signUp');
  });
}

// ========D UPDATED SIGN-UP HANDLER ========
export function setupSignUpHandler() {
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
}

// ======== UPDATED LOGIN HANDLER ========
export function setupLoginHandler() {
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
}

// ======== F. LOGOUT HANDLER (FIREBASE INTEGRATION) ========
export function setupLogoutHandler() {
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
}
export { initializeAuth, switchAuthForm, setupAuthFormSwitchers, setupSignUpHandler, setupLoginHandler, setupLogoutHandler };
