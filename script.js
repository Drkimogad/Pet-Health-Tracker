// Global declaration//
let editingProfileIndex = null;

// Reminders in-app timestamp alert//
const REMINDER_THRESHOLD_DAYS = 5; // Or any other number of days you prefer
const reminderFields = {
    vaccinationsAndDewormingReminder: 'Vaccinations/Deworming',
    medicalCheckupsReminder: 'Medical Check-ups',
    groomingReminder: 'Grooming',
};

// ======== AUTHENTICATION ========//
// ======== A AUTH STATE CHECK ======== (MODIFIED)
document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');
    const logoutButton = document.getElementById('logoutButton');
    const petPhotoInput = document.getElementById('petPhoto');
    const petPhotoPreview = document.getElementById('petPhotoPreview');
    
    // Firebase auth state persistence
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    // User is signed in
                    authSection.style.display = 'none';
                    mainContent.style.display = 'block';
                    logoutButton.style.display = 'block';
                    loadSavedPetProfile();
                } else {
                    // User is signed out
                    authSection.style.display = 'block';
                    mainContent.style.display = 'none';
                    logoutButton.style.display = 'none';
                    switchAuthForm('login'); // Add this line
                }
            });
        })
        .catch((error) => {
            console.error("Auth persistence error:", error);
        });

    petPhotoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                petPhotoPreview.src = e.target.result;
                petPhotoPreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            petPhotoPreview.src = '#';
            petPhotoPreview.style.display = 'none';
        }
    });

    // Check sessionStorage for in-progress edits
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith('editingProfile_')) {
            const index = parseInt(key.split('_')[1]);
            const originalProfile = JSON.parse(sessionStorage.getItem(key));

            if (originalProfile) {
                editingProfileIndex = index;
                document.getElementById('petName').value = originalProfile.petName;
                document.getElementById('breed').value = originalProfile.breed;
                document.getElementById('age').value = originalProfile.age;
                document.getElementById('weight').value = originalProfile.weight;
                document.getElementById('microchipId').value = originalProfile.microchip?.id || '';
                document.getElementById('microchipDate').value = originalProfile.microchip?.date || '';
                document.getElementById('microchipVendor').value = originalProfile.microchip?.vendor || '';
                document.getElementById('allergies').value = originalProfile.allergies;
                document.getElementById('medicalHistory').value = originalProfile.medicalHistory;
                document.getElementById('dietPlan').value = originalProfile.dietPlan;
                document.getElementById('moodSelector').value = originalProfile.mood || '';
                document.getElementById('emergencyContactName').value = originalProfile.emergencyContacts?.[0]?.name || '';
                document.getElementById('emergencyContactPhone').value = originalProfile.emergencyContacts?.[0]?.phone || '';
                document.getElementById('emergencyContactRelationship').value = originalProfile.emergencyContacts?.[0]?.relationship || '';
                document.getElementById('vaccinationsAndDewormingReminder').value = originalProfile.vaccinationsAndDewormingReminder || '';
                document.getElementById('medicalCheckupsReminder').value = originalProfile.medicalCheckupsReminder || '';
                document.getElementById('groomingReminder').value = originalProfile.groomingReminder || '';

                // Pet photo
                if (originalProfile.petPhoto) {
                    document.getElementById('petPhotoPreview').src = originalProfile.petPhoto;
                    document.getElementById('petPhotoPreview').style.display = 'block';
                } else {
                    document.getElementById('petPhotoPreview').src = '';
                    document.getElementById('petPhotoPreview').style.display = 'none';
                }

                document.getElementById('dietForm').scrollIntoView();
            }
        }
    }

    if (loggedInUser) {
        authSection.style.display = 'none';
        mainContent.style.display = 'block';
        logoutButton.style.display = 'block';
        loadSavedPetProfile();
    }
});
// ========B FORM SWITCHING HELPER ========
function switchAuthForm(targetForm) {
    // Hide all forms
    document.getElementById('signUpForm').classList.remove('active');
    document.getElementById('loginForm').classList.remove('active');
    
    // Show target form and reset it
    const formElement = document.getElementById(`${targetForm}Form`);
    formElement.classList.add('active');
    formElement.querySelector('form').reset();
}

// ========C FORM SWITCHING EVENT LISTENERS ========
document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthForm('login');
});

document.getElementById('showSignUp').addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthForm('signUp');
});

// ========D UPDATED SIGN-UP HANDLER ========
document.getElementById('signUp').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value.trim();

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            alert('Sign-up successful! Please login.');
            switchAuthForm('login');
            this.reset(); // Reset sign-up form
        })
        .catch((error) => {
            console.error("Sign-up error:", error);
            alert(`Sign-up failed: ${error.message}`);
            this.reset(); // Reset form on error
        });
});

// ========E UPDATED LOGIN HANDLER ========
document.getElementById('login').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Successful login handled by auth state observer
            this.reset(); // Reset login form
        })
        .catch((error) => {
            console.error("Login error:", error);
            alert(`Login failed: ${error.message}`);
            this.reset(); // Reset form on error
        });
});

// ======== F. LOGOUT HANDLER (FIREBASE INTEGRATION) ========
document.getElementById('logoutButton').addEventListener('click', function() {
    firebase.auth().signOut()
        .then(() => {
            console.log("Firebase Logout successful");
            // Trigger form switching instead of direct DOM manipulation
            switchAuthForm('login');
            alert('Logged out successfully!');
        })
        .catch((error) => {
            console.error("Logout error:", error);
            alert(`Logout failed: ${error.message}`);
        });
});

// ======== 5. SAVE PET PROFILE (WITH NEW FIELDS) ========
document.getElementById('dietForm').addEventListener('submit', function (event) {
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
        emergencyContacts: [
            {
                name: document.getElementById('emergencyContactName').value,
                phone: document.getElementById('emergencyContactPhone').value,
                relationship: document.getElementById('emergencyContactRelationship').value,
            },
        ],
        mood: document.getElementById('moodSelector').value,
        vaccinationsAndDewormingReminder: document.getElementById('vaccinationsAndDewormingReminder').value,
        medicalCheckupsReminder: document.getElementById('medicalCheckupsReminder').value,
        groomingReminder: document.getElementById('groomingReminder').value,
        petPhoto: document.getElementById('petPhoto').files[0]
            ? URL.createObjectURL(document.getElementById('petPhoto').files[0])
            : document.getElementById('petPhotoPreview').src, // Use preview src if no new file
    };

    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];

    if (editingProfileIndex !== null) {
        savedProfiles[editingProfileIndex] = petProfile;
        // Clear sessionStorage
        sessionStorage.removeItem(`editingProfile_${editingProfileIndex}`);
        editingProfileIndex = null;
        alert('Profile updated!');
    } else {
        savedProfiles.push(petProfile);
        alert('Profile saved!');
    }

    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile(); // Replace with your load function
    event.target.reset();
    document.getElementById('petPhotoPreview').src = '';
    document.getElementById('petPhotoPreview').style.display = 'none';
});

// ======== 6. LOAD SAVED PET PROFILES (WITH NEW FIELDS) ========
function formatReminder(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString();
}

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
                    ${profile.petPhoto ? `<img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo"/>` : ''}
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
            `; // Removed the hardcoded reminder block
            savedProfilesList.appendChild(petCard);

            const reminders = {
                vaccinationsAndDewormingReminder: profile.vaccinationsAndDewormingReminder,
                medicalCheckupsReminder: profile.medicalCheckupsReminder,
                groomingReminder: profile.groomingReminder
            };
            highlightReminders(reminders, index);
        });
    }
}

//* 7 function to attached buttons to pet profiles*//
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

// highlighting upcoming and overdue ALERT reminders//
function highlightReminders(reminders, index) {
    const today = new Date();
    const overdueContainer = document.getElementById(`overdueReminders-${index}`);
    const upcomingContainer = document.getElementById(`upcomingReminders-${index}`);

    // Clear existing reminders
    overdueContainer.innerHTML = '';
    upcomingContainer.innerHTML = '';

    Object.entries(reminders).forEach(([reminderKey, reminderValue]) => {
        if (!reminderValue) return;
        
        const reminderDateTime = new Date(reminderValue);
        const timeDiff = reminderDateTime.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        const reminderLabel = reminderFields[reminderKey];

        // Overdue reminders
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
        }
        // Upcoming reminders
        else if (daysDiff <= REMINDER_THRESHOLD_DAYS) {
            const div = document.createElement('div');
            div.className = 'reminder upcoming';
            div.textContent = `${reminderLabel} is on ${reminderDateTime.toLocaleString()}`;
            upcomingContainer.appendChild(div);
        }
    });
}

// Delete Overdue Reminder
function deleteOverdueReminder(profileIndex, reminderKey) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const profile = savedProfiles[profileIndex];
    profile[reminderKey] = '';

    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
}


// ======== 8. HELPER FUNCTIONS ========
// Edit saved profile button functionality//
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
    document.getElementById('microchipId').value = (profile.microchip && profile.microchip.id) || '';
    document.getElementById('microchipDate').value = (profile.microchip && profile.microchip.date) || '';
    document.getElementById('microchipVendor').value = (profile.microchip && profile.microchip.vendor) || '';
    document.getElementById('allergies').value = profile.allergies;
    document.getElementById('medicalHistory').value = profile.medicalHistory;
    document.getElementById('dietPlan').value = profile.dietPlan;
    document.getElementById('moodSelector').value = profile.mood || '';

    // Emergency contacts with safe navigation
    const emergencyContact = profile.emergencyContacts && profile.emergencyContacts[0];
    document.getElementById('emergencyContactName').value = (emergencyContact && emergencyContact.name) || '';
    document.getElementById('emergencyContactPhone').value = (emergencyContact && emergencyContact.phone) || '';
    document.getElementById('emergencyContactRelationship').value = (emergencyContact && emergencyContact.relationship) || '';

    document.getElementById('vaccinationsAndDewormingReminder').value = profile.vaccinationsAndDewormingReminder || '';
    document.getElementById('medicalCheckupsReminder').value = profile.medicalCheckupsReminder || '';
    document.getElementById('groomingReminder').value = profile.groomingReminder || '';

    if (profile.petPhoto) {
        document.getElementById('petPhotoPreview').src = profile.petPhoto;
        document.getElementById('petPhotoPreview').style.display = 'block';
    } else {
        document.getElementById('petPhotoPreview').src = '';
        document.getElementById('petPhotoPreview').style.display = 'none';
    }

    document.getElementById('dietForm').scrollIntoView();

    // Cancel button handling (fixed brace structure)
    const cancelButton = document.getElementById('cancelEdit');
    if (cancelButton) {
        // Clone to remove existing listeners
        cancelButton.replaceWith(cancelButton.cloneNode(true));
        document.getElementById('cancelEdit').addEventListener('click', function() {
            if (editingProfileIndex !== null) {
                const originalProfile = JSON.parse(sessionStorage.getItem(`editingProfile_${editingProfileIndex}`));

                if (originalProfile) {
                    // Restore all fields (using safe navigation)
                    document.getElementById('petName').value = originalProfile.petName;
                    document.getElementById('breed').value = originalProfile.breed;
                    document.getElementById('age').value = originalProfile.age;
                    document.getElementById('weight').value = originalProfile.weight;
                    document.getElementById('microchipId').value = (originalProfile.microchip && originalProfile.microchip.id) || '';
                    document.getElementById('microchipDate').value = (originalProfile.microchip && originalProfile.microchip.date) || '';
                    document.getElementById('microchipVendor').value = (originalProfile.microchip && originalProfile.microchip.vendor) || '';
                    document.getElementById('allergies').value = originalProfile.allergies;
                    document.getElementById('medicalHistory').value = originalProfile.medicalHistory;
                    document.getElementById('dietPlan').value = originalProfile.dietPlan;
                    document.getElementById('moodSelector').value = originalProfile.mood || '';
                    
                    const originalEmergencyContact = originalProfile.emergencyContacts && originalProfile.emergencyContacts[0];
                    document.getElementById('emergencyContactName').value = (originalEmergencyContact && originalEmergencyContact.name) || '';
                    document.getElementById('emergencyContactPhone').value = (originalEmergencyContact && originalEmergencyContact.phone) || '';
                    document.getElementById('emergencyContactRelationship').value = (originalEmergencyContact && originalEmergencyContact.relationship) || '';

                    document.getElementById('vaccinationsAndDewormingReminder').value = originalProfile.vaccinationsAndDewormingReminder || '';
                    document.getElementById('medicalCheckupsReminder').value = originalProfile.medicalCheckupsReminder || '';
                    document.getElementById('groomingReminder').value = originalProfile.groomingReminder || '';

                    if (originalProfile.petPhoto) {
                        document.getElementById('petPhotoPreview').src = originalProfile.petPhoto;
                        document.getElementById('petPhotoPreview').style.display = 'block';
                    } else {
                        document.getElementById('petPhotoPreview').src = '';
                        document.getElementById('petPhotoPreview').style.display = 'none';
                    }
                }

                // Cleanup
                sessionStorage.removeItem(`editingProfile_${editingProfileIndex}`);
                editingProfileIndex = null;
            }

            document.getElementById('dietForm').reset();
            document.getElementById('petPhotoPreview').src = '';
            document.getElementById('petPhotoPreview').style.display = 'none';
        }); // Correctly closes addEventListener
    } else { // Properly matched else
        console.error("Cancel button with ID 'cancelEdit' not found");
    }
}

// delete pet profile button functionality//
function deletePetProfile(index) {
    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    savedProfiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile(); // Make sure this function is defined elsewhere to reload the displayed list
}

// Print Pet Profile button functionality//
// ======== Print Pet Profile (MODIFIED) ========
function printPetProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const profile = savedProfiles[index];

    const printWindow = window.open('', '', 'height=600,width=800');

    // Add loading state
    printWindow.document.write(`
        <html>
            <head>
                <title>Loading...</title>
                <style>
                    .loader {
                        border: 5px solid #f3f3f3;
                        border-radius: 50%;
                        border-top: 5px solid #3498db;
                        width: 50px;
                        height: 50px;
                        animation: spin 1s linear infinite;
                        margin: 20% auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body><div class="loader"></div></body>
        </html>
    `);

    // Create temporary image to verify load
    const tempImg = new Image();
    tempImg.onload = function() {
        // Image loaded successfully - build print content
        const printContent = `
            <html>
                <head>
                    <title>${profile.petName}'s Profile</title>
                    <link rel="stylesheet" href="styles.css">
                    <style>
                        body.print-mode { font-family: sans-serif; }
                        .info-section { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                        .info-section h3 { margin-top: 0; }
                        .pet-photo { max-width: 200px; height: auto; margin-bottom: 10px; }
                    </style>
                </head>
                <body class="print-mode">
                    <h1>${profile.petName}'s Health Profile</h1>

                    ${profile.petPhoto ? `<img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo">` : ''}

                    <div class="info-section">
                        <h3>Basic Information</h3>
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
        `;

        printWindow.document.write(''); // Clear the loading content
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Add a small delay before printing *after* the image is loaded
        setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
        }, 300); // Adjust the delay (in milliseconds) as needed
    };

    tempImg.onerror = function() {
        printWindow.document.write('<h1>Error loading image</h1>');
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
        }, 300);
    };

    tempImg.src = profile.petPhoto;
}

// Share Pet Profile button functionality//
function sharePetProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const profile = savedProfiles[index];
    const emergencyContact = profile.emergencyContacts?.[0] || {};

    const shareData = {
        title: `${profile.petName}'s Health Profile`,
        text: `Pet Details:\n${Object.entries({
            Name: profile.petName,
            Breed: profile.breed,
            Age: profile.age,
            Weight: profile.weight,
            'Microchip ID': profile.microchip?.id,
            Allergies: profile.allergies,
            'Medical History': profile.medicalHistory,
            'Diet Plan': profile.dietPlan,
            'Vaccinations/Deworming': profile.vaccinationsAndDewormingReminder,
            'Medical Check-ups': profile.medicalCheckupsReminder,
            Grooming: profile.groomingReminder,
            'Emergency Contact': `${emergencyContact.name} (${emergencyContact.relationship}) - ${emergencyContact.phone}`
        }).map(([key, val]) => `${key}: ${val || 'N/A'}`).join('\n')}`,
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Shared successfully'))
            .catch(console.error);
    } else {
        const textToCopy = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        
        // Modern clipboard API fallback
        if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => alert('Profile copied to clipboard!'))
                .catch(() => prompt('Copy the following text:', textToCopy));
        } else {
            prompt('Copy the following text:', textToCopy);
        }
    }
}
// ======== QR CODE GENERATION button functionality ========
function generateQRCode(profileIndex) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const profile = savedProfiles[profileIndex];

    if (!profile) {
        alert("Profile not found!");
        return;
    }

    const qrWindow = window.open('', 'QR Code', 'width=400,height=500');
    if (!qrWindow || qrWindow.closed) {
        alert('Please allow pop-ups to generate QR code');
        return;
    }

    // Initial loading state
    qrWindow.document.write(`
        <html>
            <head>
                <title>Loading QR Code...</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
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
            </body>
        </html>
    `);

    // Wait for window and library to load
    qrWindow.onload = () => {
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
            qrWindow.document.body.innerHTML = `
                <div style="padding: 20px; text-align: center; font-family: sans-serif;">
                    <h2>${profile.petName}'s Health Profile</h2>
                    <div id="qrcode" style="margin: 20px auto;"></div>
                    <div style="margin-top: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; margin: 0 10px; background: #2ecc71; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
                        <button onclick="downloadQR()" style="padding: 10px 20px; margin: 0 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Download</button>
                    </div>
                    <p style="margin-top: 20px; font-size: 0.8em; color: #777;">Scan for Emergency Information</p>
                    <p style="font-size: 0.7em; color: #999; margin-top: 10px;">Generated by Pet Health Tracker</p>
                </div>
                <script>
                    const qrcodeDiv = document.getElementById('qrcode');
                    const qrcode = new QRCode(qrcodeDiv, {
                        text: '${qrText.replace(/'/g, "\\\'")}',
                        width: 256,
                        height: 256,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });

                    function downloadQR() {
                        const canvas = qrcodeDiv.querySelector('canvas');
                        const link = document.createElement('a');
                        link.download = '${profile.petName}_QR.png';
                        link.href = canvas.toDataURL();
                        link.click();
                    }
                </script>
            `;
        } catch (error) {
            qrWindow.document.body.innerHTML = `<h1 style="color: red">Error: ${error.message}</h1>`;
        }
    };
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
