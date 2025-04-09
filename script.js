// ======== FIREBASE INITIALIZATION ========
// Import Firebase services (ensure these are in your HTML)
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
// ======== NOTIFICATION SETUP ========
// Import from pushNotifications.js (ensure proper module setup)
// <script type="module" src="pushNotifications.js"></script> in html header
import { setupNotifications, sendPushNotification } from './pushNotifications.js';
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  projectId: "pet-health-tracker-7164d",
  appId: "pet-health-tracker-7164d"
};

// Initialize Firebase once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ======== SERVICE REFERENCES ========
const auth = firebase.auth();
const firestore = firebase.firestore()


// * Global declaration *//
let editingProfileIndex = null;

// ======== REMINDERS VALIDATION CONFIGURATION ========
const REMINDER_THRESHOLD_DAYS = 5; // Or any other number of days you prefer

const ALLOWED_REMINDER_TYPES = ['vaccination', 'checkup', 'grooming'];
const REMINDER_TYPE_MAP = {
  vaccinationDue: 'vaccination',
  checkupDue: 'checkup',
  groomingDue: 'grooming'
};
// ======== AUTHENTICATION ========//
// ======== A. AUTH STATE CHECK (FIXED) ========
document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('mainContent');
  const logoutButton = document.getElementById('logoutButton');
  const petPhotoInput = document.getElementById('petPhoto'); // Assuming the ID of your file input is 'petPhoto'
  const petPhotoPreview = document.getElementById('petPhotoPreview'); // Assuming the ID of your image preview element is 'petPhotoPreview'

  // Fixed: Added debounce to image preview handler (NOW INSIDE DOMContentLoaded)
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

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(async () => {
      const authStateHandler = async (user) => {
        if (user) {
          authSection.style.display = 'none';
          mainContent.style.display = 'block';
          logoutButton.style.display = 'block';

          try {
            // Initialize notifications first
            const notificationsReady = await setupNotifications();
            if (notificationsReady) {
              await sendPushNotification('Welcome Back!', 'Your pet profiles are ready');
            }

            // Then load profile
            await loadSavedPetProfile();

          } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to initialize app features');
          }
        } else {
          authSection.style.display = 'block';
          mainContent.style.display = 'none';
          logoutButton.style.display = 'none';
          switchAuthForm('login');
        }
      };

      // Proper async listener management
      const unsubscribe = firebase.auth().onAuthStateChanged(authStateHandler);
      // If you need to return the unsubscribe function (e.g., for component unmounting in a framework), you would do it here.
      // However, in a simple DOMContentLoaded listener, this return doesn't have a direct effect.
      // For now, let's keep it as it was:
      return () => unsubscribe();
    })
    .catch((error) => {
      console.error("Auth persistence error:", error);
      alert('Authentication system error. Please refresh the page.');
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

  // ======== D. SIGN-UP HANDLER (MOVED INSIDE) ========
  const signUpFormElement = document.getElementById('signUpForm');
  if (signUpFormElement) {
    signUpFormElement.addEventListener('submit', function(event) {
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

  // ======== E. LOGIN HANDLER (MOVED INSIDE) ========
  const loginFormElement = document.getElementById('loginForm');
  if (loginFormElement) {
    loginFormElement.addEventListener('submit', function(event) {
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

  // ======== F. LOGOUT HANDLER (FIXED) ========
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

  // ======== UPDATED COMBINED SERVICE WORKERS REGISTRATION ========//
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('https://drkimogad.github.io/Pet-Health-Tracker/service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  }
});

// ======== A. USER CHECK & IMAGE PRELOADING ========
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

// ======== B. FORM SWITCHING HELPER ========
function switchAuthForm(targetForm) { // Added missing function declaration
  document.getElementById('signUpForm').classList.remove('active');
  document.getElementById('loginForm').classList.remove('active');
  const formElement = document.getElementById(`${targetForm}Form`);
  formElement.classList.add('active');
  formElement.querySelector('form').reset();
}

// ======== C. FORM SWITCHING EVENT LISTENERS ========
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

// ======== 5. SAVE PET PROFILE (WITH NEW FIELDS) ========
document.getElementById('dietForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const petProfile = {
    petName: document.getElementById('petName').value,
    breed: document.getElementById('breed').value,
    age: document.getElementById('age').value,
    weight: document.getElementById('weight').value,
    microchip: {
      id: document.getElementById('microchipId').value,
      date: document.getElementById('microchipDate').value,
      vendor: document.getElementById('microchipVendor').value,
    },
    allergies: document.getElementById('allergies').value,
    medicalHistory: document.getElementById('medicalHistory').value,
    dietPlan: document.getElementById('dietPlan').value,
    emergencyContacts: [{
      name: document.getElementById('emergencyContactName').value,
      phone: document.getElementById('emergencyContactPhone').value,
      relationship: document.getElementById(
        'emergencyContactRelationship').value,
    }, ],
    mood: document.getElementById('moodSelector').value,
    vaccinationsAndDewormingReminder: document.getElementById(
      'vaccinationsAndDewormingReminder').value,
    medicalCheckupsReminder: document.getElementById(
      'medicalCheckupsReminder').value,
    groomingReminder: document.getElementById('groomingReminder').value,
    petPhoto: document.getElementById('petPhotoPreview').src || '', // Always use data URL
  };

  let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];

  if (editingProfileIndex !== null) {
    savedProfiles[editingProfileIndex] = petProfile;
    // Clear sessionStorage
    sessionStorage.removeItem(`editingProfile_${editingProfileIndex}`);
    editingProfileIndex = null;
    alert('Profile updated!');
  } else {
    savedProfiles.push(petProfile);
    alert('Profile saved!');
  }

  localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
  loadSavedPetProfile(); // Replace with your load function
  event.target.reset();
  document.getElementById('petPhotoPreview').src = '';
  document.getElementById('petPhotoPreview').style.display = 'none';
});

// ======== 6. LOAD SAVED PET PROFILES (WITH NEW FIELDS) ========
function formatReminder(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}

function loadSavedPetProfile() {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const savedProfilesList = document.getElementById('savedProfilesList');
  savedProfilesList.innerHTML = '';

  if (savedProfiles) {
    savedProfiles.forEach((profile, index) => {
      const emergencyContact = profile.emergencyContacts[0] || {};

      const petCard = document.createElement('li');
      petCard.classList.add('pet-card');
      petCard.innerHTML = `
                <div class="pet-card-content">
                    <h4>${profile.petName}</h4>
                    ${profile.petPhoto ? `<img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo"/>` : ''}
                    <p>Breed: ${profile.breed}</p>
                    <p>Age: ${profile.age}</p>
                    <p>Weight: ${profile.weight}</p>
                    <p>Microchip ID: ${profile.microchip?.id || 'N/A'}</p>
                    <p>Implant Date: ${profile.microchip?.date || 'N/A'}</p>
                    <p>Vendor: ${profile.microchip?.vendor || 'N/A'}</p>
                    <p>Allergies: ${profile.allergies}</p>
                    <p>Medical History: ${profile.medicalHistory}</p>
                    <p>Diet Plan: ${profile.dietPlan}</p>
                    <p>Emergency Contact: ${emergencyContact.name || 'N/A'} (${emergencyContact.relationship || 'N/A'}) - ${emergencyContact.phone || 'N/A'}</p>
                    <p>Mood: ${profile.mood || 'N/A'}</p>
                    <p>Vaccinations/Deworming: ${formatReminder(profile.vaccinationsAndDewormingReminder)}</p>
                    <p>Medical Check-ups: ${formatReminder(profile.medicalCheckupsReminder)}</p>
                    <p>Grooming: ${formatReminder(profile.groomingReminder)}</p>
                    <div id="overdueReminders-${index}" class="overdueReminders"></div>
                    <div id="upcomingReminders-${index}" class="upcomingReminders"></div>
                    <div class="pet-card-buttons">
                        <button class="editProfileButton" data-index="${index}">Edit</button>
                        <button class="deleteProfileButton" data-index="${index}">Delete</button>
                        <button class="printProfileButton" data-index="${index}">Print</button>
                        <button class="shareProfileButton" data-index="${index}">Share</button>
                        <button class="generateQRButton" data-index="${index}">QR Code</button>
                    </div>
                </div>
            `; // Removed the hardcoded reminder block
      savedProfilesList.appendChild(petCard);

//Reminders validation function// 
function validateReminder(reminderData) {
  const standardizedType = REMINDER_TYPE_MAP[reminderData.type];
  if (!ALLOWED_REMINDER_TYPES.includes(standardizedType)) {
    throw new Error(`Invalid reminder type: ${reminderData.type}`);
  }
  
  const dateValue = new Date(reminderData.dueDate);
  if (isNaN(dateValue.getTime())) {
    throw new Error('Invalid date format for reminder');
  }
  
  return { type: standardizedType, dueDate: dateValue };
}
// ReminderFormating function//
function formatReminder(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}
try {
  const reminders = {
    vaccinationDue: profile.vaccinationDue,  // Ensure this is defined
    checkupDue: profile.checkupDue,          // Ensure this is defined
    groomingDue: profile.groomingDue         // Ensure this is defined
  };

  // Log reminders to the console for debugging
  console.log('Reminders:', reminders);

  // Check if any of the reminders are undefined or invalid
  if (!reminders.vaccinationDue || !reminders.checkupDue || !reminders.groomingDue) {
    throw new Error('One or more reminder dates are missing or invalid.');
  }

  // Call the highlightReminders function
  highlightReminders(reminders, index);
} catch (error) {
  // Log the error to the console for better debugging
  console.error('Validation Error:', error);

  // Alert the user
  alert(`Validation Error: ${error.message}`);
  return;
}

// ======== UPDATED REMINDERS BLOCK ======== //
    const reminders = {
        vaccinationDue: profile.vaccinationDue,  // CHANGED FROM vaccinationsAndDewormingReminder
        checkupDue: profile.checkupDue,          // CHANGED FROM medicalCheckupsReminder
        groomingDue: profile.groomingDue         // CHANGED FROM groomingReminder
      };
      highlightReminders(reminders, index);
    });
  }
}

//** highlighting upcoming and overdue ALERT reminders**//
// ======== UPDATE REMINDER LABELS ======== //
const reminderFields = {
  // CHANGED KEYS TO MATCH NEW FIELD NAMES
  vaccinationDue: 'Vaccinations/Deworming',    // Before: vaccinationsAndDewormingReminder
  checkupDue: 'Medical Check-ups',             // Before: medicalCheckupsReminder
  groomingDue: 'Grooming'                      // Before: groomingReminder
};

// ======== UPDATED HIGHLIGHT REMINDERS FUNCTION ======== //
function highlightReminders(reminders, index) {
  const today = new Date();
  const overdueContainer = document.getElementById(`overdueReminders-${index}`);
  const upcomingContainer = document.getElementById(`upcomingReminders-${index}`);

  overdueContainer.innerHTML = '';
  upcomingContainer.innerHTML = '';

  Object.entries(reminders).forEach(([reminderKey, reminderValue]) => {
    if (!reminderValue) return;

    // CHANGED: Parse ISO string to Date
    const reminderDateTime = new Date(reminderValue);
    const timeDiff = reminderDateTime.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // CHANGED: Use updated reminderFields with new keys
    const reminderLabel = reminderFields[reminderKey];

    if (timeDiff < 0) {
      const div = document.createElement('div');
      div.className = 'reminder overdue';
      div.innerHTML = `
        <span class="exclamation">❗</span> 
        ${reminderLabel} was due on ${reminderDateTime.toLocaleString()}
        <button class="deleteReminderButton" 
                data-profile-index="${index}" 
                data-reminder="${reminderKey}"> <!-- Key matches new field names -->
            Delete
        </button>
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

// ======== UPDATED DELETE FUNCTION ======== //
function deleteOverdueReminder(profileIndex, reminderKey) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[profileIndex];
  
  // CHANGED: Clear the correct field names
  profile[reminderKey] = null;  // Changed from empty string to null for clarity
  
  localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
  loadSavedPetProfile();
}
      
// ======== 8. HELPER FUNCTIONS ========     
//function to attached buttons to pet profiles//
const savedProfilesList = document.getElementById('savedProfilesList');

savedProfilesList.addEventListener('click', function(event) {
  if (event.target.classList.contains('editProfileButton')) {
    const index = parseInt(event.target.dataset.index);
    editPetProfile(index);
  } else if (event.target.classList.contains('deleteProfileButton')) {
    const index = parseInt(event.target.dataset.index);
    deletePetProfile(index);
  } else if (event.target.classList.contains('printProfileButton')) {
    const index = parseInt(event.target.dataset.index);
    printPetProfile(index);
  } else if (event.target.classList.contains('shareProfileButton')) {
    const index = parseInt(event.target.dataset.index);
    sharePetProfile(index);
  } else if (event.target.classList.contains('generateQRButton')) {
    const index = parseInt(event.target.dataset.index);
    generateQRCode(index);
  } else if (event.target.classList.contains('deleteReminderButton')) {
    const profileIndex = parseInt(event.target.dataset.profileIndex);
    const reminderKey = event.target.dataset.reminder;
    deleteOverdueReminder(profileIndex, reminderKey);
  }
});

// Modified edit function//
function editPetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[index];
  editingProfileIndex = index;

  sessionStorage.setItem(`editingProfile_${index}`, JSON.stringify(profile));

  // Populate form fields (with optional chaining replaced)
  document.getElementById('petName').value = profile.petName;
  document.getElementById('breed').value = profile.breed;
  document.getElementById('age').value = profile.age;
  document.getElementById('weight').value = profile.weight;
  document.getElementById('microchipId').value = (profile.microchip && profile
    .microchip.id) || '';
  document.getElementById('microchipDate').value = (profile.microchip && profile
    .microchip.date) || '';
  document.getElementById('microchipVendor').value = (profile.microchip &&
    profile.microchip.vendor) || '';
  document.getElementById('allergies').value = profile.allergies;
  document.getElementById('medicalHistory').value = profile.medicalHistory;
  document.getElementById('dietPlan').value = profile.dietPlan;
  document.getElementById('moodSelector').value = profile.mood || '';

  // Emergency contacts with safe navigation
  const emergencyContact = profile.emergencyContacts && profile
    .emergencyContacts[0];
  document.getElementById('emergencyContactName').value = (emergencyContact &&
    emergencyContact.name) || '';
  document.getElementById('emergencyContactPhone').value = (emergencyContact &&
    emergencyContact.phone) || '';
  document.getElementById('emergencyContactRelationship').value = (
    emergencyContact && emergencyContact.relationship) || '';

  document.getElementById('vaccinationsAndDewormingReminder').value = profile
    .vaccinationsAndDewormingReminder || '';
  document.getElementById('medicalCheckupsReminder').value = profile
    .medicalCheckupsReminder || '';
  document.getElementById('groomingReminder').value = profile
    .groomingReminder || '';

  if (profile.petPhoto) {
    document.getElementById('petPhotoPreview').src = profile.petPhoto;
    document.getElementById('petPhotoPreview').style.display = 'block';
  } else {
    document.getElementById('petPhotoPreview').src = '';
    document.getElementById('petPhotoPreview').style.display = 'none';
  }

  document.getElementById('dietForm').scrollIntoView();

  // Show and setup cancel button
  const cancelButton = document.getElementById('cancelEdit');
  cancelButton.style.display = 'inline-block';

  // Clean existing listeners
  cancelButton.replaceWith(cancelButton.cloneNode(true));
  document.getElementById('cancelEdit').addEventListener('click',
    handleCancelEdit);
}

// New separate cancel handler
function handleCancelEdit() {
  if (editingProfileIndex !== null) {
    const originalProfile = JSON.parse(sessionStorage.getItem(
      `editingProfile_${editingProfileIndex}`));

    if (originalProfile) {
      // Reset form fields using existing values
      document.getElementById('petName').value = originalProfile.petName;
      document.getElementById('breed').value = originalProfile.breed;
      document.getElementById('age').value = originalProfile.age;
      document.getElementById('weight').value = originalProfile.weight;
      document.getElementById('microchipId').value = (originalProfile
        .microchip && originalProfile.microchip.id) || '';
      document.getElementById('microchipDate').value = (originalProfile
        .microchip && originalProfile.microchip.date) || '';
      document.getElementById('microchipVendor').value = (originalProfile
        .microchip && originalProfile.microchip.vendor) || '';
      document.getElementById('allergies').value = originalProfile.allergies;
      document.getElementById('medicalHistory').value = originalProfile
        .medicalHistory;
      document.getElementById('dietPlan').value = originalProfile.dietPlan;
      document.getElementById('moodSelector').value = originalProfile.mood ||
        '';

      const originalEmergencyContact = originalProfile.emergencyContacts &&
        originalProfile.emergencyContacts[0];
      document.getElementById('emergencyContactName').value = (
        originalEmergencyContact && originalEmergencyContact.name) || '';
      document.getElementById('emergencyContactPhone').value = (
        originalEmergencyContact && originalEmergencyContact.phone) || '';
      document.getElementById('emergencyContactRelationship').value = (
          originalEmergencyContact && originalEmergencyContact.relationship) ||
        '';

      document.getElementById('vaccinationsAndDewormingReminder').value =
        originalProfile.vaccinationsAndDewormingReminder || '';
      document.getElementById('medicalCheckupsReminder').value = originalProfile
        .medicalCheckupsReminder || '';
      document.getElementById('groomingReminder').value = originalProfile
        .groomingReminder || '';

      if (originalProfile.petPhoto) {
        document.getElementById('petPhotoPreview').src = originalProfile
          .petPhoto;
        document.getElementById('petPhotoPreview').style.display = 'block';
      } else {
        document.getElementById('petPhotoPreview').src = '';
        document.getElementById('petPhotoPreview').style.display = 'none';
      }
    }

    // Cleanup
    sessionStorage.removeItem(`editingProfile_${editingProfileIndex}`);
    editingProfileIndex = null;
    document.getElementById('cancelEdit').style.display = 'none';
    resetForm();
  }
}

// Existing form reset function (keep as-is)
function resetForm() {
  document.getElementById('dietForm').reset();
  document.getElementById('petPhotoPreview').src = '';
  document.getElementById('petPhotoPreview').style.display = 'none';
}

// delete pet profile button functionality//
function deletePetProfile(index) {
  let savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  savedProfiles.splice(index, 1);
  localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
  loadSavedPetProfile
    (); // Make sure this function is defined elsewhere to reload the displayed list
}

// Print Pet Profile button functionality//
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
              if (photoDataURL) URL.revokeObjectURL(
                photoDataURL);
              printWindow.close();
            };
          }, 500);
        });
      });
    })
    .catch(error => {
      printWindow.document.body.innerHTML =
        `<h1>Error: ${error.message}</h1>`;
      printWindow.print();
    });
}

// Share Pet Profile button functionality//
function sharePetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[index];
  const emergencyContact = profile.emergencyContacts?.[0] || {};

  const shareData = {
    title: `${profile.petName}'s Health Profile`,
    text: `Pet Details:\n${Object.entries({
            Name: profile.petName,
            Breed: profile.breed,
            Age: profile.age,
            Weight: profile.weight,
            'Microchip ID': profile.microchip?.id,
            Allergies: profile.allergies,
            'Medical History': profile.medicalHistory,
            'Diet Plan': profile.dietPlan,
            'Vaccinations/Deworming': profile.vaccinationsAndDewormingReminder,
            'Medical Check-ups': profile.medicalCheckupsReminder,
            Grooming: profile.groomingReminder,
            'Emergency Contact': `${emergencyContact.name} (${emergencyContact.relationship}) - ${emergencyContact.phone}`
        }).map(([key, val]) => `
    $ {
      key
    }: $ {
      val || 'N/A'
    }
    `).join('\n')}`,
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

  const qrWindow = window.open('', 'QR Code', 'width=400,height=500');

  // Load QR library FIRST in the new window
  qrWindow.document.write(`
        <html>
            <head>
                <title>Loading QR Code...</title>
                <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
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
                            link.download = '${profile.petName}_QR.png';
                            link.href = canvas.toDataURL();
                            link.click();
                        } else {
                            alert('QR code not yet generated.');
                        }
                    }
                </script>
            </body>
        </html>
    `);
  qrWindow.document.close();

  // Wait for library to load
  qrWindow.addEventListener('load', () => {
    const emergencyContact = profile.emergencyContacts?.[0] || {};
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
      // Use the library from the NEW WINDOW's context
      const qrcodeContainer = qrWindow.document.getElementById(
        'qrcode-container');
      qrcodeContainer.style.display = 'block';
      const qrCode = new qrWindow.QRCode(qrcodeContainer, {
        text: qrText,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: qrWindow.QRCode.CorrectLevel.H
      });

      // Show the controls
      const qrControls = qrWindow.document.getElementById('qr-controls');
      qrControls.style.display = 'block';

    } catch (error) {
      qrWindow.document.body.innerHTML = `<h1>Error: ${error.message}</h1>`;
    } finally {
      const loader = qrWindow.document.querySelector('.loader');
      if (loader) {
        loader.style.display = 'none';
      }
    }
  });
}

// ======== UPDATED COMBINED SERVICE WORKERS REGISTRATION ========//
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('SW registered:', reg))
    .catch(err => console.error('SW registration failed:', err));
}
