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
