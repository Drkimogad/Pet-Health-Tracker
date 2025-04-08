// ======== 5. SAVE PET PROFILE (WITH NEW FIELDS) ========
export function savePetProfile(event, editingProfileIndex) {
  event.preventDefault();

  // ======== VALIDATION BLOCK START ========
  let reminders;
  try {
    reminders = {
      vaccinationsAndDewormingReminder: validateReminder({
        type: 'vaccinationsAndDewormingReminder',
        dueDate: document.getElementById('vaccinationsAndDewormingReminder').value
      }),
      medicalCheckupsReminder: validateReminder({
        type: 'medicalCheckupsReminder',
        dueDate: document.getElementById('medicalCheckupsReminder').value
      }),
      groomingReminder: validateReminder({
        type: 'groomingReminder',
        dueDate: document.getElementById('groomingReminder').value
      })
    };
  } catch (error) {
    alert(`Validation Error: ${error.message}`);
    return;
  }
  // ======== VALIDATION BLOCK END ========

  // ======== ORIGINAL PROFILE CREATION (MODIFIED) ========
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
      relationship: document.getElementById('emergencyContactRelationship').value,
    }],
    mood: document.getElementById('moodSelector').value,
    // REPLACE THESE WITH VALIDATED FIELDS
    vaccinationDue: reminders.vaccinationsAndDewormingReminder.dueDate,
    checkupDue: reminders.medicalCheckupsReminder.dueDate,
    groomingDue: reminders.groomingReminder.dueDate,
    petPhoto: document.getElementById('petPhotoPreview').src || '',
  };

  // ======== REST OF YOUR ORIGINAL CODE ========
  let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  
  if (editingProfileIndex !== null) {
    savedProfiles[editingProfileIndex] = petProfile;
    sessionStorage.removeItem(`editingProfile_${editingProfileIndex}`);
    editingProfileIndex = null;
    alert('Profile updated!');
  } else {
    savedProfiles.push(petProfile);
    alert('Profile saved!');
  }

  localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
  loadSavedPetProfile(); // You can import or define this function elsewhere
  event.target.reset();
  document.getElementById('petPhotoPreview').src = '';
  document.getElementById('petPhotoPreview').style.display = 'none';
  document.getElementById('cancelEdit').style.display = 'none';
}

// Load saved pet profiles (can be reused)
export function loadSavedPetProfile() {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  // Logic to display the saved profiles on the page, e.g., populate a list
  console.log(savedProfiles); // Just for testing
}
