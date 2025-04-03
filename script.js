// ======== 1. AUTH STATE CHECK ========
document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('mainContent');
  const logoutButton = document.getElementById('logoutButton');
  const loggedInUser = localStorage.getItem('loggedInUser');

  if (loggedInUser) {
    authSection.style.display = 'none';
    mainContent.style.display = 'block';
    logoutButton.style.display = 'block';
    loadSavedPetProfile();
  }
});

const users = JSON.parse(localStorage.getItem('users')) || [];

// ======== 2. SIGN-UP HANDLER ========
document.getElementById('signUp').addEventListener('submit', function(event) {
  event.preventDefault();
  
  const email = document.getElementById('signUpEmail').value.trim();
  const password = document.getElementById('signUpPassword').value.trim();

  // Validation
  if (!email || !password) {
    alert('Please fill all fields');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Invalid email format');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  if (users.some(user => user.email === email)) {
    alert('Email already registered');
    return;
  }

  users.push({ email, password });
  localStorage.setItem('users', JSON.stringify(users));
  
  alert('Sign-up successful! Please login');
  document.getElementById('signUp').style.display = 'none';
  document.getElementById('login').style.display = 'block';
  event.target.reset();
});

// ======== 3. LOGIN HANDLER ========
document.getElementById('login').addEventListener('submit', function (event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const user = users.find(user => user.email === email && user.password === password);
  if (user) {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    alert('Login successful!');
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'block';
    loadSavedPetProfile();
  } else {
    alert('Invalid credentials!');
  }
  event.target.reset();
});

// ======== 4. LOGOUT HANDLER ========
document.getElementById('logoutButton').addEventListener('click', function () {
  localStorage.removeItem('loggedInUser');
  document.getElementById('authSection').style.display = 'block';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('logoutButton').style.display = 'none';
  alert('Logged out!');
});

// ======== 5. SAVE PET PROFILE (WITH NEW FIELDS) ========
document.getElementById('dietForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const petProfile = {
    petName: document.getElementById('petName').value,
    breed: document.getElementById('breed').value,
    age: document.getElementById('age').value,
    weight: document.getElementById('weight').value,
    // NEW: Microchip Info
    microchip: {
      id: document.getElementById('microchipId').value,
      date: document.getElementById('microchipDate').value,
      vendor: document.getElementById('microchipVendor').value,
    },
    allergies: document.getElementById('allergies').value,
    medicalHistory: document.getElementById('medicalHistory').value,
    dietPlan: document.getElementById('dietPlan').value,
    // NEW: Emergency Contacts
    emergencyContacts: [
      {
        name: document.getElementById('emergencyContactName').value,
        phone: document.getElementById('emergencyContactPhone').value,
        relationship: document.getElementById('emergencyContactRelationship').value,
      },
    ],
    // NEW: Mood Tracker
    mood: document.getElementById('moodSelector').value,
    vaccinationsAndDewormingReminder: document.getElementById('vaccinationsAndDewormingReminder').value,
    medicalCheckupsReminder: document.getElementById('medicalCheckupsReminder').value,
    groomingReminder: document.getElementById('groomingReminder').value,
    petPhoto: document.getElementById('petPhoto').files[0]
      ? URL.createObjectURL(document.getElementById('petPhoto').files[0])
      : '',
  };

  let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  savedProfiles.push(petProfile);
  localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
  alert('Profile saved!');
  loadSavedPetProfile();
  event.target.reset();
});

// ======== 6. LOAD PET PROFILES (WITH NEW FIELDS) ========
function loadSavedPetProfile() {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const savedProfilesList = document.getElementById('savedProfilesList');
  savedProfilesList.innerHTML = '';

  if (savedProfiles) {
    savedProfiles.forEach((profile, index) => {
      const petCard = document.createElement('li');
      petCard.classList.add('pet-card');
      petCard.innerHTML = `
        <div class="pet-card-content">
          <h4>${profile.petName}</h4>
          <p>Breed: ${profile.breed}</p>
          <p>Age: ${profile.age}</p>
          <p>Weight: ${profile.weight}</p>
          <!-- NEW: Microchip Info -->
          <p>Microchip ID: ${profile.microchip.id || 'N/A'}</p>
          <p>Implant Date: ${profile.microchip.date || 'N/A'}</p>
          <p>Vendor: ${profile.microchip.vendor || 'N/A'}</p>
          <p>Allergies: ${profile.allergies}</p>
          <p>Medical History: ${profile.medicalHistory}</p>
          <p>Diet Plan: ${profile.dietPlan}</p>
          <!-- NEW: Emergency Contacts -->
          <p>Emergency Contact: ${profile.emergencyContacts[0].name} (${profile.emergencyContacts[0].relationship}) - ${profile.emergencyContacts[0].phone}</p>
          <!-- NEW: Mood Tracker -->
          <p>Mood: ${profile.mood || 'N/A'}</p>
          <img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo"/>
          <!-- Reminders (existing) -->
          <div id="overdueReminders-${index}" class="overdueReminders"></div>
          <div id="upcomingReminders-${index}" class="upcomingReminders"></div>
          <!-- Buttons -->
         <div class="pet-card-buttons">
            <button class="editProfileButton" data-index="${index}">✏️ Edit</button>
            <button class="shareProfileButton" data-index="${index}">📤 Share</button>
            <button class="deleteProfileButton" data-index="${index}">🗑️ Delete</button>
            <button class="printProfileButton" data-index="${index}">🖨️ Print</button>
            <button class="generateQRButton" data-index="${index}">🔳 QR Code</button>
         </div>
     </div>
    `;
      savedProfilesList.appendChild(petCard);
      highlightReminders(profile, index);
    });

    // Attach event listeners
    attachProfileButtonListeners();
  }
}

// ======== 7. QR CODE GENERATION ========
function generateQRCode(profileIndex) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[profileIndex];
  const qrText = `
    PET PROFILE
    Name: ${profile.petName}
    Allergies: ${profile.allergies}
    Contact: ${profile.emergencyContacts[0].name} (${profile.emergencyContacts[0].phone})
  `;
  
  const canvas = document.createElement('canvas');
  QRCode.toCanvas(canvas, qrText, { width: 200 }, (error) => {
    if (error) alert("QR generation failed!");
    else {
      const qrWindow = window.open('', 'QR Code');
      qrWindow.document.write('<h2>Scan for Pet Info</h2>');
      qrWindow.document.body.appendChild(canvas);
    }
  });
}

// ======== 8. HELPER FUNCTIONS (UNCHANGED) ========
// ... (highlightReminders, deletePetProfile, printPetProfile, etc. remain exactly as in your original code) ...
        // Add event listeners for delete and print buttons for each profile
// Add these new handlers:
document.querySelectorAll('.editProfileButton').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const index = e.target.dataset.index;
    editPetProfile(index);
  });
});

document.querySelectorAll('.shareProfileButton').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const index = e.target.dataset.index;
    sharePetProfile(index);
  });
});


  // Your edit logic here //
  // Edit Profile Handler
function editPetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[index];
  
  // Auto-fill form with existing data
  document.getElementById('petName').value = profile.petName;
  document.getElementById('breed').value = profile.breed;
  document.getElementById('age').value = profile.age;
  document.getElementById('weight').value = profile.weight;
  document.getElementById('microchipId').value = profile.microchip?.id || '';
  document.getElementById('microchipDate').value = profile.microchip?.date || '';
  document.getElementById('microchipVendor').value = profile.microchip?.vendor || '';
  document.getElementById('allergies').value = profile.allergies;
  document.getElementById('medicalHistory').value = profile.medicalHistory;
  document.getElementById('dietPlan').value = profile.dietPlan;
  document.getElementById('moodSelector').value = profile.mood || '';
  document.getElementById('emergencyContactName').value = profile.emergencyContacts?.[0]?.name || '';
  document.getElementById('emergencyContactPhone').value = profile.emergencyContacts?.[0]?.phone || '';
  document.getElementById('emergencyContactRelationship').value = profile.emergencyContacts?.[0]?.relationship || '';
  document.getElementById('vaccinationsAndDewormingReminder').value = profile.vaccinationsAndDewormingReminder || '';
  document.getElementById('medicalCheckupsReminder').value = profile.medicalCheckupsReminder || '';
  document.getElementById('groomingReminder').value = profile.groomingReminder || '';

  // Delete old profile
  savedProfiles.splice(index, 1);
  localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
  
  // Scroll to form
  document.getElementById('dietForm').scrollIntoView();
  console.log("Edit profile:", index);
}
//____________________
//share pet profile//
//----------------------
  // Your share logic here
  function sharePetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[index];
  
  const shareData = {
    title: `${profile.petName}'s Health Profile`,
    text: `Pet Details:
Name: ${profile.petName}
Breed: ${profile.breed}
Age: ${profile.age}
Allergies: ${profile.allergies || 'None'}
Emergency Contact: ${profile.emergencyContacts?.[0]?.name || 'None'} (${profile.emergencyContacts?.[0]?.phone || 'N/A'})`,
    url: window.location.href
  };

  // Web Share API (mobile)
  if (navigator.share) {
    navigator.share(shareData).catch(e => {
      // Fallback if share cancelled
      console.log('Share cancelled:', e);
    });
  } 
  // Fallback for desktop
  else {
    const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
    prompt('Copy to share:', text);
  }
  }
  navigator.share?.({
    title: `Share ${savedProfiles[index].petName}'s Profile`,
    text: `Check out ${savedProfiles[index].petName}'s health details`,
    url: window.location.href
  }).catch(console.error);
}
   document.querySelectorAll('.deleteProfileButton').forEach((button) => {
   button.addEventListener('click', (event) => {
   const index = event.target.dataset.index;
   deletePetProfile(index);
    });
});

        document.querySelectorAll('.printProfileButton').forEach((button) => {
            button.addEventListener('click', (event) => {
                const index = event.target.dataset.index;
                printPetProfile(index);
            });
        });

        // Handle delete button for overdue reminders
        document.querySelectorAll('.deleteReminderButton').forEach((button) => {
            button.addEventListener('click', (event) => {
                const profileIndex = event.target.dataset.profileIndex;
                const reminderKey = event.target.dataset.reminder;
                deleteOverdueReminder(profileIndex, reminderKey);
            });
        });
    }
}

// Delete Pet Profile
function deletePetProfile(index) {
    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    savedProfiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
}

// Print Pet Profile
  function printPetProfile(index) {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
  const profile = savedProfiles[index];
  
  const printWindow = window.open('', '', 'height=600,width=800');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>${profile.petName}'s Profile</title>
        <link rel="stylesheet" href="styles.css"> <!-- Link to your CSS -->
      </head>
      <body class="print-mode">
        <h1>${profile.petName}'s Health Profile</h1>
        
        ${profile.petPhoto ? `<img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo">` : ''}
        
        <div class="info-section">
          <p><strong>Breed:</strong> ${profile.breed || 'N/A'}</p>
          <p><strong>Age:</strong> ${profile.age || 'N/A'}</p>
          <p><strong>Weight:</strong> ${profile.weight || 'N/A'}</p>
        </div>
        
        <div class="info-section">
          <h3>Microchip</h3>
          <p><strong>ID:</strong> ${profile.microchip?.id || 'N/A'}</p>
          <p><strong>Date:</strong> ${profile.microchip?.date || 'N/A'}</p>
          <p><strong>Vendor:</strong> ${profile.microchip?.vendor || 'N/A'}</p>
        </div>
        
        <div class="info-section">
          <h3>Health</h3>
          <p><strong>Allergies:</strong> ${profile.allergies || 'None'}</p>
          <p><strong>Medical History:</strong> ${profile.medicalHistory || 'None'}</p>
          <p><strong>Diet Plan:</strong> ${profile.dietPlan || 'Not specified'}</p>
        </div>
        
        <div class="info-section">
          <h3>Mood</h3>
          <p>${profile.mood || 'Not recorded'}</p>
        </div>
        
        <div class="info-section">
          <h3>Emergency Contact</h3>
          <p><strong>Name:</strong> ${profile.emergencyContacts?.[0]?.name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${profile.emergencyContacts?.[0]?.phone || 'N/A'}</p>
          <p><strong>Relationship:</strong> ${profile.emergencyContacts?.[0]?.relationship || 'N/A'}</p>
        </div>
        
        <div class="info-section">
          <h3>Reminders</h3>
          <p><strong>Vaccinations/Deworming:</strong> ${profile.vaccinationsAndDewormingReminder || 'None'}</p>
          <p><strong>Medical Check-ups:</strong> ${profile.medicalCheckupsReminder || 'None'}</p>
          <p><strong>Grooming:</strong> ${profile.groomingReminder || 'None'}</p>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();
}

// Delete Overdue Reminder
function deleteOverdueReminder(profileIndex, reminderKey) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const profile = savedProfiles[profileIndex];
    profile[reminderKey] = '';

    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
}

// ======== UPDATED SERVICE WORKER REGISTRATION ========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(
            './service-worker.js',
            {
                scope: '/Pet-Health-Tracker/'
            }
        ).then((registration) => {
            console.log('SW registered:', registration);
            setInterval(() => registration.update(), 60 * 60 * 1000);
            
            // Enhanced update handling
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        window.location.reload();
                    }
                });
            });
            
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }).catch(console.error);
    });
}
// ======== END OF UPDATE ========
