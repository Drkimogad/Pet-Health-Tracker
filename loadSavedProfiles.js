// ======== 6. LOAD SAVED PET PROFILES ========

// Reminders validation function
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

// Reminder formatting function
function formatReminder(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}

// Load saved pet profiles function
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
            ${profile.petPhoto ? `<img src="${profile.petPhoto}" onload="this.style.display='block'" onerror="this.style.display='none'" class="pet-photo">` : ''}
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
            <p>Vaccinations/Deworming: ${formatReminder(profile.vaccinationDue)}</p> 
            <p>Medical Check-ups: ${formatReminder(profile.checkupDue)}</p>
            <p>Grooming: ${formatReminder(profile.groomingDue)}</p>
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

      // Highlight reminders
      const reminders = {
        vaccinationDue: profile.vaccinationDue,  
        checkupDue: profile.checkupDue,          
        groomingDue: profile.groomingDue         
      };
      highlightReminders(reminders, index);
    });
  }
}

// Highlight overdue and upcoming reminders
const reminderFields = {
  vaccinationDue: 'Vaccinations/Deworming',  
  checkupDue: 'Medical Check-ups',             
  groomingDue: 'Grooming'                     
};

// Update reminder labels and highlight them
function highlightReminders(reminders, index) {
  const today = new Date();
  const overdueContainer = document.getElementById(`overdueReminders-${index}`);
  const upcomingContainer = document.getElementById(`upcomingReminders-${index}`);

  overdueContainer.innerHTML = '';
  upcomingContainer.innerHTML = '';

  Object.entries(reminders).forEach(([reminderKey, reminderValue]) => {
    if (!reminderValue) return;

    // Parse ISO string to Date
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

// Delete overdue reminders
function deleteOverdueReminder(profileIndex, reminderKey) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[profileIndex];
  
  profile[reminderKey] = null;  
  
  localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
  loadSavedPetProfile();
}

// Export functions for use in other files
export { loadSavedPetProfile, validateReminder, highlightReminders, deleteOverdueReminder };
