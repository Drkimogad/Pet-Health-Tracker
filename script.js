console.log('DOMContentLoaded callback started');
// TEMPORARY ERROR CONTAINMENT
window.onerror = (msg, url, line) => {
  console.warn(`Suppressed ${msg} at ${line}`);
  return true; // Prevents default error handling
};

'use strict'; // Add if not already present
import { setupNotifications, sendPushNotification } from './pushNotifications.js';
// ======== FIREBASE INITIALIZATION ========
// ======================
// ENHANCED FIREBASE INIT FOR GOOGLE DRIVE IMPLEMENTATION
// ======================
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  projectId: "pet-health-tracker-7164d",
  appId: "1:540185558422:web:d560ac90eb1dff3e5071b7", // Added full appId format
  authDomain: "pet-health-tracker-7164d.firebaseapp.com",
  storageBucket: "pet-health-tracker-7164d.appspot.com",
  messagingSenderId: "540185558422", // Added missing field
  measurementId: "G-XXXXXXXXXX" // Recommended for Firebase Analytics
};

// Global service references
function initializeFirebaseServices() {
  try {
    // Safety check for multiple initializations
    if (!firebase.apps.length) {
      const app = firebase.initializeApp(firebaseConfig);     
 // Initialize services with error handling
      auth = firebase.auth(app);
      firestore = firebase.firestore(app); // Future-proofing
      storage = firebase.storage(app); // For future pet images 
// Configure Google Auth Provider
      googleAuthProvider = new firebase.auth.GoogleAuthProvider();
      googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
      googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');
      googleAuthProvider.setCustomParameters({
        prompt: 'select_account' // Forces account selection
      });  
      console.log("✅ Firebase services initialized");
      return true;
    }   
 // Reuse existing services if already initialized
    auth = firebase.auth();
    firestore = firebase.firestore();
    storage = firebase.storage();
    return true;
    
  } catch (error) {
    console.error("🔥 Firebase initialization failed:", error);
 // User-friendly error display
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
// ======================
// AUTH TRIGGERS (GOOGLE DRIVE SYNC)
// ======================
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log("👤 User signed in, initializing Drive...");
    try {
      await initGoogleDriveAPI(); // Load Drive API
      await processSyncQueue();   // Sync pending changes
    } catch (error) {
      console.error("Drive init failed:", error);
    }
  } else {
    console.log("👤 User signed out");
  }
});
// ======================
// INDEXEDDB (OFFLINE-FIRST)
// ======================
let petDB; // Global reference to IndexedDB

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
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}
// ======================
// GOOGLE DRIVE API
// ======================
let gapiInitialized = false;

async function initGoogleDriveAPI() {
  return new Promise((resolve) => {
    gapi.load('client:auth2', async () => {
      await gapi.client.init({
        apiKey: firebaseConfig.apiKey,
        clientId: '251170885789-m02ir3l60sn2pp6dveepdd7jk2ucb5hn.apps.googleusercontent.com', // Replace!
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file',
      });

      gapiInitialized = true;
      console.log('✅ Google Drive API ready');
      resolve();
    });
  });
}
// Core Storage Operations
// A. SAVE PET, HYBRID
async function savePet(petData) {
  // Add metadata
  petData.lastUpdated = Date.now();  // Timestamp for conflict resolution
  petData.ownerId = auth.currentUser.uid; // Link to user
  // 1. Save to IndexedDB
  const tx = petDB.transaction('pets', 'readwrite');
  const store = tx.objectStore('pets');
  store.put(petData);
  // 2. Queue for Google Drive sync
  if (navigator.onLine && gapiInitialized) {
    await syncPetToDrive(petData);
  } else {
    // Offline? Queue for later
    const queueTx = petDB.transaction('syncQueue', 'readwrite');
    queueTx.objectStore('syncQueue').put({
      id: petData.id,
      action: 'save',
      data: petData
    });
  }
}
// B. Sync to Google Drive
async function syncPetToDrive(petData) {
  try {
    const folderId = await getPetFolderId(); // Placeholder (see next snippet)
    const fileName = `pets/${petData.id}.json`;

    const file = await gapi.client.drive.files.create({
      resource: {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/json'
      },
      media: {
        mimeType: 'application/json',
        body: JSON.stringify(petData)
      },
      fields: 'id'
    });

    console.log('📤 Synced to Drive:', file.result.id);
    return true;
  } catch (error) {
    console.error('Drive sync failed:', error);
    return false;
  }
}
// C. Load Pets (Hybrid)
async function loadPets() {
    let pets = [];
  // 1. Try Google Drive first (if online)
  if (navigator.onLine && gapiInitialized) {
    try {
       pets = await loadPetsFromDrive();
    } catch (error) {
      console.warn("Drive load failed:", error);
    }
  }
  // 2. Merge with IndexedDB (keep newest version)
  const localPets = await new Promise((resolve) => {
    const tx = petDB.transaction('pets', 'readonly');
    tx.objectStore('pets').getAll().onsuccess = (e) => resolve(e.target.result || []);
  });
  // Conflict resolution: Keep the newest version
  const mergedPets = [...pets, ...localPets].reduce((acc, pet) => {
    const existing = acc.find(p => p.id === pet.id);
    if (!existing || pet.lastUpdated > existing.lastUpdated) {
      return [...acc.filter(p => p.id !== pet.id), pet];
    }
    return acc;
  }, []);
  
  return mergedPets;
}
// fetches all JSON pet files from the user’s Drive folder.
// Returns an empty array if fails (fallback to IndexedDB).
async function loadPetsFromDrive() {
  try {
    const folderId = await getPetFolderId();
    const response = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      fields: 'files(id, name)'
    });

    const pets = [];
    for (const file of response.result.files) {
      const petFile = await gapi.client.drive.files.get({
        fileId: file.id,
        alt: 'media'
      });
      pets.push(petFile.result);
    }

    return pets;
  } catch (error) {
    console.error('Failed to load pets from Drive:', error);
    return [];
  }
}

// Drive Folder Management
async function getPetFolderId() {
  // Check if folder exists
  const response = await gapi.client.drive.files.list({
    q: "name='Pet Health Tracker' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    spaces: 'drive',
    fields: 'files(id)'
  });

  // Create if missing
  if (response.result.files.length === 0) {
    const folder = await gapi.client.drive.files.create({
      resource: {
        name: 'Pet Health Tracker',
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });
    return folder.result.id;
  }

  return response.result.files[0].id;
}
// Sync Queue Processor when app is online
async function processSyncQueue() {
  const queueTx = petDB.transaction('syncQueue', 'readwrite');
  const queue = await new Promise((resolve) => {
    queueTx.objectStore('syncQueue').getAll().onsuccess = (e) => resolve(e.target.result);
  });

  for (const item of queue) {
    if (item.action === 'save') {
      await syncPetToDrive(item.data);
    }
    // Add other actions (delete, etc.)
  }

  // Clear processed items
  const clearTx = petDB.transaction('syncQueue', 'readwrite');
  clearTx.objectStore('syncQueue').clear();
}

// Call this when network status changes
window.addEventListener('online', processSyncQueue);

// ========================
// SAFE SERVICE ACCESSORS
// ========================
function getAuth() {
  if (!auth) throw new Error("Authentication service not initialized");
  return auth;
}
function getFirestore() {
  if (!firestore) console.warn("Firestore not initialized - using localStorage fallback");
  return firestore;
}
// ======== GLOBAL VARIABLES ========
let editingProfileIndex = null;
let auth, firestore, storage, googleAuthProvider;
// REMINDERS
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

// ======== CORE FUNCTIONS ========
// A. Generate Unique ID
function generateUniqueId() {
  return 'pet-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
// B. Form-to-Data Mapping
function getPetDataFromForm() {
  return {
    // === Auto-generated Fields ===
    id: document.getElementById('petName').value.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36),
    ownerId: auth.currentUser.uid,
    lastUpdated: Date.now(),
    createdAt: Date.now(),

    // === Basic Information ===
    name: document.getElementById('petName').value,
    type: 'Unknown', // Not in form - we'll add a dropdown later
    breed: document.getElementById('breed').value,
    age: parseFloat(document.getElementById('age').value) || 0,
    weight: parseFloat(document.getElementById('weight').value) || 0,
    gender: 'Unknown', // Not in form - we'll add this later
    avatar: '', // Will handle image upload separately

    // === Microchip Information ===
    microchip: {
      id: document.getElementById('microchipId').value,
      date: document.getElementById('microchipDate').value,
      vendor: document.getElementById('microchipVendor').value
    },

    // === Health Information ===
    allergies: document.getElementById('allergies').value,
    medicalHistory: document.getElementById('medicalHistory').value,
    dietPlan: document.getElementById('dietPlan').value,
    mood: document.getElementById('moodSelector').value,

    // === Emergency Contact ===
    emergencyContact: {
      name: document.getElementById('emergencyContactName').value,
      phone: document.getElementById('emergencyContactPhone').value,
      relationship: document.getElementById('emergencyContactRelationship').value
    },

    // === Reminders ===
    reminders: {
      vaccinations: document.getElementById('vaccinationsAndDewormingReminder').value,
      checkups: document.getElementById('medicalCheckupsReminder').value,
      grooming: document.getElementById('groomingReminder').value
    }
  };
}
//Handling Image Uploads
async function handlePetPhotoUpload() {
  const fileInput = document.getElementById('petPhoto');
  if (!fileInput.files[0]) return '';
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('petPhotoPreview');
      preview.src = e.target.result;
      preview.style.display = 'block';
      resolve(e.target.result); // Returns base64 encoded image
    };
    reader.readAsDataURL(fileInput.files[0]);
  });
}

// FUNCTION FORMAT REMINDER
function formatReminder(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}
// FUNCTION REMINDER VALIDATION
function validateReminder(reminderData) {
  const standardizedType = REMINDER_TYPE_MAP[reminderData.type];
  if (!ALLOWED_REMINDER_TYPES.includes(standardizedType)) {
    throw new Error(`Invalid reminder type: ${reminderData.type}`);
  }
  
  const dateValue = new Date(reminderData.dueDate);
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error('Invalid date format for reminder');
  }
  
  return { type: standardizedType, dueDate: dateValue };
}
// ======================
// AUTH FORM MANAGEMENT
// ======================
function switchAuthForm(targetForm) {
  document.getElementById('signUpForm').classList.remove('active');
  document.getElementById('loginForm').classList.remove('active');
  const formElement = document.getElementById(`${targetForm}Form`);
  if (formElement) {
    formElement.classList.add('active');
    formElement.querySelector('form').reset();
  }
}
// ======================
// UTILITY FUNCTIONS
// ======================
function showAuthError(message) {
  const errorElement = document.getElementById('authError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => errorElement.classList.add('hidden'), 5000);
  }
}

function showSystemMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'system-message';
  messageElement.textContent = message;
  document.body.prepend(messageElement);
  setTimeout(() => messageElement.remove(), 5000);
}
// Helper function
function addSafeListener(id, handler) {
  const element = document.getElementById(id);
  if (element) {
    element.removeEventListener('click', handler);
    element.addEventListener('click', handler);
  }
}

function resetForm() {
  const form = document.getElementById('dietForm');
  if (form) form.reset();
  const preview = document.getElementById('petPhotoPreview');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
}

function highlightReminders(reminders, index) {
  const today = new Date();
  const overdueContainer = document.getElementById(`overdueReminders-${index}`);
  const upcomingContainer = document.getElementById(`upcomingReminders-${index}`);

  if (!overdueContainer || !upcomingContainer) return;

  overdueContainer.innerHTML = '';
  upcomingContainer.innerHTML = '';

  Object.entries(reminders).forEach(([reminderKey, reminderValue]) => {
    if (!reminderValue) return;

    const reminderDateTime = new Date(reminderValue);
    const timeDiff = reminderDateTime.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const reminderLabel = reminderFields[reminderKey];

    if (timeDiff < 0) {
      const div = document.createElement('div');
      div.className = 'reminder overdue';
      div.innerHTML = `
        <span class="exclamation">❗</span> 
        ${reminderLabel} was due on ${reminderDateTime.toLocaleString()}
        <button class="deleteReminderButton" 
                data-profile-index="${index}" 
                data-reminder="${reminderKey}">Delete</button>
      `;
      
      overdueContainer.appendChild(div);
    } else if (daysDiff <= REMINDER_THRESHOLD_DAYS) {
      const div = document.createElement('div');
      div.className = 'reminder upcoming';
      div.textContent = `${reminderLabel} is on ${reminderDateTime.toLocaleString()}`;
      upcomingContainer.appendChild(div);
    }
  });
}

// FIXED deleteOverdueReminder FUNCTION
function deleteOverdueReminder(profileIndex, reminderKey) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  
  if (savedProfiles[profileIndex] && savedProfiles[profileIndex][reminderKey]) {
    // Create a copy of the reminder before deletion (optional)
    const deletedReminder = savedProfiles[profileIndex][reminderKey];
    
    // Nullify the reminder
    savedProfiles[profileIndex][reminderKey] = null;
    
    // Update storage
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    
    // Show confirmation
    const reminderLabel = reminderFields[reminderKey];
    alert(`${reminderLabel} reminder deleted!`);
    
    // Refresh UI
    loadSavedPetProfile();
  }
}
// ======================
// MODAL UTILITIES
// ======================
function showModal(content) {
  // Create or reuse modal elements
  let modal = document.getElementById('pet-modal');
  let overlay = document.getElementById('modal-overlay');

  if (!modal) {
    // Create modal structure if it doesn't exist
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    
    modal = document.createElement('div');
    modal.id = 'pet-modal';
    modal.className = 'modal-content';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', hideModal);
    
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Close modal when clicking outside content
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideModal();
    });
  }

  // Insert content and show
  modal.innerHTML = `
    <button class="close-modal">&times;</button>
    ${content}
  `;
  modal.querySelector('.close-modal').addEventListener('click', hideModal);
  
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent page scrolling
}

function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
  }
}
// Add this to handle ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideModal();
});

// Add this to trap focus within modal
function trapFocus(modal) {
  const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });
}
// ======================
// LOAD SAVED PET PROFILES (UPDATED)
// ======================
async function loadSavedPetProfile() {
  try {
    // Get profiles from hybrid storage (Drive + IndexedDB fallback)
    let savedProfiles = [];
    
    if (auth.currentUser && gapiInitialized) {
      savedProfiles = await loadPets(); // From hybrid storage
    } else {
      // Fallback to localStorage
      savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    }

    const savedProfilesList = document.getElementById('savedProfilesList');
    if (!savedProfilesList) return;

    savedProfilesList.innerHTML = '';

    if (savedProfiles.length === 0) {
      savedProfilesList.innerHTML = '<li class="no-profiles">No pet profiles found</li>';
      return;
    }

    savedProfiles.forEach((profile, index) => {
      const emergencyContact = profile.emergencyContacts?.[0] || {};
      const petCard = document.createElement('li');
      petCard.className = 'pet-card';
      
      petCard.innerHTML = `
        <div class="pet-card-content">
          <div class="pet-header">
            ${profile.petPhoto ? 
              `<img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo"/>` : 
              '<div class="pet-photo placeholder">🐾</div>'}
            <h4>${profile.petName || 'Unnamed Pet'}</h4>
          </div>
          
          <div class="pet-details">
            <p><strong>Type:</strong> ${profile.type || 'Unknown'}</p>
            <p><strong>Breed:</strong> ${profile.breed || 'N/A'}</p>
            <p><strong>Age:</strong> ${profile.age || 'N/A'}</p>
            <p><strong>Weight:</strong> ${profile.weight || 'N/A'}</p>
            <p><strong>Gender:</strong> ${profile.gender || 'Unknown'}</p>
          </div>
          
          <div class="pet-actions">
            <button class="editProfileButton" data-id="${profile.id}">Edit</button>
            <button class="deleteProfileButton" data-id="${profile.id}">Delete</button>
            <button class="viewDetailsButton">Details</button>
          </div>
        </div>
      `;

      // Safe event listener attachment
      const addListener = (selector, handler) => {
        const btn = petCard.querySelector(selector);
        if (btn) btn.addEventListener('click', handler);
      };

      addListener('.editProfileButton', () => editPetProfile(profile.id));
      addListener('.deleteProfileButton', () => deletePetProfile(profile.id));
      addListener('.viewDetailsButton', () => showPetDetails(profile));

      savedProfilesList.appendChild(petCard);
    });

  } catch (error) {
    console.error('Load error:', error);
    showAuthError('Failed to load pet profiles');
  }
}

// Helper function to show detailed view
function showPetDetails(profile) {
  const emergencyContact = profile.emergencyContacts?.[0] || {};
  
  const detailsHtml = `
    <h3>${profile.petName || 'Unnamed Pet'}</h3>
    ${profile.petPhoto ? `<img src="${profile.petPhoto}" class="detail-photo">` : ''}
      
      <div class="details-grid">
        <div><strong>Type:</strong> ${profile.type || 'Unknown'}</div>
        <div><strong>Breed:</strong> ${profile.breed || 'N/A'}</div>
        <div><strong>Age:</strong> ${profile.age || 'N/A'}</div>
        <div><strong>Weight:</strong> ${profile.weight || 'N/A'}</div>
        <div><strong>Gender:</strong> ${profile.gender || 'Unknown'}</div>
        
        <div class="section-break"><strong>Microchip:</strong></div>
        <div>ID: ${profile.microchip?.id || 'N/A'}</div>
        <div>Date: ${profile.microchip?.date || 'N/A'}</div>
        <div>Vendor: ${profile.microchip?.vendor || 'N/A'}</div>
        
        <div class="section-break"><strong>Health:</strong></div>
        <div>Allergies: ${profile.allergies || 'N/A'}</div>
        <div>Medical History: ${profile.medicalHistory || 'N/A'}</div>
        <div>Diet Plan: ${profile.dietPlan || 'N/A'}</div>
        <div>Current Mood: ${profile.mood || 'N/A'}</div>
        
        <div class="section-break"><strong>Reminders:</strong></div>
        <div>Vaccinations: ${formatReminder(profile.vaccinationsAndDewormingReminder)}</div>
        <div>Checkups: ${formatReminder(profile.medicalCheckupsReminder)}</div>
        <div>Grooming: ${formatReminder(profile.groomingReminder)}</div>
        
        <div class="section-break"><strong>Emergency Contact:</strong></div>
        <div>Name: ${emergencyContact.name || 'N/A'}</div>
        <div>Phone: ${emergencyContact.phone || 'N/A'}</div>
        <div>Relationship: ${emergencyContact.relationship || 'N/A'}</div>
       </div>
       <div class="modal-actions">
      <button class="print-btn" onclick="window.print()">Print</button>
      <button class="close-btn" onclick="hideModal()">Close</button>
      </div>
      
      <button class="close-details">Close</button>
    </div>
  `;
  
  // Implement your modal display logic here
  showModal(detailsHtml);
}
// ====== PRETTIER-FRIENDLY VERSION ======
// (Alternative if you prefer more compact syntax)
const reminders = {
  vaccinationDue: profile.vaccinationsAndDewormingReminder,
  checkupDue: profile.medicalCheckupsReminder,
  groomingDue: profile.groomingReminder
};
highlightReminders(reminders, index);

// FUNCTION EDIT PROFILE/HELPER FUNCTION FOR USER'S NOTIFICATION
// ===== HELPER FUNCTION =====
function showSuccessNotification(action, petName) {
  const message = `${petName}'s profile was ${action} successfully!`;
  
  // Browser notification (if permissions allowed)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Success', { body: message });
  }  
  // Always show alert as fallback
  alert(message);
}
// FUNCTION EDIT PROFILE
// FUNCTION EDIT PROFILE (UPDATED FOR HYBRID STORAGE)
async function editPetProfile(petId) {
  try {
    let profile;
    
    // 1. Try to load from Google Drive if available
    if (auth.currentUser && gapiInitialized) {
      const pets = await loadPets();
      profile = pets.find(p => p.id === petId);
    }
    
    // 2. Fallback to localStorage
    if (!profile) {
      const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
      profile = savedProfiles.find(p => p.id === petId);
    }

    if (!profile) {
      showAuthError("Profile not found");
      return;
    }

    // Store original profile for cancel/recovery
    editingProfileId = petId;
    sessionStorage.setItem(`editingProfile_${petId}`, JSON.stringify(profile));

    // Your existing field population logic (unchanged)
    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    };

    setValue('petName', profile.petName);
    setValue('breed', profile.breed);
    setValue('age', profile.age);
    setValue('weight', profile.weight);
    setValue('microchipId', profile.microchip?.id);
    setValue('microchipDate', profile.microchip?.date);
    setValue('microchipVendor', profile.microchip?.vendor);
    setValue('allergies', profile.allergies);
    setValue('medicalHistory', profile.medicalHistory);
    setValue('dietPlan', profile.dietPlan);
    setValue('moodSelector', profile.mood);
    setValue('emergencyContactName', profile.emergencyContacts?.[0]?.name);
    setValue('emergencyContactPhone', profile.emergencyContacts?.[0]?.phone);
    setValue('emergencyContactRelationship', profile.emergencyContacts?.[0]?.relationship);
    setValue('vaccinationsAndDewormingReminder', profile.vaccinationsAndDewormingReminder);
    setValue('medicalCheckupsReminder', profile.medicalCheckupsReminder);
    setValue('groomingReminder', profile.groomingReminder);
    
    // Add these for new fields if they exist in the profile
    if (profile.type) setValue('petType', profile.type);
    if (profile.gender) setValue('petGender', profile.gender);

    // Handle pet photo preview (unchanged)
    const preview = document.getElementById('petPhotoPreview');
    if (preview && profile.petPhoto) {
      preview.src = profile.petPhoto;
      preview.style.display = 'block';
    }

    // Show cancel button (unchanged)
    const cancelButton = document.getElementById('cancelEdit');
    if (cancelButton) {
      cancelButton.style.display = 'inline-block';
      cancelButton.onclick = handleCancelEdit;
    }

    // Scroll to form
    document.getElementById('dietForm').scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Edit error:', error);
    showAuthError('Failed to load profile for editing');
  }
}

// UPDATED CANCEL FUNCTION
function handleCancelEdit() {
  if (editingProfileId !== null) {
    const originalProfile = JSON.parse(sessionStorage.getItem(`editingProfile_${editingProfileId}`));
    if (originalProfile) {
      // Temporarily use the old edit function to restore values
      const tempEdit = (profile) => {
        const setValue = (id, value) => {
          const el = document.getElementById(id);
          if (el) el.value = value || '';
        };
        //... (all your setValue calls from original edit function)
            setValue('petName', profile.petName);
    setValue('breed', profile.breed);
    setValue('age', profile.age);
    setValue('weight', profile.weight);
    setValue('microchipId', profile.microchip?.id);
    setValue('microchipDate', profile.microchip?.date);
    setValue('microchipVendor', profile.microchip?.vendor);
    setValue('allergies', profile.allergies);
    setValue('medicalHistory', profile.medicalHistory);
    setValue('dietPlan', profile.dietPlan);
    setValue('moodSelector', profile.mood);
    setValue('emergencyContactName', profile.emergencyContacts?.[0]?.name);
    setValue('emergencyContactPhone', profile.emergencyContacts?.[0]?.phone);
    setValue('emergencyContactRelationship', profile.emergencyContacts?.[0]?.relationship);
    setValue('vaccinationsAndDewormingReminder', profile.vaccinationsAndDewormingReminder);
    setValue('medicalCheckupsReminder', profile.medicalCheckupsReminder);
    setValue('groomingReminder', profile.groomingReminder);
    };
        
      tempEdit(originalProfile);
    }
    sessionStorage.removeItem(`editingProfile_${editingProfileId}`);
    editingProfileId = null;
    const cancelButton = document.getElementById('cancelEdit');
    if (cancelButton) cancelButton.style.display = 'none';
  }
  resetForm();
}

// FUNCTION DELETE PROFILE
function deletePetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  if (index >= 0 && index < savedProfiles.length) {
    // Store pet name before deletion for notification
    const petName = savedProfiles[index].petName || 'Unnamed Pet';
    
    savedProfiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
    // Show deletion notification
    showSuccessNotification('Profile deleted', petName);
  }
}

// Print Pet Profile button functionality
function printPetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[index];

  const printWindow = window.open('', '_blank', 'height=600,width=800');

  // Phase 1: Preload all assets
  const assetPromises = [];

  // Handle pet photo loading
  let photoDataURL = null;
  if (profile.petPhoto) {
    assetPromises.push(new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        photoDataURL = canvas.toDataURL('image/png');
        resolve();
      };
      img.onerror = reject;
      img.src = profile.petPhoto;
    }));
  }

  // Show loading state
  printWindow.document.write(`
        <html>
            <head><title>Loading...</title></head>
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh;">
                <div class="loader">Generating Printable Version...</div>
            </body>
        </html>
    `);

  // Phase 2: Build content after assets load
  Promise.all(assetPromises)
    .then(() => {
      const printContent = `
                <html>
                    <head>
                        <title>${profile.petName}'s Profile</title>
                        <style>
                            ${document.querySelector('style').innerHTML}
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .print-section { margin-bottom: 25px; }
                            .pet-photo-print { 
                                max-width: 300px; 
                                height: auto; 
                                margin: 15px 0; 
                                border: 2px solid #eee;
                                border-radius: 8px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>${profile.petName}'s Health Profile</h1>
                        ${photoDataURL ? `<img src="${photoDataURL}" class="pet-photo-print">` : ''}
                        <!-- Rest of your content sections -->
                    </body>
                </html>
            `;

      // Phase 3: Write final content
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Phase 4: Ensure DOM is ready
      printWindow.document.addEventListener('DOMContentLoaded', () => {
        // Phase 5: Wait for all subresources
        printWindow.addEventListener('load', () => {
          // Phase 6: Small delay for rendering completion
          setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => {
              if (photoDataURL) URL.revokeObjectURL(photoDataURL);
              printWindow.close();
            };
          }, 500);
        });
      });
    })
    .catch(error => {
      console.error('Print failed:', error);
      printWindow.document.body.innerHTML =`<h1>Error: ${error.message}</h1>`;
      printWindow.print();
    });
}

// Share Pet Profile button functionality
function sharePetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[index];
  const emergencyContact = (profile.emergencyContacts && profile.emergencyContacts[0]) || {};

  const shareData = {
    title: `${profile.petName}'s Health Profile`,
    text: `Pet Details:\n${
      Object.entries({
        Name: profile.petName,
        Breed: profile.breed,
        Age: profile.age,
        Weight: profile.weight,
        'Microchip ID': (profile.microchip && profile.microchip.id) || 'N/A',
        Allergies: profile.allergies || 'N/A',
        'Medical History': profile.medicalHistory || 'N/A',
        'Diet Plan': profile.dietPlan || 'N/A',
        'Vaccinations/Deworming': profile.vaccinationsAndDewormingReminder || 'N/A',
        'Medical Check-ups': profile.medicalCheckupsReminder || 'N/A',
        Grooming: profile.groomingReminder || 'N/A',
        'Emergency Contact': `${emergencyContact.name || 'N/A'} (${emergencyContact.relationship || 'N/A'}) - ${emergencyContact.phone || 'N/A'}`
      })
      .map(([key, val]) => `${key}: ${val}`)
      .join('\n')
    }`,
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData)
      .then(() => console.log('Shared successfully'))
      .catch(console.error);
  } else {
    const textToCopy =
      `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;

    // Modern clipboard API fallback
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => alert('Profile copied to clipboard!'))
        .catch(() => prompt('Copy the following text:', textToCopy));
    } else {
      prompt('Copy the following text:', textToCopy);
    }
  }
}
// ======== QR CODE GENERATION button functionality ========
function generateQRCode(profileIndex) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const profile = savedProfiles[profileIndex];

  if (!profile) {
    alert("Profile not found!");
    return;
  }

  // FIX 1: Proper window features string
  const windowFeatures = `width=400,height=500,petName=${encodeURIComponent(profile.petName || 'PetProfile')}`;
  const qrWindow = window.open('', 'QR_Code_Window', windowFeatures); // FIX 2: Consistent window name

  if (!qrWindow) {
    alert("Popup blocked! Please allow popups for this site.");
    return;
  }

  // FIX 3: Properly escaped HTML with DOCTYPE
  qrWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Loading QR Code...</title>
        <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script> <!-- FIX 4: Escaped script tag -->
        <style>
          .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20% auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <div id="qrcode-container" style="display: none; margin: 20px auto; text-align: center;"></div>
        <div id="qr-controls" style="display: none; text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; margin: 0 10px; background: #2ecc71; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
          <button onclick="downloadQR()" style="padding: 10px 20px; margin: 0 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Download</button>
          <p style="margin-top: 20px; font-size: 0.8em; color: #777;">Scan for Emergency Information</p>
          <p style="font-size: 0.7em; color: #999; margin-top: 10px;">Generated by Pet Health Tracker</p>
        </div>
        <script>
          function downloadQR() {
            const qrcodeContainer = document.getElementById('qrcode-container');
            const canvas = qrcodeContainer.querySelector('canvas');
            if (canvas) {
              const link = document.createElement('a');
              link.download = '${(profile.petName || 'PetProfile').replace(/[^a-z0-9]/gi, '_')}_QR.png'; // FIX 5: Sanitized filename
              link.href = canvas.toDataURL();
              link.click();
            } else {
              alert('QR code not yet generated.');
            }
          }
        <\/script> <!-- FIX 6: Escaped closing script tag -->
      </body>
    </html>
  `);
  qrWindow.document.close();

  // FIX 7: Added null checks for profile data
  qrWindow.addEventListener('load', () => {
    const emergencyContact = (profile.emergencyContacts && profile.emergencyContacts[0]) || {};
    const microchip = profile.microchip || {};

    const qrText = `
PET PROFILE
Name: ${profile.petName || 'N/A'}
Breed: ${profile.breed || 'N/A'}
Age: ${profile.age || 'N/A'}
Weight: ${profile.weight || 'N/A'}
Microchip ID: ${microchip.id || 'N/A'}
Allergies: ${profile.allergies || 'N/A'}
Medical History: ${profile.medicalHistory || 'N/A'}
Diet Plan: ${profile.dietPlan || 'N/A'}
Vaccinations/Deworming: ${profile.vaccinationsAndDewormingReminder || 'N/A'}
Medical Check-ups: ${profile.medicalCheckupsReminder || 'N/A'}
Grooming: ${profile.groomingReminder || 'N/A'}
Emergency Contact: ${emergencyContact.name || 'N/A'} (${emergencyContact.relationship || 'N/A'}) - ${emergencyContact.phone || 'N/A'}
    `.trim();

    try {
      const qrcodeContainer = qrWindow.document.getElementById('qrcode-container');
      if (!qrcodeContainer) throw new Error('QR container not found');
      
      qrcodeContainer.style.display = 'block';
      
      // FIX 8: Verify QRCode library loaded
      if (!qrWindow.QRCode) throw new Error('QRCode library not loaded');
      
      new qrWindow.QRCode(qrcodeContainer, {
        text: qrText,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: qrWindow.QRCode.CorrectLevel.H
      });

      const qrControls = qrWindow.document.getElementById('qr-controls');
      if (qrControls) qrControls.style.display = 'block';

    } catch (error) {
      console.error('QR Generation Error:', error);
      qrWindow.document.body.innerHTML = `
        <h1 style="color: red; text-align: center; margin-top: 50px;">
          Error: ${error.message}
        </h1>
        <button onclick="window.close()" style="display: block; margin: 20px auto; padding: 10px 20px;">
          Close Window
        </button>
      `;
    } finally {
      const loader = qrWindow.document.querySelector('.loader');
      if (loader) loader.style.display = 'none';
    }
  });
}
// ======== MAIN INITIALIZATION UPDATED ========
document.addEventListener('DOMContentLoaded', () => {
  // Authentication Section
  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('mainContent');
  const logoutButton = document.getElementById('logoutButton');
// Image Preview Handler (NO CHANGES NEEDED)
  const petPhotoInput = document.getElementById('petPhoto');
  const petPhotoPreview = document.getElementById('petPhotoPreview');
  if (petPhotoInput && petPhotoPreview) {
    petPhotoInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          petPhotoPreview.src = e.target.result;
          petPhotoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ======== FIREBASE AUTH HANDLER ========
  const authStateHandler = async (user) => {
    try {
      if (user) {
        // UI Update
        authSection.style.display = 'none';
        mainContent.style.display = 'block';
        logoutButton.style.display = 'block';

        // Initialize Features
        const notificationsReady = await setupNotifications();
        if (notificationsReady) {
          await sendPushNotification('Welcome Back!', 'Your pet profiles are ready');
        }

        // Load Data
        await loadSavedPetProfile();
      } else {
        // UI Update
        authSection.style.display = 'block';
        mainContent.style.display = 'none';
        logoutButton.style.display = 'none';
        switchAuthForm('login');
      }
    } catch (error) {
      console.error('Auth state error:', error);
      authSection.style.display = 'block'; // ADDED: Fallback to auth view
      switchAuthForm('login'); // ADDED: Ensure login form shows
    }
  };

  // Firebase Initialization (IMPROVED ERROR HANDLING)
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      const unsubscribe = firebase.auth().onAuthStateChanged(authStateHandler);
      
      // CLEANUP ON UNLOAD
      window.addEventListener('beforeunload', () => {
        unsubscribe();
      });
    })
    .catch((error) => {
      console.error("Auth persistence error:", error);
      authSection.style.display = 'block';
      switchAuthForm('login'); // ADDED: Force login form on error
    });
});
// ======== SESSION STORAGE RECOVERY ========
const editingSessionKeys = Array.from({ length: sessionStorage.length })
  .map((_, i) => sessionStorage.key(i))
  .filter(key => key.startsWith('editingProfile_'));

editingSessionKeys.forEach(key => {
  const petId = key.split('_')[1]; // Changed from index to ID
  const originalProfile = JSON.parse(sessionStorage.getItem(key));

  if (originalProfile) {
    const safeSetValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    };
        // Add these new field handlers:
    safeSetValue('petType', originalProfile.type || 'Unknown');
    safeSetValue('petGender', originalProfile.gender || 'Unknown');

    // Basic Info
    safeSetValue('petName', originalProfile.petName || '');
    safeSetValue('breed', originalProfile.breed || '');
    safeSetValue('age', originalProfile.age || '');
    safeSetValue('weight', originalProfile.weight || '');

    // Microchip Details
    safeSetValue('microchipId', 
      (originalProfile.microchip && originalProfile.microchip.id) || ''
    );
    safeSetValue('microchipDate', 
      (originalProfile.microchip && originalProfile.microchip.date) || ''
    );
    safeSetValue('microchipVendor', 
      (originalProfile.microchip && originalProfile.microchip.vendor) || ''
    );

    // Health Info
    safeSetValue('allergies', originalProfile.allergies || '');
    safeSetValue('medicalHistory', originalProfile.medicalHistory || '');
    safeSetValue('dietPlan', originalProfile.dietPlan || '');

    // Emergency Contact
    const emergencyContact = (originalProfile.emergencyContacts && 
                            originalProfile.emergencyContacts[0]) || {};
    safeSetValue('emergencyContactName', emergencyContact.name || '');
    safeSetValue('emergencyContactPhone', emergencyContact.phone || '');
    safeSetValue('emergencyContactRelationship', emergencyContact.relationship || '');

    // Mood Selector
    safeSetValue('moodSelector', originalProfile.mood || 'default');

    // Reminders
    safeSetValue('vaccinationsAndDewormingReminder', 
      originalProfile.vaccinationsAndDewormingReminder || ''
    );
    safeSetValue('medicalCheckupsReminder', 
      originalProfile.medicalCheckupsReminder || ''
    );
    safeSetValue('groomingReminder', originalProfile.groomingReminder || '');

    // Pet Photo
    if (originalProfile.petPhoto) {
      const petPhotoPreview = document.getElementById('petPhotoPreview');
      if (petPhotoPreview) {
        petPhotoPreview.src = originalProfile.petPhoto;
        petPhotoPreview.style.display = 'block';
      }
    }
  }
});

// ======================
// FORM SUBMISSION (UPDATED)
// ======================
document.getElementById('dietForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    // Get all form data (preserving your existing structure)
    const petData = {
      // Your existing fields
      petName: document.getElementById('petName')?.value,
      breed: document.getElementById('breed')?.value,
      age: document.getElementById('age')?.value,
      weight: document.getElementById('weight')?.value,
      microchip: {
        id: document.getElementById('microchipId')?.value,
        date: document.getElementById('microchipDate')?.value,
        vendor: document.getElementById('microchipVendor')?.value
      },
      allergies: document.getElementById('allergies')?.value,
      medicalHistory: document.getElementById('medicalHistory')?.value,
      dietPlan: document.getElementById('dietPlan')?.value,
      emergencyContacts: [{
        name: document.getElementById('emergencyContactName')?.value,
        phone: document.getElementById('emergencyContactPhone')?.value,
        relationship: document.getElementById('emergencyContactRelationship')?.value
      }],
      mood: document.getElementById('moodSelector')?.value,
      vaccinationsAndDewormingReminder: document.getElementById('vaccinationsAndDewormingReminder')?.value,
      medicalCheckupsReminder: document.getElementById('medicalCheckupsReminder')?.value,
      groomingReminder: document.getElementById('groomingReminder')?.value,
      
      // New fields we're adding
      id: generateUniqueId(),
      ownerId: auth.currentUser?.uid || 'local-user',
      lastUpdated: Date.now(),
      createdAt: Date.now(),
      type: 'Unknown', // Will add to form later
      gender: 'Unknown' // Will add to form later
    };

    // Handle image upload (keeping your preview logic)
    const fileInput = document.getElementById('petPhoto');
    if (fileInput.files[0]) {
      petData.petPhoto = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          document.getElementById('petPhotoPreview').src = e.target.result;
          resolve(e.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
      });
    }

    // Save using hybrid approach
    if (auth.currentUser && gapiInitialized) {
      await savePet(petData); // Google Drive + IndexedDB
    } else {
      // LocalStorage fallback (your existing code)
      const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
      if (editingProfileIndex !== null) {
        savedProfiles[editingProfileIndex] = petData;
        editingProfileIndex = null;
      } else {
        savedProfiles.push(petData);
      }
      localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    }

    // UI Feedback
    showSuccessNotification(
      editingProfileIndex !== null ? 'Profile updated' : 'Profile saved',
      petData.petName || 'Unnamed Pet'
    );

    // Reset and reload
    loadSavedProfiles();
    resetForm();

  } catch (error) {
    console.error('Save error:', error);
    showAuthError('Failed to save profile. Please try again.');
  }
});
  // Event Delegation
// Event Delegation (Improved with null checks)
document.getElementById('savedProfilesList')?.addEventListener('click', (e) => {
  // 1. Null check for target element
  if (!e.target || !e.target.classList) return;

  // 2. Edit Profile Button
  if (e.target.classList.contains('editProfileButton')) {
    const index = parseInt(e.target.dataset?.index || '', 10);
    if (!isNaN(index)) editPetProfile(index);
    else console.error('Invalid edit index:', e.target.dataset.index);
  }

  // 3. Delete Profile Button
  else if (e.target.classList.contains('deleteProfileButton')) {
    const index = parseInt(e.target.dataset?.index || '', 10);
    if (!isNaN(index)) deletePetProfile(index);
    else console.error('Invalid delete index:', e.target.dataset.index);
  }

  // 4. Delete Reminder Button (Your specific case)
  else if (e.target.classList.contains('deleteReminderButton')) {
    const profileIndex = parseInt(e.target.dataset?.profileIndex || '', 10);
    const reminderKey = e.target.dataset?.reminder;
    
    if (!isNaN(profileIndex) && reminderKey && reminderFields[reminderKey]) {
      deleteOverdueReminder(profileIndex, reminderKey);
    } else {
      console.error('Invalid reminder deletion:', {
        profileIndex,
        reminderKey,
        validKeys: Object.keys(reminderFields)
      });
    }
  }
});

// ======== AUTHENTICATION HANDLERS ========
// ======== SIGN-UP HANDLER ========
document.getElementById('signUpForm')?.addEventListener('submit', function(event) {
  event.preventDefault();
  const email = this.querySelector('#signUpEmail').value.trim();
  const password = this.querySelector('#signUpPassword').value.trim();

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log('User created:', userCredential.user);
      alert('Sign-up successful! Please login.');
      this.reset();
      
      // NEW: Automatically sign out after registration
      return firebase.auth().signOut(); // <-- This ensures clean login flow
    })
    .then(() => {
      // Force show login form
      switchAuthForm('login'); // <-- This redirects to login
    })
    .catch((error) => {
      console.error('Sign-up error:', error);
      alert(`Sign-up failed: ${error.message}`);
      // Don't reset form to allow error correction
    });
});

// ======== LOGIN HANDLER ========
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const form = this; // Capture form reference
    
    const email = form.querySelector('#loginEmail').value.trim();
    const password = form.querySelector('#loginPassword').value.trim();

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('User logged in:', userCredential.user);
        form.reset(); // Use captured reference
      })
      .catch((error) => {
        console.error('Login error:', error);
        alert(`Login failed: ${error.message}`);
        // Removed reset to allow retry
      });
  });
}

// ======== LOGOUT HANDLER ========
const logoutButtonElement = document.getElementById('logoutButton');
if (logoutButtonElement) {
  logoutButtonElement.addEventListener('click', function() {
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
// Updated Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = 'https://drkimogad.github.io/Pet-Health-Tracker/service-worker.js';
    
    // First check if the SW file exists
    fetch(swUrl)
      .then(response => {
        if (!response.ok) throw new Error('SW file not found');
        
        // Only register if file exists
        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            console.log('SW registered:', registration.scope);
            registration.update(); // Check for updates immediately
          })
          .catch(err => console.error('SW registration failed:', err));
      })
      .catch(err => {
        console.warn('Service worker not available:', err);
        // Optional: Show "Offline mode" notification to user
      });
  });
}
  
// Add this to catch handled errors 
window.onerror = (msg, url, line) => {
  alert(`Error: ${msg}\nLine: ${line}`);
  return true; // Prevent default error logging
};
  
// ======== INITIAL UI SETUP ========
addSafeListener('showLogin', (e) => {
  e.preventDefault();
  switchAuthForm('login');
});

addSafeListener('showSignUp', (e) => {
  e.preventDefault();
  switchAuthForm('signUp');
});

// ======================
// STARTUP
// ======================
async function initializeApp() {
  await initializeFirebaseServices();
  await initIndexedDB();
  
  // Only init Drive if user is logged in
  if (auth.currentUser) {
    await initGoogleDriveAPI();
    await processSyncQueue(); // Sync any pending changes
  }
}
// Run on load
document.addEventListener('DOMContentLoaded', initializeApp);


