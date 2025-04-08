// Add these imports at the top:
import { auth, firestore } from './initialization.js';
import { reminders, formatReminder } from './reminders-validation.js';
import { setupAuthListeners } from './auth.js';
import { initializeButtons } from './buttons.js';

// Save Pet profiles //
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
    // REPLACE THESE WITH VALIDATED FIELDS
    vaccinationDue: reminders.vaccinationsAndDewormingReminder.dueDate,
    checkupDue: reminders.medicalCheckupsReminder.dueDate,
    groomingDue: reminders.groomingReminder.dueDate,
    petPhoto: document.getElementById('petPhotoPreview').src || '',
  };
  
  // ======== REST OF YOUR ORIGINAL CODE  ========
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

// ======== 6. LOAD SAVED PET PROFILES ========
//* loadsavedpetprofile function*//
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
// Add this initialization call (bottom of file):
setupAuthListeners();
initializeButtons();
      
export { editingProfileIndex, loadSavedPetProfile, deletePetProfile, editPetProfile, generateQRCode };
