'use strict'; // Add if not already present
import { setupNotifications, sendPushNotification } from './pushNotifications.js';
// ======== FIREBASE INITIALIZATION ========
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  projectId: "pet-health-tracker-7164d",
  appId: "pet-health-tracker-7164d",
  authDomain: "pet-health-tracker-7164d.firebaseapp.com", // Add this
  storageBucket: "pet-health-tracker-7164d.appspot.com" // Add this
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ======== SERVICE REFERENCES ========
const auth = firebase.auth();
const firestore = firebase.firestore();

// ======== GLOBAL VARIABLES ========
let editingProfileIndex = null;
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
function formatReminder(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}

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

function switchAuthForm(targetForm) {
  document.getElementById('signUpForm').classList.remove('active');
  document.getElementById('loginForm').classList.remove('active');
  const formElement = document.getElementById(`${targetForm}Form`);
  if (formElement) {
    formElement.classList.add('active');
    formElement.querySelector('form').reset();
  }
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

function deleteOverdueReminder(profileIndex, reminderKey) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  if (savedProfiles[profileIndex]) {
    savedProfiles[profileIndex][reminderKey] = null;
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
  }
}

function loadSavedPetProfile() {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const savedProfilesList = document.getElementById('savedProfilesList');
  if (!savedProfilesList) return;

  savedProfilesList.innerHTML = '';

  savedProfiles.forEach((profile, index) => {
    const emergencyContact = profile.emergencyContacts?.[0] || {};
    const petCard = document.createElement('li');
    petCard.className = 'pet-card';
    petCard.innerHTML = `
      <div class="pet-card-content">
        <h4>${profile.petName || 'Unnamed Pet'}</h4>
        ${profile.petPhoto ? `<img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo"/>` : ''}
        <p>Breed: ${profile.breed || 'N/A'}</p>
        <p>Age: ${profile.age || 'N/A'}</p>
        <p>Weight: ${profile.weight || 'N/A'}</p>
        <p>Microchip ID: ${profile.microchip?.id || 'N/A'}</p>
        <p>Implant Date: ${profile.microchip?.date || 'N/A'}</p>
        <p>Vendor: ${profile.microchip?.vendor || 'N/A'}</p>
        <p>Allergies: ${profile.allergies || 'N/A'}</p>
        <p>Medical History: ${profile.medicalHistory || 'N/A'}</p>
        <p>Diet Plan: ${profile.dietPlan || 'N/A'}</p>
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
    `;
// Helper to safely add listeners
const addButtonListener = (buttonClass, handler) => {
  const btn = petCard.querySelector(buttonClass);
  if (btn) {
    btn.removeEventListener('click', handler); // Prevent duplicates
    btn.addEventListener('click', handler);
  }
};
// ====== INSERT EVENT LISTENERS RIGHT HERE ======
// Add these 3 lines immediately after petCard.innerHTML:
    addButtonListener('.editProfileButton', () => editPetProfile(index));
    addButtonListener('.deleteProfileButton', () => deletePetProfile(index));
    petCard.querySelector('.printProfileButton').addEventListener('click', () => printPetProfile(index));
    petCard.querySelector('.shareProfileButton').addEventListener('click', () => sharePetProfile(index));
    petCard.querySelector('.generateQRButton').addEventListener('click', () => generateQRCode(index));
    // ====== END OF INSERTION ======
  savedProfilesList.appendChild(petCard);

    const reminders = {
      vaccinationDue: profile.vaccinationsAndDewormingReminder,
      checkupDue: profile.medicalCheckupsReminder,
      groomingDue: profile.groomingReminder
    };
    highlightReminders(reminders, index);
  });
}
// FUNCTION EDIT PROFILE+HELPER FUNCTION FOR USER'S NOTIFICATION
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
function editPetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const profile = savedProfiles[index];
  if (!profile) return;

  editingProfileIndex = index;
  sessionStorage.setItem(`editingProfile_${index}`, JSON.stringify(profile));

  // Populate form fields
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

  const preview = document.getElementById('petPhotoPreview');
  if (preview && profile.petPhoto) {
    preview.src = profile.petPhoto;
    preview.style.display = 'block';
  }

  const cancelButton = document.getElementById('cancelEdit');
  if (cancelButton) {
    cancelButton.style.display = 'inline-block';
    cancelButton.onclick = handleCancelEdit;
  }
}

function handleCancelEdit() {
  if (editingProfileIndex !== null) {
    const originalProfile = JSON.parse(sessionStorage.getItem(`editingProfile_${editingProfileIndex}`));
    if (originalProfile) {
      editPetProfile(editingProfileIndex); // Reset form with original values
    }
    sessionStorage.removeItem(`editingProfile_${editingProfileIndex}`);
    editingProfileIndex = null;
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
  
  const petPhotoInput = document.getElementById('petPhoto');
  const petPhotoPreview = document.getElementById('petPhotoPreview');
  
  // Image Preview Handler (NO CHANGES NEEDED)
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
  const index = parseInt(key.split('_')[1], 10);
  const originalProfile = JSON.parse(sessionStorage.getItem(key));

  if (originalProfile) {
    const safeSetValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    };

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

  // Form Submissions
const dietForm = document.getElementById('dietForm');
if (dietForm) {
  dietForm.addEventListener('submit', function(e) {
    e.preventDefault(); // <-- Add semicolon here
    const formData = {
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
      petPhoto: document.getElementById('petPhotoPreview')?.src || ''
    };

    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    if (editingProfileIndex !== null) {
      const oldName = savedProfiles[editingProfileIndex].petName || 'Unnamed Pet';
      savedProfiles[editingProfileIndex] = formData;
      localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
          // NEW: Show update notification
      showSuccessNotification('Profile updated', oldName); // Uses original name for consistency

      editingProfileIndex = null;
    } else {
      savedProfiles.push(formData);
    }
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    
     // 4. NEW: Show creation notification
      showSuccessNotification(
        'Profile is saved successfully',
        formData.petName || 'Unnamed Pet' 
      );
    }
    loadSavedPetProfile();
    resetForm();
  });
  } // <-- Closing brace for if-statement

  // Event Delegation
  document.getElementById('savedProfilesList')?.addEventListener('click', (e) => {
    const index = parseInt(e.target?.dataset?.index, 10);
    if (e.target?.classList?.contains('editProfileButton')) {
      editPetProfile(index);
    } else if (e.target?.classList?.contains('deleteProfileButton')) {
      deletePetProfile(index);
    } else if (e.target?.classList?.contains('deleteReminderButton')) {
      const profileIndex = parseInt(e.target.dataset.profileIndex, 10);
      const reminderKey = e.target.dataset.reminder;
      deleteOverdueReminder(profileIndex, reminderKey);
    }
  });
// Auth handlers
// ======== SIGN-UP HANDLER ========
const signUpForm = document.getElementById('signUpForm');
if (signUpForm) {
  signUpForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const form = this; // Capture form reference
    
    const email = form.querySelector('#signUpEmail').value.trim();
    const password = form.querySelector('#signUpPassword').value.trim();

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('User created:', userCredential.user);
        alert('Sign-up successful! Please login.');
        form.reset(); // Use captured reference
        switchAuthForm('login');
      })
      .catch((error) => {
        console.error('Sign-up error:', error);
        alert(`Sign-up failed: ${error.message}`);
        // Removed reset to allow error correction
      });
  });
}

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

}); // Close DOMContentLoaded


