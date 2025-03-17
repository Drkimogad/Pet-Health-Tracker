// ======== 1. ADDED AUTH STATE CHECK ========
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
// ======== END OF ADDITION ========

const users = JSON.parse(localStorage.getItem('users')) || [];

// Handle Sign-Up (UNCHANGED)
document.getElementById('signUp').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        alert('User already exists! Please log in.');
        return;
    }

    users.push({ email, password });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Sign-up successful! You can now log in.');

    document.getElementById('signUpForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Handle Login (MODIFIED)
document.getElementById('login').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find((user) => user.email === email && user.password === password);
    if (user) {
        // ======== ADDED LINE ========
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        // ============================
        alert('Login successful!');
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'block';
        loadSavedPetProfile();
    } else {
        alert('Invalid credentials! Please try again.');
    }
});

// Handle Logout (MODIFIED)
document.getElementById('logoutButton').addEventListener('click', function () {
    // ======== ADDED LINE ========
    localStorage.removeItem('loggedInUser');
    // ============================
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'none';
    alert('Logged out successfully!');
});

// Save Pet Profile (UNCHANGED)
document.getElementById('dietForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const petProfile = {
        petName: document.getElementById('petName').value,
        breed: document.getElementById('breed').value,
        age: document.getElementById('age').value,
        weight: document.getElementById('weight').value,
        allergies: document.getElementById('allergies').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        dietPlan: document.getElementById('dietPlan').value,
        vaccinationsAndDewormingReminder: document.getElementById('vaccinationsAndDewormingReminder').value,
        medicalCheckupsReminder: document.getElementById('medicalCheckupsReminder').value,
        groomingReminder: document.getElementById('groomingReminder').value,
        petPhoto: document.getElementById('petPhoto').files[0]
            ? URL.createObjectURL(document.getElementById('petPhoto').files[0])
            : ''
    };

    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    savedProfiles.push(petProfile);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    alert('Pet profile saved!');
    loadSavedPetProfile();
});

// Reminder Threshold in Days
const REMINDER_THRESHOLD_DAYS = 3;

// Updated Reminder Names
const reminderFields = {
    vaccinationsAndDewormingReminder: "Vaccinations and Deworming Reminder",
    medicalCheckupsReminder: "Medical Check-ups Reminder",
    groomingReminder: "Grooming Reminder"
};

// Check and Highlight Upcoming/Overdue Reminders
function highlightReminders(reminders, index) {
    const today = new Date();

    Object.keys(reminders).forEach((reminderKey) => {
        const reminderDate = new Date(reminders[reminderKey]);
        const daysDiff = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
        const reminderLabel = reminderFields[reminderKey];

        // Overdue reminders
        if (daysDiff < 0) {
            document.getElementById(`overdueReminders-${index}`).innerHTML += `
                <div class="reminder overdue">
                    <span class="exclamation">❗</span> ${reminderLabel} is overdue by ${Math.abs(daysDiff)} day(s)!
                    <button class="deleteReminderButton" data-profile-index="${index}" data-reminder="${reminderKey}">Delete</button>
                </div>
            `;
        }
        // Upcoming reminders
        else if (daysDiff <= REMINDER_THRESHOLD_DAYS) {
            document.getElementById(`upcomingReminders-${index}`).innerHTML += `
                <div class="reminder upcoming">
                    ${reminderLabel} is coming up in ${daysDiff} day(s)!
                </div>
            `;
        }
    });
}

// Load Saved Pet Profiles
function loadSavedPetProfile() {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const savedProfilesList = document.getElementById('savedProfilesList');

    savedProfilesList.innerHTML = '';

    if (savedProfiles) {
        savedProfiles.forEach((profile, index) => {
            const reminders = {
                vaccinationsAndDewormingReminder: profile.vaccinationsAndDewormingReminder,
                medicalCheckupsReminder: profile.medicalCheckupsReminder,
                groomingReminder: profile.groomingReminder
            };

            const petCard = document.createElement('li');
            petCard.classList.add('pet-card');
            petCard.innerHTML = `
                <div class="pet-card-content">
                    <h4>${profile.petName}</h4>
                    <p>Breed: ${profile.breed}</p>
                    <p>Age: ${profile.age}</p>
                    <p>Weight: ${profile.weight}</p>
                    <p>Allergies: ${profile.allergies}</p>
                    <p>Medical History: ${profile.medicalHistory}</p>
                    <p>Diet Plan: ${profile.dietPlan}</p>
                    <p>Vaccinations and Deworming Reminder: ${profile.vaccinationsAndDewormingReminder}</p>
                    <p>Medical Check-ups Reminder: ${profile.medicalCheckupsReminder}</p>
                    <p>Grooming Reminder: ${profile.groomingReminder}</p>
                    <img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo"/>
                    <button class="deleteProfileButton" data-index="${index}">Delete Profile</button>
                    <button class="printProfileButton" data-index="${index}">Print Profile</button>
                    <div id="overdueReminders-${index}" class="overdueReminders"></div>
                    <div id="upcomingReminders-${index}" class="upcomingReminders"></div>
                </div>
            `;
            savedProfilesList.appendChild(petCard);

            // Highlight reminders for the profile
            highlightReminders(reminders, index);
        });

        // Add event listeners for delete and print buttons for each profile
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
    printWindow.document.write('<html><head><title>Print Pet Profile</title></head><body>');
    printWindow.document.write(`<h1>${profile.petName}</h1>`);
    printWindow.document.write(`<img src="${profile.petPhoto}" alt="Pet Photo" style="width: 300px; height: auto;" />`);
    printWindow.document.write(`<p>Breed: ${profile.breed}</p>`);
    printWindow.document.write(`<p>Age: ${profile.age}</p>`);
    printWindow.document.write(`<p>Weight: ${profile.weight}</p>`);
    printWindow.document.write(`<p>Allergies: ${profile.allergies}</p>`);
    printWindow.document.write(`<p>Medical History: ${profile.medicalHistory}</p>`);
    printWindow.document.write(`<p>Diet Plan: ${profile.dietPlan}</p>`);
    printWindow.document.write(`<p>Vaccinations and Deworming Reminder: ${profile.vaccinationsAndDewormingReminder}</p>`);
    printWindow.document.write(`<p>Medical Check-ups Reminder: ${profile.medicalCheckupsReminder}</p>`);
    printWindow.document.write(`<p>Grooming Reminder: ${profile.groomingReminder}</p>`);
    printWindow.document.write('</body></html>');

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
            'https://drkimogad.github.io/Pet-Health-Tracker/service-worker.js',
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
