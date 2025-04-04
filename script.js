// Global declaration//
let editingProfileIndex = null;

// Reminders in-app timestamp alert//
const REMINDER_THRESHOLD_DAYS = 5; // Or any other number of days you prefer
const reminderFields = {
    vaccinationsAndDewormingReminder: 'Vaccinations/Deworming',
    medicalCheckupsReminder: 'Medical Check-ups',
    groomingReminder: 'Grooming',
};
// ======== 1. AUTH STATE CHECK ========
document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');
    const logoutButton = document.getElementById('logoutButton');
    const loggedInUser = localStorage.getItem('loggedInUser');
    // ... your existing DOMContentLoaded code ...
    const petPhotoInput = document.getElementById('petPhoto');
    const petPhotoPreview = document.getElementById('petPhotoPreview');

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
        } // Added closing brace here
    }
    if (loggedInUser) {
        authSection.style.display = 'none';
        mainContent.style.display = 'block';
        logoutButton.style.display = 'block';
        loadSavedPetProfile();
    }
});

// ======== 2. SIGN-UP HANDLER ========
document.getElementById('signUp').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value.trim();

    // Validation...

    // Use Firebase to create a new user
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sign-up successful.
            console.log("Firebase Sign-up successful:", userCredential.user);
            alert('Sign-up successful! Redirecting to login...');

            // Ensure we have a Firebase user object before redirecting
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    document.getElementById('signUpForm').style.display = 'none';
                    document.getElementById('loginForm').style.display = 'block';
                    event.target.reset();
                } else {
                    console.log("Firebase user object not immediately available after sign-up.");
                    // Optionally, try again after a short delay
                    setTimeout(() => {
                        document.getElementById('signUpForm').style.display = 'none';
                        document.getElementById('loginForm').style.display = 'block';
                        event.target.reset();
                    }, 500);
                }
            });
        })
        .catch((error) => {
            // Handle errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Firebase Sign-up error:", errorCode, errorMessage);
            alert('Sign-up failed: ' + errorMessage);
        });
});

// ======== 3. LOGIN HANDLER (FIREBASE INTEGRATION) ========
document.getElementById('login').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login successful.
            const user = userCredential.user;
            console.log("Firebase Login successful:", user);
            alert('Login successful!');
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            document.getElementById('logoutButton').style.display = 'block';
            event.target.reset();
            // We might want to load pet profiles here after successful login
            // loadSavedPetProfile(); // Uncomment this if needed
        })
        .catch((error) => {
            // Handle login errors.
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Firebase Login error:", errorCode, errorMessage);
            alert('Login failed: ' + errorMessage);
        });
});

// ======== 4. LOGOUT HANDLER (FIREBASE INTEGRATION) ========
document.getElementById('logoutButton').addEventListener('click', function () {
    firebase.auth().signOut()
        .then(() => {
            // Logout successful.
            console.log("Firebase Logout successful");
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('mainContent').style.display = 'none';
            document.getElementById('logoutButton').style.display = 'none';
            alert('Logged out successfully!');
        })
        .catch((error) => {
            // Handle logout errors.
            console.error("Firebase Logout error:", error);
            alert('Logout failed. Please try again.');
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

// ======== 6. LOAD PET PROFILES (WITH NEW FIELDS) ========
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
                    <img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo"/>
                    <p>Breed: ${profile.breed}</p>
                    <p>Age: ${profile.age}</p>
                    <p>Weight: ${profile.weight}</p>
                    <p>Microchip ID: ${profile.microchip?.id || 'N/A'}</p>
                    <p>Implant Date: ${profile.microchip?.date || 'N/A'}</p>
                    <p>Vendor: ${profile.microchip?.vendor || 'N/A'}</p>
                    <p>Allergies: ${profile.allergies}</p>
                    <p>Medical History: ${profile.medicalHistory}</p>
                    <p>Diet Plan: ${profile.dietPlan}</p>
                    <p>Emergency Contact: ${emergencyContact.name} || 'N/A'} (${emergencyContact.relationship || 'N/A'}) - ${emergencyContact.phone || 'N/A'}</p>
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

            // Highlight reminders for the profile
            const reminders = {
                vaccinationsAndDewormingReminder: profile.vaccinationsAndDewormingReminder,
                medicalCheckupsReminder: profile.medicalCheckupsReminder,
                groomingReminder: profile.groomingReminder
            };
            highlightReminders(reminders, index);
        });
        attachProfileButtonListeners();
    }
}
// highlighting upcoming and overdue ALERT reminders//
function highlightReminders(reminders, index) {
    const today = new Date();

    Object.keys(reminders).forEach((reminderKey) => {
        const reminderDateTime = reminders[reminderKey] ? new Date(reminders[reminderKey]) : null;
        if (!reminderDateTime) return;

        const timeDiff = reminderDateTime.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        const reminderLabel = reminderFields[reminderKey];

        const overdueContainer = document.getElementById(`overdueReminders-${index}`);
        const upcomingContainer = document.getElementById(`upcomingReminders-${index}`);

        // Overdue reminders
        if (timeDiff < 0) {
            overdueContainer.innerHTML += `
                <div class="reminder overdue">
                    <span class="exclamation">❗</span> ${reminderLabel} was due on ${reminderDateTime.toLocaleString()}
                    <button class="deleteReminderButton" data-profile-index="${index}" data-reminder="${reminderKey}">Delete</button>
                </div>
            `;
        }
        // Upcoming reminders
        else if (daysDiff <= REMINDER_THRESHOLD_DAYS) {
            upcomingContainer.innerHTML += `
                <div class="reminder upcoming">
                    ${reminderLabel} is on ${reminderDateTime.toLocaleString()}
                </div>
            `;
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

    // Store the original profile in sessionStorage
    sessionStorage.setItem(`editingProfile_${index}`, JSON.stringify(profile));

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

    if (profile.petPhoto) {
        document.getElementById('petPhotoPreview').src = profile.petPhoto;
        document.getElementById('petPhotoPreview').style.display = 'block';
    } else {
        document.getElementById('petPhotoPreview').src = '';
        document.getElementById('petPhotoPreview').style.display = 'none';
    }

    document.getElementById('dietForm').scrollIntoView();

    // Modified "Cancel" Button Event Listener (moved here):
    const cancelButton = document.getElementById('cancelEdit');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            if (editingProfileIndex !== null) {
                // Restore original profile from sessionStorage
                const originalProfile = JSON.parse(sessionStorage.getItem(`editingProfile_${editingProfileIndex}`));

                if (originalProfile) {
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
                }

                // Clear sessionStorage
                sessionStorage.removeItem(`editingProfile_${editingProfileIndex}`);
                editingProfileIndex = null;
            }

            document.getElementById('dietForm').reset();
            document.getElementById('petPhotoPreview').src = '';
            document.getElementById('petPhotoPreview').style.display = 'none';
        });
    } else {
        console.error("Cancel button with ID 'cancelEdit' not found in the DOM when edit form is displayed.");
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
function printPetProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const profile = savedProfiles[index];

    const printWindow = window.open('', '', 'height=600,width=800');

    printWindow.document.write(`
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
    `);

    printWindow.document.close();
    printWindow.print();
}

// Share Pet Profile button functionality//
function sharePetProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const profile = savedProfiles[index];
    const emergencyContact = profile.emergencyContacts?.[0] || {};

    const shareData = {
        title: `${profile.petName}'s Health Profile`,
        text: `Pet Details:\n` +
              `Name: ${profile.petName || 'N/A'}\n` +
              `Breed: ${profile.breed || 'N/A'}\n` +
              `Age: ${profile.age || 'N/A'}\n` +
              `Weight: ${profile.weight || 'N/A'}\n` +
              `Microchip ID: ${profile.microchip?.id || 'N/A'}\n` +
              `Allergies: ${profile.allergies || 'None'}\n` +
              `Medical History: ${profile.medicalHistory || 'None'}\n` +
              `Diet Plan: ${profile.dietPlan || 'Not specified'}\n` +
              `Vaccinations/Deworming: ${profile.vaccinationsAndDewormingReminder || 'N/A'}\n` +
              `Medical Check-ups: ${profile.medicalCheckupsReminder || 'N/A'}\n` +
              `Grooming: ${profile.groomingReminder || 'N/A'}\n` +
              `Emergency Contact: ${emergencyContact.name || 'N/A'} (${emergencyContact.relationship || 'N/A'}) - ${emergencyContact.phone || 'N/A'}`,
        url: window.location.href
    };

    // Web Share API (mobile)
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Shared successfully'))
            .catch((error) => console.log('Error sharing', error));
    } else {
        const textToCopy = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        prompt('Copy the following text to share:', textToCopy);
    }
}

// ======== QR CODE GENERATION button functionality ========
function generateQRCode(profileIndex) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const profile = savedProfiles[profileIndex];
    const emergencyContact = profile.emergencyContacts?.[0] || {};

    if (!profile) {
        alert("Profile not found!");
        return;
    }

    let qrText = `
        PET PROFILE
        Name: ${profile.petName || 'N/A'}
        Breed: ${profile.breed || 'N/A'}
        Age: ${profile.age || 'N/A'}
        Weight: ${profile.weight || 'N/A'}
        Microchip ID: ${profile.microchip?.id || 'N/A'}
        Allergies: ${profile.allergies || 'N/A'}
        Medical History: ${profile.medicalHistory || 'N/A'}
        Diet Plan: ${profile.dietPlan || 'N/A'}
        Vaccinations/Deworming: ${profile.vaccinationsAndDewormingReminder || 'N/A'}
        Medical Check-ups: ${profile.medicalCheckupsReminder || 'N/A'}
        Grooming: ${profile.groomingReminder || 'N/A'}
        Emergency Contact: ${emergencyContact.name || 'N/A'} (${emergencyContact.relationship || 'N/A'}) - ${emergencyContact.phone || 'N/A'}
    `;

    QRCode.toCanvas(document.createElement('canvas'), qrText, { width: 300 }, (error, canvas) => {
        if (error) {
            console.error("QR generation error:", error);
            alert("QR generation failed!");
        } else {
            const qrWindow = window.open('', 'QR Code');
            qrWindow.document.write('<h2>Scan for Pet Info</h2>');
            qrWindow.document.body.appendChild(canvas);
        }
    });
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
