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
  groomingReminder: document.getElementById('groomingReminder')

  // Modal Elements (used in showModal())
  //petModal: document.getElementById('pet-modal') || null, // Optional fallback
  //modalOverlay: document.getElementById('modal-overlay') || null
    
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
              <button class="edit-btn" data-pet-id="${profile.id}">Edit</button>
              <button class="delete-btn" data-pet-id="${profile.id}">Delete</button>
              <button class="details-btn" data-pet-id="${profile.id}">Details</button>
              <button id="exportAll-btn" class="exportAll-btn">📤 Export All Cards</button>
              <button class="qr-btn" data-pet-id="${profile.id}">Qr</button>
              <button class="inviteFriends-btn" data-pet-id="${profile.id}">Invite Friends</button>
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
      <button class="print-card-btn">🖨 Print Card</button>
      <button class="share-card-btn">📤 Share Card</button>
      <button class="close-btn" onclick="hideModal()">Close</button>
    </div>
  `;

  // ✅ Inject modal into DOM
  showModal(detailsHtml);
    
// ✅ SAFELY Attach Modal logics only after modal content is rendered
setTimeout(() => {
  const modal = document.querySelector('.modal-content');
  const photo = modal.querySelector('.detail-photo');
  const actions = modal.querySelector('.modal-actions');

  if (!modal || !actions) return;

  const hideButtonsTemporarily = () => {
    actions.style.visibility = 'hidden';
    actions.style.position = 'absolute';
  };

  const restoreButtons = () => {
    actions.style.visibility = '';
    actions.style.position = '';
  };

  const waitForImage = () =>
    new Promise((resolve) => {
      if (!photo || photo.complete) return resolve();
      photo.onload = () => resolve();
      photo.onerror = () => resolve();
    });

  // ========== 💾 SAVE CARD (UPDATED) ========== //
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('save-card-btn')) {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;

    const modalActions = modalContent.querySelector('.modal-actions');
    const petImg = modalContent.querySelector('img');
    const heading = modalContent.querySelector('h3');

    // ✅ Temporarily hide action buttons
    if (modalActions) modalActions.style.display = 'none';

    // ✅ Wait for pet photo to load
    if (petImg && !petImg.complete) {
      await new Promise((resolve) => {
        petImg.onload = petImg.onerror = resolve;
      });
    }

    // ✅ Optional: scroll heading into view
    if (heading) heading.scrollIntoView({ block: 'start' });

    // ✅ Temporary visual border for spacing check
    const originalBorder = modalContent.style.border;
    modalContent.style.border = '3px solid #4e348c'; // 👈 change here if needed

    try {
      const canvas = await html2canvas(modalContent, {
        backgroundColor: '#fff',
        scale: 1,
        scrollY: 0,
        useCORS: true
      });

      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'PetCard.png';
      link.click();
    } catch (err) {
      console.error('🛑 Failed to save card:', err);
      alert('Failed to generate image.');
    } finally {
      modalContent.style.border = originalBorder;
      if (modalActions) modalActions.style.display = '';
    }
  }
});

// 📤 Share Card (Fully Fixed)
const shareBtn = modal.querySelector('.share-card-btn');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    // 1. Create loader OUTSIDE modal
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.id = 'share-loader';
    Object.assign(loader.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '9999'
    });
    document.body.appendChild(loader);

    // 2. Freeze modal state
    const originalModalStyle = {
      pointerEvents: modal.style.pointerEvents,
      transition: modal.style.transition
    };
    modal.style.pointerEvents = 'none';
    modal.style.transition = 'none';
      
 try {   // added
    // 3. Ensure image is ready
    await waitForImage();
    hideButtonsTemporarily();
     
    // 4. Hide loader with 1-frame delay
      loader.style.opacity = '0';
      await new Promise(r => requestAnimationFrame(r));

      // 5. Capture with safety checks
      const canvas = await html2canvas(modal, {
        backgroundColor: '#fff',
        useCORS: true,
        scale: 1,
        scrollY: 0,
        windowWidth: modal.scrollWidth,
        windowHeight: modal.scrollHeight,
        logging: true,
        ignoreElements: (el) => el.id === 'share-loader',
          
        onclone: (clonedDoc) => {
       const clonedModal = clonedDoc.querySelector('.modal-content');
       if (clonedModal) {
       clonedModal.style.overflow = 'visible';
        }
       }
      });

      // 6. Quality/type adjustments
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 0.92);
      });
      if (!blob) throw new Error("Canvas conversion failed");

      // 7. Share with metadata
      const file = new File([blob], 
        `PetCard_${profile.petName || 'profile'}_${Date.now()}.png`, 
        { type: 'image/png' }
      );

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
        title: `${profile.petName || 'Pet'} Profile`,
        text: `Check out this pet profile below.

        Name: ${profile.petName || 'N/A'}
        Breed: ${profile.breed || 'N/A'}
        Age: ${profile.age || 'N/A'}

       🐾 Shared from Pet Health Tracker:
        https://drkimogad.github.io/Pet-Health-Tracker/`,
       files: [file]
      });
      } else {
        // Fallback download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }        
    } catch (err) {
      if (!err.message.includes('cancel')) {
        console.error("Share failed:", err);
        alert(`Share failed: ${err.message}`);
      }
    } finally {
      // 8. Cleanup
      loader.remove();
      modal.style.pointerEvents = originalModalStyle.pointerEvents;
      modal.style.transition = originalModalStyle.transition;
      restoreButtons();
    }
  });
}

// 🖨 Print Card (Optimized)
const printBtn = modal.querySelector('.print-card-btn');
if (printBtn) {
  printBtn.addEventListener('click', async () => {
    try {
      await waitForImage();
      hideButtonsTemporarily();

      // 🔁 Optional: create a cleaner version if you want to strip interactive elements
      const cloned = modal.cloneNode(true);
      cloned.classList.add('print-clone');
      cloned.style.visibility = 'hidden';
      document.body.appendChild(cloned);

      // 🔁 Wait for any images inside clone
      await Promise.all(Array.from(cloned.querySelectorAll('img')).map(img => {
        return img.complete ? Promise.resolve() : new Promise(res => {
          img.onload = img.onerror = res;
        });
      }));

      // ✅ Build printable HTML
      const printStyles = `
        <style>
          @media print {
            body { margin: 0; padding: 0; font-family: Arial; }
            .modal-actions, .close-modal { display: none !important; }
            img { max-width: 100%; height: auto; }
            .print-clone { box-shadow: none !important; border: none !important; }
          }
        </style>
      `;

      const printDoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${profile.petName || 'Pet Profile'}</title>
            ${printStyles}
          </head>
          <body>
            ${cloned.innerHTML}
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = () => window.close();
                }, 300);
              }
            </script>
          </body>
        </html>
      `;

      const printWin = window.open('', '_blank');
      if (!printWin) throw new Error("Popup blocked. Allow popups to print.");

      printWin.document.write(printDoc);
      printWin.document.close();

    } catch (err) {
      console.error("Print error:", err);
      alert("Something went wrong while printing.");
    } finally {
      restoreButtons();
    }
  }); // closes evenlistner
} // closes if print
}, 50); // ✅ THIS WAS MISSING - closes setTimeout
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
// FUNCTION DELETE PROFILE (UPDATED FOR HYBRID STORAGE) PRODUCTION READY EXCEPT CLOUDINARY
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
// exportAllPetCards button functionality PRODUCTION READY
//======================================
/**
 * Unified Pet Card Export Function
 * @param {boolean} asZip - Set true to export as ZIP, false for individual downloads
 */
async function exportAllPetCards(asZip = false) {
  const loader = document.createElement('div');
  loader.className = 'loader';
  document.body.appendChild(loader);

  try {
    const profiles = await loadPets();
    if (!profiles.length) {
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

    alert(`✅ Successfully exported ${profiles.length} cards${asZip ? ' as ZIP' : ''}!`);
  } catch (err) {
    console.error("Export error:", err);
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = `Export failed: ${err.message}`;
    errorEl.style.display = 'block';
    loader.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 3000);
  } finally {
    loader.remove();
    container?.remove();
  }
}
// Usage examples:
// exportPetCards();       // Individual downloads
// exportPetCards(true);   // ZIP download
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
// Invite Friends ()
//===========================================
function inviteFriends() {
  const appLink = "https://drkimogad.github.io/Pet-Health-Tracker/";
  const inviteMessage = `🐶 Looking for a smarter way to care for your pet?

  🦴 Manage health records, reminders, emergency info, and more — all in one place!

  📲 Try the Pet Health Tracker app and create your pet's profile today:
  ${appLink}`;
    
  const shareData = {
    title: "Invite to Pet Health Tracker app",
    text: inviteMessage,
    url: appLink
  };

  // ✅ Use Web Share API if available
  if (navigator.share) {
    navigator.share(shareData)
      .then(() => console.log("✅ Invite shared successfully"))
      .catch((err) => console.warn("❌ Share canceled or failed", err));
  } else {
    // ❌ Fallback: Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteMessage)
        .then(() => alert("📋 Invite link copied. Share it with your friends!"))
        .catch(() => prompt("Copy this invite link:", inviteMessage));
    } else {
      prompt("Copy this invite message:", inviteMessage);
    }
  }
}
//=========================
// Join Pet Community ()
//============================
// Create Community Chat Button (add this to your button generation logic)
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
    
  const chatBtn = document.createElement('button');
  chatBtn.className = 'communityChat-btn pulse-animation';
  chatBtn.dataset.petId = profileId;
  chatBtn.innerHTML = `
    <i class="fas fa-comments"></i> Community Chat
  `;
    
  // 2. SAFE EVENT LISTENER  
  chatBtn.addEventListener('click', (e) => {
  console.log("Chat button clicked for profile:", profileId); // Debug line     
  e.stopPropagation(); // Prevent event bubbling
      
// Secondary validation
    if (!profileId) {
      console.warn('Click detected but profileId is missing!');
      alert('⚠️ Chat feature not available for this pet');
      return; // This is valid - exits the callback without returning a value
    }
      
 try {
      openCommunityChatWindow(profileId);
    } catch (err) {
      console.error('Chat failed to open:', err);
      alert('Failed to open chat. Please try again.');
    }
  });
    
  return chatBtn; // This returns the button element from the main function
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
//=========================
// Join Pet Community
//=========================
// 1. Create Community Chat Button (add this to your button generation logic)
function createCommunityChatButton(profileId) {
  const chatBtn = document.createElement('button');
  chatBtn.className = 'communityChat-btn pulse-animation';
  chatBtn.dataset.petId = profileId;
  chatBtn.innerHTML = `<i class="fas fa-comments"></i> Community Chat`;
  
  chatBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openCommunityChatWindow(profileId); // Use profileId from parameter, not profile.id
  });
  return chatBtn; // Moved inside function
}
    
// 2.function getpetprofile NEW (before openCommunityChatWindow)
async function getPetProfile(petId) {
        // Try Firestore first
  if (firebase.auth().currentUser) {
    const doc = await firebase.firestore().collection('profiles').doc(petId).get();
    if (doc.exists) return doc.data();
  }
    // Fallback to localStorage
  const localProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  return localProfiles.find(p => p.id === petId) || {};
}
//3.open chat window
async function openCommunityChatWindow(petId) {
  const firebaseConfig = {
    apiKey: "AIzaSyAy2ObF1WWPurBa3TZ_AbBb00o80ZmlLAo",
    authDomain: "pet-health-tracker-4ec31.firebaseapp.com",
    projectId: "pet-health-tracker-4ec31",
    storageBucket: "pet-health-tracker-4ec31.firebasestorage.app",
    messagingSenderId: "123508617321",
    appId: "1:123508617321:web:6abb04f74ce73d7d4232f8",
    measurementId: "G-7YDDLF95KR"
  };

  const pet = await getPetProfile(petId);
  const user = firebase.auth().currentUser;

  const chatWindow = window.open('', `CommunityChat_${petId}`, 
    'width=500,height=700,top=100,left=100');

  if (!chatWindow) {
    alert("Please allow popups for Community Chat");
    return;
  }

  chatWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Community Chat - ${pet.petName || 'Pet'}</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .chat-container { max-width: 100%; margin: 0 auto; }
        textarea { width: 100%; padding: 12px; margin-bottom: 10px; }
        button { background: #4285f4; color: white; border: none; padding: 12px 20px; cursor: pointer; }
        #status { margin-top: 10px; }
      </style>
      <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js"></script>
    </head>
    <body>
      <div class="chat-container">
        <h2><i class="fas fa-comments"></i> Community Chat</h2>
        <div class="pet-context">
          <p>Discussing: <strong>${pet.petName || 'Unnamed Pet'}</strong></p>
        </div>
        <textarea id="messageInput" placeholder="Ask questions or share tips..." rows="5"></textarea>
        <button id="sendBtn"><i class="fas fa-paper-plane"></i> Post Message</button>
        <p id="status"></p>
      </div>
      <script>
        firebase.initializeApp(${JSON.stringify(firebaseConfig)});
        
        document.getElementById('sendBtn').addEventListener('click', async () => {
          const message = document.getElementById('messageInput').value.trim();
          const statusEl = document.getElementById('status');
          
          if (!message) {
            statusEl.textContent = "Please enter a message";
            statusEl.style.color = "red";
            return;
          }
          
          try {
            statusEl.textContent = "Posting...";
            statusEl.style.color = "gray";
            
            await firebase.firestore().collection('Community_Chat').add({
              petId: "${petId}",
              petName: "${pet.petName || ''}",
              userId: "${user?.uid || 'anonymous'}",
              userEmail: "${user?.email || 'anonymous'}",
              message: message,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              status: "unread"
            });
            
            statusEl.textContent = "✓ Posted to community!";
            statusEl.style.color = "green";
            document.getElementById('messageInput').value = "";
          } catch (err) {
            statusEl.textContent = "Error: " + err.message;
            statusEl.style.color = "red";
          }
        });
      </script>
    </body>
    </html>
  `);
}
//=======================================================
//  QR CODE GENERATION BUTTON FUNCTION 
//=================================================
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
// ==== AUTO LOGOUT AFTER INACTIVITY ====PRODUCTION READY
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
else if (btn.classList.contains('inviteFriends-btn')) {
  if (petId) inviteFriends();
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
// ITIALIZE DASHBOARD PRODUCTION READY
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
