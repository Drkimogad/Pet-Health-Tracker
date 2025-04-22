'use strict';

// ======================
// SECTION 1: IMPORTS & GLOBAL VARIABLES
// ======================

import { setupNotifications, sendPushNotification } from './pushNotifications.js';

// ===== GLOBAL VARIABLES =====
let editingProfileId = null;

// Firebase references (initialized in `initializeFirebaseServices`)
let auth, firestore, storage, googleAuthProvider;

// IndexedDB reference
let petDB;

// Google Drive API flag
let gapiInitialized = false;

// Reminder settings
const REMINDER_THRESHOLD_DAYS = 5;
const ALLOWED_REMINDER_TYPES = ['vaccination', 'checkup', 'grooming'];
const REMINDER_TYPE_MAP = {
  vaccinationDue: 'vaccination',
  checkupDue: 'checkup',
  groomingDue: 'grooming'
};
const reminderFields = {
  vaccinationDue: 'Vaccinations/Deworming',
  checkupDue: 'Medical Check-ups',
  groomingDue: 'Grooming'
};

// ======================
// SECTION 2: FIREBASE INITIALIZATION & AUTHENTICATION
// ======================

// Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  authDomain: "pet-health-tracker-7164d.firebaseapp.com",
  projectId: "pet-health-tracker-7164d",
  storageBucket: "pet-health-tracker-7164d.appspot.com",
  messagingSenderId: "540185558422",
  appId: "1:540185558422:web:d560ac90eb1dff3e5071b7",
  measurementId: "G-XXXXXXXXXX"
};

// Firebase services initializer
function initializeFirebaseServices() {
  try {
    if (!firebase.apps.length) {
      const app = firebase.initializeApp(firebaseConfig);
      auth = firebase.auth(app);
      firestore = firebase.firestore(app);
      storage = firebase.storage(app);

      // Google Auth provider config
      googleAuthProvider = new firebase.auth.GoogleAuthProvider();
      googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
      googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');
      googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

      console.log("✅ Firebase services initialized");
    } else {
      // Use existing instance
      auth = firebase.auth();
      firestore = firebase.firestore();
      storage = firebase.storage();
    }

    return true;
  } catch (error) {
    console.error("🔥 Firebase initialization failed:", error);
    const errorContainer = document.getElementById('firebase-error') || document.body;
    errorContainer.insertAdjacentHTML('afterbegin', `
      <div class="firebase-error-alert">
        <p>System initialization failed. Please refresh or try again later.</p>
        <small>Technical details: ${error.message}</small>
      </div>
    `);
    return false;
  }
}

// Auth state watcher
function setupAuthStateListener() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("👤 User signed in, initializing Drive...");
      try {
        await initGoogleDriveAPI();
        await processSyncQueue();
      } catch (error) {
        console.error("Drive init failed:", error);
      }
    } else {
      console.log("👤 User signed out");
    }
  });
}

// Top-level initializer
async function initializeApp() {
  const firebaseReady = initializeFirebaseServices();
  if (!firebaseReady) return;

  await initIndexedDB();
  setupAuthFormSwitchers();

  if (auth.currentUser) {
    await initGoogleDriveAPI();
    await processSyncQueue();
  }

  setupAuthStateListener();
}

// ======================
// SECTION 3: INDEXEDDB (OFFLINE-FIRST STORAGE)
// ======================

function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PetHealthDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('pets')) {
        db.createObjectStore('pets', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      petDB = event.target.result;
      console.log('✅ IndexedDB ready');
      resolve();
    };

    request.onerror = (event) => {
      console.error('❌ IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

