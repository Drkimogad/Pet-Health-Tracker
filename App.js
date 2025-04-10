import { setupNotifications, sendPushNotification } from './pushNotifications.js';
// ======== FIREBASE INITIALIZATION ========
const firebaseConfig = {
  apiKey: "AIzaSyBIej7yNj0LkkLd6VtQxBL4mEDSsHLJvig",
  projectId: "pet-health-tracker-7164d",
  appId: "pet-health-tracker-7164d"
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
                data-reminder="${reminderKey}">
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
    savedProfilesList.appendChild(petCard);

    const reminders = {
      vaccinationDue: profile.vaccinationsAndDewormingReminder,
      checkupDue: profile.medicalCheckupsReminder,
      groomingDue: profile.groomingReminder
    };
    highlightReminders(reminders, index);
  });
}

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

function deletePetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  if (index >= 0 && index < savedProfiles.length) {
    savedProfiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
  }
}

// ======== MAIN INITIALIZATION ========
document.addEventListener('DOMContentLoaded', () => {
  // Authentication Section
  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('mainContent');
  const logoutButton = document.getElementById('logoutButton');
  const petPhotoInput = document.getElementById('petPhoto');
  const petPhotoPreview = document.getElementById('petPhotoPreview');

  // Image Preview Handler
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

  // Auth State Handler
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      if (authSection) authSection.style.display = 'none';
      if (mainContent) mainContent.style.display = 'block';
      if (logoutButton) logoutButton.style.display = 'block';

      try {
        await setupNotifications();
        await loadSavedPetProfile();
      } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize app features');
      }
    } else {
      if (authSection) authSection.style.display = 'block';
      if (mainContent) mainContent.style.display = 'none';
      if (logoutButton) logoutButton.style.display = 'none';
      switchAuthForm('login');
    }
  });

  // Form Submissions
  document.getElementById('dietForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
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
      savedProfiles[editingProfileIndex] = formData;
      editingProfileIndex = null;
    } else {
      savedProfiles.push(formData);
    }
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
    resetForm();
  });

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

  // Auth Handlers
  document.getElementById('signUpForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signUpEmail')?.value;
    const password = document.getElementById('signUpPassword')?.value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => alert('Account created! Please login.'))
      .catch(error => alert(`Signup failed: ${error.message}`));
  });

  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    auth.signInWithEmailAndPassword(email, password)
      .catch(error => alert(`Login failed: ${error.message}`));
  });

  document.getElementById('logoutButton')?.addEventListener('click', () => {
    auth.signOut().then(() => alert('Logged out successfully!'));
  });

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.error('SW registration failed:', err));
  }
});

// Initial UI Setup
addSafeListener('showLogin', (e) => {
  e.preventDefault();
  switchAuthForm('login');
});

addSafeListener('showSignUp', (e) => {
  e.preventDefault();
  switchAuthForm('signUp');
});
