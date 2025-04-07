// Firebase import and initialization
import { initializePushNotifications, setupNotifications } from './pushNotifications.js';

// Firebase Initialization
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
const messaging = firebase.messaging();

// Global declaration
let editingProfileIndex = null;

// Form Switching Helper
export function switchAuthForm(targetForm) {
  document.getElementById('signUpForm').classList.remove('active');
  document.getElementById('loginForm').classList.remove('active');

  const formElement = document.getElementById(`${targetForm}Form`);
  formElement.classList.add('active');
  formElement.querySelector('form').reset();
}

// Auth state check
export function checkAuthState() {
  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('mainContent');
  const logoutButton = document.getElementById('logoutButton');
  const petPhotoInput = document.getElementById('petPhoto');
  const petPhotoPreview = document.getElementById('petPhotoPreview');

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          authSection.style.display = 'none';
          mainContent.style.display = 'block';
          logoutButton.style.display = 'block';
          loadSavedPetProfile();
          setupNotifications();
        } else {
          authSection.style.display = 'block';
          mainContent.style.display = 'none';
          logoutButton.style.display = 'none';
          switchAuthForm('login');
        }
      });
    })
    .catch((error) => {
      console.error("Auth persistence error:", error);
    });
}

// Event listeners
export function setupEventListeners() {
  // Form switching event listeners
  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthForm('login');
  });

  document.getElementById('showSignUp').addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthForm('signUp');
  });

  // Sign-up handler
  document.getElementById('signUp').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value.trim();

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

  // Login handler
  document.getElementById('login').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        this.reset();
      })
      .catch((error) => {
        console.error("Login error:", error);
        alert(`Login failed: ${error.message}`);
        this.reset();
      });
  });

  // Logout handler
  document.getElementById('logoutButton').addEventListener('click', function() {
    firebase.auth().signOut()
      .then(() => {
        console.log("Firebase Logout successful");
        switchAuthForm('login');
        alert('Logged out successfully!');
      })
      .catch((error) => {
        console.error("Logout error:", error);
        alert(`Logout failed: ${error.message}`);
      });
  });
}

// Pet photo preview
export function petPhotoPreviewHandler() {
  const petPhotoInput = document.getElementById('petPhoto');
  const petPhotoPreview = document.getElementById('petPhotoPreview');

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
}

// Load saved pet profile
export function loadSavedPetProfile() {
  // Your logic to load saved pet profiles
}
