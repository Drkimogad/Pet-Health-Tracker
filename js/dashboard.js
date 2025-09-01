
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
  birthdayReminder: document.getElementById('birthdayReminder'), 
  vaccinationsAndDewormingReminder: document.getElementById('vaccinationsAndDewormingReminder'),
  medicalCheckupsReminder: document.getElementById('medicalCheckupsReminder'),
  groomingReminder: document.getElementById('groomingReminder')
};

// Safety check (optional)
if (!DOM.savedProfilesList || !DOM.petList) {
  console.error('Critical DOM elements missing! Check your HTML IDs');
}

// =======REMINDERS🌟
const REMINDER_THRESHOLD_DAYS = 3;
const ALLOWED_REMINDER_TYPES = ['vaccination', 'checkup', 'grooming', 'birthdayReminder'];
const REMINDER_TYPE_MAP = {
  vaccinations: 'vaccination',
  checkups: 'checkup',
  grooming: 'grooming',
  birthdayReminder: 'birthdayReminder'
};
const reminderFields = {
  vaccinations: 'Vaccinations/Deworming',
  checkups: 'Medical Check-ups',
  grooming: 'Grooming',
  birthdayReminder:'Birthday Reminder'
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
//  TO GENERATE NEW PROFILES FOR FIRESTORE.
// A. Generate Unique ID  
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
     birthdayReminder: DOM.birthdayReminder.value, 
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
//=========================================
// Ensure canceledit function recently added
//=========================================
function ensureCancelEditButton() {
  const form = document.getElementById("petList");
  if (!form) {
    console.warn("⚠️ Form element not found, cannot inject Cancel button.");
    return;
  }

  let cancelButton = document.getElementById("cancelEditBtn");

  if (!cancelButton) {
    cancelButton = document.createElement("button");
    cancelButton.id = "cancelEditBtn";
    cancelButton.className = "button cancel-btn";
    cancelButton.type = "button";
    cancelButton.innerHTML = '<i class="fas fa-times"></i> Cancel Edit';

    cancelButton.addEventListener("click", () => {
      if (confirm("Discard changes to this profile?")) {
        handleCancelEdit();
      }
    });

    // Place it right after the submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.after(cancelButton);
    } else {
      form.appendChild(cancelButton);
    }

    console.log("✅ Cancel Edit button injected into form.");
  } else {
    cancelButton.style.display = "inline-block";
    console.log("✅ Cancel Edit button already exists, now visible.");
  }
}



// ======================
// LOAD SAVED PET PROFILES 🌟🌟PRODUCTION READY
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
      const REMINDER_THRESHOLD_DAYS = 3;

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
              <button class="edit-btn" data-pet-id="${profile.id}">Edit Profile</button>
              <button class="inviteFriends-btn" data-pet-id="${profile.id}">Invite Friends</button>
              <button class="details-btn" data-pet-id="${profile.id}">Profile Details</button>
              <button id="exportAll-btn" class="exportAll-btn">📤 Save All Cards</button>
              <button class="qr-btn" data-pet-id="${profile.id}">Generate Qr Code</button>
              <button class="delete-btn" data-pet-id="${profile.id}">Delete Profile</button>
            `;   
    const communityChatBtn = createCommunityChatButton(profile.id);
    actionsDiv.appendChild(communityChatBtn);
        
        // Append to card        
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
// ✅ UPDATED showPetDetails() with Share Button in Modal
function showPetDetails(profile) {
    // 🆕 ADD THIS LINE AT THE VERY TOP:
  if (!profile) return showErrorNotification("No profile data available.");
  // === START CRITICAL FIXES ===
  // 1. Verify profile exists in current data
  const currentData = JSON.parse(localStorage.getItem('petProfiles')) || [];
  if (!currentData.some(p => p.id === profile.id)) {
  showErrorNotification("Profile data not found.");
  return hideModal(); // Don't proceed if data was cleared
  }

  // 2. Verify auth state
  if (typeof firebase !== 'undefined' && firebase.auth().currentUser === null) {
  showErrorNotification("Please sign in to view details.");
  return hideModal(); // Prevent auth popup flash
  }
    
console.log("🔍 showPetDetails() triggered", profile); // added   
console.log("🧱 Preparing modal content...");
console.log("🖼️ profile.petPhoto:", profile.petPhoto);
console.log("🔗 profile.shareableUrl:", profile.shareableUrl);
    
// old code
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
      <div>Name: ${profile.emergencyContacts?.[0]?.name || 'N/A'}</div>
      <div>Phone: ${profile.emergencyContacts?.[0]?.phone || 'N/A'}</div>
      <div>Relationship: ${profile.emergencyContacts?.[0]?.relationship || 'N/A'}</div>


      <div class="section-break"><strong>Reminders:</strong></div>
      <div>BirthdayReminder: ${formatReminder(profile.reminders?.birthdayReminder)}</div>
      <div>Vaccinations: ${formatReminder(profile.reminders?.vaccinations)}</div>
      <div>Checkups: ${formatReminder(profile.reminders?.checkups)}</div>
      <div>Grooming: ${formatReminder(profile.reminders?.grooming)}</div>
    </div>

    <div class="modal-actions">
      <button class="close-btn" onclick="hideModal()">❌️ Close Card</button>
      <button class="pdf-btn">💾 Save as PDF</button>
    </div>
  `;
    
console.log("👀 Attempting to unhide modal overlay...");

  // ✅ Inject modal into DOM
  showModal(detailsHtml);
    
// ✅ Use requestAnimationFrame instead of setTimeout for smooth injection
requestAnimationFrame(() => {
  const modal = document.querySelector('.modal-content');
  const photo = modal?.querySelector('.detail-photo');
  
  console.log("🖼️ Modal ready. Photo loaded:", photo?.complete); 
  
  // Refactored PDF saving logic specifically for the modal
  async function saveModalAsPDF() {
        console.log("💾 PDF button clicked - function started");
      
    const loader = document.createElement('div');
        console.log("🎯 Loader created - STEP 2"); // ← ADD THIS

    loader.className = 'loader pdf-loader';
        console.log("🎯 Loader class set - STEP 3"); // ← ADD THIS

    document.body.appendChild(loader);
  console.log("🎯 Loader appended - STEP 4"); // ← ADD THIS

    try {
            console.log("📄 Generating PDF...");

      // 1. Wait for modal to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 2. Clone and sanitize modal content
      const pdfContainer = document.createElement('div');
      pdfContainer.className = 'pdf-export-container';
      // Add responsive PDF container styling
      pdfContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 100%;
        max-width: 210mm;
        background: white;
        padding: 15mm;
        box-sizing: border-box;
      `;   
      // Force font scaling for PDF
      modalClone.style.cssText = `
     font-size: 16pt;
     line-height: 1.5;
     `;
      const modalClone = modal.cloneNode(true);
      // Remove interactive elements
      modalClone.querySelectorAll('button, [onclick]').forEach(el => el.remove());
      pdfContainer.appendChild(modalClone);
      document.body.appendChild(pdfContainer);

   // 3. Wait for final rendering with reminders-specific checks
await Promise.race([
  new Promise(resolve => {
    const checkRender = () => {
      const lastElement = document.querySelector('.pdf-export-container .section-break:last-child + div');
      if (lastElement?.offsetHeight > 0) {
        resolve();
      } else {
        requestAnimationFrame(checkRender);
      }
    };
    checkRender();
  }),
  new Promise(resolve => setTimeout(resolve, 1000))
]);

// 4. CAPTURE IMAGE - ONLY ADD THIS ONE FIX
const canvas = await html2canvas(pdfContainer, {
  scale: 2,
  useCORS: true,
  logging: true,
  backgroundColor: '#FFFFFF',
  scrollX: 0,
  scrollY: 0,
  windowWidth: pdfContainer.scrollWidth,
  windowHeight: pdfContainer.scrollHeight
});
        
      // 5. Generate PDF
      if (!window.jspdf) {
        await loadScriptWithRetry('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.addImage(canvas, 'PNG', 0, 0, 210, 297);
      doc.save(`PetProfile_${new Date().getTime()}.pdf`);
            console.log("✅ PDF saved successfully");

  setTimeout(() => {
     console.log("📢 Attempting to show success notification");
      showSuccessNotification("PDF saved successfully! 📄");
}, 100);
        
    } catch (error) {
      console.error("PDF generation failed:", error);
     setTimeout(() => {
      showErrorNotification("Failed to save PDF. Please try again.");
    }, 100);
        
    } finally {
     hideModal(); // ← HIDE MODAL HERE ONCE for both success and error
    console.log("🚪 Modal closed");
   console.log("🧹 Cleaning up loader");
      loader.remove();
      document.querySelector('.pdf-export-container')?.remove();
    }
  }

  // Make the function available globally
  window.saveModalAsPDF = saveModalAsPDF;

  // Update the PDF button to use our new function
  const pdfBtn = modal?.querySelector('.pdf-btn');
  if (pdfBtn) {
    pdfBtn.onclick = saveModalAsPDF;
  }

}); // closes request animation frame
} // Closes showdetails()

//=========================================
// FUNCTION EDIT PROFILE
// FUNCTION EDIT PROFILE (UPDATED FOR HYBRID STORAGE) PRODUCTION READY
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
    setValue('birthdayReminder', profile.reminders?.birthdayReminder);
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
  //  showErrorToUser('Failed to load profile for editing');
  // handled by UI in form submission
  }
}
//========================================
// UPDATED CANCEL EDIT FUNCTION
// UPDATED TO HIDE CANCEL BUTTON AND KEEPING IT IN DOM SO ONCE IT IS INJECTED IT WORKS FOR BOTH
function handleCancelEdit() {
  console.log("🔙 Cancel Edit clicked — resetting view");

  if (editingProfileId !== null) {
    // ✅ Restore form fields from saved edit state
    const originalProfile = JSON.parse(
      sessionStorage.getItem(`editingProfile_${editingProfileId}`)
    );

    if (originalProfile) {
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

      // Reminders (flat fields!)
      setValue('birthdayReminder', originalProfile.birthdayReminder);
      setValue('vaccinationsAndDewormingReminder', originalProfile.vaccinationsAndDewormingReminder);
      setValue('medicalCheckupsReminder', originalProfile.medicalCheckupsReminder);
      setValue('groomingReminder', originalProfile.groomingReminder);

      // Photo Preview
      const preview = DOM.petPhotoPreview;
      if (preview && originalProfile.petPhoto) {
        preview.src = originalProfile.petPhoto;
        preview.style.display = 'block';
      }

      sessionStorage.removeItem(`editingProfile_${editingProfileId}`);
    }

    // Clear edit mode
    editingProfileId = null;
  } else {
    // 🆕 Handle Create Mode: just clear form fields
    console.log("🆕 Cancelled new profile creation");

    const form = DOM.petList;
    if (form) form.reset(); // clear all fields

    // Reset photo preview
    if (DOM.petPhotoPreview) {
      DOM.petPhotoPreview.src = '';
      DOM.petPhotoPreview.style.display = 'none';
    }

    if (DOM.petPhotoInput) {
      DOM.petPhotoInput.value = '';
    }
  }
    resetForm();
  // 🔁 UI Reset for both create/edit
  //if (DOM.profileSection) DOM.profileSection.classList.add("hidden");
 // if (DOM.petList) DOM.petList.classList.add("hidden");
 // if (DOM.dashboard) DOM.dashboard.classList.remove("hidden");
   DOM.petList.classList.add("hidden");
   DOM.savedProfilesList.classList.remove("hidden");
  window.scrollTo(0, 0);
}

//==============================
// OPENCREATEFUNCTION RECENTLY IMPLEMENTED
// It uses same canceledit i have
//===============================================
function openCreateForm() {
  console.log("➕ Opening form to create new pet profile");

  // 1. RESET STATE
  isEditing = false;
  currentEditIndex = null;
  uploadedImageUrls = [];

  // 2. RESET FORM FIELDS
  DOM.petList.reset(); // Clear basic inputs

  // Manually clear optional fields if needed
  const emergencyFields = ["emergencyName", "emergencyPhone", "emergencyRelationship", "microchipNumber"];
  emergencyFields.forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });

// 3. CANCEL BUTTON LOGIC
let cancelBtn = document.getElementById("cancelEditBtn");

if (!cancelBtn) {
    // Create new button
    cancelBtn = document.createElement("button");
    cancelBtn.id = "cancelEditBtn";
    cancelBtn.type = "button";
    cancelBtn.className = "button cancel-btn";
    
    cancelBtn.addEventListener("click", () => {
        if (confirm("Discard this new profile?")) {
            handleCancelEdit();
        }
    });

    // Append to form actions
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
        formActions.appendChild(cancelBtn);
    }
}

// ✅ CRITICAL: ALWAYS set the text to "Cancel Edit" (whether new or existing)
cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
cancelBtn.style.display = "inline-block"; // Ensure it's visible

  // 4. UPDATE UI
  DOM.petList.classList.remove("hidden"); // show form
  DOM.savedProfilesList.classList.add("hidden"); // hide saved list

  // 5. Scroll to form
  DOM.petList.scrollIntoView({ behavior: "smooth" });

  console.log("✅ Create form ready for new profile");
}



//=================================================
// FUNCTION DELETE PROFILE (UPDATED FOR HYBRID STORAGE) PRODUCTION READY EXCEPT CLOUDINARY
//======================================================
// ⚠️ NOTE: Cloudinary images are not deleted here.
// Cloudinary requires secure Admin API access (with secret key) to delete images,
// which cannot be safely handled in a frontend-only app.
// This means deleted profiles may leave behind orphaned images in Cloudinary.
// ✅ Add server-side function or cleanup mechanism later if needed.


//=================================================
async function deletePetProfile(petId) {
  try {
    const pets = await loadPets();
    const petToDelete = pets.find(p => p.id === petId);

       // 🔹 Show paw animation while deleting
  showDashboardLoader(true, "deleting"); 

    // 🔸 Cloudinary image deletion via HTTP FUNCTION
    if (petToDelete?.public_id && firebase.auth().currentUser) {
      try {
        const user = firebase.auth().currentUser;
        const token = await user.getIdToken();
        
        const response = await fetch('https://us-central1-pet-health-tracker-4ec31.cloudfunctions.net/deleteImage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ public_id: petToDelete.public_id })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Cloudinary delete result:", result);

      } catch (err) {
        console.error("❌ Failed to delete image from Cloudinary:", err);
      }
    }

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

    if (localIndex !== -1) {
      petName = savedProfiles[localIndex].petName || 'Unnamed Pet';
      savedProfiles.splice(localIndex, 1);
      localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    }

// 🔸 UI update with requestAnimationFrame for smooth rendering
requestAnimationFrame(() => {
  loadSavedPetProfile();
  showDashboardLoader(false, "success-deleting"); // success message
 // fallback is handled automatically by helper in utils.js 
});

} catch (error) {
  console.error('Delete error:', error);
  // ❌ Show paws + delete error message
  showDashboardLoader(true, "error-deleting");
  // error fallback is handled by helper 
}
}


//====================================
// exportAllPetCards button functionality PRODUCTION READY
//======================================
/**
 * Unified Pet Card Export Function
 * @param {boolean} asZip - Set true to export as ZIP, false for individual downloads
 */
async function exportAllPetCards(asZip = false) {
// ✅ move container declaration outside try to avoid undefined in finally block
  let container = null; 
    
  try {
      
    // ✅ Show loader overlay with paws animation and "exporting" message
showDashboardLoader(true, "exporting");

    // ✅ Ensure loader actually renders before starting heavy processing
    await new Promise(r => requestAnimationFrame(r));

    const profiles = await loadPets();
    if (!profiles.length) {
      setTimeout(() => showDashboardLoader(false), 1000); // hide loader if nothing to export
      alert("No pet profiles found.");
      return;
    }

    // Create hidden container for rendering
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0',
      width: '400px' // Fixed width for consistent cards
    });
    document.body.appendChild(container);

    // Prepare ZIP if needed
    const zip = asZip ? new JSZip() : null;
    let count = 0;

    for (const profile of profiles) {
      const emergency = profile.emergencyContacts?.[0] || {};
      const petCard = document.createElement('div');
      petCard.className = 'pet-card';
      petCard.style.animation = 'formEntrance 0.3s ease-out'; // Your animation

      petCard.innerHTML = `
        <div class="pet-header">
          <h3>${profile.petName || 'Unnamed Pet'}</h3>
          ${profile.petPhoto ? `<img src="${profile.petPhoto}" class="pet-photo" crossorigin="anonymous">` : ''}
        </div>
        <div class="pet-details">
          <!-- All your profile fields here -->
          <p><strong>Breed:</strong> ${profile.breed || 'N/A'}</p>
          <p><strong>Age:</strong> ${profile.age || 'N/A'}</p>
          <p><strong>Weight:</strong> ${profile.weight || 'N/A'}</p>
          <p><strong>Type:</strong> ${profile.type || 'N/A'}</p>
          <p><strong>Gender:</strong> ${profile.gender || 'N/A'}</p>
          <p><strong>Mood:</strong> ${profile.mood || 'N/A'}</p>
          <p><strong>Microchip:</strong> ${profile.microchip?.id || 'N/A'}</p>
          <p><strong>Allergies:</strong> ${profile.allergies || 'N/A'}</p>
          <p><strong>Medical History:</strong> ${profile.medicalHistory || 'N/A'}</p>
          <p><strong>Diet Plan:</strong> ${profile.dietPlan || 'N/A'}</p>
          <p><strong>Emergency:</strong> ${emergency.name || 'N/A'} (${emergency.relationship || 'N/A'}) - ${emergency.phone || 'N/A'}</p>
          <p><strong>Birthday Reminder:</strong> ${profile.reminders?.birthdayReminder || 'N/A'}</p>
          <p><strong>Vaccinations:</strong> ${profile.reminders?.vaccinations || 'N/A'}</p>
          <p><strong>Checkups:</strong> ${profile.reminders?.checkups || 'N/A'}</p>
          <p><strong>Grooming:</strong> ${profile.reminders?.grooming || 'N/A'}</p>
        </div>
      `;

      container.appendChild(petCard);

      // Wait for image load
      const img = petCard.querySelector('img');
      if (img && !img.complete) {
        await new Promise(res => img.onload = img.onerror = res);
      }

      // Capture card
      const canvas = await html2canvas(petCard, {
        backgroundColor: '#fff',
        scale: asZip ? 1.5 : 1.2, // Higher quality for ZIP
        useCORS: true,
        logging: true,
        onclone: (clonedDoc) => {
          clonedDoc.querySelector('.pet-card').style.boxShadow = 'none'; // Cleaner export
        }
      });

      if (asZip) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.9));
        const name = profile.petName?.replace(/[^\w]/g, '_') || `pet_${++count}`;
        zip.file(`${name}.png`, blob);
      } else {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `${profile.petName || 'Pet'}_Card.png`;
        link.click();
        await new Promise(res => setTimeout(res, 300)); // Throttle downloads
      }

      petCard.remove();
    }

    // Handle ZIP export
    if (asZip && zip) {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipURL = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipURL;
      link.download = 'PetCards_Export.zip';
      link.click();
      setTimeout(() => URL.revokeObjectURL(zipURL), 1000);
    }

    // show success message
    showDashboardLoader(false, "success-exporting"); // ✅ Successfully exported all pet cards
    // fallback is handled by helper in utils.js
      
  } catch (err) {
    console.error("Export error:", err);
    // Show loader overlay with paws animation and error message
    showDashboardLoader(false, "error-exporting"); // ❌ Exporting failed
   // fallback the same

  } finally {
    // ✅ safe now, container always exists (or is null)/so no undefined error
    if (container && container.parentNode) {
      container.remove();
    }
  }      
} // closes the function 

// Its Listener
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('exportAll-btn')) {
    console.log("📤 Export All button clicked"); // <-- Confirmation it was triggered
  if (typeof exportAllPetCards === 'function') {
       exportAllPetCards(true); // Force ZIP download
    } else {
      console.warn("❌ exportAllPetCards function is not defined.");
    }
  }
});


//============================================
// Invite Friends (UPDATED)
//============================================
async function inviteFriends(petId) {
  const profile = window.petProfiles.find(p => p.id === petId);
  if (!profile) {
    showErrorNotification("Pet data not loaded yet. Try again later.");
    return;
  }

  const inviteMessage = `Meet ${profile.petName || 'my pet'}! 🐾

I'm using this awesome app (Pet Health Tracker) to manage:
📋 Basic Information  
⏰ Reminders for Birthdays, Vaccinations, Checkups & Grooming  
🩺 Medical History  
🔎 Microchip Details  
📞 Emergency Contacts  
...and more!

Get the app: https://drkimogad.github.io/Pet-Health-Tracker/
📧 Contact developer: dr_kimogad@yahoo.com`;

  const shareData = {
    title: "Pet Profile",
    text: inviteMessage,
  };

  let successTimeoutId = null;

  try {
    if (navigator.share) {
      // Native sharing
      await navigator.share(shareData);
      
      // Set timeout for success notification
      successTimeoutId = setTimeout(() => {
        showSuccessNotification("✅ Shared successfully! 🎉");
      }, 1000); // Adjust as long as needed.
      
    } else {
      // Fallback: copy to clipboard - CANCEL any pending success notification
      if (successTimeoutId) {
        clearTimeout(successTimeoutId);
      }
      
      await navigator.clipboard.writeText(inviteMessage);
      showFallbackNotification("✅ Link copied to clipboard! 📋");

      // Show fallback container for clipboard copy
      showShareFallback(inviteMessage);
    }
  } catch (error) {
    // CANCEL any pending success notification on error
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
    }
    
    if (error.name !== 'AbortError') {
      console.error("Sharing failed:", error);
      showErrorNotification("❌ Couldn't share. Please try again.");
    } else {
      showInfoNotification("⚠️ Sharing aborted.");
    }
  }
}


// Helper for fallback sharing
function showShareFallback(inviteMessage) {
  const shareContainer = document.createElement('div');
  shareContainer.style.position = 'fixed';
  shareContainer.style.bottom = '20px';
  shareContainer.style.left = '10px';
  shareContainer.style.right = '10px';
  shareContainer.style.padding = '15px';
  shareContainer.style.background = 'white';
  shareContainer.style.borderRadius = '10px';
  shareContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  shareContainer.style.zIndex = '1000';
  
  shareContainer.innerHTML = `
    <p style="margin-top:0">Share this link:</p>
    <input type="text" value="${inviteMessage}" readonly 
           style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px">
    <button onclick="this.parentElement.remove()" 
            style="padding:8px 15px; background:#4CAF50; color:white; border:none; border-radius:4px">
      Done
    </button>
  `;
  
  document.body.appendChild(shareContainer);
  shareContainer.querySelector('input').select();
}


//=========================
// Join Pet Community - ENHANCED VERSION
//=========================
// 1. Create Community Chat Button with notification badge for admin
function createCommunityChatButton(profileId) {
  // 1. Input Validation (First line of defense)
  if (!profileId) {
    console.error('Cannot create chat button: Missing profileId');
    const errorSpan = document.createElement('span');
    errorSpan.textContent = 'Chat Unavailable';
    errorSpan.style.color = 'red';
    return errorSpan; // Return safe fallback element
  }
    
 console.log('Creating chat button for profile:', profileId);

    // Secondary validation
    if (!profileId) {
      console.warn('Click detected but profileId is missing!');
      alert('⚠️ Chat feature not available for this pet');
      return; // This is valid - exits the callback without returning a value
    }
    
  const chatBtn = document.createElement('button');
  chatBtn.className = 'communityChat-btn pulse-animation';
  chatBtn.dataset.petId = profileId;
  chatBtn.innerHTML = `<i class="fas fa-comments"></i> Community Chat`;
  
  // Add notification badge for admin (initially hidden)
  const badge = document.createElement('span');
  badge.className = 'notification-badge';
  badge.id = 'community-chat-notification';
  badge.style.display = 'none';
  chatBtn.appendChild(badge);
  
  // Check if user is admin and set up notification listener
  const user = firebase.auth().currentUser;
  if (user && user.email === 'drkimogad@gmail.com') { // Replace with your admin email check
    // Listen for pending messages
    setupAdminNotificationListener(profileId);
  }
  
  document.addEventListener('click', e => {
    if (e.target.closest('.communityChat-btn')) {
      const petId = e.target.closest('.communityChat-btn').dataset.petId;
      openCommunityChatModal(petId);
    }
  });
  
  return chatBtn;
}

// function getpetprofile NEW (before openCommunityChatWindow)
async function getPetProfile(petId) {
  if (firebase.auth().currentUser) {
    // Try Firestore first
    const doc = await firebase.firestore().collection('profiles').doc(petId).get();
    if (doc.exists) return doc.data();
  }
  
  // Fallback to localStorage
  const localProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  return localProfiles.find(p => p.id === petId) || {};
}


// 2. Setup admin notification listener
function setupAdminNotificationListener(petId) {
try {
  // Listen to the SINGLE DOCUMENT, not the collection
  firebase.firestore()
    .collection("Community_Chat")
    .doc("feedback_thread")  // ← ADD THIS LINE
    .onSnapshot(doc => {
      if (!doc.exists) return;
      
      const data = doc.data();
      const messages = Array.isArray(data.messages) ? data.messages : [];
      
      // Count unapproved messages
      const unapprovedCount = messages.filter(msg => 
        msg.approved === false && msg.type !== 'admin'
      ).length;

      const notificationBadge = document.getElementById('community-chat-notification');
      if (notificationBadge) {
        if (unapprovedCount > 0) {
          notificationBadge.textContent = unapprovedCount;
          notificationBadge.style.display = 'inline-block';
        } else {
          notificationBadge.style.display = 'none';
        }
      }
    });
 } catch (error) {
    console.error("Failed to setup notification listener:", error);
  } // closes try block
} // closes function

//======================≈=============================
// 3. MODIFIED: open chat window using SINGLE DOCUMENT approach
//==================================
async function openCommunityChatModal(petId) {
  const user = firebase.auth().currentUser;
if (!user) {
  showErrorNotification("You must be signed in to access community chat."); // ← REPLACE alert
  return;
}
    
  const pet = await getPetProfile(petId);
if (!pet) {
  showErrorNotification("Pet profile not found."); // ← REPLACE alert  
  return;
}    
    
  // Check if user is admin
  const isAdmin = user.email === 'drkimogad@gmail.com';

  // Remove existing modal
  const existingModal = document.getElementById('community-chat-modal');
  if (existingModal) existingModal.remove();

  // Build modal
  const modal = document.createElement('div');
  modal.id = 'community-chat-modal';
  modal.className = 'community-modal-overlay';
  modal.innerHTML = `
    <div class="community-modal-content">
      <button class="close-community-chat">&times;</button>
          <h1>Community Feedback</h1>
        <div class="chat-header">
      <div class="pet-name-header">💬 ${pet.petName || 'Pet'}</div>
            <div class="chat-controls">
        <button id="darkModeToggle" class="dark-mode-btn">🌙 Dark Mode</button>
        ${isAdmin ? '<button id="toggleViewBtn" class="view-toggle-btn">👁️ Show All Messages</button>' : ''}
      </div>
    </div>
      <div class="chat-messages" id="chatMessages">Loading messages...</div>
      <div class="chat-input-area">
        <textarea id="chatInput" placeholder="Share your feedback..."></textarea>
        <button id="sendChatBtn">Send Feedback</button>
      </div>
      <p id="chatStatus" class="chat-status"></p>
      <p class="daily-limit-note">Note: You can only submit one feedback per day.</p>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 50);

  // Dark Mode Logic (unchanged)
  const darkModeToggle = modal.querySelector('#darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.querySelector('.community-modal-content').classList.toggle('dark-mode');
      localStorage.setItem('chatDarkMode', 
        document.querySelector('.community-modal-content').classList.contains('dark-mode'));
    });
    if (localStorage.getItem('chatDarkMode') === 'true') {
      document.querySelector('.community-modal-content').classList.add('dark-mode');
    }
  }

    //GET THE SINGLE DOCUMENT CHAT REFERENCE
  const chatDocRef = firebase.firestore().collection("Community_Chat").doc("feedback_thread");

  // LOAD MESSAGES FROM SINGLE DOCUMENT
  function loadMessages() {
    const chatMessagesDiv = modal.querySelector('#chatMessages'); // moved up for defining it
      
    chatDocRef.onSnapshot(doc => {
        chatMessagesDiv.innerHTML = '<div class="loading">Loading messages...</div>'; // ← ADD LOADING STATE
      
        if (!doc.exists) {
        chatMessagesDiv.innerHTML = `<p class="no-messages">No feedback yet. Be the first to share!</p>`;
        return;
      }

      const data = doc.data();
      const messages = Array.isArray(data.messages) ? data.messages : []; 
        
        //FILTER MESSAGES BASED ON APPROVAL AND USER STATUS
      const visibleMessages = isAdmin ? messages : messages.filter(msg => msg.approved === true || msg.userId === user.uid);
        console.log("All messages:", messages);
        console.log("Visible messages:", visibleMessages); 
        console.log("Is admin?", isAdmin, "User ID:", user.uid);
        
        if (visibleMessages.length === 0) {
        chatMessagesDiv.innerHTML = `<p class="no-messages">No feedback yet. Be the first to share!</p>`;
        return;
      }

      chatMessagesDiv.innerHTML = '';
      visibleMessages.forEach((msg, index) => {
        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${msg.approved ? 'approved' : 'pending'}`;
        msgEl.dataset.msgIndex = index;
        
        // FORMAT MESSAGES BASED ON TYPE
        let messageHtml = '';
        if (msg.type === 'admin') {
            
          // ADMIN MESSAGE
          messageHtml = `
            <div class="message-header">
              <strong>${msg.userName || 'Admin'}</strong>
              <small>${msg.timestamp ? new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleString() : 'Date unavailable'}</small>
              ${isAdmin ? `<button class="delete-btn" title="Delete">🗑️</button>` : ''}
            </div>
            <p class="message-content admin-message">${msg.text}</p>
          `;
        } else {
          // USER MESSAGE
          const canDelete = msg.userId === user.uid && !msg.approved;
          
          messageHtml = `
            <div class="message-header">
              <strong>${msg.userName || 'User'}</strong>
              <small>${msg.timestamp ? new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleString() : 'Date unavailable'}</small>
              ${isAdmin ? `
                <div class="admin-controls">
                  ${!msg.approved ? `<button class="approve-btn" title="Approve">✓</button>` : ''}
                  <button class="delete-btn" title="Delete">🗑️</button>
                  <button class="reply-btn" title="Reply">↩️</button>
                </div>
              ` : canDelete ? `<button class="delete-btn" title="Delete">🗑️</button>` : ''}
            </div>
            <p class="message-content">${msg.text}</p>
            ${msg.approved ? `<div class="approved-badge">✓ Approved</div>` : `<div class="pending-badge">⏳ Pending Approval</div>`}
          `;
        }
        
        msgEl.innerHTML = messageHtml;
        chatMessagesDiv.appendChild(msgEl);
      });
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
          // 🆕 ADD ERROR HANDLER RIGHT HERE - AFTER THE CLOSING BRACE OF onSnapshot
  }, error => { // ← This goes AFTER your existing onSnapshot callback
    chatMessagesDiv.innerHTML = '<div class="error">Failed to load messages</div>';
    console.error("Chat load error:", error);
    });
  }

  // INITIAL LOAD
  loadMessages();
    
// ADD TOGGLE BUTTON LISTENER RIGHT HERE
if (isAdmin) {
  const toggleViewBtn = modal.querySelector('#toggleViewBtn');
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener('click', () => {
      loadMessages(); // Refresh to show all messages
      console.log("Admin: Toggling view to show all messages");
    });
  }
}

    //MESSAGE ACTIONS HANDLER FOR ARRAY MANIPULATION
  modal.querySelector('#chatMessages').addEventListener('click', async (e) => {
    const messageEl = e.target.closest('.chat-message');
    if (!messageEl) return;
    
    const msgIndex = parseInt(messageEl.dataset.msgIndex);
    const docSnap = await chatDocRef.get();
    
    if (!docSnap.exists) return;
    
    const data = docSnap.data();
    const messages = data.messages || [];
    const message = messages[msgIndex];
    
    // 🆕 ADD BOUNDS CHECK:
    if (msgIndex < 0 || msgIndex >= messages.length) {
     console.error("Invalid message index:", msgIndex);
     return;
    }

      

    // DELETE ACTION
    if (e.target.classList.contains('delete-btn')) {
      const canDelete = isAdmin || (message.userId === user.uid && !message.approved);
      
      if (canDelete && confirm("Delete this message permanently?")) {
        // Remove the message from the array
        await chatDocRef.update({
         messages: firebase.firestore.FieldValue.arrayRemove(message)
       });
          
      } else if (!canDelete) {
        alert("You can only delete your own messages before they are approved.");
      }
    }

      // APPROVE ACTION (admin only)
if (e.target.classList.contains('approve-btn') && isAdmin) {
  // Create a copy of the message with approved: true
  const approvedMessage = {
    ...message,          // Copy all existing properties
    approved: true       // Update only the approved status
  };
  
  // Remove the old message and add the approved one
  await chatDocRef.update({
    messages: firebase.firestore.FieldValue.arrayRemove(message)
  });
  
  await chatDocRef.update({
    messages: firebase.firestore.FieldValue.arrayUnion(approvedMessage)
  });
  
  // Ask if admin wants to reply immediately
  if (confirm("Message approved. Would you like to reply now?")) {
    const replyText = prompt(`Reply to ${message.userName}:`);
    if (replyText) {
      // Add admin reply to the messages array
      const adminReplyMessage = {
        id: "msg" + Date.now(),
        userId: user.uid,
        userName: "Admin",
        text: replyText,
        type: "admin",
        approved: true,
        timestamp: new Date()
      };
      await chatDocRef.update({
        messages: firebase.firestore.FieldValue.arrayUnion(adminReplyMessage)
      });
    }
  }
}
   

    // REPLY ACTION (admin only to approved messages)
    if (e.target.classList.contains('reply-btn') && isAdmin && message.approved) {
      const replyText = prompt(`Reply to ${message.userName}:`);
      if (replyText) {
        // Add admin reply to the messages array
        messages.push({
          id: "msg" + Date.now(),
          userId: user.uid,
          userName: "Admin",
          text: replyText,
          type: "admin",
          approved: true,
          timestamp: new Date()  // Client timestamp first
        });
        await chatDocRef.update({
        messages: firebase.firestore.FieldValue.arrayUnion(newMessage)
     });
      }
    }
  });

    // SEND LOGC WITH DAILY LIMIT CHECK FOR AN ARRAY APPROACH
  modal.querySelector('#sendChatBtn').addEventListener('click', async () => {
    const input = modal.querySelector('#chatInput');
    const status = modal.querySelector('#chatStatus');
    const messageText = input.value.trim();

    if (!messageText) {
      status.textContent = "⚠️ Feedback cannot be empty";
      status.style.color = "var(--error-color)";
      return;
    }

    // CHECK DAILY LIMIT
    // GET docSnap FIRST (before the admin check)
const docSnap = await chatDocRef.get();
const messages = docSnap.exists ? (Array.isArray(docSnap.data().messages) ? docSnap.data().messages : []) : [];

// CHECK DAILY LIMIT - SKIP FOR ADMIN
if (!isAdmin) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
    
  const userMessagesToday = messages.filter(msg => {
    return msg.userId === user.uid && 
           msg.timestamp && 
           msg.timestamp && (msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)) >= today
  });

  if (userMessagesToday.length > 0) {
    status.textContent = "❌ You can only submit one feedback per day";
    status.style.color = "var(--error-color)";
    return;
  }
}
    status.textContent = "Sending...";
    status.style.color = "var(--text-color)";

    try {
      // CREATE NEW MESSAGES
      const newMessage = {
        id: "msg" + Date.now(),
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        text: messageText,
        type: "user",
        approved: isAdmin ? true : false,  // Auto-approve if admin
        timestamp: new Date()  // Use client-side timestamp temporarily
      };

      // ADD TO MESSAGE ARRAY IN A SINGLE DOCUMENT
      if (docSnap.exists) {
       await chatDocRef.update({
       messages: firebase.firestore.FieldValue.arrayUnion(newMessage)
      });
     } else {
     await chatDocRef.set({
      messages: [newMessage],
     petId: petId
    });
     }
        
      input.value = '';
      status.textContent = "✓ Sent for approval!";
      status.style.color = "var(--secondary-color)";
    } catch (err) {
      status.textContent = `❌ Error: ${err.message}`;
      status.style.color = "var(--error-color)";
    }
  });

  // CLOSE HANDLER
  modal.querySelector('.close-community-chat').addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  });
}



//=======================================================
//  QR CODE GENERATION BUTTON FUNCTION 
//=================================================
  // Helper to escape special chars
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/`/g, "&#096;");      
 }
 // QR FUNCTION 
async function generateQRCode(petId) {
  try {
      
    // 1. Load profile data
    const profiles = await loadPets();
    const profile = profiles.find(p => p.id === petId);
    if (!profile) {
    showErrorNotification("❌ Profile not found!");
    return;
    }

    // 2. Get emergency contact
    const emergency = profile.emergencyContacts?.[0] || {};

    // 3. Create sanitized filename
    const safePetName = (profile.petName || 'PetProfile').replace(/[^a-z0-9]/gi, '_');

    // 4. Open optimized window
    const qrWindow = window.open('', 'PetQR_' + petId, 'width=500,height=700');
    if (!qrWindow) {
   showErrorNotification("❌ Please allow popups to generate QR codes");
    return;
    }
      
// 5. Create reminders html outside 
     const remindersHTML = `
  <p><strong>Birthday Reminder:</strong> ${escapeHTML(profile.reminders?.birthdayReminder|| 'N/A')}</p> 
  <p><strong>Vaccinations:</strong> ${escapeHTML(profile.reminders?.vaccinations || 'N/A')}</p>
  <p><strong>Checkups:</strong> ${escapeHTML(profile.reminders?.checkups || 'N/A')}</p>
  <p><strong>Grooming:</strong> ${escapeHTML(profile.reminders?.grooming || 'N/A')}</p>
`;     
// 6. Build the QR message (YOUR ORIGINAL TEXT FORMAT)
const qrMessage = `📋 Meet ${profile.petName || 'a lovely pet'}!

Breed: ${profile.breed || 'N/A'}
Age: ${profile.age || 'N/A'}
Weight: ${profile.weight || 'N/A'}
Type: ${profile.type || 'N/A'}
Gender: ${profile.gender || 'N/A'}
Mood: ${profile.mood || 'N/A'}
Microchip: ${profile.microchip?.id || 'N/A'}
Allergies: ${profile.allergies || 'None'}
Medical History: ${profile.medicalHistory || 'N/A'}
Diet Plan: ${profile.dietPlan || 'N/A'}

Emergency Contact: ${emergency.name || 'N/A'} ${emergency.relationship ? '(' + emergency.relationship + ')' : ''} ${emergency.phone ? '- ' + emergency.phone : ''}

Birthday Reminder: ${profile.reminders?.birthdayReminder || 'N/A'}
Vaccinations: ${profile.reminders?.vaccinations || 'N/A'}
Checkups: ${profile.reminders?.checkups || 'N/A'}
Grooming: ${profile.reminders?.grooming || 'N/A'}

👉 Go to the app: https://drkimogad.github.io/Pet-Health-Tracker/
📧 Contact developer: Petkit2023@gmail.com
`.trim();

    // 6. Build the layout with all enhancements
    qrWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${safePetName} - Pet Profile</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
          <style>
            body { 
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 500px;
              margin: 0 auto;
            }
            .pet-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .pet-photo {
              max-width: 150px;
              max-height: 150px;
              border-radius: 8px;
              margin: 10px auto;
              display: block;
            }
            .pet-details {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .pet-details p {
              margin: 8px 0;
            }
            #qrcode {
              margin: 20px auto;
              text-align: center;
            }
            .share-link {
              word-break: break-all;
              margin: 20px 0;
              padding: 10px;
              background: #f0f0f0;
              border-radius: 4px;
            }
            .actions {
              text-align: center;
              margin-top: 20px;
            }
            button {
              padding: 10px 15px;
              margin: 0 5px;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            .developer-info {
              margin-top: 20px;
              font-size: 0.9em;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="pet-header">
            <h3>${profile.petName || 'Unnamed Pet'}</h3>
            ${profile.petPhoto ? `<img src="${profile.petPhoto}" class="pet-photo" crossorigin="anonymous">` : ''}
          </div>

          <div class="pet-details">
            <p><strong>Breed:</strong> ${profile.breed || 'N/A'}</p>
            <p><strong>Age:</strong> ${profile.age || 'N/A'}</p>
            <p><strong>Weight:</strong> ${profile.weight || 'N/A'}</p>
            ${profile.type ? `<p><strong>Type:</strong> ${profile.type}</p>` : ''}
            ${profile.gender ? `<p><strong>Gender:</strong> ${profile.gender}</p>` : ''}
            ${profile.mood ? `<p><strong>Mood:</strong> ${profile.mood}</p>` : ''}
            ${profile.microchip?.id ? `<p><strong>Microchip:</strong> ${profile.microchip.id}</p>` : ''}
            ${profile.allergies ? `<p><strong>Allergies:</strong> ${profile.allergies}</p>` : ''}
            ${profile.medicalHistory ? `<p><strong>Medical History:</strong> ${profile.medicalHistory}</p>` : ''}
            ${profile.dietPlan ? `<p><strong>Diet Plan:</strong> ${profile.dietPlan}</p>` : ''}
            ${(emergency.name || emergency.phone) ? `
              <p><strong>Emergency Contact:</strong> 
                ${emergency.name || ''} 
                ${emergency.relationship ? `(${emergency.relationship})` : ''}
                ${emergency.phone ? `- ${emergency.phone}` : ''}
              </p>
            ` : ''}
            
             ${remindersHTML}
          </div>

          <!-- NEW: Developer Info Section -->
          <div class="developer-info">
            <p><strong>👉 Go to the app:</strong> <a href="https://drkimogad.github.io/Pet-Health-Tracker/" target="_blank">https://drkimogad.github.io/Pet-Health-Tracker/</a></p>
            <p><strong>📧 Contact developer:</strong> Petkit2023@gmail.com</p>
          </div>

          <div id="qrcode"></div>

          <!-- MODIFIED: Static Share Link -->
          <div class="share-link">
            <p><strong>Access full profile:</strong></p>
            <p>
              <a href="https://drkimogad.github.io/Pet-Health-Tracker/" target="_blank">
                https://drkimogad.github.io/Pet-Health-Tracker/
              </a>
            </p>
          </div>

          <div class="actions">
            <button onclick="window.print()">Print Form</button>
            <button onclick="downloadQR()">Download QR</button>
          </div>

<script>
  (function() {
    // 1. Safely extract profile data (with proper escaping)
    const petName = '${profile.petName ? profile.petName.replace(/'/g, "\\'") : "Unnamed Pet"}';
    const breed = '${profile.breed ? profile.breed.replace(/'/g, "\\'") : "N/A"}';
    const age = '${profile.age || "N/A"}';
    const microchip = '${profile.microchip?.id || "N/A"}';
    const medical = '${profile.medicalHistory ? profile.medicalHistory.substring(0, 50).replace(/'/g, "\\'") : "N/A"}';
    const emergencyName = '${emergency.name ? emergency.name.replace(/'/g, "\\'") : "N/A"}';
    const emergencyRelationship = '${emergency.relationship ? emergency.relationship.replace(/'/g, "\\'") : ""}';
    const emergencyPhone = '${emergency.phone || ""}';

    // 2. Generate QR when library loads
    function generateQR() {
      try {        
        new QRCode(document.getElementById("qrcode"), {
          text: "PET CARD\\nName: " + petName + 
                "\\nBreed: " + breed + 
                "\\nAge: " + age + 
                "\\nMicrochip: " + microchip + 
                "\\nMedical: " + medical + 
                "\\nEmergency: " + emergencyName + " " + emergencyPhone + 
                "\\n\\nFull Profile: https://drkimogad.github.io/Pet-Health-Tracker/",
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (e) {
        document.getElementById("qrcode").innerHTML = '<p>Scan full profile online</p>';
      }
    }

    // 3. Load library safely
    if (typeof QRCode === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.onload = generateQR;
      document.body.appendChild(script);
    } else {
      generateQR();
    }
    
    // 4. Keep original download function
    window.downloadQR = function() {
      const canvas = document.querySelector("#qrcode canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.download = '${safePetName}_QR.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };
  })();
</script>
        </body>
      </html>
    `);
      
    qrWindow.document.close();
    showSuccessNotification("✅ QR Code generated successfully!");

  } catch (error) {
    console.error("QR generation failed:", error);
showErrorNotification("❌ Failed to generate QR code. Please try again.")
  }
} 


// ======== EVENT DELEGATION (FIXED) ========
// ✅ Keep this block to handle profile actions (WIRING) ALL THE BUTTONS IN LOADSAVEDPETPROFILES FUNCTION✅
DOM.savedProfilesList?.addEventListener('click', (e) => {
  const btn = e.target?.closest('button');
  if (!btn) return;
  
  const petId = btn.dataset.petId;
  if (!petId) return;

  // Unified indentation and brace style
  if (btn.classList.contains('edit-btn')) {
    editPetProfile(petId);
  }
  else if (btn.classList.contains('delete-btn')) {
    if (confirm('Delete this profile?')) deletePetProfile(petId);
  }
  else if (btn.classList.contains('details-btn')) {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const profile = profiles.find(p => p.id === petId);
    if (profile) showPetDetails(profile);
    else showErrorToUser('Profile not found');
  }
  else if (btn.classList.contains('inviteFriends-btn')) {
    inviteFriends(petId);
  }
  else if (btn.classList.contains('qr-btn')) {
    generateQRCode(petId);
  }
});
    
// Add this to catch handled errors 
window.onerror = (msg, url, line) => {
  alert(`Error: ${msg}\nLine: ${line}`);
  return true; // Prevent default error logging
};

// ✅  Reminders delete button listener
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('deleteReminderButton')) {
    const profileIndex = e.target.dataset.profileIndex;
    const reminderKey = e.target.dataset.reminder;

    if (profileIndex !== undefined && reminderKey) {
      deleteReminder(profileIndex, reminderKey);
    }
  }
});

// ======================    
// INITIALIZE DASHBOARD PRODUCTION READY
// ======================    
function initializeDashboard() {
  console.log("⚙️ Running initializeDashboard()");
  
  // ======================    
  // FORM SUBMISSION MOVED INSIDE INITIALIZEDASHBOARD FUNCTION 
  // ======================
  DOM.petList.addEventListener('submit', async (e) => {
    e.preventDefault();

/*✅ The corrected mental model
Think of the function like this:
showDashboardLoader(true, "xxx") → “start operation” (overlay + spinner + message).
showDashboardLoader(false, "success-xxx") → “stop operation but show success message briefly”.
showDashboardLoader(false, "error-xxx") → “stop operation but show error message briefly”.*/      
// ✅ Show dashboard loader immediately with correct initial message
  if (editingProfileId !== null) {
    showDashboardLoader(true, "updating"); // Editing an existing profile
  } else {
    showDashboardLoader(true, "saving");   // Creating a new profile
  }
    try {
      // Get all form data (preserving your existing structure)
      // 🔑 Generate ID once
      const newId = editingProfileId || generateUniqueId();

      // 🐶 Full petData object
      const petData = {
        id: newId,
        ownerId: firebase.auth().currentUser?.uid || 'local-user',
        lastUpdated: Date.now(),
        createdAt: Date.now(),
        shareableUrl: `https://${window.location.hostname}/view.html?petId=${newId}`,
        
        // 🔁 Rest of your form fields here (no changes needed)
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
          birthdayReminder: DOM.birthdayReminder?.value,
          vaccinations: DOM.vaccinationsAndDewormingReminder?.value,
          checkups: DOM.medicalCheckupsReminder?.value,
          grooming: DOM.groomingReminder?.value
        }
      };

      // photo handling/Cloudinary section     
      const fileInput = DOM.petPhotoInput;
          
      // ✅ If editing and NO new image, reuse existing photo
      if (editingProfileId !== null && !fileInput.files[0]) {
        const existingProfiles = await loadPets(); // 🔄 Always get latest profiles
        const existingProfile = existingProfiles.find(p => p.id === newId); 
          
        if (existingProfile && existingProfile.petPhoto) {
          petData.petPhoto = existingProfile.petPhoto;
          
          // 🔸 SURGICAL ADDITION: ensure cloudinaryPath is copied
          petData.cloudinaryPath = existingProfile.cloudinaryPath || '';
          petData.imageDimensions = existingProfile.imageDimensions || {};

          // 🔸 NEW SURGICAL ADDITION: save public_id for delete function
          // (This is exactly what your Cloud Function will look for)
          petData.public_id = existingProfile.cloudinaryPath || '';
        }
      }

      // 2️⃣ In the new image uploaded
      if (fileInput.files[0]) {
        try {
          const uploadResult = await uploadToCloudinary(
            fileInput.files[0],
            firebase.auth().currentUser.uid,
            petData.id
          );

          petData.petPhoto = uploadResult.url.replace(/^http:\/\//, 'https://');
          
          // 🔸 SURGICAL ADDITION: save Cloudinary path for deletion later  
          petData.cloudinaryPath = uploadResult.public_id;   // existing usage
          petData.public_id = uploadResult.public_id;        // ✅ NEW: add public_id explicitly
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
      
// AFTER SAVING IN LOCALSTORAGE AND FIRESTORE
await new Promise(r => setTimeout(r, 2000)); //✅️ adjust this for faster or slower saving or updating display 

// Update UI immediately
requestAnimationFrame(() => {
  DOM.petList.classList.add("hidden");
  DOM.savedProfilesList.classList.remove("hidden");
  loadSavedPetProfile();
  resetForm();
  editingProfileId = null;
});
        
//✅️ loader success call
if (editingProfileId !== null) {
  showDashboardLoader(false, "success-updating"); // hides loader+keeping message visible
} else {
  showDashboardLoader(false, "success-saving");
}
// No need for extra fallback here — helper now handles:        
        
// the catch must stay as it is closing the try
} catch (error) {
  console.error("❌ Error saving profile:", error);
        
  // ✅ Distinguish error between saving vs updating
  if (editingProfileId !== null) {
    showDashboardLoader(false, "error-updating");
  } else {
    showDashboardLoader(false, "error-saving");
  }
// No need for extra fallback here — helper now handles:        
 }
}); // closes the DOM.petList.addEventListener

  // REST OF INITIALIZE DASHBOARD FUNCTION  
  if (DOM.addPetProfileBtn) {
    console.log("✅ addPetProfileBtn found:", DOM.addPetProfileBtn);
    DOM.addPetProfileBtn.addEventListener('click', () => {
      console.log("🟢 New Profile button clicked");
      openCreateForm(); // 🔁 REPLACED all manual toggling
    });
  } else {
    console.warn("⛔ addPetProfileBtn not found in DOM");
  }
} // closes the function

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
    

  safeSetValue('birthdayReminder', originalProfile.birthdayReminder);
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
