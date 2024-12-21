// Dummy storage for users
const users = [];

// Handle Sign-Up
document.getElementById('signUp').addEventListener('submit', function (event) {
    event.preventDefault();
    
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;

    // Store the new user
    users.push({ email, password });
    alert('Sign-up successful! You can now log in.');
    
    // Switch to Login Form
    document.getElementById('signUpForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Handle Login
document.getElementById('login').addEventListener('submit', function (event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Check if the user exists
    const user = users.find(user => user.email === email && user.password === password);
    
    if (user) {
        alert('Login successful!');
        
        // Show Main Content and Hide Authentication Forms
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'block';
        
        // Load saved pet data if available
        loadSavedPetProfile();
    } else {
        alert('Invalid credentials! Please try again.');
    }
});

// Handle Logout
document.getElementById('logoutButton').addEventListener('click', function () {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'none';
    
    alert('Logged out successfully!');
});

// Save Pet Profile
document.getElementById('dietForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const petProfile = {
        petName: document.getElementById('petName').value,
        breed: document.getElementById('breed').value,
        age: document.getElementById('age').value,
        weight: document.getElementById('weight').value,
        allergies: document.getElementById('allergies').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        dietPlan: document.getElementById('dietPlan').value
    };

    // Save pet profile in localStorage
    localStorage.setItem('petProfile', JSON.stringify(petProfile));

    // Alert and reload saved data
    alert('Pet profile saved!');
    loadSavedPetProfile();
});

// Load Saved Pet Profile
function loadSavedPetProfile() {
    const petProfile = JSON.parse(localStorage.getItem('petProfile'));
    if (petProfile) {
        document.getElementById('petName').value = petProfile.petName;
        document.getElementById('breed').value = petProfile.breed;
        document.getElementById('age').value = petProfile.age;
        document.getElementById('weight').value = petProfile.weight;
        document.getElementById('allergies').value = petProfile.allergies;
        document.getElementById('medicalHistory').value = petProfile.medicalHistory;
        document.getElementById('dietPlan').value = petProfile.dietPlan;

        // Display saved profile
        document.getElementById('savedProfile').innerHTML = `
            <h3>${petProfile.petName}</h3>
            <p>Breed: ${petProfile.breed}</p>
            <p>Age: ${petProfile.age}</p>
            <p>Weight: ${petProfile.weight}</p>
            <p>Allergies: ${petProfile.allergies}</p>
            <p>Medical History: ${petProfile.medicalHistory}</p>
            <p>Diet Plan: ${petProfile.dietPlan}</p>
        `;
    }
}

// Set reminders for Vaccination, Medical History, and Diet
document.getElementById('setVaccinationReminder').addEventListener('click', function () {
    const vaccinationReminder = document.getElementById('vaccinationReminder').value;
    if (vaccinationReminder) {
        localStorage.setItem('vaccinationReminder', vaccinationReminder);
        alert('Vaccination reminder set successfully!');
    } else {
        alert('Please set a valid reminder date for Vaccination.');
    }
});

document.getElementById('setMedicalHistoryReminder').addEventListener('click', function () {
    const medicalHistoryReminder = document.getElementById('medicalHistoryReminder').value;
    if (medicalHistoryReminder) {
        localStorage.setItem('medicalHistoryReminder', medicalHistoryReminder);
        alert('Medical History reminder set successfully!');
    } else {
        alert('Please set a valid reminder date for Medical History.');
    }
});

document.getElementById('setDietReminder').addEventListener('click', function () {
    const dietReminder = document.getElementById('dietReminder').value;
    if (dietReminder) {
        localStorage.setItem('dietReminder', dietReminder);
        alert('Diet reminder set successfully!');
    } else {
        alert('Please set a valid reminder date for Diet.');
    }
});

// Check reminders and show notifications
function checkReminders() {
    const vaccinationReminder = localStorage.getItem('vaccinationReminder');
    const medicalHistoryReminder = localStorage.getItem('medicalHistoryReminder');
    const dietReminder = localStorage.getItem('dietReminder');

    const currentDate = new Date();

    // Check Vaccination Reminder
    if (vaccinationReminder) {
        const reminderDate = new Date(vaccinationReminder);
        if (currentDate >= reminderDate) {
            if (Notification.permission === "granted") {
                new Notification("Reminder for Vaccination", {
                    body: "It's time to update your pet's vaccination details!",
                    icon: 'icon.png' // Replace with an actual icon
                });
            }
        }
    }

    // Check Medical History Reminder
    if (medicalHistoryReminder) {
        const reminderDate = new Date(medicalHistoryReminder);
        if (currentDate >= reminderDate) {
            if (Notification.permission === "granted") {
                new Notification("Reminder for Medical History", {
                    body: "It's time to check/update your pet's medical history!",
                    icon: 'icon.png'
                });
            }
        }
    }

    // Check Diet Reminder
    if (dietReminder) {
        const reminderDate = new Date(dietReminder);
        if (currentDate >= reminderDate) {
            if (Notification.permission === "granted") {
                new Notification("Reminder for Diet", {
                    body: "It's time to update your pet's diet plan!",
                    icon: 'icon.png'
                });
            }
        }
    }
}

// Request notification permission on page load
if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (result) {
        if (result === "granted") {
            console.log("Notification permission granted.");
        }
    });
}

// Check for reminders every minute
setInterval(checkReminders, 60000); // 60,000ms = 1 minute
