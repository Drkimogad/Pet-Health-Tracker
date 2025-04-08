//* FUNCTION TO ATTACHED BUTTONS TO SAVED PROFILES *//
const savedProfilesList = document.getElementById('savedProfilesList');

savedProfilesList.addEventListener('click', function(event) {
  if (event.target.classList.contains('editProfileButton')) {
    const index = parseInt(event.target.dataset.index);
    editPetProfile(index);
  } else if (event.target.classList.contains('deleteProfileButton')) {
    const index = parseInt(event.target.dataset.index);
    deletePetProfile(index);
  } else if (event.target.classList.contains('printProfileButton')) {
    const index = parseInt(event.target.dataset.index);
    printPetProfile(index);
  } else if (event.target.classList.contains('shareProfileButton')) {
    const index = parseInt(event.target.dataset.index);
    sharePetProfile(index);
  } else if (event.target.classList.contains('generateQRButton')) {
    const index = parseInt(event.target.dataset.index);
    generateQRCode(index);
  } else if (event.target.classList.contains('deleteReminderButton')) {
    const profileIndex = parseInt(event.target.dataset.profileIndex);
    const reminderKey = event.target.dataset.reminder;
    deleteOverdueReminder(profileIndex, reminderKey);
  }
});
// Modified edit function
function editPetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[index];
  editingProfileIndex = index;

  sessionStorage.setItem(`editingProfile_${index}`, JSON.stringify(profile));

  // Populate form fields (with optional chaining replaced)
  document.getElementById('petName').value = profile.petName;
  document.getElementById('breed').value = profile.breed;
  document.getElementById('age').value = profile.age;
  document.getElementById('weight').value = profile.weight;
  document.getElementById('microchipId').value = (profile.microchip && profile
    .microchip.id) || '';
  document.getElementById('microchipDate').value = (profile.microchip && profile
    .microchip.date) || '';
  document.getElementById('microchipVendor').value = (profile.microchip &&
    profile.microchip.vendor) || '';
  document.getElementById('allergies').value = profile.allergies;
  document.getElementById('medicalHistory').value = profile.medicalHistory;
  document.getElementById('dietPlan').value = profile.dietPlan;
  document.getElementById('moodSelector').value = profile.mood || '';

  // Emergency contacts with safe navigation
  const emergencyContact = profile.emergencyContacts && profile
    .emergencyContacts[0];
  document.getElementById('emergencyContactName').value = (emergencyContact &&
    emergencyContact.name) || '';
  document.getElementById('emergencyContactPhone').value = (emergencyContact &&
    emergencyContact.phone) || '';
  document.getElementById('emergencyContactRelationship').value = (
    emergencyContact && emergencyContact.relationship) || '';

  document.getElementById('vaccinationsAndDewormingReminder').value = profile
    .vaccinationsAndDewormingReminder || '';
  document.getElementById('medicalCheckupsReminder').value = profile
    .medicalCheckupsReminder || '';
  document.getElementById('groomingReminder').value = profile
    .groomingReminder || '';

  if (profile.petPhoto) {
    document.getElementById('petPhotoPreview').src = profile.petPhoto;
    document.getElementById('petPhotoPreview').style.display = 'block';
  } else {
    document.getElementById('petPhotoPreview').src = '';
    document.getElementById('petPhotoPreview').style.display = 'none';
  }

  document.getElementById('dietForm').scrollIntoView();

  // Show and setup cancel button
  const cancelButton = document.getElementById('cancelEdit');
  cancelButton.style.display = 'inline-block';

  // Clean existing listeners
  cancelButton.replaceWith(cancelButton.cloneNode(true));
  document.getElementById('cancelEdit').addEventListener('click',
    handleCancelEdit);
}

// New separate cancel handler
function handleCancelEdit() {
  if (editingProfileIndex !== null) {
    const originalProfile = JSON.parse(sessionStorage.getItem(
      `editingProfile_${editingProfileIndex}`));

    if (originalProfile) {
      // Reset form fields using existing values
      document.getElementById('petName').value = originalProfile.petName;
      document.getElementById('breed').value = originalProfile.breed;
      document.getElementById('age').value = originalProfile.age;
      document.getElementById('weight').value = originalProfile.weight;
      document.getElementById('microchipId').value = (originalProfile
        .microchip && originalProfile.microchip.id) || '';
      document.getElementById('microchipDate').value = (originalProfile
        .microchip && originalProfile.microchip.date) || '';
      document.getElementById('microchipVendor').value = (originalProfile
        .microchip && originalProfile.microchip.vendor) || '';
      document.getElementById('allergies').value = originalProfile.allergies;
      document.getElementById('medicalHistory').value = originalProfile
        .medicalHistory;
      document.getElementById('dietPlan').value = originalProfile.dietPlan;
      document.getElementById('moodSelector').value = originalProfile.mood ||
        '';

      const originalEmergencyContact = originalProfile.emergencyContacts &&
        originalProfile.emergencyContacts[0];
      document.getElementById('emergencyContactName').value = (
        originalEmergencyContact && originalEmergencyContact.name) || '';
      document.getElementById('emergencyContactPhone').value = (
        originalEmergencyContact && originalEmergencyContact.phone) || '';
      document.getElementById('emergencyContactRelationship').value = (
          originalEmergencyContact && originalEmergencyContact.relationship) ||
        '';

      document.getElementById('vaccinationsAndDewormingReminder').value =
        originalProfile.vaccinationsAndDewormingReminder || '';
      document.getElementById('medicalCheckupsReminder').value = originalProfile
        .medicalCheckupsReminder || '';
      document.getElementById('groomingReminder').value = originalProfile
        .groomingReminder || '';

      if (originalProfile.petPhoto) {
        document.getElementById('petPhotoPreview').src = originalProfile
          .petPhoto;
        document.getElementById('petPhotoPreview').style.display = 'block';
      } else {
        document.getElementById('petPhotoPreview').src = '';
        document.getElementById('petPhotoPreview').style.display = 'none';
      }
    }

    // Cleanup
    sessionStorage.removeItem(`editingProfile_${editingProfileIndex}`);
    editingProfileIndex = null;
    document.getElementById('cancelEdit').style.display = 'none';
    resetForm();
  }
}

// Existing form reset function (keep as-is)
function resetForm() {
  document.getElementById('dietForm').reset();
  document.getElementById('petPhotoPreview').src = '';
  document.getElementById('petPhotoPreview').style.display = 'none';
}

// delete pet profile button functionality//
function deletePetProfile(index) {
  let savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  savedProfiles.splice(index, 1);
  localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
  loadSavedPetProfile
    (); // Make sure this function is defined elsewhere to reload the displayed list
}

// Print Pet Profile button functionality//
function printPetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[index];

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
      img.onerror = reject;
      img.src = profile.petPhoto;
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
                        <!-- Rest of your content sections -->
                    </body>
                </html>
            `;

      // Phase 3: Write final content
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Phase 4: Ensure DOM is ready
      printWindow.document.addEventListener('DOMContentLoaded', () => {
        // Phase 5: Wait for all subresources
        printWindow.addEventListener('load', () => {
          // Phase 6: Small delay for rendering completion
          setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => {
              if (photoDataURL) URL.revokeObjectURL(
                photoDataURL);
              printWindow.close();
            };
          }, 500);
        });
      });
    })
    .catch(error => {
      printWindow.document.body.innerHTML =
        `<h1>Error: ${error.message}</h1>`;
      printWindow.print();
    });
}

// Share Pet Profile button functionality//
function sharePetProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const profile = savedProfiles[index];
    const link = getProfileLink(index);
    
    const shareText = `
🐾 ${profile.petName}'s Health Profile
━━━━━━━━━━━━━━━━━━━━
📋 Basic Information:
   • Breed: ${profile.breed || 'N/A'}
   • Age: ${profile.age || 'N/A'}
   • Weight: ${profile.weight || 'N/A'}

🔍 Identification:
   • Microchip ID: ${profile.microchip?.id || 'N/A'}
   • Implant Date: ${profile.microchip?.date || 'N/A'}
   • Vendor: ${profile.microchip?.vendor || 'N/A'}

🏥 Health Details:
   • Allergies: ${profile.allergies || 'None'}
   • Medical History: ${profile.medicalHistory || 'None'}
   • Diet Plan: ${profile.dietPlan || 'Not specified'}

📅 Reminders:
   • Vaccinations: ${profile.vaccinationsAndDewormingReminder || 'None'}
   • Check-ups: ${profile.medicalCheckupsReminder || 'None'}
   • Grooming: ${profile.groomingReminder || 'None'}

🚨 Emergency Contact:
   • ${profile.emergencyContacts?.[0]?.name || 'N/A'} 
   (${profile.emergencyContacts?.[0]?.relationship || 'N/A'})
   📞 ${profile.emergencyContacts?.[0]?.phone || 'N/A'}

🔗 Full Profile: ${link}
    `.trim();

    if (navigator.share) {
        navigator.share({
            title: `${profile.petName}'s Health Profile`,
            text: shareText,
            url: link
        }).catch(console.error);
    } else {
        navigator.clipboard?.writeText(shareText)
            .then(() => alert('Profile copied to clipboard!'))
            .catch(() => prompt('Copy this text:', shareText));
    }
}

// Enhanced deep link handler
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileIndex = urlParams.get('profile');
    
    if (profileIndex !== null) {
        // Wait for profiles to load
        setTimeout(() => {
            const petCard = document.querySelector(`.pet-card[data-index="${profileIndex}"]`);
            if (petCard) {
                petCard.scrollIntoView({ behavior: 'smooth' });
                petCard.style.animation = 'highlight 1.5s ease-out';
            }
        }, 500); // Adjust delay if needed
    }
});


// ======== QR CODE GENERATION button functionality ========
function generateQRCode(profileIndex) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const profile = savedProfiles[profileIndex];

  if (!profile) {
    alert("Profile not found!");
    return;
  }

  const qrWindow = window.open('', 'QR Code', 'width=400,height=500');

  // Load QR library FIRST in the new window
  qrWindow.document.write(`
        <html>
            <head>
                <title>Loading QR Code...</title>
                <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
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
                            link.download = '${profile.petName}_QR.png';
                            link.href = canvas.toDataURL();
                            link.click();
                        } else {
                            alert('QR code not yet generated.');
                        }
                    }
                </script>
            </body>
        </html>
    `);
  qrWindow.document.close();

  // Wait for library to load
  qrWindow.addEventListener('load', () => {
    const emergencyContact = profile.emergencyContacts?.[0] || {};
    const microchip = profile.microchip || {};

    const qrText = `
PET PROFILE
Name: ${profile.petName || 'N/A'}
Breed: ${profile.breed || 'N/A'}
Age: ${profile.age || 'N/A'}
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
      // Use the library from the NEW WINDOW's context
      const qrcodeContainer = qrWindow.document.getElementById(
        'qrcode-container');
      qrcodeContainer.style.display = 'block';
      const qrCode = new qrWindow.QRCode(qrcodeContainer, {
        text: qrText,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: qrWindow.QRCode.CorrectLevel.H
      });

      // Show the controls
      const qrControls = qrWindow.document.getElementById('qr-controls');
      qrControls.style.display = 'block';

    } catch (error) {
      qrWindow.document.body.innerHTML = `<h1>Error: ${error.message}</h1>`;
    } finally {
      const loader = qrWindow.document.querySelector('.loader');
      if (loader) {
        loader.style.display = 'none';
      }
    }
  });
}

export { editPetProfile, deletePetProfile, printPetProfile, sharePetProfile, generateQRCode, handleCancelEdit, resetForm };
