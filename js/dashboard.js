// Global declaration
let petDB; // IndexedDB reference (if used)
let currentQRProfile = null; // Only new declaration needed
let savedProfiles = [];
let currentProfile = null;
// 👇 Add here
let editingProfileId = null

// 🌍 Load from localStorage and expose globally
let petProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
window.petProfiles = petProfiles;

// SAFE GLOBAL INITIALIZATION 
if (typeof isEditing === 'undefined') {
    window.isEditing = false;
}
if (typeof currentEditIndex === 'undefined') {
    window.currentEditIndex = -1;
}
// ====== DOM ELEMENTS ======
const DOM = {
  // Main containers
  authContainer: document.getElementById('authContainer'),
  dashboard: document.getElementById('dashboard'),
  processingLoader: document.getElementById('processing-loader'),
  
  // Form elements
  addPetProfileBtn: document.getElementById('addPetProfileBtn'),
  petList: document.getElementById('petList'),
  petPhotoInput: document.getElementById('petPhoto'),
  petPhotoPreview: document.getElementById('petPhotoPreview'),
  
  // Profile list
  savedProfilesList: document.getElementById('savedProfilesList'),
  // Form fields
  petName: document.getElementById('petName'),
  breed: document.getElementById('breed'),
  age: document.getElementById('age'),
  weight: document.getElementById('weight'),
  petType: document.getElementById('petType'), // to be updated in other functions
  petGender: document.getElementById('petGender'),  //to be updated in other functions
  microchipId: document.getElementById('microchipId'),
  microchipDate: document.getElementById('microchipDate'),
  microchipVendor: document.getElementById('microchipVendor'),
  allergies: document.getElementById('allergies'),
  medicalHistory: document.getElementById('medicalHistory'),
  dietPlan: document.getElementById('dietPlan'),
  moodSelector: document.getElementById('moodSelector'),
  emergencyContactName: document.getElementById('emergencyContactName'),
  emergencyContactPhone: document.getElementById('emergencyContactPhone'),
  emergencyContactRelationship: document.getElementById('emergencyContactRelationship'),
  vaccinationsAndDewormingReminder: document.getElementById('vaccinationsAndDewormingReminder'),
  medicalCheckupsReminder: document.getElementById('medicalCheckupsReminder'),
  groomingReminder: document.getElementById('groomingReminder'),

  // Modal Elements (used in showModal())
  petModal: document.getElementById('pet-modal') || null, // Optional fallback
  modalOverlay: document.getElementById('modal-overlay') || null
    
  // Buttons
 // cancelEdit: document.getElementById('cancel6Edit')
};

// Safety check (optional)
if (!DOM.savedProfilesList || !DOM.petList) {
  console.error('Critical DOM elements missing! Check your HTML IDs');
}

// =======REMINDERS🌟
  

const REMINDER_THRESHOLD_DAYS = 5;
const ALLOWED_REMINDER_TYPES = ['vaccination', 'checkup', 'grooming'];
const REMINDER_TYPE_MAP = {
  vaccinations: 'vaccination',
  checkups: 'checkup',
  grooming: 'grooming'
};
const reminderFields = {
  vaccinations: 'Vaccinations/Deworming',
  checkups: 'Medical Check-ups',
  grooming: 'Grooming'
};
//FUNCTION HIGHLIGHT REMINDERS UPDATED
function highlightReminders(reminders, index) {
  const today = new Date();
  const overdueContainer = DOM[`overdueReminders-${index}`];
  const upcomingContainer = DOM[`upcomingReminders-${index}`];

  if (!overdueContainer || !upcomingContainer) return;

  overdueContainer.innerHTML = '';
  upcomingContainer.innerHTML = '';

  Object.entries(reminders).forEach(([reminderKey, reminderValue]) => {
    if (!reminderValue) return;

    const reminderDate = new Date(reminderValue);
    const timeDiff = reminderDate - today;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const isToday = reminderDate.toDateString() === today.toDateString();

    const reminderLabel = reminderFields[reminderKey] || reminderKey;

    const div = document.createElement('div');
    let icon = '';
    let cssClass = '';
    let deleteClass = 'deleteReminderButton';

// Example inside your reminders loop:
if (timeDiff < 0) {
  emoji = '❗'; // Overdue
  reminder.classList.add('overdue');
  btnClass = 'btn-overdue';
} else if (daysDiff === 0) {
  emoji = '⏰'; // Today
  reminder.classList.add('today');
  btnClass = 'btn-today';
} else if (daysDiff <= REMINDER_THRESHOLD_DAYS) {
  emoji = '📅'; // Upcoming
  reminder.classList.add('upcoming');
  btnClass = 'btn-upcoming';
}

message = `<span class="reminder-emoji">${emoji}</span> 
  <span class="reminder-text">${label}: ${msg} (${reminderDate.toLocaleString()})</span> 
  <button class="deleteReminderButton ${btnClass}" data-profile-index="${index}" data-reminder="${key}">🗑 Delete</button>`;


    if (timeDiff < 0) {
      overdueContainer.appendChild(div);
    } else {
      upcomingContainer.appendChild(div);
    }
  });
}

// FUNCTION DELETE OVERDUE REMINDERS 
async function deleteReminder(profileIndex, reminderKey) {
  let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];

  if (!savedProfiles[profileIndex]) return;

  // Clear the reminder
  if (savedProfiles[profileIndex].reminders?.[reminderKey]) {
    delete savedProfiles[profileIndex].reminders[reminderKey];

    // Save to localStorage
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));

    // 🔄 If signed in, update Firestore too
    if (firebase.auth().currentUser) {
      const profileId = savedProfiles[profileIndex].id;
      const db = firebase.firestore();
      const docRef = db.collection("profiles").doc(profileId);

      await docRef.update({
        [`reminders.${reminderKey}`]: firebase.firestore.FieldValue.delete()
      });
    }

    const label = reminderFields[reminderKey] || reminderKey;
    alert(`${label} reminder deleted!`);
    loadSavedPetProfile(); // Refresh UI
  }
}
// getReminderClass() NEWLY INSERTED
function getReminderClass(reminderDateString) {
  if (!reminderDateString) return '';
  const reminderDate = new Date(reminderDateString);
  const now = new Date();
  const timeDiff = reminderDate - now;
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

  if (timeDiff < 0) return 'overdue';
  if (daysDiff <= REMINDER_THRESHOLD_DAYS) return 'upcoming';
  return '';
}

// Function Image Preview Handler (NO CHANGES NEEDED)
  const petPhotoInput = DOM.petPhotoInput;  // modified
  const petPhotoPreview = DOM.petPhotoPreview;
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
// I NEED THIS TO BE USED TO GENERATE NEW PROFILES FOR FIRESTORE.
// A. Generate Unique ID For Drives, i need this function to be modified to create new profiles in Firestore 
// under "profiles" collection 
function generateUniqueId() {
  return 'pet-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
// B. Form-to-Data Mapping
function getPetDataFromForm() {
  return {
    // === Auto-generated Fields ===
    id: generateUniqueId(),
    ownerId: auth.currentUser.uid,
    lastUpdated: Date.now(),
    createdAt: Date.now(),

    // === Basic Information ===
    name: DOM.petName.value,
    breed: DOM.breed.value,
    age: parseFloat(DOM.age.value) || 0,
    weight: parseFloat(DOM.weight.value) || 0,
    gender: 'Unknown',
    type: 'Unknown',
      
    // === Microchip Information ===
    microchip: {
      id: DOM.microchipId.value,
      date: DOM.microchipDate.value,
      vendor: DOM.microchipVendor.value
    },

    // === Health Information ===
    allergies: DOM.allergies.value,
    medicalHistory: DOM.medicalHistory.value,
    dietPlan: DOM.dietPlan.value,
    mood: DOM.moodSelector.value,

    // === Emergency Contact ===
    emergencyContact: {
      name: DOM.emergencyContactName.value,
      phone: DOM.emergencyContactPhone.value,
      relationship: DOM.emergencyContactRelationship.value
    },

    // === Reminders ===
    reminders: {
      vaccinations: DOM.vaccinationsAndDewormingReminder.value,
      checkups: DOM.medicalCheckupsReminder.value,
      grooming: DOM.groomingReminder.value
    }
  };
}
// LoadPets function  definedrecently added
async function loadPets() {
  if (firebase.auth().currentUser) {
    const snapshot = await firebase.firestore()
      .collection("profiles")
      .where("ownerId", "==", firebase.auth().currentUser.uid)
      .get();
    return snapshot.docs.map(doc => doc.data());
  } else {
    return JSON.parse(localStorage.getItem('petProfiles')) || [];
  }
}
// Ensure canceledit function recently added
function ensureCancelEditButton() {
  let cancelButton = document.getElementById("cancelEdit");
  if (!cancelButton) {
    cancelButton = document.createElement("button");
    cancelButton.id = "cancelEdit";
    cancelButton.className = "cancel-btn";
    cancelButton.textContent = "Cancel Edit";

    const form = document.querySelector("form");
    if (form) {
      form.appendChild(cancelButton);
    }
  }
  cancelButton.style.display = "inline-block";
  cancelButton.onclick = handleCancelEdit;
}

// ======================
// LOAD SAVED PET PROFILES 🌟🌟
// ======================
async function loadSavedPetProfile() {
  try {
    let savedProfiles = [];

    if (firebase.auth().currentUser) {
      try {
        const snapshot = await firebase.firestore()
          .collection("profiles")
          .where("ownerId", "==", firebase.auth().currentUser.uid)
          .get();

        if (!snapshot.empty) {
          savedProfiles = snapshot.docs.map(doc => doc.data());
          window.petProfiles = savedProfiles;
          localStorage.setItem('petProfiles', JSON.stringify(savedProfiles)); // ✅ ADD THIS
          console.log("🔥 Loaded from Firestore:", savedProfiles);
            
        } else {
          console.warn("⚠️ No profiles in Firestore. Falling back to localStorage.");
          savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
        }
      } catch (err) {
        console.error("❌ Firestore fetch failed:", err);
        savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
      }
    }

    const savedProfilesList = DOM.savedProfilesList;
    if (!savedProfilesList) return;
    savedProfilesList.innerHTML = '';

    if (savedProfiles.length === 0) {
      savedProfilesList.innerHTML = '<li class="no-profiles">No pet profiles found</li>';
      return;
    }

    savedProfiles.forEach((profile, index) => {
  // Emergency contacts NA
  const emergencyContact = profile.emergencyContacts?.[0] || {};
  //  const emergencyContact = (
  // Array.isArray(profile.emergencyContacts) && profile.emergencyContacts.length > 0
  //   )
  //   ? profile.emergencyContacts[0]
  // : { name: '', phone: '', relationship: '' };
  //   console.log('✅ Emergency Contact:', emergencyContact);
        
      const petCard = document.createElement('li');
      petCard.className = 'pet-card';

      // 🧱 Set base card HTML
      petCard.innerHTML = `
      
        <div class="pet-card">
        
          <div class="card-section pet-header">
            ${profile.petPhoto ?  
               `<div class="pet-photo-wrapper">
               <img src="${profile.petPhoto.replace('http://', 'https://')}" alt="Pet Photo" class="pet-photo"/>
               </div>` :  
               `<div class="pet-photo-wrapper">
               <div class="pet-photo placeholder">🐾</div>
               </div>`}
           <h3>${profile.petName || 'Unnamed Pet'}</h3>
        </div>
     
          <div class="card-section pet-details">
            <p><strong>Type:</strong> ${profile.type || 'Unknown'}</p>
            <p><strong>Breed:</strong> ${profile.breed || 'N/A'}</p>
            <p><strong>Age:</strong> ${profile.age || 'N/A'}</p>
            <p><strong>Weight:</strong> ${profile.weight || 'N/A'}</p>
            <p><strong>Gender:</strong> ${profile.gender || 'Unknown'}</p>
            <p><strong>Mood:</strong> ${profile.mood || 'N/A'}</p>
            <p><strong>Diet:</strong> ${profile.dietPlan || 'N/A'}</p>
            <p><strong>Allergies:</strong> ${profile.allergies || 'N/A'}</p>
            <p><strong>Medical History:</strong> ${profile.medicalHistory || 'N/A'}</p>

            <p><strong>Microchip:</strong></p>
            <ul>
              <li>ID: ${profile.microchip?.id || 'N/A'}</li>
              <li>Date: ${profile.microchip?.date || 'N/A'}</li>
              <li>Vendor: ${profile.microchip?.vendor || 'N/A'}</li>
            </ul>

            <p><strong>Emergency Contact:</strong></p>
            <ul>
              <li>Name: ${emergencyContact.name || 'N/A'}</li>
              <li>Phone: ${emergencyContact.phone || 'N/A'}</li>
              <li>Relationship: ${emergencyContact.relationship || 'N/A'}</li>
            </ul>
          </div>
        </div>
      `;

      // 🔁 Dynamic Reminders Container (INJECTED AFTER innerHTML)
      const remindersDiv = document.createElement('div');
      remindersDiv.innerHTML = '<h4>Reminders</h4>';
      remindersDiv.className = 'pet-reminders';

      const today = new Date();
      const REMINDER_THRESHOLD_DAYS = 5;

      // ✅ Lottie animations
      const overdueAnimation = 'https://drkimogad.github.io/Pet-Health-Tracker/lottiefiles/overdue.json';
      const todayAnimation = 'https://drkimogad.github.io/Pet-Health-Tracker/lottiefiles/today.json';
      const upcomingAnimation = 'https://drkimogad.github.io/Pet-Health-Tracker/lottiefiles/upcoming.json';

      Object.entries(profile.reminders || {}).forEach(([key, value]) => {
        if (!value) return;

        const reminderDate = new Date(value);
        const timeDiff = reminderDate - today;
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const label = reminderFields[key] || key;

        const reminder = document.createElement('div');
        reminder.classList.add('reminder');

        let lottieHTML = '';
        let message = '';

        try {
          if (timeDiff < 0) {
            // Overdue
            emoji = '❗';
            lottieHTML = '<lottie-player src="' + overdueAnimation + '" background="transparent" speed="1" style="width:50px;height:50px;" autoplay></lottie-player>';
            message = '<strong>' + label + ':</strong> was due on ' + reminderDate.toLocaleString() +
              ' <button class="deleteReminderButton btn-overdue" data-profile-index="' + index + '" data-reminder="' + key + '">🗑 Delete</button>';
            reminder.classList.add('overdue');

          } else if (daysDiff === 0) {
            // Today
            emoji = '⏰';
            lottieHTML = '<lottie-player src="' + todayAnimation + '" background="transparent" speed="1" style="width:50px;height:50px;" autoplay></lottie-player>';
            message = '<strong>' + label + ':</strong> is today (' + reminderDate.toLocaleString() + ') ' +
              '<button class="deleteReminderButton btn-today" data-profile-index="' + index + '" data-reminder="' + key + '">🗑 Delete</button>';
            reminder.classList.add('today');

          } else if (daysDiff <= REMINDER_THRESHOLD_DAYS) {
            // Upcoming
            emoji = '📅';
            lottieHTML = '<lottie-player src="' + upcomingAnimation + '" background="transparent" speed="1" style="width:50px;height:50px;" autoplay></lottie-player>';
            message = '<strong>' + label + ':</strong> is on ' + reminderDate.toLocaleString() + ' ' +
              '<button class="deleteReminderButton btn-upcoming" data-profile-index="' + index + '" data-reminder="' + key + '">🗑 Delete</button>';
            reminder.classList.add('upcoming');

          } else {
            // No reminder animation 
            emoji = '🔔';
            message = '<strong>' + label + ':</strong> is on ' + reminderDate.toLocaleString();
          }

        } catch (error) {
          console.warn('⚠️ Reminder display failed:', error);
          message = label + ': ' + reminderDate.toLocaleString() + ' (⚠️ Animation failed)';
        }

        reminder.innerHTML = lottieHTML + '<span class="reminder-text">' + emoji + ' ' + message + '</span>';
        remindersDiv.appendChild(reminder);
      });
      petCard.appendChild(remindersDiv);
        
     // 🎯 Append pet-actions as a new block BELOW reminders
     const actionsDiv = document.createElement('div');
     actionsDiv.className = 'pet-actions';
     actionsDiv.innerHTML = `
            <div class="pet-actions">
              <button class="edit-btn" data-pet-id="${profile.id}">Edit</button>
              <button class="delete-btn" data-pet-id="${profile.id}">Delete</button>
              <button class="print-btn" data-pet-id="${profile.id}">Print</button>
              <button class="shareProfileButton" data-pet-id="${profile.id}">Share</button>
              <button class="qr-btn" data-pet-id="${profile.id}">Qr</button>
              <button class="details-btn" data-pet-id="${profile.id}">Details</button>
            `;
      petCard.appendChild(actionsDiv); // 👈 Append after remindersDiv
      savedProfilesList.appendChild(petCard);
    });

  } catch (error) {
    console.error('Load error:', error);
    showErrorToUser('Failed to load pet profiles');
  }
}

//================================
// Helper function to show petcard details via details button
//=================================
function showPetDetails(profile) {
  const emergencyContact = profile.emergencyContacts?.[0] || {};
  
  const detailsHtml = `
    <h3>${profile.petName || 'Unnamed Pet'}</h3>
    ${profile.petPhoto ? `<img src="${profile.petPhoto}" class="detail-photo">` : ''}
      
      <div class="details-grid">
        <div><strong>Breed:</strong> ${profile.breed || 'N/A'}</div>
        <div><strong>Age:</strong> ${profile.age || 'N/A'}</div>
        <div><strong>Weight:</strong> ${profile.weight || 'N/A'}</div>
        <div><strong>Type:</strong> ${profile.type || 'Unknown'}</div>
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
                
        <div class="section-break"><strong>Emergency Contact:</strong></div>
        <div>Name: ${emergencyContact.name || 'N/A'}</div>
        <div>Phone: ${emergencyContact.phone || 'N/A'}</div>
        <div>Relationship: ${emergencyContact.relationship || 'N/A'}</div>

        <div class="section-break"><strong>Reminders:</strong></div>
        <div>Vaccinations: ${formatReminder(profile.reminders?.vaccinations)}</div>
        <div>Checkups: ${formatReminder(profile.reminders?.checkups)}</div>
        <div>Grooming: ${formatReminder(profile.reminders?.grooming)}</div>
       </div>
       <div class="modal-actions">
      <button class="save-card-btn">💾 Save Card</button>
      <button class="print-btn" onclick="window.print()">🖨 Print</button>
      <button class="close-btn" onclick="hideModal()">Close</button>
      </div>
   </div>
  `;
  
  showModal(detailsHtml);
}
//=========================================
// FUNCTION EDIT PROFILE
// FUNCTION EDIT PROFILE (UPDATED FOR HYBRID STORAGE) FINALIZED
//=======================================
// for me to understand editting behaviour
//🧪 Think of the logic like this:
//Reset/clean the form
//Fill in the fields from profile
//Make form visible
//Scroll to it
async function editPetProfile(petId) {
  try {    
    // 1. Try to load from Firestore if available
    if (firebase.auth().currentUser) {
      const pets = await loadPets();
      profile = pets.find(p => p.id === petId);
    }    
    // 2. Fallback to localStorage
    if (!profile) {
      const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
      profile = savedProfiles.find(p => p.id === petId);
    }

    if (!profile) {
      showErrorToUser("Profile not found");
      return;
    }
    // Store original profile for cancel/recovery
    editingProfileId = petId;
    
   sessionStorage.setItem(`editingProfile_${petId}`, JSON.stringify({
     ...profile,
     _savedAt: Date.now()
   }));
   sessionStorage.setItem(`editingProfile_${petId}_timestamp`, Date.now()); 
    resetForm(); // Prevent leftover values or states
    // reassign photopreview here if needed
      
// Your existing field population logic (unchanged)
    const setValue = (field, value) => {
    const el = DOM[field];
    if (el) el.value = value || '';
   };
    setValue('petName', profile.petName);
    setValue('breed', profile.breed);
    setValue('age', profile.age);
    setValue('weight', profile.weight);
    setValue('petType', profile?.type || '');  
    setValue('petGender', profile?.gender || '');
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
      // Modified 
    setValue('vaccinationsAndDewormingReminder', profile.reminders?.vaccinations);
    setValue('medicalCheckupsReminder', profile.reminders?.checkups);
    setValue('groomingReminder', profile.reminders?.grooming);
    
    // Handle pet photo preview
    const preview = DOM.petPhotoPreview;
    if (preview && profile.petPhoto) {
      preview.src = profile.petPhoto;
      preview.style.display = 'block';
    }

    // Call cancel button function added recently
    ensureCancelEditButton();
    DOM.petList.classList.remove("hidden"); // ✅ Make the profile form visible

    // Scroll to form
    DOM.petList.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Edit error:', error);
    showErrorToUser('Failed to load profile for editing');
  }
}

// UPDATED CANCEL EDIT FUNCTION
function handleCancelEdit() {
  if (editingProfileId !== null) {
    // ✅ Retrieve original profile correctly
    const originalProfile = JSON.parse(
      sessionStorage.getItem(`editingProfile_${editingProfileId}`) // Use getItem
    );

    if (originalProfile) {
      // ✅ Properly reset form fields
      const setValue = (field, value) => {
      const el = DOM[field];
     if (el) el.value = value || '';
   };
      // Basic Info
      setValue('petName', originalProfile.petName);
      setValue('breed', originalProfile.breed);
      setValue('age', originalProfile.age);
      setValue('weight', originalProfile.weight);
      setValue('petType', originalProfile?.type || '');
      setValue('petGender', originalProfile?.gender || '');

      // Microchip
      setValue('microchipId', originalProfile.microchip?.id);
      setValue('microchipDate', originalProfile.microchip?.date);
      setValue('microchipVendor', originalProfile.microchip?.vendor);

      // Health
      setValue('allergies', originalProfile.allergies);
      setValue('medicalHistory', originalProfile.medicalHistory);
      setValue('dietPlan', originalProfile.dietPlan);
      setValue('moodSelector', originalProfile.mood);

      // Emergency Contact
      const ec = originalProfile.emergencyContacts?.[0] || {};
      setValue('emergencyContactName', ec.name);
      setValue('emergencyContactPhone', ec.phone);
      setValue('emergencyContactRelationship', ec.relationship);

      // Reminders
      setValue('vaccinationsAndDewormingReminder', originalProfile.vaccinationsAndDewormingReminder);
      setValue('medicalCheckupsReminder', originalProfile.medicalCheckupsReminder);
      setValue('groomingReminder', originalProfile.groomingReminder);

      // Photo Preview
      const preview = DOM.petPhotoPreview;
      if (preview && originalProfile.petPhoto) {
        preview.src = originalProfile.petPhoto;
        preview.style.display = 'block';
      }
    }

    // Cleanup
    sessionStorage.removeItem(`editingProfile_${editingProfileId}`);
    editingProfileId = null;

    const cancelButton = document.getElementById("cancelEdit");
    if (cancelButton) {
    cancelButton.remove(); // Cleanly remove it from DOM
    }

    DOM.petPhotoPreview.style.display = 'none';
    DOM.petPhotoInput.value = '';
    resetForm();
   DOM.petList.classList.add("hidden");
   DOM.savedProfilesList.classList.remove("hidden");
   DOM.petList.scrollIntoView({ behavior: 'smooth' });
  }
}
//=================================================
// FUNCTION DELETE PROFILE (UPDATED FOR HYBRID STORAGE) FINALIZED EXCEPT CLOUDINARY
//======================================================
// ⚠️ NOTE: Cloudinary images are not deleted here.
// Cloudinary requires secure Admin API access (with secret key) to delete images,
// which cannot be safely handled in a frontend-only app.
// This means deleted profiles may leave behind orphaned images in Cloudinary.
// ✅ Add server-side function or cleanup mechanism later if needed.

async function deletePetProfile(petId) {
  try {
    const pets = await loadPets();
    const petToDelete = pets.find(p => p.id === petId);

    // 🔸 Delete from Firestore
    if (firebase.auth().currentUser) {
      await firebase.firestore().collection('profiles').doc(petId).delete();
    }

    // 🔸 Optional: Remove from IndexedDB if still used
    if (window.petDB) {
      const tx = petDB.transaction('pets', 'readwrite');
      tx.objectStore('pets').delete(petId);
    }

    // 🔸 Remove from localStorage
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const localIndex = savedProfiles.findIndex(p => p.id === petId);
    let petName = 'Unnamed Pet';

    if (localIndex !== -1) {
      petName = savedProfiles[localIndex].petName || 'Unnamed Pet';
      savedProfiles.splice(localIndex, 1);
      localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    }

    // 🔸 Update UI
    loadSavedPetProfile();
    showSuccessNotification('deleted', petName);

  } catch (error) {
    console.error('Delete error:', error);
    showErrorToUser('Failed to delete profile');
  }
}
//====================================
// Print Pet Profile button functionality FINALIZED
//======================================
async function printPetProfile(petId) { // Use ID instead of index
  try {
    const profiles = await loadPets(); // Hybrid data source
    const profile = profiles.find(p => p.id === petId); // ✅

    if (!profile) {
      alert("Profile not found!");
      return;
    }

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
        
      img.onerror = () => {
    console.warn("⚠️ Pet photo failed to load. Continuing without image.");
    resolve(); // Continue even if photo doesn't load
     };
        
    setTimeout(() => {
    console.warn("⚠️ Print timed out. Proceeding without photo.");
    resolve();
    }, 5000); // max wait 5s
    img.src = profile.petPhoto; // ✅ Add this line
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
        .print-label { font-weight: bold; color: #444; }
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

      <div class="print-section">
        <div><span class="print-label">Breed:</span> ${profile.breed || 'N/A'}</div>
        <div><span class="print-label">Age:</span> ${profile.age || 'N/A'}</div>
        <div><span class="print-label">Weight:</span> ${profile.weight || 'N/A'}</div>
        <div><span class="print-label">Type:</span> ${profile.type || 'N/A'}</div>
        <div><span class="print-label">Gender:</span> ${profile.gender || 'N/A'}</div>
      </div>

      <div class="print-section">
        <h3>Microchip Info</h3>
        <div><span class="print-label">ID:</span> ${profile.microchip?.id || 'N/A'}</div>
        <div><span class="print-label">Date:</span> ${profile.microchip?.date || 'N/A'}</div>
        <div><span class="print-label">Vendor:</span> ${profile.microchip?.vendor || 'N/A'}</div>
      </div>

      <div class="print-section">
        <h3>Medical Details</h3>
        <div><span class="print-label">Allergies:</span> ${profile.allergies || 'None'}</div>
        <div><span class="print-label">Medical History:</span> ${profile.medicalHistory || 'None'}</div>
        <div><span class="print-label">Diet Plan:</span> ${profile.dietPlan || 'None'}</div>
        <div><span class="print-label">Mood:</span> ${profile.mood || 'Neutral'}</div>
      </div>
      
      <div class="print-section">
        <h3>Emergency Contact</h3>
        <div><span class="print-label">Name:</span> ${profile.emergencyContacts?.[0]?.name || 'N/A'}</div>
        <div><span class="print-label">Phone:</span> ${profile.emergencyContacts?.[0]?.phone || 'N/A'}</div>
        <div><span class="print-label">Relationship:</span> ${profile.emergencyContacts?.[0]?.relationship || 'N/A'}</div>
      </div>

      <div class="print-section">
        <h3>Reminders</h3>
        <div><span class="print-label">Vaccinations:</span> ${profile.reminders?.vaccinations || 'N/A'}</div>
        <div><span class="print-label">Checkups:</span> ${profile.reminders?.checkups || 'N/A'}</div>
        <div><span class="print-label">Grooming:</span> ${profile.reminders?.grooming || 'N/A'}</div>
      </div>
      
    </body>
  </html>
`;

      // Phase 3: Write final content
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Phase 4: ✅ Wait for full print window readiness (modern + fallback safe)
const waitForReadyAndPrint = () => {
  const checkReady = setInterval(() => {
    try {
      const body = printWindow.document.body;
      const imgReady = !photoDataURL || printWindow.document.querySelector('img[src="' + photoDataURL + '"]')?.complete;

      if (body && body.innerHTML.includes(profile.petName) && imgReady) {
        clearInterval(checkReady);
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => {
            if (photoDataURL) URL.revokeObjectURL(photoDataURL);
            printWindow.close();
          };
        }, 300);
      }
    } catch (e) {
      clearInterval(checkReady);
      console.warn("❌ Failed to check print window readiness:", e);
      printWindow.close();
    }
  }, 300);
};
// 👇 Start waiting for it to be ready
waitForReadyAndPrint();
    }); // <-- closes Promise.all .then()
  } catch (error) {
    console.error('Print error:', error);
    alert('Failed to load profile for printing');
  }
}
//============================================
// SHARE PET PROFILE (UPDATED FOR HYBRID STORAGE) FINALIZED
//===========================================
async function sharePetProfile(petId) {
  try {
    let profile;
    
    // 1. Try to load from Google Drive if available
    if (firebase.auth().currentUser) {
      const pets = await loadPets();
      profile = pets.find(p => p.id === petId);
    }
    
    // 2. Fallback to localStorage
    if (!profile) {
      const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
      profile = savedProfiles.find(p => p.id === petId);
    }

    if (!profile) {
      showErrorToUser("Profile not found");
      return;
    }

    const emergencyContact = (profile.emergencyContacts && profile.emergencyContacts[0]) || {};
    
    // Your existing share data preparation (unchanged)
    const shareData = {
      title: `${profile.petName}'s Health Profile`,
      text: `Pet Details:\n${
      Object.entries({
           Name: profile.petName,
           Breed: profile.breed,
           Age: profile.age,
           Weight: profile.weight,
           Type: profile.type || 'N/A',
           Gender: profile.gender || 'N/A',
           Mood: profile.mood || 'N/A',
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

    // Your existing share logic (unchanged)
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Shared successfully'))
        .catch(console.error);
    } else {
      const textToCopy = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy)
          .then(() => alert('Profile copied to clipboard!'))
          .catch(() => prompt('Copy the following text:', textToCopy));
      } else {
        prompt('Copy the following text:', textToCopy);
      }
    }

  } catch (error) {
    console.error('Share error:', error);
    showErrorToUser('Failed to share profile');
  }
}
// ======== QR CODE GENERATION button functionality ========
async function generateQRCode(petId) { // Use ID instead of index
  try {
    const profiles = await loadPets(); // Hybrid data source
    const profile = profiles.find(p => p.id === petId); // ✅

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
Gender: ${profile.gender || 'Unknown'}
Type: ${profile.type || 'Unknown'}
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
   } catch (error) { // <- Add catch directly after closing try brace
    console.error("Main Error:", error);
    alert("QR initialization failed");
  }
} 
// =======================================
// ==== AUTO LOGOUT AFTER INACTIVITY ====
// Keep it running befor listeners and initialization
let inactivityTimer;
const SESSION_TIMEOUT_MINUTES = 30;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    alert("Session expired due to inactivity. Logging out.");
    firebase.auth().signOut(); // Safe logout
  }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
}

// Monitor activity to reset timer
['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt =>
  document.addEventListener(evt, resetInactivityTimer)
);

// Start timer
resetInactivityTimer();

// ===== NETWORK CONNECTIVITY AWARENESS =====
window.addEventListener('offline', () => {
  showErrorToUser("⚠️ You're offline. Changes will be saved locally.");
});

window.addEventListener('online', () => {
  showSuccessNotification("✅ You're back online. Sync available.");
});
// ======== EVENT DELEGATION (FIXED) ========
// ✅ Keep this block to handle profile actions (WIRING) ALL THE BUTTONS IN LOADSAVEDPETPROFILES FUNCTION✅
DOM.savedProfilesList?.addEventListener('click', (e) => {
  if (!e.target?.closest('button')) return;
  
  const btn = e.target.closest('button');
  const petId = btn.dataset?.petId;
  if (!petId) return;

  if (btn.classList.contains('edit-btn')) {
    editPetProfile(petId);
  }
  else if (btn.classList.contains('delete-btn')) {
    if (confirm('Delete this profile?')) deletePetProfile(petId);
  }
 else if (btn.classList.contains('details-btn')) {
  if (petId) {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const profile = profiles.find(p => p.id === petId);
    if (profile) showPetDetails(profile);
    else showErrorToUser('Profile not found');
  }
}
else if (btn.classList.contains('print-btn')) {
  if (petId) printPetProfile(petId);
  }
  else if (btn.classList.contains('shareProfileButton')) {
  if (petId) sharePetProfile(petId);
  }
  else if (btn.classList.contains('qr-btn')) {
  if (petId) generateQRCode(petId);
  }
});

// Add this to catch handled errors 
window.onerror = (msg, url, line) => {
  alert(`Error: ${msg}\nLine: ${line}`);
  return true; // Prevent default error logging
};

// ✅  Add the reminders delete listener just below it
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('deleteReminderButton')) {
    const profileIndex = e.target.dataset.profileIndex;
    const reminderKey = e.target.dataset.reminder;

    if (profileIndex !== undefined && reminderKey) {
      deleteReminder(profileIndex, reminderKey);
    }
  }
});

// Show details modal Listener
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('save-card-btn')) {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;

    try {
      const canvas = await html2canvas(modalContent);
      const dataURL = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'PetCard.png';
      link.click();
    } catch (err) {
      console.error('🛑 Failed to save card:', err);
      alert('Failed to generate image.');
    }
  }
});

// ======================    
// ITIALIZE DASHBOARD
// ======================    
function initializeDashboard() {
  console.log("⚙️ Running initializeDashboard()");
// ======================    
// FORM SUBMISSION MOVED INSIDE INITIALIZEDASHBOARD FUNCTION 
// ======================
DOM.petList.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    // Get all form data (preserving your existing structure)
    const petData = {
      // Your existing fields
      petName: DOM.petName?.value,
      breed: DOM.breed?.value,
      age: DOM.age?.value,
      weight: DOM.weight?.value,
      type: DOM.petType?.value || 'Unknown',
      gender: DOM.petGender?.value || 'Unknown',
      microchip: {
        id: DOM.microchipId?.value,
        date: DOM.microchipDate?.value,
        vendor: DOM.microchipVendor?.value
      },
      allergies: DOM.allergies?.value,
      medicalHistory: DOM.medicalHistory?.value,
      dietPlan: DOM.dietPlan?.value,
        
      emergencyContacts: [{
      name: DOM.emergencyContactName?.value,
      phone: DOM.emergencyContactPhone?.value,
      relationship: DOM.emergencyContactRelationship?.value
     }],

      mood: DOM.moodSelector?.value,
      reminders: {
      vaccinations: DOM.vaccinationsAndDewormingReminder?.value,
      checkups: DOM.medicalCheckupsReminder?.value,
      grooming: DOM.groomingReminder?.value
     },      
      // New fields we're adding
      id: editingProfileId || generateUniqueId(), // Fixed ID generation
      ownerId: firebase.auth().currentUser?.uid || 'local-user',
      lastUpdated: Date.now(),
      createdAt: Date.now()
    };

 // photo handling      
const fileInput = DOM.petPhotoInput;
      
// ✅ If editing and NO new image, reuse existing photo
if (editingProfileId !== null && !fileInput.files[0]) {
  const existingProfile = savedProfiles.find(p => p.id === editingProfileId);
  if (existingProfile && existingProfile.petPhoto) {
    petData.petPhoto = existingProfile.petPhoto;
    petData.cloudinaryPath = existingProfile.cloudinaryPath || '';
    petData.imageDimensions = existingProfile.imageDimensions || {};
  }
}

// ✅ If new image was uploaded, use it instead
if (fileInput.files[0]) {
  try {
    const uploadResult = await uploadToCloudinary(
      fileInput.files[0],
      firebase.auth().currentUser.uid,
      petData.id
    );

    petData.petPhoto = uploadResult.url.replace(/^http:\/\//, 'https://');
    petData.cloudinaryPath = uploadResult.path;
    petData.imageDimensions = {
      width: uploadResult.width,
      height: uploadResult.height
    };
  } catch (error) {
    showErrorToUser("❌ Image upload failed. Try again.");
    return;
  }
}
console.log("🖼️ Using photo:", petData.petPhoto);
    
// firestore saving implementation
    if (firebase.auth().currentUser) {
  const db = firebase.firestore();
  const profileRef = db.collection("profiles").doc(petData.id); // Use pet ID as document ID
  await profileRef.set(petData);
  console.log("📥 Profile saved to Firestore:", petData);
}
      
// 2. Also update localStorage (for offline fallback)
savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
// IF EDITING 
      if (editingProfileId !== null) {
      const index = savedProfiles.findIndex(p => p.id === editingProfileId);
      if (index !== -1) {
      savedProfiles[index] = petData;
      }
     } else {
        savedProfiles.push(petData); // Add new profile
     }
      
      localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    // In the form submission success feedback:
   showSuccessNotification(
    editingProfileId !== null ? 'Profile updated' : 'Profile saved', // ✅ Fixed
    petData.petName || 'Unnamed Pet'
   );

    // Reset and reload
    loadSavedPetProfile(); // Fixed function name
    resetForm();
    editingProfileId = null; // Clear edit mode
   // UPDATE UI
   DOM.petList.classList.add("hidden");              // Hide the profile form
   DOM.savedProfilesList.classList.remove("hidden"); // Show the profile cards

  } catch (error) {
    console.error('Save error:', error);
    showErrorToUser('Failed to save profile. Please try again.');
  }
});
        
// REST OF INITIALIZE DASHBOARD FUNCTION  
if (DOM.addPetProfileBtn) {
  console.log("✅ addPetProfileBtn found:", DOM.addPetProfileBtn);
  DOM.addPetProfileBtn.addEventListener('click', () => {
    console.log("🟢 New Profile button clicked");
    if (DOM.petList) {
      DOM.petList.classList.remove('hidden');
      console.log("✅ petList form revealed");
    } else {
      console.warn("⛔ petList not found in DOM");
    }
  });
} else {
  console.warn("⛔ addPetProfileBtn not found in DOM");
}
  // Check auth state
 // firebase.auth().onAuthStateChanged((user) => {
  //  if (user) {
  //    loadSavedPetProfile();
 //   }
//  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDashboard);

// ===== SESSION RECOVERY WITH EXPIRY =====
function runSessionRecovery() {
const MAX_RECOVERY_AGE = 30 * 60 * 1000; // 30 mins
const editingSessionKeys = Array.from({ length: sessionStorage.length })
  .map((_, i) => sessionStorage.key(i))
  .filter(key => key.startsWith('editingProfile_'));

editingSessionKeys.forEach(key => {
  const petId = key.split('_')[1];
  const originalProfile = JSON.parse(sessionStorage.getItem(key));

  // ⏳ Only restore if saved recently
  const isFresh = !originalProfile._savedAt || 
    (Date.now() - originalProfile._savedAt < MAX_RECOVERY_AGE);

  if (!originalProfile || !isFresh) {
    sessionStorage.removeItem(key);
    return;
  }

  // Pre-fill form
  const safeSetValue = (field, value) => {
    const el = DOM[field];
    if (el) el.value = value || '';
  };

  // Restore fields
  safeSetValue('petName', originalProfile.petName);
  safeSetValue('breed', originalProfile.breed);
  safeSetValue('age', originalProfile.age);
  safeSetValue('weight', originalProfile.weight);
  safeSetValue('petType', originalProfile.type);
  safeSetValue('petGender', originalProfile.gender);
  safeSetValue('microchipId', originalProfile.microchip?.id);
  safeSetValue('microchipDate', originalProfile.microchip?.date);
  safeSetValue('microchipVendor', originalProfile.microchip?.vendor);
  safeSetValue('allergies', originalProfile.allergies);
  safeSetValue('medicalHistory', originalProfile.medicalHistory);
  safeSetValue('dietPlan', originalProfile.dietPlan);
  safeSetValue('moodSelector', originalProfile.mood);

  const ec = originalProfile.emergencyContacts?.[0] || {};
  safeSetValue('emergencyContactName', ec.name);
  safeSetValue('emergencyContactPhone', ec.phone);
  safeSetValue('emergencyContactRelationship', ec.relationship);

  safeSetValue('vaccinationsAndDewormingReminder', originalProfile.vaccinationsAndDewormingReminder);
  safeSetValue('medicalCheckupsReminder', originalProfile.medicalCheckupsReminder);
  safeSetValue('groomingReminder', originalProfile.groomingReminder);

  if (originalProfile.petPhoto && DOM.petPhotoPreview) {
    DOM.petPhotoPreview.src = originalProfile.petPhoto;
    DOM.petPhotoPreview.style.display = 'block';
  }

  // Set global edit ID
  editingProfileId = petId;

  // Show cancel button
  ensureCancelEditButton();
});
}
