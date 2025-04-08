// importing firebase from CDN 
const auth = firebase.auth();
const firestore = firebase.firestore();

import { REMINDER_THRESHOLD_DAYS, validateReminder, formatReminder, highlightReminders, deleteOverdueReminder, reminderFields } from 'https://drkimogad.github.io/Pet-Health-Tracker/js/reminders-validation.js';
import { setupAuthListeners } from 'https://drkimogad.github.io/Pet-Health-Tracker/js/auth.js';
import { initializeButtons } from 'https://drkimogad.github.io/Pet-Health-Tracker/js/buttons.js';

// Initialize variable at top scope so it's accessible
let editingProfileIndex = null;

// Save Pet profiles
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
      relationship: document.getElementById('emergencyContactRelationship').value,
    }],
    mood: document.getElementById('moodSelector').value,
    vaccinationDue: reminders.vaccinationsAndDewormingReminder.dueDate,
    checkupDue: reminders.medicalCheckupsReminder.dueDate,
    groomingDue: reminders.groomingReminder.dueDate,
    petPhoto: document.getElementById('petPhotoPreview').src || '',
  };

  // Rest of your original code
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
  loadSavedPetProfile();
  event.target.reset();
  document.getElementById('petPhotoPreview').src = '';
  document.getElementById('petPhotoPreview').style.display = 'none';
  document.getElementById('cancelEdit').style.display = 'none';
});

// Load saved pet profiles
function loadSavedPetProfile() {
  try {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const savedProfilesList = document.getElementById('savedProfilesList');
    savedProfilesList.innerHTML = '';

    if (savedProfiles && savedProfiles.length > 0) {
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

        // Call to highlight reminders
        try {
          const reminders = {
            vaccinationDue: profile.vaccinationDue,  // CHANGED FROM vaccinationsAndDewormingReminder
            checkupDue: profile.checkupDue,          // CHANGED FROM medicalCheckupsReminder
            groomingDue: profile.groomingDue         // CHANGED FROM groomingReminder
          };
          highlightReminders(reminders, index);
        } catch (error) {
          console.error(`Error highlighting reminders for ${profile.petName}:`, error);
          alert(`Validation Error: ${error.message}`);
        }

      });
    } else {
      alert("No saved profiles found.");
    }
  } catch (error) {
    console.error('Error loading saved pet profiles:', error);
    alert(`Error loading saved pet profiles: ${error.message}`);
  }

  // Reinitialize auth listeners and buttons after rendering
  setupAuthListeners();
  initializeButtons();
}

// Export only what's needed externally
export { editingProfileIndex, loadSavedPetProfile };
