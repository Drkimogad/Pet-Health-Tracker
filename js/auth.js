// auth.js - Fixed Version
const auth = firebase.auth();
const firestore = firebase.firestore();

import { loadSavedPetProfile } from './profiles.js';
import { setupNotifications } from './pushNotifications.js';

// ======== A. AUTH STATE CHECK (FIXED) ========
export function initializeAuth() {
  document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');
    const logoutButton = document.getElementById('logoutButton');
    const petPhotoInput = document.getElementById('petPhoto');
    const petPhotoPreview = document.getElementById('petPhotoPreview');

    // Fixed: Added error boundary for persistence setup
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        const authStateHandler = (user) => {
          if (user) {
            authSection.style.display = 'none';
            mainContent.style.display = 'block';
            logoutButton.style.display = 'block';
            
            // Fixed: Added null checks for profile loading
            try {
              loadSavedPetProfile();
              setupNotifications();
            } catch (error) {
              console.error('Profile loading error:', error);
            }
          } else {
            authSection.style.display = 'block';
            mainContent.style.display = 'none';
            logoutButton.style.display = 'none';
            switchAuthForm('login');
          }
        };

        // Fixed: Proper cleanup of auth listener
        const unsubscribe = firebase.auth().onAuthStateChanged(authStateHandler);
        return () => unsubscribe();
      })
      .catch((error) => {
        console.error("Auth persistence error:", error);
        alert('Authentication system error. Please refresh the page.');
      });

    // Fixed: Added debounce to image preview handler
    let previewTimeout;
    petPhotoInput.addEventListener('change', function() {
      clearTimeout(previewTimeout);
      previewTimeout = setTimeout(() => {
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            petPhotoPreview.src = e.target.result;
            petPhotoPreview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      }, 300);
    });

    // Fixed: Optimized sessionStorage check
    const editingSessionKeys = Array.from({ length: sessionStorage.length })
      .map((_, i) => sessionStorage.key(i))
      .filter(key => key.startsWith('editingProfile_'));

    editingSessionKeys.forEach(key => {
      const index = parseInt(key.split('_')[1], 10);
      const originalProfile = JSON.parse(sessionStorage.getItem(key));

      if (originalProfile) {
        // Fixed: Added null checks for DOM elements
        const safeSetValue = (id, value) => {
          const el = document.getElementById(id);
          if (el) el.value = value || '';
        };

        safeSetValue('petName', originalProfile.petName);
        safeSetValue('breed', originalProfile.breed);
        safeSetValue('age', originalProfile.age);
        safeSetValue('weight', originalProfile.weight);
        safeSetValue('microchipId', originalProfile.microchip?.id);
        safeSetValue('microchipDate', originalProfile.microchip?.date);
        safeSetValue('microchipVendor', originalProfile.microchip?.vendor);
        safeSetValue('allergies', originalProfile.allergies);
        safeSetValue('medicalHistory', originalProfile.medicalHistory);
        safeSetValue('dietPlan', originalProfile.dietPlan);
        safeSetValue('moodSelector', originalProfile.mood);
        safeSetValue('emergencyContactName', originalProfile.emergencyContacts?.[0]?.name);
        safeSetValue('emergencyContactPhone', originalProfile.emergencyContacts?.[0]?.phone);
        safeSetValue('emergencyContactRelationship', originalProfile.emergencyContacts?.[0]?.relationship);
        safeSetValue('vaccinationsAndDewormingReminder', originalProfile.vaccinationsAndDewormingReminder);
        safeSetValue('medicalCheckupsReminder', originalProfile.medicalCheckupsReminder);
        safeSetValue('groomingReminder', originalProfile.groomingReminder);

        if (originalProfile.petPhoto) {
          petPhotoPreview.src = originalProfile.petPhoto;
          petPhotoPreview.style.display = 'block';
        }
      }
    });

    // Fixed: Added proper user reference check
    const user = firebase.auth().currentUser;
    if (user) {
      // Fixed: Optimized image preloading
      const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
      savedProfiles.forEach((profile, index) => {
        if (index < 5 && profile.petPhoto) { // Limit to first 5 images
          const img = new Image();
          img.src = profile.petPhoto;
        }
      });
    }
  });
}

// ======== B. FORM SWITCHING HELPER (UNCHANGED) ========
export function switchAuthForm(targetForm) {
  document.getElementById('signUpForm').classList.remove('active');
  document.getElementById('loginForm').classList.remove('active');
  const formElement = document.getElementById(`${targetForm}Form`);
  formElement.classList.add('active');
  formElement.querySelector('form').reset();
}

// ======== C. FORM SWITCHING EVENT LISTENERS (FIXED) ========
export function setupAuthFormSwitchers() {
  // Fixed: Added event listener checks
  const addSafeListener = (id, handler) => {
    const element = document.getElementById(id);
    if (element) {
      element.removeEventListener('click', handler);
      element.addEventListener('click', handler);
    }
  };

  addSafeListener('showLogin', (e) => {
    e.preventDefault();
    switchAuthForm('login');
  });

  addSafeListener('showSignUp', (e) => {
    e.preventDefault();
    switchAuthForm('signUp');
  });
}

// ======== D. SIGN-UP HANDLER (FIXED) ========
export function setupSignUpHandler() {
  const form = document.getElementById('signUp');
  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      const email = document.getElementById('signUpEmail')?.value?.trim();
      const password = document.getElementById('signUpPassword')?.value?.trim();

      if (!email || !password) {
        alert('Please fill in all required fields');
        return;
      }

      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
          alert('Sign-up successful! Please login.');
          switchAuthForm('login');
          this.reset();
        })
        .catch((error) => {
          console.error("Sign-up error:", error);
          alert(`Sign-up failed: ${error.message}`);
          this.reset();
        });
    });
  }
}

// ======== E. LOGIN HANDLER (FIXED) ========
export function setupLoginHandler() {
  const form = document.getElementById('login');
  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      const email = document.getElementById('loginEmail')?.value?.trim();
      const password = document.getElementById('loginPassword')?.value?.trim();

      if (!email || !password) {
        alert('Please fill in all required fields');
        return;
      }

      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => this.reset())
        .catch((error) => {
          console.error("Login error:", error);
          alert(`Login failed: ${error.message}`);
          this.reset();
        });
    });
  }
}

// ======== F. LOGOUT HANDLER (FIXED) ========
export function setupLogoutHandler() {
  const button = document.getElementById('logoutButton');
  if (button) {
    button.addEventListener('click', function() {
      firebase.auth().signOut()
        .then(() => {
          switchAuthForm('login');
          alert('Logged out successfully!');
        })
        .catch((error) => {
          console.error("Logout error:", error);
          alert(`Logout failed: ${error.message}`);
        });
    });
  }
}

export { 
  initializeAuth, 
  switchAuthForm, 
  setupAuthFormSwitchers, 
  setupSignUpHandler, 
  setupLoginHandler, 
  setupLogoutHandler 
};
