// 🚨 STRICT MODE & IMPORTS
'use strict';
import { setupNotifications, sendPushNotification } from './pushNotifications.js';

// 🔥 GLOBAL STATE (Encapsulated)
let editingProfileId = null;
let auth, firestore, storage, googleAuthProvider;
let petDB, gapiInitialized = false; // IndexedDB & Drive status
// 🔥 FIREBASE CORE
const firebaseConfig = { /* ... */ };

function initializeFirebaseServices() {
  try {
    if (!firebase.apps.length) {
      const app = firebase.initializeApp(firebaseConfig);
      // ... (existing init code)
    }
    return true;
  } catch (error) {
    console.error("🔥 Firebase Error:", error);
    document.getElementById('root').innerHTML = `<div class="critical-error">FIREBASE INIT FAILURE - ${error.message}</div>`;
    return false;
  }
}

// 🔑 AUTH STATE SYNC
function initAuthListeners() {
  auth.onAuthStateChanged(async (user) => {
    try {
      if (user) await Promise.all([initGoogleDriveAPI(), processSyncQueue()]);
    } catch (error) {
      console.error("❗ Auth State Error:", error);
      showSystemMessage(`Sync failed: ${error.message}`);
    }
  });
}
// ======== INDEXEDDB ========
let petDB; // Global DB reference

function initIndexedDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open('PetHealthDB', 2);
    
    // 🛠️ Schema Upgrade Handler
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pets')) {
        const petsStore = db.createObjectStore('pets', { keyPath: 'id' });
        petsStore.createIndex('ownerId', 'ownerId', { unique: false });
        petsStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('action', 'action', { unique: false });
      }
    };

    // ✅ Success Handler
    request.onsuccess = (event) => {
      petDB = event.target.result;
      
      // 🔥 Global DB Error Listener
      petDB.onerror = (e) => {
        console.error(`IndexedDB Error (${e.target.errorCode}):`, e.target.error);
        showSystemMessage('Database operation failed. Please try again.');
      };
      
      console.log('🗄️ IndexedDB initialized');
      resolve();
    };

    // ❌ Error Handler
    request.onerror = (event) => {
      const error = new Error(`IndexedDB failed to open: ${event.target.error}`);
      console.error(error);
      document.body.classList.add('database-error');
      reject(error);
    };
  });
}
// ======== GOOGLE DRIVE SYNC ======== 
let gapiInitialized = false;

async function initGoogleDriveAPI() {
  if (!navigator.onLine) {
    console.warn('Offline - Drive API initialization skipped');
    return false;
  }

  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error("Google APIs not loaded"));
      return;
    }

    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          apiKey: firebaseConfig.apiKey,
          clientId: '251170885789-...', // Replace with your client ID
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          scope: 'https://www.googleapis.com/auth/drive.file'
        });

        // 🕵️♀️ Add file change watcher
        await gapi.client.drive.files.watch({
          fileId: await getPetFolderId(),
          supportsAllDrives: true
        });

        gapiInitialized = true;
        console.log('☁️ Google Drive API ready');
        resolve(true);
      } catch (error) {
        console.error("🚨 Drive API Error:", error);
        showSystemMessage('Google Drive sync disabled. Working offline.');
        reject(error);
      }
    });
  });
}

// 🔄 Sync Queue Processor
async function processSyncQueue() {
  if (!gapiInitialized || !navigator.onLine) return;

  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const tx = petDB.transaction('syncQueue', 'readwrite');
      const queue = await new Promise(resolve => {
        tx.objectStore('syncQueue').getAll().onsuccess = e => resolve(e.target.result);
      });

      for (const item of queue) {
        switch (item.action) {
          case 'save':
            await syncPetToDrive(item.data);
            break;
          case 'delete':
            await gapi.client.drive.files.delete({ fileId: item.driveId });
            break;
        }
      }

      // ✅ Clear queue on success
      await new Promise(resolve => {
        petDB.transaction('syncQueue', 'readwrite')
          .objectStore('syncQueue')
          .clear().onsuccess = resolve;
      });
      
      return;
    } catch (error) {
      retryCount++;
      await new Promise(r => setTimeout(r, 1000 * retryCount ** 2)); // Exponential backoff
    }
  }
  
  showSystemMessage('Failed to sync after 3 attempts. Please check connection.');
}
// ======== UI UTILITIES ========
// 🚨 ERROR HANDLING CORE
function showAuthError(message) {
  try {
    const errorElement = document.getElementById('authError');
    if (!errorElement) throw new Error('Auth error element missing');
    
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
      errorElement.classList.add('hidden');
      errorElement.textContent = ''; // Reset content
    }, 5000);
  } catch (error) {
    console.error('UI Error Handler Failed:', error);
    alert(`Error: ${message}`); // Fallback
  }
}

// 📢 SYSTEM MESSAGING
function showSystemMessage(message, type = 'info') {
  try {
    const existingMessages = document.querySelectorAll('.system-message');
    if (existingMessages.length > 3) {
      existingMessages[0].remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = `system-message ${type}`;
    messageElement.innerHTML = `
      <span class="icon">${type === 'error' ? '❗' : 'ℹ️'}</span>
      <span class="text">${message}</span>
      <button class="dismiss" aria-label="Close">&times;</button>
    `;

    messageElement.querySelector('.dismiss').addEventListener('click', () => {
      messageElement.remove();
    });

    document.body.prepend(messageElement);
    setTimeout(() => messageElement.remove(), 10000);
  } catch (error) {
    console.error('System Message Failed:', error);
    alert(message); // Fallback
  }
}

// 🛡️ SAFE EVENT LISTENERS
function addSafeListener(id, handler, event = 'click') {
  try {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element #${id} not found`);
    }
    
    element.removeEventListener(event, handler);
    element.addEventListener(event, handler);
    element.dataset.listenerActive = 'true'; // Debug flag
  } catch (error) {
    console.error(`Event Error (${id}):`, error);
    showSystemMessage(`UI interaction failed: ${id}`, 'error');
  }
}

// 🖼️ IMAGE HANDLING
async function handlePetPhotoUpload() {
  const fileInput = document.getElementById('petPhoto');
  if (!fileInput) return '';

  try {
    if (!fileInput.files[0]) return '';
    
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('petPhotoPreview');
        if (preview) {
          preview.src = e.target.result;
          preview.style.display = 'block';
        }
        resolve(e.target.result);
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(fileInput.files[0]);
    });
  } catch (error) {
    console.error('Image Upload Error:', error);
    showSystemMessage('Failed to process pet photo', 'error');
    return '';
  }
}

// 🔄 FORM MANAGEMENT
function resetForm() {
  try {
    const form = document.getElementById('dietForm');
    if (form) {
      form.reset();
      form.dataset.lastReset = new Date().toISOString(); // Debug tracking
    }

    const preview = document.getElementById('petPhotoPreview');
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
      preview.dataset.state = 'reset'; // Debug state
    }
  } catch (error) {
    console.error('Form Reset Error:', error);
    showSystemMessage('Failed to reset form', 'error');
  }
}
// ======== REMINDER CORE ======== 
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

// 🚨 VALIDATION CORE
function validateReminder(reminderData) {
  try {
    if (!reminderData || typeof reminderData !== 'object') {
      throw new Error('Invalid reminder input format');
    }

    const standardizedType = REMINDER_TYPE_MAP[reminderData.type];
    if (!ALLOWED_REMINDER_TYPES.includes(standardizedType)) {
      throw new Error(`Invalid reminder type: ${reminderData.type}`);
    }

    const dateValue = new Date(reminderData.dueDate);
    if (Number.isNaN(dateValue.getTime())) {
      throw new Error(`Invalid date format: ${reminderData.dueDate}`);
    }

    return { 
      type: standardizedType, 
      dueDate: dateValue,
      originalData: reminderData // For debugging
    };
  } catch (error) {
    console.error('Reminder Validation Failed:', error);
    throw new Error(`Reminder error: ${error.message}`);
  }
}

// 🎨 UI HIGHLIGHTING
function highlightReminders(reminders, index) {
  try {
    const today = new Date();
    const overdueContainer = document.getElementById(`overdueReminders-${index}`);
    const upcomingContainer = document.getElementById(`upcomingReminders-${index}`);

    if (!overdueContainer || !upcomingContainer) {
      throw new Error(`Reminder containers missing for index ${index}`);
    }

    // Clear previous state
    overdueContainer.innerHTML = '';
    upcomingContainer.innerHTML = '';
    overdueContainer.dataset.lastUpdated = Date.now();
    upcomingContainer.dataset.lastUpdated = Date.now();

    Object.entries(reminders).forEach(([reminderKey, reminderValue]) => {
      if (!reminderValue) return;

      const reminderDateTime = new Date(reminderValue);
      const timeDiff = reminderDateTime.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // 🛡️ Sanity check
      if (Number.isNaN(daysDiff)) {
        console.warn('Invalid reminder date:', reminderValue);
        return;
      }

      const reminderLabel = reminderFields[reminderKey];
      const div = document.createElement('div');
      
      if (timeDiff < 0) {
        div.className = 'reminder overdue';
        div.innerHTML = `
          <span class="exclamation">❗</span> 
          ${reminderLabel} was due on ${reminderDateTime.toLocaleString()}
          <button class="deleteReminderButton" 
                  data-profile-index="${index}" 
                  data-reminder="${reminderKey}"
                  aria-label="Delete ${reminderLabel} reminder">
            Delete
          </button>
        `;
        overdueContainer.appendChild(div);
      } else if (daysDiff <= REMINDER_THRESHOLD_DAYS) {
        div.className = 'reminder upcoming';
        div.innerHTML = `
          <span class="clock">⏰</span>
          ${reminderLabel} in ${daysDiff} days (${reminderDateTime.toLocaleDateString()})
        `;
        upcomingContainer.appendChild(div);
      }
    });

  } catch (error) {
    console.error('Reminder Highlight Error:', error);
    showSystemMessage('Failed to display reminders', 'error');
  }
}

// 🗑️ DELETE HANDLER
function deleteOverdueReminder(profileIndex, reminderKey) {
  try {
    if (typeof profileIndex !== 'number' || profileIndex < 0) {
      throw new Error(`Invalid profile index: ${profileIndex}`);
    }

    if (!reminderFields.hasOwnProperty(reminderKey)) {
      throw new Error(`Invalid reminder key: ${reminderKey}`);
    }

    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    
    if (!Array.isArray(savedProfiles)) {
      throw new Error('Corrupted profile data in localStorage');
    }

    if (!savedProfiles[profileIndex])) {
      throw new Error(`Profile ${profileIndex} not found`);
    }

    const deletedValue = savedProfiles[profileIndex][reminderKey];
    savedProfiles[profileIndex][reminderKey] = null;
    
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    
    // 📢 Audit trail
    console.log('Reminder deleted:', {
      profileIndex,
      reminderKey,
      deletedValue,
      timestamp: new Date().toISOString()
    });

    showSystemMessage(`${reminderFields[reminderKey]} reminder deleted!`);
    loadSavedPetProfile();

  } catch (error) {
    console.error('Delete Reminder Error:', error);
    showSystemMessage('Failed to delete reminder', 'error');
  }
}
// ======== PET PROFILE CRUD ========
// 🆕 CREATE/UPDATE
async function savePet(petData) {
  try {
    if (!petData?.id || !petData.ownerId) {
      throw new Error("Invalid pet data structure");
    }

    // 🛡️ Data Integrity Check
    const requiredFields = ['name', 'type', 'age'];
    const missingFields = requiredFields.filter(field => !petData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    petData.lastUpdated = Date.now();

    // 🗄️ IndexedDB Transaction
    const tx = petDB.transaction(['pets', 'syncQueue'], 'readwrite');
    const petsStore = tx.objectStore('pets');
    const syncStore = tx.objectStore('syncQueue');

    await Promise.all([
      new Promise((resolve) => petsStore.put(petData).onsuccess = resolve),
      navigator.onLine && gapiInitialized 
        ? syncPetToDrive(petData)
        : new Promise((resolve) => {
            syncStore.put({
              id: petData.id,
              action: 'save',
              data: petData,
              timestamp: Date.now()
            }).onsuccess = resolve;
          })
    ]);

    showSystemMessage(`${petData.name}'s profile saved successfully!`);
    loadSavedPetProfile();

  } catch (error) {
    console.error("CRUD Save Error:", error);
    showSystemMessage(`Save failed: ${error.message}`, 'error');
    throw error;
  }
}

// 📖 READ (Hybrid)
async function loadPets() {
  try {
    let remotePets = [];
    if (navigator.onLine && gapiInitialized) {
      try {
        remotePets = await loadPetsFromDrive();
      } catch (driveError) {
        console.warn("Drive load failed:", driveError);
      }
    }

    // 🗄️ Local Load
    const localPets = await new Promise((resolve) => {
      const tx = petDB.transaction('pets', 'readonly');
      tx.objectStore('pets').getAll().onsuccess = e => resolve(e.target.result);
    });

    // 🔄 Merge Strategy
    const merged = [...remotePets, ...localPets].reduce((acc, pet) => {
      const existing = acc.find(p => p.id === pet.id);
      if (!existing || pet.lastUpdated > existing.lastUpdated) {
        return [...acc.filter(p => p.id !== pet.id), pet];
      }
      return acc;
    }, []);

    // 🧹 Data Sanitization
    return merged.map(pet => ({
      ...pet,
      medicalHistory: sanitizeHTML(pet.medicalHistory),
      dietPlan: sanitizeHTML(pet.dietPlan)
    }));

  } catch (error) {
    console.error("CRUD Load Error:", error);
    showSystemMessage('Failed to load profiles', 'error');
    return [];
  }
}

// ✏️ UPDATE
async function editPetProfile(petId) {
  try {
    let profile;
    
    // 🔍 Hybrid Lookup
    if (auth.currentUser && gapiInitialized) {
      const pets = await loadPets();
      profile = pets.find(p => p.id === petId);
    }

    if (!profile) {
      const localData = await new Promise(resolve => {
        petDB.transaction('pets').objectStore('pets').get(petId).onsuccess = e => resolve(e.target.result);
      });
      profile = localData || JSON.parse(localStorage.getItem('petProfiles'))?.find(p => p.id === petId);
    }

    if (!profile) throw new Error("Profile not found");

    // 🖋️ Form Population
    const fieldMap = {
      'petName': 'name',
      'breed': 'breed',
      'petType': 'type',
      'petGender': 'gender',
      'vaccinationsAndDewormingReminder': 'vaccinationDue'
    };

    Object.entries(fieldMap).forEach(([fieldId, dataKey]) => {
      const element = document.getElementById(fieldId);
      if (element) element.value = profile[dataKey] || '';
    });

    // 🖼️ Handle Image Restoration
    const photoPreview = document.getElementById('petPhotoPreview');
    if (photoPreview && profile.petPhoto) {
      photoPreview.src = profile.petPhoto;
      photoPreview.style.display = 'block';
    }

    editingProfileId = petId;
    document.getElementById('cancelEdit').style.display = 'inline-block';

  } catch (error) {
    console.error("CRUD Edit Error:", error);
    showSystemMessage('Cannot edit profile: ' + error.message, 'error');
  }
}

// 🗑️ DELETE
async function deletePetProfile(petId) {
  try {
    if (!confirm('Permanently delete this profile?')) return;

    // 🗂️ Hybrid Deletion
    const tx = petDB.transaction(['pets', 'syncQueue'], 'readwrite');
    
    // 1. Local Deletion
    tx.objectStore('pets').delete(petId);
    
    // 2. Queue Drive Deletion
    if (navigator.onLine && gapiInitialized) {
      await gapi.client.drive.files.delete({ fileId: petId });
    } else {
      tx.objectStore('syncQueue').put({
        id: `delete_${Date.now()}`,
        action: 'delete',
        petId,
        timestamp: Date.now()
      });
    }

    await new Promise(resolve => tx.oncomplete = resolve);
    showSystemMessage('Profile deleted successfully');
    loadSavedPetProfile();

  } catch (error) {
    console.error("CRUD Delete Error:", error);
    showSystemMessage('Deletion failed: ' + error.message, 'error');
  }
}
// ======== MODAL SYSTEM ========
let activeModal = null;

function showModal(content) {
  try {
    // 🛡️ Safety Check
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid modal content');
    }

    // ♻️ Reuse Existing
    let modal = document.getElementById('pet-modal');
    let overlay = document.getElementById('modal-overlay');

    if (!modal || !overlay) {
      // 🏗️ Structural Creation
      overlay = document.createElement('div');
      overlay.id = 'modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      modal = document.createElement('div');
      modal.id = 'pet-modal';
      modal.className = 'modal-content';
      modal.tabIndex = -1;

      document.body.append(overlay, modal);
    }

    // ✨ Content Injection
    modal.innerHTML = `
      <button class="close-modal" aria-label="Close modal">×</button>
      <div class="modal-body">${sanitizeHTML(content)}</div>
    `;

    // 🎯 Focus Management
    modal.focus();
    activeModal = modal;
    
    // 🖱️ Event Binding
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // ❌ Close Handlers
    modal.querySelector('.close-modal').addEventListener('click', hideModal);
    overlay.addEventListener('click', (e) => e.target === overlay && hideModal());
    
    // ⌨️ Keyboard Trap
    trapFocus(modal);
    document.addEventListener('keydown', handleEscape);

  } catch (error) {
    console.error('Modal Error:', error);
    showSystemMessage('Failed to open details view', 'error');
  }
}

function hideModal() {
  if (!activeModal) return;
  
  try {
    document.removeEventListener('keydown', handleEscape);
    activeModal.parentElement?.remove();
    document.body.style.overflow = '';
    activeModal = null;
  } catch (error) {
    console.error('Modal Close Error:', error);
  }
}

function trapFocus(element) {
  const focusable = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  });

  first.focus();
}

function handleEscape(e) {
  if (e.key === 'Escape') hideModal();
}
// ======== OUTPUT UTILITIES ========
async function generateQRCode(petId) {
  try {
    if (!petId) throw new Error('Missing pet ID');
    
    const profile = await loadPetProfile(petId);
    if (!profile) throw new Error('Profile not found');

    // 🖨️ QR Window Management
    const qrWindow = window.open('', 'QR_Window', 'width=500,height=600');
    if (!qrWindow) throw new Error('Popup blocked - allow popups to continue');

    // ⏳ Loading State
    qrWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loading QR Code...</title>
          <style>
            .loader { /* ... */ }
          </style>
        </head>
        <body>
          <div class="loader"></div>
        </body>
      </html>
    `);

    // 📦 Dependency Check
    await loadScript('https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js');
    
    // 🖼️ QR Generation
    qrWindow.document.body.innerHTML = `
      <div id="qrcode"></div>
      <button onclick="print()">Print</button>
    `;
    
    new qrWindow.QRCode(document.getElementById('qrcode'), {
      text: JSON.stringify(profile),
      width: 256,
      height: 256
    });

  } catch (error) {
    console.error('QR Generation Failed:', error);
    showSystemMessage('Failed to generate QR code', 'error');
  }
}

async function printPetProfile(petId) {
  try {
    const profile = await loadPetProfile(petId);
    const printWindow = window.open('', '_blank');
    
    // 🖼️ Asset Preloading
    const img = await preloadImage(profile.petPhoto);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${profile.petName}'s Profile</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body>
          ${generatePrintContent(profile, img)}
        </body>
      </html>
    `);
    
    printWindow.addEventListener('load', () => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);
    });

  } catch (error) {
    console.error('Print Failed:', error);
    showSystemMessage('Failed to generate printable version', 'error');
  }
}

async function sharePetProfile(petId) {
  try {
    const profile = await loadPetProfile(petId);
    
    if (navigator.share) {
      await navigator.share({
        title: `${profile.petName}'s Health Profile`,
        text: generateShareText(profile),
        url: location.href
      });
    } else {
      await navigator.clipboard.writeText(generateShareText(profile));
      showSystemMessage('Profile copied to clipboard!');
    }
  } catch (error) {
    console.error('Share Failed:', error);
    showSystemMessage('Sharing not supported', 'error');
  }
}

// ======== AUTH MANAGEMENT ========
function setupAuthFormSwitchers() {
  try {
    // 🔄 Form Visibility Control
    const switchForm = (target) => {
      ['login', 'signUp'].forEach(form => {
        const el = document.getElementById(`${form}Form`);
        el?.classList.toggle('active', form === target);
      });
    };

    // 🖱️ Delegated Listeners
    document.getElementById('authSection')?.addEventListener('click', (e) => {
      if (e.target.matches('#showLogin')) switchForm('login');
      if (e.target.matches('#showSignUp')) switchForm('signUp');
    });

    // 🧹 Form Cleanup
    const clearForms = () => {
      document.querySelectorAll('.auth-form').forEach(form => form.reset());
      document.getElementById('authError')?.classList.add('hidden');
    };

    window.addEventListener('beforeunload', clearForms);
    return true;

  } catch (error) {
    console.error('Auth Forms Setup Failed:', error);
    return false;
  }
}

// 🔄 Session Restoration
function restoreEditingSessions() {
  try {
    const sessionKeys = Object.keys(sessionStorage)
      .filter(key => key.startsWith('editingProfile_'));

    sessionKeys.forEach(key => {
      const petId = key.split('_')[1];
      const profile = JSON.parse(sessionStorage.getItem(key));
      
      if (profile && document.getElementById('petName')) {
        sessionStorage.removeItem(key);
        editPetProfile(petId); // Re-init edit mode
        showSystemMessage('Recovered unsaved changes');
      }
    });
  } catch (error) {
    console.error('Session Restore Error:', error);
    sessionStorage.clear();
  }
}
// ======== CORE INITIALIZATION ========
function initializeEventListeners() {
  try {
    // 🖱️ Delegated Event Handling
    document.body.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) handleDelete(e);
      if (e.target.closest('.edit-btn')) handleEdit(e);
      if (e.target.closest('.print-btn')) handlePrint(e);
    });

    // 📝 Form Submissions
    addSafeListener('dietForm', handlePetSubmit, 'submit');
    addSafeListener('loginForm', handleLogin, 'submit');
    addSafeListener('signUpForm', handleSignUp, 'submit');

    // 🌐 Network Awareness
    window.addEventListener('online', () => {
      showSystemMessage('Back online - syncing changes...');
      processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      showSystemMessage('Working offline - changes will sync later');
    });

    return true;
  } catch (error) {
    console.error('Event Listener Setup Failed:', error);
    return false;
  }
}

// 🚀 Application Boot
async function initializeApplication() {
  try {
    showSystemMessage('Initializing application...');
    
    // 🔥 Critical Services
    if (!(await initializeFirebaseServices())) return;
    if (!(await initIndexedDB())) return;

    // 🧩 Feature Initialization
    setupAuthFormSwitchers();
    initializeEventListeners();
    restoreEditingSessions();

    // 🔐 Auth State
    const unsubscribe = auth.onAuthStateChanged(async user => {
      try {
        if (user) {
          await initGoogleDriveAPI();
          await loadSavedPetProfile();
          setupNotifications();
        }
      } catch (error) {
        console.error('Auth State Error:', error);
        auth.signOut();
      }
    });

    // 🧹 Cleanup
    window.addEventListener('beforeunload', () => {
      unsubscribe();
      petDB?.close();
    });

  } catch (error) {
    console.error('Fatal Boot Error:', error);
    document.body.innerHTML = `<div class="fatal-error">
      <h2>😿 System Failure</h2>
      <p>${error.message}</p>
      <button onclick="location.reload()">Reload</button>
    </div>`;
  }
}

// 🎬 START THE ENGINE!
document.addEventListener('DOMContentLoaded', initializeApplication);
