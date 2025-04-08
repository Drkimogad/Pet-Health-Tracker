import { loadSavedPetProfile } from './profiles.js';


// ======== VALIDATION CONFIGURATION ========
const REMINDER_THRESHOLD_DAYS = 5; // Or any other number of days you prefer

const ALLOWED_REMINDER_TYPES = ['vaccination', 'checkup', 'grooming'];
const REMINDER_TYPE_MAP = {
  vaccinationDue: 'vaccination',
  checkupDue: 'checkup',
  groomingDue: 'grooming'
};

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
export { REMINDER_THRESHOLD_DAYS, validateReminder, formatReminder, highlightReminders, deleteOverdueReminder, reminderFields };
